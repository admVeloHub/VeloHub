/**
 * Utilitários para Parser CSV
 * VERSION: v1.0.0 | DATE: 2026-02-24 | AUTHOR: VeloHub Development Team
 * 
 * Funções auxiliares compartilhadas para processamento de arquivos CSV
 */

const fs = require('fs');

/**
 * Parser CSV simples que lida com campos entre aspas
 */
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
        // Caso especial: "" seguido de vírgula = fim do campo com aspas
        // Isso acontece em cabeçalhos como: "1ª tentativa"",Aceitou
        valores.push(valorAtual.trim());
        valorAtual = '';
        dentroAspas = false;
        i += 2; // Pular "" e vírgula
        continue;
      } else if (dentroAspas && proxChar === '"') {
        // Aspas duplas dentro de campo = aspas literal
        valorAtual += '"';
        i++; // Pular próxima aspas
      } else {
        // Toggle dentroAspas
        dentroAspas = !dentroAspas;
      }
    } else if (char === ',' && !dentroAspas) {
      // Vírgula fora de aspas = separador de campo
      valores.push(valorAtual.trim());
      valorAtual = '';
    } else {
      valorAtual += char;
    }
  }
  
  // Adicionar último valor
  valores.push(valorAtual.trim());
  
  return valores;
}

/**
 * Ler arquivo CSV e converter para array de objetos
 * Lida com campos que contêm quebras de linha dentro de aspas
 */
