/**
 * VeloHub V3 - WhatsApp Service para Módulo Escalações
 * VERSION: v1.4.3 | DATE: 2025-02-26 | AUTHOR: VeloHub Development Team
 * Branch: escalacoes
 * 
 * Serviço para integração com API WhatsApp (SKYNET ou Cloudflare Tunnel)
 * 
 * Mudanças v1.4.3:
 * - Alterada URL de produção para https://genes-conservation-perth-beverages.trycloudflare.com
 * 
 * Mudanças v1.4.2:
 * - Alterado fallback de desenvolvimento para localhost:3001
 * - Adicionado suporte para detecção de localhost:3001 como SKYNET
 * 
 * Mudanças v1.4.1:
 * - Adicionados logs de instrumentação para debug do fluxo de envio
 * - Melhorado tratamento de erros da API WhatsApp
 * 
 * Mudanças v1.4.0:
 * - Suporte para ambas as URLs: SKYNET (dev) e Cloudflare Tunnel (produção)
 * - Seleção automática de URL baseada em NODE_ENV
 * - Seleção automática de endpoint baseada na URL detectada
 * - Logs de diagnóstico detalhados para troubleshooting
 * 
 * Estrutura:
 * - Produção: WHATSAPP_API_URL (Cloudflare Tunnel) → endpoint /send
 * - Desenvolvimento: SKYNET_API_URL ou localhost:3001 → endpoint /api/whatsapp/send
 */

const config = require('../../config');

/**
 * Formatar número para JID WhatsApp
 * @param {string} numero - Número no formato numérico
 * @returns {string} JID formatado
 */
function formatJid(numero) {
  if (!numero || typeof numero !== 'string') {
    return null;
  }
  
  // Se já contém @, retornar como está
  if (numero.includes('@')) {
    return numero;
  }
  
  // Se contém -, é grupo
  if (numero.includes('-')) {
    return `${numero}@g.us`;
  }
  
  // Caso contrário, é individual
  return `${numero}@s.whatsapp.net`;
}

/**
 * Extrair CPF e tipo de solicitação do texto
 * Mesma lógica da API externa
 * @param {string} texto - Texto da mensagem
 * @returns {Object} { cpf, solicitacao }
 */
function parseMetaFromText(texto) {
  try {
    const s = String(texto || '');
    let cpfTxt = null;
    
    // Procurar linha que começa com CPF:
    const mCpf = s.match(/^\s*CPF\s*:\s*(.+)$/im);
    if (mCpf && mCpf[1]) {
      const dig = String(mCpf[1]).replace(/\D/g, '');
      if (dig) cpfTxt = dig;
    }
    
    let sol = null;
    // Tentar padrão do título: *Nova Solicitação Técnica - X*
    const mSol1 = s.match(/\*Nova\s+Solicitação\s+Técnica\s*-\s*([^*]+)\*/i);
    if (mSol1 && mSol1[1]) {
      sol = mSol1[1].trim();
    }
    
    // Fallback: procurar linha que começa com Tipo de Solicitação:
    if (!sol) {
      const mSol2 = s.match(/^\s*Tipo\s+de\s+Solicitação\s*:\s*(.+)$/im);
      if (mSol2 && mSol2[1]) {
        sol = mSol2[1].trim();
      }
    }
    
    return { cpf: cpfTxt, solicitacao: sol };
  } catch (error) {
    console.error('[WHATSAPP] Erro ao parsear meta do texto:', error);
    return { cpf: null, solicitacao: null };
  }
}

/**
 * Enviar mensagem via WhatsApp
 * @param {string} jid - JID WhatsApp ou número
 * @param {string} mensagem - Texto da mensagem
 * @param {Array} imagens - Array de imagens [{ data: base64, type: mimeType }]
 * @param {Array} videos - Array de vídeos (opcional, não suportado pela API atual)
 * @param {Object} options - Opções adicionais { cpf, solicitacao, agente }
 * @returns {Promise<Object>} { ok: boolean, messageId?: string, messageIds?: Array, error?: string }
 */
