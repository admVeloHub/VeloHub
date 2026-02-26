/**
 * VeloHub V3 - ListaReclamacoes Component
 * VERSION: v1.9.0 | DATE: 2025-02-20 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v1.9.0:
 * - Removido campo status (usar Finalizado.Resolvido para determinar se está em andamento ou resolvido)
 * - Removido filtro de status
 * 
 * Mudanças v1.8.0:
 * - Modal de detalhes substituído por formulário de edição completo
 * - Formulário idêntico ao da aba "Nova Reclamação"
 * - Botão de salvar com dropdown (Em Andamento / Resolvido)
 * - Permite editar todos os campos da reclamação
 * - Atualização automática da lista após salvar
 * 
 * Mudanças v1.7.0:
 * - Adicionado botão "Filtrar" na mesma linha dos campos
 * - Botão "Limpar" movido para mesma linha dos campos e botão Filtrar
 * - Campo colaborador alterado de input para dropdown
 * - Dropdown populado com usuários que têm ouvidoria=true
 * - Filtros agora são aplicados apenas ao clicar no botão Filtrar (não mais automático)
 * 
 * Mudanças v1.6.0:
 * - Adicionada máscara progressiva de CPF no campo de filtro
 * - Máscara aplicada durante digitação (000.000.000-00)
 * 
 * Mudanças v1.5.0:
 * - Implementada paginação no backend e frontend para acelerar carregamento
 * - Adicionados controles de paginação (Anterior/Próxima)
 * - Exibição de informações de paginação (página atual, total de páginas, total de registros)
 * - Limite padrão de 20 itens por página
 * - Reset de página ao limpar filtros
 * 
 * Mudanças v1.4.0:
 * - Modal de detalhes atualizado para seguir padrão do projeto
 * - Aumentadas dimensões do modal (max-w-5xl)
 * - Melhorado layout com header fixo e conteúdo com scroll
 * - Aplicado backdrop-blur e overlay mais escuro
 * - Melhorado espaçamento e organização dos dados
 * - Cards de dados com background secundário para melhor visualização
 * 
 * Mudanças v1.3.0:
 * - Botão "Limpar Filtros" reposicionado junto ao cabeçalho "Filtros"
 * 
 * Mudanças v1.2.0:
 * - Removido header com gradiente e ícone
 * - Aplicado padrão de container secundário aos cards (bg-gray-50 dark:bg-gray-700)
 * - Adequadas fontes conforme padrão do projeto (text-sm para títulos, text-xs para info)
 * - Botões adequados ao padrão do projeto
 * - Campos de preenchimento adequados ao padrão do Req_Prod
 * 
 * Mudanças v1.1.0:
 * - Containers padronizados com classes velohub-card e velohub-container conforme LAYOUT_GUIDELINES.md
 * 
 * Componente para listagem de todas as reclamações
 */

import React, { useState, useEffect, useRef } from 'react';
import { reclamacoesAPI, colaboradoresAPI, anexosAPI } from '../../services/ouvidoriaApi';
import FormReclamacaoEdit from './FormReclamacaoEdit';
import toast from 'react-hot-toast';

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

const MOTIVOS_REDUZIDOS = [
  'Abatimento Juros',
  'Abatimento Juros/Chave PIX',
  'Cancelamento Conta',
  'Chave PIX',
  'PIX/Abatimento Juros/Encerramento de conta',
  'Chave PIX/Abatimento Juros/Prob. App',
  'Chave PIX/Acesso ao App',
  'Chave PIX/Exclusão de Conta',
  'Conta',
  'Contestação de Valores',
  'Credito do Trabalhador',
  'Credito Pessoal',
  'Cupons Velotax',
  'Devolução à Celcoin',
  'Fraude',
  'Liquidação Antecipada',
  'Liquidação Antecipada/Abatimento Juros',
  'Não recebeu restituição',
  'Não recebeu restituição/Abatimento Juros',
  'Não recebeu restituição/Abatimento Juros/Chave PIX',
  'Não recebeu restituição/Chave PIX',
  'Probl. App/Gov',
  'Seguro Celular',
  'Seguro Divida Zero',
  'Seguro Prestamista',
  'Seguro Saude',
  'Superendividamento'
];

