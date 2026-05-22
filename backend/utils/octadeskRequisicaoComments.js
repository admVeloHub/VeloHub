/**
 * Textos de comentários internos Octadesk para requisições.
 * VERSION: v1.0.0 | DATE: 2026-05-20 | AUTHOR: VeloHub Development Team
 */

const simNao = (v) => (v ? 'Sim' : 'Não');

/**
 * Data/hora pt-BR (America/Sao_Paulo quando suportado).
 * @param {Date} [d]
 * @returns {string}
 */
function formatDateTimePtBr(d = new Date()) {
  try {
    return d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  } catch {
    return d.toLocaleString('pt-BR');
  }
}

/**
 * Mensagem de encerramento de requisição no Octadesk.
 * @param {string} status
 * @param {Date} [at]
 * @returns {string}
 */
function buildRequisicaoEncerradaComment(status, at = new Date()) {
  const st = String(status || '').trim() || '—';
  return `Requisição Encerrada. Status: ${st} ${formatDateTimePtBr(at)}`;
}

/**
 * Cabeçalho de solicitação técnica (espelho simplificado de FormSolicitacao.montarMensagem).
 * @param {{ agente?: string, cpf?: string, tipo?: string, payload?: Record<string, unknown>, mensagemTexto?: string }} body
 * @returns {string}
 */
function buildSolicitacaoHeaderComment(body) {
  const texto = body?.mensagemTexto != null ? String(body.mensagemTexto).trim() : '';
  if (texto) return texto;

  const agente = String(body?.agente || body?.payload?.agente || '').trim();
  const cpf = String(body?.cpf || body?.payload?.cpf || '').replace(/\D/g, '');
  const tipo = String(body?.tipo || body?.payload?.tipo || '').trim();
  const pl = body?.payload && typeof body.payload === 'object' ? body.payload : {};

  let msg = `Nova Solicitação Técnica - ${tipo || '—'}\n\n`;
  msg += `Agente: ${agente || '—'}\nCPF: ${cpf || '—'}\n\n`;

  if (tipo === 'Alteração de Dados Cadastrais') {
    msg += `Tipo de informação: ${pl.infoTipo || '—'}\n`;
    msg += `Dado antigo: ${pl.dadoAntigo || '—'}\n`;
    msg += `Dado novo: ${pl.dadoNovo || '—'}\n`;
    msg += `Fotos verificadas: ${simNao(!!pl.fotosVerificadas)}\n`;
  } else if (tipo === 'Exclusão de Chave PIX') {
    if (pl.nomeCliente) msg += `Nome: ${pl.nomeCliente}\n`;
    if (pl.origem) msg += `Origem: ${pl.origem}\n`;
    msg += `Sem Débito em aberto: ${simNao(!!pl.semDebitoAberto)}\n`;
    msg += `N2 - Ouvidora: ${simNao(!!pl.n2Ouvidora)}\n`;
    msg += `Procon: ${simNao(!!pl.procon)}\n`;
    msg += `Reclame Aqui: ${simNao(!!pl.reclameAqui)}\n`;
    msg += `Processo: ${simNao(!!pl.processo)}\n`;
    msg += `Bacen: ${simNao(!!pl.bacen)}\n`;
    msg += `Revogado consentimento ECAC: ${simNao(!!pl.revogadoConsentimentoEcac)}\n`;
  } else if (tipo === 'Solicitação de documentos') {
    msg += `Documentos: ${pl.documentos || '—'}\n`;
  }

  msg += `Observações: ${pl.observacoes != null ? String(pl.observacoes) : '—'}\n`;
  return msg.trim();
}

/**
 * Cabeçalho de erro/bug para comentário interno Octadesk.
 * @param {{ agente?: string, cpf?: string, tipo?: string, payload?: Record<string, unknown>, descricao?: string }} body
 * @returns {string}
 */
function buildErroBugHeaderComment(body) {
  const agente = String(body?.agente || body?.payload?.agente || '').trim();
  const cpf = String(body?.cpf || body?.payload?.cpf || '').replace(/\D/g, '');
  let tipo = String(body?.tipo || body?.payload?.tipo || '').trim();
  if (tipo && !tipo.startsWith('Erro/Bug - ')) {
    tipo = `Erro/Bug - ${tipo}`;
  }
  const pl = body?.payload && typeof body.payload === 'object' ? body.payload : {};
  const descricao = String(body?.descricao || pl.descricao || '').trim();

  let m = `Novo Erro/Bug - ${tipo.replace(/^Erro\/Bug - /, '') || '—'}\n\n`;
  m += `Agente: ${agente || '—'}\n`;
  if (cpf) m += `CPF: ${cpf}\n`;
  m += `\nDescrição:\n${descricao || '—'}\n`;
  if (pl.marca) m += `Marca: ${pl.marca}\n`;
  if (pl.modelo) m += `Modelo: ${pl.modelo}\n`;
  return m.trim();
}

module.exports = {
  formatDateTimePtBr,
  buildRequisicaoEncerradaComment,
  buildSolicitacaoHeaderComment,
  buildErroBugHeaderComment,
};
