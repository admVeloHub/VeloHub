/**
 * VeloHub V3 - FormReclamacaoEdit Component
 * VERSION: v1.50.8 | DATE: 2026-05-26 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.50.8: Pós-fusão — Liberação Anterior imediata (`fusaoPatchFormulario`) + sync prop reclamacao
 * - v1.50.7: Remove eslint-disable de regra inexistente no projeto (react-hooks/exhaustive-deps)
 * - v1.50.6: Fix build — declaração duplicada de `fusaoLibAnteriorAplicadoSeqRef`
 * - v1.50.5: Editar — consulta CPF automática ao abrir (ctx fusão + Fundir); não zera ctx no mount do tipo
 * - v1.50.4: Consulta CPF / fusão — `currentId` normalizado (botão Fundir no modal editar)
 * - v1.50.3: Solicitar Liberação — modal histórico Req_Prod por CPF (paridade Requisições)
 * - v1.50.2: Liberação Anterior — marcação da fusão escopada ao CPF
 * - v1.50.1: Solicitar Liberação — botão desabilitado se liberação já solicitada
 * - v1.50.0: Solicitar Liberação — PUT em andamento antes de abrir modal (paridade Gerar Ticket)
 * - v1.49.0: Gerar Ticket — PUT em andamento (validação + campos obrigatórios) antes de abrir Octadesk
 * - v1.48.2: Gerar Ticket — preenche campo com ticketRegistro (incl. já existente / resposta parcial)
 * - v1.48.1: Indicadores Fundido/Fundidos — coluna direita da faixa Protocolo
 * - v1.48.0: Fusão: `currentPixLiberado` no ctx; marca Liberação Anterior via `fusaoLiberacaoAnteriorMarcacao` (CPF)
 * - v1.47.3: Fusão: consulta CPF omite tickets já absorvidos (inferior) da lista e do cenário
 * - v1.47.2: Consulta CPF / fusão: envia `currentSnapshot` ao contexto do modal Fundir ocorrências
 * - v1.47.1: Grid Protocolos: col 3 = Contrato Quitado/Cancelado; col 4 = Liberação Solicitada/Anterior
 * - v1.47.0: Campo «Liberação Anterior» (liberacaoAnterior) na seção Protocolos — todos os tipos exceto Time Portabilidade
 * - v1.46.0: Localizar Atendimentos usa util canônico `aggregateProtocolosFromRegistros`
 * - v1.45.29: Localizar Atendimentos usa `idEntrada` de Reclame Aqui como fallback em `protocolosReclameAqui`
 * - v1.45.28: Protocolos (todos os tipos): removido campo visual de retorno da solicitação e botão «Solicitar Liberação» com largura de conteúdo
 * - v1.45.27: Tipo PROCON passa a renderizar seção Protocolos (inclui checkbox «Reclame Aqui» e campo de protocolo)
 * - v1.45.26: Modal Solicitar Liberação passa referência do ticket Octadesk (ticketRegistro/protocolos) em `ouvidoriaNumeroProtocolo`
 * - v1.45.25: Barra Octadesk mostra tooltip em hover (seguindo cursor) quando «Gerar Ticket» está bloqueado
 * - v1.45.24: Removida instrumentação de debug NDJSON ingest `d712b6` em `useEffect([reclamacao])` (sessão concluída)
 * - v1.45.22: Removida instrumentação de debug (fetch ingest + `[agent-debug]`) em `useEffect([reclamacao])`
 * - v1.45.21: MOTIVOS_REDUZIDOS / MOTIVOS_RECLAME_AQUI: «Elegibilidade»
 * - v1.45.20: Exibição prazo BACEN: +10 dias UTC (alinhado API); N2 segue +2 dias
 * - v1.45.19: converterParaFormData repassa Fusao/Finalizado (chips fusão ao editar)
 * - v1.45.18: FusaoProtocoloIndicadores ao lado do bloco «Protocolo» (Fundido / Receptor)
 * - v1.39.0: Time Portabilidade (TIME_PORTABILIDADE): conversão, edição, validação, PUT e seções Reclamação + Canais (Pix / Contrato) sem anexo nem protocolos completos
 * - v1.38.0: MOTIVOS_REDUZIDOS e MOTIVOS_RECLAME_AQUI: "Juros abusivos" — alinhado FormReclamacao v3.40
 */

import React, { useState, useEffect, useRef } from 'react';
import { reclamacoesAPI, anexosAPI } from '../../services/ouvidoriaApi';
import { formatDateRegistro } from '../../utils/dateUtils';
import {
  OPCOES_TIPO_RECLAMACAO_POR_HIERARQUIA,
  tierIndexFromTipo,
} from '../../utils/ouvidoriaTierHierarchy';
import { mensagemRetornoBuscaLocalizar } from '../../utils/ouvidoriaLocalizarRetornoMsg';
import { aggregateProtocolosFromRegistros } from '../../utils/ouvidoriaProtocolosCanon';
import {
  buildFusaoCurrentSnapshot,
  filterReclamacoesElegiveisFusaoLista,
  tipoSuportaLiberacaoAnterior,
} from '../../utils/ouvidoriaFusaoModalDisplay';
import { tipoOuvidoriaFormToOrigemReqProd } from '../../utils/liberacaoChavePixRules';
import { buildModalHistoricoLiberacaoPixFromGetResponse, normalizeMongoId } from '../../utils/requisicoesModalHelpers';
import { solicitacoesAPI } from '../../services/requisicoesApi';
import ModalHistoricoRequisicaoCpf from '../Requisicoes/ModalHistoricoRequisicaoCpf';
import ModalSolicitarLiberacaoPix from './ModalSolicitarLiberacaoPix';
import OuvidoriaOctadeskTicketBar from './OuvidoriaOctadeskTicketBar';
import { resolveOctadeskTicketFromForm } from '../../utils/resolveOctadeskTicketFromForm';
import FusaoProtocoloIndicadores from './FusaoProtocoloIndicadores';
import { FloatingLabelField, FloatingLabelShell } from '../shared/FloatingLabelField';
import toast from 'react-hot-toast';

// Importar funções auxiliares e constantes do FormReclamacao
// Por enquanto, vou duplicar as funções essenciais aqui
const formatCPFInput = (value) => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return cleaned.replace(/(\d{3})(\d+)/, '$1.$2');
  if (cleaned.length <= 9) return cleaned.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
  if (cleaned.length <= 11) return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4');
  return value;
};

const formatTelefone = (value) => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 2) return `(${cleaned}`;
  if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  if (cleaned.length <= 10) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  if (cleaned.length <= 11) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  return value;
};

const formatarEmail = (valor) => {
  return String(valor || '').toLowerCase().trim().replace(/\s+/g, '');
};

const validarEmail = (valor) => {
  const email = String(valor || '').trim();
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/;
  return emailRegex.test(email);
};

const validarCPF = (cpf) => {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.length === 11;
};

/**
 * Opções de motivo reduzido (BACEN / N2 Pix / Procon)
 * VERSION: v2.1.0 | DATE: 2026-04-02 | Igual FormReclamacao.js
 */
const MOTIVOS_REDUZIDOS = [
  'Liberação chave pix',
  'Portabilidade pix',
  'Abatimento de juros',
  'Juros abusivos',
  'Cancelamento até 7 dias',
  'Cancelamento superior a 7 dias',
  'Em cobrança',
  'Alega fraude',
  'Erro app',
  'Elegibilidade',
  'Encerramento cta celcoin',
  'Encerramento cta app',
  'Superendividamento',
];

const TIME_PORTABILIDADE_TIPO = 'TIME_PORTABILIDADE';
const TIME_PORT_PRODUTO = 'Antecipação 2026';
const TIME_PORT_ORIGEM = 'Atendimento';
const TIME_PORT_MOTIVO_FIXO = ['Liberação chave pix'];

const OPCOES_TIPO_RECLAMACAO = OPCOES_TIPO_RECLAMACAO_POR_HIERARQUIA;

/** Rótulos antigos (BACEN/N2/Procon) → novos ao carregar edição */
const LEGADO_MOTIVO_REDUZIDOS = {
  Cobrança: 'Em cobrança',
  'Em Cobrança': 'Em cobrança',
  Fraude: 'Alega fraude',
  'Alega Fraude': 'Alega fraude',
  Erro: 'Erro app',
  'Erro App': 'Erro app',
  'Encerramento de Conta': 'Encerramento cta celcoin',
  Lgpd: 'Encerramento cta app',
  LGPD: 'Encerramento cta app',
  'Juros Abusivos': 'Juros abusivos',
};

const normalizarMotivosReduzidosAoCarregar = (motivos) => {
  if (!Array.isArray(motivos)) return motivos;
  return motivos.map((m) => LEGADO_MOTIVO_REDUZIDOS[m] || m);
};

/**
 * Opções de motivo para Ação Judicial (múltipla escolha)
 */
const MOTIVOS_ACAO_JUDICIAL = [
  'Juros',
  'Chave pix',
  'Restituição BB',
  'Relatório',
  'Repetição indébito',
  'Superendividamento',
  'Desconhece contratação'
];

/**
 * Opções de motivo para Reclame Aqui (múltipla escolha)
 */
const MOTIVOS_RECLAME_AQUI = [
  'Reativação do cadastro',
  'Alteração cadastral',
  'Abatimento de juros',
  'Juros abusivos',
  'Valor mínimo para contratação',
  'Limite baixo do pix',
  'Portabilidade pix',
  'Em cobrança',
  'Cancelamento até 7 dias',
  'Cancelamento superior a 7 dias',
  'Erro gov',
  'Não elegível a crédito',
  'Alega fraude',
  'Desativado',
  'Dívida prescrita',
  'Dúvidas gerais',
  'Encerramento cta App',
  'Encerramento cta Celcoin',
  'Erro app',
  'Elegibilidade',
  'Liberação chave pix',
];
const LEGADO_MOTIVO_RECLAME_AQUI = {
  Cobrança: 'Em cobrança',
  'Em Cobrança': 'Em cobrança',
  Fraude: 'Alega fraude',
  'Alega Fraude': 'Alega fraude',
  Erro: 'Erro app',
  'Erro App': 'Erro app',
  'Encerramento de Conta Celcoin': 'Encerramento cta Celcoin',
  'Encerramento cta celcoin': 'Encerramento cta Celcoin',
  LGPD: 'Encerramento cta App',
  'Encerramento cta app': 'Encerramento cta App',
  'Portabilidade Pix': 'Portabilidade pix',
  'Portabilidade chave pix': 'Portabilidade pix',
  'Valor Minimo para contratação': 'Valor mínimo para contratação',
  'Valor Minimo Para Contratação': 'Valor mínimo para contratação',
  'Valor minimo para contratação': 'Valor mínimo para contratação',
  'Limite baixo do Pix': 'Limite baixo do pix',
  'Limite Baixo Do Pix': 'Limite baixo do pix',
  'Alteração cadastral': 'Alteração cadastral',
  'Alteração Cadastral': 'Alteração cadastral',
  'Dívida prescrita': 'Dívida prescrita',
  'Dívida Prescrita': 'Dívida prescrita',
  'Reativação de cadastro': 'Reativação do cadastro',
  'Juros Abusivos': 'Juros abusivos',
};

const normalizarMotivosReclameAquiAoCarregar = (motivos) => {
  if (!Array.isArray(motivos)) return motivos;
  return motivos.map((m) => LEGADO_MOTIVO_RECLAME_AQUI[m] || m);
};

/** Grafia legada de produto → canônicos do select (todos os tipos) */
const LEGADO_PRODUTO_GRAFIA = {
  EP: 'Empréstimo Pessoal',
  ep: 'Empréstimo Pessoal',
  Ep: 'Empréstimo Pessoal',
  eP: 'Empréstimo Pessoal',
  'Credito Pessoal': 'Empréstimo Pessoal',
  'Credito Trabalhador': 'Crédito Trabalhador',
  'Empréstimo pessoal': 'Empréstimo Pessoal',
  'Crédito ao trabalhador': 'Crédito Trabalhador',
  'Crédito ao Trabalhador': 'Crédito Trabalhador',
};

/** Valores antigos só Reclame Aqui → canônicos do select */
const LEGADO_PRODUTO_RECLAME_AQUI = {
  VeloPrime: 'Veloprime',
};

/** Dias UTC após createdAt para prévia do prazo quando o campo ainda não existe (alinhado SLA API reclamacoes). */
const SLA_EXIB_CREATED_AT_PLUS_DIAS_BACEN = 10;
const SLA_EXIB_CREATED_AT_PLUS_DIAS_OUVIDORIA = 2;

/** Data YYYY-MM-DD do prazo (campo salvo ou derivado de createdAt + N dias UTC) */
const dataPrazoAutomaticoParaExibicao = (tipoNorm, rec) => {
  if (!rec) return '';
  const salvo = tipoNorm === 'BACEN' ? rec.prazoBacen : tipoNorm === 'OUVIDORIA' ? rec.prazoOuvidoria : null;
  if (salvo) {
    try {
      const d = new Date(salvo);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } catch { /* ignore */ }
  }
  if (!rec.createdAt) return '';
  const c = new Date(rec.createdAt);
  if (isNaN(c.getTime())) return '';
  const p = new Date(c.getTime());
  const dias =
    tipoNorm === 'BACEN'
      ? SLA_EXIB_CREATED_AT_PLUS_DIAS_BACEN
      : SLA_EXIB_CREATED_AT_PLUS_DIAS_OUVIDORIA;
  p.setUTCDate(p.getUTCDate() + dias);
  return p.toISOString().split('T')[0];
};

/**
 * Converter dados da reclamação para formData
 */