function parseCSVFile(caminhoArquivo) {
  if (!fs.existsSync(caminhoArquivo)) {
    throw new Error(`Arquivo não encontrado: ${caminhoArquivo}`);
  }
  
  // Tentar diferentes encodings
  let conteudo;
  try {
    // Primeiro tentar UTF-8
    conteudo = fs.readFileSync(caminhoArquivo, 'utf8');
    // Se tiver caracteres estranhos como Ã§, tentar Windows-1252
    if (conteudo.includes('Ã§') || conteudo.includes('Ã£') || conteudo.includes('Ã¡')) {
      conteudo = fs.readFileSync(caminhoArquivo, 'latin1');
    }
  } catch (error) {
    // Fallback para latin1 (Windows-1252)
    conteudo = fs.readFileSync(caminhoArquivo, 'latin1');
  }
  
  // Processar CSV considerando aspas e quebras de linha
  // Google Docs exporta com aspas externas, precisamos tratar isso corretamente
  // Campos com múltiplas linhas dentro de aspas precisam ser tratados como uma única linha
  const linhas = [];
  let linhaAtual = '';
  let dentroAspas = false;
  let contadorAspas = 0;
  
  for (let i = 0; i < conteudo.length; i++) {
    const char = conteudo[i];
    const proxChar = conteudo[i + 1];
    
    if (char === '"') {
      if (dentroAspas && proxChar === '"') {
        // Aspas duplas dentro de campo = aspas literal
        linhaAtual += '"';
        i++; // Pular próxima aspas
      } else {
        // Toggle dentroAspas
        dentroAspas = !dentroAspas;
        linhaAtual += char;
        // Contar aspas para detectar padrões
        if (dentroAspas) {
          contadorAspas++;
        } else {
          contadorAspas--;
        }
      }
    } else if ((char === '\n' || char === '\r') && !dentroAspas) {
      // Quebra de linha fora de aspas = fim de linha CSV
      // Mas verificar se a linha anterior terminou corretamente
      if (linhaAtual.trim() !== '' && linhaAtual.trim() !== ';') {
        // Verificar se a linha termina com aspas fechadas (pode ser aspas externa do Google Docs)
        const linhaTrim = linhaAtual.trim();
        if (linhaTrim.startsWith('"') && linhaTrim.endsWith('"')) {
          // Pode ser aspas externa - verificar se há vírgulas dentro
          const semAspas = linhaTrim.slice(1, -1);
          if (semAspas.includes(',')) {
            // É uma linha completa dentro de aspas - manter como está
            linhas.push(linhaAtual);
          } else {
            // Campo único dentro de aspas - manter também
            linhas.push(linhaAtual);
          }
        } else {
          linhas.push(linhaAtual);
        }
      }
      linhaAtual = '';
      dentroAspas = false;
      contadorAspas = 0;
      // Pular \r\n
      if (char === '\r' && proxChar === '\n') {
        i++;
      }
    } else {
      // Qualquer outro caractere - adicionar à linha atual
      // Se estamos dentro de aspas, quebras de linha são parte do campo
      linhaAtual += char;
    }
  }
  
  // Adicionar última linha se houver
  if (linhaAtual.trim() !== '' && linhaAtual.trim() !== ';') {
    linhas.push(linhaAtual);
  }
  
  if (linhas.length < 2) {
    return [];
  }
  
  // Pré-processamento: dividir linhas que contêm múltiplos registros concatenados
  // Padrão comum: registros separados por ";;;;;;" ou múltiplos ";" seguidos
  const linhasDivididas = [];
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    
    // Verificar se a linha contém múltiplos registros (padrão: ";;;;;;" ou ";" repetido várias vezes)
    // Mas só dividir se não estiver dentro de aspas
    const padraoMultiploRegistro = /";{4,}/g;
    const matches = [...linha.matchAll(padraoMultiploRegistro)];
    
    if (matches.length > 0) {
      // Dividir a linha nos pontos onde há múltiplos ponto-e-vírgula
      let ultimoIndice = 0;
      for (const match of matches) {
        const indice = match.index;
        // Extrair registro antes do separador
        const registroAntes = linha.substring(ultimoIndice, indice + 1).trim();
        if (registroAntes && registroAntes !== ';') {
          linhasDivididas.push(registroAntes);
        }
        // Encontrar início do próximo registro (após os ;)
        ultimoIndice = indice + match[0].length;
        // Pular espaços e quebras
        while (ultimoIndice < linha.length && (linha[ultimoIndice] === ';' || linha[ultimoIndice] === ' ')) {
          ultimoIndice++;
        }
      }
      // Adicionar último registro se houver
      const registroFinal = linha.substring(ultimoIndice).trim();
      if (registroFinal && registroFinal !== ';') {
        linhasDivididas.push(registroFinal);
      }
    } else {
      // Linha normal, adicionar como está
      linhasDivididas.push(linha);
    }
  }
  
  // Substituir linhas originais pelas divididas
  linhas.length = 0;
  linhas.push(...linhasDivididas);
  
  // Pós-processamento adicional: detectar e corrigir linhas mal parseadas
  // Se uma linha tem muitos campos mas o primeiro campo contém vírgulas (dados concatenados),
  // pode ser que a linha anterior não terminou corretamente
  const linhasCorrigidas = [];
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (!linha || linha === ';') continue;
    
    // Verificar se o primeiro campo parece conter dados concatenados (muitas vírgulas)
    const primeiroCampo = linha.split(',')[0];
    if (primeiroCampo && primeiroCampo.includes(',') && i > 0) {
      // Pode ser continuação da linha anterior
      const linhaAnterior = linhasCorrigidas[linhasCorrigidas.length - 1];
      if (linhaAnterior) {
        // Tentar juntar
        linhasCorrigidas[linhasCorrigidas.length - 1] = linhaAnterior + ' ' + linha;
        continue;
      }
    }
    
    linhasCorrigidas.push(linhas[i]);
  }
  
  // Substituir novamente
  linhas.length = 0;
  linhas.push(...linhasCorrigidas);
  
  // Pós-processamento: juntar linhas que são continuações de registros anteriores
  // Linhas que começam com vírgula são sempre continuações
  // Linhas que não começam com CPF/data mas a anterior parece incompleta também são continuações
  const linhasProcessadas = [];
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    
    // Pular linhas vazias ou apenas com ponto e vírgula
    if (!linha || linha === ';' || /^;+$/.test(linha)) {
      continue;
    }
    
    // Se a linha começa com vírgula (após remover aspas iniciais), é continuação
    const linhaSemAspasInicio = linha.replace(/^"+/, '');
    const comecaComVirgula = linhaSemAspasInicio.startsWith(',');
    
    // Verificar se parece ser um registro válido (começa com CPF de 11 dígitos ou data DD/MM/YYYY)
    const primeiroCampo = linhaSemAspasInicio.split(',')[0].trim();
    const primeiroCampoSemAspas = primeiroCampo.replace(/^"|"$/g, '');
    const cpfMatch = primeiroCampoSemAspas.match(/^\d{11}$/);
    const dataMatch = primeiroCampoSemAspas.match(/^\d{2}\/\d{2}\/\d{4}/);
    const pareceRegistro = cpfMatch || dataMatch;
    
    if (i > 0 && comecaComVirgula) {
      // Sempre é continuação quando começa com vírgula
      const linhaAnterior = linhasProcessadas[linhasProcessadas.length - 1];
      if (linhaAnterior) {
        const linhaAnt = linhaAnterior.trim();
        // Remover aspas finais da linha anterior se houver (mas manter aspas duplas)
        let linhaAntLimpa = linhaAnt;
        if (linhaAntLimpa.endsWith('"') && !linhaAntLimpa.endsWith('""')) {
          linhaAntLimpa = linhaAntLimpa.slice(0, -1);
        }
        // Juntar diretamente (a vírgula já está na linha atual)
        linhasProcessadas[linhasProcessadas.length - 1] = linhaAntLimpa + linhaSemAspasInicio;
        continue;
      }
    } else if (i > 0 && !pareceRegistro) {
      // Não começa com vírgula e não parece registro - pode ser continuação de texto
      const linhaAnterior = linhasProcessadas[linhasProcessadas.length - 1];
      if (linhaAnterior) {
        const linhaAnt = linhaAnterior.trim();
        const camposAnt = parseCSVLine(linhaAnt);
        
        // Se a linha anterior tem poucos campos (< 25) OU termina com aspas não fechadas, está incompleta
        const terminaComAspasAbertas = linhaAnt.startsWith('"') && !linhaAnt.endsWith('"') && !linhaAnt.endsWith('""');
        if ((camposAnt.length < 25 || terminaComAspasAbertas) && camposAnt.length > 0) {
          // Remover aspas finais da linha anterior se houver
          let linhaAntLimpa = linhaAnt;
          if (linhaAntLimpa.endsWith('"') && !linhaAntLimpa.endsWith('""')) {
            linhaAntLimpa = linhaAntLimpa.slice(0, -1);
          }
          // Juntar com espaço
          linhasProcessadas[linhasProcessadas.length - 1] = linhaAntLimpa + ' ' + linhaSemAspasInicio;
          continue;
        }
      }
    }
    
    linhasProcessadas.push(linhas[i]);
  }
  
  // Substituir linhas originais pelas processadas
  linhas.length = 0;
  linhas.push(...linhasProcessadas);
  
  // CSV: A primeira linha (A1) contém TODOS os cabeçalhos separados por vírgulas em UMA célula
  // As linhas seguintes têm os dados na MESMA ORDEM dos cabeçalhos
  let linhaCabecalho = linhas[0];
  let inicioDados = 1;
  
  // Verificar se a primeira linha é realmente um cabeçalho ou uma linha de dados
  // Se começa com CPF de 11 dígitos ou data, é uma linha de dados, não cabeçalho
  const primeiraLinhaSemAspas = linhaCabecalho.replace(/^"+/, '').replace(/"+$/, '');
  const primeiroCampoPrimeiraLinha = primeiraLinhaSemAspas.split(',')[0].trim();
  const primeiroCampoSemAspas = primeiroCampoPrimeiraLinha.replace(/^"|"$/g, '');
  const pareceCPF = primeiroCampoSemAspas.match(/^\d{11}$/);
  const pareceData = primeiroCampoSemAspas.match(/^\d{2}\/\d{2}\/\d{4}/);
  
  // Se a primeira linha começa com CPF ou data, não é cabeçalho - usar cabeçalho fixo
  if (pareceCPF || pareceData) {
    const nomeArquivo = caminhoArquivo.toLowerCase();
    if (nomeArquivo.includes('bacen') && nomeArquivo.includes('2025')) {
      // Cabeçalho fixo para Bacen 2025 - ordem: CPF Tratado (0), Data entrada (1), ..., Nome completo (5), CPF (6)
      linhaCabecalho = 'CPF Tratado,Data entrada,Finalizado em ,Enviar para cobrança?,Responsável,Nome completo,CPF,Origem,Motivo reduzido,Motivo Reclamação,Prazo Bacen,Telefone,1ª tentativa,2ª tentativa,3ª tentativa,Acionou a central?,N2 Portabilidade? ,Reclame Aqui,Bacen?,Procon? ,Protocolos Central (incluir todos),PIX liberado ou excluído?,Aceitou liquidação Antecipada?,Observações,Mês,Casos críticos,Valor negociado';
      inicioDados = 0; // Começar da primeira linha (que são os dados)
    } else if (nomeArquivo.includes('bacen') && nomeArquivo.includes('2026')) {
      // Cabeçalho fixo para Bacen 2026
      linhaCabecalho = 'CPF Tratado,Data entrada,Finalizado em ,Enviar para cobrança?,Responsável,Nome completo,CPF,Produto,Origem,Motivo reduzido,Motivo Reclamação,Prazo Bacen,Telefone,1ª tentativa,2ª tentativa,3ª tentativa,Acionou a central?,N2 Portabilidade? ,Reclame Aqui,Bacen?,Procon? ,Protocolos Central (incluir todos),PIX liberado ou excluído?,Aceitou liquidação Antecipada?,Observações,Mês,Casos críticos,Valor negociado';
      inicioDados = 0;
    } else if (nomeArquivo.includes('ouvidoria') && nomeArquivo.includes('2025')) {
      // Cabeçalho fixo para Ouvidoria 2025 - ordem: Data de entrada (0), ..., Nome completo (5), CPF (6)
      linhaCabecalho = 'Data de entrada,Atendimento,Data Entrada N2,Finalizado em ,Enviar para cobrança?,Responsável,Nome completo,CPF,Origem,Motivo reduzido,Motivo Reclamação,Telefone,1ª tentativa,2ª tentativa,3ª tentativa (BACEN),Acionou a central? Mesmo motivo BACEN,N2 Portabilidade? ,Reclame Aqui,Bacen?,Procon? ,N2 conseguiu contato com cliente?,Protocolos Central (incluir todos),PIX liberado?,Aceitou liquidação Antecipada?,Observações,Mês,Casos críticos,Valor negociado';
      inicioDados = 0;
    } else if (nomeArquivo.includes('ouvidoria') && nomeArquivo.includes('2026')) {
      // Cabeçalho fixo para Ouvidoria 2026 (ignora campo numérico inicial)
      linhaCabecalho = 'Data de entrada,Atendimento,Data Entrada N2,Finalizado em ,Enviar para cobrança?,Responsável,Nome completo,CPF,Origem,Motivo reduzido,Motivo Reclamação,Telefone,1ª tentativa,2ª tentativa,3ª tentativa (BACEN),Acionou a central? Mesmo motivo BACEN,N2 Portabilidade? ,Reclame Aqui,Bacen?,Procon? ,N2 conseguiu contato com cliente?,Protocolos Central (incluir todos),PIX liberado?,Aceitou liquidação Antecipada?,Observações,Mês,Casos críticos,Valor negociado';
      inicioDados = 0;
    }
  } else {
    // A primeira linha É o cabeçalho - usar ela diretamente
    // Remover aspas externas se toda a linha estiver dentro de aspas
    if (linhaCabecalho.startsWith('"') && linhaCabecalho.endsWith('"')) {
      const conteudoSemAspas = linhaCabecalho.slice(1, -1);
      if (conteudoSemAspas.includes(',')) {
        linhaCabecalho = conteudoSemAspas;
      }
    }
    // Remover ponto e vírgula no final se houver
    linhaCabecalho = linhaCabecalho.replace(/;+$/, '');
    inicioDados = 1; // Dados começam na linha seguinte
  }
  
  // Verificar se o cabeçalho está em múltiplas linhas
  // No Ouvidoria 2025, o cabeçalho está em 3 linhas:
  // Linha 1: "Data de entrada,Atendimento,Data Entrada N2,Finalizado em ,Enviar para cobrança?,Responsável,Nome completo,CPF,Origem,Motivo reduzido,Motivo Reclamação,Telefone,1ª tentativa,2ª tentativa,3ª tentativa (BACEN),""Acionou a central? ";
  // Linha 2: Mesmo motivo ;
  // Linha 3: "BACEN"",N2 Portabilidade? ,Reclame Aqui,Bacen?,Procon? ,N2 conseguiu contato com cliente?,Protocolos Central (incluir todos),PIX liberado?,Aceitou liquidação Antecipada?,Observações,Mês,Casos críticos,Valor negociado";
  
  if (linhas.length > 2 && linhas[0].startsWith('"') && linhas[1].includes('Mesmo motivo') && linhas[2].includes('BACEN')) {
    // Remover aspas externas da primeira linha
    let linha1 = linhas[0].replace(/^"/, '').replace(/"$/, '').replace(/;$/, '');
    // A segunda linha é apenas "Mesmo motivo ;" - fazer parte do campo anterior
    let linha2 = linhas[1].trim().replace(/;$/, '');
    // A terceira linha começa com "BACEN"" e termina com "; - parsear corretamente
    let linha3 = linhas[2].replace(/^"/, '').replace(/"$/, '').replace(/;$/, '');
    
    // Combinar: a linha 2 completa o campo anterior, então juntamos linha1 (sem o último campo completo) + linha2 + vírgula + linha3
    // Mas na verdade, precisamos parsear linha1 primeiro para saber quantos campos tem
    const camposLinha1 = parseCSVLine(linha1);
    const ultimoCampoLinha1 = camposLinha1[camposLinha1.length - 1];
    
    // O último campo da linha1 é "Acionou a central? " e precisa ser completado com linha2
    camposLinha1[camposLinha1.length - 1] = ultimoCampoLinha1 + ' ' + linha2;
    
    // Agora parsear linha3 e adicionar os campos
    const camposLinha3 = parseCSVLine(linha3);
    
    // Combinar tudo
    linhaCabecalho = [...camposLinha1, ...camposLinha3].join(',');
    inicioDados = 3;
  } else if (linhas.length > 1 && linhas[0].startsWith('"') && linhas[1].includes('Mesmo motivo')) {
    // Caso de 2 linhas
    let linha1 = linhas[0].replace(/^"/, '').replace(/"$/, '');
    let linha2 = linhas[1].trim();
    linhaCabecalho = linha1 + ',' + linha2;
    inicioDados = 2;
  }
  
  // Remover caracteres estranhos no final (como ;;;;;;)
  linhaCabecalho = linhaCabecalho.replace(/;+$/, '');
  
  // CORREÇÃO CRÍTICA: Corrigir cabeçalho que começa com aspas mas não fecha corretamente
  // Padrão problemático: "Data de entrada,Atendimento,...BACEN"",N2 Portabilidade?
  // O problema é que há aspas no início mas o campo não fecha antes de BACEN""
  // Solução: Se começa com " mas não termina com ", remover aspas do início e corrigir fechamento
  if (linhaCabecalho.startsWith('"') && !linhaCabecalho.endsWith('"')) {
    // Remover aspas do início
    linhaCabecalho = linhaCabecalho.slice(1);
    // Corrigir fechamento mal feito: BACEN"" -> BACEN",
    linhaCabecalho = linhaCabecalho.replace(/BACEN""/g, 'BACEN",');
  } else if (linhaCabecalho.startsWith('"') && linhaCabecalho.endsWith('"')) {
    // Se está completamente dentro de aspas, remover ambas
    const conteudoSemAspas = linhaCabecalho.slice(1, -1);
    if (conteudoSemAspas.includes(',')) {
      linhaCabecalho = conteudoSemAspas;
      // Corrigir fechamento mal feito
      linhaCabecalho = linhaCabecalho.replace(/BACEN""/g, 'BACEN",');
    }
  }
  
  // Corrigir outros padrões de aspas mal fechadas
  linhaCabecalho = linhaCabecalho.replace(/,""/g, ',"');
  linhaCabecalho = linhaCabecalho.replace(/""([,;])/g, '"$1');
  
  // Parsear o cabeçalho respeitando aspas e vírgulas dentro de aspas
  let cabecalhosRaw = parseCSVLine(linhaCabecalho).map(h => {
    // Remover aspas externas e normalizar
    let header = h.replace(/^"|"$/g, '').trim();
    // Substituir quebras de linha e espaços múltiplos por espaço único
    header = header.replace(/\r\n/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    // Remover ponto e vírgula no final se houver
    header = header.replace(/;+$/, '');
    return header;
  });
  
  // Detectar se o primeiro campo tem múltiplos campos concatenados (problema comum quando cabeçalho está mal formatado)
  // Se o primeiro campo tem muitas vírgulas e contém nomes de campos conhecidos, tentar separar
  if (cabecalhosRaw.length > 0 && cabecalhosRaw[0].includes(',') && cabecalhosRaw[0].length > 50) {
    const primeiroCampo = cabecalhosRaw[0];
    // Tentar separar por vírgulas, mas respeitando aspas
    const camposSeparados = parseCSVLine(primeiroCampo);
    if (camposSeparados.length > 1) {
      // Substituir o primeiro campo pelos campos separados
      cabecalhosRaw = [...camposSeparados, ...cabecalhosRaw.slice(1)];
    }
  }
  
  // Normalizar headers - criar mapeamento para variações de encoding
  const cabecalhos = cabecalhosRaw.map(h => {
    // Normalizar espaços extras e caracteres especiais comuns
    return h.replace(/\s+/g, ' ').trim();
  });
  
  // Criar mapeamento de campos conhecidos para lidar com encoding
  const mapeamentoCampos = {
    'CPF Tratado': ['CPF Tratado', 'CPF Tratado'],
    'Nome completo': ['Nome completo', 'Nome completo', 'Nome'],
    'CPF': ['CPF'],
    'Data entrada': ['Data entrada', 'Data de entrada'],
    'Finalizado em ': ['Finalizado em ', 'Finalizado em'],
    'Enviar para cobrança?': ['Enviar para cobrança?', 'Enviar para cobranÃ§a?', 'Enviar para cobranca?'],
    'Responsável': ['Responsável', 'ResponsÃ¡vel', 'Responsavel'],
    'Telefone': ['Telefone'],
    'Observações': ['Observações', 'ObservaÃ§Ãµes', 'Observacoes'],
    'Motivo reduzido': ['Motivo reduzido'],
    'Motivo Reclamação': ['Motivo Reclamação', 'Motivo ReclamaÃ§Ã£o', 'Motivo Reclamacao'],
    'Prazo Bacen': ['Prazo Bacen'],
    '1ª tentativa': ['1ª tentativa', '1Âª tentativa', '1a tentativa'],
    '2ª tentativa': ['2ª tentativa', '2Âª tentativa', '2a tentativa'],
    '3ª tentativa': ['3ª tentativa', '3Âª tentativa', '3a tentativa'],
    'Acionou a central?': ['Acionou a central?'],
    'Protocolos Central (incluir todos)': ['Protocolos Central (incluir todos)'],
    'PIX liberado': ['PIX liberado', 'PIX liberado ou excluído?'],
    'Origem': ['Origem'],
    'Data Entrada N2': ['Data Entrada N2', 'Data de entrada\n Atendimento'],
    'Data de entrada\n Atendimento': ['Data de entrada\n Atendimento', 'Data Entrada N2']
  };
  
  // Processar linhas de dados (começar após o cabeçalho)
  const dados = [];
  for (let i = inicioDados; i < linhas.length; i++) {
    let linhaDados = linhas[i];
    
    // CORREÇÃO CRÍTICA: Algumas linhas têm padrão "campo"; texto adicional
    // Exemplo: "05864452939,...Chave Pix liberada"; Acordado com o cliente...
    // O texto após "; deve ser juntado ao último campo antes de parsear
    // Padrão: " termina com "; seguido de espaço e texto até vírgula ou fim
    // Substituir "; texto por "texto (juntando ao campo anterior)
    linhaDados = linhaDados.replace(/";\s+([^,;]+)(?=,|;|$)/g, ' $1"');
    
    // Remover caracteres estranhos no final (como ;;;;;;)
    linhaDados = linhaDados.replace(/;+$/, '');
    
    // Se a linha inteira está dentro de aspas (formato Google Docs), remover aspas externas
    if (linhaDados.startsWith('"') && linhaDados.endsWith('"')) {
      const conteudoSemAspas = linhaDados.slice(1, -1);
      // Se ainda tem vírgulas dentro, é uma linha completa dentro de aspas
      if (conteudoSemAspas.includes(',')) {
        linhaDados = conteudoSemAspas;
      }
    }
    
    // Parsear a linha respeitando aspas internas
    const valores = parseCSVLine(linhaDados);
    const objeto = {};
    
    // Criar objeto com acesso case-insensitive e normalizado
    // Se o primeiro campo do cabeçalho foi removido (número como "100078204"), também remover o primeiro valor
    let offsetValores = 0;
    if (valores.length > cabecalhos.length && valores.length > 0) {
      // Verificar se o primeiro valor é um número que corresponde ao campo removido
      const primeiroValor = valores[0].trim();
      if (/^\d+$/.test(primeiroValor) && primeiroValor.length >= 8) {
        offsetValores = 1; // Pular primeiro valor
      }
    }
    
    cabecalhos.forEach((cabecalho, index) => {
      const idxValor = index + offsetValores;
      let valor = valores[idxValor] || '';
      // Remover aspas externas e normalizar quebras de linha (mas manter espaços)
      valor = valor.replace(/^"|"$/g, '').replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim();
      objeto[cabecalho] = valor;
    });
    
    // Adicionar aliases para campos conhecidos (para lidar com encoding)
    Object.entries(mapeamentoCampos).forEach(([campoNormalizado, variacoes]) => {
      variacoes.forEach(variacao => {
        if (objeto[variacao] !== undefined && objeto[campoNormalizado] === undefined) {
          objeto[campoNormalizado] = objeto[variacao];
        }
      });
    });
    
    dados.push(objeto);
  }
  
  return dados;
}

/**
 * Converter data do formato brasileiro (DD/MM/YYYY) para Date
 */
function parseDataBR(dataStr) {
  if (!dataStr || dataStr.trim() === '') return null;
  
  // Tentar diferentes formatos
  const formatos = [
    /^(\d{2})\/(\d{2})\/(\d{4})$/,  // DD/MM/YYYY
    /^(\d{2})\/(\d{2})\/(\d{2})$/,   // DD/MM/YY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // D/M/YYYY
  ];
  
  for (const formato of formatos) {
    const match = dataStr.match(formato);
    if (match) {
      const dia = parseInt(match[1], 10);
      const mes = parseInt(match[2], 10) - 1; // Mês é 0-indexed
      const ano = match[3].length === 2 ? parseInt('20' + match[3], 10) : parseInt(match[3], 10);
      
      const data = new Date(ano, mes, dia);
      if (!isNaN(data.getTime())) {
        return data;
      }
    }
  }
  
  return null;
}

/**
 * Normalizar e validar CPF
 */
function normalizarCPF(cpf) {
  if (!cpf) return '';
  const cpfLimpo = String(cpf).replace(/\D/g, '');
  return cpfLimpo.length === 11 ? cpfLimpo : '';
}

/**
 * Normalizar telefone para formato esperado
 */
function normalizarTelefone(telefone) {
  if (!telefone || typeof telefone !== 'string') return '';
  const limpo = telefone.replace(/[^\d+]/g, '');
  if (limpo.startsWith('+')) return limpo;
  if (limpo.length === 11) {
    return `(${limpo.substring(0, 2)}) ${limpo.substring(2, 7)}-${limpo.substring(7)}`;
  } else if (limpo.length === 10) {
    return `(${limpo.substring(0, 2)}) ${limpo.substring(2, 6)}-${limpo.substring(6)}`;
  }
  return limpo;
}

/**
 * Converter telefone string para array de telefones
 */
function converterTelefones(telefone) {
  if (!telefone || telefone.trim() === '') return { lista: [] };
  const normalizado = normalizarTelefone(telefone);
  return { lista: normalizado ? [normalizado] : [] };
}

/**
 * Converter tentativas de contato do CSV
 */
function converterTentativas(tentativa1, tentativa2, tentativa3) {
  const lista = [];
  
  if (tentativa1 && tentativa1.trim() !== '') {
    const data1 = parseDataBR(tentativa1);
    lista.push({
      data: data1 || new Date(),
      meio: 'Telefone',
      resultado: ''
    });
  }
  
  if (tentativa2 && tentativa2.trim() !== '') {
    const data2 = parseDataBR(tentativa2);
    lista.push({
      data: data2 || new Date(),
      meio: 'Telefone',
      resultado: ''
    });
  }
  
  if (tentativa3 && tentativa3.trim() !== '') {
    const data3 = parseDataBR(tentativa3);
    lista.push({
      data: data3 || new Date(),
      meio: 'Telefone',
      resultado: ''
    });
  }
  
  return { lista };
}

/**
 * Normalizar string para comparação (remove acentos e converte para lowercase)
 */
function normalizarString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
    .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
    .trim();
}

