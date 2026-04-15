/**
 * VeloHub V3 - WhatsApp Service para Módulo Escalações
 * VERSION: v1.6.0 | DATE: 2026-04-07 | AUTHOR: VeloHub Development Team
 * Branch: escalacoes
 * 
 * Integração WhatsApp descontinuada: sendMessage/sendImage não realizam chamadas HTTP (solicitações não usam WhatsApp).
 * Mantidos formatJid e parseMetaFromText para compatibilidade com rotas que ainda referenciam o módulo.
 * 
 * Mudanças v1.6.0:
 * - sendMessage: retorno imediato { ok: false } — sem URLs, secrets ou rede
 * 
 * Mudanças v1.5.0:
 * - SIMPLIFICAÇÃO: Removida lógica do Skynet, usando apenas ngrok para todos os ambientes
 * - Sempre usa WHATSAPP_API_URL ou fallback para ngrok padrão
 * - Sempre usa endpoint /send (padrão do ngrok)
 * - Removida toda detecção de Skynet e lógica condicional complexa
 * - Código simplificado e mais fácil de manter
 * 
 * Mudanças v1.4.5:
 * - CORREÇÃO: Corrigida detecção de Skynet/GCP que identificava incorretamente o próprio backend
 * - Adicionada validação para evitar loop quando apiUrl aponta para o próprio backend
 * - Melhorada construção de URL para evitar barras duplas
 * 
 * Mudanças v1.4.4:
 * - Alterada URL de produção para https://carmina-peskier-balletically.ngrok-free.dev
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
 * - Produção: WHATSAPP_API_URL (ngrok) → endpoint /send
 * - Desenvolvimento: SKYNET_API_URL ou localhost:3001 → endpoint /api/whatsapp/send
 */

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
  return {
    ok: false,
    error: 'Integração WhatsApp descontinuada'
  };
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