async function sendMessage(jid, mensagem, imagens = [], videos = [], options = {}) {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/2ccc77c8-3c17-4e50-968f-e75e25301700',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'whatsappService.js:94',message:'sendMessage ENTRY',data:{jid,hasMensagem:!!mensagem,mensagemLength:mensagem?.length||0,imagensCount:imagens.length,videosCount:videos.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  // Seleção de URL baseada em ambiente
  // Produção: usar Cloudflare Tunnel (WHATSAPP_API_URL)
  // Desenvolvimento: usar SKYNET (SKYNET_API_URL) ou localhost:3001
  const isProduction = config.NODE_ENV === 'production';
  const apiUrl = isProduction
    ? (config.WHATSAPP_API_URL || 'https://genes-conservation-perth-beverages.trycloudflare.com')
    : (config.SKYNET_API_URL || 'http://localhost:3001');
  
  // Detectar endpoint baseado na URL
  // SKYNET usa /api/whatsapp/send, Cloudflare Tunnel e localhost:3001 usam /send
  const isSkynet = apiUrl.includes('skynet') || 
                   apiUrl.includes('gcp') || 
                   apiUrl.includes('backend-gcp') ||
                   apiUrl.includes('us-east1.run.app');
  const endpoint = isSkynet ? '/api/whatsapp/send' : '/send';
  const fullUrl = `${apiUrl}${endpoint}`;
  
  // Logs de diagnóstico
  console.log(`[WHATSAPP] ========================================`);
  console.log(`[WHATSAPP] Ambiente: ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
  console.log(`[WHATSAPP] NODE_ENV: ${config.NODE_ENV || 'development'}`);
  console.log(`[WHATSAPP] API selecionada: ${isSkynet ? 'SKYNET' : 'CLOUDFLARE_TUNNEL'}`);
  console.log(`[WHATSAPP] URL base: ${apiUrl}`);
  console.log(`[WHATSAPP] Endpoint: ${endpoint}`);
  console.log(`[WHATSAPP] URL completa: ${fullUrl}`);
  console.log(`[WHATSAPP] ========================================`);
  
  if (!apiUrl) {
    console.error('[WHATSAPP] ❌ Nenhuma URL de API configurada');
    return { ok: false, error: 'WhatsApp API não configurada' };
  }
  
  try {
    // Formatar JID se necessário
    let destinatario = formatJid(jid);
    if (!destinatario) {
      console.error('[WHATSAPP] ❌ Destino inválido:', jid);
      return { ok: false, error: 'Destino inválido' };
    }
    
    // Extrair CPF e solicitação de options ou mensagem
    const { cpf: cpfOption, solicitacao: solOption, agente } = options;
    const parsed = parseMetaFromText(mensagem);
    const cpf = cpfOption || parsed.cpf || null;
    const solicitacao = solOption || parsed.solicitacao || null;
    
    // Preparar payload (compatível com ambas as APIs)
    const payload = {
      jid: destinatario,
      numero: null, // Não usado, mas mantido para compatibilidade
      mensagem: mensagem || '',
      imagens: Array.isArray(imagens) ? imagens : [],
      videos: Array.isArray(videos) ? videos : [],
      cpf: cpf,
      solicitacao: solicitacao,
      agente: agente || null
    };
    
    console.log(`[WHATSAPP] Enviando mensagem para ${destinatario}...`);
    console.log(`[WHATSAPP] Payload:`, {
      jid: destinatario,
      mensagemLength: mensagem?.length || 0,
      imagensCount: imagens.length,
      videosCount: videos.length,
      cpf: cpf || 'não informado',
      solicitacao: solicitacao || 'não informado',
      agente: agente || 'não informado'
    });
    
    // Fazer requisição com timeout de 30 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      console.log(`[WHATSAPP] Fazendo requisição POST para: ${fullUrl}`);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2ccc77c8-3c17-4e50-968f-e75e25301700',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'whatsappService.js:169',message:'BEFORE FETCH REQUEST',data:{fullUrl,destinatario,payloadKeys:Object.keys(payload)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log(`[WHATSAPP] Resposta recebida:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erro desconhecido');
        
        if (response.status === 503) {
          console.error('[WHATSAPP] ❌ WhatsApp desconectado (503)');
          return { ok: false, error: 'WhatsApp desconectado' };
        }
        
        if (response.status === 400) {
          console.error('[WHATSAPP] ❌ Destino inválido (400):', errorText);
          return { ok: false, error: 'Destino inválido' };
        }
        
        if (response.status === 404) {
          console.error('[WHATSAPP] ❌ Endpoint não encontrado (404):', errorText);
          console.error('[WHATSAPP] Verifique se a URL e endpoint estão corretos');
          return { ok: false, error: `Endpoint não encontrado: ${endpoint}` };
        }
        
        console.error(`[WHATSAPP] ❌ Erro HTTP ${response.status}:`, errorText);
        return { ok: false, error: `Erro HTTP ${response.status}: ${errorText}` };
      }
      
      const data = await response.json();
      console.log(`[WHATSAPP] Resposta JSON:`, data);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2ccc77c8-3c17-4e50-968f-e75e25301700',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'whatsappService.js:217',message:'API RESPONSE RECEIVED',data:{ok:data?.ok,hasMessageId:!!data?.messageId,hasMessageIds:Array.isArray(data?.messageIds),error:data?.error||null,status:response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      if (data.ok) {
        console.log(`[WHATSAPP] ✅ Mensagem enviada com sucesso!`);
        console.log(`[WHATSAPP] MessageId: ${data.messageId || 'não informado'}`);
        console.log(`[WHATSAPP] MessageIds: ${Array.isArray(data.messageIds) ? data.messageIds.length : 0} IDs`);
        return {
          ok: true,
          messageId: data.messageId || null,
          messageIds: Array.isArray(data.messageIds) ? data.messageIds : (data.messageId ? [data.messageId] : [])
        };
      } else {
        console.error('[WHATSAPP] ❌ Erro na resposta da API:', data.error);
        return { ok: false, error: data.error || 'Erro desconhecido' };
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('[WHATSAPP] ❌ Timeout ao enviar mensagem (30s)');
        return { ok: false, error: 'Timeout ao enviar mensagem' };
      }
      
      console.error('[WHATSAPP] ❌ Erro ao fazer requisição:', {
        name: fetchError.name,
        message: fetchError.message,
        stack: fetchError.stack
      });
      return { ok: false, error: fetchError.message || 'Erro ao fazer requisição' };
    }
  } catch (error) {
    console.error('[WHATSAPP] ❌ Erro geral:', {
      message: error.message,
      stack: error.stack
    });
    return { ok: false, error: error.message || 'Erro desconhecido' };
  }
}

/**
 * Enviar imagem única via WhatsApp
 * @param {string} jid - JID WhatsApp ou número
 * @param {string} imageBase64 - Imagem em base64 (sem prefixo data:image)
 * @param {string} caption - Legenda da imagem
 * @param {string} mimeType - Tipo MIME (ex: 'image/jpeg')
 * @returns {Promise<Object>} { ok: boolean, messageId?: string, messageIds?: Array, error?: string }
 */
async function sendImage(jid, imageBase64, caption = '', mimeType = 'image/jpeg') {
  const imagens = [{
    data: imageBase64,
    type: mimeType
  }];
  
  return sendMessage(jid, caption, imagens, [], {});
}

module.exports = {
  sendMessage,
  sendImage,
  formatJid,
  parseMetaFromText
};

