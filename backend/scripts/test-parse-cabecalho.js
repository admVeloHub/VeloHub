/**
 * Teste de parsing do cabeçalho Ouvidoria 2025
 * VERSION: v1.0.0 | DATE: 2026-02-24
 */

const linhaCabecalho = '"Data de entrada,Atendimento,Data Entrada N2,Finalizado em ,Enviar para cobranÃ§a?,ResponsÃ¡vel,Nome completo,CPF,Origem,Motivo reduzido,Motivo ReclamaÃ§Ã,BACEN"",N2 Portabilidade? ,Reclame Aqui,Bacen?,Procon? ,N2 conseguiu contato com cliente?,Protocolos Central (incluir todos),PIX liberado?,Aceitou liquidaÃ§Ã£o Antecipada?,ObservaÃ§Ãµes,MÃªs,Casos crÃ­ticos,Valor negociado£o,Telefone,1Âª tentativa,2Âª tentativa,3Âª tentativa (BACEN),""Acionou a central?,Mesmo motivo,";';

console.log('=== CABEÇALHO ORIGINAL ===');
console.log(linhaCabecalho.substring(0, 200));
console.log('\n');

// Remover aspas externas
let cabecalhoLimpo = linhaCabecalho;
if (cabecalhoLimpo.startsWith('"') && cabecalhoLimpo.endsWith('"')) {
  const conteudoSemAspas = cabecalhoLimpo.slice(1, -1);
  if (conteudoSemAspas.includes(',')) {
    cabecalhoLimpo = conteudoSemAspas;
  }
}

// Remover ponto e vírgula no final
cabecalhoLimpo = cabecalhoLimpo.replace(/;+$/, '');

console.log('=== APÓS REMOVER ASPAS EXTERNAS ===');
console.log(cabecalhoLimpo.substring(0, 200));
console.log('\n');

// Corrigir aspas mal fechadas
cabecalhoLimpo = cabecalhoLimpo.replace(/,""/g, ',"');
cabecalhoLimpo = cabecalhoLimpo.replace(/""([,;])/g, '"$1');
cabecalhoLimpo = cabecalhoLimpo.replace(/""([^,])/g, '"$1');

console.log('=== APÓS CORRIGIR ASPAS ===');
console.log(cabecalhoLimpo.substring(0, 200));
console.log('\n');

// Parsear manualmente
function parseCSVLine(line) {
  const valores = [];
  let valorAtual = '';
  let dentroAspas = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const proxChar = line[i + 1];
    const charDepois = line[i + 2];
    
    if (char === '"') {
      if (dentroAspas && proxChar === '"' && charDepois === ',') {
        valores.push(valorAtual.trim());
        valorAtual = '';
        dentroAspas = false;
        i += 2;
        continue;
      } else if (dentroAspas && proxChar === '"') {
        valorAtual += '"';
        i++;
      } else {
        dentroAspas = !dentroAspas;
      }
    } else if (char === ',' && !dentroAspas) {
      valores.push(valorAtual.trim());
      valorAtual = '';
    } else {
      valorAtual += char;
    }
  }
  
  valores.push(valorAtual.trim());
  return valores;
}

const campos = parseCSVLine(cabecalhoLimpo);
console.log(`Total de campos: ${campos.length}\n`);

campos.forEach((campo, idx) => {
  const campoLimpo = campo.replace(/^"|"$/g, '').trim();
  console.log(`${idx}. "${campoLimpo.substring(0, 50)}"`);
});