const converterParaFormData = (reclamacao) => {
  if (!reclamacao) return null;

  // Formatar data para input date (YYYY-MM-DD)
  const formatarDataInput = (data) => {
    if (!data) return '';
    try {
      const date = new Date(data);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Normalizar tipo (API pode retornar diferentes formatos mas código espera formatos específicos)
  let tipoNormalizado = reclamacao.tipo || 'BACEN';
  const tipoStr = String(tipoNormalizado).trim();
  const tipoUpper = tipoStr.toUpperCase();
  if (tipoStr === 'Reclame Aqui' || tipoUpper === 'RECLAME AQUI' || tipoUpper === 'RECLAMEAQUI') {
    tipoNormalizado = 'RECLAME_AQUI';
  } else if (tipoUpper === 'BACEN') {
    tipoNormalizado = 'BACEN';
  } else if (
    tipoUpper === 'N2' || tipoUpper === 'N2 & PIX' || tipoUpper === 'N2&PIX' ||
    tipoUpper === 'N2 PIX' || tipoStr === 'N2 Pix' || tipoStr === 'Ouvidoria' || tipoUpper === 'OUVIDORIA'
  ) {
    tipoNormalizado = 'OUVIDORIA';
  } else if (tipoStr === 'Procon' || tipoUpper === 'PROCON') {
    tipoNormalizado = 'PROCON';
  } else if (
    tipoUpper === 'PROCESSOS' || tipoUpper === 'JUDICIAL' ||
    tipoUpper === 'AÇÃO JUDICIAL' || tipoUpper === 'ACAO JUDICIAL' || tipoStr === 'Ação Judicial'
  ) {
    tipoNormalizado = 'PROCESSOS';
  } else if (
    tipoUpper === 'TIME_PORTABILIDADE' || tipoUpper === 'TIME PORTABILIDADE' ||
    tipoStr === 'Time Portabilidade'
  ) {
    tipoNormalizado = 'TIME_PORTABILIDADE';
  }

  return {
    // Campos comuns
    nome: reclamacao.nome || '',
    cpf: reclamacao.cpf ? formatCPFInput(reclamacao.cpf.replace(/\D/g, '')) : '',
    telefones: reclamacao.telefones?.lista?.length > 0 
      ? { lista: reclamacao.telefones.lista }
      : { lista: [''] },
    email: reclamacao.email || '',
    observacoes: reclamacao.observacoes || '',
    tipo: tipoNormalizado,
    numeroProtocolo: reclamacao.numeroProtocolo != null ? String(reclamacao.numeroProtocolo) : '',
    
    // Campos BACEN
    dataEntrada: formatarDataInput(reclamacao.dataEntrada),
    origem: reclamacao.origem || '',
    produto: (() => {
      let p = reclamacao.produto || '';
      if (tipoNormalizado === 'RECLAME_AQUI' && LEGADO_PRODUTO_RECLAME_AQUI[p]) {
        p = LEGADO_PRODUTO_RECLAME_AQUI[p];
      }
      return LEGADO_PRODUTO_GRAFIA[p] || p;
    })(),
    anexos: reclamacao.anexos || [],
    motivoReduzido: (() => {
      const arr = Array.isArray(reclamacao.motivoReduzido)
        ? [...reclamacao.motivoReduzido]
        : (reclamacao.motivoReduzido ? [reclamacao.motivoReduzido] : []);
      if (tipoNormalizado === 'RECLAME_AQUI') {
        return normalizarMotivosReclameAquiAoCarregar(arr);
      }
      if (tipoNormalizado === 'BACEN' || tipoNormalizado === 'OUVIDORIA' || tipoNormalizado === 'PROCON') {
        return normalizarMotivosReduzidosAoCarregar(arr);
      }
      if (tipoNormalizado === 'TIME_PORTABILIDADE') {
        return arr.length ? arr : [...TIME_PORT_MOTIVO_FIXO];
      }
      return arr;
    })(),
    motivoDetalhado: reclamacao.motivoDetalhado || '',
    
    // Campos OUVIDORIA (schema: dataEntradaN2)
    dataEntradaN2: formatarDataInput(reclamacao.dataEntradaN2 || reclamacao.dataEntrada),
    
    // Campos Reclame Aqui
    cpfRepetido: reclamacao.cpfRepetido || '',
    idEntrada: reclamacao.idEntrada || '',
    dataReclam: formatarDataInput(reclamacao.dataReclam),
    passivelNotaMais: reclamacao.passivelNotaMais || false,
    solicitadoAvaliacao: reclamacao.solicitadoAvaliacao || false,
    avaliado: reclamacao.avaliado || false,
    
    // Campos Procon
    codigoProcon: reclamacao.codigoProcon || '',
    dataProcon: formatarDataInput(reclamacao.dataProcon),
    solucaoApresentada: reclamacao.solucaoApresentada || '',
    processoAdministrativo: reclamacao.processoAdministrativo || '',
    clienteDesistiu: reclamacao.clienteDesistiu || false,
    encaminhadoJuridico: reclamacao.encaminhadoJuridico || false,
    processoEncaminhadoResponsavel: reclamacao.processoEncaminhadoResponsavel || '',
    processoEncaminhadoData: formatarDataInput(reclamacao.processoEncaminhadoData),
    processoEncerrado: reclamacao.processoEncerrado || false,
    dataProcessoEncerrado: formatarDataInput(reclamacao.dataProcessoEncerrado),
    registrosReclameAqui: reclamacao.registrosReclameAqui || '',
    
    // Campos compartilhados
    tentativasContato: reclamacao.tentativasContato?.lista?.length > 0
      ? { lista: reclamacao.tentativasContato.lista }
      : { lista: [{ data: '', meio: '', resultado: '' }] },
    acionouCentral: reclamacao.acionouCentral || false,
    protocolosCentral: reclamacao.protocolosCentral?.length > 0 
      ? reclamacao.protocolosCentral 
      : [''],
    n2SegundoNivel: reclamacao.n2SegundoNivel || false,
    protocolosN2: reclamacao.protocolosN2?.length > 0 
      ? reclamacao.protocolosN2 
      : [''],
    reclameAqui: reclamacao.reclameAqui || false,
    protocolosReclameAqui: reclamacao.protocolosReclameAqui?.length > 0 
      ? reclamacao.protocolosReclameAqui 
      : [''],
    procon: reclamacao.procon || false,
    protocolosProcon: reclamacao.protocolosProcon?.length > 0 
      ? reclamacao.protocolosProcon 
      : [''],
    semRespostaCliente: reclamacao.semRespostaCliente === true,
    liberacaoSolicitada: reclamacao.liberacaoSolicitada === true,
    liberacaoAnterior: reclamacao.liberacaoAnterior === true,
    feedbackSolicitarLiberacao: '',
    localizarAtendimentos: reclamacao.localizarAtendimentos || '',
    pixLiberado: (() => {
      if (reclamacao.pixLiberado === true) return true;
      if (reclamacao.pixLiberado === false) return false;
      const s = String(reclamacao.pixStatus || '').toLowerCase().trim();
      return ['liberado', 'excluído', 'excluido', 'solicitada', 'solicitado'].includes(s);
    })(),
    statusContratoQuitado: reclamacao.statusContratoQuitado || false,
    contratoCancelado: reclamacao.contratoCancelado === true,
    
    // Campos Ação Judicial (PROCESSOS)
    nroProcesso: reclamacao.nroProcesso || '',
    empresaAcionada: reclamacao.empresaAcionada || '',
    dataEntradaProcesso: formatarDataInput(reclamacao.dataEntrada || reclamacao.dataEntradaProcesso),
    audiencia: reclamacao.audiencia || false,
    dataAudiencia: formatarDataInput(reclamacao.dataAudiencia),
    situacaoAudiencia: reclamacao.situacaoAudiencia || '',
    subsidios: reclamacao.subsidios || '',
    outrosProtocolos: reclamacao.outrosProtocolos || '',
    protocoloOctadesk: reclamacao.protocoloOctadesk != null ? String(reclamacao.protocoloOctadesk) : '',
    ticketRegistro: reclamacao.ticketRegistro != null ? String(reclamacao.ticketRegistro) : '',
    Finalizado:
      reclamacao.Finalizado && typeof reclamacao.Finalizado === 'object'
        ? { ...reclamacao.Finalizado }
        : undefined,
    Fusao:
      reclamacao.Fusao && typeof reclamacao.Fusao === 'object'
        ? { ...reclamacao.Fusao }
        : undefined,
  };
};

const FUSAO_LIB_ANTERIOR_MARCACAO_VAZIA = { cpf: '', seq: 0 };

const FormReclamacaoEdit = ({
  reclamacao,
  onClose,
  onSuccess,
  onFusaoConsultaChange,
  fundirInlineAtivo = false,
  onAbrirModalFusao,
  fusaoLiberacaoAnteriorMarcacao = FUSAO_LIB_ANTERIOR_MARCACAO_VAZIA,
  fusaoPatchFormulario = null,
}) => {
  // Obter userEmail e responsavel da sessão
  const getUserSession = () => {
    try {
      const sessionData = 
        localStorage.getItem('veloacademy_user_session') ||
        localStorage.getItem('velohub_user_session') ||
        localStorage.getItem('user_session');
      
      if (sessionData) {
        return JSON.parse(sessionData);
      }
    } catch (error) {
      console.error('Erro ao obter sessão:', error);
    }
    return null;
  };

  const session = getUserSession();
  const userEmail = session?.user?.email || session?.email || '';
  const responsavel = session?.user?.name || '';

  const [formData, setFormData] = useState(() => converterParaFormData(reclamacao) || {
    nome: '',
    cpf: '',
    telefones: { lista: [''] },
    email: '',
    observacoes: '',
    tipo: 'BACEN',
    numeroProtocolo: '',
    dataEntrada: new Date().toISOString().split('T')[0],
    origem: '',
    produto: '',
    anexos: [],
    motivoReduzido: [],
    motivoDetalhado: '',
    dataEntradaN2: '',
    cpfRepetido: '',
    idEntrada: '',
    dataReclam: '',
    passivelNotaMais: false,
    solicitadoAvaliacao: false,
    avaliado: false,
    codigoProcon: '',
    dataProcon: '',
    solucaoApresentada: '',
    processoAdministrativo: '',
    clienteDesistiu: false,
    encaminhadoJuridico: false,
    processoEncaminhadoResponsavel: '',
    processoEncaminhadoData: '',
    processoEncerrado: false,
    dataProcessoEncerrado: '',
    registrosReclameAqui: '',
    tentativasContato: { lista: [{ data: '', meio: '', resultado: '' }] },
    acionouCentral: false,
    protocolosCentral: [''],
    n2SegundoNivel: false,
    protocolosN2: [''],
    reclameAqui: false,
    protocolosReclameAqui: [''],
    procon: false,
    protocolosProcon: [''],
    semRespostaCliente: false,
    pixLiberado: false,
    statusContratoQuitado: false,
    contratoCancelado: false,
    enviarParaCobranca: false,
    localizarAtendimentos: '',
    liberacaoSolicitada: false,
    liberacaoAnterior: false,
    feedbackSolicitarLiberacao: '',
    // Ação Judicial
    nroProcesso: '',
    empresaAcionada: '',
    dataEntradaProcesso: new Date().toISOString().split('T')[0],
    audiencia: false,
    dataAudiencia: '',
    situacaoAudiencia: '',
    subsidios: '',
    outrosProtocolos: '',
    protocoloOctadesk: '',
  });

  const [loading, setLoading] = useState(false);
  const [gerandoTicketOcta, setGerandoTicketOcta] = useState(false);
  const [solicitandoLiberacao, setSolicitandoLiberacao] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const dropdownRef = useRef(null);
  const [dropdownMotivoAberto, setDropdownMotivoAberto] = useState(null); // ID único do campo de motivo aberto
  const dropdownMotivoRefs = useRef({});
  const [mostrarModalOutrosProtocolos, setMostrarModalOutrosProtocolos] = useState(false);
  const [buscandoOutrosProtocolos, setBuscandoOutrosProtocolos] = useState(false);
  const [outrosProtocolosRegistros, setOutrosProtocolosRegistros] = useState([]);
  const [protocoloExpandido, setProtocoloExpandido] = useState(null);
  const fusaoLibAnteriorAplicadoSeqRef = useRef(0);
  const fusaoPatchAplicadoSeqRef = useRef(0);
  const tipoAnteriorFusaoRef = useRef(undefined);
  const consultaFusaoAutoRecIdRef = useRef('');

  // Fechar dropdown de motivo ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownMotivoAberto !== null) {
        const ref = dropdownMotivoRefs.current[dropdownMotivoAberto];
        if (ref && !ref.contains(event.target)) {
          setDropdownMotivoAberto(null);
        }
      }
    };

    if (dropdownMotivoAberto !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownMotivoAberto]);

  useEffect(() => {
    if (tipoAnteriorFusaoRef.current === undefined) {
      tipoAnteriorFusaoRef.current = formData.tipo;
      return;
    }
    if (tipoAnteriorFusaoRef.current === formData.tipo) return;
    tipoAnteriorFusaoRef.current = formData.tipo;
    if (typeof onFusaoConsultaChange === 'function') {
      onFusaoConsultaChange(null);
    }
  }, [formData.tipo, onFusaoConsultaChange]);

  const cpfFormNorm = String(formData.cpf || '').replace(/\D/g, '');

  useEffect(() => {
    const marc = fusaoLiberacaoAnteriorMarcacao || FUSAO_LIB_ANTERIOR_MARCACAO_VAZIA;
    if (!marc.cpf || marc.seq < 1) {
      fusaoLibAnteriorAplicadoSeqRef.current = 0;
      return;
    }
    if (cpfFormNorm.length !== 11 || cpfFormNorm !== marc.cpf) return;
    if (!tipoSuportaLiberacaoAnterior(formData.tipo)) return;
    if (formData.pixLiberado === true) return;
    if (fusaoLibAnteriorAplicadoSeqRef.current >= marc.seq) return;
    fusaoLibAnteriorAplicadoSeqRef.current = marc.seq;
    setFormData((prev) => ({ ...prev, liberacaoAnterior: true }));
  }, [
    fusaoLiberacaoAnteriorMarcacao,
    cpfFormNorm,
    formData.tipo,
    formData.pixLiberado,
  ]);

  useEffect(() => {
    const patch = fusaoPatchFormulario;
    if (!patch?.seq || patch.liberacaoAnterior !== true) return;
    if (fusaoPatchAplicadoSeqRef.current >= patch.seq) return;
    const cpfPatch = String(patch.cpf || '').replace(/\D/g, '');
    if (cpfFormNorm.length !== 11 || cpfFormNorm !== cpfPatch) return;
    const recId = normalizeMongoId(reclamacao?._id ?? reclamacao?.id);
    const patchId = normalizeMongoId(patch.reclamacaoId);
    if (patchId && recId !== patchId) return;
    if (!tipoSuportaLiberacaoAnterior(formData.tipo)) return;
    if (formData.pixLiberado === true) return;
    fusaoPatchAplicadoSeqRef.current = patch.seq;
    setFormData((prev) => ({ ...prev, liberacaoAnterior: true }));
  }, [
    fusaoPatchFormulario,
    cpfFormNorm,
    reclamacao?._id,
    reclamacao?.id,
    formData.tipo,
    formData.pixLiberado,
  ]);

  useEffect(() => {
    if (!reclamacao) return;
    setFormData((prev) => {
      let changed = false;
      const next = { ...prev };
      if (reclamacao.liberacaoAnterior === true && prev.liberacaoAnterior !== true) {
        next.liberacaoAnterior = true;
        changed = true;
      }
      if (
        reclamacao.Fusao &&
        typeof reclamacao.Fusao === 'object' &&
        JSON.stringify(reclamacao.Fusao) !== JSON.stringify(prev.Fusao)
      ) {
        next.Fusao = { ...reclamacao.Fusao };
        changed = true;
      }
      if (
        reclamacao.Finalizado &&
        typeof reclamacao.Finalizado === 'object' &&
        JSON.stringify(reclamacao.Finalizado) !== JSON.stringify(prev.Finalizado)
      ) {
        next.Finalizado = { ...reclamacao.Finalizado };
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [
    reclamacao?._id,
    reclamacao?.liberacaoAnterior,
    reclamacao?.Fusao,
    reclamacao?.Finalizado,
    reclamacao?.updatedAt,
  ]);

  /**
   * Renderizar campo de motivo com dropdown múltipla escolha
   */
  const renderCampoMotivo = (motivosLista, valorAtual, onChange, error, label = 'Motivo *', campoId = 'motivo-default') => {
    const valoresArray = Array.isArray(valorAtual) ? valorAtual : [];
    const motivosDisponiveis = motivosLista.filter(m => !valoresArray.includes(m));
    const isAberto = dropdownMotivoAberto === campoId;

    const adicionarMotivo = (motivo) => {
      if (!valoresArray.includes(motivo)) {
        onChange([...valoresArray, motivo]);
      }
      setDropdownMotivoAberto(null);
    };

    const removerMotivo = (motivo) => {
      onChange(valoresArray.filter(m => m !== motivo));
    };

    const labelLimpo = String(label).replace(/\*\s*$/, '').trim();
    const labelObrigatorio = String(label).includes('*');

    return (
      <div
        className="relative"
        ref={(el) => {
          if (el) {
            dropdownMotivoRefs.current[campoId] = el;
          }
        }}
      >
        <FloatingLabelShell
          id={campoId}
          label={labelLimpo}
          required={labelObrigatorio}
          raised={valoresArray.length > 0 || isAberto}
          focused={isAberto}
          error={error}
        >
        <div
          id={campoId}
          role="combobox"
          aria-expanded={isAberto}
          tabIndex={0}
          className="flex min-h-12 w-full cursor-pointer flex-wrap items-center gap-2 rounded-lg border border-gray-400 bg-white px-3 pb-2 pt-5 dark:border-gray-500 dark:bg-gray-800"
          onClick={() => setDropdownMotivoAberto(isAberto ? null : campoId)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setDropdownMotivoAberto(isAberto ? null : campoId);
            }
          }}
        >
          {valoresArray.length === 0 ? (
            <span className="text-gray-400 dark:text-gray-500 text-sm">Selecione os motivos...</span>
          ) : (
            valoresArray.map((motivo, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm"
              >
                {motivo}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removerMotivo(motivo);
                  }}
                  className="ml-1 hover:text-blue-600 dark:hover:text-blue-300"
                >
                  ×
                </button>
              </span>
            ))
          )}
          <span className="ml-auto text-gray-400">▼</span>
        </div>
        </FloatingLabelShell>

        {/* Dropdown de opções */}
        {isAberto && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-500 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {motivosDisponiveis.length === 0 ? (
              <div className="flex min-h-12 items-center px-3 text-sm text-gray-500 dark:text-gray-400">
                Todos os motivos já foram selecionados
              </div>
            ) : (
              motivosDisponiveis.map(motivo => (
                <div
                  key={motivo}
                  onClick={() => adicionarMotivo(motivo)}
                  className="flex min-h-12 cursor-pointer items-center px-3 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {motivo}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };
  
  // Estados para busca de registros Reclame Aqui (Procon)
  const [reclameAquiRegistros, setReclameAquiRegistros] = useState([]);
  const [mostrarModalReclameAqui, setMostrarModalReclameAqui] = useState(false);
  const [buscandoReclameAqui, setBuscandoReclameAqui] = useState(false);
  const [liberacaoModalCtx, setLiberacaoModalCtx] = useState(null);
  const [modalHistoricoLiberacaoCpf, setModalHistoricoLiberacaoCpf] = useState(null);

  const aplicarMudancaTipo = (novoTipo) => {
    const hoje = new Date().toISOString().split('T')[0];
    setFormData((prev) => {
      const next = {
        ...prev,
        tipo: novoTipo,
        origem: '',
        anexos: [],
        motivoReduzido: [],
        motivoDetalhado: '',
        dataEntradaN2: '',
        produto: '',
        cpfRepetido: '',
        idEntrada: '',
        dataReclam: '',
        passivelNotaMais: false,
        solicitadoAvaliacao: false,
        avaliado: false,
        codigoProcon: '',
        dataProcon: '',
        solucaoApresentada: '',
        processoAdministrativo: '',
        clienteDesistiu: false,
        encaminhadoJuridico: false,
        processoEncaminhadoResponsavel: '',
        processoEncaminhadoData: '',
        processoEncerrado: false,
        dataProcessoEncerrado: '',
        registrosReclameAqui: '',
        protocoloOctadesk: '',
        dataEntrada: hoje,
      };
      if (novoTipo === TIME_PORTABILIDADE_TIPO) {
        next.origem = TIME_PORT_ORIGEM;
        next.produto = TIME_PORT_PRODUTO;
        next.motivoReduzido = [...TIME_PORT_MOTIVO_FIXO];
        next.dataEntrada = hoje;
      }
      return next;
    });
    setErrors({});
  };

  const resolverAgenteParaLiberacao = () => {
    const r = String(responsavel || '').trim();
    if (r) return r;
    try {
      const raw =
        localStorage.getItem('velohub_user_session') ||
        localStorage.getItem('veloacademy_user_session') ||
        localStorage.getItem('user_session');
      if (raw) {
        const j = JSON.parse(raw);
        return (j?.user?.name || j?.user?.email || '').trim();
      }
    } catch {
      /* ignore */
    }
    return '';
  };

  const liberacaoPixJaSolicitada = formData.liberacaoSolicitada === true;

  const handleSolicitarLiberacao = async () => {
    if (liberacaoPixJaSolicitada) {
      toast.error('Liberação já solicitada para esta ocorrência.');
      return;
    }
    const orig = tipoOuvidoriaFormToOrigemReqProd(formData.tipo);
    if (!orig) {
      toast.error('Solicitar liberação não está disponível para este tipo de ocorrência.');
      return;
    }
    if (!resolveOctadeskTicketFromForm(formData)) {
      toast.error('Informe ou gere um ticket (Registro, N1 ou N2) antes de solicitar liberação.');
      return;
    }
    const cpfDigits = String(formData.cpf || '').replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      toast.error('CPF inválido. Preencha o CPF do cliente antes de solicitar liberação.');
      return;
    }
    setSolicitandoLiberacao(true);
    try {
      let id;
      try {
        id = await persistirEmAndamentoOcorrencia();
      } catch (err) {
        if (err?.message === 'VALIDATION') return;
        throw err;
      }
      const pending = { origem: orig, tipoApi: formData.tipo, reclamacaoId: id };
      try {
        const res = await solicitacoesAPI.getByCpf(cpfDigits);
        const historico = buildModalHistoricoLiberacaoPixFromGetResponse(res);
        if (historico) {
          setModalHistoricoLiberacaoCpf({
            cpfDisplay: formatCPFInput(cpfDigits),
            abertas: historico.abertas,
            resolvidas: historico.resolvidas,
            pending,
          });
          return;
        }
      } catch (scanErr) {
        console.error('[FormReclamacaoEdit] Erro ao verificar requisições por CPF:', scanErr);
        toast.error('Não foi possível verificar requisições existentes para este CPF. Tente novamente.');
        return;
      }
      setLiberacaoModalCtx(pending);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Erro ao salvar ocorrência antes da liberação.');
    } finally {
      setSolicitandoLiberacao(false);
    }
  };

  const fecharModalHistoricoLiberacaoCpf = () => setModalHistoricoLiberacaoCpf(null);

  const confirmarModalHistoricoLiberacaoCpf = () => {
    const m = modalHistoricoLiberacaoCpf;
    if (!m?.pending) {
      fecharModalHistoricoLiberacaoCpf();
      return;
    }
    setLiberacaoModalCtx(m.pending);
    fecharModalHistoricoLiberacaoCpf();
  };

  /**
   * @param {'em-andamento'|'resolvido'} modo
   * @returns {Record<string, unknown>}
   */
  const buildPayloadParaEnvio = (modo) => {
    /** @type {Record<string, unknown>} */
    let payload = {
      tipo: formData.tipo,
      nome: formData.nome,
      cpf: formData.cpf.replace(/\D/g, ''),
      telefones: { lista: formData.telefones.lista.filter((t) => t.trim() !== '') },
      email: formData.email || '',
      observacoes: formData.observacoes,
      responsavel,
      userEmail: userEmail,
      updatedAt: new Date(),
    };

    if (modo === 'resolvido') {
      payload.Finalizado = {
        Resolvido: true,
        dataResolucao: new Date(),
      };
    }

    if (formData.tipo === 'BACEN') {
      payload = {
        ...payload,
        dataEntrada: formData.dataEntrada,
        origem: formData.origem,
        produto: formData.produto || '',
        anexos: formData.anexos,
        motivoReduzido: formData.motivoReduzido,
        motivoDetalhado: formData.motivoDetalhado,
        tentativasContato: {
          lista: formData.tentativasContato.lista.filter((t) => t.data || t.meio || t.resultado),
        },
        acionouCentral: formData.acionouCentral,
        protocolosCentral: formData.protocolosCentral.filter((p) => p.trim() !== ''),
        n2SegundoNivel: formData.n2SegundoNivel,
        protocolosN2: formData.protocolosN2.filter((p) => p.trim() !== ''),
        reclameAqui: formData.reclameAqui,
        protocolosReclameAqui: formData.protocolosReclameAqui.filter((p) => p.trim() !== ''),
        procon: formData.procon,
        protocolosProcon: formData.protocolosProcon.filter((p) => p.trim() !== ''),
        semRespostaCliente: formData.semRespostaCliente === true,
        liberacaoSolicitada: formData.liberacaoSolicitada === true,
        liberacaoAnterior: formData.liberacaoAnterior === true,
        pixLiberado: formData.pixLiberado,
        statusContratoQuitado: formData.statusContratoQuitado,
        statusContratoAberto: !formData.statusContratoQuitado,
        contratoCancelado: formData.contratoCancelado === true,
      };
    } else if (formData.tipo === 'OUVIDORIA') {
      payload = {
        ...payload,
        dataEntradaN2: formData.dataEntradaN2,
        origem: formData.origem || '',
        produto: formData.produto || '',
        motivoReduzido: formData.motivoReduzido,
        motivoDetalhado: formData.motivoDetalhado || '',
        anexos: formData.anexos,
        tentativasContato: {
          lista: formData.tentativasContato.lista.filter((t) => t.data || t.meio || t.resultado),
        },
        acionouCentral: formData.acionouCentral,
        protocolosCentral: formData.protocolosCentral.filter((p) => p.trim() !== ''),
        protocolosN2: (formData.protocolosN2 || []).filter((p) => p && String(p).trim() !== ''),
        reclameAqui: formData.reclameAqui,
        protocolosReclameAqui: formData.protocolosReclameAqui.filter((p) => p.trim() !== ''),
        procon: formData.procon,
        protocolosProcon: formData.protocolosProcon.filter((p) => p.trim() !== ''),
        semRespostaCliente: formData.semRespostaCliente === true,
        liberacaoSolicitada: formData.liberacaoSolicitada === true,
        liberacaoAnterior: formData.liberacaoAnterior === true,
        pixLiberado: formData.pixLiberado,
        statusContratoQuitado: formData.statusContratoQuitado,
        statusContratoAberto: !formData.statusContratoQuitado,
        contratoCancelado: formData.contratoCancelado === true,
      };
    } else if (formData.tipo === 'RECLAME_AQUI') {
      payload = {
        ...payload,
        cpfRepetido: formData.cpfRepetido || '',
        idEntrada: formData.idEntrada,
        dataReclam: formData.dataReclam,
        produto: formData.produto,
        motivoReduzido: formData.motivoReduzido,
        motivoDetalhado: formData.motivoDetalhado || '',
        passivelNotaMais: formData.passivelNotaMais,
        pixLiberado: formData.pixLiberado === true,
        statusContratoQuitado: formData.statusContratoQuitado,
        statusContratoAberto: !formData.statusContratoQuitado,
        enviarParaCobranca: formData.enviarParaCobranca || false,
        anexos: formData.anexos,
        solicitadoAvaliacao: formData.solicitadoAvaliacao,
        avaliado: formData.avaliado,
        acionouCentral: formData.acionouCentral,
        protocolosCentral: formData.protocolosCentral.filter((p) => p.trim() !== ''),
        n2SegundoNivel: formData.n2SegundoNivel,
        protocolosN2: formData.protocolosN2.filter((p) => p.trim() !== ''),
        reclameAqui: formData.reclameAqui,
        protocolosReclameAqui: formData.protocolosReclameAqui.filter((p) => p.trim() !== ''),
        procon: formData.procon,
        protocolosProcon: formData.protocolosProcon.filter((p) => p.trim() !== ''),
        semRespostaCliente: formData.semRespostaCliente === true,
        liberacaoSolicitada: formData.liberacaoSolicitada === true,
        liberacaoAnterior: formData.liberacaoAnterior === true,
        contratoCancelado: formData.contratoCancelado === true,
      };
    } else if (formData.tipo === 'PROCON') {
      payload = {
        ...payload,
        codigoProcon: formData.codigoProcon,
        dataProcon: formData.dataProcon,
        origem: formData.origem,
        produto: formData.produto,
        motivoReduzido: formData.motivoReduzido,
        motivoDetalhado: formData.motivoDetalhado || '',
        solucaoApresentada: formData.solucaoApresentada || '',
        processoAdministrativo: formData.processoAdministrativo || '',
        clienteDesistiu: formData.clienteDesistiu || false,
        encaminhadoJuridico: formData.encaminhadoJuridico || false,
        processoEncaminhadoResponsavel:
          formData.encaminhadoJuridico && formData.processoEncaminhadoResponsavel
            ? formData.processoEncaminhadoResponsavel
            : '',
        processoEncaminhadoData:
          formData.encaminhadoJuridico && formData.processoEncaminhadoData
            ? formData.processoEncaminhadoData
            : '',
        processoEncerrado: formData.processoEncerrado || false,
        dataProcessoEncerrado:
          formData.processoEncerrado && formData.dataProcessoEncerrado
            ? formData.dataProcessoEncerrado
            : '',
        registrosReclameAqui: formData.registrosReclameAqui || '',
        anexos: formData.anexos,
        acionouCentral: formData.acionouCentral,
        protocolosCentral: formData.protocolosCentral.filter((p) => p && String(p).trim() !== ''),
        n2SegundoNivel: formData.n2SegundoNivel,
        protocolosN2: formData.protocolosN2.filter((p) => p && String(p).trim() !== ''),
        reclameAqui: formData.reclameAqui,
        protocolosReclameAqui: formData.protocolosReclameAqui.filter((p) => p && String(p).trim() !== ''),
        pixLiberado: formData.pixLiberado || false,
        statusContratoQuitado: formData.statusContratoQuitado || false,
        semRespostaCliente: formData.semRespostaCliente === true,
        liberacaoSolicitada: formData.liberacaoSolicitada === true,
        liberacaoAnterior: formData.liberacaoAnterior === true,
        contratoCancelado: formData.contratoCancelado === true,
      };
    } else if (formData.tipo === 'PROCESSOS') {
      payload = {
        ...payload,
        nroProcesso: formData.nroProcesso,
        empresaAcionada: formData.empresaAcionada,
        dataEntrada: formData.dataEntradaProcesso,
        produto: formData.produto,
        motivoReduzido: formData.motivoReduzido,
        motivoDetalhado: formData.motivoDetalhado || '',
        audiencia: formData.audiencia || false,
        dataAudiencia: formData.audiencia && formData.dataAudiencia ? formData.dataAudiencia : '',
        situacaoAudiencia:
          formData.audiencia && formData.situacaoAudiencia ? formData.situacaoAudiencia : '',
        subsidios: formData.subsidios || '',
        outrosProtocolos: formData.outrosProtocolos || '',
        anexos: formData.anexos,
        acionouCentral: formData.acionouCentral,
        protocolosCentral: formData.protocolosCentral.filter((p) => p && String(p).trim() !== ''),
        n2SegundoNivel: formData.n2SegundoNivel,
        protocolosN2: formData.protocolosN2.filter((p) => p && String(p).trim() !== ''),
        reclameAqui: formData.reclameAqui,
        protocolosReclameAqui: formData.protocolosReclameAqui.filter((p) => p && String(p).trim() !== ''),
        procon: formData.procon,
        protocolosProcon: formData.protocolosProcon.filter((p) => p && String(p).trim() !== ''),
        semRespostaCliente: formData.semRespostaCliente === true,
        liberacaoSolicitada: formData.liberacaoSolicitada === true,
        liberacaoAnterior: formData.liberacaoAnterior === true,
        pixLiberado: formData.pixLiberado === true,
        statusContratoQuitado: formData.statusContratoQuitado === true,
        statusContratoAberto: formData.statusContratoQuitado !== true,
        contratoCancelado: formData.contratoCancelado === true,
      };
    } else if (formData.tipo === 'TIME_PORTABILIDADE') {
      payload = {
        ...payload,
        dataEntrada: formData.dataEntrada,
        origem: TIME_PORT_ORIGEM,
        produto: TIME_PORT_PRODUTO,
        motivoReduzido: [...TIME_PORT_MOTIVO_FIXO],
        motivoDetalhado: String(formData.motivoDetalhado || '').trim(),
        protocoloOctadesk: String(formData.protocoloOctadesk || '').trim(),
        pixLiberado: formData.pixLiberado === true,
        statusContratoQuitado: formData.statusContratoQuitado === true,
        statusContratoAberto: formData.statusContratoQuitado !== true,
        liberacaoSolicitada: formData.liberacaoSolicitada === true,
        contratoCancelado: formData.contratoCancelado === true,
      };
    }

    if (payload && typeof payload === 'object' && 'numeroProtocolo' in payload) {
      delete payload.numeroProtocolo;
    }

    const ticketReg = String(formData.ticketRegistro || '').trim();
    if (ticketReg) {
      payload.ticketRegistro = ticketReg;
    }

    return payload;
  };

  const persistirEmAndamentoOcorrencia = async () => {
    const { valid, errors } = validarFormulario();
    if (!valid) {
      exibirToastValidacao(errors);
      throw new Error('VALIDATION');
    }
    const id =
      reclamacao?._id != null
        ? String(reclamacao._id)
        : reclamacao?.id != null
          ? String(reclamacao.id)
          : '';
    if (!id) {
      throw new Error('Reclamação sem identificador.');
    }
    const payload = buildPayloadParaEnvio('em-andamento');
    await reclamacoesAPI.update(id, payload, formData.tipo);
    return id;
  };

  const handleGerarTicketOctadesk = async () => {
    const tipo = formData.tipo;
    if (!tipo || tipo === 'TIME_PORTABILIDADE') return;
    if (String(formData.ticketRegistro || '').trim()) {
      toast.error('Ticket de registro já preenchido.');
      return;
    }
    setGerandoTicketOcta(true);
    try {
      let id;
      try {
        id = await persistirEmAndamentoOcorrencia();
      } catch (err) {
        if (err?.message === 'VALIDATION') return;
        throw err;
      }
      const res = await reclamacoesAPI.gerarTicketOctadesk(id, tipo);
      const num =
        res?.data?.ticketRegistro != null
          ? String(res.data.ticketRegistro).trim()
          : '';
      if (!num) {
        toast.error(res?.message || 'Octadesk não retornou número do ticket.');
        return;
      }
      setFormData((prev) => ({ ...prev, ticketRegistro: num }));
      if (res?.data?.alreadyExists) {
        toast.success('Ticket já vinculado — número exibido no campo.');
      } else if (res?.data?.octadeskFinalizeWarning) {
        toast.success('Ocorrência salva e ticket Octadesk criado.');
      } else {
        toast.success('Ocorrência salva e ticket Octadesk gerado.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Erro ao gerar ticket Octadesk.');
    } finally {
      setGerandoTicketOcta(false);
    }
  };

  const handleLiberacaoPixSucesso = (res) => {
    const idStr = res?.data?._id != null ? String(res.data._id) : '';
    setFormData((prev) => ({
      ...prev,
      liberacaoSolicitada: true,
      feedbackSolicitarLiberacao: idStr ? `Req_Prod: ${idStr}` : 'Liberação solicitada (Req_Prod).',
    }));
    toast.success('Liberação solicitada e ocorrência salva.');
  };

  // Atualizar formData quando reclamacao mudar
  useEffect(() => {
    if (reclamacao) {
      const novoFormData = converterParaFormData(reclamacao);
      if (novoFormData) {
        setFormData(novoFormData);
      }
    }
  }, [reclamacao]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSaveOptions && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSaveOptions(false);
      }
    };

    if (showSaveOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSaveOptions]);


  /**
   * Validar formulário
   */
  const validarFormulario = () => {
    const novosErros = {};

    // Validações comuns
    if (!formData.nome.trim()) {
      novosErros.nome = 'Nome é obrigatório';
    }
    if (!validarCPF(formData.cpf)) {
      novosErros.cpf = 'CPF inválido';
    }

    // Validações BACEN
    if (formData.tipo === 'BACEN') {
      if (!formData.dataEntrada) {
        novosErros.dataEntrada = 'Data de entrada é obrigatória';
      }
      if (!formData.origem) {
        novosErros.origem = 'Origem é obrigatória';
      }
      if (!formData.motivoReduzido || formData.motivoReduzido.length === 0) {
        novosErros.motivoReduzido = 'Selecione pelo menos um motivo';
      }
      if (!formData.motivoDetalhado.trim()) {
        novosErros.motivoDetalhado = 'Descrição é obrigatória';
      }
    }

    // Validações OUVIDORIA
    if (formData.tipo === 'OUVIDORIA') {
      if (!formData.dataEntradaN2) {
        novosErros.dataEntradaN2 = 'Data entrada atendimento é obrigatória';
      }
      if (!formData.motivoReduzido || formData.motivoReduzido.length === 0) {
        novosErros.motivoReduzido = 'Selecione pelo menos um motivo';
      }
      if (!formData.origem) {
        novosErros.origem = 'Origem é obrigatória';
      }
    }
    
    // Validações RECLAME_AQUI
    if (formData.tipo === 'RECLAME_AQUI') {
      if (!formData.idEntrada || formData.idEntrada.replace(/\D/g, '').length !== 9) {
        novosErros.idEntrada = 'ID Entrada deve ter 9 dígitos numéricos';
      }
      if (!formData.dataReclam) {
        novosErros.dataReclam = 'Data da ocorrência é obrigatória';
      }
      if (!formData.produto) {
        novosErros.produto = 'Produto é obrigatório';
      }
      if (!formData.motivoReduzido || formData.motivoReduzido.length === 0) {
        novosErros.motivoReduzido = 'Selecione pelo menos um motivo';
      }
    }
    
    // Validações PROCON
    if (formData.tipo === 'PROCON') {
      if (!formData.origem || !['Procon', 'Consumidor.gov'].includes(formData.origem)) {
        novosErros.origem = 'Origem é obrigatória';
      }
      if (!formData.codigoProcon || formData.codigoProcon.length !== 16) {
        novosErros.codigoProcon = 'Código Procon deve ter 16 caracteres';
      }
      if (!formData.dataProcon) {
        novosErros.dataProcon = 'Data Procon é obrigatória';
      }
      if (!formData.produto) {
        novosErros.produto = 'Produto é obrigatório';
      }
      if (!formData.motivoReduzido || formData.motivoReduzido.length === 0) {
        novosErros.motivoReduzido = 'Selecione pelo menos um motivo';
      }
    }
    
    // Validações PROCESSOS (Ação Judicial)
    if (formData.tipo === 'PROCESSOS') {
      if (!formData.nroProcesso) {
        novosErros.nroProcesso = 'Número do Processo é obrigatório';
      }
      if (!formData.empresaAcionada) {
        novosErros.empresaAcionada = 'Empresa Acionada é obrigatória';
      }
      if (!formData.dataEntradaProcesso) {
        novosErros.dataEntradaProcesso = 'Data de Entrada é obrigatória';
      }
      if (!formData.produto) {
        novosErros.produto = 'Produto é obrigatório';
      }
      if (!formData.motivoReduzido || formData.motivoReduzido.length === 0) {
        novosErros.motivoReduzido = 'Selecione pelo menos um motivo';
      }
    }

    if (formData.tipo === 'TIME_PORTABILIDADE') {
      if (!formData.dataEntrada) {
        novosErros.dataEntrada = 'Data de entrada é obrigatória';
      }
      if (!String(formData.protocoloOctadesk || '').trim()) {
        novosErros.protocoloOctadesk = 'Protocolo Octadesk é obrigatório';
      }
      if (!String(formData.motivoDetalhado || '').trim()) {
        novosErros.motivoDetalhado = 'Descrição é obrigatória';
      }
    }
    
    // Validações RECLAME_AQUI
    if (formData.tipo === 'RECLAME_AQUI') {
      if (!formData.idEntrada || formData.idEntrada.replace(/\D/g, '').length !== 9) {
        novosErros.idEntrada = 'ID Entrada deve ter 9 dígitos numéricos';
      }
      if (!formData.dataReclam) {
        novosErros.dataReclam = 'Data da ocorrência é obrigatória';
      }
      if (!formData.motivoReduzido || formData.motivoReduzido.length === 0) {
        novosErros.motivoReduzido = 'Selecione pelo menos um motivo';
      }
    }

    setErrors(novosErros);
    return { valid: Object.keys(novosErros).length === 0, errors: novosErros };
  };

  /**
   * Toast de acordo com o erro de validação (prioridade: data de entrada)
   */
  const exibirToastValidacao = (errors) => {
    const camposDataEntrada = ['dataEntrada', 'dataEntradaN2', 'dataReclam', 'dataProcon', 'dataEntradaProcesso'];
    const erroData = camposDataEntrada.find(c => errors[c]);
    if (erroData) {
      toast.error(errors[erroData]);
      return;
    }
    if (errors.protocoloOctadesk) {
      toast.error(errors.protocoloOctadesk);
      return;
    }
    if (errors.motivoDetalhado) {
      toast.error(errors.motivoDetalhado);
      return;
    }
    toast.error('Por favor, preencha todos os campos obrigatórios');
  };

  /**
   * Submeter formulário
   */
  const handleSubmit = async (e, modo = null) => {
    e.preventDefault();

    // Se não foi passado um modo, mostrar opções
    if (!modo) {
      setShowSaveOptions(true);
      return;
    }

    const { valid, errors } = validarFormulario();
    if (!valid) {
      exibirToastValidacao(errors);
      setShowSaveOptions(false);
      return;
    }

    setLoading(true);
    setShowSaveOptions(false);
    try {
      // Montar payload baseado no tipo
      let payload = {
        tipo: formData.tipo,
        nome: formData.nome,
        cpf: formData.cpf.replace(/\D/g, ''),
        telefones: { lista: formData.telefones.lista.filter(t => t.trim() !== '') },
        email: formData.email || '',
        observacoes: formData.observacoes,
        responsavel: responsavel,
        userEmail: userEmail,
        updatedAt: new Date(),
      };

      // Adicionar objeto Finalizado se modo for "resolvido"
      if (modo === 'resolvido') {
        payload.Finalizado = {
          Resolvido: true,
          dataResolucao: new Date()
        };
      }

      // Adicionar campos específicos por tipo
      if (formData.tipo === 'BACEN') {
        payload = {
          ...payload,
          dataEntrada: formData.dataEntrada,
          origem: formData.origem,
          produto: formData.produto || '',
          anexos: formData.anexos,
          motivoReduzido: formData.motivoReduzido,
          motivoDetalhado: formData.motivoDetalhado,
          tentativasContato: { lista: formData.tentativasContato.lista.filter(t => t.data || t.meio || t.resultado) },
          acionouCentral: formData.acionouCentral,
          protocolosCentral: formData.protocolosCentral.filter(p => p.trim() !== ''),
          n2SegundoNivel: formData.n2SegundoNivel,
          protocolosN2: formData.protocolosN2.filter(p => p.trim() !== ''),
          reclameAqui: formData.reclameAqui,
          protocolosReclameAqui: formData.protocolosReclameAqui.filter(p => p.trim() !== ''),
          procon: formData.procon,
          protocolosProcon: formData.protocolosProcon.filter(p => p.trim() !== ''),
          semRespostaCliente: formData.semRespostaCliente === true,
          liberacaoSolicitada: formData.liberacaoSolicitada === true,
          liberacaoAnterior: formData.liberacaoAnterior === true,
          pixLiberado: formData.pixLiberado,
          statusContratoQuitado: formData.statusContratoQuitado,
          statusContratoAberto: !formData.statusContratoQuitado,
          contratoCancelado: formData.contratoCancelado === true,
        };
      } else if (formData.tipo === 'OUVIDORIA') {
        payload = {
          ...payload,
          dataEntradaN2: formData.dataEntradaN2,
          origem: formData.origem || '',
          produto: formData.produto || '',
          motivoReduzido: formData.motivoReduzido,
          motivoDetalhado: formData.motivoDetalhado || '',
          anexos: formData.anexos,
          tentativasContato: { lista: formData.tentativasContato.lista.filter(t => t.data || t.meio || t.resultado) },
          acionouCentral: formData.acionouCentral,
          protocolosCentral: formData.protocolosCentral.filter(p => p.trim() !== ''),
          protocolosN2: (formData.protocolosN2 || []).filter(p => p && String(p).trim() !== ''),
          reclameAqui: formData.reclameAqui,
          protocolosReclameAqui: formData.protocolosReclameAqui.filter(p => p.trim() !== ''),
          procon: formData.procon,
          protocolosProcon: formData.protocolosProcon.filter(p => p.trim() !== ''),
          semRespostaCliente: formData.semRespostaCliente === true,
          liberacaoSolicitada: formData.liberacaoSolicitada === true,
          liberacaoAnterior: formData.liberacaoAnterior === true,
          pixLiberado: formData.pixLiberado,
          statusContratoQuitado: formData.statusContratoQuitado,
          statusContratoAberto: !formData.statusContratoQuitado,
          contratoCancelado: formData.contratoCancelado === true,
        };
      } else if (formData.tipo === 'RECLAME_AQUI') {
        payload = {
          ...payload,
          cpfRepetido: formData.cpfRepetido || '',
          idEntrada: formData.idEntrada,
          dataReclam: formData.dataReclam,
          produto: formData.produto,
          motivoReduzido: formData.motivoReduzido,
          motivoDetalhado: formData.motivoDetalhado || '',
          passivelNotaMais: formData.passivelNotaMais,
          pixLiberado: formData.pixLiberado === true,
          statusContratoQuitado: formData.statusContratoQuitado,
          statusContratoAberto: !formData.statusContratoQuitado,
          enviarParaCobranca: formData.enviarParaCobranca || false,
          anexos: formData.anexos,
          solicitadoAvaliacao: formData.solicitadoAvaliacao,
          avaliado: formData.avaliado,
          // Tratativa N1: Canais de atendimento e protocolos acionados
          acionouCentral: formData.acionouCentral,
          protocolosCentral: formData.protocolosCentral.filter(p => p.trim() !== ''),
          n2SegundoNivel: formData.n2SegundoNivel,
          protocolosN2: formData.protocolosN2.filter(p => p.trim() !== ''),
          reclameAqui: formData.reclameAqui,
          protocolosReclameAqui: formData.protocolosReclameAqui.filter(p => p.trim() !== ''),
          procon: formData.procon,
          protocolosProcon: formData.protocolosProcon.filter(p => p.trim() !== ''),
          semRespostaCliente: formData.semRespostaCliente === true,
          liberacaoSolicitada: formData.liberacaoSolicitada === true,
          liberacaoAnterior: formData.liberacaoAnterior === true,
          contratoCancelado: formData.contratoCancelado === true,
        };
      } else if (formData.tipo === 'PROCON') {
        payload = {
          ...payload,
          codigoProcon: formData.codigoProcon,
          dataProcon: formData.dataProcon,
          origem: formData.origem,
          produto: formData.produto,
          motivoReduzido: formData.motivoReduzido,
          motivoDetalhado: formData.motivoDetalhado || '',
          solucaoApresentada: formData.solucaoApresentada || '',
          processoAdministrativo: formData.processoAdministrativo || '',
          clienteDesistiu: formData.clienteDesistiu || false,
          encaminhadoJuridico: formData.encaminhadoJuridico || false,
          processoEncaminhadoResponsavel: formData.encaminhadoJuridico && formData.processoEncaminhadoResponsavel ? formData.processoEncaminhadoResponsavel : '',
          processoEncaminhadoData: formData.encaminhadoJuridico && formData.processoEncaminhadoData ? formData.processoEncaminhadoData : '',
          processoEncerrado: formData.processoEncerrado || false,
          dataProcessoEncerrado: formData.processoEncerrado && formData.dataProcessoEncerrado ? formData.dataProcessoEncerrado : '',
          registrosReclameAqui: formData.registrosReclameAqui || '',
          anexos: formData.anexos,
          // Tratativa N1: Canais de atendimento e protocolos acionados (schema Procon não inclui procon/protocolosProcon)
          acionouCentral: formData.acionouCentral,
          protocolosCentral: formData.protocolosCentral.filter(p => p && String(p).trim() !== ''),
          n2SegundoNivel: formData.n2SegundoNivel,
          protocolosN2: formData.protocolosN2.filter(p => p && String(p).trim() !== ''),
          reclameAqui: formData.reclameAqui,
          protocolosReclameAqui: formData.protocolosReclameAqui.filter(p => p && String(p).trim() !== ''),
          pixLiberado: formData.pixLiberado || false,
          statusContratoQuitado: formData.statusContratoQuitado || false,
          semRespostaCliente: formData.semRespostaCliente === true,
          liberacaoSolicitada: formData.liberacaoSolicitada === true,
          liberacaoAnterior: formData.liberacaoAnterior === true,
          contratoCancelado: formData.contratoCancelado === true,
        };
      } else if (formData.tipo === 'PROCESSOS') {
        payload = {
          ...payload,
          nroProcesso: formData.nroProcesso,
          empresaAcionada: formData.empresaAcionada,
          dataEntrada: formData.dataEntradaProcesso,
          produto: formData.produto,
          motivoReduzido: formData.motivoReduzido,
          motivoDetalhado: formData.motivoDetalhado || '',
          audiencia: formData.audiencia || false,
          dataAudiencia: formData.audiencia && formData.dataAudiencia ? formData.dataAudiencia : '',
          situacaoAudiencia: formData.audiencia && formData.situacaoAudiencia ? formData.situacaoAudiencia : '',
          subsidios: formData.subsidios || '',
          outrosProtocolos: formData.outrosProtocolos || '',
          anexos: formData.anexos,
          acionouCentral: formData.acionouCentral,
          protocolosCentral: formData.protocolosCentral.filter((p) => p && String(p).trim() !== ''),
          n2SegundoNivel: formData.n2SegundoNivel,
          protocolosN2: formData.protocolosN2.filter((p) => p && String(p).trim() !== ''),
          reclameAqui: formData.reclameAqui,
          protocolosReclameAqui: formData.protocolosReclameAqui.filter((p) => p && String(p).trim() !== ''),
          procon: formData.procon,
          protocolosProcon: formData.protocolosProcon.filter((p) => p && String(p).trim() !== ''),
          semRespostaCliente: formData.semRespostaCliente === true,
          liberacaoSolicitada: formData.liberacaoSolicitada === true,
          liberacaoAnterior: formData.liberacaoAnterior === true,
          pixLiberado: formData.pixLiberado === true,
          statusContratoQuitado: formData.statusContratoQuitado === true,
          statusContratoAberto: formData.statusContratoQuitado !== true,
          contratoCancelado: formData.contratoCancelado === true,
        };
      } else if (formData.tipo === 'TIME_PORTABILIDADE') {
        payload = {
          ...payload,
          dataEntrada: formData.dataEntrada,
          origem: TIME_PORT_ORIGEM,
          produto: TIME_PORT_PRODUTO,
          motivoReduzido: [...TIME_PORT_MOTIVO_FIXO],
          motivoDetalhado: String(formData.motivoDetalhado || '').trim(),
          protocoloOctadesk: String(formData.protocoloOctadesk || '').trim(),
          pixLiberado: formData.pixLiberado === true,
          statusContratoQuitado: formData.statusContratoQuitado === true,
          statusContratoAberto: formData.statusContratoQuitado !== true,
          liberacaoSolicitada: formData.liberacaoSolicitada === true,
          contratoCancelado: formData.contratoCancelado === true,
        };
      }

      if (payload && typeof payload === 'object' && 'numeroProtocolo' in payload) {
        delete payload.numeroProtocolo;
      }

      const ticketReg = String(formData.ticketRegistro || '').trim();
      if (ticketReg) {
        payload.ticketRegistro = ticketReg;
      }

      const resultado = await reclamacoesAPI.update(reclamacao._id, payload, formData.tipo);
      
      const mensagem = modo === 'resolvido' 
        ? 'Ocorrência atualizada como Resolvida com sucesso!'
        : 'Ocorrência atualizada como Em Andamento com sucesso!';
      toast.success(mensagem);
      
      if (onSuccess) {
        onSuccess(resultado);
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Erro ao atualizar ocorrência:', error);
      toast.error(error.message || 'Erro ao atualizar ocorrência');
    } finally {
      setLoading(false);
    }
  };

  // Funções auxiliares para arrays dinâmicos
  const adicionarTelefone = () => {
    setFormData(prev => ({
      ...prev,
      telefones: { lista: [...prev.telefones.lista, ''] }
    }));
  };

  const removerTelefone = (index) => {
    setFormData(prev => ({
      ...prev,
      telefones: { lista: prev.telefones.lista.filter((_, i) => i !== index) }
    }));
  };

  const atualizarTelefone = (index, valor) => {
    const novasLista = [...formData.telefones.lista];
    novasLista[index] = formatTelefone(valor);
    setFormData(prev => ({ ...prev, telefones: { lista: novasLista } }));
  };

  const adicionarTentativa = () => {
    setFormData(prev => ({
      ...prev,
      tentativasContato: { 
        lista: [...prev.tentativasContato.lista, { data: '', meio: '', resultado: '' }] 
      }
    }));
  };

  const removerTentativa = (index) => {
    setFormData(prev => ({
      ...prev,
      tentativasContato: { 
        lista: prev.tentativasContato.lista.filter((_, i) => i !== index) 
      }
    }));
  };

  const adicionarProtocolo = (campo) => {
    setFormData(prev => ({
      ...prev,
      [campo]: [...prev[campo], '']
    }));
  };

  const removerProtocolo = (campo, index) => {
    setFormData(prev => ({
      ...prev,
      [campo]: prev[campo].filter((_, i) => i !== index)
    }));
  };

  const atualizarProtocolo = (campo, index, valor) => {
    const novaLista = [...formData[campo]];
    novaLista[index] = valor;
    setFormData(prev => ({ ...prev, [campo]: novaLista }));
  };

  // Renderizar campos específicos BACEN
  const renderCamposBacen = () => (
    <>
      <div className="velohub-card">
        <h3 className="text-xl font-semibold mb-4 velohub-title">Ocorrência</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <FloatingLabelField
              id="form-fr-edit-bacen-origem"
              label="Origem"
              required
              value={formData.origem}
              error={errors.origem}
            >
              <select
                value={formData.origem}
                onChange={(e) => setFormData(prev => ({ ...prev, origem: e.target.value }))}
                className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                required
              >
                <option value="">Selecione...</option>
                <option value="Bacen Celcoin">Bacen Celcoin</option>
                <option value="Bacen Via Capital">Bacen Via Capital</option>
              </select>
            </FloatingLabelField>
          </div>

          <div>
            <FloatingLabelField id="form-fr-edit-bacen-produto" label="Produto" value={formData.produto}>
              <select
                value={formData.produto}
                onChange={(e) => setFormData(prev => ({ ...prev, produto: e.target.value }))}
                className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Selecione...</option>
                <option value="Antecipação 2026">Antecipação 2026</option>
                <option value="Antecipação">Antecipação Outros Anos</option>
                <option value="Empréstimo Pessoal">Empréstimo Pessoal</option>
                <option value="Crédito Trabalhador">Crédito Trabalhador</option>
              </select>
            </FloatingLabelField>
          </div>

          <div>
            <FloatingLabelField
              id="form-fr-edit-bacen-data-entrada"
              label="Data de Entrada"
              required
              value={formData.dataEntrada}
              error={errors.dataEntrada}
            >
              <input
                type="date"
                value={formData.dataEntrada}
                onChange={(e) => setFormData(prev => ({ ...prev, dataEntrada: e.target.value }))}
                className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                required
              />
            </FloatingLabelField>
          </div>
        </div>

        <div className="mb-4">
          {renderCampoMotivo(
            MOTIVOS_REDUZIDOS,
            formData.motivoReduzido,
            (novosMotivos) => setFormData(prev => ({ ...prev, motivoReduzido: novosMotivos })),
            errors.motivoReduzido,
            'Motivo *',
            'motivo-bacen-edit'
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Prazo (automático — 10 dias após a criação do registro):{' '}
          <span className="font-medium text-gray-800 dark:text-gray-200">
            {dataPrazoAutomaticoParaExibicao('BACEN', reclamacao) || '—'}
          </span>
        </p>

        <div className="mb-4">
          <FloatingLabelField
            id="form-fr-edit-bacen-descricao"
            label="Descrição"
            required
            value={formData.motivoDetalhado}
            error={errors.motivoDetalhado}
          >
            <textarea
              value={formData.motivoDetalhado}
              onChange={(e) => setFormData(prev => ({ ...prev, motivoDetalhado: e.target.value }))}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              rows={4}
              placeholder="Descreva detalhadamente a ocorrência..."
              required
            />
          </FloatingLabelField>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Anexo
          </label>
          <input
            type="file"
            onChange={async (e) => {
              const files = Array.from(e.target.files);
              if (files.length === 0) return;
              
              const uploadPromises = files.map(async (file) => {
                try {
                  const resultado = await anexosAPI.upload(file, formData.tipo);
                  return resultado.url;
                } catch (error) {
                  console.error('Erro ao fazer upload do anexo:', error);
                  toast.error(`Erro ao fazer upload de ${file.name}: ${error.message}`);
                  return null;
                }
              });
              
              const urls = await Promise.all(uploadPromises);
              const urlsValidas = urls.filter(url => url !== null);
              
              setFormData(prev => ({ 
                ...prev, 
                anexos: [...prev.anexos, ...urlsValidas]
              }));
              
              if (urlsValidas.length > 0) {
                toast.success(`${urlsValidas.length} arquivo(s) enviado(s) com sucesso`);
              }
            }}
            className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            multiple
          />
          <small className="text-xs text-gray-600 dark:text-gray-400">
            Você pode selecionar múltiplos arquivos. Os arquivos serão enviados automaticamente.
          </small>
          {formData.anexos.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Arquivos enviados ({formData.anexos.length}):
              </p>
              <ul className="text-xs text-gray-500 dark:text-gray-400 list-disc list-inside">
                {formData.anexos.map((url, index) => (
                  <li key={index} className="truncate">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Anexo {index + 1}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );

  // Renderizar campos específicos OUVIDORIA
  const renderCamposOuvidoria = () => (
    <>
      <div className="velohub-card">
        <h3 className="text-xl font-semibold mb-4 velohub-title">Ocorrência</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <FloatingLabelField id="form-fr-edit-n2-produto" label="Produto" value={formData.produto}>
              <select
                value={formData.produto}
                onChange={(e) => setFormData(prev => ({ ...prev, produto: e.target.value }))}
                className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Selecione...</option>
                <option value="Antecipação">Antecipação Outros Anos</option>
                <option value="Antecipação 2026">Antecipação 2026</option>
                <option value="Conta Celcoin">Conta Celcoin</option>
                <option value="Empréstimo Pessoal">Empréstimo Pessoal</option>
                <option value="Seguros">Seguros</option>
                <option value="Crédito Trabalhador">Crédito Trabalhador</option>
              </select>
            </FloatingLabelField>
          </div>

          <div>
            <FloatingLabelField
              id="form-fr-edit-n2-origem"
              label="Origem"
              required
              value={formData.origem}
              error={errors.origem}
            >
              <select
                value={formData.origem}
                onChange={(e) => setFormData(prev => ({ ...prev, origem: e.target.value }))}
                className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                required
              >
                <option value="">Selecione...</option>
                <option value="Atendimento">Atendimento</option>
                <option value="Chatbot">Chatbot</option>
              </select>
            </FloatingLabelField>
          </div>

          <div>
            <FloatingLabelField
              id="form-fr-edit-n2-data-entrada"
              label="Data de Entrada"
              required
              value={formData.dataEntradaN2}
              error={errors.dataEntradaN2}
            >
              <input
                type="date"
                value={formData.dataEntradaN2}
                onChange={(e) => setFormData(prev => ({ ...prev, dataEntradaN2: e.target.value }))}
                className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                required
              />
            </FloatingLabelField>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Prazo (automático — 2 dias após a criação do registro):{' '}
          <span className="font-medium text-gray-800 dark:text-gray-200">
            {dataPrazoAutomaticoParaExibicao('OUVIDORIA', reclamacao) || '—'}
          </span>
        </p>

        {/* Linha 2: Motivo | Protocolo N2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            {renderCampoMotivo(
              MOTIVOS_REDUZIDOS,
              formData.motivoReduzido,
              (novosMotivos) => setFormData(prev => ({ ...prev, motivoReduzido: novosMotivos })),
              errors.motivoReduzido,
              'Motivo *',
              'motivo-n2-edit'
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Protocolo N2
            </label>
            {(formData.protocolosN2?.length > 0 ? formData.protocolosN2 : ['']).map((p, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={p}
                  onChange={(e) => atualizarProtocolo('protocolosN2', i, e.target.value)}
                  className="min-h-12 box-border flex-1 rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Nro protocolo"
                />
                {(formData.protocolosN2?.length || 0) > 1 && (
                  <button type="button" onClick={() => removerProtocolo('protocolosN2', i)} className="text-sm px-2 text-red-600">Remover</button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => adicionarProtocolo('protocolosN2')}
              className="inline-flex h-12 min-h-12 box-border items-center justify-center rounded border px-3 text-sm dark:bg-gray-700"
              style={{ borderColor: '#006AB9', color: '#006AB9', background: 'transparent' }}
            >
              + Adicionar protocolo
            </button>
          </div>
        </div>

        <div className="mb-4">
          <FloatingLabelField id="form-fr-edit-n2-descricao" label="Descrição" value={formData.motivoDetalhado}>
            <textarea
              value={formData.motivoDetalhado}
              onChange={(e) => setFormData(prev => ({ ...prev, motivoDetalhado: e.target.value }))}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              rows={4}
              placeholder="Descreva detalhadamente a ocorrência..."
            />
          </FloatingLabelField>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Anexo
          </label>
          <input
            type="file"
            onChange={async (e) => {
              const files = Array.from(e.target.files);
              if (files.length === 0) return;
              
              const uploadPromises = files.map(async (file) => {
                try {
                  const resultado = await anexosAPI.upload(file, formData.tipo);
                  return resultado.url;
                } catch (error) {
                  console.error('Erro ao fazer upload do anexo:', error);
                  toast.error(`Erro ao fazer upload de ${file.name}: ${error.message}`);
                  return null;
                }
              });
              
              const urls = await Promise.all(uploadPromises);
              const urlsValidas = urls.filter(url => url !== null);
              
              setFormData(prev => ({ 
                ...prev, 
                anexos: [...prev.anexos, ...urlsValidas]
              }));
              
              if (urlsValidas.length > 0) {
                toast.success(`${urlsValidas.length} arquivo(s) enviado(s) com sucesso`);
              }
            }}
            className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            multiple
          />
          <small className="text-xs text-gray-600 dark:text-gray-400">
            Você pode selecionar múltiplos arquivos. Os arquivos serão enviados automaticamente.
          </small>
          {formData.anexos.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Arquivos enviados ({formData.anexos.length}):
              </p>
              <ul className="text-xs text-gray-500 dark:text-gray-400 list-disc list-inside">
                {formData.anexos.map((url, index) => (
                  <li key={index} className="truncate">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Anexo {index + 1}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );

  /**
   * Renderizar campos específicos Reclame Aqui
   */
  const renderCamposReclameAqui = () => {
    // Validar ID Entrada (9 dígitos numéricos)
    const validarIdEntrada = (id) => {
      const cleaned = id.replace(/\D/g, '');
      return cleaned.length === 9;
    };

    return (
      <>
        {/* Ocorrência Reclame Aqui */}
        <div className="velohub-card">
          <h3 className="text-xl font-semibold mb-4 velohub-title">Ocorrência</h3>
          
          {/* Linha 1: ID Entrada | Data Ocorrência (dataReclam) | CPF Repetido | Produto */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <FloatingLabelField
                id="form-fr-edit-ra-id-entrada"
                label="ID Entrada (9 dígitos)"
                required
                value={formData.idEntrada}
                error={errors.idEntrada}
              >
                <input
                  type="text"
                  value={formData.idEntrada}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 9);
                    setFormData(prev => ({ ...prev, idEntrada: cleaned }));
                  }}
                  className={`min-h-12 box-border w-full rounded-lg border px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
                    validarIdEntrada(formData.idEntrada) ? 'border-green-500 border-2' : 'border-gray-400 dark:border-gray-500'
                  }`}
                  placeholder="000000000"
                  maxLength={9}
                  required
                />
              </FloatingLabelField>
            </div>

            <div>
              <FloatingLabelField
                id="form-fr-edit-ra-data-ocorrencia"
                label="Data Ocorrência"
                required
                value={formData.dataReclam}
                error={errors.dataReclam}
              >
                <input
                  type="date"
                  value={formData.dataReclam}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataReclam: e.target.value }))}
                  className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                  required
                />
              </FloatingLabelField>
            </div>

            <div>
              <FloatingLabelField id="form-fr-edit-ra-cpf-repetido" label="CPF Repetido" value={formData.cpfRepetido}>
                <input
                  type="text"
                  value={formData.cpfRepetido}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '');
                    setFormData(prev => ({ ...prev, cpfRepetido: cleaned }));
                  }}
                  className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Apenas números"
                />
              </FloatingLabelField>
            </div>

            <div>
              <FloatingLabelField
                id="form-fr-edit-ra-produto"
                label="Produto"
                required
                value={formData.produto}
                error={errors.produto}
              >
                <select
                  value={formData.produto}
                  onChange={(e) => setFormData(prev => ({ ...prev, produto: e.target.value }))}
                  className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                  required
                >
                  <option value="">Selecione...</option>
                  <option value="Antecipação">Antecipação Outros Anos</option>
                  <option value="Antecipação 2026">Antecipação 2026</option>
                  <option value="Aplicativo">Aplicativo</option>
                  <option value="Conta Celcoin">Conta Celcoin</option>
                  <option value="Crédito Trabalhador">Crédito Trabalhador</option>
                  <option value="Clube Velotax">Clube Velotax</option>
                  <option value="Empréstimo Pessoal">Empréstimo Pessoal</option>
                  <option value="Cupom">Cupom</option>
                  <option value="Seguros">Seguros</option>
                  <option value="Veloprime">Veloprime</option>
                  <option value="Desativado">Desativado</option>
                </select>
              </FloatingLabelField>
            </div>
          </div>

          {/* Linha 2: Motivo */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
            {renderCampoMotivo(
              MOTIVOS_RECLAME_AQUI,
              formData.motivoReduzido,
              (novosMotivos) => setFormData(prev => ({ ...prev, motivoReduzido: novosMotivos })),
              errors.motivoReduzido,
              'Motivo *',
              'motivo-reclame-aqui-edit'
            )}
          </div>

          {/* Descrição */}
          <div className="mb-4">
            <FloatingLabelField id="form-fr-edit-ra-descricao" label="Descrição" value={formData.motivoDetalhado}>
              <textarea
                value={formData.motivoDetalhado}
                onChange={(e) => setFormData(prev => ({ ...prev, motivoDetalhado: e.target.value }))}
                className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                rows={4}
                placeholder="Descreva detalhadamente a ocorrência..."
              />
            </FloatingLabelField>
          </div>

          {/* Solicitado Avaliação, Avaliado e Passível de nota + (abaixo do Descrição) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.solicitadoAvaliacao}
                  onChange={(e) => setFormData(prev => ({ ...prev, solicitadoAvaliacao: e.target.checked }))}
                  className="w-5 h-5"
                />
                <span>Solicitado Avaliação</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.avaliado}
                  onChange={(e) => setFormData(prev => ({ ...prev, avaliado: e.target.checked }))}
                  className="w-5 h-5"
                />
                <span>Avaliado</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.passivelNotaMais}
                  onChange={(e) => setFormData(prev => ({ ...prev, passivelNotaMais: e.target.checked }))}
                  className="w-5 h-5"
                />
                <span>Passível de nota +</span>
              </label>
            </div>
          </div>

          {/* Anexo */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Anexo
            </label>
            <input
              type="file"
              onChange={async (e) => {
                const files = Array.from(e.target.files);
                if (files.length === 0) return;
                
                // Upload de cada arquivo
                const uploadPromises = files.map(async (file) => {
                  try {
                    const resultado = await anexosAPI.upload(file, formData.tipo);
                    return resultado.url;
                  } catch (error) {
                    console.error('Erro ao fazer upload do anexo:', error);
                    toast.error(`Erro ao fazer upload de ${file.name}: ${error.message}`);
                    return null;
                  }
                });
                
                const urls = await Promise.all(uploadPromises);
                const urlsValidas = urls.filter(url => url !== null);
                
                setFormData(prev => ({ 
                  ...prev, 
                  anexos: [...prev.anexos, ...urlsValidas]
                }));
                
                if (urlsValidas.length > 0) {
                  toast.success(`${urlsValidas.length} arquivo(s) enviado(s) com sucesso`);
                }
              }}
              className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              multiple
            />
            <small className="text-xs text-gray-600 dark:text-gray-400">
              Você pode selecionar múltiplos arquivos. Os arquivos serão enviados automaticamente.
            </small>
            {formData.anexos.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Arquivos enviados ({formData.anexos.length}):
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 list-disc list-inside">
                  {formData.anexos.map((url, index) => (
                    <li key={index} className="truncate">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Anexo {index + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  /**
   * Localizar Atendimentos por CPF: busca em todas as collections e preenche
   * acionouCentral/protocolosCentral, n2SegundoNivel/protocolosN2, reclameAqui/protocolosReclameAqui,
   * procon/protocolosProcon, pixLiberado e statusContratoQuitado conforme encontrado.
   * Lógica por tipo: BACEN busca N1, N2, Reclame Aqui, Procon; N2 busca N1, Reclame Aqui, Procon (sem n2SegundoNivel);
   * Reclame Aqui busca N1, N2, Procon; Procon busca N1, N2, Reclame Aqui.
   * @param {string} tipoExcluir - Tipo do form atual (BACEN, OUVIDORIA, RECLAME_AQUI, PROCON) - excluído da busca
   */
  const localizarAtendimentos = async (tipoExcluir = 'PROCON', opts = {}) => {
    const silencioso = opts?.silencioso === true;
    if (!formData.cpf || formData.cpf.replace(/\D/g, '').length !== 11) {
      toast.error('CPF inválido. Preencha o CPF do cliente primeiro.');
      return;
    }

    setBuscandoReclameAqui(true);
    try {
      const cpfLimpo = formData.cpf.replace(/\D/g, '');
      const resultado = await reclamacoesAPI.getByCpf(cpfLimpo);
      const todasReclamacoes = Array.isArray(resultado) ? resultado : (resultado?.data || []);

      const docIdStr = (r) => normalizeMongoId(r?._id ?? r?.id);
      const currentIdStr = normalizeMongoId(reclamacao?._id ?? reclamacao?.id);
      const todasMenosAtual = currentIdStr
        ? todasReclamacoes.filter((r) => docIdStr(r) !== currentIdStr)
        : todasReclamacoes;

      const tiposExcluir = [tipoExcluir?.toUpperCase?.()?.trim?.()].flatMap((t) => {
        if (t === 'OUVIDORIA') return ['OUVIDORIA', 'N2', 'N2 PIX'];
        if (t === 'RECLAME_AQUI') return ['RECLAME_AQUI', 'RECLAME AQUI'];
        if (t === 'TIME_PORTABILIDADE') return ['TIME_PORTABILIDADE', 'TIME PORTABILIDADE'];
        if (t === 'PROCESSOS') return ['PROCESSOS', 'JUDICIAL', 'AÇÃO JUDICIAL', 'ACAO JUDICIAL'];
        return t ? [t] : [];
      });

      const registros = todasReclamacoes.filter((r) => {
        const tipo = String(r.tipo || '').toUpperCase().trim();
        return !tiposExcluir.includes(tipo);
      });

      const agg = aggregateProtocolosFromRegistros(registros, {
        tipoExcluir,
        tipoFormulario: formData.tipo,
        pixLiberado: formData.pixLiberado,
        statusContratoQuitado: formData.statusContratoQuitado,
        contratoCancelado: formData.contratoCancelado === true,
      });

      const {
        protocolosCentral: protocolosCentralUnicos,
        protocolosN2: protocolosN2Unicos,
        protocolosReclameAqui: protocolosReclameAquiUnicos,
        protocolosProcon: protocolosProconUnicos,
        acionouCentral,
        n2SegundoNivel,
        reclameAqui,
        procon,
        pixLiberado,
        statusContratoQuitado,
        contratoCancelado,
        incluirN2,
        incluirN2SegundoNivel,
        protocoloOctadeskForTp,
      } = agg;

      const sortedPorData = [...todasReclamacoes].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      const nomeMerge = sortedPorData.map((x) => String(x.nome || '').trim()).find(Boolean);
      const emailMerge = sortedPorData.map((x) => String(x.email || '').trim()).find(Boolean);
      const telKeys = new Set();
      const telLista = [];
      for (const r of todasReclamacoes) {
        const lista = r.telefones?.lista;
        if (!Array.isArray(lista)) continue;
        for (const tel of lista) {
          const k = String(tel || '').replace(/\D/g, '');
          if (k.length >= 8 && !telKeys.has(k)) {
            telKeys.add(k);
            telLista.push(String(tel).trim());
          }
        }
      }

      const elegiveisFusao = filterReclamacoesElegiveisFusaoLista(todasMenosAtual);

      const textoRetornoBusca = mensagemRetornoBuscaLocalizar({
        todasReclamacoes,
        outrosRegistros: elegiveisFusao,
        tipoFormulario: formData.tipo,
      });

      const updates = {
        acionouCentral: acionouCentral || formData.acionouCentral,
        protocolosCentral:
          protocolosCentralUnicos.length > 0 ? protocolosCentralUnicos : formData.protocolosCentral,
        reclameAqui: reclameAqui || formData.reclameAqui,
        protocolosReclameAqui:
          protocolosReclameAquiUnicos.length > 0 ? protocolosReclameAquiUnicos : formData.protocolosReclameAqui,
        procon: procon || formData.procon,
        protocolosProcon:
          protocolosProconUnicos.length > 0 ? protocolosProconUnicos : formData.protocolosProcon,
        registrosReclameAqui: textoRetornoBusca,
        localizarAtendimentos: textoRetornoBusca,
      };
      if (nomeMerge) updates.nome = nomeMerge;
      if (emailMerge) updates.email = formatarEmail(emailMerge);
      if (telLista.length > 0) updates.telefones = { lista: telLista };
      if (formData.tipo === TIME_PORTABILIDADE_TIPO && protocoloOctadeskForTp) {
        updates.protocoloOctadesk = protocoloOctadeskForTp;
      }
      if (incluirN2) {
        updates.protocolosN2 = protocolosN2Unicos.length > 0 ? protocolosN2Unicos : formData.protocolosN2;
      }
      if (incluirN2SegundoNivel) {
        updates.n2SegundoNivel = n2SegundoNivel || formData.n2SegundoNivel;
      }
      if (['BACEN', 'OUVIDORIA', 'RECLAME_AQUI', 'PROCON', 'PROCESSOS', 'TIME_PORTABILIDADE'].includes(tipoExcluir)) {
        updates.pixLiberado = pixLiberado;
        updates.statusContratoQuitado = statusContratoQuitado;
        updates.contratoCancelado = contratoCancelado;
      }

      const forFusaoDocs = elegiveisFusao;

      const idxForm = tierIndexFromTipo(formData.tipo);
      let showButton = false;
      let cenarioFusao = 'none';
      let targetDoc = null;
      if (forFusaoDocs.length > 0 && idxForm >= 0) {
        const tiers = forFusaoDocs.map((r) => tierIndexFromTipo(r.tipo)).filter((i) => i >= 0);
        const maxT = tiers.length ? Math.max(...tiers) : -1;
        const minT = tiers.length ? Math.min(...tiers) : 99;
        let mesmoTierAberto = false;
        for (const r of forFusaoDocs) {
          if (tierIndexFromTipo(r.tipo) === idxForm && r.Finalizado?.Resolvido !== true) {
            mesmoTierAberto = true;
            break;
          }
        }
        showButton = maxT > idxForm || minT < idxForm || mesmoTierAberto;
        if (maxT > idxForm) {
          cenarioFusao = 'current_inferior';
          targetDoc = [...forFusaoDocs].sort(
            (a, b) => tierIndexFromTipo(b.tipo) - tierIndexFromTipo(a.tipo)
          )[0];
        } else if (minT < idxForm) {
          cenarioFusao = 'current_superior';
          targetDoc = [...forFusaoDocs].sort(
            (a, b) => tierIndexFromTipo(a.tipo) - tierIndexFromTipo(b.tipo)
          )[0];
        } else if (mesmoTierAberto) {
          cenarioFusao = 'redundante';
          targetDoc =
            forFusaoDocs.find(
              (r) => tierIndexFromTipo(r.tipo) === idxForm && r.Finalizado?.Resolvido !== true
            ) || forFusaoDocs[0];
        }
      }

      if (todasReclamacoes.length === 0) {
        onFusaoConsultaChange?.(null);
      } else {
        onFusaoConsultaChange?.(
          showButton && forFusaoDocs.length > 0
            ? {
                showButton: true,
                cenario: cenarioFusao,
                cpf: cpfLimpo,
                targetDoc,
                currentTipo: formData.tipo,
                currentId: currentIdStr || null,
                currentPixLiberado: formData.pixLiberado === true,
                currentSnapshot: buildFusaoCurrentSnapshot(formData, {
                  numeroProtocolo: reclamacao?.numeroProtocolo,
                  Fusao: formData.Fusao,
                }),
                allDocs: forFusaoDocs,
              }
            : null
        );
      }

      setFormData((prev) => ({ ...prev, ...updates }));

      if (!silencioso) {
        if (todasReclamacoes.length === 0) {
          toast(textoRetornoBusca);
        } else if (
          textoRetornoBusca === 'Encontrada redundância de registro.' ||
          textoRetornoBusca.startsWith('Ocorrência encontrada em ')
        ) {
          toast.success(textoRetornoBusca);
        } else {
          toast(textoRetornoBusca);
        }
      }
    } catch (error) {
      console.error('Erro ao localizar atendimentos:', error);
      if (!silencioso) toast.error('Erro ao localizar atendimentos');
      onFusaoConsultaChange?.(null);
    } finally {
      setBuscandoReclameAqui(false);
    }
  };

  useEffect(() => {
    const cpf = String(formData.cpf || '').replace(/\D/g, '');
    const recId = normalizeMongoId(reclamacao?._id ?? reclamacao?.id);
    if (cpf.length !== 11 || !recId || consultaFusaoAutoRecIdRef.current === recId) return;
    consultaFusaoAutoRecIdRef.current = recId;
    localizarAtendimentos(formData.tipo, { silencioso: true });
  }, [reclamacao?._id, formData.cpf, formData.tipo]);

  /**
   * Buscar registros Reclame Aqui por CPF
   */
  const buscarRegistrosReclameAqui = async () => {
    if (!formData.cpf || formData.cpf.replace(/\D/g, '').length !== 11) {
      toast.error('CPF inválido. Preencha o CPF do cliente primeiro.');
      return;
    }

    setBuscandoReclameAqui(true);
    try {
      const cpfLimpo = formData.cpf.replace(/\D/g, '');
      const resultado = await reclamacoesAPI.getByCpf(cpfLimpo);
      const todasReclamacoes = resultado.data || resultado || [];
      
      // Filtrar apenas registros do tipo Reclame Aqui
      const registrosRA = todasReclamacoes.filter(r => 
        r.tipo === 'RECLAME_AQUI' || 
        r.tipo === 'Reclame Aqui' || 
        r.tipo === 'RECLAME AQUI'
      );
      
      if (registrosRA.length === 0) {
        toast('Nenhum registro Reclame Aqui encontrado para este CPF.');
        setReclameAquiRegistros([]);
        setFormData(prev => ({ ...prev, registrosReclameAqui: 'Nenhum registro encontrado' }));
      } else {
        setReclameAquiRegistros(registrosRA);
        setMostrarModalReclameAqui(true);
        // Atualizar campo de texto com quantidade encontrada
        setFormData(prev => ({ 
          ...prev, 
          registrosReclameAqui: `${registrosRA.length} registro(s) encontrado(s)` 
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar registros Reclame Aqui:', error);
      toast.error('Erro ao buscar registros Reclame Aqui');
    } finally {
      setBuscandoReclameAqui(false);
    }
  };

  /**
   * Buscar Outros Protocolos por CPF (Ação Judicial)
   */
  const buscarOutrosProtocolos = async () => {
    if (!formData.cpf || formData.cpf.replace(/\D/g, '').length !== 11) {
      toast.error('CPF inválido. Preencha o CPF do cliente primeiro.');
      return;
    }
    setBuscandoOutrosProtocolos(true);
    try {
      const cpfLimpo = formData.cpf.replace(/\D/g, '');
      const resultado = await reclamacoesAPI.getByCpf(cpfLimpo);
      const todasReclamacoes = resultado.data || resultado || [];
      const outrosProtocolos = todasReclamacoes.filter(r => {
        const tipo = String(r.tipo || '').toUpperCase().trim();
        return tipo !== 'PROCESSOS' && tipo !== 'JUDICIAL' && tipo !== 'AÇÃO JUDICIAL'
          && tipo !== 'TIME_PORTABILIDADE' && tipo !== 'TIME PORTABILIDADE';
      });
      if (outrosProtocolos.length === 0) {
        toast('Nenhum outro protocolo encontrado para este CPF.');
        setOutrosProtocolosRegistros([]);
        setFormData(prev => ({ ...prev, outrosProtocolos: 'Nenhum protocolo encontrado' }));
      } else {
        setOutrosProtocolosRegistros(outrosProtocolos);
        setMostrarModalOutrosProtocolos(true);
        setFormData(prev => ({ ...prev, outrosProtocolos: `${outrosProtocolos.length} protocolo(s) encontrado(s)` }));
      }
    } catch (error) {
      console.error('Erro ao buscar outros protocolos:', error);
      toast.error('Erro ao buscar outros protocolos');
    } finally {
      setBuscandoOutrosProtocolos(false);
    }
  };

  /**
   * Renderizar campos específicos Ação Judicial
   */
  const renderCamposProcessos = () => (
    <>
      <div className="velohub-card">
        <h3 className="text-xl font-semibold mb-4 velohub-title">Ocorrência</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <FloatingLabelField
              id="form-fr-edit-proc-nro"
              label="Nro do Processo"
              required
              value={formData.nroProcesso}
              error={errors.nroProcesso}
            >
              <input
                type="text"
                value={formData.nroProcesso}
                onChange={(e) => setFormData(prev => ({ ...prev, nroProcesso: e.target.value }))}
                className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                placeholder="Digite o número do processo"
                required
              />
            </FloatingLabelField>
          </div>
          <div>
            <FloatingLabelField
              id="form-fr-edit-proc-empresa"
              label="Empresa Acionada"
              required
              value={formData.empresaAcionada}
              error={errors.empresaAcionada}
            >
              <select
                value={formData.empresaAcionada}
                onChange={(e) => setFormData(prev => ({ ...prev, empresaAcionada: e.target.value }))}
                className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                required
              >
                <option value="">Selecione...</option>
                <option value="Velotax">Velotax</option>
                <option value="Celcoin">Celcoin</option>
              </select>
            </FloatingLabelField>
          </div>
          <div>
            <FloatingLabelField
              id="form-fr-edit-proc-data-entrada"
              label="Data de Entrada"
              required
              value={formData.dataEntradaProcesso}
              error={errors.dataEntradaProcesso}
            >
              <input
                type="date"
                value={formData.dataEntradaProcesso}
                onChange={(e) => setFormData(prev => ({ ...prev, dataEntradaProcesso: e.target.value }))}
                className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                required
              />
            </FloatingLabelField>
          </div>
          <div>
            <FloatingLabelField
              id="form-fr-edit-proc-produto"
              label="Produto"
              required
              value={formData.produto}
              error={errors.produto}
            >
              <select
                value={formData.produto}
                onChange={(e) => setFormData(prev => ({ ...prev, produto: e.target.value }))}
                className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                required
              >
                <option value="">Selecione...</option>
                <option value="Antecipação 2026">Antecipação 2026</option>
                <option value="Antecipação">Antecipação Outros Anos</option>
                <option value="Empréstimo Pessoal">Empréstimo Pessoal</option>
                <option value="Crédito Trabalhador">Crédito Trabalhador</option>
                <option value="Cupons Velotax">Cupons Velotax</option>
                <option value="QueroQuitar">QueroQuitar</option>
                <option value="Seguro DividaZero">Seguro DividaZero</option>
                <option value="Seguro Celular">Seguro Celular</option>
                <option value="Seguro Prestamista">Seguro Prestamista</option>
                <option value="Seguro Saúde">Seguro Saúde</option>
                <option value="Calculadora">Calculadora</option>
                <option value="App">App</option>
                <option value="Outras Reclamações">Outras Reclamações</option>
              </select>
            </FloatingLabelField>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
          {renderCampoMotivo(
            MOTIVOS_ACAO_JUDICIAL,
            formData.motivoReduzido,
            (novosMotivos) => setFormData(prev => ({ ...prev, motivoReduzido: novosMotivos })),
            errors.motivoReduzido,
            'Motivo *',
            'motivo-processos-edit'
          )}
        </div>

        <div className="mb-4">
          <FloatingLabelField id="form-fr-edit-proc-descricao" label="Descrição" value={formData.motivoDetalhado}>
            <textarea
              value={formData.motivoDetalhado}
              onChange={(e) => setFormData(prev => ({ ...prev, motivoDetalhado: e.target.value }))}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              rows={4}
              placeholder="Descreva detalhadamente o processo..."
            />
          </FloatingLabelField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center">
            <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={formData.audiencia}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  audiencia: e.target.checked,
                  dataAudiencia: e.target.checked ? '' : '',
                  situacaoAudiencia: e.target.checked ? '' : ''
                }))}
                className="w-5 h-5"
              />
              <span>Audiência</span>
            </label>
          </div>
          {formData.audiencia && (
            <>
              <div>
                <FloatingLabelField id="form-fr-edit-proc-data-audiencia" label="Data da Audiência" value={formData.dataAudiencia}>
                  <input
                    type="date"
                    value={formData.dataAudiencia}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataAudiencia: e.target.value }))}
                    className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                  />
                </FloatingLabelField>
              </div>
              <div>
                <FloatingLabelField id="form-fr-edit-proc-situacao-audiencia" label="Situação" value={formData.situacaoAudiencia}>
                  <input
                    type="text"
                    value={formData.situacaoAudiencia}
                    onChange={(e) => setFormData(prev => ({ ...prev, situacaoAudiencia: e.target.value }))}
                    className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Digite a situação da audiência"
                  />
                </FloatingLabelField>
              </div>
            </>
          )}
        </div>

        <div className="mb-4">
          <FloatingLabelField id="form-fr-edit-proc-subsidios" label="Subsídios" value={formData.subsidios}>
            <textarea
              value={formData.subsidios}
              onChange={(e) => setFormData(prev => ({ ...prev, subsidios: e.target.value }))}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              rows={3}
              placeholder="Digite os subsídios..."
            />
          </FloatingLabelField>
        </div>

        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end">
          <div className="min-w-0 flex-1">
            <FloatingLabelField id="form-fr-edit-proc-outros-prot" label="Outros Protocolos" value={formData.outrosProtocolos}>
              <input
                type="text"
                value={formData.outrosProtocolos}
                readOnly
                className="min-h-12 box-border w-full cursor-not-allowed rounded-lg border border-gray-400 bg-gray-100 px-3 text-sm text-gray-600 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-400"
                placeholder="Clique em 'Buscar' para encontrar protocolos relacionados"
              />
            </FloatingLabelField>
          </div>
          <div className="shrink-0">
            <button
              type="button"
              onClick={buscarOutrosProtocolos}
              disabled={buscandoOutrosProtocolos || !formData.cpf || formData.cpf.replace(/\D/g, '').length !== 11}
              className="inline-flex h-12 min-h-12 box-border items-center gap-2 rounded border px-4 transition-all duration-300 dark:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderColor: '#006AB9', color: '#006AB9', background: 'transparent' }}
            >
              {buscandoOutrosProtocolos ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Anexo</label>
          <input
            type="file"
            onChange={async (e) => {
              const files = Array.from(e.target.files);
              if (files.length === 0) return;
              const uploadPromises = files.map(async (file) => {
                try {
                  const resultado = await anexosAPI.upload(file, formData.tipo);
                  return resultado.url;
                } catch (error) {
                  toast.error(`Erro ao fazer upload de ${file.name}: ${error.message}`);
                  return null;
                }
              });
              const urls = await Promise.all(uploadPromises);
              const urlsValidas = urls.filter(url => url !== null);
              setFormData(prev => ({ ...prev, anexos: [...prev.anexos, ...urlsValidas] }));
              if (urlsValidas.length > 0) toast.success(`${urlsValidas.length} arquivo(s) enviado(s) com sucesso`);
            }}
            className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            multiple
          />
          <small className="text-xs text-gray-600 dark:text-gray-400">Você pode selecionar múltiplos arquivos.</small>
          {formData.anexos.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Arquivos enviados ({formData.anexos.length}):</p>
              <ul className="text-xs text-gray-500 dark:text-gray-400 list-disc list-inside">
                {formData.anexos.map((url, index) => (
                  <li key={index} className="truncate">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Anexo {index + 1}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {mostrarModalOutrosProtocolos && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold velohub-title">Outros Protocolos Encontrados ({outrosProtocolosRegistros.length})</h3>
              <button onClick={() => { setMostrarModalOutrosProtocolos(false); setProtocoloExpandido(null); }} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-4">
              {outrosProtocolosRegistros.map((protocolo, index) => (
                <div key={index} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => setProtocoloExpandido(protocoloExpandido === index ? null : index)}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{protocolo.tipo || 'Sem tipo'}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{protocolo.nome || 'Sem nome'}</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">CPF: {protocolo.cpf ? `${protocolo.cpf.substring(0, 3)}***${protocolo.cpf.substring(9)}` : 'N/A'}</div>
                      {protocolo.createdAt && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Criado em: {formatDateRegistro(protocolo.createdAt)}</div>}
                    </div>
                    <button className="text-blue-600 dark:text-blue-400">{protocoloExpandido === index ? '▼' : '▶'}</button>
                  </div>
                  {protocoloExpandido === index && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-x-auto">{JSON.stringify(protocolo, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderCamposTimePortabilidade = () => (
    <div className="velohub-card">
      <h3 className="text-xl font-semibold mb-4 velohub-title">Ocorrência</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div>
          <FloatingLabelField id="form-fr-edit-tp-produto" label="Produto" value={TIME_PORT_PRODUTO}>
            <input
              type="text"
              readOnly
              value={TIME_PORT_PRODUTO}
              className="min-h-12 box-border w-full cursor-not-allowed rounded-lg border border-gray-400 bg-gray-100 px-3 text-sm text-gray-600 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-400"
            />
          </FloatingLabelField>
        </div>
        <div>
          <FloatingLabelField id="form-fr-edit-tp-origem" label="Origem" value={TIME_PORT_ORIGEM}>
            <input
              type="text"
              readOnly
              value={TIME_PORT_ORIGEM}
              className="min-h-12 box-border w-full cursor-not-allowed rounded-lg border border-gray-400 bg-gray-100 px-3 text-sm text-gray-600 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-400"
            />
          </FloatingLabelField>
        </div>
        <div>
          <FloatingLabelField
            id="form-fr-edit-tp-data-entrada"
            label="Data de Entrada"
            required
            value={formData.dataEntrada}
            error={errors.dataEntrada}
          >
            <input
              type="date"
              value={formData.dataEntrada}
              onChange={(e) => setFormData(prev => ({ ...prev, dataEntrada: e.target.value }))}
              className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
              required
            />
          </FloatingLabelField>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <FloatingLabelField id="form-fr-edit-tp-motivo" label="Motivo" value={TIME_PORT_MOTIVO_FIXO[0] || ''}>
            <input
              type="text"
              readOnly
              value={TIME_PORT_MOTIVO_FIXO[0] || ''}
              className="min-h-12 box-border w-full cursor-not-allowed rounded-lg border border-gray-400 bg-gray-100 px-3 text-sm text-gray-600 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-400"
            />
          </FloatingLabelField>
        </div>
        <div>
          <FloatingLabelField
            id="form-fr-edit-tp-octadesk"
            label="Protocolo Octadesk"
            required
            value={formData.protocoloOctadesk}
            error={errors.protocoloOctadesk}
          >
            <input
              type="text"
              value={formData.protocoloOctadesk}
              onChange={(e) => setFormData(prev => ({ ...prev, protocoloOctadesk: e.target.value }))}
              className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
              placeholder="Protocolo Octadesk"
            />
          </FloatingLabelField>
        </div>
      </div>
      <div className="mb-4">
        <FloatingLabelField
          id="form-fr-edit-tp-descricao"
          label="Descrição"
          required
          value={formData.motivoDetalhado}
          error={errors.motivoDetalhado}
        >
          <textarea
            value={formData.motivoDetalhado}
            onChange={(e) => setFormData(prev => ({ ...prev, motivoDetalhado: e.target.value }))}
            rows={4}
            className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Descrição da ocorrência..."
          />
        </FloatingLabelField>
      </div>
    </div>
  );

  const renderCanaisTimePortabilidade = () => (
    <div className="velohub-card">
      <h3 className="text-xl font-semibold mb-4 velohub-title">Protocolos</h3>
      <div className="mb-4 flex">
        <button
          type="button"
          onClick={handleSolicitarLiberacao}
          disabled={solicitandoLiberacao || liberacaoPixJaSolicitada}
          className="inline-flex h-12 min-h-12 shrink-0 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-all duration-200 border-[#006AB9] text-[#006AB9] bg-transparent hover:bg-[#006AB9] hover:text-[#F3F7FC] dark:bg-gray-800 disabled:opacity-60"
        >
          {solicitandoLiberacao ? 'Salvando...' : 'Solicitar Liberação'}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5 md:grid-rows-2 md:gap-4 mb-4">
        <div
          className="max-md:hidden min-h-[3rem] md:min-h-[5rem] invisible pointer-events-none md:col-start-1 md:row-start-1"
          aria-hidden="true"
        />
        <div
          className="max-md:hidden min-h-[3rem] md:min-h-[5rem] invisible pointer-events-none md:col-start-2 md:row-start-1"
          aria-hidden="true"
        />
        <label className="flex min-h-[3rem] items-start md:min-h-[5rem] md:col-start-3 md:row-start-1 md:items-center">
          <input
            type="checkbox"
            checked={formData.statusContratoQuitado === true}
            onChange={(e) => setFormData(prev => ({ ...prev, statusContratoQuitado: e.target.checked }))}
            className="mr-2"
          />
          <span>Contrato quitado</span>
        </label>
        <label className="flex min-h-[3rem] items-start md:min-h-[5rem] md:col-start-4 md:row-start-1 md:items-center">
          <input
            type="checkbox"
            checked={formData.liberacaoSolicitada === true}
            onChange={(e) => setFormData((prev) => ({ ...prev, liberacaoSolicitada: e.target.checked }))}
            className="mr-2"
          />
          <span>Liberação Solicitada</span>
        </label>
        <label className="flex min-h-[3rem] items-start md:min-h-[5rem] md:col-start-5 md:row-start-1 md:items-center">
          <input
            type="checkbox"
            checked={formData.pixLiberado === true}
            onChange={(e) => setFormData(prev => ({ ...prev, pixLiberado: e.target.checked }))}
            className="mr-2"
          />
          <span>Pix Liberado</span>
        </label>

        <div
          className="max-md:hidden min-h-[3rem] md:min-h-[5rem] invisible pointer-events-none md:col-start-1 md:row-start-2"
          aria-hidden="true"
        />
        <div
          className="max-md:hidden min-h-[3rem] md:min-h-[5rem] invisible pointer-events-none md:col-start-2 md:row-start-2"
          aria-hidden="true"
        />
        <label className="flex min-h-[3rem] items-start md:min-h-[5rem] md:col-start-3 md:row-start-2 md:items-center">
          <input
            type="checkbox"
            checked={formData.contratoCancelado === true}
            onChange={(e) => setFormData((prev) => ({ ...prev, contratoCancelado: e.target.checked }))}
            className="mr-2"
          />
          <span>Contrato Cancelado</span>
        </label>
        <div
          className="max-md:hidden min-h-[3rem] md:min-h-[5rem] invisible pointer-events-none md:col-start-4 md:row-start-2"
          aria-hidden="true"
        />
        <label className="flex min-h-[3rem] items-start md:min-h-[5rem] md:col-start-5 md:row-start-2 md:items-center">
          <input
            type="checkbox"
            checked={formData.semRespostaCliente === true}
            onChange={(e) => setFormData((prev) => ({ ...prev, semRespostaCliente: e.target.checked }))}
            className="mr-2"
          />
          <span>Sem Resposta do Cliente</span>
        </label>
      </div>
    </div>
  );

  /**
   * Renderizar campos específicos Procon
   */
  const renderCamposProcon = () => {
    // Validar Código Procon (16 caracteres)
    const validarCodigoProcon = (codigo) => {
      return codigo && codigo.length === 16;
    };

    return (
      <>
        {/* Ocorrência Procon */}
        <div className="velohub-card">
          <h3 className="text-xl font-semibold mb-4 velohub-title">Ocorrência</h3>
          
          {/* Linha 1: Origem | Código Procon | Data Procon | Produto */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <FloatingLabelField
                id="form-fr-edit-procon-origem"
                label="Origem"
                required
                value={formData.origem}
                error={errors.origem}
              >
                <select
                  value={formData.origem}
                  onChange={(e) => setFormData(prev => ({ ...prev, origem: e.target.value }))}
                  className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                  required
                >
                  <option value="">Selecione...</option>
                  <option value="Procon">Procon</option>
                  <option value="Consumidor.gov">Consumidor.gov</option>
                </select>
              </FloatingLabelField>
            </div>

            <div>
              <FloatingLabelField
                id="form-fr-edit-procon-codigo"
                label="Código Procon (16 caracteres)"
                required
                value={formData.codigoProcon}
                error={errors.codigoProcon}
              >
                <input
                  type="text"
                  value={formData.codigoProcon}
                  onChange={(e) => {
                    const valor = e.target.value.slice(0, 16);
                    setFormData(prev => ({ ...prev, codigoProcon: valor }));
                  }}
                  className={`min-h-12 box-border w-full rounded-lg border px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
                    validarCodigoProcon(formData.codigoProcon) ? 'border-green-500 border-2' : 'border-gray-400 dark:border-gray-500'
                  }`}
                  placeholder="Digite o código Procon"
                  maxLength={16}
                  required
                />
              </FloatingLabelField>
            </div>

            <div>
              <FloatingLabelField
                id="form-fr-edit-procon-data"
                label="Data Procon"
                required
                value={formData.dataProcon}
                error={errors.dataProcon}
              >
                <input
                  type="date"
                  value={formData.dataProcon}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataProcon: e.target.value }))}
                  className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                  required
                />
              </FloatingLabelField>
            </div>

            <div>
              <FloatingLabelField
                id="form-fr-edit-procon-produto"
                label="Produto"
                required
                value={formData.produto}
                error={errors.produto}
              >
                <select
                  value={formData.produto}
                  onChange={(e) => setFormData(prev => ({ ...prev, produto: e.target.value }))}
                  className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                  required
                >
                  <option value="">Selecione...</option>
                  <option value="Antecipação 2026">Antecipação 2026</option>
                  <option value="Antecipação">Antecipação Outros Anos</option>
                  <option value="Empréstimo Pessoal">Empréstimo Pessoal</option>
                  <option value="Crédito Trabalhador">Crédito Trabalhador</option>
                  <option value="Cupons Velotax">Cupons Velotax</option>
                  <option value="QueroQuitar">QueroQuitar</option>
                  <option value="Seguro DividaZero">Seguro DividaZero</option>
                  <option value="Seguro Celular">Seguro Celular</option>
                  <option value="Seguro Prestamista">Seguro Prestamista</option>
                  <option value="Seguro Saúde">Seguro Saúde</option>
                  <option value="Calculadora">Calculadora</option>
                  <option value="App">App</option>
                  <option value="Outras Reclamações">Outras Reclamações</option>
                </select>
              </FloatingLabelField>
            </div>
          </div>

          {/* Linha 2: Motivo */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
            {renderCampoMotivo(
              MOTIVOS_REDUZIDOS,
              formData.motivoReduzido,
              (novosMotivos) => setFormData(prev => ({ ...prev, motivoReduzido: novosMotivos })),
              errors.motivoReduzido,
              'Motivo *',
              'motivo-procon-edit'
            )}
          </div>

          {/* Linha 3: Descrição */}
          <div className="mb-4">
            <FloatingLabelField id="form-fr-edit-procon-descricao" label="Descrição" value={formData.motivoDetalhado}>
              <textarea
                value={formData.motivoDetalhado}
                onChange={(e) => setFormData(prev => ({ ...prev, motivoDetalhado: e.target.value }))}
                className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                rows={4}
                placeholder="Descreva detalhadamente a ocorrência..."
              />
            </FloatingLabelField>
          </div>

          {/* Linha 4: Solução Apresentada */}
          <div className="mb-4">
            <FloatingLabelField id="form-fr-edit-procon-solucao" label="Solução Apresentada" value={formData.solucaoApresentada}>
              <textarea
                value={formData.solucaoApresentada}
                onChange={(e) => setFormData(prev => ({ ...prev, solucaoApresentada: e.target.value }))}
                className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                rows={4}
                placeholder="Descreva a solução apresentada..."
              />
            </FloatingLabelField>
          </div>

          {/* Linha 5: Processo Administrativo | Cliente Desistiu | Processo Encaminhado | Processo Encerrado */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-start">
            <div className="flex flex-col">
              <FloatingLabelField
                id="form-fr-edit-procon-proc-adm"
                label="Processo Administrativo"
                value={formData.processoAdministrativo}
              >
                <select
                  value={formData.processoAdministrativo}
                  onChange={(e) => setFormData(prev => ({ ...prev, processoAdministrativo: e.target.value }))}
                  className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Selecione...</option>
                  <option value="Sim - Status Não Atendido">Sim - Status Não Atendido</option>
                  <option value="Não - Status Atendido">Não - Status Atendido</option>
                  <option value="Sem Interação do Cliente">Sem Interação do Cliente</option>
                </select>
              </FloatingLabelField>
            </div>

            <div className="flex items-center" style={{ paddingTop: '1.5rem' }}>
              <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.clienteDesistiu}
                  onChange={(e) => setFormData(prev => ({ ...prev, clienteDesistiu: e.target.checked }))}
                  className="w-5 h-5"
                />
                <span>Cliente Desistiu</span>
              </label>
            </div>

            <div>
              <div className="flex items-center" style={{ paddingTop: '1.5rem' }}>
                <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.encaminhadoJuridico}
                    onChange={(e) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        encaminhadoJuridico: e.target.checked,
                        processoEncaminhadoResponsavel: e.target.checked ? '' : '',
                        processoEncaminhadoData: e.target.checked ? '' : ''
                      }));
                    }}
                    className="w-5 h-5"
                  />
                  <span>Processo Encaminhado</span>
                </label>
              </div>
              {formData.encaminhadoJuridico && (
                <div className="mt-2 space-y-2">
                  <select
                    value={formData.processoEncaminhadoResponsavel}
                    onChange={(e) => setFormData(prev => ({ ...prev, processoEncaminhadoResponsavel: e.target.value }))}
                    className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Selecione...</option>
                    <option value="Tadeu">Tadeu</option>
                    <option value="Aline">Aline</option>
                    <option value="Celcoin">Celcoin</option>
                  </select>
                  <input
                    type="date"
                    value={formData.processoEncaminhadoData}
                    onChange={(e) => setFormData(prev => ({ ...prev, processoEncaminhadoData: e.target.value }))}
                    className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Data do encaminhamento"
                  />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center" style={{ paddingTop: '1.5rem' }}>
                <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.processoEncerrado}
                    onChange={(e) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        processoEncerrado: e.target.checked,
                        dataProcessoEncerrado: e.target.checked ? new Date().toISOString().split('T')[0] : ''
                      }));
                    }}
                    className="w-5 h-5"
                  />
                  <span>Processo Encerrado</span>
                </label>
              </div>
              {formData.processoEncerrado && (
                <input
                  type="date"
                  value={formData.dataProcessoEncerrado}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataProcessoEncerrado: e.target.value }))}
                  className="mt-2 min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Data do encerramento"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-5 md:grid-rows-2 md:gap-4 mb-4">
            <div className="min-h-[3rem] md:min-h-[5rem] md:col-start-1 md:row-start-1">
              <div className="flex items-center mb-2">
                <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.acionouCentral}
                    onChange={(e) => setFormData((prev) => ({ ...prev, acionouCentral: e.target.checked }))}
                    className="w-5 h-5"
                  />
                  <span>Atendimento N1</span>
                </label>
              </div>
              {formData.acionouCentral && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nro Protocolo</label>
                  {formData.protocolosCentral.map((protocolo, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={protocolo}
                        onChange={(e) => atualizarProtocolo('protocolosCentral', index, e.target.value)}
                        className="min-h-12 box-border flex-1 rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                        placeholder="Digite o protocolo"
                      />
                      {formData.protocolosCentral.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removerProtocolo('protocolosCentral', index)}
                          className="inline-flex h-12 min-h-12 box-border items-center justify-center rounded border px-3 text-sm dark:bg-gray-700"
                          style={{ borderColor: '#dc2626', color: '#dc2626', background: 'transparent' }}
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => adicionarProtocolo('protocolosCentral')}
                    className="inline-flex h-12 min-h-12 box-border items-center justify-center rounded border px-3 text-sm dark:bg-gray-700"
                    style={{ borderColor: '#006AB9', color: '#006AB9', background: 'transparent' }}
                  >
                    + Adicionar Protocolo
                  </button>
                </div>
              )}
            </div>

            <div className="max-md:hidden min-h-[3rem] md:min-h-[5rem] invisible pointer-events-none md:col-start-2 md:row-start-1" aria-hidden="true" />

            <div className="min-h-[3rem] md:min-h-[5rem] md:col-start-3 md:row-start-1">
              <div className="flex items-center mb-2">
                <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.statusContratoQuitado}
                    onChange={(e) => setFormData((prev) => ({ ...prev, statusContratoQuitado: e.target.checked }))}
                    className="w-5 h-5"
                  />
                  <span>Contrato Quitado</span>
                </label>
              </div>
            </div>

            <div className="min-h-[3rem] md:min-h-[5rem] md:col-start-4 md:row-start-1">
              <div className="flex items-center mb-2">
                <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.liberacaoSolicitada === true}
                    onChange={(e) => setFormData((prev) => ({ ...prev, liberacaoSolicitada: e.target.checked }))}
                    className="w-5 h-5"
                  />
                  <span>Liberação Solicitada</span>
                </label>
              </div>
            </div>

            <div className="min-h-[3rem] md:min-h-[5rem] md:col-start-5 md:row-start-1">
              <div className="flex items-center mb-2">
                <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.pixLiberado === true}
                    onChange={(e) => setFormData((prev) => ({ ...prev, pixLiberado: e.target.checked }))}
                    className="w-5 h-5"
                  />
                  <span>Pix Liberado</span>
                </label>
              </div>
            </div>

            <div className="min-h-[3rem] md:min-h-[5rem] md:col-start-1 md:row-start-2">
              <div className="flex items-center mb-2">
                <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.n2SegundoNivel}
                    onChange={(e) => setFormData((prev) => ({ ...prev, n2SegundoNivel: e.target.checked }))}
                    className="w-5 h-5"
                  />
                  <span>Escalado N2</span>
                </label>
              </div>
              {formData.n2SegundoNivel && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Protocolos N2</label>
                  {formData.protocolosN2.map((protocolo, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={protocolo}
                        onChange={(e) => atualizarProtocolo('protocolosN2', index, e.target.value)}
                        className="min-h-12 box-border flex-1 rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                        placeholder="Digite o protocolo"
                      />
                      {formData.protocolosN2.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removerProtocolo('protocolosN2', index)}
                          className="inline-flex h-12 min-h-12 box-border items-center justify-center rounded border px-3 text-sm dark:bg-gray-700"
                          style={{ borderColor: '#dc2626', color: '#dc2626', background: 'transparent' }}
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => adicionarProtocolo('protocolosN2')}
                    className="inline-flex h-12 min-h-12 box-border items-center justify-center rounded border px-3 text-sm dark:bg-gray-700"
                    style={{ borderColor: '#006AB9', color: '#006AB9', background: 'transparent' }}
                  >
                    + Adicionar Protocolo
                  </button>
                </div>
              )}
            </div>

            <div className="max-md:hidden min-h-[3rem] md:min-h-[5rem] invisible pointer-events-none md:col-start-2 md:row-start-2" aria-hidden="true" />

            <div className="min-h-[3rem] md:min-h-[5rem] md:col-start-3 md:row-start-2">
              <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  className="w-5 h-5 shrink-0"
                  checked={formData.contratoCancelado === true}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contratoCancelado: e.target.checked }))}
                />
                <span>Contrato Cancelado</span>
              </label>
            </div>

            <div className="min-h-[3rem] md:min-h-[5rem] md:col-start-4 md:row-start-2">
              <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  className="w-5 h-5 shrink-0"
                  checked={formData.liberacaoAnterior === true}
                  onChange={(e) => setFormData((prev) => ({ ...prev, liberacaoAnterior: e.target.checked }))}
                />
                <span>Liberação Anterior</span>
              </label>
            </div>

            <div className="min-h-[3rem] md:min-h-[5rem] md:col-start-5 md:row-start-2">
              <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  className="w-5 h-5 shrink-0"
                  checked={formData.semRespostaCliente === true}
                  onChange={(e) => setFormData((prev) => ({ ...prev, semRespostaCliente: e.target.checked }))}
                />
                <span>Sem Resposta do Cliente</span>
              </label>
            </div>
          </div>

          {/* Anexo */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Anexo
            </label>
            <input
              type="file"
              onChange={async (e) => {
                const files = Array.from(e.target.files);
                if (files.length === 0) return;
                
                const uploadPromises = files.map(async (file) => {
                  try {
                    const resultado = await anexosAPI.upload(file, formData.tipo);
                    return resultado.url;
                  } catch (error) {
                    console.error('Erro ao fazer upload do anexo:', error);
                    toast.error(`Erro ao fazer upload de ${file.name}: ${error.message}`);
                    return null;
                  }
                });
                
                const urls = await Promise.all(uploadPromises);
                const urlsValidas = urls.filter(url => url !== null);
                
                setFormData(prev => ({ 
                  ...prev, 
                  anexos: [...prev.anexos, ...urlsValidas]
                }));
                
                if (urlsValidas.length > 0) {
                  toast.success(`${urlsValidas.length} arquivo(s) enviado(s) com sucesso`);
                }
              }}
              className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              multiple
            />
            <small className="text-xs text-gray-600 dark:text-gray-400">
              Você pode selecionar múltiplos arquivos. Os arquivos serão enviados automaticamente.
            </small>
            {formData.anexos.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Arquivos enviados ({formData.anexos.length}):
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 list-disc list-inside">
                  {formData.anexos.map((url, index) => (
                    <li key={index} className="truncate">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Anexo {index + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  // Renderizar tentativas de contato
  const renderTentativasContato = () => (
    <div className="velohub-card">
      <h3 className="text-xl font-semibold mb-4 velohub-title">Tentativas de Contato</h3>
      
      {formData.tentativasContato.lista.map((tentativa, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <FloatingLabelField
              id={`form-fr-edit-tentativa-${index}-data`}
              label={`${index + 1}ª tentativa`}
              value={tentativa.data}
            >
              <input
                type="date"
                value={tentativa.data}
                onChange={(e) => {
                  const novasTentativas = [...formData.tentativasContato.lista];
                  novasTentativas[index].data = e.target.value;
                  setFormData(prev => ({ ...prev, tentativasContato: { lista: novasTentativas } }));
                }}
                className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
              />
            </FloatingLabelField>
          </div>
          <div>
            <FloatingLabelField id={`form-fr-edit-tentativa-${index}-meio`} label="Meio" value={tentativa.meio}>
              <select
                value={tentativa.meio}
                onChange={(e) => {
                  const novasTentativas = [...formData.tentativasContato.lista];
                  novasTentativas[index].meio = e.target.value;
                  setFormData(prev => ({ ...prev, tentativasContato: { lista: novasTentativas } }));
                }}
                className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Selecione...</option>
                <option value="Telefone">Telefone</option>
                <option value="Whatsapp">Whatsapp</option>
                <option value="Email">Email</option>
              </select>
            </FloatingLabelField>
          </div>
          <div>
            <FloatingLabelField id={`form-fr-edit-tentativa-${index}-resultado`} label="Resultado" value={tentativa.resultado}>
              <input
                type="text"
                value={tentativa.resultado}
                onChange={(e) => {
                  const novasTentativas = [...formData.tentativasContato.lista];
                  novasTentativas[index].resultado = e.target.value;
                  setFormData(prev => ({ ...prev, tentativasContato: { lista: novasTentativas } }));
                }}
                className="min-h-12 box-border w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                placeholder="Resultado do contato"
              />
            </FloatingLabelField>
          </div>
          {formData.tentativasContato.lista.length > 1 && (
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => removerTentativa(index)}
                className="inline-flex h-12 min-h-12 box-border items-center gap-2 rounded border px-3 text-sm transition-all duration-300 dark:bg-gray-700"
                style={{
                  borderColor: '#dc2626',
                  color: '#dc2626',
                  background: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#dc2626';
                  e.target.style.color = '#F3F7FC';
                  e.target.style.borderColor = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#dc2626';
                  e.target.style.borderColor = '#dc2626';
                }}
              >
                Remover
              </button>
            </div>
          )}
        </div>
      ))}
      
      <button
        type="button"
        onClick={adicionarTentativa}
        className="inline-flex h-12 min-h-12 box-border items-center gap-2 rounded border px-3 text-sm transition-all duration-300 dark:bg-gray-700"
        style={{
          borderColor: '#006AB9',
          color: '#006AB9',
          background: 'transparent',
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'linear-gradient(135deg, #006AB9 0%, #006AB9 100%)';
          e.target.style.color = '#F3F7FC';
          e.target.style.borderColor = '#006AB9';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'transparent';
          e.target.style.color = '#006AB9';
          e.target.style.borderColor = '#006AB9';
        }}
      >
        + Adicionar Tentativa
      </button>
    </div>
  );

  /**
   * Renderizar protocolos (BACEN/Ouvidoria/Reclame Aqui) — toolbar + grid 5×2 com slots fixos
   */
  const renderProtocolos = () => {
    const t = formData.tipo;
    const ocultarRa = t === 'RECLAME_AQUI';
    const ocultarN2 = t === 'OUVIDORIA';
    const ocultarProcon = t === 'PROCON';

    const slotClass = (oculto) =>
      `min-h-[3rem] md:min-h-[5rem] ${oculto ? 'invisible pointer-events-none' : ''}`;

    return (
    <div className="velohub-card">
      <h3 className="text-xl font-semibold mb-4 velohub-title">Protocolos</h3>

        <div className="mb-4 flex">
          <button
            type="button"
            onClick={handleSolicitarLiberacao}
            disabled={solicitandoLiberacao || liberacaoPixJaSolicitada}
            className="inline-flex h-12 min-h-12 shrink-0 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-all duration-200 border-[#006AB9] text-[#006AB9] bg-transparent hover:bg-[#006AB9] hover:text-[#F3F7FC] dark:bg-gray-800 disabled:opacity-60"
          >
            {solicitandoLiberacao ? 'Salvando...' : 'Solicitar Liberação'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-5 md:grid-rows-2 md:gap-4 mb-4">
          {/* Linha 1 col 1 — N1 */}
          <div className={`${slotClass(false)} md:col-start-1 md:row-start-1`}>
            <div className="flex items-center mb-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.acionouCentral}
                  onChange={(e) => setFormData((prev) => ({ ...prev, acionouCentral: e.target.checked }))}
                  className="mr-2"
                />
                <span>Atendimento N1</span>
              </label>
            </div>
            {formData.acionouCentral && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nro Protocolo</label>
                {formData.protocolosCentral.map((protocolo, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={protocolo}
                      onChange={(e) => atualizarProtocolo('protocolosCentral', index, e.target.value)}
                      className="min-h-12 box-border flex-1 rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Digite o protocolo"
                    />
                    {formData.protocolosCentral.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerProtocolo('protocolosCentral', index)}
                        className="inline-flex h-12 min-h-12 box-border items-center justify-center rounded border px-3 text-sm dark:bg-gray-700"
                        style={{ borderColor: '#dc2626', color: '#dc2626', background: 'transparent' }}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => adicionarProtocolo('protocolosCentral')}
                  className="inline-flex h-12 min-h-12 box-border items-center justify-center rounded border px-3 text-sm dark:bg-gray-700"
                  style={{ borderColor: '#006AB9', color: '#006AB9', background: 'transparent' }}
                >
                  + Adicionar Protocolo
                </button>
              </div>
            )}
          </div>

          {/* Linha 1 col 2 — Reclame Aqui */}
          <div className={`${slotClass(ocultarRa)} md:col-start-2 md:row-start-1`}>
            <div className="flex items-center mb-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.reclameAqui}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reclameAqui: e.target.checked }))}
                  className="mr-2"
                />
                <span>Reclame Aqui</span>
              </label>
            </div>
            {formData.reclameAqui && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Qual Protocolo - Reclame Aqui</label>
                {formData.protocolosReclameAqui.map((protocolo, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={protocolo}
                      onChange={(e) => atualizarProtocolo('protocolosReclameAqui', index, e.target.value)}
                      className="min-h-12 box-border flex-1 rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Digite o protocolo"
                    />
                    {formData.protocolosReclameAqui.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerProtocolo('protocolosReclameAqui', index)}
                        className="inline-flex h-12 min-h-12 box-border items-center justify-center rounded border px-3 text-sm dark:bg-gray-700"
                        style={{ borderColor: '#dc2626', color: '#dc2626', background: 'transparent' }}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => adicionarProtocolo('protocolosReclameAqui')}
                  className="inline-flex h-12 min-h-12 box-border items-center justify-center rounded border px-3 text-sm dark:bg-gray-700"
                  style={{ borderColor: '#006AB9', color: '#006AB9', background: 'transparent' }}
                >
                  + Adicionar Protocolo
                </button>
              </div>
            )}
          </div>

          {/* Linha 1 col 3 — Contrato quitado */}
          <div className={`${slotClass(false)} md:col-start-3 md:row-start-1`}>
            <div className="flex items-center mb-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.statusContratoQuitado}
                  onChange={(e) => setFormData((prev) => ({ ...prev, statusContratoQuitado: e.target.checked }))}
                  className="mr-2"
                />
                <span>Contrato Quitado</span>
              </label>
            </div>
          </div>

          {/* Linha 1 col 4 — Liberação solicitada */}
          <div className={`${slotClass(false)} md:col-start-4 md:row-start-1`}>
            <div className="flex items-center mb-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.liberacaoSolicitada === true}
                  onChange={(e) => setFormData((prev) => ({ ...prev, liberacaoSolicitada: e.target.checked }))}
                  className="mr-2"
                />
                <span>Liberação Solicitada</span>
              </label>
            </div>
          </div>

          {/* Linha 1 col 5 — Pix liberado */}
          <div className={`${slotClass(false)} md:col-start-5 md:row-start-1`}>
            <div className="flex items-center mb-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.pixLiberado === true}
                  onChange={(e) => setFormData((prev) => ({ ...prev, pixLiberado: e.target.checked }))}
                  className="mr-2"
                />
                <span>Pix Liberado</span>
              </label>
            </div>
          </div>

          {/* Linha 2 col 1 — Escalado N2 */}
          <div className={`${slotClass(ocultarN2)} md:col-start-1 md:row-start-2`}>
            <div className="flex items-center mb-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.n2SegundoNivel}
                  onChange={(e) => setFormData((prev) => ({ ...prev, n2SegundoNivel: e.target.checked }))}
                  className="mr-2"
                />
                <span>Escalado N2</span>
              </label>
            </div>
            {formData.n2SegundoNivel && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Qual Protocolo - Escalado N2</label>
                {formData.protocolosN2.map((protocolo, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={protocolo}
                      onChange={(e) => atualizarProtocolo('protocolosN2', index, e.target.value)}
                      className="min-h-12 box-border flex-1 rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Digite o protocolo"
                    />
                    {formData.protocolosN2.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerProtocolo('protocolosN2', index)}
                        className="inline-flex h-12 min-h-12 box-border items-center justify-center rounded border px-3 text-sm dark:bg-gray-700"
                        style={{ borderColor: '#dc2626', color: '#dc2626', background: 'transparent' }}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => adicionarProtocolo('protocolosN2')}
                  className="inline-flex h-12 min-h-12 box-border items-center justify-center rounded border px-3 text-sm dark:bg-gray-700"
                  style={{ borderColor: '#006AB9', color: '#006AB9', background: 'transparent' }}
                >
                  + Adicionar Protocolo
                </button>
              </div>
            )}
          </div>

          {/* Linha 2 col 2 — Procon */}
          <div className={`${slotClass(ocultarProcon)} md:col-start-2 md:row-start-2`}>
            <div className="flex items-center mb-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.procon}
                  onChange={(e) => setFormData((prev) => ({ ...prev, procon: e.target.checked }))}
                  className="mr-2"
                />
                <span>Procon</span>
              </label>
            </div>
            {formData.procon && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Qual Protocolo - Procon</label>
                {formData.protocolosProcon.map((protocolo, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={protocolo}
                      onChange={(e) => atualizarProtocolo('protocolosProcon', index, e.target.value)}
                      className="min-h-12 box-border flex-1 rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Digite o protocolo"
                    />
                    {formData.protocolosProcon.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerProtocolo('protocolosProcon', index)}
                        className="inline-flex h-12 min-h-12 box-border items-center justify-center rounded border px-3 text-sm dark:bg-gray-700"
                        style={{ borderColor: '#dc2626', color: '#dc2626', background: 'transparent' }}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => adicionarProtocolo('protocolosProcon')}
                  className="inline-flex h-12 min-h-12 box-border items-center justify-center rounded border px-3 text-sm dark:bg-gray-700"
                  style={{ borderColor: '#006AB9', color: '#006AB9', background: 'transparent' }}
                >
                  + Adicionar Protocolo
                </button>
              </div>
            )}
          </div>

          {/* Linha 2 col 3 — Contrato cancelado */}
          <div className={`${slotClass(false)} md:col-start-3 md:row-start-2`}>
            <div className="flex items-center mb-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.contratoCancelado === true}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contratoCancelado: e.target.checked }))}
                  className="mr-2"
                />
                <span>Contrato Cancelado</span>
              </label>
            </div>
          </div>

          {/* Linha 2 col 4 — Liberação anterior */}
          <div className={`${slotClass(false)} md:col-start-4 md:row-start-2`}>
            <div className="flex items-center mb-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.liberacaoAnterior === true}
                  onChange={(e) => setFormData((prev) => ({ ...prev, liberacaoAnterior: e.target.checked }))}
                  className="mr-2"
                />
                <span>Liberação Anterior</span>
              </label>
            </div>
          </div>

          {/* Linha 2 col 5 — Sem resposta */}
          <div className={`${slotClass(false)} md:col-start-5 md:row-start-2`}>
            <label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                className="w-5 h-5 shrink-0"
                checked={formData.semRespostaCliente === true}
                onChange={(e) => setFormData((prev) => ({ ...prev, semRespostaCliente: e.target.checked }))}
              />
              <span>Sem Resposta do Cliente</span>
            </label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
    <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
        {/* Protocolo à esquerda; seletor de tipo no centro; coluna direita reserva (paridade layout criação) */}
        <div className="grid w-full grid-cols-1 gap-2 px-[3px] md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center md:gap-x-3">
          <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2 justify-self-start">
            <div className="flex h-12 min-h-12 w-fit max-w-full shrink-0 flex-nowrap items-center gap-2 rounded-vh-card border border-gray-300/80 bg-[#E8EEF5]/90 px-3 dark:border-gray-600 dark:bg-[#323a42]">
              <span className="whitespace-nowrap text-sm font-medium text-gray-600 dark:text-gray-300">
                Protocolo
              </span>
              <span className="velohub-title min-w-0 whitespace-nowrap text-sm font-semibold tabular-nums text-[#006AB9] dark:text-[#93c5fd]">
                {String(formData.numeroProtocolo || '').trim() || '—'}
              </span>
            </div>
          </div>
          <div className="flex min-w-0 justify-center justify-self-center">
            <div
              className="flex w-fit max-w-full flex-wrap justify-center gap-1.5 rounded-vh-card border border-gray-300/80 bg-[#E8EEF5]/90 px-[3px] py-1 dark:border-gray-600 dark:bg-[#323a42]"
              role="radiogroup"
              aria-label="Tipo de ocorrência"
            >
              {OPCOES_TIPO_RECLAMACAO.map((op) => {
                const sel = formData.tipo === op.value;
                return (
                  <button
                    key={op.value}
                    type="button"
                    role="radio"
                    aria-checked={sel}
                    onClick={() => aplicarMudancaTipo(op.value)}
                    className={`inline-flex h-12 min-h-12 shrink-0 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-all duration-200 ${
                      sel
                        ? 'border-[#1694FF] bg-[#1694FF] text-[#FFFFFF] shadow-[0_4px_12px_rgba(22,148,255,0.4)] -translate-y-0.5'
                        : 'border-gray-300/60 bg-[#E8EEF5] text-[#272A30] shadow-[inset_0_2px_6px_rgba(0,0,0,0.12)] translate-y-px dark:border-gray-600 dark:bg-[#3d4650] dark:text-[#F3F7FC] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.35)]'
                    }`}
                  >
                    {op.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex min-h-[2.75rem] min-w-0 flex-wrap items-center justify-end justify-self-end gap-2">
            <FusaoProtocoloIndicadores fusao={formData.Fusao} finalizado={formData.Finalizado} />
          </div>
        </div>
        {errors.tipo && <span className="text-red-500 text-xs block">{errors.tipo}</span>}

      {/* Dados do Cliente — CPF | Consultar | retorno busca | Fundir; Nome | Telefones; E-mail | +telefone */}
      <div className="velohub-card">
        <div
          className={`mb-4 grid grid-cols-1 gap-3 md:items-end md:gap-x-4 ${
            fundirInlineAtivo && typeof onAbrirModalFusao === 'function'
              ? 'md:grid-cols-[minmax(0,11rem)_auto_minmax(0,1fr)_auto]'
              : 'md:grid-cols-[minmax(0,11rem)_auto_minmax(0,1fr)]'
          }`}
        >
          <FloatingLabelField
            id="form-reclamacao-edit-cpf"
            label="CPF"
            required
            value={formData.cpf}
            error={errors.cpf}
            className="min-w-0"
          >
            <input
              id="form-reclamacao-edit-cpf"
              type="text"
              size={16}
              value={formData.cpf}
              onChange={(e) => {
                const formatted = formatCPFInput(e.target.value);
                setFormData(prev => ({ ...prev, cpf: formatted }));
              }}
              className={`box-border max-w-full min-h-12 rounded-lg border px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
                validarCPF(formData.cpf)
                  ? 'border-2 border-green-500'
                  : 'border border-gray-400 dark:border-gray-500'
              }`}
              placeholder="000.000.000-00"
              maxLength={14}
              required
            />
          </FloatingLabelField>

          <div className="flex min-w-0 items-end justify-stretch md:justify-center">
            <button
              type="button"
              aria-label="Consultar atendimentos por CPF"
              onClick={() => localizarAtendimentos(formData.tipo)}
              disabled={buscandoReclameAqui || !formData.cpf || formData.cpf.replace(/\D/g, '').length !== 11}
              className="box-border flex h-12 min-h-12 w-full min-w-0 items-center justify-center whitespace-nowrap rounded-lg border border-[#006AB9] bg-transparent px-4 text-sm font-medium text-[#006AB9] transition-all duration-200 hover:bg-[#006AB9] hover:text-[#F3F7FC] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 md:w-auto"
            >
              {buscandoReclameAqui ? 'Consultando...' : 'Consultar'}
            </button>
          </div>

          <FloatingLabelField
            id="form-reclamacao-edit-retorno-busca"
            label="Retorno da busca"
            value={formData.localizarAtendimentos}
            className="min-w-0"
          >
            <input
              type="text"
              readOnly
              title={formData.localizarAtendimentos || undefined}
              value={formData.localizarAtendimentos}
              className="h-12 min-h-12 box-border w-full cursor-default rounded-lg border border-gray-400 bg-gray-100 px-3 text-sm text-gray-700 outline-none dark:border-gray-500 dark:bg-gray-700 dark:text-gray-200"
              placeholder="—"
            />
          </FloatingLabelField>

          {fundirInlineAtivo && typeof onAbrirModalFusao === 'function' ? (
            <div className="flex min-w-0 items-end justify-stretch md:justify-end">
              <button
                type="button"
                onClick={() => onAbrirModalFusao()}
                className="box-border flex h-12 min-h-12 w-full items-center justify-center whitespace-nowrap rounded-lg border-2 px-3 text-sm font-semibold transition-colors hover:opacity-90 md:w-auto"
                style={{
                  borderColor: '#b91c1c',
                  color: '#991b1b',
                  backgroundColor: 'rgba(185, 28, 28, 0.1)',
                }}
                title="Fundir ocorrências"
              >
                Fundir
              </button>
            </div>
          ) : null}
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
          <div className="min-w-0">
            <FloatingLabelField
              id="form-reclamacao-edit-nome"
              label="Nome do Cliente"
              required
              value={formData.nome}
              error={errors.nome}
            >
              <input
                id="form-reclamacao-edit-nome"
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                className="box-border min-h-12 w-full rounded-lg border border-gray-400 px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                required
              />
            </FloatingLabelField>
          </div>
          <div className="min-w-0">
            {formData.telefones.lista.map((telefone, index) => (
              <div key={index} className="mb-2 flex gap-2">
                <FloatingLabelField
                  id={`form-reclamacao-edit-tel-${index}`}
                  label={index === 0 ? 'Telefone' : `Telefone (${index + 1})`}
                  value={telefone}
                  className="min-w-0 flex-1"
                >
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => atualizarTelefone(index, e.target.value)}
                    className={`min-h-12 box-border w-full rounded-lg px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
                      telefone.replace(/\D/g, '').length >= 10
                        ? 'border-2 border-green-500'
                        : 'border border-gray-400 dark:border-gray-500'
                    }`}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </FloatingLabelField>
                {formData.telefones.lista.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removerTelefone(index)}
                    className="inline-flex h-12 min-h-12 shrink-0 items-center justify-center rounded border px-3 text-sm transition-all duration-300 dark:bg-gray-700"
                    style={{
                      borderColor: '#dc2626',
                      color: '#dc2626',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#dc2626';
                      e.target.style.color = '#F3F7FC';
                      e.target.style.borderColor = '#dc2626';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = '#dc2626';
                      e.target.style.borderColor = '#dc2626';
                    }}
                  >
                    Remover
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:items-end">
          <FloatingLabelField id="form-reclamacao-edit-email" label="E-mail" value={formData.email} error={errors.email}>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                const formatted = formatarEmail(e.target.value);
                setFormData(prev => ({ ...prev, email: formatted }));
              }}
              className={`min-h-12 box-border w-full rounded-lg px-3 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
                formData.email && validarEmail(formData.email)
                  ? 'border-2 border-green-500'
                  : 'border border-gray-400 dark:border-gray-500'
              }`}
              placeholder="email@exemplo.com"
            />
          </FloatingLabelField>
          <div className="flex items-end justify-stretch md:justify-end">
            <button
              type="button"
              onClick={adicionarTelefone}
              aria-label="Adicionar telefone"
              title="Adicionar telefone"
              className="box-border flex h-12 min-h-12 min-w-[3rem] items-center justify-center rounded-lg border text-lg font-semibold leading-none transition-all duration-200 dark:bg-gray-800"
              style={{
                borderColor: '#006AB9',
                color: '#006AB9',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#006AB9';
                e.target.style.color = '#F3F7FC';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#006AB9';
              }}
            >
              +
            </button>
          </div>
        </div>

        <div className="mb-4">
          <FloatingLabelField id="form-reclamacao-edit-observacoes" label="Observações" value={formData.observacoes}>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              rows={4}
              placeholder="Digite as observações..."
            />
          </FloatingLabelField>
        </div>
      </div>

      {/* Campos específicos por tipo */}
      {formData.tipo === 'BACEN' && renderCamposBacen()}
      {formData.tipo === 'OUVIDORIA' && renderCamposOuvidoria()}
      {formData.tipo === 'RECLAME_AQUI' && renderCamposReclameAqui()}
      {formData.tipo === 'PROCON' && renderCamposProcon()}
      {formData.tipo === 'PROCESSOS' && renderCamposProcessos()}
      {formData.tipo === 'TIME_PORTABILIDADE' && renderCamposTimePortabilidade()}

      {/* Protocolos (BACEN/N2/Reclame Aqui/Ação Judicial) — antes de Tentativas */}
      {(formData.tipo === 'BACEN' || formData.tipo === 'OUVIDORIA' || formData.tipo === 'RECLAME_AQUI' || formData.tipo === 'PROCESSOS' || formData.tipo === 'PROCON') && renderProtocolos()}

      {/* Tentativas de Contato (BACEN/N2 apenas) */}
      {(formData.tipo === 'BACEN' || formData.tipo === 'OUVIDORIA') && renderTentativasContato()}

      {formData.tipo === 'TIME_PORTABILIDADE' && renderCanaisTimePortabilidade()}

      {/* Botões de Ação */}
      <div className="flex flex-wrap items-center justify-between gap-4 relative">
        {formData.tipo && formData.tipo !== 'TIME_PORTABILIDADE' ? (
          <OuvidoriaOctadeskTicketBar
            ticketRegistro={formData.ticketRegistro}
            gerando={gerandoTicketOcta}
            disabledGerar={Boolean(String(formData.ticketRegistro || '').trim())}
            disabledHint={
              String(formData.ticketRegistro || '').trim()
                ? 'Ticket de registro já preenchido.'
                : ''
            }
            onGerarTicket={handleGerarTicketOctadesk}
          />
        ) : (
          <div className="flex-1" />
        )}
        <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-12 min-h-12 box-border items-center gap-2 rounded border px-3 text-sm transition-all duration-300 dark:bg-gray-700"
          style={{
            borderColor: '#006AB9',
            color: '#006AB9',
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'linear-gradient(135deg, #006AB9 0%, #006AB9 100%)';
            e.target.style.color = '#F3F7FC';
            e.target.style.borderColor = '#006AB9';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.color = '#006AB9';
            e.target.style.borderColor = '#006AB9';
          }}
        >
          Cancelar
        </button>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={(e) => handleSubmit(e)}
            disabled={loading}
            className="inline-flex h-12 min-h-12 box-border items-center gap-2 rounded border px-3 text-sm transition-all duration-300 dark:bg-gray-700"
            style={{
              borderColor: '#006AB9',
              color: '#006AB9',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.background = 'linear-gradient(135deg, #006AB9 0%, #006AB9 100%)';
                e.target.style.color = '#F3F7FC';
                e.target.style.borderColor = '#006AB9';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.background = 'transparent';
                e.target.style.color = '#006AB9';
                e.target.style.borderColor = '#006AB9';
              }
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Salvando...
              </>
            ) : (
              <>
                Salvar Ocorrência
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
          
          {/* Dropdown de opções */}
          {showSaveOptions && !loading && (
            <div 
              className="absolute right-0 bottom-full mb-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 z-50"
              style={{
                border: '1px solid #1634FF'
              }}
            >
              <div className="py-1" role="menu">
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'em-andamento')}
                  className="flex min-h-12 w-full items-center px-4 text-left text-sm font-medium transition-colors"
                  style={{
                    color: '#F3F7FC',
                    backgroundColor: 'rgba(0, 106, 185, 0.7)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(0, 90, 158, 0.7)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(0, 106, 185, 0.7)';
                  }}
                  role="menuitem"
                >
                  Em Andamento
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'resolvido')}
                  className="flex min-h-12 w-full items-center px-4 text-left text-sm font-medium transition-colors"
                  style={{
                    color: '#F3F7FC',
                    backgroundColor: 'rgba(21, 162, 55, 0.7)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(18, 138, 46, 0.7)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(21, 162, 55, 0.7)';
                  }}
                  role="menuitem"
                >
                  Resolvido
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </form>

    <ModalHistoricoRequisicaoCpf
      data={
        modalHistoricoLiberacaoCpf
          ? {
              cpfDisplay: modalHistoricoLiberacaoCpf.cpfDisplay,
              abertas: modalHistoricoLiberacaoCpf.abertas,
              resolvidas: modalHistoricoLiberacaoCpf.resolvidas,
            }
          : null
      }
      onClose={fecharModalHistoricoLiberacaoCpf}
      onConfirm={confirmarModalHistoricoLiberacaoCpf}
      confirmLabel="Continuar solicitação"
      titleId="ouvid-edit-modal-historico-liberacao-cpf-title"
    />

    {liberacaoModalCtx ? (
      <ModalSolicitarLiberacaoPix
        open={Boolean(liberacaoModalCtx)}
        onClose={() => setLiberacaoModalCtx(null)}
        origem={liberacaoModalCtx.origem}
        nomeCliente={formData.nome}
        cpf={formData.cpf}
        agente={resolverAgenteParaLiberacao()}
        tipoOuvidoriaApi={liberacaoModalCtx.tipoApi}
        reclamacaoId={
          liberacaoModalCtx.reclamacaoId != null
            ? String(liberacaoModalCtx.reclamacaoId)
            : reclamacao?._id != null
              ? String(reclamacao._id)
              : reclamacao?.id != null
                ? String(reclamacao.id)
                : null
        }
        ouvidoriaNumeroProtocolo={
          String(resolveOctadeskTicketFromForm(formData) || '').trim() || undefined
        }
        onSuccess={handleLiberacaoPixSucesso}
      />
    ) : null}

    {/* Modal de Registros Reclame Aqui (para Procon) */}
    {mostrarModalReclameAqui && (
      <div
        className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center backdrop-blur-sm p-4 z-50"
        onClick={() => setMostrarModalReclameAqui(false)}
      >
        <div
          className="rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-white dark:bg-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold velohub-title">
              Registros Reclame Aqui Encontrados ({reclameAquiRegistros.length})
            </h3>
            <button
              onClick={() => setMostrarModalReclameAqui(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-2xl"
            >
              ×
            </button>
          </div>
          <div className="overflow-y-auto flex-1 p-6">
            {reclameAquiRegistros.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">Nenhum registro encontrado.</p>
            ) : (
              <div className="space-y-4">
                {reclameAquiRegistros.map((registro, index) => (
                  <div
                    key={registro._id || index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          ID Entrada: <span className="font-normal">{registro.idEntrada || 'N/A'}</span>
                        </p>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Data Ocorrência: <span className="font-normal">
                            {registro.dataReclam ? formatDateRegistro(registro.dataReclam) : 'N/A'}
                          </span>
                        </p>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Motivo: <span className="font-normal">{registro.motivoReduzido || 'N/A'}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Responsável: <span className="font-normal">{registro.responsavel || 'N/A'}</span>
                        </p>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Status: <span className="font-normal">
                            {registro.Finalizado?.Resolvido ? 'Resolvido' : 'Em Aberto'}
                          </span>
                        </p>
                        {registro.motivoDetalhado && (
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">
                            Descrição: <span className="font-normal text-xs">{registro.motivoDetalhado}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </div>
  );
};

export default FormReclamacaoEdit;
