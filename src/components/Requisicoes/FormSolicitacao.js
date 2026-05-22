/**
 * VeloHub V3 — FormSolicitacao (módulo Requisições)
 * VERSION: v1.21.13 | DATE: 2026-05-20 | AUTHOR: VeloHub Development Team
 *
 * Branch: requisicoes
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.21.13: Layout — CPF+Ticket mesma linha; tipo e blocos condicionais em container-secondary
 * - v1.21.12: Agente campo — escopo por userMail (`getVelotaxAgentForLoggedUser` / `setVelotaxAgentForLoggedUser`; sem cache `velotax_agent` entre contas)
 * - v1.21.11: Modal antes do POST também quando só existem solicitações já resolvidas na aba (histórico); título diferenciado sem «em aberto»
 * - v1.21.10: Modal portal (layout abertas/resolvidas, confirmar/fechar) + overlay «Verificando…» antes do POST
 * - v1.21.9: Antes do POST — GET por CPF + modal «Requisição em aberto» (abertas enviado / resolvidas); confirmar prossegue o envio
 * - v1.21.8: Imports atualizados para `requisicoesApi.js` (URLs /api/escalacoes inalteradas)
 * - v1.20.4: Aba Liberação chave pix: quadro do payload — só «Origem» até escolher origem; depois booleans visíveis exceto redundantes (ex.: origem Reclame Aqui oculta checkbox Reclame Aqui)
 * - v1.20.3: Aba Liberação chave pix: cache local em `velotax_local_logs_chave_pix` (paridade sidebar Solicitações sem misturar envios)
 */

import React, { useEffect, useState, useCallback, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FloatingLabelField } from '../shared/FloatingLabelField';
import SolicitacaoUrgenteBlock from './SolicitacaoUrgenteBlock';
import { solicitacoesAPI } from '../../services/requisicoesApi';
import { getVelotaxAgentForLoggedUser, setVelotaxAgentForLoggedUser } from '../../services/auth';
import {
  LIBERACAO_PIX_BOOLEAN_ROWS,
  getLiberacaoChavePixBooleanKeyOcultoPorOrigem,
  getLiberacaoChavePixEffectiveBooleans,
} from '../../utils/liberacaoChavePixRules';
import {
  filterSolicitacoesGetListByRequisicoesTab,
  partitionRequisicoesAbertasResolvidasParaModal,
} from '../../utils/requisicoesModalHelpers';

/** Origens do campo «Origem» (aba Liberação chave pix). */
const ORIGENS_LIBERACAO_CHAVE_PIX = [
  'Time Portabilidade',
  'N2 Pix',
  'Reclame Aqui',
  'Bacen',
  'Procon',
  'Judicial',
];

/** Tipos de solicitação técnica — exclusão de conta (app / Celcoin); mesmos checkboxes dinâmicos. */
const TIPOS_EXCLUSAO_CONTA = ['Excluir conta - app', 'Excluir conta - Celcoin'];

const isTipoExclusaoConta = (tipo) => TIPOS_EXCLUSAO_CONTA.includes(tipo);

/** YYYY-MM-DD → Date meia-noite local (evita parse UTC de ISO date-only). */
const parseIsoDateLocal = (yyyyMmDd) => {
  if (!yyyyMmDd || typeof yyyyMmDd !== 'string') return null;
  const parts = yyyyMmDd.trim().split('-').map((x) => parseInt(x, 10));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt;
};

const startOfLocalDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Dias corridos entre data de contratação (local) e hoje (local); null se inválido. */
const diffCalendarDaysContractToToday = (yyyyMmDd) => {
  const contr = parseIsoDateLocal(yyyyMmDd);
  if (!contr) return null;
  const hoje = startOfLocalDay(new Date());
  const c0 = startOfLocalDay(contr);
  return Math.round((hoje - c0) / 86400000);
};

/**
 * Componente de formulário para solicitações técnicas
 * @param {Function} registrarLog - Função para registrar logs
 * @param {Array} [solicitacoesServerList] - Lista GET já carregada pelo pai (evita segundo fetch)
 * @param {boolean} [solicitacoesStatsLoading] - Enquanto true, não reconcilia com lista vazia
 * @param {Function} [onRefreshSolicitacoesForLogs] - Recarrega lista no pai (ex.: loadStats)
 * @param {boolean} [liberacaoChavePixTab] - Se true, tipo fixo «Exclusão de Chave PIX» e sem seletor de tipo (aba Liberação chave pix)
 * @param {object|null} [liberacaoPixSelectedDoc] - Documento selecionado na sidebar (exibe Protocolo Ouvidoria quando houver)
 */
