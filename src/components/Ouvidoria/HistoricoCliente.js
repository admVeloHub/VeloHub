/**
 * VeloHub V3 - Histórico Cliente Component
 * VERSION: v1.4.0 | DATE: 2026-02-20 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v1.4.0:
 * - Adicionada máscara progressiva de CPF no campo de busca
 * - Máscara aplicada durante digitação (000.000.000-00)
 * 
 * Mudanças v1.3.0:
 * - Removido ícone do título "Buscar Cliente"
 * - Botão atualizar movido para parte superior junto ao título
 * - Botão buscar adequado ao padrão do projeto (estilo EscalacoesPage)
 * 
 * Mudanças v1.2.0:
 * - Botão atualizar adicionado junto ao botão buscar cliente
 * 
 * Mudanças v1.1.0:
 * - Containers padronizados com classes velohub-card conforme LAYOUT_GUIDELINES.md
 * 
 * Componente para busca e exibição de histórico de cliente por CPF
 */

import React from 'react';

const HistoricoCliente = ({ searchCpf, setSearchCpf, searchResults, searchLoading, onSearch, onRefresh }) => {
  /**
   * Formatar CPF com máscara progressiva
   */
  const formatCPF = (value) => {
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
  const formatCPFDisplay = (cpf) => {
    if (!cpf) return '';
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
   * Handle Enter key
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div>
      {/* Título e Botão Atualizar */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold velohub-title" style={{ color: 'var(--blue-dark)' }}>
          Buscar Cliente
        </h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={false}
            className="text-sm px-3 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700"
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
            title="Atualizar Dashboard"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Atualizar
          </button>
        )}
      </div>

      {/* Campo de Busca */}
      <div className="mb-4">
        <input
          type="text"
          value={searchCpf}
          onChange={(e) => {
            const formatted = formatCPF(e.target.value);
            setSearchCpf(formatted);
          }}
          onKeyPress={handleKeyPress}
          placeholder="CPF (000.000.000-00)"
          className="velohub-input w-full mb-2"
          maxLength={14}
        />
        <button
          onClick={onSearch}
          disabled={searchLoading}
          className="text-sm px-3 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700 w-full justify-center"
          style={{
            borderColor: '#006AB9',
            color: '#006AB9',
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            if (!searchLoading) {
              e.target.style.background = 'linear-gradient(135deg, #006AB9 0%, #006AB9 100%)';
              e.target.style.color = '#F3F7FC';
              e.target.style.borderColor = '#006AB9';
            }
          }}
          onMouseLeave={(e) => {
            if (!searchLoading) {
              e.target.style.background = 'transparent';
              e.target.style.color = '#006AB9';
              e.target.style.borderColor = '#006AB9';
            }
          }}
        >
          {searchLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Buscando...
            </>
          ) : (
            'Buscar'
          )}
        </button>
      </div>

      {/* Resultados */}
      {searchResults.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--blue-dark)' }}>
            Histórico ({searchResults.length})
          </h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {searchResults.map((item, index) => (
              <div
                key={index}
                className="velohub-card p-3 hover:-translate-y-0.5 transition-transform cursor-pointer"
                style={{ borderLeft: '3px solid var(--blue-opaque)' }}
              >
                <div className="text-sm font-medium mb-1" style={{ color: 'var(--blue-dark)' }}>
                  {item.tipo || 'Reclamação'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Data: {formatDate(item.dataEntrada || item.createdAt)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Status: {item.Finalizado?.Resolvido === true ? 'Resolvido' : 'Em Andamento'}
                </div>
                {item.motivoReduzido && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Motivo: {item.motivoReduzido}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {searchResults.length === 0 && searchCpf && !searchLoading && (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          Nenhuma reclamação encontrada
        </div>
      )}
    </div>
  );
};

export default HistoricoCliente;
