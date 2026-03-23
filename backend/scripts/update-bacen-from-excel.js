/**
 * Script de Atualização: Base Bacen (XLSX) → MongoDB reclamacoes_bacen
 * VERSION: v1.5.0 | DATE: 2026-03-23 | AUTHOR: VeloHub Development Team
 *
 * Mudanças v1.5.0:
 * - motivoReduzido via utils/motivoReduzidoNormalize.js (renomeações + sentence case pt-BR)
 *
 * Mudanças v1.4.0:
 * - CORRIGIDO: Função converterPixLiberado() melhorada para aceitar boolean, número, string e null/undefined
 * - Agora processa corretamente valores da coluna W (pixLiberado) da planilha Excel
 * - Suporta valores booleanos diretos, números (1/0), strings ("SIM", "NÃO", "LIBERADO", etc.)
 * 
 * Mudanças v1.3.0:
 * - CORRIGIDO: motivoReduzido agora é sempre salvo como Array [String] (conforme schema atualizado)
 * - Adicionada função converterMotivoReduzido() para converter string em array
 * - Mantida normalização "Chave Pix" → "Liberação Chave Pix" em cada elemento do array
 * 
 * Mudanças v1.2.0:
 * - Adicionada função normalizarMotivoReduzido() para converter "Chave Pix" → "Liberação Chave Pix"
 * 
 * Mudanças v1.1.0:
 * - Adicionada função normalizarNome() para converter nomes para primeira maiúscula (title case)
 * - Nomes agora são normalizados respeitando preposições e artigos em português
 * 
 * Mudanças v1.0.0:
 * 
 * Mapeamento de colunas Excel → Schema MongoDB:
 * - Coluna F → nome
 * - Coluna G → cpf
 * - Coluna M → telefones.lista
 * - Coluna Y → observacoes
 * - Coluna E → responsavel
 * - Coluna B → dataEntrada (e createdAt)
 * - Coluna I → origem
 * - Coluna H → produto
 * - Coluna L → prazoBacen
 * - Coluna J → motivoReduzido
 * - Coluna K → motivoDetalhado
 * - Colunas N, O, P → tentativasContato.lista (3 tentativas sequenciais)
 * - Coluna Q → acionouCentral
 * - Coluna V → protocolosCentral
 * - Coluna R → n2SegundoNivel
 * - Coluna S → reclameAqui
 * - Coluna U → procon
 * - Coluna W → pixLiberado
 * - Coluna C → se preenchida: Finalizado.Resolvido = true, Finalizado.dataResolucao = C
 * - createdAt = coluna B
 * - updatedAt = data de hoje
 * 
 * Uso:
 *   node backend/scripts/update-bacen-from-excel.js [--dry-run]
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const path = require('path');
const XLSX = require('xlsx');
const fs = require('fs');
const { normalizarMotivosDeCelula } = require(path.join(__dirname, '../utils/motivoReduzidoNormalize'));

// Configuração MongoDB
const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://REDACTED';
const DATABASE_NAME = 'hub_ouvidoria';
const COLLECTION_NAME = 'reclamacoes_bacen';

// Modo dry-run (apenas validação, sem atualizar)
const DRY_RUN = process.argv.includes('--dry-run');

// Caminho do arquivo XLSX
const XLSX_PATH = path.join(__dirname, '../../../dados procon/Bacen.xlsx');

/**
 * Converter data do Excel ou string para Date
 */
function parseData(data) {
  if (!data) return null;
  
  if (data instanceof Date) {
    return data;
  }
  
  if (typeof data === 'number') {
    // Formato serial do Excel (número de dias desde 1900-01-01)
    if (data > 45000 && data < 50000) {
      const excelEpoch = new Date(1900, 0, 1);
      const days = data - 2; // Excel conta 1900 como ano bissexto incorretamente
      const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
      if (date.getFullYear() >= 2020 && date.getFullYear() <= 2030) {
        return date;
      }
    }
    return null;
  }
  
  const str = String(data).trim();
  if (!str) return null;
  
  // Formato DD/MM/YYYY
  const partes = str.split('/');
  if (partes.length === 3) {
    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const ano = parseInt(partes[2], 10);
    
    if (!isNaN(dia) && !isNaN(mes) && !isNaN(ano) && ano >= 2020 && ano <= 2030) {
      return new Date(ano, mes, dia);
    }
  }
  
  // Tentar parse direto
  const dateObj = new Date(data);
  if (!isNaN(dateObj.getTime()) && dateObj.getFullYear() >= 2020 && dateObj.getFullYear() <= 2030) {
    return dateObj;
  }
  
  return null;
}

