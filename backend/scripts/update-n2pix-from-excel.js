/**
 * Script de Atualização: Base N2 Pix (XLSX) → MongoDB reclamacoes_n2Pix
 * VERSION: v1.4.0 | DATE: 2026-03-23 | AUTHOR: VeloHub Development Team
 *
 * Mudanças v1.4.0:
 * - motivoReduzido via utils/motivoReduzidoNormalize.js (renomeações + sentence case pt-BR)
 *
 * Mudanças v1.3.0:
 * - CORRIGIDO: Função converterPixLiberado() melhorada para aceitar boolean, número, string e null/undefined
 * - Agora processa corretamente valores da coluna V (pixLiberado) da planilha Excel
 * - Suporta valores booleanos diretos, números (1/0), strings ("SIM", "NÃO", "LIBERADO", etc.)
 * 
 * Mudanças v1.2.0:
 * - Adicionada função normalizarMotivoIndividual() para converter "Chave Pix" → "Liberação Chave Pix" em arrays
 * - MotivoReduzido agora normaliza "Chave Pix" para "Liberação Chave Pix" em cada elemento do array
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
 * - Coluna K → telefones.lista
 * - Coluna X → observacoes
 * - Coluna E → responsavel
 * - Coluna A → dataEntradaN2
 * - Coluna I → motivoReduzido (array)
 * - Coluna H → origem
 * - Coluna J → motivoDetalhado
 * - Coluna L → tentativasContato.lista
 * - Coluna O → acionouCentral
 * - Coluna U → protocolosCentral
 * - Coluna Q → reclameAqui
 * - Coluna R → bacen
 * - Coluna S → procon
 * - Coluna V → pixLiberado
 * - Coluna W → statusContratoQuitado
 * - Coluna D → enviarParaCobranca
 * - Coluna C → se preenchida: Finalizado.Resolvido = true, Finalizado.dataResolucao = C
 * - Coluna B → createdAt
 * - updatedAt = data de hoje
 * 
 * Uso:
 *   node backend/scripts/update-n2pix-from-excel.js [--dry-run]
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const path = require('path');
const XLSX = require('xlsx');
const fs = require('fs');
const { normalizarMotivosDeCelula } = require(path.join(__dirname, '../utils/motivoReduzidoNormalize'));

// Configuração MongoDB
const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@velohubcentral.od7vwts.mongodb.net/?retryWrites=true&w=majority&appName=VelohubCentral';
const DATABASE_NAME = 'hub_ouvidoria';
const COLLECTION_NAME = 'reclamacoes_n2Pix';

// Modo dry-run (apenas validação, sem atualizar)
const DRY_RUN = process.argv.includes('--dry-run');

// Caminho do arquivo XLSX
const XLSX_PATH = path.join(__dirname, '../../../dados procon/N2.xlsx');

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
 * Converter telefones da coluna K para array
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
 * Converter motivoReduzido (coluna I) para array — padrão ouvidoria (motivoReduzidoNormalize)
 */
function converterMotivoReduzido(motivoStr) {
  return normalizarMotivosDeCelula(motivoStr);
}

/**
 * Converter tentativas de contato da coluna L (pode ser uma data ou múltiplas datas)
 */
