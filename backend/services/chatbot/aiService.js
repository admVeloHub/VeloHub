// AI Service - Integração híbrida com IA para respostas inteligentes
// VERSION: v3.1.1 | DATE: 2026-05-18 | AUTHOR: VeloHub Development Team
//
// Referência (duas entradas; detalhes no Git):
// - v3.1.1: guardrail tripwire — preview truncado da resposta bloqueada com VELOHUB_AI_DEBUG=1
// - v3.1.0: Chat primário — persona velobotChatPersona, stores hardcoded, gpt-5.4-mini, histórico 10, guardrail alucinação
// - v3.0.5: _buildOpenAiResponsesInput — mensagens assistant no histórico com output_text (API /v1/responses rejeita input_text no papel assistant; corrige 400 no 2º turno)

const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../../config');
const { getRefinarRascunhoPersona } = require('./refinarRascunhoPersona');
const { getVelobotChatPersona } = require('./velobotChatPersona');
const {
  getPrimaryVelobotVectorStoreIds,
  getVelobotResponsesModel,
  VELOBOT_RAG_HISTORY_LIMIT
} = require('./velobotRagConstants');
const { checkVelobotHallucinationGuardrail } = require('./velobotGuardrails');

class AIService {
  constructor() {
    this.openai = null;
    this.gemini = null;
    this.openaiModel = "gpt-4o-mini"; // Modelo OpenAI (primário)
    /** Modelo /v1/responses (chat primário VeloBot); override via OPENAI_VELOBOT_RESPONSES_MODEL */
    this.openaiResponsesModel = getVelobotResponsesModel(config.OPENAI_VELOBOT_RESPONSES_MODEL);
    this.geminiModel = "gemini-2.5-pro"; // Modelo Gemini (fallback)
    
    // Cache de status das IAs (TTL 3min - OTIMIZADO)
    this.statusCache = {
      data: null,
      timestamp: null,
      ttl: 3 * 60 * 1000 // 3 minutos em ms (otimizado)
    };
  }

  /**
   * Inicializa o cliente OpenAI apenas quando necessário
   */
  _initializeOpenAI() {
    if (!this.openai && this.isOpenAIConfigured()) {
      this.openai = new OpenAI({
        apiKey: config.OPENAI_API_KEY,
      });
    }
    return this.openai;
  }

  /**
   * Inicializa o cliente Gemini apenas quando necessário
   */
  _initializeGemini() {
    if (!this.gemini && this.isGeminiConfigured()) {
      this.gemini = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    }
    return this.gemini;
  }

