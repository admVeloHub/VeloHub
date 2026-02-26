/**
 * Script de Sincronização: Firebase → MongoDB (Apenas Novos Casos)
 * VERSION: v1.2.0 | DATE: 2026-02-20 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v1.1.0:
 * - Removida sincronização de fichas_chatbot → reclamacoes_chatbot
 * - Collection reclamacoes_chatbot removida do projeto
 * 
 * Sincroniza apenas os novos casos do Firebase Realtime Database para MongoDB
 * Compara com casos já existentes no MongoDB e insere apenas os novos
 * 
 * Uso:
 *   node backend/scripts/sync-firebase-to-mongodb.js [--dry-run]
 * 
 * Requer variáveis de ambiente:
 *   - MONGO_ENV (MongoDB connection string)
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Usar fetch nativo (Node.js 18+) ou node-fetch como fallback
let fetch;
if (typeof globalThis.fetch === 'function') {
  fetch = globalThis.fetch;
} else {
  fetch = require('node-fetch');
}

// Configuração Firebase (do projeto BACEN)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAVoOWyvMjk29hm9OZ7g7EcOnIkHklFGSQ",
  authDomain: "bacen-n2.firebaseapp.com",
  databaseURL: "https://bacen-n2-default-rtdb.firebaseio.com",
  projectId: "bacen-n2",
  storageBucket: "bacen-n2.firebasestorage.app",
  messagingSenderId: "165884440954",
  appId: "1:165884440954:web:df1d0482e9cf7fc54da6c3"
};

// Configuração MongoDB
const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@velohubcentral.od7vwts.mongodb.net/?retryWrites=true&w=majority&appName=VelohubCentral';
const DATABASE_NAME = 'hub_ouvidoria';

// Modo dry-run (apenas validação, sem inserir)
const DRY_RUN = process.argv.includes('--dry-run');

// Tipos de fichas para sincronizar
const TIPOS_FICHAS = {
  'bacen': {
    firebasePath: 'fichas_bacen',
    mongoCollection: 'reclamacoes_bacen',
    converter: null // Será definido abaixo
  },
  'n2': {
    firebasePath: 'fichas_n2',
    mongoCollection: 'reclamacoes_ouvidoria',
    converter: null
  }
};

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
 * Converter tentativas do Firebase para formato MongoDB
 */
function converterTentativas(tentativas) {
  if (!tentativas || !Array.isArray(tentativas)) return { lista: [] };
  
  return {
    lista: tentativas.map(t => ({
      data: t.dataHora ? new Date(t.dataHora) : new Date(),
      meio: inferirMeioContato(t.observacoes, t.resultado),
      resultado: t.resultado || ''
    }))
  };
}

/**
 * Inferir meio de contato baseado em observações e resultado
 */
function inferirMeioContato(observacoes, resultado) {
  if (!observacoes) return 'Telefone';
  const obs = observacoes.toLowerCase();
  if (obs.includes('whatsapp') || obs.includes('whats')) return 'Whatsapp';
  if (obs.includes('email') || obs.includes('e-mail')) return 'Email';
  return 'Telefone';
}

/**
 * Converter status do Firebase para formato MongoDB
 */
function converterStatus(statusFirebase) {
  const statusMap = {
    'nao-iniciado': 'nao-iniciado',
    'em-andamento': 'em-andamento',
    'respondido': 'respondido',
    'concluido': 'resolvido',
    'concluído': 'resolvido',
    'resolvido': 'resolvido'
  };
  return statusMap[statusFirebase?.toLowerCase()] || 'nao-iniciado';
}

/**
 * Converter origem BACEN para formato esperado
 */
function converterOrigemBacen(origem) {
  if (!origem) return '';
  const origemMap = {
    'bacen-celcoin': 'Bacen Celcoin',
    'bacen-via-capital': 'Bacen Via Capital',
    'consumidor.gov': 'Consumidor.Gov'
  };
  return origemMap[origem.toLowerCase()] || origem;
}

