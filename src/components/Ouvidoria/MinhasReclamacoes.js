/**
 * VeloHub V3 - MinhasReclamacoes Component
 * VERSION: v1.6.0 | DATE: 2026-02-20 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v1.5.0:
 * - Removido campo status (usar Finalizado.Resolvido para determinar se está em andamento ou resolvido)
 * - Removido campo mes da exibição
 * - Removido suporte para filtro por idSecao
 * 
 * Mudanças v1.6.0:
 * - Removidas todas as referências restantes a idSecao (variável não definida causava erro)
 * 
 * Mudanças v1.4.0:
 * - Readequado modal de detalhes para seguir o mesmo padrão de ListaReclamacoes
 * - Modal agora tem header fixo e conteúdo com scroll
 * - Campos organizados em cards com fundo cinza (bg-gray-50 dark:bg-gray-700)
 * - Melhor formatação e espaçamento das seções
 * - Removido campo RDR (vestígio do sistema antigo)
 * 
 * Mudanças v1.2.0:
 * - Removido header com gradiente e ícone
 * - Aplicado padrão de container secundário aos cards (bg-gray-50 dark:bg-gray-700)
 * - Adequadas fontes conforme padrão do projeto (text-sm para títulos, text-xs para info)
 * 
 * Mudanças v1.1.0:
 * - Containers padronizados com classes velohub-card e velohub-container conforme LAYOUT_GUIDELINES.md
 * 
 * Componente para listagem de reclamações do colaborador logado
 */

import React, { useState, useEffect } from 'react';
import { reclamacoesAPI } from '../../services/ouvidoriaApi';
import toast from 'react-hot-toast';

const MinhasReclamacoes = ({ colaboradorNome, userEmail }) => {
  const [reclamacoes, setReclamacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReclamacao, setSelectedReclamacao] = useState(null);

  useEffect(() => {
    if (colaboradorNome) {
      loadMinhasReclamacoes();
    }
  }, [colaboradorNome]);

  /**
   * Carregar minhas reclamações
   */
  const loadMinhasReclamacoes = async () => {
    if (!colaboradorNome) {
      toast.error('Nome do colaborador não encontrado');
      return;
    }

    setLoading(true);
    try {
      const resultado = await reclamacoesAPI.getByColaborador(colaboradorNome);
      const dados = resultado.data || resultado || [];
      setReclamacoes(dados);
    } catch (error) {
      console.error('Erro ao carregar minhas reclamações:', error);
      toast.error('Erro ao carregar suas reclamações');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formatar CPF
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
        <div className="text-gray-600 dark:text-gray-400">Carregando suas reclamações...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Lista de Reclamações */}
      <div className="space-y-4">
        {reclamacoes.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600 text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Você não possui reclamações atribuídas
            </p>
          </div>
        ) : (
          reclamacoes.map((reclamacao) => (
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
                <span>Data: {formatDate(reclamacao.dataEntrada || reclamacao.dataEntradaAtendimento || reclamacao.createdAt)}</span>
                {reclamacao.motivoReduzido && <span>• {reclamacao.motivoReduzido}</span>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Detalhes */}
      {selectedReclamacao && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center backdrop-blur-sm p-4"
          style={{ zIndex: 9999 }}
          onClick={() => setSelectedReclamacao(null)}
        >
          <div
            className="rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
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
              <h2 className="text-2xl font-semibold velohub-title">Detalhes da Reclamação</h2>
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
              <div className="space-y-6">
                {/* Dados Básicos */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300" style={{ color: 'var(--cor-texto-principal)' }}>
                    Dados Básicos
                  </h3>
                  <div className="space-y-4">
                    {/* Linha 1: Nome e CPF */}
                    <div className="grid grid-cols-2 gap-4 text-base text-gray-800 dark:text-gray-200">
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <strong className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Nome:</strong>
                        <span style={{ color: 'var(--cor-texto-principal)' }}>{selectedReclamacao.nome || '-'}</span>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <strong className="text-sm text-gray-600 dark:text-gray-400 block mb-1">CPF:</strong>
                        <span style={{ color: 'var(--cor-texto-principal)' }}>{formatCPF(selectedReclamacao.cpf)}</span>
                      </div>
                    </div>

                    {/* Linha 2: Data Entrada, Tipo, Status */}
                    <div className="grid grid-cols-3 gap-4 text-base text-gray-800 dark:text-gray-200">
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <strong className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Data Entrada:</strong>
                        <span style={{ color: 'var(--cor-texto-principal)' }}>{formatDate(selectedReclamacao.dataEntrada || selectedReclamacao.dataEntradaAtendimento || selectedReclamacao.createdAt)}</span>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <strong className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Tipo:</strong>
                        <span style={{ color: 'var(--cor-texto-principal)' }}>{selectedReclamacao.tipo || '-'}</span>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <strong className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Status:</strong>
                        {(() => {
                          const statusInfo = getStatusInfo(selectedReclamacao);
                          return (
                            <span className={`px-2 py-1 rounded text-xs font-medium inline-block ${statusInfo.cor}`}>
                              {statusInfo.texto}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Linha 3: Origem e Responsável */}
                    {(selectedReclamacao.origem || selectedReclamacao.responsavel) && (
                      <div className="grid grid-cols-2 gap-4 text-base text-gray-800 dark:text-gray-200">
                        {selectedReclamacao.origem && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <strong className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Origem:</strong>
                            <span style={{ color: 'var(--cor-texto-principal)' }}>{selectedReclamacao.origem}</span>
                          </div>
                        )}
                        {selectedReclamacao.responsavel && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <strong className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Responsável:</strong>
                            <span style={{ color: 'var(--cor-texto-principal)' }}>{selectedReclamacao.responsavel}</span>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>

                {/* Motivo */}
                {selectedReclamacao.motivoReduzido && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300" style={{ color: 'var(--cor-texto-principal)' }}>
                      Motivo
                    </h3>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-base text-gray-800 dark:text-gray-200" style={{ color: 'var(--cor-texto-principal)' }}>
                        {selectedReclamacao.motivoReduzido}
                      </p>
                    </div>
                  </div>
                )}

                {/* Detalhes */}
                {selectedReclamacao.motivoDetalhado && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300" style={{ color: 'var(--cor-texto-principal)' }}>
                      Detalhes
                    </h3>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-base whitespace-pre-wrap text-gray-800 dark:text-gray-200" style={{ color: 'var(--cor-texto-principal)' }}>
                        {selectedReclamacao.motivoDetalhado}
                      </p>
                    </div>
                  </div>
                )}

                {/* Observações */}
                {selectedReclamacao.observacoes && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300" style={{ color: 'var(--cor-texto-principal)' }}>
                      Observações
                    </h3>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-base whitespace-pre-wrap text-gray-800 dark:text-gray-200" style={{ color: 'var(--cor-texto-principal)' }}>
                        {selectedReclamacao.observacoes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinhasReclamacoes;