function converterTentativas(tentativaStr) {
  if (!tentativaStr) {
    return { lista: [] };
  }
  
  const tentativas = [];
  
  // Se for string, tentar dividir por vírgula/ponto e vírgula
  if (typeof tentativaStr === 'string') {
    const datas = tentativaStr.split(/[,;]/).map(d => d.trim()).filter(d => d);
    datas.forEach(dataStr => {
      const data = parseData(dataStr);
      if (data) {
        tentativas.push({
          data: data,
          meio: 'Telefone',
          resultado: ''
        });
      }
    });
  } else {
    // Se for número ou data direta
    const data = parseData(tentativaStr);
    if (data) {
      tentativas.push({
        data: data,
        meio: 'Telefone',
        resultado: ''
      });
    }
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
    
    // Verificar se linha está vazia (verificar colunas principais: A, F, G)
    if (!row || row.length === 0 || (!row[0] && !row[5] && !row[6])) {
      continue; // Pular linhas vazias
    }
    
    // Mapear colunas (índices baseados em 0: A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10, L=11, O=14, Q=16, R=17, S=18, U=20, V=21, W=22, X=23)
    const registro = {
      // Coluna A (índice 0) → dataEntradaN2
      dataEntradaN2: parseData(row[0]),
      
      // Coluna B (índice 1) → createdAt
      createdAt: parseData(row[1]),
      
      // Coluna C (índice 2) → Finalizado.dataResolucao (se preenchida)
      dataResolucao: parseData(row[2]),
      
      // Coluna D (índice 3) → enviarParaCobranca
      enviarParaCobranca: converterBoolean(row[3]),
      
      // Coluna E (índice 4) → responsavel
      responsavel: row[4] ? String(row[4]).trim() : '',
      
      // Coluna F (índice 5) → nome (normalizado para primeira maiúscula)
      nome: row[5] ? normalizarNome(String(row[5]).trim()) : '',
      
      // Coluna G (índice 6) → cpf
      cpf: normalizarCPF(row[6]),
      
      // Coluna H (índice 7) → origem
      origem: row[7] ? String(row[7]).trim() : '',
      
      // Coluna I (índice 8) → motivoReduzido (array)
      motivoReduzido: converterMotivoReduzido(row[8]),
      
      // Coluna J (índice 9) → motivoDetalhado
      motivoDetalhado: row[9] ? String(row[9]).trim() : '',
      
      // Coluna K (índice 10) → telefones.lista
      telefones: converterTelefones(row[10]),
      
      // Coluna L (índice 11) → tentativasContato.lista
      tentativasContato: converterTentativas(row[11]),
      
      // Coluna O (índice 14) → acionouCentral
      acionouCentral: converterBoolean(row[14]),
      
      // Coluna Q (índice 16) → reclameAqui
      reclameAqui: converterBoolean(row[16]),
      
      // Coluna R (índice 17) → bacen
      bacen: converterBoolean(row[17]),
      
      // Coluna S (índice 18) → procon
      procon: converterBoolean(row[18]),
      
      // Coluna U (índice 20) → protocolosCentral
      protocolosCentral: converterProtocolos(row[20]),
      
      // Coluna V (índice 21) → pixLiberado
      pixLiberado: converterPixLiberado(row[21]),
      
      // Coluna W (índice 22) → statusContratoQuitado
      statusContratoQuitado: converterBoolean(row[22]),
      
      // Coluna X (índice 23) → observacoes
      observacoes: row[23] ? String(row[23]).trim() : '',
      
      // updatedAt = data de hoje
      updatedAt: new Date()
    };
    
    // Validar CPF antes de adicionar
    if (!registro.cpf || registro.cpf.length !== 11) {
      console.warn(`⚠️  Linha ${i + 1}: CPF inválido ou vazio (valor: ${row[6]}), pulando registro`);
      continue;
    }
    
    // Validar dataEntradaN2
    if (!registro.dataEntradaN2) {
      console.warn(`⚠️  Linha ${i + 1}: dataEntradaN2 inválida ou vazia (valor: ${row[0]}), pulando registro`);
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
  console.log('🚀 Script de Atualização: Base N2 Pix (XLSX) → MongoDB reclamacoes_n2Pix\n');
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
              dataEntradaN2: registro.dataEntradaN2,
              motivoReduzido: registro.motivoReduzido,
              origem: registro.origem,
              motivoDetalhado: registro.motivoDetalhado,
              tentativasContato: registro.tentativasContato,
              acionouCentral: registro.acionouCentral,
              protocolosCentral: registro.protocolosCentral,
              reclameAqui: registro.reclameAqui,
              bacen: registro.bacen,
              procon: registro.procon,
              pixLiberado: registro.pixLiberado,
              statusContratoQuitado: registro.statusContratoQuitado,
              enviarParaCobranca: registro.enviarParaCobranca,
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
            dataEntradaN2: registro.dataEntradaN2,
            motivoReduzido: registro.motivoReduzido,
            origem: registro.origem,
            motivoDetalhado: registro.motivoDetalhado,
            tentativasContato: registro.tentativasContato,
            acionouCentral: registro.acionouCentral,
            protocolosCentral: registro.protocolosCentral,
            reclameAqui: registro.reclameAqui,
            bacen: registro.bacen,
            procon: registro.procon,
            pixLiberado: registro.pixLiberado,
            statusContratoQuitado: registro.statusContratoQuitado,
            enviarParaCobranca: registro.enviarParaCobranca,
            createdAt: registro.createdAt || registro.dataEntradaN2, // Se createdAt não vier, usar dataEntradaN2
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