/**
 * Converter pixStatus
 */
function converterPixStatus(pixLiberado, enviarCobranca) {
  if (pixLiberado === true) return 'Liberado';
  if (pixLiberado === false && enviarCobranca === true) return 'Solicitada';
  if (pixLiberado === false && enviarCobranca === false) return 'Excluído';
  return 'Não aplicável';
}

/**
 * Converter reclamação BACEN
 */
function converterReclamacaoBacen(firebaseDoc) {
  const modulosContato = firebaseDoc.modulosContato || {};
  const camposEspecificos = firebaseDoc.camposEspecificos || {};
  
  return {
    nome: firebaseDoc.nomeCliente || firebaseDoc.nomeCompleto || '',
    cpf: firebaseDoc.cpf || firebaseDoc.cpfTratado || '',
    telefones: converterTelefones(firebaseDoc.telefone),
    email: firebaseDoc.email || '',
    observacoes: firebaseDoc.observacoes || '',
    status: converterStatus(firebaseDoc.status),
    responsavel: firebaseDoc.responsavel || '',
    userEmail: firebaseDoc.userEmail || '',
    
    // Campos específicos BACEN
    dataEntrada: firebaseDoc.dataEntrada ? new Date(firebaseDoc.dataEntrada) : new Date(),
    origem: converterOrigemBacen(firebaseDoc.origem),
    produto: firebaseDoc.produto || '',
    anexos: Array.isArray(firebaseDoc.anexos) ? firebaseDoc.anexos : [],
    prazoBacen: (firebaseDoc.prazoBacen || camposEspecificos.prazoBacen) ? 
      new Date(firebaseDoc.prazoBacen || camposEspecificos.prazoBacen) : null,
    motivoReduzido: firebaseDoc.motivoReduzido || '',
    motivoDetalhado: firebaseDoc.motivoDetalhado || '',
    
    // Campos compartilhados
    tentativasContato: converterTentativas(firebaseDoc.tentativas),
    acionouCentral: modulosContato.atendimento === true,
    protocolosCentral: Array.isArray(firebaseDoc.protocolosCentral) ? firebaseDoc.protocolosCentral : [],
    n2SegundoNivel: modulosContato.n2 === true,
    protocolosN2: Array.isArray(firebaseDoc.protocolosN2) ? firebaseDoc.protocolosN2 : [],
    reclameAqui: modulosContato.reclameAqui === true || firebaseDoc.reclameAqui === true,
    protocolosReclameAqui: Array.isArray(firebaseDoc.protocolosReclameAqui) ? firebaseDoc.protocolosReclameAqui : [],
    procon: modulosContato.procon === true || firebaseDoc.procon === true || camposEspecificos.procon === true,
    protocolosProcon: Array.isArray(firebaseDoc.protocolosProcon) ? firebaseDoc.protocolosProcon : [],
    protocolosSemAcionamento: firebaseDoc.protocolosSemAcionamento || '',
    pixStatus: converterPixStatus(firebaseDoc.pixLiberado, firebaseDoc.enviarCobranca),
    statusContratoQuitado: firebaseDoc.aceitouLiquidacao === true,
    statusContratoAberto: firebaseDoc.aceitouLiquidacao === false,
    casosCriticos: firebaseDoc.casosCriticos === true || camposEspecificos.casosCriticos === true,
    finalizadoEm: firebaseDoc.finalizadoEm ? new Date(firebaseDoc.finalizadoEm) : null,
    idSecao: firebaseDoc.idSecao || '',
    deletada: false,
    deletedAt: null,
    createdAt: firebaseDoc.dataCriacao ? new Date(firebaseDoc.dataCriacao) : new Date(),
    updatedAt: firebaseDoc.dataAtualizacao ? new Date(firebaseDoc.dataAtualizacao) : new Date(),
    // Campo adicional para rastreamento
    firebaseId: firebaseDoc.id || null
  };
}

/**
 * Converter reclamação N2/Ouvidoria
 */
