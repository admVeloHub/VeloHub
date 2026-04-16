/**
 * VeloHub V3 - FormSolicitacao Component (Escalações Module)
 * VERSION: v1.20.4 | DATE: 2026-04-16 | AUTHOR: VeloHub Development Team
 * Branch: escalacoes
 * 
 * Mudanças v1.20.4:
 * - Aba Liberação chave pix: quadro do payload — só «Origem» até escolher origem; depois booleans visíveis exceto redundantes (ex.: origem Reclame Aqui oculta checkbox Reclame Aqui)
 * - Booleanos implícitos pela origem gravados como true no payload/mensagem; removida legenda «Selecione pelo menos uma opção»
 * 
 * Mudanças v1.20.3:
 * - Aba Liberação chave pix: cache local em `velotax_local_logs_chave_pix` (paridade sidebar Solicitações sem misturar envios)
 * - Item do cache após create inclui `origem` para filtro da sidebar da aba
 * 
 * Mudanças v1.20.2:
 * - Cabeçalho: Liberação chave pix — backend grava só em liberacao_pix_prod (sem espelho em solicitacoes_tecnicas; API solicitacoes v1.9.0)
 * 
 * Mudanças v1.20.1:
 * - Liberação chave pix: 2ª coluna com label «Nome» (nomeCliente); removido nome da sessão; removida duplicata de campo nome em linha extra
 * 
 * Mudanças v1.20.0:
 * - Liberação chave pix: campo nomeCliente (nome do cliente) no payload; backend espelha em hub_escalacoes.liberacao_pix_prod
 * 
 * Mudanças v1.19.0:
 * - Aba Liberação chave pix: 2ª coluna com nome do usuário (sessão); quadro com Origem (select) antes dos checkboxes; payload/mensagem com origem
 * 
 * Mudanças v1.18.0:
 * - Prop liberacaoChavePixTab: formulário só «Exclusão de Chave PIX» (aba Req_Prod); tipo removido do select na aba Solicitações
 * 
 * Mudanças v1.17.3:
 * - Comentário histórico v1.4.0: removida referência ao projeto legado "painel de serviços" (diretório excluído do repositório)
 * 
 * Mudanças v1.17.2:
 * - Exclusão de Chave PIX: checkbox "Revogado consentimento ECAC"; grid de opções em 2 colunas
 * 
 * Mudanças v1.17.1:
 * - Excluir conta (app/Celcoin): no envio cada checkbox vai como boolean explícito true/false no payload; removida exigência de os três estarem true
 *
 * Mudanças v1.17.0:
 * - Tipos "Excluir conta - app" e "Excluir conta - Celcoin": bloco com 3 checkboxes (sem débito em aberto, sem chave PIX, sem saldo); mensagem e payload atualizados
 *
 * Mudanças v1.16.0:
 * - Tipo "Devolução de Antecipação": data contratação (local), obs do cliente, análise de exceção; elegibilidade <7 dias corridos (borda verde/vermelha); envio bloqueado ou via exceção (checkbox + obs)
 * 
 * Mudanças v1.15.9:
 * - Reconcile só após lista do servidor estável (props solicitacoesServerList + !solicitacoesStatsLoading) — evita apagar cache enquanto GET ainda não retornou
 * - Removidos GET /solicitacoes duplicados no form; refreshLocalLogs e sync usam onRefreshSolicitacoesForLogs do pai
 * 
 * Mudanças v1.15.8:
 * - Reconcile no mount/interval: onLocalLogsChangeRef + localLogsRef + saveCache estáveis — evita closure obsoleta e garante persistência do cache após filtrar órfãos
 * 
 * Mudanças v1.15.7:
 * - Log local = cache: reconcileEscalacoesLocalLogs ao montar + em cada refresh (remove linhas cujo _id sumiu do Mongo ou sem documento correspondente)
 * 
 * Mudanças v1.15.6:
 * - Refresh dos logs: findSolicitacaoForLocalLogItem (requestId; senão cpf+tipo+createdAt) — corrige 404 ao clicar quando há vários envios iguais
 * - normalizeMongoId no requestId após create e ao mesclar com GET /solicitacoes
 * 
 * Mudanças v1.15.5:
 * - Log local e refresh: anexa array reply do Mongo quando disponível (sidebar / destaque msg Produtos)
 * - Novo envio: persiste reply inicial retornado pelo create no item do cache
 * 
 * Mudanças v1.15.4:
 * - Espaçamento do form levemente reduzido (space-y) e bloco do botão Enviar sem folga extra no fim
 * 
 * Mudanças v1.15.3:
 * - Logs de envio renderizados na sidebar da EscalacoesPage (prop onLocalLogsChange)
 * - forwardRef + useImperativeHandle: refreshLocalLogs() para botão "Atualizar agora" na sidebar
 * - Persistência de requestId no cache local (ID da solicitação) para abrir modal de respostas
 * 
 * Mudanças v1.15.2:
 * - MELHORIA: Melhorado tratamento de erro 503 para detectar WhatsApp desconectado
 * - Detecta múltiplas variações de mensagem de erro do backend
 * - Mensagens mais específicas baseadas no tipo de erro retornado
 * 
 * Mudanças v1.15.1:
 * - Melhorado tratamento de erro 503 (WhatsApp desconectado) com mensagens mais claras
 * - Usuário é informado que a solicitação foi registrada mesmo quando WhatsApp falha
 * 
 * Mudanças v1.15.0:
 * - Atualizado para usar WHATSAPP_ENDPOINT que detecta automaticamente o endpoint correto
 * - Em localhost:3001 usa /api/whatsapp/send, em produção usa /send
 * 
 * Mudanças v1.14.0:
 * - Campo "Prazo Máximo" alterado de texto livre para campo de data objetiva (type="date")
 * - Data formatada na mensagem WhatsApp como DD/MM/YYYY para melhor legibilidade
 * 
 * Mudanças v1.13.0:
 * - Adicionado checkbox "Bacen" para opção "Exclusão de Chave PIX"
 * - Adicionado campo "Prazo Máximo" que aparece quando Reclame Aqui, Bacen, Procon, Processo ou N2 estiver marcado
 * - Campo "Prazo Máximo" incluído na mensagem WhatsApp quando preenchido
 * - Validação atualizada para incluir Bacen como opção válida
 * 
 * Mudanças v1.12.0:
 * - CPF sempre enviado apenas com números (sem pontos ou traços) em todas as operações
 * - Normalização aplicada ao enviar para WhatsApp API, salvar no backend, logs e cache local
 * - Máscara visual mantida na interface, mas dados sempre normalizados antes do envio
 * 
 * Mudanças v1.11.0:
 * - Removida opção "Exclusão de Conta" (movida para aba Erros/Bugs)
 * 
 * Mudanças v1.10.0:
 * - Revertida API WhatsApp para usar whatsapp-api-new-54aw.onrender.com/send
 * 
 * Mudanças v1.9.0:
 * - Adicionada formatação reativa de moeda brasileira no campo Valor (Aumento de Limite Pix e Cancelamento)
 * - Formatação preenche do centavo para dezena de centavo, depois unidade, dezena, centena, etc.
 * - Adiciona pontuações de milhar automaticamente (R$ 1.234,56)
 * - Placeholder atualizado para R$0,00
 * 
 * Mudanças v1.8.0:
 * - Corrigido formato de telefone celular para padrão brasileiro: (XX)91234-5678 (11 dígitos)
 * - Atualizada validação para aceitar 11 dígitos ao invés de 10
 * - Corrigido placeholder para mostrar formato correto
 * 
 * Mudanças v1.7.0:
 * - Atualizado endpoint WhatsApp para usar nova API do backend GCP: /api/whatsapp/send
 *   - Local: http://localhost:3001/api/whatsapp/send
 *   - Produção: https://backend-gcp-278491073220.us-east1.run.app/api/whatsapp/send
 * - Melhorado tratamento de erros e logs de debug
 * 
 * Mudanças v1.6.0:
 * - Adicionados campos para "Exclusão de Chave PIX" (semDebitoAberto, n2Ouvidora, procon, reclameAqui, processo)
 * - Adicionado campo "Aumento de Limite Pix" com campo valor
 * - Adicionados novos tipos no select: "Aumento de Limite Pix" e "Reset de Senha"
 * - Adicionada validação para Exclusão de Chave PIX (pelo menos uma opção deve ser selecionada)
 * - Atualizada função montarMensagem() para incluir novos tipos e campos
 * 
 * Componente de formulário para criação de solicitações técnicas
 * 
 * Mudanças v1.5.0:
 * - Adicionada funcionalidade completa de Cancelamento de Serviços
 * - Novos campos: seguroPrestamista, seguroSaude, seguroCelular, seguroDividaZero, clubeVelotax
 * - Campos de prazo: dentroDos7Dias, depoisDos7Dias
 * - Formulário condicional para tipo "Cancelamento" com seleção múltipla de produtos e prazos
 * - Formatação automática de mensagem WhatsApp para cancelamentos
 * - Adicionada formatação automática de CPF (000.000.000-00)
 * - Validação visual de CPF: borda verde quando tiver 11 dígitos
 * - Limitação de entrada: máximo 11 dígitos no campo CPF
 * 
 * Mudanças v1.4.0:
 * - Alterado fluxo na migração de Escalações: WhatsApp primeiro, depois persistência com waMessageId
 * - PRIMEIRO: Frontend envia diretamente para WhatsApp API
 * - DEPOIS: Salva no backend com waMessageId já obtido
 * - Isso garante envio imediato e controle direto do frontend sobre o processo
 * 
 * Mudanças v1.3.4:
 * - Toast renderizado via React Portal diretamente no body para garantir posicionamento fixo na viewport (tela)
 * - Toast no canto superior direito DA TELA (não do container), logo abaixo do header
 * - Formato: retangular, bordas 4px, verde 70% opacidade (sucesso), vermelho 60% opacidade (erro)
 * 
 * Mudanças v1.3.3:
 * - Alterado posicionamento dos toasts para top-20 right-4 (canto superior direito, logo abaixo do header)
 * 
 * Mudanças v1.3.2:
 * - Corrigido posicionamento dos toasts para bottom-4 right-4 (canto inferior direito, fixo no frame)
 * - Usado z-velohub-toast para seguir padrão do projeto
 * 
 * Mudanças v1.3.1:
 * - Corrigido posicionamento dos toasts de top-4 para bottom-4 (canto inferior direito)
 * 
 * Mudanças v1.3.0:
 * - Adicionada formatação e máscara de email (email@dominio.com.br) nos campos dadoAntigo e dadoNovo
 * - Adicionada validação visual (borda verde) no campo "Dado novo" quando:
 *   - Tipo é "E-mail" e formato válido (parte@dominio.extensão)
 *   - Tipo é "Telefone" e telefone completo (11 dígitos para celular)
 * - Telefone definido como valor padrão do campo "Tipo de informação"
 * 
 * Mudanças v1.2.0:
 * - Corrigida formatação de telefone para usar estado anterior (prev) ao invés de estado atual
 * - Melhorada lógica de atualização do select de tipo de informação
 * 
 * Mudanças v1.1.0:
 * - Adicionada formatação automática de telefone (XX)91234-5678 nos campos dadoAntigo e dadoNovo
 */

