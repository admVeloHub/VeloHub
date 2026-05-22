/**
 * VeloHub V3 - WhatsApp Service para Módulo Escalações
 * VERSION: v1.6.1 | DATE: 2026-05-11 | AUTHOR: VeloHub Development Team
 *
 * Branch: escalacoes
 * Integração WhatsApp descontinuada: sendMessage/sendImage não realizam chamadas HTTP (solicitações não usam WhatsApp).
 * Mantidos formatJid e parseMetaFromText para compatibilidade com rotas que ainda referenciam o módulo.
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.6.0: sendMessage: retorno imediato { ok: false } — sem URLs, secrets ou rede
 * - v1.5.0: SIMPLIFICAÇÃO: Removida lógica do Skynet, usando apenas ngrok para todos os ambientes
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

