/**
 * Script de Normalização Completa: Todos os motivos em todas as collections
 * VERSION: v1.0.0 | DATE: 2026-03-02 | AUTHOR: VeloHub Development Team
 * 
 * Normaliza TODAS as inconsistências de capitalização e variações de motivos
 * em todas as collections do banco de dados hub_ouvidoria
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@velohubcentral.od7vwts.mongodb.net/?retryWrites=true&w=majority&appName=VelohubCentral';
const DATABASE_NAME = 'hub_ouvidoria';

/**
 * Normalizar motivo para forma canônica
 * Baseado na função normalizarMotivoParaAgrupamento do frontend
 */
function normalizarMotivo(motivo) {
  if (!motivo || typeof motivo !== 'string') return null;
  
  let normalizado = motivo.trim();
  if (!normalizado) return null;
  
  const motivoLower = normalizado.toLowerCase();
  
  // Filtrar naturezas/origens que não são motivos
  const naturezasOrigens = [
    'bacen celcoin',
    'bacen via capital',
    'consumidor.gov',
    'consumidor gov'
  ];
  
  if (naturezasOrigens.includes(motivoLower)) {
    return null; // Não normalizar naturezas/origens
  }
  
  // Normalizar variações específicas conhecidas de "Chave Pix"
  if (motivoLower === 'chave pix' || motivoLower === 'chavepix' || motivoLower === 'chave pix cpf' || 
      motivoLower === 'pix' || motivoLower.trim() === 'pix') {
    return 'Chave Pix';
  }
  
  if (motivoLower === 'liberação chave pix' || motivoLower === 'liberação de chave pix') {
    return 'Liberação Chave Pix';
  }
  
  // Normalizar variações compostas conhecidas
  if (motivoLower.includes('crédito pessoal') && motivoLower.includes('indisponível')) {
    return 'Crédito Pessoal Indisponível';
  }
  
  if (motivoLower.includes('juros') && motivoLower.includes('abusivos')) {
    return 'Juros Abusivos';
  }
  
  if (motivoLower.includes('dívida') && motivoLower.includes('prescrita')) {
    return 'Dívida Prescrita';
  }
  
  if (motivoLower.includes('dúvidas') && motivoLower.includes('restituição')) {
    return 'Dúvidas Restituição';
  }
  
  if (motivoLower.includes('dúvidas') && motivoLower.includes('crédito pessoal')) {
    return 'Dúvidas Crédito Pessoal';
  }
  
  if (motivoLower.includes('dúvidas') && motivoLower.includes('crédito') && motivoLower.includes('trabalhador')) {
    return 'Dúvidas Crédito ao Trabalhador';
  }
  
  if (motivoLower.includes('alteração') && motivoLower.includes('cadastral')) {
    return 'Alteração Cadastral';
  }
  
  if (motivoLower.includes('estorno') && motivoLower.includes('plano')) {
    return 'Estorno de Plano';
  }
  
  if (motivoLower.includes('restituição') && motivoLower.includes('2')) {
    return 'Restituição 2° Lote';
  }
  
  if (motivoLower.includes('restituição') && motivoLower.includes('1')) {
    return 'Restituição 1° Lote';
  }
  
  if (motivoLower.includes('pix') && motivoLower.includes('não') && motivoLower.includes('localizado')) {
    return 'PIX Não Localizado';
  }
  
  if (motivoLower.includes('cobrança') && motivoLower.includes('indevida')) {
    return 'Cobrança Indevida';
  }
  
  if (motivoLower.includes('malha') && motivoLower.includes('fina')) {
    return 'Malha Fina 2024';
  }
  
  if (motivoLower.includes('taxa') && motivoLower.includes('exclusão')) {
    return 'Taxa/Exclusão';
  }
  
  if (motivoLower.includes('limite') && motivoLower.includes('pix')) {
    return 'Limite PIX';
  }
  
  if (motivoLower.includes('seguro') && motivoLower.includes('acidente')) {
    return 'Seguro Acidente';
  }
  
  if (motivoLower.includes('seguro') && motivoLower.includes('saúde')) {
    return 'Seguro Saúde';
  }
  
  if (motivoLower.includes('portabilidade')) {
    return 'Portabilidade PIX';
  }
  
  if (motivoLower.includes('quitação') && motivoLower.includes('antecipada')) {
    return 'Quitação Antecipada';
  }
  
  if (motivoLower.includes('antecipação') && motivoLower.includes('não') && motivoLower.includes('disponível')) {
    return 'Antecipação Não Disponível';
  }
  
  if (motivoLower.includes('encerramento') && (motivoLower.includes('conta') || motivoLower.includes('da'))) {
    return 'Encerramento de Conta';
  }
  
  if (motivoLower.includes('banco') && motivoLower.includes('brasil')) {
    return 'Banco do Brasil';
  }
  
  if (motivoLower.includes('erro') && motivoLower.includes('aplicativo')) {
    return 'Erro/Aplicativo';
  }
  
  // Preposições que não devem ser capitalizadas (exceto no início)
  const preposicoes = ['do', 'da', 'de', 'ao', 'à', 'dos', 'das'];
  
  // Siglas que devem ser preservadas em maiúsculas
  const siglas = ['PIX', 'EP', 'BB', 'N/A', 'CPF'];
  
  // Converter para title case: primeira letra de cada palavra maiúscula, resto minúscula
  // Mas preservar siglas e não capitalizar preposições (exceto no início)
  const palavras = normalizado.split(' ');
  const palavrasNormalizadas = palavras.map((palavra, index) => {
    if (!palavra) return '';
    
    // Verificar se está dentro de parênteses (preservar siglas)
    const dentroParenteses = palavra.startsWith('(') && palavra.endsWith(')');
    const palavraSemParenteses = dentroParenteses ? palavra.slice(1, -1) : palavra;
    
    // Preservar siglas conhecidas
    const palavraUpper = palavraSemParenteses.toUpperCase();
    if (siglas.includes(palavraUpper)) {
      return dentroParenteses ? `(${palavraUpper})` : palavraUpper;
    }
    
    // Verificar se é preposição (não capitalizar exceto no início)
    const palavraLower = palavraSemParenteses.toLowerCase();
    if (preposicoes.includes(palavraLower) && index > 0) {
      return dentroParenteses ? `(${palavraLower})` : palavraLower;
    }
    
    // Normal: primeira maiúscula, resto minúscula
    const resultado = palavraSemParenteses.charAt(0).toUpperCase() + palavraSemParenteses.slice(1).toLowerCase();
    return dentroParenteses ? `(${resultado})` : resultado;
  });
  
  normalizado = palavrasNormalizadas.join(' ');
  
  // Normalizar variações conhecidas específicas após processamento
  const normalizadoLower = normalizado.toLowerCase();
  
  if (normalizadoLower === 'chave pix' || normalizadoLower === 'pix') {
    normalizado = 'Chave Pix';
  }
  
  if (normalizadoLower === 'liberação chave pix') {
    normalizado = 'Liberação Chave Pix';
  }
  
  // Normalizar "Erro/aplicativo" → "Erro/Aplicativo"
  if (normalizadoLower.includes('erro') && normalizadoLower.includes('aplicativo')) {
    normalizado = normalizado.replace(/erro\s*\/\s*aplicativo/gi, 'Erro/Aplicativo');
  }
  
  // Normalizar "Banco Do Brasil" → "Banco do Brasil" (preposição "do" em minúscula)
  if (normalizadoLower.includes('banco') && normalizadoLower.includes('brasil')) {
    normalizado = normalizado.replace(/Banco\s+Do\s+Brasil/gi, 'Banco do Brasil');
  }
  
  // Normalizar "Limite Pix" → "Limite PIX" (PIX em maiúsculas)
  if (normalizadoLower.includes('limite') && normalizadoLower.includes('pix')) {
    normalizado = normalizado.replace(/Limite\s+Pix/gi, 'Limite PIX');
  }
  
  // Normalizar "Pix não localizado" → "PIX Não Localizado"
  if (normalizadoLower.includes('pix') && normalizadoLower.includes('não') && normalizadoLower.includes('localizado')) {
    normalizado = normalizado.replace(/Pix\s+não\s+localizado/gi, 'PIX Não Localizado');
  }
  
  // Normalizar "Restituição 1 Lote" → "Restituição 1° Lote"
  if (normalizadoLower.includes('restituição') && normalizadoLower.includes('1') && normalizadoLower.includes('lote')) {
    normalizado = normalizado.replace(/Restituição\s+1\s+Lote/gi, 'Restituição 1° Lote');
  }
  
  // Se não houve mudança, retornar null para não atualizar
  if (normalizado === motivo) {
    return null;
  }
  
  return normalizado;
}

