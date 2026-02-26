/**
 * VeloHub V3 - RelatoriosOuvidoria Component
 * VERSION: v1.5.0 | DATE: 2025-02-20 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v1.5.0:
 * - Removido campo status dos filtros (usar Finalizado.Resolvido)
 * - Removido campo mes da exportação
 * - Atualizado status na exportação para usar Finalizado.Resolvido
 * 
 * Mudanças v1.4.0:
 * - Implementada exportação do relatório em formato XLSX
 * - Exportação inclui múltiplas planilhas: Reclamações, Resumo por Tipo, Resumo por Status, Estatísticas
 * - Formatação adequada de CPF e datas na exportação
 * 
 * Mudanças v1.3.1:
 * - Corrigido uso de toast.info() para toast() com ícone (react-hot-toast não possui método info)
 * 
 * Mudanças v1.3.0:
 * - Botão "Gerar Relatório" reposicionado junto ao cabeçalho "Filtros do Relatório"
 * - Botão "Exportar" também posicionado junto ao cabeçalho quando disponível
 * 
 * Mudanças v1.2.0:
 * - Removido header com gradiente e ícone
 * - Adequadas fontes conforme padrão do projeto (text-sm para labels, text-xs para textos secundários)
 * - Botões adequados ao padrão do projeto
 * - Campos de preenchimento adequados ao padrão do Req_Prod
 * - Cards de resultado com padrão de container secundário
 * 
 * Mudanças v1.1.0:
 * - Containers padronizados com classes velohub-card conforme LAYOUT_GUIDELINES.md
 * 
 * Componente para geração de relatórios do módulo de Ouvidoria
 */