const FormSolicitacao = forwardRef(function FormSolicitacao(
  {
    registrarLog,
    solicitacoesServerList = [],
    solicitacoesStatsLoading = true,
    onRefreshSolicitacoesForLogs,
    liberacaoChavePixTab = false,
    liberacaoPixSelectedDoc = null,
  },
  ref
) {
  const [form, setForm] = useState({
    agente: '',
    cpf: '',
    tipo: liberacaoChavePixTab ? 'Exclusão de Chave PIX' : 'Alteração de Dados Cadastrais',
    infoTipo: 'Telefone',
    dadoAntigo: '',
    dadoNovo: '',
    fotosVerificadas: false,
    observacoes: '',
    // Campos para Exclusão de Chave PIX
    origem: '',
    nomeCliente: '',
    semDebitoAberto: false,
    n2Ouvidora: false,
    procon: false,
    reclameAqui: false,
    processo: false,
    bacen: false,
    revogadoConsentimentoEcac: false,
    prazoMaximo: '',
    // Campos para Aumento de Limite Pix e Cancelamento
    valor: '',
    dataContratacao: '',
    // Campos para Cancelamento (existente)
    seguroPrestamista: false,
    seguroSaude: false,
    seguroCelular: false,
    seguroDividaZero: false,
    clubeVelotax: false,
    dentroDos7Dias: false,
    depoisDos7Dias: false,
    // Devolução de Antecipação (não reutilizar dataContratacao do Cancelamento)
    devolucaoDataContratacao: '',
    obsClienteDevolucao: '',
    analiseExcecaoDevolucao: false,
    // Excluir conta - app | Excluir conta - Celcoin
    exclusaoContaSemDebitoAberto: false,
    exclusaoContaSemChavePixAssociada: false,
    exclusaoContaSemValorSaldo: false,
    urgenciaN2: false,
    urgenciaRa: false,
    urgenciaBacen: false,
    urgenciaProcon: false,
    /** Tipo «Solicitação de documentos» */
    documentos: '',
    ticketOctadesk: '',
  });
  const [painelUrgenteAberto, setPainelUrgenteAberto] = useState(false);
  const [loading, setLoading] = useState(false);
  /** Varredura GET por CPF antes do envio */
  const [verificandoRequisicoesCpf, setVerificandoRequisicoesCpf] = useState(false);
  /** null | { cpfDigits, cpfDisplay, abertas, resolvidas, pending: { solicitacaoData, agenteNorm } } — qualquer histórico na aba para o CPF */
  const [modalRequisicaoCpfAberta, setModalRequisicaoCpfAberta] = useState(null);
  const [cpfError, setCpfError] = useState('');
  const [buscaCpf, setBuscaCpf] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [buscaResultados, setBuscaResultados] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  /**
   * Exibir notificação simples
   * @param {string} message - Mensagem a exibir
   * @param {string} type - Tipo da notificação (success, error, info)
   */
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  /** Formata `createdAt` para exibição no modal de CPF em aberto. */
  const formatDataAberturaRequisicaoModal = (iso) => {
    if (iso == null || iso === '') return '—';
    const d = new Date(iso);
    return Number.isFinite(d.getTime()) ? d.toLocaleString('pt-BR') : '—';
  };

  /** Notificação do browser (fallback quando o POST falha) */
  const notifyBrowserError = (title, body) => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, { body });
        } else {
          Notification.requestPermission()
            .then((p) => {
              if (p === 'granted') new Notification(title, { body });
            })
            .catch(() => {});
        }
      }
    } catch (err) {
      console.error('Erro ao exibir notificação:', err);
    }
  };

  /**
   * Normalizar nome do agente (Title Case, espaços simples)
   * @param {string} s - String a normalizar
   * @returns {string} String normalizada
   */
  const toTitleCase = (s = '') => {
    const lower = String(s).toLowerCase().replace(/\s+/g, ' ').trim();
    const keepLower = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);
    return lower.split(' ').filter(Boolean).map((p, i) => {
      if (i > 0 && keepLower.has(p)) return p;
      return p.charAt(0).toUpperCase() + p.slice(1);
    }).join(' ');
  };

  useEffect(() => {
    try {
      const agent = String(getVelotaxAgentForLoggedUser() || '').trim();
      if (agent) setForm((prev) => ({ ...prev, agente: toTitleCase(agent) }));
    } catch (err) {
      console.error('Erro ao carregar agente:', err);
    }
  }, []);


  // Garantir formatação quando componente monta com Telefone como padrão
  useEffect(() => {
    if (form.tipo === 'Alteração de Dados Cadastrais') {
      // Forçar atualização dos campos para aplicar formatação
      setForm(prev => {
        const novoForm = { ...prev };
        if (prev.infoTipo === 'Telefone') {
          if (prev.dadoAntigo) {
            novoForm.dadoAntigo = formatarTelefone(prev.dadoAntigo);
          }
          if (prev.dadoNovo) {
            novoForm.dadoNovo = formatarTelefone(prev.dadoNovo);
          }
        } else if (prev.infoTipo === 'E-mail') {
          if (prev.dadoAntigo) {
            novoForm.dadoAntigo = formatarEmail(prev.dadoAntigo);
          }
          if (prev.dadoNovo) {
            novoForm.dadoNovo = formatarEmail(prev.dadoNovo);
          }
        }
        return novoForm;
      });
    }
  }, []); // Executa apenas na montagem

  /**
   * Buscar solicitações por CPF
   */
  const buscarCpf = async () => {
    const digits = String(buscaCpf || '').replace(/\D/g, '');
    if (!digits) {
      setBuscaResultados([]);
      return;
    }
    setBuscando(true);
    try {
      const results = await solicitacoesAPI.getByCpf(digits);
      setBuscaResultados(Array.isArray(results.data) ? results.data : []);
    } catch (err) {
      console.error('Erro ao buscar CPF:', err);
      setBuscaResultados([]);
    }
    setBuscando(false);
  };

  /**
   * Atualizar status dos logs localmente (exposto à sidebar via ref)
   */
  const refreshLocalLogs = useCallback(async () => {
    if (typeof onRefreshSolicitacoesForLogs === 'function') {
      try {
        await onRefreshSolicitacoesForLogs();
      } catch (err) {
        console.error('Erro ao atualizar logs:', err);
      }
    }
  }, [onRefreshSolicitacoesForLogs]);

  useImperativeHandle(ref, () => ({
    refreshLocalLogs,
  }), [refreshLocalLogs]);

  /**
   * Formatar telefone no formato (XX)91234-5678 (celular brasileiro - 11 dígitos)
   * @param {string} valor - Valor a formatar
   * @returns {string} Telefone formatado
   */
  const formatarTelefone = (valor) => {
    // Remove tudo que não é dígito
    const digits = String(valor || '').replace(/\D/g, '');
    
    // Limita a 11 dígitos (XX)91234-5678
    const limited = digits.slice(0, 11);
    
    if (limited.length === 0) return '';
    if (limited.length <= 2) return `(${limited}`;
    if (limited.length <= 7) return `(${limited.slice(0, 2)})${limited.slice(2)}`;
    return `(${limited.slice(0, 2)})${limited.slice(2, 7)}-${limited.slice(7)}`;
  };

  /**
   * Validar telefone completo (11 dígitos para celular brasileiro)
   * @param {string} valor - Valor a validar
   * @returns {boolean} True se válido
   */
  const validarTelefone = (valor) => {
    const digits = String(valor || '').replace(/\D/g, '');
    return digits.length === 11;
  };

  /**
   * Formatar CPF no formato 000.000.000-00
   * @param {string} valor - Valor a formatar
   * @returns {string} CPF formatado
   */
  const formatarCPF = (valor) => {
    // Remove tudo que não é dígito
    const digits = String(valor || '').replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limited = digits.slice(0, 11);
    
    if (limited.length === 0) return '';
    if (limited.length <= 3) return limited;
    if (limited.length <= 6) return `${limited.slice(0, 3)}.${limited.slice(3)}`;
    if (limited.length <= 9) return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`;
  };

  /**
   * Validar CPF completo (11 dígitos)
   * @param {string} valor - Valor a validar
   * @returns {boolean} True se válido
   */
  const validarCPF = (valor) => {
    const digits = String(valor || '').replace(/\D/g, '');
    return digits.length === 11;
  };

  const devolucaoAntecInfo = useMemo(() => {
    if (form.tipo !== 'Devolução de Antecipação') {
      return {
        diffDays: null,
        hasValidDate: false,
        elegivel: false,
        inelegivelPorPrazoOuFuturo: false,
        dateBorderClass: 'border-gray-400 dark:border-gray-500',
      };
    }
    const raw = String(form.devolucaoDataContratacao || '').trim();
    if (!raw) {
      return {
        diffDays: null,
        hasValidDate: false,
        elegivel: false,
        inelegivelPorPrazoOuFuturo: false,
        dateBorderClass: 'border-gray-400 dark:border-gray-500',
      };
    }
    const diffDays = diffCalendarDaysContractToToday(raw);
    if (diffDays === null) {
      return {
        diffDays: null,
        hasValidDate: false,
        elegivel: false,
        inelegivelPorPrazoOuFuturo: false,
        dateBorderClass: 'border-gray-400 dark:border-gray-500',
      };
    }
    const elegivel = diffDays >= 0 && diffDays < 7;
    const inelegivel = diffDays < 0 || diffDays >= 7;
    let dateBorderClass = 'border-gray-400 dark:border-gray-500 focus:ring-1 focus:ring-blue-500';
    if (elegivel) {
      dateBorderClass = 'border-green-500 focus:ring-2 focus:ring-green-500';
    } else if (inelegivel) {
      dateBorderClass = 'border-red-500 focus:ring-2 focus:ring-red-500';
    }
    return {
      diffDays,
      hasValidDate: true,
      elegivel,
      inelegivelPorPrazoOuFuturo: inelegivel,
      dateBorderClass,
    };
  }, [form.tipo, form.devolucaoDataContratacao]);

  const formularioPodeEnviar = useMemo(() => {
    if (form.tipo === 'Solicitação de documentos') {
      const cpfOk = String(form.cpf || '').replace(/\D/g, '').length === 11;
      return cpfOk && String(form.documentos || '').trim() !== '';
    }
    if (form.tipo !== 'Devolução de Antecipação') return true;
    const cpfOk = String(form.cpf || '').replace(/\D/g, '').length === 11;
    if (!cpfOk) return false;
    if (!devolucaoAntecInfo.hasValidDate) return false;
    if (devolucaoAntecInfo.elegivel) return true;
    return !!(form.analiseExcecaoDevolucao && String(form.obsClienteDevolucao || '').trim());
  }, [
    form.tipo,
    form.cpf,
    form.documentos,
    form.analiseExcecaoDevolucao,
    form.obsClienteDevolucao,
    devolucaoAntecInfo.hasValidDate,
    devolucaoAntecInfo.elegivel,
  ]);

  /**
   * Formatar email (mantém formato básico, não força máscara rígida)
   * @param {string} valor - Valor a formatar
   * @returns {string} Email formatado (em lowercase, sem espaços)
   */
  const formatarEmail = (valor) => {
    return String(valor || '').toLowerCase().trim().replace(/\s+/g, '');
  };

  /**
   * Formatar valor monetário no formato brasileiro R$ 1.234,56
   * Formatação reativa: digitação preenche do centavo para a dezena de centavo, depois unidade, dezena, centena, etc.
   * @param {string} valor - Valor a formatar (pode conter R$, pontos, vírgulas, etc.)
   * @returns {string} Valor formatado no padrão R$ X.XXX,XX
   */
  const formatarMoeda = (valor) => {
    // Remove tudo que não é dígito
    const digits = String(valor || '').replace(/\D/g, '');
    
    // Se não há dígitos, retorna vazio
    if (digits.length === 0) return '';
    
    // Converte para número e divide por 100 para obter centavos
    const valorNumerico = parseInt(digits, 10) / 100;
    
    // Formata com separador de milhar (.) e decimal (,)
    const valorFormatado = valorNumerico.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    // Adiciona prefixo R$
    return `R$ ${valorFormatado}`;
  };

  /**
   * Validar formato de email (deve ter pelo menos: parte@dominio.extensão)
   * Aceita extensões: .com, .com.br, .gov, .net, .org, .co, etc.
   * @param {string} valor - Email a validar
   * @returns {boolean} True se formato válido
   */
  const validarEmail = (valor) => {
    const email = String(valor || '').trim();
    if (!email) return false;
    
    // Regex para validar formato básico: parte@dominio.extensão
    // Aceita extensões comuns: .com, .com.br, .gov, .net, .org, .co, etc.
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/;
    
    // Verifica se tem pelo menos: parte@dominio.com (ou similar)
    return emailRegex.test(email);
  };

  // Reformatar campos quando tipo de informação mudar para Telefone ou E-mail
  useEffect(() => {
    if (form.tipo === 'Alteração de Dados Cadastrais') {
      setForm(prev => {
        let atualizado = false;
        const novoForm = { ...prev };
        
        if (prev.infoTipo === 'Telefone') {
          // Reformatar dadoAntigo se tiver valor (mesmo que parcial)
          if (prev.dadoAntigo && prev.dadoAntigo.trim() !== '') {
            const formatted = formatarTelefone(prev.dadoAntigo);
            if (formatted !== prev.dadoAntigo) {
              novoForm.dadoAntigo = formatted;
              atualizado = true;
            }
          }
          
          // Reformatar dadoNovo se tiver valor (mesmo que parcial)
          if (prev.dadoNovo && prev.dadoNovo.trim() !== '') {
            const formatted = formatarTelefone(prev.dadoNovo);
            if (formatted !== prev.dadoNovo) {
              novoForm.dadoNovo = formatted;
              atualizado = true;
            }
          }
        } else if (prev.infoTipo === 'E-mail') {
          // Reformatar dadoAntigo se tiver valor
          if (prev.dadoAntigo && prev.dadoAntigo.trim() !== '') {
            const formatted = formatarEmail(prev.dadoAntigo);
            if (formatted !== prev.dadoAntigo) {
              novoForm.dadoAntigo = formatted;
              atualizado = true;
            }
          }
          
          // Reformatar dadoNovo se tiver valor
          if (prev.dadoNovo && prev.dadoNovo.trim() !== '') {
            const formatted = formatarEmail(prev.dadoNovo);
            if (formatted !== prev.dadoNovo) {
              novoForm.dadoNovo = formatted;
              atualizado = true;
            }
          }
        }
        
        return atualizado ? novoForm : prev;
      });
    }
  }, [form.infoTipo, form.tipo]);

  /**
   * Atualizar campo do formulário
   * @param {string} campo - Nome do campo
   * @param {any} valor - Valor do campo
   */
  const atualizar = (campo, valor) => {
    setForm(prev => {
      let valorFinal = valor;
      
      // Aplicar formatação de CPF se necessário
      if (campo === 'cpf') {
        valorFinal = formatarCPF(valor);
      }
      
      // Aplicar formatação de telefone se necessário - SEMPRE quando tipo é Telefone
      if (prev.tipo === 'Alteração de Dados Cadastrais' && prev.infoTipo === 'Telefone') {
        if (campo === 'dadoAntigo' || campo === 'dadoNovo') {
          // Aplicar formatação mesmo se o valor estiver vazio ou parcial
          valorFinal = formatarTelefone(valor);
        }
      }
      
      // Aplicar formatação de email se necessário - SEMPRE quando tipo é E-mail
      if (prev.tipo === 'Alteração de Dados Cadastrais' && prev.infoTipo === 'E-mail') {
        if (campo === 'dadoAntigo' || campo === 'dadoNovo') {
          // Formatar email (lowercase, sem espaços)
          valorFinal = formatarEmail(valor);
        }
      }
      
      // Aplicar formatação de moeda se necessário - SEMPRE quando tipo é Aumento de Limite Pix ou Cancelamento e campo é valor
      if ((prev.tipo === 'Aumento de Limite Pix' || prev.tipo === 'Cancelamento') && campo === 'valor') {
        valorFinal = formatarMoeda(valor);
      }
      
      const novoForm = { ...prev, [campo]: valorFinal };
      
      // Processar campos específicos
      if (campo === 'cpf') {
        setCpfError('');
      }
      if (campo === 'agente') {
        const norm = toTitleCase(valor);
        try {
          setVelotaxAgentForLoggedUser(norm);
        } catch (err) {
          console.error('Erro ao salvar agente:', err);
        }
      }
      
      return novoForm;
    });
  };

  /**
   * Montar mensagem para WhatsApp
   * @returns {string} Mensagem formatada
   */
  const montarMensagem = () => {
    const simNao = v => (v ? '✅ Sim' : '❌ Não');
    const typeMap = {
      'Exclusão de Chave PIX': 'Exclusão de Chave PIX',
      'Alteração de Dados Cadastrais': 'Alteração de Dados Cadastrais',
      'Reativação de Conta': 'Reativação de Conta',
      'Cancelamento': 'Cancelamento',
      'Reset de Senha': 'Reset de Senha',
      'Aumento de Limite Pix': 'Aumento de Limite Pix',
      'Devolução de Antecipação': 'Devolução de Antecipação',
      'Excluir conta - app': 'Excluir conta - app',
      'Excluir conta - Celcoin': 'Excluir conta - Celcoin',
      'Solicitação de documentos': 'Solicitação de documentos',
    };
    const tipoCanon = typeMap[form.tipo] || toTitleCase(String(form.tipo || ''));
    const cpfNorm = String(form.cpf || '').replace(/\s+/g, ' ').trim();
    let msg = `*Nova Solicitação Técnica - ${tipoCanon}*\n\n`;
    msg += `Agente: ${form.agente}\nCPF: ${cpfNorm}\n\n`;

    if (form.tipo === 'Alteração de Dados Cadastrais') {
      msg += `Tipo de informação: ${form.infoTipo}\n`;
      msg += `Dado antigo: ${form.dadoAntigo}\n`;
      msg += `Dado novo: ${form.dadoNovo}\n`;
      msg += `Fotos verificadas: ${simNao(form.fotosVerificadas)}\n`;
      msg += `Observações: ${form.observacoes || '—'}\n`;
    } else if (form.tipo === 'Exclusão de Chave PIX') {
      if (liberacaoChavePixTab) {
        msg += `Nome: ${String(form.nomeCliente || '').trim() || '—'}\n`;
        msg += `Origem: ${String(form.origem || '').trim() || '—'}\n`;
      }
      const pixB =
        liberacaoChavePixTab && String(form.origem || '').trim()
          ? getLiberacaoChavePixEffectiveBooleans(form)
          : {
              semDebitoAberto: form.semDebitoAberto,
              n2Ouvidora: form.n2Ouvidora,
              procon: form.procon,
              reclameAqui: form.reclameAqui,
              processo: form.processo,
              bacen: form.bacen,
              revogadoConsentimentoEcac: form.revogadoConsentimentoEcac,
            };
      msg += `Sem Débito em aberto: ${simNao(!!pixB.semDebitoAberto)}\n`;
      msg += `N2 - Ouvidora: ${simNao(!!pixB.n2Ouvidora)}\n`;
      msg += `Procon: ${simNao(!!pixB.procon)}\n`;
      msg += `Reclame Aqui: ${simNao(!!pixB.reclameAqui)}\n`;
      msg += `Processo: ${simNao(!!pixB.processo)}\n`;
      msg += `Bacen: ${simNao(!!pixB.bacen)}\n`;
      msg += `Revogado consentimento ECAC: ${simNao(!!pixB.revogadoConsentimentoEcac)}\n`;
      if (form.prazoMaximo) {
        // Formatar data de YYYY-MM-DD para DD/MM/YYYY
        const dataFormatada = form.prazoMaximo.split('-').reverse().join('/');
        msg += `Prazo Máximo: ${dataFormatada}\n`;
      }
      msg += `Observações: ${form.observacoes || '—'}\n`;
    } else if (form.tipo === 'Aumento de Limite Pix') {
      msg += `Valor: ${form.valor || '—'}\n`;
      msg += `Observações: ${form.observacoes || '—'}\n`;
    } else if (form.tipo === 'Cancelamento') {
      msg += `Nome do Cliente: ${form.nomeCliente || '—'}\n`;
      msg += `Data da Contratação: ${form.dataContratacao || '—'}\n`;
      msg += `Valor: ${form.valor || '—'}\n`;
      msg += `Observações: ${form.observacoes || '—'}\n`;
    } else if (isTipoExclusaoConta(form.tipo)) {
      const b1 = form.exclusaoContaSemDebitoAberto === true;
      const b2 = form.exclusaoContaSemChavePixAssociada === true;
      const b3 = form.exclusaoContaSemValorSaldo === true;
      msg += `Sem débito em aberto: ${simNao(b1)}\n`;
      msg += `Sem chave PIX associada: ${simNao(b2)}\n`;
      msg += `Sem valor em saldo: ${simNao(b3)}\n`;
      msg += `Observações: ${form.observacoes || '—'}\n`;
    } else if (form.tipo === 'Devolução de Antecipação') {
      const dc = form.devolucaoDataContratacao || '—';
      let dcFmt = dc;
      if (typeof dc === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dc)) {
        dcFmt = dc.split('-').reverse().join('/');
      }
      const diff = diffCalendarDaysContractToToday(form.devolucaoDataContratacao);
      const eleg =
        diff !== null && diff >= 0 && diff < 7
          ? 'Elegível (menos de 7 dias corridos desde a contratação)'
          : diff !== null
            ? `Inelegível (${diff < 0 ? 'data futura' : '7 dias ou mais desde a contratação'})`
            : 'Data não informada ou inválida';
      msg += `Data da Contratação: ${dcFmt}\n`;
      msg += `Situação prazo: ${eleg}\n`;
      if (diff !== null) msg += `Dias corridos (contratação → hoje, local): ${diff}\n`;
      msg += `Obs do cliente: ${String(form.obsClienteDevolucao || '').trim() || '—'}\n`;
      msg += `Análise de exceção: ${simNao(form.analiseExcecaoDevolucao)}\n`;
      msg += `Observações (geral): ${form.observacoes || '—'}\n`;
    } else if (form.tipo === 'Solicitação de documentos') {
      msg += `Documentos: ${String(form.documentos || '').trim() || '—'}\n`;
      msg += `Observações: ${form.observacoes || '—'}\n`;
    } else {
      msg += `Observações: ${form.observacoes || '—'}\n`;
    }

    const urgTags = [];
    if (form.urgenciaN2) urgTags.push('N2');
    if (form.urgenciaRa) urgTags.push('RA');
    if (form.urgenciaBacen) urgTags.push('Bacen');
    if (form.urgenciaProcon) urgTags.push('ProCon');
    if (urgTags.length) {
      msg += `\n*Solicitação urgente*: ${urgTags.join(', ')}\n`;
    }

    return msg;
  };

  /**
   * POST da solicitação (após validação e, se necessário, confirmação no modal de CPF).
   * @param {Object} solicitacaoData
   * @param {string} agenteNorm
   */
  const executarPostSolicitacao = async (solicitacaoData, agenteNorm) => {
    setLoading(true);
    if (registrarLog) registrarLog('Iniciando envio...');
    try {
      console.log('📤 [FormSolicitacao] Enviando solicitação:', {
        tipo: solicitacaoData.tipo,
        cpf: solicitacaoData.cpf,
        agente: solicitacaoData.agente,
        payloadKeys: Object.keys(solicitacaoData.payload),
      });

      let result;
      try {
        result = await solicitacoesAPI.create(solicitacaoData);
        console.log('✅ [FormSolicitacao] Solicitação criada no backend:', result);
      } catch (apiErr) {
        console.error('❌ [FormSolicitacao] Erro ao criar solicitação no backend:', apiErr);
        throw apiErr;
      }

      if (registrarLog) registrarLog('✅ Solicitação registrada');
      showNotification('Solicitação registrada', 'success');

      if (typeof onRefreshSolicitacoesForLogs === 'function') {
        try {
          await onRefreshSolicitacoesForLogs();
        } catch (refErr) {
          console.error('[FormSolicitacao] Erro ao atualizar lista no pai após create:', refErr);
        }
      }

      setForm({
        agente: agenteNorm || '',
        cpf: '',
        tipo: liberacaoChavePixTab ? 'Exclusão de Chave PIX' : 'Alteração de Dados Cadastrais',
        infoTipo: 'Telefone',
        dadoAntigo: '',
        dadoNovo: '',
        fotosVerificadas: false,
        observacoes: '',
        origem: '',
        nomeCliente: '',
        semDebitoAberto: false,
        n2Ouvidora: false,
        procon: false,
        reclameAqui: false,
        processo: false,
        bacen: false,
        revogadoConsentimentoEcac: false,
        prazoMaximo: '',
        valor: '',
        dataContratacao: '',
        seguroPrestamista: false,
        seguroSaude: false,
        seguroCelular: false,
        seguroDividaZero: false,
        clubeVelotax: false,
        dentroDos7Dias: false,
        depoisDos7Dias: false,
        devolucaoDataContratacao: '',
        obsClienteDevolucao: '',
        analiseExcecaoDevolucao: false,
        exclusaoContaSemDebitoAberto: false,
        exclusaoContaSemChavePixAssociada: false,
        exclusaoContaSemValorSaldo: false,
        urgenciaN2: false,
        urgenciaRa: false,
        urgenciaBacen: false,
        urgenciaProcon: false,
        documentos: '',
      });
      setPainelUrgenteAberto(false);
    } catch (err) {
      console.error('❌ [FormSolicitacao] Erro ao enviar solicitação:', err);
      console.error('❌ [FormSolicitacao] Detalhes do erro:', {
        message: err.message,
        stack: err.stack,
        tipo: form.tipo,
        cpf: form.cpf,
      });
      if (registrarLog) registrarLog(`❌ Falha de conexão com a API: ${err.message || 'Erro desconhecido'}`);
      showNotification(`Falha de conexão: ${err.message || 'Erro desconhecido'}`, 'error');
      notifyBrowserError('Falha de conexão', err.message || 'Não foi possível contactar a API');
    } finally {
      setLoading(false);
    }
  };

  const fecharModalRequisicaoCpfAberta = () => setModalRequisicaoCpfAberta(null);

  const confirmarModalRequisicaoEEnviar = async () => {
    const m = modalRequisicaoCpfAberta;
    if (!m?.pending) {
      fecharModalRequisicaoCpfAberta();
      return;
    }
    const { solicitacaoData, agenteNorm } = m.pending;
    fecharModalRequisicaoCpfAberta();
    await executarPostSolicitacao(solicitacaoData, agenteNorm);
  };

  /**
   * Enviar solicitação
   * @param {Event} e - Evento do formulário
   */
  const enviar = async (e) => {
    e.preventDefault();
    const digits = String(form.cpf || '').replace(/\D/g, '');
    if (digits.length !== 11) {
      setCpfError('CPF inválido. Digite os 11 dígitos.');
      showNotification('CPF inválido. Digite os 11 dígitos.', 'error');
      return;
    }
    if (liberacaoChavePixTab && !String(form.origem || '').trim()) {
      showNotification('Selecione a origem.', 'error');
      return;
    }
    if (liberacaoChavePixTab && !String(form.nomeCliente || '').trim()) {
      showNotification('Informe o nome.', 'error');
      return;
    }
    if (form.tipo === 'Exclusão de Chave PIX') {
      const pixEff = liberacaoChavePixTab
        ? getLiberacaoChavePixEffectiveBooleans(form)
        : {
            semDebitoAberto: form.semDebitoAberto,
            n2Ouvidora: form.n2Ouvidora,
            procon: form.procon,
            reclameAqui: form.reclameAqui,
            processo: form.processo,
            bacen: form.bacen,
            revogadoConsentimentoEcac: form.revogadoConsentimentoEcac,
          };
      if (
        !pixEff.semDebitoAberto &&
        !pixEff.n2Ouvidora &&
        !pixEff.procon &&
        !pixEff.reclameAqui &&
        !pixEff.processo &&
        !pixEff.bacen &&
        !pixEff.revogadoConsentimentoEcac
      ) {
        showNotification(
          liberacaoChavePixTab
            ? 'Marque pelo menos uma opção entre as condições exibidas (ou confira a origem: ela já pode cobrir N2, Procon, Reclame Aqui, Processo ou Bacen).'
            : 'Para Exclusão de Chave PIX, selecione pelo menos uma opção: Sem Débito em aberto, N2 - Ouvidora, Procon, Reclame Aqui, Processo, Bacen ou Revogado consentimento ECAC.',
          'error'
        );
        return;
      }
    }
    if (isTipoExclusaoConta(form.tipo)) {
      const tri = [
        form.exclusaoContaSemDebitoAberto,
        form.exclusaoContaSemChavePixAssociada,
        form.exclusaoContaSemValorSaldo,
      ];
      if (tri.some((v) => v !== true && v !== false)) {
        showNotification(
          'Cada condição de exclusão de conta deve estar definida como Sim ou Não (marcado ou desmarcado).',
          'error'
        );
        return;
      }
    }
    if (form.tipo === 'Solicitação de documentos' && !String(form.documentos || '').trim()) {
      showNotification('Informe o campo Documentos.', 'error');
      return;
    }
    if (form.tipo === 'Devolução de Antecipação' && !formularioPodeEnviar) {
      showNotification(
        'Devolução de Antecipação: informe uma data de contratação válida. Fora do prazo de 7 dias, marque "Análise de exceção" e preencha "Obs do cliente". Verifique também o CPF.',
        'error'
      );
      return;
    }
    if (!liberacaoChavePixTab) {
      const ticketTrim = String(form.ticketOctadesk || '').trim();
      if (!ticketTrim) {
        showNotification('Informe o Ticket (número Octadesk).', 'error');
        return;
      }
    }
    // Garantir nome do agente normalizado
    let agenteNorm = form.agente && form.agente.trim() ? toTitleCase(form.agente) : '';
    if (!agenteNorm) {
      try {
        agenteNorm = toTitleCase(String(getVelotaxAgentForLoggedUser() || ''));
      } catch (err) {
        console.error('Erro ao obter agente:', err);
      }
      if (agenteNorm) setForm((prev) => ({ ...prev, agente: agenteNorm }));
    }
    if (agenteNorm) {
      try {
        setVelotaxAgentForLoggedUser(agenteNorm);
      } catch (err) {
        console.error('Erro ao salvar agente:', err);
      }
    }

    const mensagemTexto = montarMensagem();
    const cpfApenasNumeros = String(form.cpf || '').replace(/\D/g, '');

    const {
      urgenciaN2,
      urgenciaRa,
      urgenciaBacen,
      urgenciaProcon,
      ...formRest
    } = form;
    const payload = { ...formRest, cpf: cpfApenasNumeros };
    if (urgenciaN2 === true) payload.urgenciaN2 = true;
    if (urgenciaRa === true) payload.urgenciaRa = true;
    if (urgenciaBacen === true) payload.urgenciaBacen = true;
    if (urgenciaProcon === true) payload.urgenciaProcon = true;
    if (isTipoExclusaoConta(form.tipo)) {
      payload.exclusaoContaSemDebitoAberto = form.exclusaoContaSemDebitoAberto === true;
      payload.exclusaoContaSemChavePixAssociada = form.exclusaoContaSemChavePixAssociada === true;
      payload.exclusaoContaSemValorSaldo = form.exclusaoContaSemValorSaldo === true;
    }
    if (liberacaoChavePixTab && form.tipo === 'Exclusão de Chave PIX') {
      const eff = getLiberacaoChavePixEffectiveBooleans(form);
      payload.semDebitoAberto = eff.semDebitoAberto;
      payload.n2Ouvidora = eff.n2Ouvidora;
      payload.procon = eff.procon;
      payload.reclameAqui = eff.reclameAqui;
      payload.processo = eff.processo;
      payload.bacen = eff.bacen;
      payload.revogadoConsentimentoEcac = eff.revogadoConsentimentoEcac;
    }
    const ticketTrim = String(form.ticketOctadesk || '').trim();
    const solicitacaoData = {
      agente: agenteNorm || form.agente,
      cpf: cpfApenasNumeros,
      tipo: form.tipo,
      payload,
      mensagemTexto,
      agentContact: null,
      waMessageId: null,
      ...(ticketTrim && !liberacaoChavePixTab
        ? { protocolosCentral: [ticketTrim] }
        : {}),
    };

    let listRaw = [];
    setVerificandoRequisicoesCpf(true);
    try {
      try {
        const res = await solicitacoesAPI.getByCpf(cpfApenasNumeros);
        listRaw = Array.isArray(res?.data) ? res.data : [];
      } catch (scanErr) {
        console.error('[FormSolicitacao] Erro ao verificar requisições por CPF:', scanErr);
        showNotification(
          'Não foi possível verificar requisições existentes para este CPF. Tente novamente.',
          'error',
        );
        return;
      }

      const filtrado = filterSolicitacoesGetListByRequisicoesTab(listRaw, liberacaoChavePixTab);
      const { abertas, resolvidas } = partitionRequisicoesAbertasResolvidasParaModal(filtrado);

      /* Qualquer histórico nesta aba para o CPF: abertas e/ou só resolvidas — modal informativo antes do envio */
      if (filtrado.length > 0) {
        setModalRequisicaoCpfAberta({
          cpfDigits: cpfApenasNumeros,
          cpfDisplay: formatarCPF(cpfApenasNumeros),
          abertas,
          resolvidas,
          pending: { solicitacaoData, agenteNorm },
        });
        return;
      }

      await executarPostSolicitacao(solicitacaoData, agenteNorm);
    } finally {
      setVerificandoRequisicoesCpf(false);
    }
  };

  return (
    <>
      {/* Notificação simples - Canto superior direito DA TELA (viewport), logo abaixo do header */}
      {/* Renderizado via Portal diretamente no body para garantir posicionamento fixo na viewport */}
      {notification.show && typeof document !== 'undefined' && createPortal(
        <div 
          className={`px-4 py-3 rounded shadow-lg text-white ${
            notification.type === 'success' ? 'bg-green-500/70' :
            notification.type === 'error' ? 'bg-red-500/60' :
            'bg-blue-500/70'
          }`} 
          style={{ 
            borderRadius: 'var(--velohub-radius-container)',
            position: 'fixed',
            top: 'var(--velohub-header-offset-portal, 68px)',
            right: '16px',
            zIndex: 9999,
            pointerEvents: 'auto'
          }}
        >
          {notification.message}
        </div>,
        document.body
      )}

      {modalRequisicaoCpfAberta && typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 10060 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-solic-modal-cpf-aberto-title"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/50 dark:bg-black/60"
              onClick={fecharModalRequisicaoCpfAberta}
              aria-label="Fechar sem enviar"
            />
            <div
              className="relative w-full max-w-lg max-h-[min(92vh,640px)] flex flex-col rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
              style={{ borderRadius: 'var(--velohub-radius-container, 8px)' }}
            >
              <div className="shrink-0 border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-[#000058]/5 dark:bg-gray-900/40">
                <h2 id="form-solic-modal-cpf-aberto-title" className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {modalRequisicaoCpfAberta.abertas.length > 0
                    ? `Requisição em aberto para o CPF ${modalRequisicaoCpfAberta.cpfDisplay || '—'}`
                    : `Histórico de requisições nesta aba para o CPF ${modalRequisicaoCpfAberta.cpfDisplay || '—'}`}
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0 px-4 py-3 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Solicitações abertas
                  </h3>
                  <div
                    className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-40 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700"
                    style={{ borderRadius: 'var(--velohub-radius-container, 8px)' }}
                  >
                    {modalRequisicaoCpfAberta.abertas.length === 0 ? (
                      <p className="p-3 text-sm text-gray-500 dark:text-gray-400">Nenhuma encontrada nesta lista.</p>
                    ) : (
                      modalRequisicaoCpfAberta.abertas.map((row) => (
                        <div key={row.key} className="p-3 text-sm">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{row.tipo}</div>
                          {row.origemLabel ? (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                              Origem: {row.origemLabel}
                            </div>
                          ) : null}
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Status: {row.statusChamado === 'enviado' ? 'enviado' : row.statusChamado}
                            {' · '}
                            Data de abertura: {formatDataAberturaRequisicaoModal(row.createdAt)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Solicitações resolvidas
                  </h3>
                  <div
                    className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-40 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700"
                    style={{ borderRadius: 'var(--velohub-radius-container, 8px)' }}
                  >
                    {modalRequisicaoCpfAberta.resolvidas.length === 0 ? (
                      <p className="p-3 text-sm text-gray-500 dark:text-gray-400">Nenhuma encontrada nesta lista.</p>
                    ) : (
                      modalRequisicaoCpfAberta.resolvidas.map((row) => (
                        <div key={row.key} className="p-3 text-sm">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{row.tipo}</div>
                          {row.origemLabel ? (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                              Origem: {row.origemLabel}
                            </div>
                          ) : null}
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Status: {row.statusChamado}
                            {' · '}
                            Data de abertura: {formatDataAberturaRequisicaoModal(row.createdAt)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={fecharModalRequisicaoCpfAberta}
                  style={{ borderRadius: 'var(--velohub-radius-container, 8px)' }}
                >
                  Fechar
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
                  onClick={() => confirmarModalRequisicaoEEnviar()}
                  disabled={loading}
                  style={{ borderRadius: 'var(--velohub-radius-container, 8px)' }}
                >
                  Confirmar envio
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <form
        onSubmit={enviar}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            enviar(e);
          }
        }}
        className="space-y-4 relative pb-0"
        aria-busy={loading || verificandoRequisicoesCpf}
        aria-live="polite"
      >
        {liberacaoChavePixTab &&
        liberacaoPixSelectedDoc &&
        String(liberacaoPixSelectedDoc.ouvidoriaNumeroProtocolo || '').trim() ? (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Protocolo Ouvidoria:{' '}
            <strong className="tabular-nums">{liberacaoPixSelectedDoc.ouvidoriaNumeroProtocolo}</strong>
          </p>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FloatingLabelField label="CPF" required value={formatarCPF(form.cpf)} error={cpfError || undefined}>
              <input
                className={`w-full border rounded-lg px-3 py-2 outline-none transition-all duration-200 dark:bg-gray-800 dark:text-white ${
                  validarCPF(form.cpf)
                    ? 'border-green-500 focus:ring-2 focus:ring-green-500'
                    : 'border-gray-400 dark:border-gray-500 focus:ring-2 focus:ring-blue-500'
                }`}
                placeholder="000.000.000-00"
                value={formatarCPF(form.cpf)}
                onChange={(e) => atualizar('cpf', e.target.value)}
                maxLength={14}
                required
              />
            </FloatingLabelField>
          </div>
          {liberacaoChavePixTab ? (
            <div className="min-w-0">
              <FloatingLabelField id="form-nome-chave-pix" label="Nome" required value={form.nomeCliente || ''}>
                <input
                  type="text"
                  className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Nome completo"
                  value={form.nomeCliente || ''}
                  onChange={(e) => atualizar('nomeCliente', e.target.value)}
                  required
                  autoComplete="name"
                />
              </FloatingLabelField>
            </div>
          ) : (
            <div>
              <FloatingLabelField label="Ticket" required value={form.ticketOctadesk || ''}>
                <input
                  type="text"
                  className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Número do ticket Octadesk"
                  value={form.ticketOctadesk || ''}
                  onChange={(e) => atualizar('ticketOctadesk', e.target.value)}
                  required
                />
              </FloatingLabelField>
            </div>
          )}
        </div>

        <div className="container-secondary">
          {!liberacaoChavePixTab ? (
            <div className="mb-4">
              <FloatingLabelField label="Tipo de Solicitação" value={form.tipo}>
                <select
                  className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  value={form.tipo}
                  onChange={(e) => atualizar('tipo', e.target.value)}
                >
                  <option>Alteração de Dados Cadastrais</option>
                  <option>Aumento de Limite Pix</option>
                  <option>Excluir conta - app</option>
                  <option>Excluir conta - Celcoin</option>
                  <option>Reativação de Conta</option>
                  <option>Reset de Senha</option>
                  <option value="Cancelamento">Cancelamento</option>
                  <option value="Devolução de Antecipação">Devolução de Antecipação</option>
                  <option>Solicitação de documentos</option>
                </select>
              </FloatingLabelField>
            </div>
          ) : null}

        {form.tipo === 'Alteração de Dados Cadastrais' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FloatingLabelField label="Tipo de informação" value={form.infoTipo}>
                  <select
                    className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    value={form.infoTipo}
                    onChange={(e) => {
                      const novoTipo = e.target.value;
                      // Limpar campos quando mudar o tipo de informação
                      if (novoTipo !== form.infoTipo) {
                        setForm(prev => {
                          const novoForm = { ...prev, infoTipo: novoTipo, dadoAntigo: '', dadoNovo: '' };
                          // Se mudou para Telefone, garantir que os campos vazios estejam prontos para formatação
                          return novoForm;
                        });
                      } else {
                        atualizar('infoTipo', novoTipo);
                      }
                    }}
                  >
                    <option value="Telefone">Telefone</option>
                    <option value="E-mail">E-mail</option>
                    <option value="Nome">Nome</option>
                    <option value="Outro">Outro</option>
                  </select>
                </FloatingLabelField>
              </div>
              <div className="flex items-center pt-7 gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={form.fotosVerificadas}
                  onChange={(e) => atualizar('fotosVerificadas', e.target.checked)}
                />
                <label className="text-gray-700 dark:text-gray-300">Fotos verificadas</label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <FloatingLabelField
                  label="Dado antigo"
                  value={
                    form.infoTipo === 'Telefone' ? formatarTelefone(form.dadoAntigo) :
                    form.infoTipo === 'E-mail' ? formatarEmail(form.dadoAntigo) :
                    form.dadoAntigo
                  }
                >
                  <input
                    className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    type={form.infoTipo === 'Telefone' ? 'tel' : form.infoTipo === 'E-mail' ? 'email' : 'text'}
                    placeholder={
                      form.infoTipo === 'Telefone' ? '(XX)XXXXX-XXXX' :
                      form.infoTipo === 'E-mail' ? 'email@dominio.com.br' :
                      ''
                    }
                    value={
                      form.infoTipo === 'Telefone' ? formatarTelefone(form.dadoAntigo) :
                      form.infoTipo === 'E-mail' ? formatarEmail(form.dadoAntigo) :
                      form.dadoAntigo
                    }
                    onChange={(e) => atualizar('dadoAntigo', e.target.value)}
                    maxLength={form.infoTipo === 'Telefone' ? 15 : undefined}
                  />
                </FloatingLabelField>
              </div>
              <div>
                <FloatingLabelField
                  label="Dado novo"
                  value={
                    form.infoTipo === 'Telefone' ? formatarTelefone(form.dadoNovo) :
                    form.infoTipo === 'E-mail' ? formatarEmail(form.dadoNovo) :
                    form.dadoNovo
                  }
                >
                  <input
                    className={`w-full border rounded-lg px-3 py-2 outline-none transition-all duration-200 dark:bg-gray-800 dark:text-white ${
                      form.infoTipo === 'Telefone' && validarTelefone(form.dadoNovo)
                        ? 'border-green-500 focus:ring-1 focus:ring-green-500'
                        : form.infoTipo === 'E-mail' && validarEmail(form.dadoNovo)
                        ? 'border-green-500 focus:ring-1 focus:ring-green-500'
                        : 'border-gray-400 dark:border-gray-500 focus:ring-1 focus:ring-blue-500'
                    }`}
                    type={form.infoTipo === 'Telefone' ? 'tel' : form.infoTipo === 'E-mail' ? 'email' : 'text'}
                    placeholder={
                      form.infoTipo === 'Telefone' ? '(XX)XXXXX-XXXX' :
                      form.infoTipo === 'E-mail' ? 'email@dominio.com.br' :
                      ''
                    }
                    value={
                      form.infoTipo === 'Telefone' ? formatarTelefone(form.dadoNovo) :
                      form.infoTipo === 'E-mail' ? formatarEmail(form.dadoNovo) :
                      form.dadoNovo
                    }
                    onChange={(e) => atualizar('dadoNovo', e.target.value)}
                    maxLength={form.infoTipo === 'Telefone' ? 15 : undefined}
                  />
                </FloatingLabelField>
              </div>
            </div>
          </div>
        )}

        {isTipoExclusaoConta(form.tipo) && (
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Marque conforme a situação: cada item é enviado como Sim (true) ou Não (false).
            </p>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={form.exclusaoContaSemDebitoAberto || false}
                onChange={(e) => atualizar('exclusaoContaSemDebitoAberto', e.target.checked)}
              />
              <span>Sem débito em aberto</span>
            </label>
            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={form.exclusaoContaSemChavePixAssociada || false}
                onChange={(e) => atualizar('exclusaoContaSemChavePixAssociada', e.target.checked)}
              />
              <span>Sem chave PIX associada</span>
            </label>
            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={form.exclusaoContaSemValorSaldo || false}
                onChange={(e) => atualizar('exclusaoContaSemValorSaldo', e.target.checked)}
              />
              <span>Sem valor em saldo</span>
            </label>
          </div>
        )}

        {form.tipo === 'Exclusão de Chave PIX' && (
          <div>
            {liberacaoChavePixTab && (
              <div className="mb-4">
                <div className="w-full md:max-w-md">
                  <FloatingLabelField id="form-origem-chave-pix" label="Origem" required value={form.origem || ''}>
                    <select
                      className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      value={form.origem}
                      onChange={(e) => atualizar('origem', e.target.value)}
                      required
                    >
                      <option value="">Selecione a origem</option>
                      {ORIGENS_LIBERACAO_CHAVE_PIX.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </FloatingLabelField>
                </div>
              </div>
            )}
            {(!liberacaoChavePixTab || String(form.origem || '').trim()) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                {LIBERACAO_PIX_BOOLEAN_ROWS.filter(({ key }) => {
                  if (!liberacaoChavePixTab) return true;
                  const oculto = getLiberacaoChavePixBooleanKeyOcultoPorOrigem(form.origem);
                  return oculto !== key;
                }).map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 min-h-[1.75rem]">
                    <input
                      type="checkbox"
                      className="w-4 h-4 shrink-0"
                      checked={form[key] || false}
                      onChange={(e) => atualizar(key, e.target.checked)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Prazo máximo: aba Liberação usa booleanos efetivos (origem pode implicar canal) */}
            {(() => {
              const e =
                liberacaoChavePixTab && String(form.origem || '').trim()
                  ? getLiberacaoChavePixEffectiveBooleans(form)
                  : null;
              const showPrazo = e
                ? e.reclameAqui || e.bacen || e.procon || e.processo || e.n2Ouvidora
                : form.reclameAqui || form.bacen || form.procon || form.processo || form.n2Ouvidora;
              if (!showPrazo) return null;
              return (
                <div className="mt-4 w-full max-w-md">
                  <FloatingLabelField label="Prazo Máximo" value={form.prazoMaximo || ''}>
                    <input
                      type="date"
                      className="w-full min-w-0 px-3 py-2 border border-gray-400 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500"
                      value={form.prazoMaximo || ''}
                      onChange={(e) => atualizar('prazoMaximo', e.target.value)}
                    />
                  </FloatingLabelField>
                </div>
              );
            })()}
          </div>
        )}

        {form.tipo === 'Aumento de Limite Pix' && (
          <div>
            <div>
              <FloatingLabelField label="Valor" required value={formatarMoeda(form.valor)}>
                <input
                  className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  type="text"
                  placeholder="R$0,00"
                  value={formatarMoeda(form.valor)}
                  onChange={(e) => atualizar('valor', e.target.value)}
                  required
                />
              </FloatingLabelField>
            </div>
          </div>
        )}

        {form.tipo === 'Devolução de Antecipação' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div>
                <FloatingLabelField label="Data da Contratação" required value={form.devolucaoDataContratacao || ''}>
                  <input
                    className={`w-full border rounded-lg px-3 py-2 outline-none transition-all duration-200 dark:bg-gray-800 dark:text-white ${devolucaoAntecInfo.dateBorderClass}`}
                    type="date"
                    value={form.devolucaoDataContratacao || ''}
                    onChange={(e) => atualizar('devolucaoDataContratacao', e.target.value)}
                    required
                  />
                </FloatingLabelField>
                {form.devolucaoDataContratacao && devolucaoAntecInfo.hasValidDate && (
                  <p
                    className={`mt-1 text-xs ${devolucaoAntecInfo.elegivel ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}
                    role="status"
                  >
                    {devolucaoAntecInfo.elegivel
                      ? 'Elegível: menos de 7 dias corridos desde a contratação (data local).'
                      : devolucaoAntecInfo.diffDays !== null && devolucaoAntecInfo.diffDays < 0
                        ? 'Inelegível: data de contratação no futuro. Use análise de exceção e obs do cliente para enviar.'
                        : 'Inelegível: 7 dias corridos ou mais desde a contratação. Marque análise de exceção e preencha obs do cliente para habilitar o envio.'}
                  </p>
                )}
              </div>
              <div>
                <FloatingLabelField label="Obs do cliente" value={form.obsClienteDevolucao || ''}>
                  <textarea
                    className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 min-h-[88px] outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Observações do cliente sobre a devolução"
                    value={form.obsClienteDevolucao || ''}
                    onChange={(e) => atualizar('obsClienteDevolucao', e.target.value)}
                  />
                </FloatingLabelField>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={form.analiseExcecaoDevolucao || false}
                  onChange={(e) => atualizar('analiseExcecaoDevolucao', e.target.checked)}
                />
                <span className="text-gray-700 dark:text-gray-300">Análise de exceção</span>
              </label>
            </div>
          </div>
        )}

        {form.tipo === 'Solicitação de documentos' && (
          <div>
            <FloatingLabelField label="Documentos" required value={String(form.documentos || '')}>
              <input
                type="text"
                autoComplete="off"
                className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white font-mono text-sm tracking-wide"
                value={form.documentos || ''}
                onChange={(e) => atualizar('documentos', e.target.value)}
                required
              />
            </FloatingLabelField>
          </div>
        )}

        {form.tipo === 'Cancelamento' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <FloatingLabelField label="Nome do Cliente" required value={form.nomeCliente || ''}>
                  <input
                    className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    type="text"
                    placeholder="Nome completo do cliente"
                    value={form.nomeCliente || ''}
                    onChange={(e) => atualizar('nomeCliente', e.target.value)}
                    required
                  />
                </FloatingLabelField>
              </div>
              <div>
                <FloatingLabelField label="Data da Contratação" required value={form.dataContratacao || ''}>
                  <input
                    className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    type="date"
                    value={form.dataContratacao || ''}
                    onChange={(e) => atualizar('dataContratacao', e.target.value)}
                    required
                  />
                </FloatingLabelField>
              </div>
              <div>
                <FloatingLabelField label="Valor" required value={formatarMoeda(form.valor)}>
                  <input
                    className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    type="text"
                    placeholder="R$0,00"
                    value={formatarMoeda(form.valor)}
                    onChange={(e) => atualizar('valor', e.target.value)}
                    required
                  />
                </FloatingLabelField>
              </div>
            </div>
          </div>
        )}

        </div>

        <div>
          <FloatingLabelField label="Observações" value={form.observacoes}>
            <textarea
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 h-28 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Adicione observações adicionais..."
              value={form.observacoes}
              onChange={(e) => atualizar('observacoes', e.target.value)}
            />
          </FloatingLabelField>
        </div>

        <SolicitacaoUrgenteBlock
          painelAberto={painelUrgenteAberto}
          onTogglePainel={() => setPainelUrgenteAberto((o) => !o)}
          values={{
            urgenciaN2: form.urgenciaN2,
            urgenciaRa: form.urgenciaRa,
            urgenciaBacen: form.urgenciaBacen,
            urgenciaProcon: form.urgenciaProcon,
          }}
          onCheckedChange={(chave, marcado) => atualizar(chave, marcado)}
        />

        <div className="flex items-center justify-end gap-4 mt-1 mb-0">
          <button
            disabled={loading || verificandoRequisicoesCpf || !formularioPodeEnviar}
            className={`bg-blue-600 text-white font-medium px-5 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 inline-flex items-center gap-2 ${
              loading || verificandoRequisicoesCpf || !formularioPodeEnviar ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            type="submit"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
              </>
            ) : verificandoRequisicoesCpf ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verificando…
              </>
            ) : (
              'Enviar Solicitação'
            )}
          </button>
        </div>

        {buscaResultados && buscaResultados.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 backdrop-blur p-4 rounded-vh-container border border-gray-200 dark:border-gray-700 mt-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-sky-500 to-emerald-500" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Histórico recente para {String(buscaCpf || form.cpf)}
              </h2>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {buscaResultados.map((r) => (
                <div
                  key={r._id || r.id}
                  className="p-3 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-200">
                      {r.tipo} — {r.cpf}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Agente: {r.colaboradorNome || r.agente || '—'} • Status: {r.status || '—'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {verificandoRequisicoesCpf && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[55]"
            style={{ background: 'linear-gradient(180deg, rgba(2,6,23,0.15), rgba(2,6,23,0.28))' }}
          >
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-600 shadow-lg">
              <div className="flex flex-col items-center gap-4">
                <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-800 dark:text-gray-200 text-center">Verificando requisições existentes para este CPF…</p>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            style={{ background: 'linear-gradient(180deg, rgba(2,6,23,0.20), rgba(2,6,23,0.35))' }}
          >
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg">
              <div className="flex flex-col items-center gap-4">
                <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-800 dark:text-gray-200">Enviando solicitação...</p>
              </div>
            </div>
          </div>
        )}
      </form>
    </>
  );
});

FormSolicitacao.displayName = 'FormSolicitacao';

export default FormSolicitacao;