function converterReclamacaoN2(firebaseDoc) {
  const modulosContato = firebaseDoc.modulosContato || {};
  
  const mes = firebaseDoc.mes || '';
  const dataEntrada = firebaseDoc.dataEntrada || firebaseDoc.dataRecebimento || firebaseDoc.dataCriacao;
  
  let mesFormatado = mes;
  if (mes && mes.includes('/')) {
    const partes = mes.split('/');
    if (partes.length === 2) {
      if (partes[1].length === 2) {
        mesFormatado = `${partes[0]}/20${partes[1]}`;
      } else {
        mesFormatado = mes;
      }
    }
  }
  
  return {
    nome: firebaseDoc.nomeCliente || firebaseDoc.nomeCompleto || '',
    cpf: firebaseDoc.cpf || firebaseDoc.cpfTratado || '',
    telefones: converterTelefones(firebaseDoc.telefone),
    email: firebaseDoc.email || '',
    observacoes: firebaseDoc.observacoes || '',
    status: converterStatus(firebaseDoc.status),
    responsavel: firebaseDoc.responsavel || '',
    userEmail: firebaseDoc.userEmail || '',
    
    // Campos específicos OUVIDORIA/N2
    dataEntradaAtendimento: dataEntrada ? new Date(dataEntrada) : new Date(),
    dataEntradaN2: dataEntrada ? new Date(dataEntrada) : new Date(),
    mes: mesFormatado || '',
    motivoReduzido: firebaseDoc.motivoReduzido || '',
    
    // Campos compartilhados
    tentativasContato: converterTentativas(firebaseDoc.tentativas),
    acionouCentral: modulosContato.atendimento === true,
    protocolosCentral: Array.isArray(firebaseDoc.protocolosCentral) ? firebaseDoc.protocolosCentral : [],
    n2SegundoNivel: modulosContato.n2 === true,
    protocolosN2: Array.isArray(firebaseDoc.protocolosN2) ? firebaseDoc.protocolosN2 : [],
    reclameAqui: modulosContato.reclameAqui === true || firebaseDoc.reclameAqui === true,
    protocolosReclameAqui: Array.isArray(firebaseDoc.protocolosReclameAqui) ? firebaseDoc.protocolosReclameAqui : [],
    procon: modulosContato.procon === true || firebaseDoc.procon === true,
    protocolosProcon: Array.isArray(firebaseDoc.protocolosProcon) ? firebaseDoc.protocolosProcon : [],
    protocolosSemAcionamento: firebaseDoc.protocolosSemAcionamento || '',
    pixStatus: converterPixStatus(firebaseDoc.pixLiberado, firebaseDoc.enviarCobranca),
    statusContratoQuitado: firebaseDoc.aceitouLiquidacao === true,
    statusContratoAberto: firebaseDoc.aceitouLiquidacao === false,
    casosCriticos: firebaseDoc.casosCriticos === true,
    finalizadoEm: firebaseDoc.finalizadoEm ? new Date(firebaseDoc.finalizadoEm) : null,
    idSecao: firebaseDoc.idSecao || '',
    deletada: false,
    deletedAt: null,
    createdAt: firebaseDoc.dataCriacao ? new Date(firebaseDoc.dataCriacao) : new Date(),
    updatedAt: firebaseDoc.dataAtualizacao ? new Date(firebaseDoc.dataAtualizacao) : new Date(),
    // Campo adicional para rastreamento
    firebaseId: firebaseDoc.id || null
  };
}

// Atribuir converters
TIPOS_FICHAS.bacen.converter = converterReclamacaoBacen;
TIPOS_FICHAS.n2.converter = converterReclamacaoN2;

/**
 * Baixar dados do Firebase
 */
