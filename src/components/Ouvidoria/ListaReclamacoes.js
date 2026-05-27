/**
 * VeloHub V3 - ListaReclamacoes Component
 * VERSION: v1.31.2 | DATE: 2026-05-26 | AUTHOR: VeloHub Development Team
 *
 * Referência (duas entradas; detalhes no Git):
 * - v1.31.2: Pós-fusão — refresh do ticket aberto (getById) + patch imediato Liberação Anterior
 * - v1.31.1: Botão Fundir no editar — comparação de `_id` normalizada com ctx de fusão
 * - v1.31.0: Status lista — tickets absorvidos por fusão exibidos como Resolvido (isFusaoAbsorvoAlvo)
 * - v1.30.9: Paginação: coerção numérica em `normalizarListaReclamacoesPaginacao`; `setPaginacao` usa `prev` (evita meta errada); barra quando `page>1`/total/coerção
 * - v1.30.8: Paginação: meta harmonizada (`total`/`totalPages`); CPF≠11 dígitos e por colaborador enviam page/limit; barra quando `total > limit`
 * - v1.30.7: MOTIVOS_FILTRO_LISTA — união dos três grupos de motivos (corrige ReferenceError)
 * - v1.30.6: PRODUTOS_FILTRO_LISTA importado de `utils/ouvidoriaProdutoOpcoes`
 * - v1.30.5: Filtro motivo: «Elegibilidade» nas uniões BACEN/Reclame Aqui
 * - v1.27.0: Filtro e exibição: tipo Time Portabilidade (TIME_PORTABILIDADE); getDataExibicao e normalizarTipoExibicao
 */

import React, { useState, useEffect, useRef } from 'react';
import { reclamacoesAPI, colaboradoresAPI, anexosAPI } from '../../services/ouvidoriaApi';
import { FloatingLabelField } from '../shared/FloatingLabelField';
import FormReclamacaoEdit from './FormReclamacaoEdit';
import FusaoFundidoBadge from './FusaoFundidoBadge';
import { isFusaoAbsorvoAlvo } from '../../utils/ouvidoriaFusaoNotif';
import { formatDateRegistro, getSlaBadgeReclamacao } from '../../utils/dateUtils';
import toast from 'react-hot-toast';
import { OUVIDORIA_PRODUTO_OPCOES as PRODUTOS_FILTRO_LISTA } from '../../utils/ouvidoriaProdutoOpcoes';
import { normalizeMongoId } from '../../utils/requisicoesModalHelpers';

/**
 * Funções auxiliares (reutilizadas do FormReclamacao)
 */
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
 * União de todos os motivos (FormReclamacao) para filtro único na lista.
 * Mantido alinhado com FormReclamacao/FormReclamacaoEdit.
 */