/**
 * Processar e normalizar motivoReduzido (pode ser string ou array)
 */
function processarMotivoReduzido(motivoReduzido) {
  if (!motivoReduzido) return null;
  
  // Se for array, processar cada item
  if (Array.isArray(motivoReduzido)) {
    const normalizados = motivoReduzido.map(motivo => {
      if (typeof motivo === 'string') {
        const normalizado = normalizarMotivo(motivo);
        return normalizado || motivo;
      }
      return motivo;
    });
    
    // Verificar se houve alguma mudança
    const mudou = normalizados.some((n, i) => n !== motivoReduzido[i]);
    return mudou ? normalizados : null;
  }
  
  // Se for string, normalizar
  if (typeof motivoReduzido === 'string') {
    const normalizado = normalizarMotivo(motivoReduzido);
    return normalizado;
  }
  
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  let client;
  
  try {
    console.log('🔌 Conectando ao MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Conectado ao MongoDB\n');
    
    const db = client.db(DATABASE_NAME);
    
    // Listar todas as collections
    const collections = await db.listCollections().toArray();
    console.log(`📋 Encontradas ${collections.length} collections:\n`);
    collections.forEach(col => console.log(`   - ${col.name}`));
    console.log('');
    
    let totalAtualizados = 0;
    let totalVerificados = 0;
    
    // Processar cada collection
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = db.collection(collectionName);
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📊 Processando collection: ${collectionName}`);
      console.log('='.repeat(60));
      
      // Buscar todos os documentos que têm motivoReduzido
      const documentos = await collection.find({
        motivoReduzido: { $exists: true, $ne: null }
      }).toArray();
      
      console.log(`   Total de documentos com motivoReduzido: ${documentos.length}`);
      
      let atualizadosNestaCollection = 0;
      
      for (const doc of documentos) {
        totalVerificados++;
        const motivoOriginal = doc.motivoReduzido;
        const motivoNormalizado = processarMotivoReduzido(motivoOriginal);
        
        if (motivoNormalizado !== null) {
          atualizadosNestaCollection++;
          
          if (dryRun) {
            console.log(`   [DRY RUN] Documento ${doc._id}:`);
            console.log(`     Antes: ${JSON.stringify(motivoOriginal)}`);
            console.log(`     Depois: ${JSON.stringify(motivoNormalizado)}`);
          } else {
            try {
              await collection.updateOne(
                { _id: doc._id },
                { $set: { motivoReduzido: motivoNormalizado } }
              );
              console.log(`   ✅ Atualizado documento ${doc._id}`);
              console.log(`      Antes: ${JSON.stringify(motivoOriginal)}`);
              console.log(`      Depois: ${JSON.stringify(motivoNormalizado)}`);
            } catch (error) {
              console.error(`   ❌ Erro ao atualizar documento ${doc._id}:`, error.message);
            }
          }
        }
      }
      
      totalAtualizados += atualizadosNestaCollection;
      console.log(`\n   📈 Total atualizados nesta collection: ${atualizadosNestaCollection}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO FINAL');
    console.log('='.repeat(60));
    console.log(`   Total de documentos verificados: ${totalVerificados}`);
    console.log(`   Total de documentos que serão atualizados: ${totalAtualizados}`);
    
    if (dryRun) {
      console.log('\n⚠️  MODO DRY RUN - Nenhuma alteração foi feita');
    } else {
      console.log(`\n✅ ${totalAtualizados} documentos atualizados com sucesso!`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Conexão com MongoDB fechada.');
    }
  }
}

main().catch(console.error);