import React, { useState } from 'react';
import { relatoriosAPI } from '../../services/ouvidoriaApi';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const RelatoriosOuvidoria = () => {
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    tipo: '',
  });
  const [loading, setLoading] = useState(false);
  const [relatorio, setRelatorio] = useState(null);

  /**
   * Gerar relatório
   */
  const gerarRelatorio = async () => {
    if (!filtros.dataInicio || !filtros.dataFim) {
      toast.error('Por favor, selecione o período');
      return;
    }

    setLoading(true);
    try {
      const resultado = await relatoriosAPI.gerar(filtros);
      setRelatorio(resultado.data || resultado);
      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formatar CPF para exibição
   */
  const formatCPF = (cpf) => {
    if (!cpf) return '-';
    const cleaned = String(cpf).replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  };

  /**
   * Formatar data para exibição
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
   * Exportar relatório para XLSX
   */
  const exportarRelatorio = () => {
    if (!relatorio) {
      toast.error('Gere um relatório primeiro');
      return;
    }

    try {
      // Criar novo workbook
      const wb = XLSX.utils.book_new();

      // Planilha 1: Dados das Reclamações
      const dadosReclamacoes = (relatorio.reclamacoes || []).map((r, index) => ({
        '#': index + 1,
        'Nome': r.nome || '-',
        'CPF': r.cpf || '-',
        'Tipo': r.tipo || '-',
        'Status': r.Finalizado?.Resolvido === true ? 'Resolvido' : 'Em Andamento',
        'Data Entrada': r.dataEntrada ? formatDate(r.dataEntrada) : (r.dataEntradaAtendimento ? formatDate(r.dataEntradaAtendimento) : (r.createdAt ? formatDate(r.createdAt) : '-')),
        'Motivo': r.motivoReduzido || '-',
        'Responsável': r.responsavel || '-',
      }));

      const wsReclamacoes = XLSX.utils.json_to_sheet(dadosReclamacoes);
      XLSX.utils.book_append_sheet(wb, wsReclamacoes, 'Reclamações');

      // Planilha 2: Resumo por Tipo
      const resumoTipo = Object.entries(relatorio.porTipo || {}).map(([tipo, quantidade]) => ({
        'Tipo': tipo,
        'Quantidade': quantidade,
      }));
      if (resumoTipo.length > 0) {
        const wsTipo = XLSX.utils.json_to_sheet(resumoTipo);
        XLSX.utils.book_append_sheet(wb, wsTipo, 'Resumo por Tipo');
      }

      // Planilha 3: Resumo por Status (baseado em Finalizado.Resolvido)
      const resumoStatus = Object.entries(relatorio.porStatus || {}).map(([status, quantidade]) => ({
        'Status': status,
        'Quantidade': quantidade,
      }));
      if (resumoStatus.length > 0) {
        const wsStatus = XLSX.utils.json_to_sheet(resumoStatus);
        XLSX.utils.book_append_sheet(wb, wsStatus, 'Resumo por Status');
      }

      // Planilha 5: Estatísticas Gerais
      const estatisticas = [
        { 'Métrica': 'Período Início', 'Valor': relatorio.periodo?.inicio || '-' },
        { 'Métrica': 'Período Fim', 'Valor': relatorio.periodo?.fim || '-' },
        { 'Métrica': 'Total de Reclamações', 'Valor': relatorio.total || 0 },
        { 'Métrica': 'Concluídas', 'Valor': relatorio.concluidas || 0 },
        { 'Métrica': 'Taxa de Resolução (%)', 'Valor': relatorio.taxaResolucao || 0 },
      ];
      const wsEstatisticas = XLSX.utils.json_to_sheet(estatisticas);
      XLSX.utils.book_append_sheet(wb, wsEstatisticas, 'Estatísticas');

      // Gerar nome do arquivo com data
      const dataAtual = new Date().toISOString().slice(0, 10);
      const nomeArquivo = `relatorio_ouvidoria_${dataAtual}.xlsx`;

      // Escrever arquivo e fazer download
      XLSX.writeFile(wb, nomeArquivo);

      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast.error('Erro ao exportar relatório');
    }
  };

  return (
    <div>
      {/* Filtros */}
      <div className="velohub-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold velohub-title">Filtros do Relatório</h3>
          <div className="flex gap-4">
            <button
              onClick={gerarRelatorio}
              disabled={loading}
              className="text-sm px-3 py-2 rounded border inline-flex items-center gap-2 transition-all duration-300 dark:bg-gray-700"
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
                  Gerando...
                </>
              ) : (
                'Gerar Relatório'
              )}
            </button>
            {relatorio && (
              <button
                onClick={exportarRelatorio}
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
              >
                Exportar
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Data Início *
            </label>
            <input
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Data Fim *
            </label>
            <input
              type="date"
              value={filtros.dataFim}
              onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Tipo
            </label>
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
              className="w-full border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Todos</option>
              <option value="BACEN">BACEN</option>
              <option value="N2">N2</option>
              <option value="RA-PROCON">RA-PROCON</option>
            </select>
          </div>

        </div>
      </div>

      {/* Resultado do Relatório */}
      {relatorio && (
        <div className="velohub-card">
          <h3 className="text-xl font-semibold mb-4 velohub-title">Resultado do Relatório</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center border" style={{ borderColor: '#000058' }}>
              <div className="text-xs text-gray-600 dark:text-gray-400">Total de Reclamações</div>
              <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                {relatorio.total || 0}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center border" style={{ borderColor: '#000058' }}>
              <div className="text-xs text-gray-600 dark:text-gray-400">Concluídas</div>
              <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                {relatorio.concluidas || 0}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-center border" style={{ borderColor: '#000058' }}>
              <div className="text-xs text-gray-600 dark:text-gray-400">Taxa de Resolução</div>
              <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                {relatorio.taxaResolucao || 0}%
              </div>
            </div>
          </div>

          {/* Gráficos e tabelas podem ser adicionados aqui */}
          <div className="text-center py-8 text-xs text-gray-600 dark:text-gray-400">
            Visualização detalhada do relatório em desenvolvimento
          </div>
        </div>
      )}
    </div>
  );
};

export default RelatoriosOuvidoria;