/**
 * Buscar valor de campo no objeto, tentando diferentes variações (para lidar com encoding)
 */
function buscarCampo(objeto, variacoes) {
  if (!Array.isArray(variacoes)) {
    variacoes = [variacoes];
  }
  
  for (const variacao of variacoes) {
    // Tentar exato
    if (objeto[variacao] !== undefined && objeto[variacao] !== '') {
      return objeto[variacao];
    }
    
    // Tentar case-insensitive e normalizado
    const variacaoNormalizada = normalizarString(variacao);
    for (const [key, value] of Object.entries(objeto)) {
      const keyNormalizada = normalizarString(key);
      if (keyNormalizada === variacaoNormalizada && value !== '') {
        return value;
      }
      
      // Também tentar se a chave contém a variação (para casos como "Data de entrada\n Atendimento")
      if (keyNormalizada.includes(variacaoNormalizada) && value !== '') {
        return value;
      }
    }
  }
  
  return '';
}

/**
 * Converter boolean do CSV
 */
function converterBoolean(valor) {
  if (!valor) return false;
  const str = valor.toString().toUpperCase().trim();
  return str === 'TRUE' || str === 'SIM' || str === '1' || str === 'VERDADEIRO' || str === 'YES';
}

/**
 * Converter protocolos do CSV (string separada por vírgula)
 */
function converterProtocolos(protocolosStr) {
  if (!protocolosStr || protocolosStr.trim() === '') return [];
  return protocolosStr.split(',').map(p => p.trim()).filter(p => p !== '');
}

/**
 * Converter pixStatus do CSV
 */
function converterPixStatus(pixLiberadoStr) {
  if (!pixLiberadoStr) return 'Não aplicável';
  const pixLiberado = pixLiberadoStr.toString().toUpperCase().trim();
  if (pixLiberado === 'TRUE' || pixLiberado === 'SIM' || pixLiberado === '1') return 'Liberado';
  if (pixLiberado === 'FALSE' || pixLiberado === 'NÃO' || pixLiberado === '0') return 'Excluído';
  return 'Não aplicável';
}

module.exports = {
  parseCSVFile,
  parseCSVLine,
  parseDataBR,
  normalizarCPF,
  normalizarTelefone,
  converterTelefones,
  converterTentativas,
  converterBoolean,
  converterProtocolos,
  converterPixStatus,
  buscarCampo
};