async function downloadFirebaseData(tipo) {
  const config = TIPOS_FICHAS[tipo];
  if (!config) {
    throw new Error(`Tipo inválido: ${tipo}`);
  }
  
  const url = `${FIREBASE_CONFIG.databaseURL}/${config.firebasePath}.json`;
  console.log(`   📥 Baixando dados do Firebase: ${config.firebasePath}...`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`   ⚠️  Nenhum dado encontrado para ${config.firebasePath}`);
        return [];
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data || Object.keys(data).length === 0) {
      console.log(`   ⚠️  Nenhum dado encontrado para ${config.firebasePath}`);
      return [];
    }
    
    // Converter objeto de objetos para array
    const fichasArray = Object.keys(data).map(id => ({
      id,
      ...data[id]
    }));
    
    console.log(`   ✅ ${fichasArray.length} fichas baixadas do Firebase`);
    return fichasArray;
  } catch (error) {
    console.error(`   ❌ Erro ao baixar dados do Firebase:`, error.message);
    throw error;
  }
}

/**
 * Verificar se caso já existe no MongoDB
 * Usa múltiplas estratégias para detectar duplicatas
 */
async function verificarDuplicata(collection, documentoConvertido, firebaseId) {
  // Estratégia 1: Verificar por firebaseId se disponível
  if (firebaseId) {
    const porFirebaseId = await collection.findOne({ firebaseId });
    if (porFirebaseId) {
      return { existe: true, motivo: 'firebaseId' };
    }
  }
  
  // Estratégia 2: Verificar por CPF + nome + data de criação (±1 dia)
  const cpfLimpo = documentoConvertido.cpf.replace(/\D/g, '');
  if (cpfLimpo.length === 11) {
    const createdAt = documentoConvertido.createdAt;
    const existe = await collection.findOne({
      cpf: cpfLimpo,
      nome: documentoConvertido.nome,
      createdAt: {
        $gte: new Date(createdAt.getTime() - 86400000), // ±1 dia
        $lte: new Date(createdAt.getTime() + 86400000)
      }
    });
    
    if (existe) {
      return { existe: true, motivo: 'cpf+nome+data' };
    }
  }
  
  // Estratégia 3: Verificar por CPF + email + data (±2 dias) se email disponível
  if (documentoConvertido.email && cpfLimpo.length === 11) {
    const createdAt = documentoConvertido.createdAt;
    const existe = await collection.findOne({
      cpf: cpfLimpo,
      email: documentoConvertido.email,
      createdAt: {
        $gte: new Date(createdAt.getTime() - 172800000), // ±2 dias
        $lte: new Date(createdAt.getTime() + 172800000)
      }
    });
    
    if (existe) {
      return { existe: true, motivo: 'cpf+email+data' };
    }
  }
  
  return { existe: false };
}

/**
 * Processar e sincronizar reclamações
 */
