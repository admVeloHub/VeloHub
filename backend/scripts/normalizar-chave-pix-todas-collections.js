/**
 * Script de Normalização: Chave Pix em todas as collections
 * VERSION: v1.0.0 | DATE: 2026-03-02 | AUTHOR: VeloHub Development Team
 * 
 * Normaliza todas as variações de "Chave Pix" para o padrão "Chave Pix"
 * em todas as collections do banco de dados hub_ouvidoria
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_ENV || 'mongodb+srv://lucasgravina:nKQu8bSN6iZl8FPo@velohubcentral.od7vwts.mongodb.net/?retryWrites=true&w=majority&appName=VelohubCentral';
const DATABASE_NAME = 'hub_ouvidoria';

/**
 * Normalizar motivo para identificar variações de "Chave Pix"
 * NÃO normaliza "Liberação Chave Pix" - esse é um motivo diferente
 */
function normalizarParaChavePix(motivo) {
  if (!motivo || typeof motivo !== 'string') return null;
  
  const motivoLower = motivo.trim().toLowerCase();
  
  // Excluir "Liberação Chave Pix" - esse é um motivo diferente e válido
  if (motivoLower.includes('liberação') && motivoLower.includes('chave') && motivoLower.includes('pix')) {
    return null; // Não normalizar "Liberação Chave Pix"
  }
  
  // Padrões que devem ser normalizados para "Chave Pix"
  const padroesChavePix = [
    /^chave\s*pix$/i,                    // "Chave Pix", "chave pix", "CHAVE PIX"
    /^chavepix$/i,                       // "chavepix"
    /^pix$/i,                            // Apenas "Pix" (quando é o motivo completo)
    /retirada\s*de\s*chave\s*pix/i,     // "retirada de chave pix"
    /retirar\s*chave\s*pix/i,           // "retirar chave pix"
    /retirar\s*chave\s*pix\s*cpf/i,     // "retirar chave pix cpf"
    /chave\s*pix\s*\(retirada\)/i,      // "Chave Pix (Retirada)"
    /chave\s*pix\s*retirada/i,          // "Chave Pix Retirada"
    /pix\s*xpf/i,                        // "pix xpf"
    /chave\s*pix\s*xpf/i,                // "chave pix xpf"
    /^chave\s*pix\s*$/i                  // "Chave Pix " (com espaços extras)
  ];
  
  // Verificar se corresponde a algum padrão
  for (const padrao of padroesChavePix) {
    if (padrao.test(motivoLower)) {
      return 'Chave Pix';
    }
  }
  
  // Verificar se contém apenas "chave pix" (sem outras palavras antes ou depois)
  // Mas não se for parte de "Liberação Chave Pix"
  if (motivoLower === 'chave pix' || motivoLower === 'chavepix') {
    return 'Chave Pix';
  }
  
  return null;
}

/**
 * Processar e normalizar motivoReduzido quando contém "Chave Pix" junto com outros motivos
 * Exemplo: "Chave pix e Juros" → ["Chave Pix", "Juros"]
 */