  /**
   * Gera resposta inteligente baseada na pergunta e contexto
   * FLUXO: Primária (handshake) → Secundária (fallback) → Resposta padrão
   * @param {string} question - Pergunta do usuário
   * @param {string} context - Contexto da base de conhecimento
   * @param {Array} sessionHistory - Histórico da sessão
   * @param {string} userId - ID do usuário
   * @param {string} email - Email do usuário
   * @param {Object} searchResults - Resultados da busca híbrida (opcional)
   * @param {string} formatType - Tipo de formatação (conversational, telefone, email)
   * @param {string} primaryAI - IA primária definida pelo handshake ('OpenAI' ou 'Gemini')
   * @returns {Promise<Object>} Resposta com provider usado
   */
  async generateResponse(question, context = "", sessionHistory = [], userId = null, email = null, searchResults = null, formatType = 'conversational', primaryAI = 'OpenAI') {
    try {
      console.log('AI Service: Gerando resposta para usuario', userId || 'anonimo', '- Primaria:', primaryAI);
      
      // 1. TENTAR IA PRIMÁRIA (definida pelo handshake)
      if (primaryAI === 'OpenAI' && this.isOpenAIConfigured()) {
        try {
          console.log('AI Service: Tentando OpenAI (primaria) para usuario', userId || 'anonimo');
          let response = null;
          let modelUsed = this.openaiModel;
          if (this.isVelobotVectorStoreConfigured()) {
            try {
              response = await this._generateWithOpenAIVectorStore(
                question,
                sessionHistory,
                formatType,
                userId
              );
              modelUsed = this.openaiResponsesModel;
              console.log('AI Service: OpenAI vector store (Responses) concluiu com sucesso');
            } catch (vsErr) {
              console.warn('AI Service: Vector store / Responses falhou, usando chat com contexto:', vsErr.message);
              response = null;
            }
          }
          if (!response) {
            response = await this._generateWithOpenAI(question, context, sessionHistory, userId, email, searchResults, formatType);
            modelUsed = this.openaiModel;
          }
          return {
            response: response,
            provider: 'OpenAI',
            model: modelUsed,
            success: true
          };
        } catch (openaiError) {
          console.warn('AI Service: OpenAI falhou, tentando Gemini fallback:', openaiError.message);
        }
      } else if (primaryAI === 'Gemini' && this.isGeminiConfigured()) {
        try {
          console.log('AI Service: Tentando Gemini (primaria) para usuario', userId || 'anonimo');
          const response = await this._generateWithGemini(question, context, sessionHistory, userId, email, searchResults, formatType);
          return {
            response: response,
            provider: 'Gemini',
            model: this.geminiModel,
            success: true
          };
        } catch (geminiError) {
          console.warn('AI Service: Gemini falhou, tentando OpenAI fallback:', geminiError.message);
        }
      }

      // 2. FALLBACK PARA IA SECUNDÁRIA
      if (primaryAI === 'OpenAI' && this.isGeminiConfigured()) {
        try {
          console.log('AI Service: Usando Gemini (fallback) para usuario', userId || 'anonimo');
          const response = await this._generateWithGemini(question, context, sessionHistory, userId, email, searchResults, formatType);
          return {
            response: response,
            provider: 'Gemini',
            model: this.geminiModel,
            success: true
          };
        } catch (geminiError) {
          console.error('AI Service: Gemini tambem falhou:', geminiError.message);
        }
      } else if (primaryAI === 'Gemini' && this.isOpenAIConfigured()) {
        try {
          console.log('AI Service: Usando OpenAI (fallback) para usuario', userId || 'anonimo');
          const response = await this._generateWithOpenAI(question, context, sessionHistory, userId, email, searchResults, formatType);
          return {
            response: response,
            provider: 'OpenAI',
            model: this.openaiModel,
            success: true
          };
        } catch (openaiError) {
          console.error('AI Service: OpenAI tambem falhou:', openaiError.message);
        }
      }

      // 3. SE AMBOS FALHARAM
      throw new Error('Nenhuma API de IA disponível');
      
    } catch (error) {
      console.error('AI Service Error:', error.message);
      
      // 4. FALLBACK PARA RESPOSTA PADRÃO
      return {
        response: `Não consegui processar sua pergunta no momento. Pode reformular sua pergunta ou fornecer mais detalhes para que eu possa ajudá-lo melhor?`,
        provider: 'Fallback',
        model: 'none',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Persona conversacional do chat principal (POST /api/chatbot/ask).
   * @returns {string}
   */
  getPersona() {
    return getVelobotChatPersona();
  }

  /**
   * Obtém a persona para formatação atendimento telefônico
   * @returns {string} Persona formatada para atendimento via telefone
   */
  getTelefonePersona() {
    return `# VELOBOT - REFORMULADOR TELEFONE

## IDENTIDADE
- Nome: VeloBot
- Empresa: Velotax
- Função: Você é o ASSISTENTE DE ATENDIMENTO VELOTAX VIA TELEFONE. Sua função é transformar rascunhos internos em comunicações profissionais, empáticas e claras, focadas no atendimento claro e engajado com o cliente, gerando interesse a adesão ao produto.
- Tom: Informal, amigável, direto, COMERCIAL, INTERESSADO.

## COMPORTAMENTO
- Reformule a resposta para o formato de atendimento ao cliente via TELEFONE.
- Use linguagem SIMPLES E AMIGAVEL, VISANDO GERAR INTERESSE E ADESÃO AO PRODUTO.
- Seja conciso e direto
- Use quebras de linha para facilitar leitura
- NÃO USAR jargões técnicos complexos
- Não use expressões genéricas como "Entendi que você quer saber sobre o produto X", "Entendi que você quer falar sobre o serviço Y", etc.


TRAVA DE SEGURANÇA (PRODUTOS E SERVIÇOS)
Você só pode adequar respostas relacionadas aos produtos oficiais do Velotax.
1. NATUREZA DO VELOTAX: O Velotax ainda não é um banco, mas oferece uma conta digital específica para clientes que solicitam a antecipação.
2. FUNCIONALIDADES DA CONTA:
   - É possível receber e transferir valores via Pix.
   - O Pix pode ser realizado para contas de terceiros.
   - A chave de recebimento dessa conta é obrigatoriamente e exclusivamente o CPF do titular.
- PRODUTOS PERMITIDOS: [Empréstimo Pessoal, Antecipação do Imposto de Renda, Seguro Celular, Seguro Pessoal].
- PRODUTOS PROIBIDOS: Nunca mencione ou confirme suporte para produtos que não oferecemos (ex: Compra/venda direta de ativos, Cartão de Débito, Investimentos em Bolsa, Antecipação de FGTS, Antecipação de salário, Antecipação de conta de luz, Antecipação do décimo terceiro, etc).`;
  }

  /**
   * Obtém a persona para formatação E-mail formal
   * @returns {string} Persona formatada para E-mail
   */
  getEmailPersona() {
    return `# VELOBOT - REFORMULADOR E-MAIL

## IDENTIDADE
- Nome: VeloBot
- Empresa: Velotax
- Função: Você é o "Especialista em Sucesso do Cliente" e "Guardião da Marca" do Velotax. Sua função é transformar rascunhos internos em comunicações profissionais, empáticas e claras, focadas no atendimento B2C (e-mail e ticket).
- Tom: Empático, Profissional, claro, cortês, comercial.

TRAVA DE SEGURANÇA (PRODUTOS E SERVIÇOS)
Você só pode formalizar respostas relacionadas aos produtos oficiais do Velotax.
1. NATUREZA DO VELOTAX: O Velotax ainda não é um banco, mas oferece uma conta digital específica para clientes que solicitam a antecipação.
2. FUNCIONALIDADES DA CONTA:
   - É possível receber e transferir valores via Pix.
   - O Pix pode ser realizado para contas de terceiros.
   - A chave de recebimento dessa conta é obrigatoriamente e exclusivamente o CPF do titular.
- PRODUTOS PERMITIDOS: [Empréstimo Pessoal, Antecipação do Imposto de Renda, Seguro Celular, Seguro Pessoal].
- PRODUTOS PROIBIDOS: Nunca mencione ou confirme suporte para produtos que não oferecemos (ex: Compra/venda direta de ativos, Cartão de Débito, Investimentos em Bolsa, Antecipação de FGTS, Antecipação de salário, Antecipação de conta de luz, Antecipação do décimo terceiro, etc).

## COMPORTAMENTO
- Reformule a resposta para o formato de e-mail de atendimento ao cliente.
- Use linguagem simples, profissional e cortês
- Estruture a informação de forma clara e organizada
- Seja detalhado mas objetivo
- Mantenha tom respeitoso e profissional
- Obtenha [Nome do Operador] no campo do payload com essa informação: {nome do operador}
- obtenha [inteligencia] no campo do payload com essa informação: {inteligencia}
Toda resposta DEVE seguir rigorosamente este template:

Olá, [Nome do Cliente], tudo bem?

[Espaçamento entre linhas e parágrafos de 1,5]

Eu sou [Nome do Operador] do Atendimento Velotax.

{Desenvolvimento da resposta formalizada - baseada APENAS na [inteligencia] fornecida}

Atenciosamente,

[Nome do Operador]`;
  }

  /**
   * Obtém a persona baseada no tipo de formatação
   * @param {string} formatType - Tipo de formatação (conversational, telefone, email)
   * @returns {string} Persona apropriada
   */
  _getPersonaByFormat(formatType) {
    console.log('Persona Debug: formatType recebido:', formatType);

    switch (formatType) {
      case 'telefone':
        console.log('Persona Debug: Selecionando persona atendimento telefonico');
        return this.getTelefonePersona();
      case 'email':
        console.log('Persona Debug: Selecionando persona E-mail');
        return this.getEmailPersona();
      case 'conversational':
      default:
        console.log('Persona Debug: Selecionando persona conversacional (padrao)');
        return this.getPersona();
    }
  }

  /**
   * Cria prompt otimizado para análise eficiente
   * @param {string} question - Pergunta do usuário
   * @param {Array} filteredData - Dados já filtrados por keywords
   * @param {Array} sessionHistory - Histórico da sessão
   * @returns {string} Prompt otimizado
   */
  createOptimizedPrompt(question, filteredData, sessionHistory = []) {
    // 1. PERSONA E REGRAS (fixo)
    const persona = this.getPersona();
    
    // 2. PERGUNTA DO USUÁRIO
    const userQuestion = 'Pergunta: "' + question + '"';
    
    // 3. PALAVRAS-CHAVE E SINÔNIMOS RELEVANTES (apenas os relevantes)
    const relevantKeywords = filteredData.map((item, index) => {
      return (index + 1) + '. ' + item.pergunta + '\n   Palavras-chave: ' + item.palavrasChave + '\n   Sinonimos: ' + item.sinonimos;
    }).join('\n\n');

    // 4. CONTEXTO DA SESSÃO (se houver)
    const context = sessionHistory.length > 0
      ? '\n\nContexto da conversa:\n' + sessionHistory.slice(-3).map(msg => '- ' + msg.role + ': ' + msg.content).join('\n')
      : '';

    return persona + '\n\n' + userQuestion + '\n\nDados relevantes:\n' + relevantKeywords + context + '\n\n## TAREFA\nAnalise a pergunta do usuario e identifique qual(is) opcao(oes) se aplica(m):\n\n**CRITERIOS:**\n- Se houver 1 opcao que responde bem a pergunta: retorne apenas esse numero\n- Se houver multiplas opcoes que podem responder a pergunta: retorne todos os numeros separados por virgula\n- Se NENHUMA opcao se aplica: sugira a que considerou mais apoximada ou relevante.\n\n**IMPORTANTE:** Seja pratico. Se a pergunta pode ser respondida por uma das opcoes, inclua-a.\n\n## RESPOSTA:';
  }

  /**
   * Analisa pergunta do usuário contra base de dados usando IA (OTIMIZADO)
   * @param {string} question - Pergunta do usuário
   * @param {Array} filteredData - Dados já filtrados por keywords
   * @param {Array} sessionHistory - Histórico da sessão
   * @param {string} primaryAI - IA primária definida pelo handshake
   * @returns {Promise<Object>} Análise da IA com opções relevantes
   */
  async analyzeQuestionWithAI(question, filteredData, sessionHistory = [], primaryAI = 'OpenAI') {
    try {
      console.log('AI Analyzer: Analisando pergunta:', question);
      console.log('AI Analyzer:', filteredData.length, 'perguntas relevantes para analise');
      
      // Criar prompt otimizado
      const analysisPrompt = this.createOptimizedPrompt(question, filteredData, sessionHistory);
      
      console.log('AI Analyzer: Tamanho do prompt:', analysisPrompt.length, 'caracteres');

      let response = '';
      let aiProvider = '';

      console.log('AI Analyzer: Usando IA primaria do handshake:', primaryAI);

      // 1. TENTAR IA PRIMÁRIA (definida pelo handshake)
      if (primaryAI === 'OpenAI' && this.isOpenAIConfigured()) {
        try {
          console.log('AI Analyzer: Tentando OpenAI (primaria)...');
          const openai = this._initializeOpenAI();
          
          const completion = await openai.chat.completions.create({
            model: this.openaiModel,
            messages: [{ role: 'user', content: analysisPrompt }],
            max_tokens: 100,
            temperature: 0.1
          });
          
          response = completion.choices[0].message.content.trim();
          aiProvider = 'OpenAI';
          console.log('AI Analyzer: OpenAI respondeu com sucesso');
        } catch (openaiError) {
          console.error('AI Analyzer: OpenAI falhou:', openaiError.message);
        }
      } else if (primaryAI === 'Gemini' && this.isGeminiConfigured()) {
        try {
          console.log('AI Analyzer: Tentando Gemini (primaria)...');
          const gemini = this._initializeGemini();
          const model = gemini.getGenerativeModel({ model: this.geminiModel });
          
          const result = await model.generateContent(analysisPrompt);
          response = result.response.text().trim();
          aiProvider = 'Gemini';
          console.log('AI Analyzer: Gemini respondeu com sucesso');
        } catch (geminiError) {
          console.error('AI Analyzer: Gemini falhou:', geminiError.message);
        }
      }

      // 2. FALLBACK PARA IA SECUNDÁRIA
      if (!response && primaryAI === 'OpenAI' && this.isGeminiConfigured()) {
        try {
          console.log('AI Analyzer: Tentando Gemini como fallback...');
          const gemini = this._initializeGemini();
          const model = gemini.getGenerativeModel({ model: this.geminiModel });
          
          const result = await model.generateContent(analysisPrompt);
          response = result.response.text().trim();
          aiProvider = 'Gemini';
          console.log('AI Analyzer: Gemini respondeu com sucesso (fallback)');
        } catch (geminiError) {
          console.error('AI Analyzer: Gemini tambem falhou:', geminiError.message);
        }
      } else if (!response && primaryAI === 'Gemini' && this.isOpenAIConfigured()) {
        try {
          console.log('AI Analyzer: Tentando OpenAI como fallback...');
          const openai = this._initializeOpenAI();
          
          const completion = await openai.chat.completions.create({
            model: this.openaiModel,
            messages: [{ role: 'user', content: analysisPrompt }],
            max_tokens: 100,
            temperature: 0.1
          });
          
          response = completion.choices[0].message.content.trim();
          aiProvider = 'OpenAI';
          console.log('AI Analyzer: OpenAI respondeu com sucesso (fallback)');
        } catch (openaiError) {
          console.error('AI Analyzer: OpenAI tambem falhou:', openaiError.message);
        }
      }

      // 3. SE AMBOS FALHARAM - USAR PESQUISA SIMPLES POR FILTRO NO MONGO COMO FALLBACK
      if (!response) {
        console.log('AI Analyzer: Ambas IAs falharam - usando pesquisa simples por filtro no MongoDB como fallback');
        // Retornar todas as opções filtradas para pesquisa simples
        return { 
          relevantOptions: filteredData, 
          needsClarification: filteredData.length > 1, 
          hasData: true,
          fallback: 'mongo_filter'
        };
      }
      
      console.log('AI Analyzer: Resposta da IA:', response);
      console.log('AI Analyzer: Tamanho da resposta:', response.length, 'caracteres');
      
      // Verificar se a IA retornou "NENHUM" (sem matches) - agora menos provável
      if (response.toUpperCase().includes('NENHUM') || response.trim() === '') {
        console.log('AI Analyzer: IA retornou NENHUM - usando primeira opcao como fallback');
        // Em vez de retornar vazio, usar a primeira opção como fallback
        return { 
          relevantOptions: [filteredData[0]], 
          needsClarification: false, 
          hasData: true,
          fallback: true 
        };
      }

      // Extrair números da resposta
      const relevantIndices = response.match(/\d+/g);
      if (!relevantIndices || relevantIndices.length === 0) {
        console.log('AI Analyzer: Nenhum numero encontrado - usando primeira opcao como fallback');
        // Em vez de retornar vazio, usar a primeira opção como fallback
        return { 
          relevantOptions: [filteredData[0]], 
          needsClarification: false, 
          hasData: true,
          fallback: true 
        };
      }

      // Converter para índices reais (subtrair 1)
      const indices = relevantIndices.map(num => parseInt(num) - 1).filter(idx => idx >= 0 && idx < filteredData.length);
      
      console.log('AI Analyzer:', indices.length, 'opcoes relevantes identificadas:', indices.join(', '));
      
      // Se apenas 1 opção relevante, não precisa de esclarecimento
      if (indices.length === 1) {
        return {
          relevantOptions: [filteredData[indices[0]]],
          needsClarification: false,
          bestMatch: filteredData[indices[0]],
          hasData: true
        };
      }
      
      // Múltiplas opções = precisa de esclarecimento
      const relevantOptions = indices.map(idx => filteredData[idx]);
      
      return {
        relevantOptions: relevantOptions,
        needsClarification: true,
        bestMatch: null,
        hasData: true
      };

    } catch (error) {
      console.error('AI Analyzer Error:', error.message);
      return { relevantOptions: [], needsClarification: false, error: error.message, hasData: true };
    }
  }

  /**
   * Gera resposta usando Gemini (IA PRIMÁRIA)
   */
  async _generateWithGemini(question, context, sessionHistory, userId, email, searchResults = null, formatType = 'conversational') {
    console.log('Gemini Debug: formatType recebido:', formatType);
    
    const gemini = this._initializeGemini();
    if (!gemini) {
      throw new Error('Falha ao inicializar cliente Gemini');
    }

    const model = gemini.getGenerativeModel({ model: this.geminiModel });
    
    // Construir prompt completo (system + user) otimizado para Gemini
    const systemPrompt = this._getPersonaByFormat(formatType);
    console.log('Gemini Debug: Persona selecionada para formatType', formatType);

    const userPrompt = this.buildOptimizedPrompt(question, context, sessionHistory, searchResults);
    
    // Combinar system + user prompt para Gemini
    const fullPrompt = systemPrompt + '\n\n' + userPrompt;
    
    console.log('Gemini: Processando pergunta para usuario', userId || 'anonimo');
    
    const result = await model.generateContent(fullPrompt);
    const response = result.response.text();
    
    console.log('Gemini: Resposta gerada com sucesso', response.length, 'caracteres');
    
    return response;
  }

  /**
   * IDs das vector stores do chat primário (hardcoded).
   * @returns {string[]}
   */
  _resolvePrimaryRagVectorStoreIds() {
    return getPrimaryVelobotVectorStoreIds();
  }

  /**
   * IDs para file_search (chat primário e generateResponse com vector store).
   * @returns {string[]}
   */
  _getVelobotVectorStoreIds() {
    return getPrimaryVelobotVectorStoreIds();
  }

  /**
   * Log estruturado opcional: defina VELOHUB_AI_DEBUG=1 no ambiente.
   * @param {string} label
   * @param {Object} payload
   */
  _aiDebug(label, payload) {
    if (String(process.env.VELOHUB_AI_DEBUG || '').trim() !== '1') return;
    try {
      console.log('[AI DEBUG]', label, JSON.stringify(payload, null, 0));
    } catch (_) {
      console.log('[AI DEBUG]', label, payload);
    }
  }

  /**
   * Modo primário VeloBot: OpenAI configurada + stores fixas em código.
   */
  isPrimaryVelobotRagConfigured() {
    const ok = this.isOpenAIConfigured();
    this._aiDebug('isPrimaryVelobotRagConfigured', {
      ok,
      storeCount: getPrimaryVelobotVectorStoreIds().length,
      openAI: this.isOpenAIConfigured()
    });
    return ok;
  }

  /**
   * Resposta exclusiva do modo primário (sem fallback interno para chat.completions/Gemini).
   * @param {string} question
   * @param {Array} sessionHistory
   * @param {string|null} userId
   * @param {string} formatType
   * @returns {Promise<{success:boolean,response:string|null,model:string|null,provider:string,error?:string}>}
   */
  async generatePrimaryVelobotVectorResponse(
    question,
    sessionHistory = [],
    userId = null,
    formatType = 'conversational'
  ) {
    const pair = this._resolvePrimaryRagVectorStoreIds();
    if (!this.isOpenAIConfigured()) {
      this._aiDebug('generatePrimaryVelobotVectorResponse:skip', {
        reason: 'openai_nao_configurado'
      });
      return {
        success: false,
        response: null,
        model: null,
        provider: 'OpenAI',
        error: 'RAG primario VeloBot nao configurado (OPENAI_API_KEY ausente)'
      };
    }
    try {
      const text = await this._generatePrimaryOpenAiFileSearchResponse(
        question,
        sessionHistory,
        formatType,
        userId,
        pair
      );

      const guardrail = await checkVelobotHallucinationGuardrail(text);
      if (guardrail.tripwire) {
        this._aiDebug('guardrail_hallucination_blocked', {
          failedStoreId: guardrail.failedStoreId || null,
          failedStoreLabel: guardrail.failedStoreLabel || null,
          reasoning: guardrail.reasoning || null,
          responseLength: text.length,
          responsePreview:
            String(process.env.VELOHUB_AI_DEBUG || '').trim() === '1'
              ? text.length > 500
                ? text.slice(0, 500) + `… (+${text.length - 500} chars)`
                : text
              : undefined
        });
        return {
          success: false,
          response: null,
          model: this.openaiResponsesModel,
          provider: 'OpenAI',
          error: 'guardrail_hallucination',
          guardrailFailedStoreId: guardrail.failedStoreId || null,
          guardrailReason: guardrail.reasoning || null
        };
      }

      return {
        success: true,
        response: text,
        model: this.openaiResponsesModel,
        provider: 'OpenAI'
      };
    } catch (err) {
      console.warn('AI Service: generatePrimaryVelobotVectorResponse falhou:', err.message);
      return {
        success: false,
        response: null,
        model: null,
        provider: 'OpenAI',
        error: err.message
      };
    }
  }
  /**
   * VeloBot pode usar Responses API + file_search quando há API key e ao menos um vector store.
   */
  isVelobotVectorStoreConfigured() {
    return this.isOpenAIConfigured();
  }

  /**
   * Monta itens de entrada da API /v1/responses (mensagens user/assistant).
   * User: content com type input_text; assistant/bot no histórico: output_text (exigência da API).
   * Evita duplicar a pergunta atual se já existir como última mensagem user no histórico.
   * @param {Array} sessionHistory
   * @param {string} question
   * @returns {Array<Object>}
   */
  _buildOpenAiResponsesInput(sessionHistory, question) {
    const input = [];
    const hist = Array.isArray(sessionHistory) ? sessionHistory.slice(-VELOBOT_RAG_HISTORY_LIMIT) : [];
    const q = String(question || '').trim();
    for (const h of hist) {
      const r = String(h.role || '').toLowerCase();
      const role = r === 'assistant' || r === 'bot' ? 'assistant' : 'user';
      const content = typeof h.content === 'string' ? h.content : '';
      if (!content.trim()) continue;
      const text = content.trim();
      input.push({
        role,
        content: [
          {
            type: role === 'assistant' ? 'output_text' : 'input_text',
            text
          }
        ]
      });
    }
    const last = input[input.length - 1];
    if (
      last &&
      last.role === 'user' &&
      Array.isArray(last.content) &&
      last.content[0] &&
      last.content[0].type === 'input_text' &&
      String(last.content[0].text || '').trim() === q
    ) {
      return input;
    }
    input.push({
      role: 'user',
      content: [{ type: 'input_text', text: q }]
    });
    return input;
  }

  /**
   * Resposta primária: uma chamada Responses + file_search com instruções para store pública vs interna.
   * @param {string} question
   * @param {Array} sessionHistory
   * @param {string} formatType
   * @param {string|null} userId
   * @param {string[]} vectorStoreIds
   * @returns {Promise<string>}
   */
  async _generatePrimaryOpenAiFileSearchResponse(
    question,
    sessionHistory,
    formatType,
    userId,
    vectorStoreIds
  ) {
    const basePersona = this._getPersonaByFormat(formatType);
    const fontesBlock =
      '\n\n## file_search\n' +
      '- Consulte as duas bases indexadas antes de responder.\n' +
      '- Não invente fatos além do retorno da busca.\n';
    const instructions = basePersona + fontesBlock;

    const input = this._buildOpenAiResponsesInput(sessionHistory, question);
    const payload = {
      model: this.openaiResponsesModel,
      instructions,
      input,
      tools: [
        {
          type: 'file_search',
          vector_store_ids: vectorStoreIds,
          max_num_results: 15
        }
      ],
      tool_choice: 'auto',
      temperature: 0.1,
      max_output_tokens: 512
    };
    if (userId && String(userId).trim()) {
      payload.safety_identifier = String(userId).trim().slice(0, 64);
    }

    console.log(
      'OpenAI Responses (file_search primario): usuario',
      userId || 'anonimo',
      '| vector stores:',
      vectorStoreIds.length
    );
    const data = await this._postOpenAiResponses(payload);
    const text = this._extractTextFromOpenAiResponsesBody(data);
    if (!text || !String(text).trim()) {
      throw new Error('OpenAI Responses retornou texto vazio');
    }
    console.log('OpenAI Responses primario: resposta gerada', text.length, 'caracteres');
    return text.trim();
  }

  /**
   * Extrai texto final do corpo JSON retornado por POST /v1/responses.
   * @param {Object} data
   * @returns {string}
   */
  _extractTextFromOpenAiResponsesBody(data) {
    if (!data) return '';
    if (typeof data.output_text === 'string' && data.output_text) {
      return data.output_text;
    }
    const out = data.output;
    if (!Array.isArray(out)) return '';
    let acc = '';
    for (const item of out) {
      if (item.type === 'message' && item.role === 'assistant' && Array.isArray(item.content)) {
        for (const c of item.content) {
          if (c && c.type === 'output_text' && c.text) acc += c.text;
        }
      }
    }
    return acc;
  }

  /**
   * Chama OpenAI Responses API (para file_search / vector stores).
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  async _postOpenAiResponses(payload) {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + config.OPENAI_API_KEY
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        (data && data.error && data.error.message) || res.statusText || 'Erro OpenAI Responses';
      this._aiDebug('OpenAI Responses HTTP erro', { status: res.status, bodySnippet: JSON.stringify(data).slice(0, 500) });
      throw new Error(msg + ' (' + res.status + ')');
    }
    return data;
  }

  /**
   * Resposta VeloBot via vector store (file_search). Não utiliza o bloco de contexto Mongo montado no prompt legado.
   * @param {string} question
   * @param {Array} sessionHistory
   * @param {string} formatType
   * @param {string|null} userId
   * @returns {Promise<string>}
   */
  async _generateWithOpenAIVectorStore(question, sessionHistory, formatType, userId) {
    if (!this.isVelobotVectorStoreConfigured()) {
      throw new Error('Vector store VeloBot nao configurado');
    }
    const vectorStoreIds = this._getVelobotVectorStoreIds();
    const basePersona = this._getPersonaByFormat(formatType);
    const instructions =
      basePersona +
      '\n\n## FONTE VETORIAL (file_search)\n' +
      '- A base de fatos vem dos arquivos indexados na vector store da OpenAI.\n' +
      '- Use a busca em arquivos quando precisar de prazos, regras, produtos ou processos.\n' +
      '- Nao invente: se a busca nao trouxer suporte, diga que nao encontrou na base disponivel.\n';

    const input = this._buildOpenAiResponsesInput(sessionHistory, question);
    const payload = {
      model: this.openaiResponsesModel,
      instructions,
      input,
      tools: [
        {
          type: 'file_search',
          vector_store_ids: vectorStoreIds,
          max_num_results: 15
        }
      ],
      tool_choice: 'auto',
      temperature: 0.1,
      max_output_tokens: 512
    };
    if (userId && String(userId).trim()) {
      payload.safety_identifier = String(userId).trim().slice(0, 64);
    }

    console.log(
      'OpenAI Responses (file_search): usuario',
      userId || 'anonimo',
      '| vector stores:',
      vectorStoreIds.length
    );
    const data = await this._postOpenAiResponses(payload);
    const text = this._extractTextFromOpenAiResponsesBody(data);
    if (!text || !String(text).trim()) {
      throw new Error('OpenAI Responses retornou texto vazio');
    }
    console.log('OpenAI Responses: resposta gerada', text.length, 'caracteres');
    return text.trim();
  }

  /**
   * Gera resposta usando OpenAI (IA FALLBACK)
   */
  async _generateWithOpenAI(question, context, sessionHistory, userId, email, searchResults = null, formatType = 'conversational') {
    const openai = this._initializeOpenAI();
    if (!openai) {
      throw new Error('Falha ao inicializar cliente OpenAI');
    }

    // Construir prompt otimizado (baseado no chatbot Vercel)
    const prompt = this.buildOptimizedPrompt(question, context, sessionHistory, searchResults);
    
    console.log('OpenAI: Processando pergunta para usuario', userId || 'anonimo');
    
    const completion = await openai.chat.completions.create({
      model: this.openaiModel,
      messages: [
        {
          role: "system",
          content: this._getPersonaByFormat(formatType)
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1, // Mais determinístico
      max_tokens: 512, // Respostas mais concisas
      top_p: 0.8,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    });

    const response = completion.choices[0].message.content;
    
    console.log('OpenAI: Resposta gerada com sucesso', response.length, 'caracteres');
    
    return response;
  }

  /**
   * Constrói contexto estruturado com informações organizadas
   * @param {Object} searchResults - Resultados da busca híbrida
   * @param {Array} sessionHistory - Histórico da sessão
   * @returns {string} Contexto estruturado
   */
  buildStructuredContext(searchResults, sessionHistory) {
    let context = '## CONTEXTO DA CONSULTA\n\n';

    if (searchResults && searchResults.botPergunta) {
      context += '### INFORMACAO PRINCIPAL\n**Pergunta:** ' + searchResults.botPergunta.pergunta +
        '\n**Resposta:** ' + searchResults.botPergunta.resposta +
        '\n**Relevancia:** ' + (searchResults.botPergunta.relevanceScore || 'N/A') + '/10\n**Fonte:** Bot_perguntas (MongoDB)\n\n';
    }

    if (searchResults && searchResults.articles && searchResults.articles.length > 0) {
      context += '### ARTIGOS RELACIONADOS\n';
      searchResults.articles.forEach((article, index) => {
        context += (index + 1) + '. **' + article.title + '**\n   - Relevancia: ' + (article.relevanceScore || 'N/A') + '/10\n   - Conteudo: ' + article.content.substring(0, 150) + '...\n\n';
      });
    }

    if (sessionHistory && sessionHistory.length > 0) {
      context += '### HISTORICO DA CONVERSA\n';
      sessionHistory.slice(-3).forEach(h => {
        context += '- ' + h.role + ': ' + h.content + '\n';
      });
      context += '\n';
    }

    return context;
  }

  /**
   * Constrói o prompt otimizado com contexto e histórico
   * @param {string} question - Pergunta atual
   * @param {string} context - Contexto da base de conhecimento (legado)
   * @param {Array} sessionHistory - Histórico da sessão
   * @param {Object} searchResults - Resultados da busca híbrida (novo)
   * @returns {string} Prompt formatado
   */
  buildOptimizedPrompt(question, context, sessionHistory, searchResults = null) {
    const structuredContext = searchResults ?
      this.buildStructuredContext(searchResults, sessionHistory) :
      '### CONTEXTO DA BASE DE CONHECIMENTO\n' + (context || 'Nenhum contexto especifico encontrado.') +
      '\n\n### HISTORICO DE CONVERSA\n' + (sessionHistory.length > 0 ? sessionHistory.map(h => h.role + ': ' + h.content).join('\n') : 'Primeira pergunta da sessao.');

    return structuredContext + '\n## PERGUNTA ATUAL\n**Usuario:** ' + question +
      '\n\n## INSTRUCOES\n- Use APENAS as informacoes do contexto acima\n- Se a pergunta for sobre credito, foco em prazos e processos\n- Se for sobre documentos, liste exatamente o que e necessario\n- Se for sobre prazos, seja especifico com datas e tempos\n- Se nao houver informacao suficiente, diga claramente\n\n## RESPOSTA:';
  }

  /**
   * Valida a qualidade da resposta gerada pela IA
   * @param {string} response - Resposta da IA
   * @param {string} question - Pergunta original
   * @returns {Object} Resultado da validação
   */
  validateResponse(response, question) {
    // Verificar se a resposta é muito genérica
    const genericResponses = [
      "não encontrei essa informação",
      "não tenho essa informação",
      "não posso ajudar com isso",
      "não sei",
      "não consigo"
    ];
    
    const isGeneric = genericResponses.some(generic => 
      response.toLowerCase().includes(generic)
    );
    
    if (isGeneric && response.length < 50) {
      return {
        valid: false,
        reason: "Resposta muito genérica",
        suggestion: "Buscar em outras fontes ou reformular pergunta"
      };
    }
    
    // Verificar se a resposta é muito longa
    if (response.length > 500) {
      return {
        valid: false,
        reason: "Resposta muito longa",
        suggestion: "Resumir para máximo 200 palavras"
      };
    }
    
    return { valid: true };
  }

  /**
   * Constrói o prompt com contexto e histórico (método legado)
   * @param {string} question - Pergunta atual
   * @param {string} context - Contexto da base de conhecimento
   * @param {Array} sessionHistory - Histórico da sessão
   * @returns {string} Prompt formatado
   */
  buildPrompt(question, context, sessionHistory) {
    return this.buildOptimizedPrompt(question, context, sessionHistory);
  }

  /**
   * Verifica se a API OpenAI está configurada corretamente
   * @returns {boolean} Status da configuração
   */
  isOpenAIConfigured() {
    const configured = !!config.OPENAI_API_KEY && config.OPENAI_API_KEY !== 'your_openai_api_key_here';
    if (!configured) {
      console.warn('AI Service: OpenAI nao configurado - OPENAI_API_KEY ausente ou invalida');
    }
    return configured;
  }

  /**
   * Verifica se a API Gemini está configurada corretamente
   * @returns {boolean} Status da configuração
   */
  isGeminiConfigured() {
    const configured = !!config.GEMINI_API_KEY && config.GEMINI_API_KEY !== 'your_gemini_api_key_here';
    if (!configured) {
      console.warn('AI Service: Gemini nao configurado - GEMINI_API_KEY ausente ou invalida');
    }
    return configured;
  }

  /**
   * Verifica se alguma API está configurada
   * @returns {boolean} Status da configuração
   */
  isConfigured() {
    return this.isOpenAIConfigured() || this.isGeminiConfigured();
  }

  /**
   * Obtém status das configurações de IA
   * @returns {Object} Status das configurações
   */
  getConfigurationStatus() {
    const vsIds = this._getVelobotVectorStoreIds();
    return {
      gemini: {
        configured: this.isGeminiConfigured(),
        model: this.geminiModel,
        priority: 'primary'
      },
      openai: {
        configured: this.isOpenAIConfigured(),
        model: this.openaiModel,
        priority: 'fallback',
        velobotVectorStores: {
          configured: vsIds.length > 0,
          count: vsIds.length,
          responsesModel: this.openaiResponsesModel,
          primaryRagConfigured: this.isPrimaryVelobotRagConfigured()
        }
      },
      anyAvailable: this.isConfigured()
    };
  }

  /**
   * Verifica se o cache de status ainda é válido
   * @returns {boolean} Status do cache
   */
  _isCacheValid() {
    // Cache inválido se não há dados ou timestamp
    if (!this.statusCache.data || !this.statusCache.timestamp) {
      console.log('AI Service: Cache invalido - dados ou timestamp ausentes');
      return false;
    }
    
    // Verificar se cache expirou
    const now = Date.now();
    const cacheAge = now - this.statusCache.timestamp;
    const isValid = cacheAge < this.statusCache.ttl;
    
    if (!isValid) {
      console.log('AI Service: Cache expirado - idade:', Math.round(cacheAge / 1000), 's, TTL:', this.statusCache.ttl / 1000, 's');
    }
    
    return isValid;
  }

  /**
   * Ping HTTP para OpenAI (OTIMIZADO)
   * @returns {Promise<boolean>} Status da conexão
   */
  async _pingOpenAI() {
    if (!this.isOpenAIConfigured()) return false;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
      
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + config.OPENAI_API_KEY,
          'User-Agent': 'VeloHub-Bot/1.0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      try {
        await response.text();
      } catch (_) {
        /* ignorar */
      }
      const isAvailable = response.ok;
      
      if (isAvailable) {
        console.log('OpenAI: Ping HTTP bem-sucedido');
      } else {
        console.warn('OpenAI: Ping HTTP falhou - Status:', response.status);
      }
      
      return isAvailable;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('OpenAI: Ping HTTP timeout (2s)');
      } else {
        console.warn('OpenAI: Ping HTTP failed:', error.message);
      }
      return false;
    }
  }

  /**
   * Ping HTTP para Gemini (OTIMIZADO).
   * A API generativelanguage.googleapis.com não trata HEAD em /v1/models como sucesso (404); usar GET leve.
   * @returns {Promise<boolean>} Status da conexão
   */
  async _pingGemini() {
    if (!this.isGeminiConfigured()) return false;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
      
      const url =
        'https://generativelanguage.googleapis.com/v1/models?pageSize=1';
      const response = await fetch(url, {
        method: 'GET',
        headers: { 
          'x-goog-api-key': config.GEMINI_API_KEY,
          'User-Agent': 'VeloHub-Bot/1.0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      try {
        await response.text();
      } catch (_) {
        /* ignorar falha ao drenar corpo */
      }
      const isAvailable = response.ok;
      
      if (isAvailable) {
        console.log('Gemini: Ping HTTP bem-sucedido');
      } else {
        console.warn('Gemini: Ping HTTP falhou - Status:', response.status);
      }
      
      return isAvailable;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Gemini: Ping HTTP timeout (2s)');
      } else {
        console.warn('Gemini: Ping HTTP failed:', error.message);
      }
      return false;
    }
  }

  /**
   * Teste inteligente de conexão com APIs de IA (OTIMIZADO)
   * @returns {Promise<Object>} Status das conexões
   */
  async testConnectionIntelligent() {
    // Verificar cache primeiro (TTL 3min)
    if (this._isCacheValid()) {
      console.log('AI Service: Usando cache de status das IAs (TTL 3min)');
      return this.statusCache.data;
    }
    
    console.log('AI Service: Testando conexoes das IAs (ping HTTP inteligente)');
    const startTime = Date.now();
    
    const results = {
      openai: { available: false, model: this.openaiModel, priority: 'primary' },
      gemini: { available: false, model: this.geminiModel, priority: 'fallback' },
      anyAvailable: false
    };

    // Teste PARALELO com ping HTTP (OTIMIZADO)
    try {
      const [openaiResult, geminiResult] = await Promise.allSettled([
        this._pingOpenAI(),
        this._pingGemini()
      ]);

      // Processar resultados
      results.openai.available = openaiResult.status === 'fulfilled' && openaiResult.value;
      results.gemini.available = geminiResult.status === 'fulfilled' && geminiResult.value;
      results.anyAvailable = results.openai.available || results.gemini.available;
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log('AI Service: Handshake inteligente concluido em', duration, 'ms');
      
    } catch (error) {
      console.error('AI Service: Erro no handshake inteligente:', error.message);
    }
    
    // Atualizar cache (TTL 3min)
    this.statusCache.data = results;
    this.statusCache.timestamp = Date.now();
    
    // Logs assertivos sobre o resultado
    if (results.anyAvailable) {
      const primaryAI = results.openai.available ? 'OpenAI' : 'Gemini';
      const fallbackAI = results.openai.available && results.gemini.available ? 'Gemini' : 
                        results.gemini.available && results.openai.available ? 'OpenAI' : null;
      
      console.log('AI Service: Cache atualizado (TTL 3min) - Primaria:', primaryAI, fallbackAI ? ', Fallback: ' + fallbackAI : '');
    } else {
      console.error('AI Service: NENHUMA API DE IA DISPONIVEL - Verificar configuracao das chaves');
      console.error('AI Service: OpenAI configurado:', this.isOpenAIConfigured());
      console.error('AI Service: Gemini configurado:', this.isGeminiConfigured());
    }

    return results;
  }

  /**
   * Testa a conexão com as APIs de IA (MÉTODO LEGADO - MANTIDO PARA COMPATIBILIDADE)
   * @returns {Promise<Object>} Status das conexões
   */
  async testConnection() {
    // Verificar cache primeiro
    if (this._isCacheValid()) {
      console.log('AI Service: Usando cache de status das IAs');
      return this.statusCache.data;
    }
    
    console.log('AI Service: Testando conexoes das IAs (cache expirado ou inexistente)');
    const results = {
      openai: { available: false, model: this.openaiModel, priority: 'primary' },
      gemini: { available: false, model: this.geminiModel, priority: 'fallback' },
      anyAvailable: false
    };

    // Teste OpenAI (primário)
    if (this.isOpenAIConfigured()) {
      try {
        const openai = this._initializeOpenAI();
        if (openai) {
          const completion = await openai.chat.completions.create({
            model: this.openaiModel,
            messages: [{ role: "user", content: "Teste de conexão" }],
            max_tokens: 10,
          });
          results.openai.available = true;
          console.log('OpenAI: Conexao testada com sucesso');
        }
      } catch (error) {
        console.error('OpenAI: Erro no teste de conexao:', error.message);
      }
    }

    // Teste Gemini (fallback)
    if (this.isGeminiConfigured()) {
      try {
        const gemini = this._initializeGemini();
        if (gemini) {
          const model = gemini.getGenerativeModel({ model: this.geminiModel });
          const result = await model.generateContent("Teste de conexão");
          results.gemini.available = true;
          console.log('Gemini: Conexao testada com sucesso');
        }
      } catch (error) {
        console.error('Gemini: Erro no teste de conexao:', error.message);
      }
    }

    results.anyAvailable = results.gemini.available || results.openai.available;
    
    // Atualizar cache
    this.statusCache.data = results;
    this.statusCache.timestamp = Date.now();
    
    // Logs assertivos sobre o resultado
    if (results.anyAvailable) {
      const primaryAI = results.openai.available ? 'OpenAI' : 'Gemini';
      const fallbackAI = results.openai.available && results.gemini.available ? 'Gemini' : 
                        results.gemini.available && results.openai.available ? 'OpenAI' : null;
      
      console.log('AI Service: Cache atualizado - Primaria:', primaryAI, fallbackAI ? ', Fallback: ' + fallbackAI : '');
    } else {
      console.error('AI Service: NENHUMA API DE IA DISPONIVEL - Verificar configuracao das chaves');
      console.error('AI Service: OpenAI configurado:', this.isOpenAIConfigured());
      console.error('AI Service: Gemini configurado:', this.isGeminiConfigured());
    }

    return results;
  }

  /**
   * VeloBot «Refinar Rascunho»: somente Gemini, persona dedicada (página Processos).
   * @param {{ rascunho: string, nomeOperador?: string, userId?: string }} params
   * @returns {Promise<{ success: boolean, response?: string, provider?: string, model?: string, error?: string }>}
   */
  async generateRefinarRascunhoWithGemini({ rascunho, nomeOperador, userId }) {
    if (!this.isGeminiConfigured()) {
      return {
        success: false,
        error: 'Gemini não configurado',
        response: null
      };
    }
    try {
      const gemini = this._initializeGemini();
      if (!gemini) {
        return { success: false, error: 'Falha ao inicializar Gemini', response: null };
      }

      const model = gemini.getGenerativeModel({ model: this.geminiModel });
      const systemPrompt = getRefinarRascunhoPersona();
      const nome = String(nomeOperador || '').trim() || 'não informado';

      const userBlock =
        '## Dados desta solicitação\n\n' +
        '- **Nome do operador** (usar no lugar de [Nome do Operador] no template; se for "não informado", use cumprimento profissional sem inventar nome): ' +
        nome +
        '\n\n' +
        '- **Rascunho do colaborador** (única fonte do desenvolvimento; não invente prazos, valores nem procedimentos):\n\n' +
        String(rascunho || '').trim() +
        '\n\n' +
        '## Tarefa\n\n' +
        'Aplique a persona (travas, estrutura do e-mail). **Saída:** somente o corpo do e-mail refinado em português brasileiro, texto simples, sem rascunho repetido, sem análise, sem seções, sem preâmbulo.\n';

      const fullPrompt = systemPrompt + '\n\n' + userBlock;
      console.log('Gemini Refinar Rascunho: processando para', userId || 'anonimo');

      const result = await model.generateContent(fullPrompt);
      const response = result.response.text();

      return {
        success: true,
        response,
        provider: 'Gemini',
        model: this.geminiModel
      };
    } catch (error) {
      console.error('AIService generateRefinarRascunhoWithGemini:', error.message);
      return {
        success: false,
        error: error.message,
        response: null
      };
    }
  }
}

module.exports = new AIService();