/**
 * Normalizar CPF (apenas números, 11 dígitos)
 */
function normalizarCPF(cpf) {
  if (!cpf) return '';
  const apenasNumeros = String(cpf).replace(/\D/g, '');
  return apenasNumeros.length === 11 ? apenasNumeros : '';
}

/**
 * Normalizar nome para primeira maiúscula (title case)
 * Exemplo: "JOÃO DA SILVA" → "João da Silva"
 */
function normalizarNome(nome) {
  if (!nome || typeof nome !== 'string') return '';
  
  // Preposições e artigos que devem ficar em minúsculas (exceto no início)
  const preposicoes = ['da', 'de', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'nas', 'nos', 'para', 'por', 'com', 'sem', 'sob', 'sobre', 'entre', 'ante', 'até', 'após', 'contra', 'desde', 'durante', 'mediante', 'perante', 'salvo', 'segundo', 'conforme', 'consoante', 'exceto', 'menos', 'fora', 'através', 'a', 'o', 'as', 'os'];
  
  // Dividir nome em palavras
  const palavras = nome.trim().toLowerCase().split(/\s+/);
  
  // Capitalizar primeira letra de cada palavra, exceto preposições (a menos que seja a primeira palavra)
  const palavrasNormalizadas = palavras.map((palavra, index) => {
    // Se for primeira palavra ou não for preposição, capitalizar
    if (index === 0 || !preposicoes.includes(palavra)) {
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    }
    // Preposições no meio do nome ficam em minúsculas
    return palavra;
  });
  
  return palavrasNormalizadas.join(' ');
}

/**
 * Converter motivoReduzido (coluna J) para array — padrão ouvidoria (motivoReduzidoNormalize)
 */
function converterMotivoReduzido(motivoStr) {
  return normalizarMotivosDeCelula(motivoStr);
}

/**
 * Converter telefones da coluna M para array
 */
function converterTelefones(telefoneStr) {
  if (!telefoneStr || typeof telefoneStr !== 'string') {
    return { lista: [] };
  }
  
  const telefones = telefoneStr
    .split(/[,;]/)
    .map(t => t.trim())
    .filter(t => t.length > 0)
    .map(t => {
      // Remover caracteres não numéricos exceto +
      let tel = t.replace(/[^\d+]/g, '');
      // Se começar com +, manter, senão adicionar se necessário
      if (!tel.startsWith('+') && tel.length > 0) {
        tel = tel.replace(/^\+/, '');
      }
      return tel;
    })
    .filter(t => t.length >= 10);
  
  return { lista: telefones };
}

/**
 * Converter tentativas de contato (colunas N, O, P)
 */
function converterTentativas(tentativa1, tentativa2, tentativa3) {
  const tentativas = [];
  
  const t1 = parseData(tentativa1);
  if (t1) {
    tentativas.push({
      data: t1,
      meio: 'Telefone',
      resultado: ''
    });
  }
  
  const t2 = parseData(tentativa2);
  if (t2) {
    tentativas.push({
      data: t2,
      meio: 'Telefone',
      resultado: ''
    });
  }
  
  const t3 = parseData(tentativa3);
  if (t3) {
    tentativas.push({
      data: t3,
      meio: 'Telefone',
      resultado: ''
    });
  }
  
  return { lista: tentativas };
}

/**
 * Converter string para boolean
 */
function converterBoolean(valor) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'number') return valor !== 0;
  
  const str = String(valor).toUpperCase().trim();
  return str === 'TRUE' || str === 'SIM' || str === 'S' || str === '1' || str === 'YES' || str === 'Y';
}