function processarMotivoComChavePix(motivoReduzido) {
  if (!motivoReduzido) return null;
  
  // Se for array, processar cada item
  if (Array.isArray(motivoReduzido)) {
    const normalizados = motivoReduzido.map(motivo => {
      if (typeof motivo === 'string') {
        const motivoLower = motivo.trim().toLowerCase();
        
        // Se contém "chave pix" junto com outros textos, tentar separar
        if (motivoLower.includes('chave') && motivoLower.includes('pix') && !motivoLower.includes('liberação')) {
          // Verificar se é apenas "Chave Pix" ou variação simples
          const normalizado = normalizarParaChavePix(motivo);
          if (normalizado) {
            return normalizado;
          }
          
          // Tentar separar "Chave Pix" de outros motivos
          // Exemplo: "Chave pix e Juros" → ["Chave Pix", "Juros"]
          // Exemplo: "Chave Pix, Juros" → ["Chave Pix", "Juros"]
          // Exemplo: "Chave Pix / Juros" → ["Chave Pix", "Juros"]
          // Dividir por vírgula, ponto e vírgula, barra, " e ", ou " - "
          const partes = motivo.split(/[,;]|\s*\/\s*|\s+e\s+|\s+-\s+/i).map(p => p.trim()).filter(p => p);
          const motivosSeparados = [];
          
          partes.forEach(parte => {
            const parteTrim = parte.trim();
            if (parteTrim) {
              const parteLower = parteTrim.toLowerCase();
              if (parteLower.includes('chave') && parteLower.includes('pix') && !parteLower.includes('liberação')) {
                motivosSeparados.push('Chave Pix');
              } else if (parteLower !== 'e' && parteLower !== ',' && parteLower !== '-') {
                motivosSeparados.push(parteTrim);
              }
            }
          });
          
          return motivosSeparados.length > 0 ? motivosSeparados : [motivo];
        }
      }
      return motivo;
    });
    
    // Achatar arrays aninhados
    const resultado = [];
    normalizados.forEach(item => {
      if (Array.isArray(item)) {
        resultado.push(...item);
      } else {
        resultado.push(item);
      }
    });
    
    // Verificar se houve mudança
    const mudou = resultado.length !== motivoReduzido.length || 
                  resultado.some((n, i) => n !== motivoReduzido[i]);
    return mudou ? resultado : null;
  }
  
  // Se for string, verificar se contém "Chave Pix" junto com outros textos
  if (typeof motivoReduzido === 'string') {
    const motivoLower = motivoReduzido.trim().toLowerCase();
    
    // Se contém "chave pix" junto com outros textos
    if (motivoLower.includes('chave') && motivoLower.includes('pix') && !motivoLower.includes('liberação')) {
      // Verificar se é apenas "Chave Pix" ou variação simples
      const normalizado = normalizarParaChavePix(motivoReduzido);
      if (normalizado) {
        return normalizado;
      }
      
      // Tentar separar "Chave Pix" de outros motivos
      // Exemplo: "Chave pix e Juros" → ["Chave Pix", "Juros"]
      // Exemplo: "Chave Pix, Juros" → ["Chave Pix", "Juros"]
      // Exemplo: "Juros, Chave Pix" → ["Juros", "Chave Pix"]
      // Exemplo: "Chave Pix / Juros" → ["Chave Pix", "Juros"]
      // Exemplo: "Juros/ Chave Pix" → ["Juros", "Chave Pix"]
      
      // Dividir por vírgula, ponto e vírgula, barra, " e ", ou " - "
      const partes = motivoReduzido.split(/[,;]|\s*\/\s*|\s+e\s+|\s+-\s+/i).map(p => p.trim()).filter(p => p);
      const motivosSeparados = [];
      
      partes.forEach(parte => {
        const parteTrim = parte.trim();
        if (parteTrim) {
          const parteLower = parteTrim.toLowerCase();
          if (parteLower.includes('chave') && parteLower.includes('pix') && !parteLower.includes('liberação')) {
            motivosSeparados.push('Chave Pix');
          } else if (parteLower !== 'e' && parteLower !== ',' && parteLower !== '-') {
            // Preservar capitalização original, mas normalizar "Chave Pix" se aparecer
            motivosSeparados.push(parteTrim);
          }
        }
      });
      
      return motivosSeparados.length > 1 ? motivosSeparados : null;
    }
  }
  
  return null;
}

/**
 * Processar e normalizar motivoReduzido (pode ser string ou array)
 */
function processarMotivoReduzido(motivoReduzido) {
  if (!motivoReduzido) return null;
  
  // Primeiro, tentar processar casos onde "Chave Pix" aparece junto com outros motivos
  const resultadoComposto = processarMotivoComChavePix(motivoReduzido);
  if (resultadoComposto) {
    return resultadoComposto;
  }
  
  // Se for array, processar cada item
  if (Array.isArray(motivoReduzido)) {
    const normalizados = motivoReduzido.map(motivo => {
      if (typeof motivo === 'string') {
        const normalizado = normalizarParaChavePix(motivo);
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
    const normalizado = normalizarParaChavePix(motivoReduzido);
    return normalizado && normalizado !== motivoReduzido ? normalizado : null;
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
      console.log('   Execute sem --dry-run para aplicar as alterações');
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
