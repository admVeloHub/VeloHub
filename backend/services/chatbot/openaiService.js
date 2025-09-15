// OpenAI Service - Integração com IA para respostas inteligentes
const { OpenAI } = require('openai');
require('dotenv').config();

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = "gpt-4o-mini"; // Modelo otimizado para custo
  }

  /**
   * Gera resposta inteligente baseada na pergunta e contexto
   * @param {string} question - Pergunta do usuário
   * @param {string} context - Contexto da base de conhecimento
   * @param {Array} sessionHistory - Histórico da sessão
   * @param {string} userId - ID do usuário
   * @returns {Promise<string>} Resposta gerada pela IA
   */
  async generateResponse(question, context = "", sessionHistory = [], userId = null) {
    try {
      // Construir prompt com contexto e histórico
      const prompt = this.buildPrompt(question, context, sessionHistory);
      
      console.log(`🤖 OpenAI: Processando pergunta para usuário ${userId || 'anônimo'}`);
      
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: `Você é o VeloBot, assistente oficial da Velotax. 
            Responda de forma clara, objetiva e útil em português brasileiro.
            Use o contexto fornecido para dar respostas precisas.
            Se não souber algo, seja honesto e sugira contatar o suporte.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2, // Baixa criatividade para respostas mais precisas
        max_tokens: 1024,
      });

      const response = completion.choices[0].message.content;
      
      console.log(`✅ OpenAI: Resposta gerada com sucesso (${response.length} caracteres)`);
      
      return response;
      
    } catch (error) {
      console.error('❌ OpenAI Error:', error.message);
      
      // Fallback para resposta padrão
      return `Desculpe, não consegui processar sua pergunta no momento. 
      Por favor, tente novamente ou entre em contato com nosso suporte.`;
    }
  }

  /**
   * Constrói o prompt com contexto e histórico
   * @param {string} question - Pergunta atual
   * @param {string} context - Contexto da base de conhecimento
   * @param {Array} sessionHistory - Histórico da sessão
   * @returns {string} Prompt formatado
   */
  buildPrompt(question, context, sessionHistory) {
    let prompt = `### PERGUNTA ATUAL
"${question}"

### CONTEXTO DA BASE DE CONHECIMENTO
${context || "Nenhum contexto específico encontrado."}

### HISTÓRICO DA CONVERSA
${sessionHistory.length > 0 ? 
  sessionHistory.map(h => `${h.role}: ${h.content}`).join('\n') : 
  'Primeira pergunta da sessão.'}

### INSTRUÇÕES
- Responda em português brasileiro
- Seja direto e útil
- Use o contexto quando relevante
- Se não souber, sugira contatar o suporte
- Mantenha tom profissional mas amigável`;

    return prompt;
  }

  /**
   * Verifica se a API está configurada corretamente
   * @returns {boolean} Status da configuração
   */
  isConfigured() {
    return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';
  }

  /**
   * Testa a conexão com a API OpenAI
   * @returns {Promise<boolean>} Status da conexão
   */
  async testConnection() {
    try {
      if (!this.isConfigured()) {
        console.warn('⚠️ OpenAI: API Key não configurada');
        return false;
      }

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: "Teste de conexão" }],
        max_tokens: 10,
      });

      console.log('✅ OpenAI: Conexão testada com sucesso');
      return true;
      
    } catch (error) {
      console.error('❌ OpenAI: Erro no teste de conexão:', error.message);
      return false;
    }
  }
}

module.exports = new OpenAIService();