async function sincronizarReclamacoes(client, tipo) {
  const config = TIPOS_FICHAS[tipo];
  console.log(`\n📂 Sincronizando ${tipo.toUpperCase()}...`);
  
  // Baixar dados do Firebase
  const fichasFirebase = await downloadFirebaseData(tipo);
  
  if (fichasFirebase.length === 0) {
    console.log(`   ⏭️  Nenhum dado para processar`);
    return { processadas: 0, inseridas: 0, duplicatas: 0, erros: 0 };
  }
  
  const db = client.db(DATABASE_NAME);
  const collection = db.collection(config.mongoCollection);
  
  let processadas = 0;
  let inseridas = 0;
  let duplicatas = 0;
  let erros = 0;
  
  for (const doc of fichasFirebase) {
    try {
      processadas++;
      
      const documentoConvertido = config.converter(doc);
      
      // Validar campos obrigatórios
      if (!documentoConvertido.nome || !documentoConvertido.cpf) {
        console.log(`   ⚠️  Registro ${doc.id || processadas} ignorado: falta nome ou CPF`);
        erros++;
        continue;
      }
      
      // Validar CPF (deve ter 11 dígitos)
      const cpfLimpo = documentoConvertido.cpf.replace(/\D/g, '');
      if (cpfLimpo.length !== 11) {
        console.log(`   ⚠️  Registro ${doc.id || processadas} ignorado: CPF inválido (${cpfLimpo.length} dígitos)`);
        erros++;
        continue;
      }
      
      // Atualizar CPF para formato limpo
      documentoConvertido.cpf = cpfLimpo;
      
      // Verificar duplicata
      const duplicata = await verificarDuplicata(collection, documentoConvertido, doc.id);
      
      if (duplicata.existe) {
        if (processadas % 50 === 0) {
          process.stdout.write(`   Verificados: ${processadas}...\r`);
        }
        duplicatas++;
        continue;
      }
      
      // Inserir novo caso
      if (!DRY_RUN) {
        await collection.insertOne(documentoConvertido);
        inseridas++;
        
        if (inseridas % 10 === 0) {
          console.log(`   ✓ ${inseridas} novos casos inseridos...`);
        }
      } else {
        inseridas++;
        console.log(`   [DRY-RUN] Inseriria: ${doc.id} - ${documentoConvertido.nome} (CPF: ${cpfLimpo.substring(0, 3)}***)`);
      }
    } catch (error) {
      erros++;
      console.error(`   ❌ Erro ao processar registro ${doc.id || processadas}:`, error.message);
    }
  }
  
  console.log(`\n✅ ${tipo.toUpperCase()}: ${processadas} processadas | ${inseridas} novas | ${duplicatas} duplicatas | ${erros} erros`);
  return { processadas, inseridas, duplicatas, erros };
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando sincronização Firebase → MongoDB (Apenas Novos Casos)...');
  console.log(`   Modo: ${DRY_RUN ? 'DRY-RUN (apenas validação)' : 'SINCRONIZAÇÃO REAL'}`);
  console.log('');
  
  if (!MONGODB_URI) {
    console.error('❌ MONGO_ENV não configurada');
    process.exit(1);
  }
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB\n');
    
    const resultados = {
      bacen: { processadas: 0, inseridas: 0, duplicatas: 0, erros: 0 },
      n2: { processadas: 0, inseridas: 0, duplicatas: 0, erros: 0 }
    };
    
    // Sincronizar cada tipo
    resultados.bacen = await sincronizarReclamacoes(client, 'bacen');
    resultados.n2 = await sincronizarReclamacoes(client, 'n2');
    
    // Resumo final
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMO DA SINCRONIZAÇÃO');
    console.log('='.repeat(70));
    console.log(`BACEN:      ${resultados.bacen.processadas} processadas | ${resultados.bacen.inseridas} novas | ${resultados.bacen.duplicatas} duplicatas | ${resultados.bacen.erros} erros`);
    console.log(`N2:         ${resultados.n2.processadas} processadas | ${resultados.n2.inseridas} novas | ${resultados.n2.duplicatas} duplicatas | ${resultados.n2.erros} erros`);
    console.log('='.repeat(70));
    
    const totalProcessadas = resultados.bacen.processadas + resultados.n2.processadas;
    const totalInseridas = resultados.bacen.inseridas + resultados.n2.inseridas;
    const totalDuplicatas = resultados.bacen.duplicatas + resultados.n2.duplicatas;
    const totalErros = resultados.bacen.erros + resultados.n2.erros;
    
    console.log(`TOTAL:      ${totalProcessadas} processadas | ${totalInseridas} novas | ${totalDuplicatas} duplicatas | ${totalErros} erros`);
    console.log('='.repeat(70));
    
    if (DRY_RUN) {
      console.log('\n⚠️  MODO DRY-RUN: Nenhum dado foi inserido realmente');
      console.log('   Execute sem --dry-run para realizar a sincronização real\n');
    } else {
      console.log('\n✅ Sincronização concluída com sucesso!\n');
    }
    
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Conexão MongoDB fechada');
  }
}

// Executar
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  converterReclamacaoBacen,
  converterReclamacaoN2,
  sincronizarReclamacoes,
  downloadFirebaseData
};