const MOTIVOS_REDUZIDOS = [ /* BACEN, N2 Pix, Procon */
  'Liberação chave pix',
  'Portabilidade pix',
  'Abatimento de juros',
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
const MOTIVOS_ACAO_JUDICIAL = [
  'Juros',
  'Chave pix',
  'Restituição BB',
  'Relatório',
  'Repetição indébito',
  'Superendividamento',
  'Desconhece contratação',
];
const MOTIVOS_RECLAME_AQUI = [
  'Reativação do cadastro',
  'Alteração cadastral',
  'Abatimento de juros',
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

/** União deduplicada dos motivos dos formulários, ordenada para o select de filtro. */
const MOTIVOS_FILTRO_LISTA = Array.from(
  new Set([...MOTIVOS_REDUZIDOS, ...MOTIVOS_ACAO_JUDICIAL, ...MOTIVOS_RECLAME_AQUI])
).sort((a, b) => a.localeCompare(b, 'pt-BR'));

/**
 * Meta de página alinhada à API GET `/reclamacoes` (`total`, `limit`, `page`, `totalPages`).
 * Recalcula `totalPages` se vier ausente/inconsistente com `total`.
 *
 * @param {Record<string, unknown>} resultado
 * @param {{ page?: number; limit?: number; total?: number }} prev
 */
function normalizarListaReclamacoesPaginacao(resultado, prev) {
  /** Número finito vindos da API (evita strings JSON que quebravam `totalPages`/`total`). */
  const nIntPos = (v, fallbackMin1) => {
    if (v === null || v === undefined || v === '') return NaN;
    const x = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(x)) return NaN;
    const t = Math.trunc(x);
    return fallbackMin1 ? Math.max(1, t) : Math.max(0, t);
  };

  const limitFromApi = nIntPos(resultado?.limit, true);
  const limit = Number.isFinite(limitFromApi)
    ? Math.min(500, limitFromApi)
    : Math.max(1, nIntPos(prev?.limit, true) || 20);

  let total = nIntPos(resultado?.total, false);
  if (!Number.isFinite(total) || total < 0) total = 0;
  if (total <= 0 && typeof prev?.total === 'number' && !Number.isNaN(prev.total) && prev.total > 0) {
    total = Math.floor(prev.total);
  }

  let totalPages = nIntPos(resultado?.totalPages, true);
  if (!Number.isFinite(totalPages) || totalPages < 1) totalPages = 0;

  const ceilPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
  if (ceilPages > 1) totalPages = Math.max(totalPages, ceilPages);
  totalPages = Math.max(totalPages || 1, 1);

  let pageNum = nIntPos(resultado?.page, true);
  if (!Number.isFinite(pageNum) || pageNum < 1) {
    const pp = nIntPos(prev?.page, true);
    pageNum = Number.isFinite(pp) && pp >= 1 ? pp : 1;
  }
  pageNum = Math.min(Math.max(1, pageNum), Math.max(1, totalPages));

  return { page: pageNum, limit, total: Math.floor(total), totalPages };
}

const ListaReclamacoes = ({
  onFusaoConsultaChange,
  listaReloadSignal = 0,
  fusaoConsultaCtx = null,
  onAbrirModalFusao,
  fusaoLiberacaoAnteriorMarcacao = { cpf: '', seq: 0 },
  fusaoPatchFormulario = null,
}) => {
  const [reclamacoes, setReclamacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [colaboradores, setColaboradores] = useState([]);
  const [filtros, setFiltros] = useState({
    tipo: '',
    cpf: '',
    colaboradorNome: '',
    dataInicio: '',
    dataFim: '',
    motivo: '',
    produto: '',
    status: '',
  });
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    tipo: '',
    cpf: '',
    colaboradorNome: '',
    dataInicio: '',
    dataFim: '',
    motivo: '',
    produto: '',
    status: '',
  });
  const [selectedReclamacao, setSelectedReclamacao] = useState(null);
  /** ID string do item cujo menu lateral está aberto */
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [paginacao, setPaginacao] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Carregar lista de colaboradores ao montar componente
  useEffect(() => {
    loadColaboradores();
  }, []);

  useEffect(() => {
    loadReclamacoes();
  }, [filtrosAplicados, paginacao.page]);

  useEffect(() => {
    if (listaReloadSignal > 0) {
      loadReclamacoes();
    }
  }, [listaReloadSignal]);

  useEffect(() => {
    if (listaReloadSignal <= 0 || !selectedReclamacao) return;
    const id = selectedReclamacao._id ?? selectedReclamacao.id;
    const tipo = selectedReclamacao.tipo;
    if (id == null || !tipo) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await reclamacoesAPI.getById(String(id), tipo);
        const fresh = res?.data ?? res;
        if (!cancelled && fresh) setSelectedReclamacao(fresh);
      } catch (err) {
        console.error('[ListaReclamacoes] refresh ticket pós-fusão:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listaReloadSignal]);

  const fecharModalEdicao = () => {
    if (typeof onFusaoConsultaChange === 'function') {
      onFusaoConsultaChange(null);
    }
    setSelectedReclamacao(null);
  };

  const podeFundirNoModalEdicao =
    Boolean(fusaoConsultaCtx?.showButton) &&
    fusaoConsultaCtx?.source === 'lista' &&
    selectedReclamacao &&
    normalizeMongoId(fusaoConsultaCtx?.currentId) !== '' &&
    normalizeMongoId(fusaoConsultaCtx?.currentId) ===
      normalizeMongoId(selectedReclamacao?._id ?? selectedReclamacao?.id) &&
    String(fusaoConsultaCtx?.cpf ?? '').replace(/\D/g, '') ===
      String(selectedReclamacao?.cpf ?? '').replace(/\D/g, '');

  useEffect(() => {
    if (menuOpenId == null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpenId(null);
    };
    const onDown = (e) => {
      if (!e.target.closest?.('[data-reclamacao-menu-root]')) setMenuOpenId(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [menuOpenId]);

  const solicitarExcluirReclamacao = async (reclamacao) => {
    const idStr = reclamacao?._id != null ? String(reclamacao._id) : '';
    const tipo = reclamacao?.tipo;
    if (!idStr || tipo == null || String(tipo).trim() === '') {
      toast.error('Não foi possível identificar o registro para exclusão.');
      return;
    }
    if (!window.confirm('Excluir este registro permanentemente? Esta ação não pode ser desfeita.')) {
      return;
    }
    try {
      await reclamacoesAPI.remove(idStr, tipo);
      toast.success('Registro excluído');
      setMenuOpenId(null);
      setSelectedReclamacao((cur) => (cur && String(cur._id) === idStr ? null : cur));
      loadReclamacoes();
    } catch (err) {
      console.error('Erro ao excluir reclamação:', err);
      toast.error(err?.message || 'Erro ao excluir registro');
    }
  };

  /**
   * Carregar lista de colaboradores
   */
  const loadColaboradores = async () => {
    try {
      const resultado = await colaboradoresAPI.getColaboradores();
      setColaboradores(resultado.data || resultado || []);
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
      toast.error('Erro ao carregar lista de colaboradores');
    }
  };

  /**
   * Aplicar filtros
   */
  const aplicarFiltros = () => {
    setFiltrosAplicados({ ...filtros });
    setPaginacao(prev => ({ ...prev, page: 1 }));
  };

  /**
   * Limpar filtros
   */
  const limparFiltros = () => {
    const filtrosLimpos = { tipo: '', cpf: '', colaboradorNome: '', dataInicio: '', dataFim: '', motivo: '', produto: '', status: '' };
    setFiltros(filtrosLimpos);
    setFiltrosAplicados(filtrosLimpos);
    setPaginacao(prev => ({ ...prev, page: 1 }));
  };

  /**
   * Aplicar filtros de data e motivo (client-side para getByCpf/getByColaborador)
   */
  const aplicarFiltrosDataEMotivo = (dados, filtros) => {
    let resultado = dados;
    if (filtros.dataInicio || filtros.dataFim) {
      const inicio = filtros.dataInicio ? new Date(filtros.dataInicio + 'T00:00:00.000Z').getTime() : 0;
      const fim = filtros.dataFim ? new Date(filtros.dataFim + 'T23:59:59.999Z').getTime() : Infinity;
      resultado = resultado.filter(r => {
        const dataVal = getDataExibicao(r);
        if (!dataVal) return false;
        const dt = dataVal instanceof Date ? dataVal : new Date(dataVal);
        const ts = dt.getTime();
        return !isNaN(ts) && ts >= inicio && ts <= fim;
      });
    }
    if (filtros.motivo && String(filtros.motivo).trim()) {
      const motivoFiltro = String(filtros.motivo).trim();
      resultado = resultado.filter(r => {
        const m = r.motivoReduzido;
        if (!m) return false;
        if (Array.isArray(m)) return m.some(v => String(v || '').trim() === motivoFiltro);
        return String(m).trim() === motivoFiltro;
      });
    }
    if (filtros.produto && String(filtros.produto).trim()) {
      const prodFiltro = String(filtros.produto).trim();
      resultado = resultado.filter(r => String(r.produto || '').trim() === prodFiltro);
    }
    if (filtros.status && String(filtros.status).trim()) {
      const statusVal = String(filtros.status).trim().toLowerCase();
      resultado = resultado.filter(r => {
        const resolvido = r.Finalizado?.Resolvido === true;
        if (statusVal === 'resolvido') return resolvido;
        if (statusVal === 'em_andamento' || statusVal === 'emandamento') return !resolvido;
        return true;
      });
    }
    return resultado;
  };

  /**
   * Normalizar tipo para exibição
   */
  const normalizarTipoExibicao = (tipo) => {
    if (!tipo) return 'BACEN';
    const tipoUpper = String(tipo).toUpperCase().trim();
    
    if (tipoUpper === 'PROCESSOS' || tipoUpper === 'JUDICIAL' || tipoUpper === 'AÇÃO JUDICIAL' || tipoUpper === 'ACAO JUDICIAL') {
      return 'Ação Judicial';
    }
    if (tipoUpper === 'N2' || tipoUpper === 'N2 & PIX' || tipoUpper === 'N2&PIX' || tipoUpper === 'N2 PIX' || tipoUpper === 'OUVIDORIA') {
      return 'N2 Pix';
    }
    if (tipoUpper === 'RECLAME_AQUI' || tipoUpper === 'RECLAMEAQUI' || tipoUpper === 'RECLAME AQUI') {
      return 'Reclame Aqui';
    }
    if (tipoUpper === 'PROCON') {
      return 'Procon';
    }
    if (tipoUpper === 'BACEN') {
      return 'BACEN';
    }
    if (tipoUpper === 'TIME_PORTABILIDADE' || tipoUpper === 'TIME PORTABILIDADE' || String(tipo).trim() === 'Time Portabilidade') {
      return 'Time Portabilidade';
    }
    
    return tipo; // Retornar original se não for nenhum dos casos conhecidos
  };

  /**
   * Carregar reclamações
   */
  const loadReclamacoes = async () => {
    setLoading(true);
    try {
      let resultado;
      if (filtrosAplicados.cpf) {
        const cpfDigits = filtrosAplicados.cpf.replace(/\D/g, '');
        /** Backend retorna coleção inteira apenas com CPF de 11 dígitos (`skipPaginationForCpf`). */
        const servidorPaginaCpfParcial = cpfDigits.length > 0 && cpfDigits.length !== 11;
        resultado = await reclamacoesAPI.getByCpf(
          cpfDigits,
          servidorPaginaCpfParcial
            ? { page: paginacao.page, limit: paginacao.limit }
            : {},
        );
        let dados = resultado.data || resultado || [];

        if (filtrosAplicados.tipo) {
          dados = dados.filter(r => {
            const tipoNormalizado = normalizarTipoExibicao(r.tipo);
            const filtroNormalizado = normalizarTipoExibicao(filtrosAplicados.tipo);
            return tipoNormalizado === filtroNormalizado;
          });
        }
        dados = aplicarFiltrosDataEMotivo(dados, filtrosAplicados);

        setReclamacoes(dados);
        if (servidorPaginaCpfParcial) {
          setPaginacao((prev) => ({ ...prev, ...normalizarListaReclamacoesPaginacao(resultado, prev) }));
        } else {
          setPaginacao((prev) => ({
            ...prev,
            total: dados.length,
            totalPages: 1,
            page: 1,
          }));
        }
      } else if (filtrosAplicados.colaboradorNome) {
        resultado = await reclamacoesAPI.getByColaborador(filtrosAplicados.colaboradorNome, {
          page: paginacao.page,
          limit: paginacao.limit,
        });
        let dados = resultado.data || resultado || [];

        if (filtrosAplicados.tipo) {
          dados = dados.filter(r => {
            const tipoNormalizado = normalizarTipoExibicao(r.tipo);
            const filtroNormalizado = normalizarTipoExibicao(filtrosAplicados.tipo);
            return tipoNormalizado === filtroNormalizado;
          });
        }
        dados = aplicarFiltrosDataEMotivo(dados, filtrosAplicados);

        setReclamacoes(dados);
        setPaginacao((prev) => ({ ...prev, ...normalizarListaReclamacoesPaginacao(resultado, prev) }));
      } else {
        // Busca geral com paginação
        const params = {
          page: paginacao.page,
          limit: paginacao.limit,
        };
        
        // Adicionar filtros como query params
        if (filtrosAplicados.tipo) params.tipo = filtrosAplicados.tipo;
        if (filtrosAplicados.dataInicio) params.dataInicio = filtrosAplicados.dataInicio;
        if (filtrosAplicados.dataFim) params.dataFim = filtrosAplicados.dataFim;
        if (filtrosAplicados.motivo) params.motivo = filtrosAplicados.motivo;
        if (filtrosAplicados.produto) params.produto = filtrosAplicados.produto;
        if (filtrosAplicados.status) params.status = filtrosAplicados.status;

        resultado = await reclamacoesAPI.getAll(params);
        
        const dados = resultado.data || [];
        setReclamacoes(dados);
        setPaginacao((prev) => ({ ...prev, ...normalizarListaReclamacoesPaginacao(resultado, prev) }));
      }
    } catch (error) {
      console.error('Erro ao carregar reclamações:', error);
      toast.error('Erro ao carregar lista de reclamações');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formatar CPF
   */
  /**
   * Formatar CPF com máscara progressiva (para input)
   */
  const formatCPFInput = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return cleaned.replace(/(\d{3})(\d+)/, '$1.$2');
    if (cleaned.length <= 9) return cleaned.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
    if (cleaned.length <= 11) return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4');
    return value;
  };

  /**
   * Formatar CPF para exibição (apenas formatação final)
   */
  const formatCPF = (cpf) => {
    if (!cpf) return '-';
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  /**
   * Obter data de exibição conforme tipo (campo correto por coleção)
   */
  const getDataExibicao = (r) => {
    const tipoUpper = String(r?.tipo || '').toUpperCase().trim();
    if (tipoUpper === 'N2' || tipoUpper === 'N2 PIX' || tipoUpper === 'OUVIDORIA') return r.dataEntradaN2;
    if (tipoUpper === 'RECLAME_AQUI' || tipoUpper === 'RECLAME AQUI' || tipoUpper === 'RECLAMEAQUI') return r.dataReclam;
    if (tipoUpper === 'PROCON') return r.dataProcon;
    if (tipoUpper === 'TIME_PORTABILIDADE' || tipoUpper === 'TIME PORTABILIDADE') return r.dataEntrada;
    return r.dataEntrada || r.createdAt;
  };

  /**
   * Formatar motivoReduzido (string ou array) para exibição
   */
  const formatarMotivoExibicao = (motivoReduzido) => {
    if (!motivoReduzido) return '';
    if (Array.isArray(motivoReduzido)) return motivoReduzido.filter(Boolean).join(', ');
    return String(motivoReduzido);
  };

  const getStatusInfo = (reclamacao) => {
    if (reclamacao.Finalizado?.Resolvido === true) {
      return {
        texto: 'Resolvido',
        cor: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-200'
      };
    }
    if (isFusaoAbsorvoAlvo(reclamacao)) {
      return {
        texto: 'Resolvido',
        cor: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-200'
      };
    }
    return {
      texto: 'Em Andamento',
      cor: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200'
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">Carregando reclamações...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Filtros — rótulo flutuante (FloatingLabelField) */}
      <div className="velohub-card mb-6 pt-2 pb-4 px-4">
        <div className="flex items-end gap-2 flex-wrap">
          {(() => {
            const fieldClass =
              'w-full border border-gray-400 dark:border-gray-500 rounded-lg px-2.5 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white';
            return (
              <>
                <div className="flex-1 min-w-[110px]">
                  <FloatingLabelField id="filtro-tipo" label="Tipo" value={filtros.tipo}>
                    <select
                      value={filtros.tipo}
                      onChange={(e) => setFiltros((prev) => ({ ...prev, tipo: e.target.value }))}
                      className={fieldClass}
                    >
                      <option value="">Todos</option>
                      <option value="BACEN">BACEN</option>
                      <option value="N2">N2 Pix</option>
                      <option value="Reclame Aqui">Reclame Aqui</option>
                      <option value="Procon">Procon</option>
                      <option value="PROCESSOS">Ação Judicial</option>
                      <option value="TIME_PORTABILIDADE">Time Portabilidade</option>
                    </select>
                  </FloatingLabelField>
                </div>

                <div className="flex-1 min-w-[110px]">
                  <FloatingLabelField id="filtro-cpf" label="CPF" value={filtros.cpf}>
                    <input
                      type="text"
                      value={filtros.cpf}
                      onChange={(e) => {
                        const formatted = formatCPFInput(e.target.value);
                        setFiltros((prev) => ({ ...prev, cpf: formatted }));
                      }}
                      className={fieldClass}
                      maxLength={14}
                    />
                  </FloatingLabelField>
                </div>

                <div className="flex-1 min-w-[110px]">
                  <FloatingLabelField id="filtro-colab" label="Colaborador" value={filtros.colaboradorNome}>
                    <select
                      value={filtros.colaboradorNome}
                      onChange={(e) => setFiltros((prev) => ({ ...prev, colaboradorNome: e.target.value }))}
                      className={fieldClass}
                    >
                      <option value="">Todos</option>
                      {colaboradores.map((colab, index) => (
                        <option key={index} value={colab.nome}>
                          {colab.nome}
                        </option>
                      ))}
                    </select>
                  </FloatingLabelField>
                </div>

                <div className="flex-1 min-w-[110px]">
                  <FloatingLabelField id="filtro-data-inicio" label="Data Início" value={filtros.dataInicio}>
                    <input
                      type="date"
                      value={filtros.dataInicio}
                      onChange={(e) => setFiltros((prev) => ({ ...prev, dataInicio: e.target.value }))}
                      className={fieldClass}
                    />
                  </FloatingLabelField>
                </div>

                <div className="flex-1 min-w-[110px]">
                  <FloatingLabelField id="filtro-data-fim" label="Data Fim" value={filtros.dataFim}>
                    <input
                      type="date"
                      value={filtros.dataFim}
                      onChange={(e) => setFiltros((prev) => ({ ...prev, dataFim: e.target.value }))}
                      className={fieldClass}
                    />
                  </FloatingLabelField>
                </div>

                <div className="flex-1 min-w-[130px]">
                  <FloatingLabelField id="filtro-motivo" label="Motivo" value={filtros.motivo}>
                    <select
                      value={filtros.motivo}
                      onChange={(e) => setFiltros((prev) => ({ ...prev, motivo: e.target.value }))}
                      className={fieldClass}
                    >
                      <option value="">Todos</option>
                      {MOTIVOS_FILTRO_LISTA.map((mot, idx) => (
                        <option key={idx} value={mot}>
                          {mot}
                        </option>
                      ))}
                    </select>
                  </FloatingLabelField>
                </div>

                <div className="flex-1 min-w-[130px]">
                  <FloatingLabelField id="filtro-produto" label="Produto" value={filtros.produto}>
                    <select
                      value={filtros.produto}
                      onChange={(e) => setFiltros((prev) => ({ ...prev, produto: e.target.value }))}
                      className={fieldClass}
                    >
                      <option value="">Todos</option>
                      {PRODUTOS_FILTRO_LISTA.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </FloatingLabelField>
                </div>

                <div className="flex-1 min-w-[110px]">
                  <FloatingLabelField id="filtro-status" label="Status" value={filtros.status}>
                    <select
                      value={filtros.status}
                      onChange={(e) => setFiltros((prev) => ({ ...prev, status: e.target.value }))}
                      className={fieldClass}
                    >
                      <option value="">Todos</option>
                      <option value="em_andamento">Em Andamento</option>
                      <option value="resolvido">Resolvido</option>
                    </select>
                  </FloatingLabelField>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={aplicarFiltros}
                    className="text-sm px-3 py-1.5 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700"
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
                    Filtrar
                  </button>
                  <button
                    onClick={limparFiltros}
                    className="text-sm px-3 py-1.5 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700"
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
                    Limpar
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Lista de reclamações */}
      <div className="space-y-4">
        {reclamacoes.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600 text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Nenhuma reclamação encontrada</p>
          </div>
        ) : (
          <>
            {reclamacoes.map((reclamacao, index) => {
              const rowId = reclamacao._id != null ? String(reclamacao._id) : '';
              const menuOpen = menuOpenId === rowId;
              return (
                <div
                  key={rowId || `reclamacao-row-${index}`}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors flex gap-2 items-start"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    className="flex-1 min-w-0 cursor-pointer text-left"
                    onClick={() => setSelectedReclamacao(reclamacao)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedReclamacao(reclamacao);
                      }
                    }}
                  >
                    <div className="font-medium text-sm text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-2 flex-wrap">
                      <span>
                        {reclamacao.nome || 'Sem nome'} — {formatCPF(reclamacao.cpf)}
                      </span>
                      {(() => {
                        const statusInfo = getStatusInfo(reclamacao);
                        return (
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${statusInfo.cor}`}>
                            {statusInfo.texto}
                          </span>
                        );
                      })()}
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200">
                        {normalizarTipoExibicao(reclamacao.tipo)}
                      </span>
                      {(() => {
                        const sla = getSlaBadgeReclamacao(reclamacao);
                        if (!sla) return null;
                        return (
                          <span
                            title={sla.title}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium ${sla.corClasses}`}
                          >
                            {sla.texto}
                          </span>
                        );
                      })()}
                      <FusaoFundidoBadge fusao={reclamacao.Fusao} />
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-1 flex-wrap">
                      <span>Data: {formatDateRegistro(getDataExibicao(reclamacao))}</span>
                      {reclamacao.responsavel && <span>• Responsável: {reclamacao.responsavel}</span>}
                      {reclamacao.produto != null && String(reclamacao.produto).trim() !== '' && (
                        <span>• Produto: {String(reclamacao.produto).trim()}</span>
                      )}
                      {reclamacao.motivoReduzido && (Array.isArray(reclamacao.motivoReduzido) ? reclamacao.motivoReduzido.length > 0 : reclamacao.motivoReduzido) && (
                        <span>• {formatarMotivoExibicao(reclamacao.motivoReduzido)}</span>
                      )}
                    </div>
                  </div>
                  <div className="relative shrink-0" data-reclamacao-menu-root>
                    <button
                      type="button"
                      aria-label="Opções do registro"
                      aria-expanded={menuOpen}
                      aria-haspopup="menu"
                      className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId((prev) => (prev === rowId ? null : rowId));
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                    </button>
                    {menuOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 top-full mt-1 py-1 min-w-[11rem] rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg z-[20]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          role="menuitem"
                          className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => solicitarExcluirReclamacao(reclamacao)}
                        >
                          Excluir registro
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Controles de Paginação */}
            {(paginacao.totalPages > 1 ||
              paginacao.total > paginacao.limit ||
              paginacao.page > 1) && (
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 mt-6">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Mostrando {((paginacao.page - 1) * paginacao.limit) + 1} a {Math.min(paginacao.page * paginacao.limit, paginacao.total)} de {paginacao.total} reclamações
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPaginacao(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={paginacao.page === 1}
                    className="text-sm px-3 py-2 rounded border transition-all duration-300 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      borderColor: paginacao.page === 1 ? '#9ca3af' : '#006AB9',
                      color: paginacao.page === 1 ? '#9ca3af' : '#006AB9',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (paginacao.page !== 1) {
                        e.target.style.background = 'linear-gradient(135deg, #006AB9 0%, #006AB9 100%)';
                        e.target.style.color = '#F3F7FC';
                        e.target.style.borderColor = '#006AB9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (paginacao.page !== 1) {
                        e.target.style.background = 'transparent';
                        e.target.style.color = '#006AB9';
                        e.target.style.borderColor = '#006AB9';
                      }
                    }}
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300 px-3">
                    Página {paginacao.page} de {paginacao.totalPages}
                  </span>
                  <button
                    onClick={() => setPaginacao(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={paginacao.page === paginacao.totalPages}
                    className="text-sm px-3 py-2 rounded border transition-all duration-300 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      borderColor: paginacao.page === paginacao.totalPages ? '#9ca3af' : '#006AB9',
                      color: paginacao.page === paginacao.totalPages ? '#9ca3af' : '#006AB9',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (paginacao.page !== paginacao.totalPages) {
                        e.target.style.background = 'linear-gradient(135deg, #006AB9 0%, #006AB9 100%)';
                        e.target.style.color = '#F3F7FC';
                        e.target.style.borderColor = '#006AB9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (paginacao.page !== paginacao.totalPages) {
                        e.target.style.background = 'transparent';
                        e.target.style.color = '#006AB9';
                        e.target.style.borderColor = '#006AB9';
                      }
                    }}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Edição */}
      {selectedReclamacao && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center backdrop-blur-sm p-4"
          style={{ zIndex: 9999 }}
          onClick={fecharModalEdicao}
        >
          <div
            className="rounded-lg shadow-xl w-full max-w-6xl h-[95vh] max-h-[95vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{
              borderRadius: 'var(--velohub-radius-container)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              backgroundColor: 'var(--cor-container)',
              border: '1px solid var(--cor-borda)',
              zIndex: 10000,
              position: 'relative'
            }}
          >
            {/* Header do Modal */}
            <div
              className="flex items-center justify-between p-6 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--cor-borda)' }}
            >
              <h2 className="text-2xl font-semibold velohub-title">Editar Reclamação</h2>
              <button
                type="button"
                onClick={fecharModalEdicao}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                style={{ fontSize: '28px', lineHeight: '1' }}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            {/* Conteúdo do Modal com scroll - min-h-0 permite overflow em flex children */}
            <div className="overflow-y-auto flex-1 min-h-0 p-6">
              <FormReclamacaoEdit
                reclamacao={selectedReclamacao}
                onFusaoConsultaChange={onFusaoConsultaChange}
                fundirInlineAtivo={podeFundirNoModalEdicao}
                onAbrirModalFusao={onAbrirModalFusao}
                fusaoLiberacaoAnteriorMarcacao={fusaoLiberacaoAnteriorMarcacao}
                fusaoPatchFormulario={fusaoPatchFormulario}
                onClose={fecharModalEdicao}
                onSuccess={() => {
                  fecharModalEdicao();
                  loadReclamacoes();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaReclamacoes;