const ListaReclamacoes = () => {
  const [reclamacoes, setReclamacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [colaboradores, setColaboradores] = useState([]);
  const [filtros, setFiltros] = useState({
    tipo: '',
    cpf: '',
    colaboradorNome: '',
  });
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    tipo: '',
    cpf: '',
    colaboradorNome: '',
  });
  const [selectedReclamacao, setSelectedReclamacao] = useState(null);
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
    const filtrosLimpos = { tipo: '', cpf: '', colaboradorNome: '' };
    setFiltros(filtrosLimpos);
    setFiltrosAplicados(filtrosLimpos);
    setPaginacao(prev => ({ ...prev, page: 1 }));
  };

  /**
   * Carregar reclamações
   */
  const loadReclamacoes = async () => {
    setLoading(true);
    try {
      let resultado;
      if (filtrosAplicados.cpf) {
        resultado = await reclamacoesAPI.getByCpf(filtrosAplicados.cpf.replace(/\D/g, ''));
        // Para busca por CPF, não usar paginação (resultado já filtrado)
        let dados = resultado.data || resultado || [];
        
        // Aplicar filtros adicionais
        if (filtrosAplicados.tipo) {
          dados = dados.filter(r => r.tipo === filtrosAplicados.tipo);
        }

        setReclamacoes(dados);
        setPaginacao(prev => ({ ...prev, total: dados.length, totalPages: 1 }));
      } else if (filtrosAplicados.colaboradorNome) {
        resultado = await reclamacoesAPI.getByColaborador(filtrosAplicados.colaboradorNome);
        // Para busca por colaborador, não usar paginação (resultado já filtrado)
        let dados = resultado.data || resultado || [];
        
        // Aplicar filtros adicionais
        if (filtrosAplicados.tipo) {
          dados = dados.filter(r => r.tipo === filtrosAplicados.tipo);
        }

        setReclamacoes(dados);
        setPaginacao(prev => ({ ...prev, total: dados.length, totalPages: 1 }));
      } else {
        // Busca geral com paginação
        const params = {
          page: paginacao.page,
          limit: paginacao.limit,
        };
        
        // Adicionar filtros como query params
        if (filtrosAplicados.tipo) params.tipo = filtrosAplicados.tipo;
        
        resultado = await reclamacoesAPI.getAll(params);
        
        const dados = resultado.data || [];
        setReclamacoes(dados);
        setPaginacao({
          page: resultado.page || paginacao.page,
          limit: resultado.limit || paginacao.limit,
          total: resultado.total || 0,
          totalPages: resultado.totalPages || 0,
        });
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
   * Formatar data
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  /**
   * Obter status baseado em Finalizado.Resolvido
   */
  const getStatusInfo = (reclamacao) => {
    if (reclamacao.Finalizado?.Resolvido === true) {
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
      {/* Filtros */}
      <div className="velohub-card mb-6">
        <div className="flex items-end gap-3 flex-wrap">

          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Tipo
            </label>
            <select
              value={filtros.tipo}
              onChange={(e) => {
                setFiltros(prev => ({ ...prev, tipo: e.target.value }));
              }}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Todos</option>
              <option value="BACEN">BACEN</option>
              <option value="N2">N2</option>
              <option value="RA-PROCON">RA-PROCON</option>
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              CPF
            </label>
            <input
              type="text"
              value={filtros.cpf}
              onChange={(e) => {
                const formatted = formatCPFInput(e.target.value);
                setFiltros(prev => ({ ...prev, cpf: formatted }));
              }}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Colaborador
            </label>
            <select
              value={filtros.colaboradorNome}
              onChange={(e) => {
                setFiltros(prev => ({ ...prev, colaboradorNome: e.target.value }));
              }}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Todos</option>
              {colaboradores.map((colab, index) => (
                <option key={index} value={colab.nome}>
                  {colab.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={aplicarFiltros}
              className="text-sm px-4 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700"
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
              className="text-sm px-4 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700"
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
        </div>
      </div>

      {/* Lista de Reclamações */}
      <div className="space-y-4">
        {reclamacoes.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600 text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Nenhuma reclamação encontrada</p>
          </div>
        ) : (
          <>
            {reclamacoes.map((reclamacao) => (
              <div
                key={reclamacao._id}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
                onClick={() => setSelectedReclamacao(reclamacao)}
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
                    {reclamacao.tipo || 'BACEN'}
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-1">
                  <span>Data: {formatDate(reclamacao.dataEntrada || reclamacao.createdAt)}</span>
                  {reclamacao.responsavel && <span>• Responsável: {reclamacao.responsavel}</span>}
                  {reclamacao.motivoReduzido && <span>• {reclamacao.motivoReduzido}</span>}
                </div>
              </div>
            ))}

            {/* Controles de Paginação */}
            {paginacao.totalPages > 1 && (
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
          onClick={() => setSelectedReclamacao(null)}
        >
          <div
            className="rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{
              borderRadius: '12px',
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
                onClick={() => setSelectedReclamacao(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                style={{ fontSize: '28px', lineHeight: '1' }}
              >
                ×
              </button>
            </div>

            {/* Conteúdo do Modal com scroll */}
            <div className="overflow-y-auto flex-1 p-6">
              <FormReclamacaoEdit
                reclamacao={selectedReclamacao}
                onClose={() => setSelectedReclamacao(null)}
                onSuccess={() => {
                  setSelectedReclamacao(null);
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