import React, { useEffect, useState, useCallback, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { solicitacoesAPI, logsAPI } from '../../services/escalacoesApi';
import { normalizeMongoId, reconcileEscalacoesLocalLogs } from '../../utils/escalacoesModalHelpers';

/** Origens do campo «Origem» (aba Liberação chave pix). */
const ORIGENS_LIBERACAO_CHAVE_PIX = [
  'Time Portabilidade',
  'N2 Pix',
  'Reclame Aqui',
  'Bacen',
  'Procon',
  'Judicial',
];

/** Chaves de booleanos redundantes quando a origem já identifica o canal (aba Liberação chave pix). */
const LIBERACAO_PIX_ORIGEM_OCULTA_BOOLEAN = {
  'Reclame Aqui': 'reclameAqui',
  Procon: 'procon',
  'N2 Pix': 'n2Ouvidora',
  Judicial: 'processo',
  Bacen: 'bacen',
};

/** Rótulos dos checkboxes Exclusão de Chave PIX (ordem de exibição). */
const LIBERACAO_PIX_BOOLEAN_ROWS = [
  { key: 'semDebitoAberto', label: 'Sem Débito em aberto' },
  { key: 'n2Ouvidora', label: 'N2 - Ouvidora' },
  { key: 'procon', label: 'Procon' },
  { key: 'reclameAqui', label: 'Reclame Aqui' },
  { key: 'processo', label: 'Processo' },
  { key: 'bacen', label: 'Bacen' },
  { key: 'revogadoConsentimentoEcac', label: 'Revogado consentimento ECAC' },
];

/**
 * Booleanos efetivos para validação, mensagem e API (origem implica true nos campos ocultos).
 * @param {Object} form
 * @returns {Object}
 */
function getLiberacaoChavePixEffectiveBooleans(form) {
  const o = String(form?.origem || '').trim();
  const hiddenKey = LIBERACAO_PIX_ORIGEM_OCULTA_BOOLEAN[o];
  const implied = (k) => (hiddenKey === k ? true : form[k] === true);
  return {
    semDebitoAberto: form.semDebitoAberto === true,
    n2Ouvidora: implied('n2Ouvidora'),
    procon: implied('procon'),
    reclameAqui: implied('reclameAqui'),
    processo: implied('processo'),
    bacen: implied('bacen'),
    revogadoConsentimentoEcac: form.revogadoConsentimentoEcac === true,
  };
}

/** @param {string} origem */
function getLiberacaoChavePixBooleanKeyOcultoPorOrigem(origem) {
  const o = String(origem || '').trim();
  return LIBERACAO_PIX_ORIGEM_OCULTA_BOOLEAN[o] || null;
}

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
 * @param {Function} [onLocalLogsChange] - Callback com array de logs locais (sidebar Req_Prod)
 * @param {Array} [solicitacoesServerList] - Lista GET já carregada pelo pai (evita segundo fetch)
 * @param {boolean} [solicitacoesStatsLoading] - Enquanto true, não reconcilia com lista vazia
 * @param {Function} [onRefreshSolicitacoesForLogs] - Recarrega lista no pai (ex.: loadStats)
 * @param {boolean} [liberacaoChavePixTab] - Se true, tipo fixo «Exclusão de Chave PIX» e sem seletor de tipo (aba Liberação chave pix)
 */
const FormSolicitacao = forwardRef(function FormSolicitacao(
  {
    registrarLog,
    onLocalLogsChange,
    solicitacoesServerList = [],
    solicitacoesStatsLoading = true,
    onRefreshSolicitacoesForLogs,
    liberacaoChavePixTab = false,
  },
  ref
) {
  const localLogsStorageKey = liberacaoChavePixTab
    ? 'velotax_local_logs_chave_pix'
    : 'velotax_local_logs';

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
  });
  const [loading, setLoading] = useState(false);
  const [cpfError, setCpfError] = useState('');
  const [localLogs, setLocalLogs] = useState([]); // {cpf, tipo, waMessageId, status, createdAt}
  const localLogsRef = useRef([]);
  useEffect(() => {
    localLogsRef.current = localLogs;
  }, [localLogs]);
  const onLocalLogsChangeRef = useRef(onLocalLogsChange);
  useEffect(() => {
    onLocalLogsChangeRef.current = onLocalLogsChange;
  }, [onLocalLogsChange]);
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

  // Cache inicial (localStorage); reconcile com o servidor só no efeito dedicado (após GET do pai)
  useEffect(() => {
    try {
      const cached = localStorage.getItem(localLogsStorageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        setLocalLogs(parsed);
        onLocalLogsChangeRef.current?.(parsed);
      }
      const agent = localStorage.getItem('velotax_agent');
      if (agent) setForm((prev) => ({ ...prev, agente: toTitleCase(agent) }));
    } catch (err) {
      console.error('Erro ao carregar cache:', err);
    }
  }, [localLogsStorageKey]);

  useEffect(() => {
    if (solicitacoesStatsLoading) return;
    try {
      const raw = localStorage.getItem(localLogsStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      const requests = Array.isArray(solicitacoesServerList) ? solicitacoesServerList : [];
      const next = reconcileEscalacoesLocalLogs(parsed, requests);
      setLocalLogs(next);
      onLocalLogsChangeRef.current?.(next);
      localStorage.setItem(localLogsStorageKey, JSON.stringify(next));
    } catch (e) {
      console.error('[FormSolicitacao] Reconcile log local vs lista do servidor:', e);
    }
  }, [solicitacoesServerList, solicitacoesStatsLoading, localLogsStorageKey]);

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
   * Salvar cache no localStorage (ref no callback do pai evita closure velha no interval/refreshLocalLogs)
   * @param {Array} items - Itens para salvar
   */
  const saveCache = useCallback((items) => {
    setLocalLogs(items);
    onLocalLogsChangeRef.current?.(items);
    try {
      localStorage.setItem(localLogsStorageKey, JSON.stringify(items));
    } catch (err) {
      console.error('Erro ao salvar cache:', err);
    }
  }, [localLogsStorageKey]);

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
      return;
    }
    const prev = localLogsRef.current;
    if (!prev.length) return;
    try {
      const all = await solicitacoesAPI.getAll();
      const requests = Array.isArray(all.data) ? all.data : [];
      const updated = reconcileEscalacoesLocalLogs(prev, requests);
      saveCache(updated);
    } catch (err) {
      console.error('Erro ao atualizar logs:', err);
    }
  }, [saveCache, onRefreshSolicitacoesForLogs]);

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
    if (form.tipo !== 'Devolução de Antecipação') return true;
    const cpfOk = String(form.cpf || '').replace(/\D/g, '').length === 11;
    if (!cpfOk) return false;
    if (!devolucaoAntecInfo.hasValidDate) return false;
    if (devolucaoAntecInfo.elegivel) return true;
    return !!(form.analiseExcecaoDevolucao && String(form.obsClienteDevolucao || '').trim());
  }, [
    form.tipo,
    form.cpf,
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
          localStorage.setItem('velotax_agent', norm);
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
    } else {
      msg += `Observações: ${form.observacoes || '—'}\n`;
    }
    return msg;
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
    if (form.tipo === 'Devolução de Antecipação' && !formularioPodeEnviar) {
      showNotification(
        'Devolução de Antecipação: informe uma data de contratação válida. Fora do prazo de 7 dias, marque "Análise de exceção" e preencha "Obs do cliente". Verifique também o CPF.',
        'error'
      );
      return;
    }
    setLoading(true);
    if (registrarLog) registrarLog('Iniciando envio...');

    /**
     * Notificar erro via Notification API
     * @param {string} title - Título da notificação
     * @param {string} body - Corpo da notificação
     */
    const notifyError = (title, body) => {
      try {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification(title, { body });
          } else {
            Notification.requestPermission().then((p) => {
              if (p === 'granted') new Notification(title, { body });
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error('Erro ao exibir notificação:', err);
      }
    };

    // Garantir nome do agente normalizado
    let agenteNorm = form.agente && form.agente.trim() ? toTitleCase(form.agente) : '';
    if (!agenteNorm) {
      try {
        agenteNorm = toTitleCase(localStorage.getItem('velotax_agent') || '');
      } catch (err) {
        console.error('Erro ao obter agente:', err);
      }
      if (agenteNorm) setForm((prev) => ({ ...prev, agente: agenteNorm }));
    }
    if (agenteNorm) {
      try {
        localStorage.setItem('velotax_agent', agenteNorm);
      } catch (err) {
        console.error('Erro ao salvar agente:', err);
      }
    }

    const mensagemTexto = montarMensagem();

    // CPF apenas com números (sem formatação) para a API
    const cpfApenasNumeros = String(form.cpf || '').replace(/\D/g, '');

    try {
      // Criar solicitação no backend (WhatsApp descontinuado - replies via polling MongoDB)
      const payload = { ...form, cpf: cpfApenasNumeros };
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
      const solicitacaoData = {
        agente: agenteNorm || form.agente,
        cpf: cpfApenasNumeros,
        tipo: form.tipo,
        payload,
        mensagemTexto,
        agentContact: null,
        waMessageId: null,
      };

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

      // Criar log
      try {
        await logsAPI.create({
          action: 'send_request',
          detail: {
            tipo: form.tipo,
            cpf: cpfApenasNumeros,
            alteracao: form.tipo === 'Alteração de Dados Cadastrais' ? {
              infoTipo: form.infoTipo || '',
              dadoAntigo: form.dadoAntigo || '',
              dadoNovo: form.dadoNovo || '',
              fotosVerificadas: !!form.fotosVerificadas,
            } : undefined,
            observacoes: form.observacoes || '',
          },
        });
      } catch (logErr) {
        console.error('Erro ao criar log:', logErr);
      }

      if (registrarLog) registrarLog('✅ Solicitação registrada');
      showNotification('Solicitação registrada', 'success');

      const created = result?.data;
      const requestId = normalizeMongoId(created?._id ?? created?.id) || undefined;
      const newItem = {
        requestId,
        cpf: cpfApenasNumeros,
        tipo: form.tipo,
        ...(liberacaoChavePixTab
          ? { origem: String(form.origem || '').trim() || undefined }
          : {}),
        waMessageId: null,
        status: 'enviado',
        enviado: true,
        createdAt: new Date().toISOString(),
        reply: Array.isArray(created?.reply) ? created.reply : undefined,
      };
      saveCache([newItem, ...localLogsRef.current].slice(0, 50));

      // Limpar formulário
      setForm({
        agente: agenteNorm || '',
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
        devolucaoDataContratacao: '',
        obsClienteDevolucao: '',
        analiseExcecaoDevolucao: false,
        exclusaoContaSemDebitoAberto: false,
        exclusaoContaSemChavePixAssociada: false,
        exclusaoContaSemValorSaldo: false,
      });
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
      notifyError('Falha de conexão', err.message || 'Não foi possível contactar a API');
    } finally {
      setLoading(false);
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
            borderRadius: '4px',
            position: 'fixed',
            top: '80px',
            right: '16px',
            zIndex: 9999,
            pointerEvents: 'auto'
          }}
        >
          {notification.message}
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
        aria-busy={loading}
        aria-live="polite"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300">CPF</label>
            <div className="relative">
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
            </div>
            {cpfError && (
              <div className="mt-1 text-xs text-red-600">{cpfError}</div>
            )}
          </div>
          {liberacaoChavePixTab ? (
            <div className="min-w-0">
              <label className="text-sm text-gray-700 dark:text-gray-300" htmlFor="form-nome-chave-pix">
                Nome
              </label>
              <input
                id="form-nome-chave-pix"
                type="text"
                className="mt-1 w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Nome completo"
                value={form.nomeCliente || ''}
                onChange={(e) => atualizar('nomeCliente', e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          ) : (
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300">Tipo de Solicitação</label>
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
              </select>
            </div>
          )}
        </div>

        {form.tipo === 'Alteração de Dados Cadastrais' && (
          <div className="p-4 rounded-lg mt-2" style={{ background: 'transparent', border: '1.5px solid #000058', borderRadius: '8px' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Tipo de informação</label>
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
                <label className="text-sm text-gray-700 dark:text-gray-300">Dado antigo</label>
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
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Dado novo</label>
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
              </div>
            </div>
          </div>
        )}

        {isTipoExclusaoConta(form.tipo) && (
          <div className="p-4 rounded-lg mt-2" style={{ background: 'transparent', border: '1.5px solid #000058', borderRadius: '8px' }}>
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
          <div className="p-4 rounded-lg mt-2" style={{ background: 'transparent', border: '1.5px solid #000058', borderRadius: '8px' }}>
            {liberacaoChavePixTab && (
              <div className="mb-4">
                <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block" htmlFor="form-origem-chave-pix">
                  Origem
                </label>
                <select
                  id="form-origem-chave-pix"
                  className="w-full md:max-w-md border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
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
                <div className="mt-4">
                  <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">Prazo Máximo</label>
                  <input
                    type="date"
                    className="w-auto px-3 py-2 border border-gray-400 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500"
                    value={form.prazoMaximo || ''}
                    onChange={(e) => atualizar('prazoMaximo', e.target.value)}
                  />
                </div>
              );
            })()}
          </div>
        )}

        {form.tipo === 'Aumento de Limite Pix' && (
          <div className="p-4 rounded-lg mt-2" style={{ background: 'transparent', border: '1.5px solid #000058', borderRadius: '8px' }}>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300">Valor</label>
              <input
                className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                type="text"
                placeholder="R$0,00"
                value={formatarMoeda(form.valor)}
                onChange={(e) => atualizar('valor', e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {form.tipo === 'Devolução de Antecipação' && (
          <div className="p-4 rounded-lg mt-2" style={{ background: 'transparent', border: '1.5px solid #000058', borderRadius: '8px' }}>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Data da Contratação</label>
                <input
                  className={`w-full border rounded-lg px-3 py-2 outline-none transition-all duration-200 dark:bg-gray-800 dark:text-white ${devolucaoAntecInfo.dateBorderClass}`}
                  type="date"
                  value={form.devolucaoDataContratacao || ''}
                  onChange={(e) => atualizar('devolucaoDataContratacao', e.target.value)}
                  required
                />
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
                <label className="text-sm text-gray-700 dark:text-gray-300">Obs do cliente</label>
                <textarea
                  className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 min-h-[88px] outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Observações do cliente sobre a devolução"
                  value={form.obsClienteDevolucao || ''}
                  onChange={(e) => atualizar('obsClienteDevolucao', e.target.value)}
                />
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

        {form.tipo === 'Cancelamento' && (
          <div className="p-4 rounded-lg mt-2" style={{ background: 'transparent', border: '1.5px solid #000058', borderRadius: '8px' }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Nome do Cliente</label>
                <input
                  className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  type="text"
                  placeholder="Nome completo do cliente"
                  value={form.nomeCliente || ''}
                  onChange={(e) => atualizar('nomeCliente', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Data da Contratação</label>
                <input
                  className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  type="date"
                  value={form.dataContratacao || ''}
                  onChange={(e) => atualizar('dataContratacao', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Valor</label>
                <input
                  className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  type="text"
                  placeholder="R$0,00"
                  value={formatarMoeda(form.valor)}
                  onChange={(e) => atualizar('valor', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="text-sm text-gray-700 dark:text-gray-300">Observações</label>
          <textarea
            className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 h-28 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Adicione observações adicionais..."
            value={form.observacoes}
            onChange={(e) => atualizar('observacoes', e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-4 mt-1 mb-0">
          <button
            disabled={loading || !formularioPodeEnviar}
            className={`bg-blue-600 text-white font-medium px-5 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 inline-flex items-center gap-2 ${
              loading || !formularioPodeEnviar ? 'opacity-60 cursor-not-allowed' : ''
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
            ) : (
              'Enviar Solicitação'
            )}
          </button>
        </div>

        {buscaResultados && buscaResultados.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 backdrop-blur p-4 rounded-xl border border-gray-200 dark:border-gray-700 mt-3">
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