/**
 * Converter protocolos (string separada por vírgula/ponto e vírgula)
 */
function converterProtocolos(protocolosStr) {
  if (!protocolosStr || typeof protocolosStr !== 'string') return [];
  
  return protocolosStr
    .split(/[,;]/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/**
 * Converter status PIX para boolean
 * Aceita: boolean, string, número (1/0), null/undefined
 */
function converterPixLiberado(valor) {
  // Se já for boolean, retornar como está
  if (typeof valor === 'boolean') {
    return valor;
  }
  
  // Se for número (1 = true, 0 = false)
  if (typeof valor === 'number') {
    return valor === 1 || valor !== 0;
  }
  
  // Se for null ou undefined, retornar false
  if (!valor || valor === null || valor === undefined) {
    return false;
  }
  
  // Se for string, processar
  if (typeof valor === 'string') {
    const str = valor.toUpperCase().trim();
    
    // Se string vazia, retornar false
    if (str === '') {
      return false;
    }
    
    // Se contém "Liberado", "Excluído" ou "Solicitada" = true
    if (str.includes('LIBERADO') || str.includes('LIBERADA') || 
        str.includes('EXCLUÍDO') || str.includes('EXCLUIDO') || 
        str.includes('EXCLUÍDA') || str.includes('EXCLUIDA') ||
        str.includes('SOLICITADA') || str.includes('SOLICITADO') ||
        str === 'TRUE' || str === 'SIM' || str === 'S' || str === '1') {
      return true;
    }
    
    // Se contém "Não aplicável" ou valores que indicam false
    if (str.includes('NÃO APLICÁVEL') || str.includes('NAO APLICAVEL') || 
        str.includes('N/A') || str === 'FALSE' || str === 'NÃO' || str === 'NAO' ||
        str === 'N' || str === '0') {
      return false;
    }
  }
  
  // Por padrão, retornar false
  return false;
}

/**
 * Ler XLSX e converter para array de objetos usando colunas específicas
 */
function lerXLSXPorColunas(caminhoArquivo) {
  if (!fs.existsSync(caminhoArquivo)) {
    throw new Error(`Arquivo não encontrado: ${caminhoArquivo}`);
  }
  
  const workbook = XLSX.readFile(caminhoArquivo);
  
  // Usar primeira aba disponível
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Converter para array de arrays (sem cabeçalho)
  const dados = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1, // Array de arrays
    defval: null,
    raw: false
  });
  
  if (dados.length < 2) {
    console.log('⚠️  Planilha vazia ou sem dados');
    return [];
  }
  
  // Converter para objetos usando índices de coluna (A=0, B=1, C=2, etc.)
  const registros = [];
  
  // Pular primeira linha (cabeçalho)
  for (let i = 1; i < dados.length; i++) {
    const row = dados[i];
    
    // Verificar se linha está vazia (verificar colunas principais: B, F, G)
    if (!row || row.length === 0 || (!row[1] && !row[5] && !row[6])) {
      continue; // Pular linhas vazias
    }
    
    // Mapear colunas (índices baseados em 0: A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10, L=11, M=12, N=13, O=14, P=15, Q=16, R=17, S=18, T=19, U=20, V=21, W=22, X=23, Y=24)
    const registro = {
      // Coluna B (índice 1) → dataEntrada e createdAt
      dataEntrada: parseData(row[1]),
      createdAt: parseData(row[1]),
      
      // Coluna C (índice 2) → Finalizado.dataResolucao (se preenchida)
      dataResolucao: parseData(row[2]),
      
      // Coluna E (índice 4) → responsavel
      responsavel: row[4] ? String(row[4]).trim() : '',
      
      // Coluna F (índice 5) → nome (normalizado para primeira maiúscula)
      nome: row[5] ? normalizarNome(String(row[5]).trim()) : '',
      
      // Coluna G (índice 6) → cpf
      cpf: normalizarCPF(row[6]),
      
      // Coluna H (índice 7) → produto
      produto: row[7] ? String(row[7]).trim() : '',
      
      // Coluna I (índice 8) → origem
      origem: row[8] ? String(row[8]).trim() : '',
      
      // Coluna J (índice 9) → motivoReduzido (array, normalizado: "Chave Pix" → "Liberação Chave Pix")
      motivoReduzido: converterMotivoReduzido(row[9]),
      
      // Coluna K (índice 10) → motivoDetalhado
      motivoDetalhado: row[10] ? String(row[10]).trim() : '',
      
      // Coluna L (índice 11) → prazoBacen
      prazoBacen: parseData(row[11]),
      
      // Coluna M (índice 12) → telefones.lista
      telefones: converterTelefones(row[12]),
      
      // Colunas N, O, P (índices 13, 14, 15) → tentativasContato.lista
      tentativasContato: converterTentativas(row[13], row[14], row[15]),
      
      // Coluna Q (índice 16) → acionouCentral
      acionouCentral: converterBoolean(row[16]),
      
      // Coluna R (índice 17) → n2SegundoNivel
      n2SegundoNivel: converterBoolean(row[17]),
      
      // Coluna S (índice 18) → reclameAqui
      reclameAqui: converterBoolean(row[18]),
      
      // Coluna U (índice 20) → procon
      procon: converterBoolean(row[20]),
      
      // Coluna V (índice 21) → protocolosCentral
      protocolosCentral: converterProtocolos(row[21]),
      
      // Coluna W (índice 22) → pixLiberado
      pixLiberado: converterPixLiberado(row[22]),
      
      // Coluna Y (índice 24) → observacoes
      observacoes: row[24] ? String(row[24]).trim() : '',
      
      // updatedAt = data de hoje
      updatedAt: new Date()
    };
    
    // Validar CPF antes de adicionar
    if (!registro.cpf || registro.cpf.length !== 11) {
      console.warn(`⚠️  Linha ${i + 1}: CPF inválido ou vazio (valor: ${row[6]}), pulando registro`);
      continue;
    }
    
    // Validar dataEntrada
    if (!registro.dataEntrada) {
      console.warn(`⚠️  Linha ${i + 1}: dataEntrada inválida ou vazia (valor: ${row[1]}), pulando registro`);
      continue;
    }
    
    registros.push(registro);
  }
  
  return registros;
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Script de Atualização: Base Bacen (XLSX) → MongoDB reclamacoes_bacen\n');
  console.log(`📁 Arquivo: ${XLSX_PATH}`);
  console.log(`🔧 Modo: ${DRY_RUN ? 'DRY-RUN (apenas validação)' : 'ATUALIZAÇÃO REAL'}\n`);
  
  let client;
  
  try {
    // Ler dados do XLSX
    console.log('📂 Lendo dados da planilha Excel...');
    const dadosXLSX = lerXLSXPorColunas(XLSX_PATH);
    console.log(`✅ ${dadosXLSX.length} registros lidos da planilha\n`);
    
    if (dadosXLSX.length === 0) {
      console.log('⚠️  Nenhum dado encontrado para processar.');
      return;
    }
    
    // Conectar ao MongoDB
    console.log('🔌 Conectando ao MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Conectado ao MongoDB\n');
    
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Estatísticas
    let atualizados = 0;
    let criados = 0;
    let naoEncontrados = 0;
    let erros = 0;
    const errosDetalhes = [];
    
    // Processar cada registro
    console.log('🔄 Processando atualizações...\n');
    
    for (let i = 0; i < dadosXLSX.length; i++) {
      const registro = dadosXLSX[i];
      
      try {
        // Buscar documento existente por CPF
        const documentoExistente = await collection.findOne({ cpf: registro.cpf });
        
        if (documentoExistente) {
          // Preparar objeto de atualização
          const updateDoc = {
            $set: {
              nome: registro.nome,
              telefones: registro.telefones,
              observacoes: registro.observacoes,
              responsavel: registro.responsavel,
              dataEntrada: registro.dataEntrada,
              origem: registro.origem,
              produto: registro.produto,
              prazoBacen: registro.prazoBacen,
              motivoReduzido: registro.motivoReduzido,
              motivoDetalhado: registro.motivoDetalhado,
              tentativasContato: registro.tentativasContato,
              acionouCentral: registro.acionouCentral,
              protocolosCentral: registro.protocolosCentral,
              n2SegundoNivel: registro.n2SegundoNivel,
              reclameAqui: registro.reclameAqui,
              procon: registro.procon,
              pixLiberado: registro.pixLiberado,
              updatedAt: registro.updatedAt
            }
          };
          
          // Se coluna C (dataResolucao) preenchida, definir Finalizado
          if (registro.dataResolucao) {
            updateDoc.$set.Finalizado = {
              Resolvido: true,
              dataResolucao: registro.dataResolucao
            };
          } else {
            // Se não preenchida, manter Finalizado como está ou definir como não resolvido
            updateDoc.$set.Finalizado = {
              Resolvido: false
            };
          }
          
          if (!DRY_RUN) {
            await collection.updateOne(
              { cpf: registro.cpf },
              updateDoc
            );
          }
          
          atualizados++;
          if ((atualizados + criados) % 100 === 0) {
            console.log(`📊 Processados: ${atualizados + criados}/${dadosXLSX.length}`);
          }
        } else {
          // Criar novo documento
          const novoDocumento = {
            nome: registro.nome,
            cpf: registro.cpf,
            telefones: registro.telefones,
            observacoes: registro.observacoes,
            responsavel: registro.responsavel,
            dataEntrada: registro.dataEntrada,
            origem: registro.origem,
            produto: registro.produto,
            prazoBacen: registro.prazoBacen,
            motivoReduzido: registro.motivoReduzido,
            motivoDetalhado: registro.motivoDetalhado,
            tentativasContato: registro.tentativasContato,
            acionouCentral: registro.acionouCentral,
            protocolosCentral: registro.protocolosCentral,
            n2SegundoNivel: registro.n2SegundoNivel,
            reclameAqui: registro.reclameAqui,
            procon: registro.procon,
            pixLiberado: registro.pixLiberado,
            createdAt: registro.createdAt,
            updatedAt: registro.updatedAt
          };
          
          // Se coluna C (dataResolucao) preenchida, definir Finalizado
          if (registro.dataResolucao) {
            novoDocumento.Finalizado = {
              Resolvido: true,
              dataResolucao: registro.dataResolucao
            };
          } else {
            novoDocumento.Finalizado = {
              Resolvido: false
            };
          }
          
          if (!DRY_RUN) {
            await collection.insertOne(novoDocumento);
          }
          
          criados++;
          if ((atualizados + criados) % 100 === 0) {
            console.log(`📊 Processados: ${atualizados + criados}/${dadosXLSX.length}`);
          }
        }
      } catch (error) {
        erros++;
        const erroDetalhe = {
          linha: i + 2, // +2 porque pulamos cabeçalho e índice começa em 0
          cpf: registro.cpf,
          erro: error.message
        };
        errosDetalhes.push(erroDetalhe);
        console.error(`❌ Erro ao processar linha ${i + 2} (CPF: ${registro.cpf}):`, error.message);
      }
    }
    
    // Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA ATUALIZAÇÃO');
    console.log('='.repeat(60));
    console.log(`✅ Documentos atualizados: ${atualizados}`);
    console.log(`➕ Documentos criados: ${criados}`);
    console.log(`❌ Erros: ${erros}`);
    
    if (errosDetalhes.length > 0) {
      console.log('\n⚠️  Detalhes dos erros:');
      errosDetalhes.slice(0, 10).forEach(erro => {
        console.log(`   Linha ${erro.linha} (CPF: ${erro.cpf}): ${erro.erro}`);
      });
      if (errosDetalhes.length > 10) {
        console.log(`   ... e mais ${errosDetalhes.length - 10} erros`);
      }
    }
    
    if (DRY_RUN) {
      console.log('\n⚠️  MODO DRY-RUN: Nenhuma alteração foi feita no banco de dados');
    } else {
      console.log('\n✅ Atualização concluída!');
    }
    
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Conexão com MongoDB fechada');
    }
  }
}

// Executar
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, lerXLSXPorColunas };
