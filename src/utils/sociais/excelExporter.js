/**
 * VeloHub V3 - Excel Exporter (Sociais)
 * VERSION: v1.0.0 | DATE: 2026-03-17 | AUTHOR: VeloHub Development Team
 */

import * as XLSX from 'xlsx';

const formatDateForExcel = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return '';
  }
};

export const exportFeedToExcel = (data, filters = {}, filename = null) => {
  try {
    if (!data || data.length === 0) {
      return { success: false, error: 'Nenhum dado disponível' };
    }
    const excelData = data.map((item, index) => ({
      'Nº': index + 1,
      'Data/Hora': formatDateForExcel(item.createdAt),
      'Rede Social': item.socialNetwork || 'N/A',
      'Cliente': item.clientName || 'N/A',
      'Mensagem': item.messageText || '',
      'Motivo': item.contactReason || 'N/A',
      'Sentimento': item.sentiment || 'N/A',
      'Avaliação': item.rating ? `${item.rating}⭐` : 'N/A',
      'Direcionado para Central': item.directedCenter ? 'Sim' : 'Não',
      'Link': item.link || ''
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [
      { wch: 5 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 50 },
      { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 25 }, { wch: 40 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Tabulações');
    const filterInfo = [
      ['Informações da Exportação'], [''],
      ['Data da Exportação:', new Date().toLocaleString('pt-BR')],
      ['Total de Registros:', data.length], [''],
      ['Filtros Aplicados:'],
      ['Rede Social:', filters.socialNetwork || 'Todas'],
      ['Motivo:', filters.contactReason || 'Todos'],
      ['Sentimento:', filters.sentiment || 'Todos'],
      ['Data Inicial:', filters.dateFrom || 'Não especificada'],
      ['Data Final:', filters.dateTo || 'Não especificada'],
      ['Palavra-Chave:', filters.keyword || 'Nenhuma']
    ];
    const wsInfo = XLSX.utils.aoa_to_sheet(filterInfo);
    wsInfo['!cols'] = [{ wch: 25 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Informações');
    const fileName = filename || `tabulacoes_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    return { success: true, filename: fileName };
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
    return { success: false, error: error.message };
  }
};
