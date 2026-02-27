/**
 * Teste: mostrar exemplo de documento gerado
 */

const path = require('path');
const XLSX = require('xlsx');
const fs = require('fs');

const XLSX_PATH = path.join(__dirname, '../../../update bacen/Copy of Ação Bacen e Ouvidoria.xlsx');
const ABA_NOME = 'Base Bacen 2025';

// Copiar funções necessárias do script principal
function parseData(data) {
  if (!data) return null;
  if (data instanceof Date) return data;
  if (typeof data === 'number') {
    if (data > 45000 && data < 50000) {
      const excelEpoch = new Date(1900, 0, 1);
      const days = data - 2;
      const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
      if (date.getFullYear() >= 2020 && date.getFullYear() <= 2030) {
        return date;
      }
    }
    return null;
  }
  const str = String(data).trim();
  if (!str) return null;
  const partes = str.split('/');
  if (partes.length === 3) {
    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const ano = parseInt(partes[2], 10);
    if (!isNaN(dia) && !isNaN(mes) && !isNaN(ano) && ano >= 2020 && ano <= 2030) {
      return new Date(ano, mes, dia);
    }
  }
  const dateObj = new Date(data);
  if (!isNaN(dateObj.getTime()) && dateObj.getFullYear() >= 2020 && dateObj.getFullYear() <= 2030) {
    return dateObj;
  }
  return null;
}

function normalizarCPF(cpf) {
  if (!cpf) return '';
  const apenasNumeros = String(cpf).replace(/\D/g, '');
  return apenasNumeros.length === 11 ? apenasNumeros : '';
}

const workbook = XLSX.readFile(XLSX_PATH);
const sheetName = workbook.SheetNames.find(name => name.toLowerCase() === ABA_NOME.toLowerCase());
const worksheet = workbook.Sheets[sheetName];
const range = XLSX.utils.decode_range(worksheet['!ref']);

// Ler primeira linha de dados (linha 1, índice 1)
const lerColuna = (indice) => {
  const cell = worksheet[XLSX.utils.encode_cell({ r: 1, c: indice })];
  return cell ? (cell.w || cell.v) : '';
};

console.log('📋 EXEMPLO DE MAPEAMENTO - PRIMEIRA LINHA:\n');
console.log('Coluna | Valor');
console.log('-'.repeat(80));
console.log(`A (CPF Tratado)     | ${lerColuna(0)}`);
console.log(`B (Data entrada)    | ${lerColuna(1)} → ${parseData(lerColuna(1))?.toLocaleDateString('pt-BR') || 'null'}`);
console.log(`C (Finalizado em)   | ${lerColuna(2)} → ${parseData(lerColuna(2))?.toLocaleDateString('pt-BR') || 'null'}`);
console.log(`D (Enviar cobrança) | ${lerColuna(3)}`);
console.log(`E (Responsável)     | ${lerColuna(4)}`);
console.log(`F (Nome completo)   | ${lerColuna(5)}`);
console.log(`G (CPF)             | ${lerColuna(6)} → ${normalizarCPF(lerColuna(6))}`);
console.log(`H (Origem)          | ${lerColuna(7)}`);
console.log(`I (Motivo reduzido) | ${lerColuna(8)}`);
console.log(`J (Motivo Reclamação) | ${lerColuna(9)?.substring(0, 50)}...`);
console.log(`K (Prazo Bacen)     | ${lerColuna(10)}`);
console.log(`L (Telefone)        | ${lerColuna(11)}`);
console.log(`M (1ª tentativa)    | ${lerColuna(12)}`);
console.log(`N (2ª tentativa)    | ${lerColuna(13)}`);
console.log(`O (3ª tentativa)    | ${lerColuna(14)}`);
console.log(`P (Acionou central) | ${lerColuna(15)}`);
console.log(`Q (N2 Portabilidade) | ${lerColuna(16)}`);
console.log(`R (Reclame Aqui)    | ${lerColuna(17)}`);
console.log(`S (Bacen?)          | ${lerColuna(18)}`);
console.log(`T (Procon?)         | ${lerColuna(19)}`);
console.log(`U (Protocolos)      | ${lerColuna(20)?.substring(0, 50)}...`);
console.log(`V (PIX liberado)   | ${lerColuna(21)}`);
console.log(`W (Aceitou liquidação) | ${lerColuna(22)}`);
console.log(`X (Observações)     | ${lerColuna(23)?.substring(0, 50)}...`);

console.log('\n✅ Mapeamento verificado!');
