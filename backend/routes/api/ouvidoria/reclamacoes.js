/**
 * VeloHub V3 - Ouvidoria API Routes - Reclamações
 * VERSION: v2.19.0 | DATE: 2026-04-07 | AUTHOR: VeloHub Development Team
 *
 * Mudanças v2.19.0:
 * - GET /reclamacoes: filtro opcional query `produto` (campo existente `produto`, match exato)
 *
 * Mudanças v2.18.0:
 * - BACEN / N2 Pix: prazoBacen e prazoOuvidoria preenchidos automaticamente na API (2 dias corridos UTC após createdAt do registro); valores enviados pelo cliente nesses campos são ignorados
 * - PUT: recalcula prazo a partir do createdAt já persistido (mantém regra alinhada à criação)
 *
 * Mudanças v2.17.0:
 * - DELETE /reclamacoes/:id?tipo=: exclui documento na coleção correspondente (tipo obrigatório, mesmo mapeamento do PUT)
 *
 * Mudanças v2.16.0:
 * - POST/PUT: motivoReduzido persistido via utils/motivoReduzidoNormalize (sentence case pt-BR + renomeações)
 *
 * Mudanças v2.15.0:
 * - GET /reclamacoes: adicionado filtro status (resolvido / em_andamento) via Finalizado.Resolvido
 * 
 * Mudanças v2.14.0:
 * - GET /reclamacoes: adicionados filtros dataInicio, dataFim e motivo (motivoReduzido)
 * - Filtro de data usa campo correto por coleção (dataEntrada, dataEntradaN2, dataReclam, dataProcon)
 * 
 * Mudanças v2.13.0:
 * - Exibição: tipo retornado como 'N2 Pix' (antes 'Ouvidoria'/'N2') em listagens e getById
 * - getCollectionByType: adicionado case 'N2 PIX'
 * 
 * Mudanças v2.12.0:
 * - Garantir que campos de data sejam salvos como Date (não string)
 * - Função normalizarCamposDataParaDate() converte strings YYYY-MM-DD para Date
 * - Aplicado em POST (criação) e PUT (atualização) antes de persistir
 * 
 * Mudanças v2.11.0:
 * - CORRIGIDO: OUVIDORIA agora usa reclamacoes_n2Pix (reclamacoes_ouvidoria foi renomeada/descontinuada)
 * - Removidas todas as referências à collection reclamacoes_ouvidoria
 * - Busca sem filtro agora usa 5 collections (bacen, n2Pix, reclameAqui, procon, judicial)
 * - Corrige erros de contagem causados por envio de registros para collection descontinuada
 * 
 * Mudanças v2.10.0:
 * - Adicionado suporte para tipo AÇÃO JUDICIAL (PROCESSOS) na função getCollectionByType
 * - Criados índices específicos para reclamacoes_judicial (nroProcesso)
 * - Atualizada mensagem de validação para incluir PROCESSOS
 * 
 * Mudanças v2.9.0:
 * - Adicionado suporte para tipo PROCON na função getCollectionByType
 * - Criados índices específicos para reclamacoes_procon (codigoProcon)
 * - Atualizada mensagem de validação para incluir PROCON
 * 
 * Mudanças v2.8.0:
 * - Adicionado suporte para tipo RECLAME_AQUI na função getCollectionByType
 * - Atualizada mensagem de validação para incluir RECLAME_AQUI
 * 
 * Mudanças v2.7.0:
 * - Atualizado mapeamento de tipos para todas as coleções corretas:
 *   - BACEN → reclamacoes_bacen
 *   - N2 / OUVIDORIA → reclamacoes_n2Pix (reclamacoes_ouvidoria descontinuada)
 *   - Reclame Aqui → reclamacoes_reclameAqui
 *   - Procon → reclamacoes_procon
 *   - Ação Judicial (PROCESSOS) → reclamacoes_judicial
 * - Busca sem filtro agora inclui todas as 5 coleções (ouvidoria descontinuada)
 * - Índices criados para todas as coleções na inicialização
 * - Função getCollectionByType atualizada com todos os tipos corretos
 * 
 * Mudanças v2.6.0:
 * - Corrigido filtro de tipo: agora adiciona campo 'tipo' aos resultados quando há filtro
 * - Adicionado suporte para filtro "N2" (mapeado para OUVIDORIA)
 * - Adicionado suporte para filtro "RA-PROCON" (busca em reclamacoes_reclameAqui e reclamacoes_procon)
 * - Função getCollectionByType atualizada para tratar novos tipos
 * 
 * Mudanças v2.4.0:
 * - Removido campo status (usar Finalizado.Resolvido para determinar se está em andamento ou resolvido)
 * - Removido filtro idSecao
 * - Removidos filtros deletada/deletedAt (soft delete não será mais usado)
 * - Removida rota DELETE (soft delete)
 * - Removido índice de status
 * 
 * Mudanças v2.3.0:
 * - Removida rota GET /colaboradores (movida para arquivo separado colaboradores.js)
 * 
 * Mudanças v2.2.0:
 * - Implementada paginação no endpoint GET /api/ouvidoria/reclamacoes
 * - Adicionados parâmetros page e limit (padrão: page=1, limit=20)
 * - Resposta inclui total, totalPages, page e limit para controle de paginação
 * - Limite máximo de 100 itens por página para performance
 * 
 * Mudanças v2.1.0:
 * - Removidos vestígios da metodologia anterior
 * - Suporte apenas para criação de reclamações BACEN e OUVIDORIA
 * 
 * Mudanças v2.0.0:
 * - Separação em coleções: reclamacoes_bacen, reclamacoes_n2Pix
 * - Função helper getCollectionByType para obter coleção correta
 * - Índices criados para cada coleção separadamente
 * 
 * Rotas para gerenciamento de reclamações BACEN e Ouvidoria
 */

const express = require('express');
const path = require('path');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { normalizarCampoMotivoReduzido } = require(path.join(__dirname, '../../../utils/motivoReduzidoNormalize'));

/** Lista de campos que devem ser Date (não string) */
const CAMPOS_DATA = [
  'dataEntrada', 'dataEntradaN2', 'dataReclam', 'dataProcon',
  'prazoBacen', 'prazoOuvidoria', 'processoEncaminhadoData', 'dataProcessoEncerrado',
  'dataAudiencia', 'dataEntradaProcesso'
];

/**
 * Converte string de data (YYYY-MM-DD) para Date. Retorna null se inválido.
 */
const parsearDataParaDate = (valor) => {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  if (typeof valor !== 'string') return null;
  const trimmed = String(valor).trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Prazo automático Ouvidoria: data limite = 2 dias corridos (UTC) após a data de criação do registro.
 * @param {Date|string|null|undefined} createdAt
 * @returns {Date}
 */
const prazoAutomaticoDoisDiasAposCriacao = (createdAt) => {
  const base =
    createdAt instanceof Date
      ? createdAt
      : createdAt
        ? new Date(createdAt)
        : new Date();
  if (isNaN(base.getTime())) return new Date();
  const d = new Date(base.getTime());
  d.setUTCDate(d.getUTCDate() + 2);
  return d;
};

/**
 * Define prazoBacen (reclamacoes_bacen) ou prazoOuvidoria (reclamacoes_n2Pix); remove o campo da outra família se vier misturado no body.
 * @param {Record<string, unknown>} alvo — documento de insert ou objeto $set do update
 * @param {string} collectionName
 * @param {Date|string|null|undefined} createdAtRef — createdAt do registro (POST: novo; PUT: existente)
 */
const aplicarPrazoAutomaticoPorColecao = (alvo, collectionName, createdAtRef) => {
  if (!alvo || typeof alvo !== 'object') return;
  const prazo = prazoAutomaticoDoisDiasAposCriacao(createdAtRef);
  if (collectionName === 'reclamacoes_bacen') {
    alvo.prazoBacen = prazo;
    delete alvo.prazoOuvidoria;
  } else if (collectionName === 'reclamacoes_n2Pix') {
    alvo.prazoOuvidoria = prazo;
    delete alvo.prazoBacen;
  }
};

/**
 * Normaliza campos de data no objeto: converte strings para Date
 * Para OUVIDORIA/N2: dataEntradaAtendimento (legado do form) → dataEntradaN2 (schema oficial)
 */
/**
 * Se o objeto tiver a chave motivoReduzido, substitui pelo array canônico (não altera outras chaves).
 * @param {Record<string, unknown>} alvo
 */
const aplicarMotivoReduzidoNormalizado = (alvo) => {
  if (!alvo || typeof alvo !== 'object') return alvo;
  if (!Object.prototype.hasOwnProperty.call(alvo, 'motivoReduzido')) return alvo;
  const { motivos } = normalizarCampoMotivoReduzido(alvo.motivoReduzido);
  alvo.motivoReduzido = motivos;
  return alvo;
};

const normalizarCamposDataParaDate = (obj) => {
  const result = { ...obj };
  // Mapear dataEntradaAtendimento → dataEntradaN2 (schema LISTA_SCHEMAS.rb tem apenas dataEntradaN2)
  if (result.dataEntradaAtendimento != null) {
    if (!result.dataEntradaN2) {
      const val = result.dataEntradaAtendimento;
      result.dataEntradaN2 = val instanceof Date ? val : (parsearDataParaDate(val) ?? new Date(val));
    }
    delete result.dataEntradaAtendimento;
  }
  for (const campo of CAMPOS_DATA) {
    if (result[campo] != null && typeof result[campo] === 'string') {
      const dataDate = parsearDataParaDate(result[campo]);
      if (dataDate) result[campo] = dataDate;
    }
  }
  if (result.Finalizado?.dataResolucao != null && typeof result.Finalizado.dataResolucao === 'string') {
    const dataResolucao = parsearDataParaDate(result.Finalizado.dataResolucao);
    if (dataResolucao) {
      result.Finalizado = { ...result.Finalizado, dataResolucao };
    }
  }
  if (result.tentativasContato?.lista) {
    result.tentativasContato = {
      lista: result.tentativasContato.lista.map((t) => {
        if (t.data != null && typeof t.data === 'string') {
          const d = parsearDataParaDate(t.data);
          return d ? { ...t, data: d } : t;
        }
        return t;
      })
    };
  }
  // Remover telefones.principal (schema tem apenas telefones.lista)
  if (result.telefones?.principal != null) {
    const { principal, ...telefonesResto } = result.telefones;
    result.telefones = telefonesResto;
  }
  // pixStatus (legado) → pixLiberado (boolean). Liberado/Excluído/Solicitada → true; Não aplicável/vazio → false
  if (result.pixStatus !== undefined) {
    const s = String(result.pixStatus || '').toLowerCase().trim();
    result.pixLiberado = ['liberado', 'excluído', 'excluido', 'solicitada', 'solicitado'].includes(s);
    delete result.pixStatus;
  }
  if (result.pixLiberado !== undefined) {
    result.pixLiberado = result.pixLiberado === true;
  }
  return result;
};

/**
 * Obter coleção MongoDB baseado no tipo de reclamação
 * @param {Object} db - MongoDB database instance
 * @param {String} tipo - Tipo de reclamação: "BACEN", "N2", "OUVIDORIA", "RECLAME AQUI", "PROCON", "PROCESSOS" (Ação Judicial)
 * @returns {Object} MongoDB collection
 */
const getCollectionByType = (db, tipo) => {
  const tipoUpper = String(tipo || '').toUpperCase().trim();
  
  switch (tipoUpper) {
    case 'BACEN':
      return db.collection('reclamacoes_bacen');
    case 'N2':
    case 'N2 PIX':
    case 'N2 & PIX':
    case 'N2&PIX':
    case 'OUVIDORIA':
      return db.collection('reclamacoes_n2Pix');
    case 'RECLAME AQUI':
    case 'RECLAMEAQUI':
    case 'RECLAME_AQUI':
      return db.collection('reclamacoes_reclameAqui');
    case 'PROCON':
      return db.collection('reclamacoes_procon');
    case 'PROCESSOS':
    case 'JUDICIAL':
    case 'AÇÃO JUDICIAL':
    case 'ACAO JUDICIAL':
      return db.collection('reclamacoes_judicial');
    default:
      // Fallback para BACEN se tipo não especificado
      return db.collection('reclamacoes_bacen');
  }
};

/**
 * Criar índices para uma coleção
 * @param {Object} collection - MongoDB collection
 * @param {String} collectionName - Nome da coleção para logs
 */
const createIndexes = async (collection, collectionName) => {
  try {
    // Criar índice em CPF para buscas rápidas
    await collection.createIndex({ cpf: 1 });
    console.log(`✅ Índice criado em ${collectionName}: cpf`);
    
    // Criar índice em telefones.lista para buscas em telefones
    await collection.createIndex({ 'telefones.lista': 1 });
    console.log(`✅ Índice criado em ${collectionName}: telefones.lista`);
    
    // Criar índice em createdAt para ordenação
    await collection.createIndex({ createdAt: -1 });
    console.log(`✅ Índice criado em ${collectionName}: createdAt`);
    
    // Criar índice em email se existir
    await collection.createIndex({ email: 1 }, { sparse: true });
    console.log(`✅ Índice criado em ${collectionName}: email`);
  } catch (error) {
    console.error(`❌ Erro ao criar índices em ${collectionName}:`, error);
  }
};

/**
 * Inicializar rotas de reclamações
 * @param {Object} client - MongoDB client
 * @param {Function} connectToMongo - Função para conectar ao MongoDB
 * @param {Object} services - Serviços disponíveis (userActivityLogger, etc.)
 */
const initReclamacoesRoutes = (client, connectToMongo, services = {}) => {
  const { userActivityLogger } = services;

  // Criar índices MongoDB na inicialização para todas as coleções
  (async () => {
    try {
      if (client) {
        await connectToMongo();
        const db = client.db('hub_ouvidoria');
        
        // Criar índices para cada coleção
        await createIndexes(db.collection('reclamacoes_bacen'), 'reclamacoes_bacen');
        await createIndexes(db.collection('reclamacoes_n2Pix'), 'reclamacoes_n2Pix');
        await createIndexes(db.collection('reclamacoes_reclameAqui'), 'reclamacoes_reclameAqui');
        await createIndexes(db.collection('reclamacoes_procon'), 'reclamacoes_procon');
        await createIndexes(db.collection('reclamacoes_judicial'), 'reclamacoes_judicial');
        
        // Criar índices específicos para Reclame Aqui
        const reclameAquiCollection = db.collection('reclamacoes_reclameAqui');
        try {
          await reclameAquiCollection.createIndex({ cpfRepetido: 1 });
          console.log('✅ Índice criado em reclamacoes_reclameAqui: cpfRepetido');
          await reclameAquiCollection.createIndex({ idEntrada: 1 }); // Não único, pode haver duplicatas
          console.log('✅ Índice criado em reclamacoes_reclameAqui: idEntrada');
        } catch (error) {
          console.error('❌ Erro ao criar índices específicos para reclamacoes_reclameAqui:', error);
        }
        
        // Criar índices específicos para Procon
        const proconCollection = db.collection('reclamacoes_procon');
        try {
          await proconCollection.createIndex({ codigoProcon: 1 });
          console.log('✅ Índice criado em reclamacoes_procon: codigoProcon');
        } catch (error) {
          console.error('❌ Erro ao criar índices específicos para reclamacoes_procon:', error);
        }
        
        // Criar índices específicos para Ação Judicial
        const processosCollection = db.collection('reclamacoes_judicial');
        try {
          await processosCollection.createIndex({ nroProcesso: 1 });
          console.log('✅ Índice criado em reclamacoes_judicial: nroProcesso');
        } catch (error) {
          console.error('❌ Erro ao criar índices específicos para reclamacoes_judicial:', error);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao criar índices MongoDB:', error);
    }
  })();

  /**
   * GET /api/ouvidoria/reclamacoes
   * Buscar todas as reclamações ou filtrar por query params
   * Se tipo não especificado, busca em todas as coleções
   */
  router.get('/', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado',
          data: []
        });
      }

      await connectToMongo();
      const db = client.db('hub_ouvidoria');

      // Filtros opcionais
      const { cpf, colaboradorNome, tipo, dataInicio, dataFim, motivo, produto, status, page = '1', limit = '20' } = req.query;

      const baseFilter = {};
      if (cpf) {
        baseFilter.cpf = { $regex: String(cpf).replace(/\D/g, ''), $options: 'i' };
      }
      if (colaboradorNome) {
        baseFilter.responsavel = { $regex: String(colaboradorNome), $options: 'i' };
      }
      if (motivo && String(motivo).trim()) {
        baseFilter.motivoReduzido = String(motivo).trim();
      }
      if (produto && String(produto).trim()) {
        baseFilter.produto = String(produto).trim();
      }
      if (status && String(status).trim()) {
        const statusVal = String(status).trim().toLowerCase();
        if (statusVal === 'resolvido') {
          baseFilter['Finalizado.Resolvido'] = true;
        } else if (statusVal === 'em_andamento' || statusVal === 'emandamento') {
          baseFilter['Finalizado.Resolvido'] = { $ne: true };
        }
      }

      const dataInicioDate = dataInicio ? new Date(String(dataInicio) + 'T00:00:00.000Z') : null;
      const dataFimDate = dataFim ? new Date(String(dataFim) + 'T23:59:59.999Z') : null;

      const criarFiltroDataPorCollection = (collectionName) => {
        if (!dataInicioDate || !dataFimDate) return {};
        if (collectionName === 'reclamacoes_n2Pix') {
          return { $or: [{ dataEntradaN2: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } }, { dataEntradaN2: { $exists: true, $ne: null, $type: 'string', $gte: dataInicio, $lte: dataFim } }] };
        }
        if (collectionName === 'reclamacoes_bacen' || collectionName === 'reclamacoes_judicial') {
          return { $or: [{ dataEntrada: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } }, { dataEntrada: { $exists: true, $ne: null, $type: 'string', $gte: dataInicio, $lte: dataFim } }] };
        }
        if (collectionName === 'reclamacoes_reclameAqui') {
          return { $or: [{ dataReclam: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } }, { dataReclam: { $exists: true, $ne: null, $type: 'string', $gte: dataInicio, $lte: dataFim } }] };
        }
        if (collectionName === 'reclamacoes_procon') {
          return { $or: [{ dataProcon: { $exists: true, $ne: null, $gte: dataInicioDate, $lte: dataFimDate } }, { dataProcon: { $exists: true, $ne: null, $type: 'string', $gte: dataInicio, $lte: dataFim } }] };
        }
        return { createdAt: { $gte: dataInicioDate, $lte: dataFimDate } };
      };

      const mesclarFilter = (collectionName) => {
        const f = { ...baseFilter };
        const dataFiltro = criarFiltroDataPorCollection(collectionName);
        if (Object.keys(dataFiltro).length > 0) {
          f.$and = f.$and || [];
          f.$and.push(dataFiltro);
        }
        return f;
      };

      // Parâmetros de paginação
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20)); // Máximo 100, mínimo 1
      const skip = (pageNum - 1) * limitNum;

      let reclamacoes = [];
      let totalCount = 0;

      if (tipo) {
        const tipoUpper = String(tipo).toUpperCase().trim();
        const collection = getCollectionByType(db, tipo);
        const collectionName = tipoUpper === 'BACEN' ? 'reclamacoes_bacen'
          : (tipoUpper === 'N2' || tipoUpper === 'N2 PIX' || tipoUpper === 'OUVIDORIA') ? 'reclamacoes_n2Pix'
          : (tipoUpper === 'RECLAME AQUI' || tipoUpper === 'RECLAME_AQUI' || tipoUpper === 'RECLAMEAQUI') ? 'reclamacoes_reclameAqui'
          : tipoUpper === 'PROCON' ? 'reclamacoes_procon'
          : 'reclamacoes_judicial';
        const filter = mesclarFilter(collectionName);

        // Buscar na coleção específica
        totalCount = await collection.countDocuments(filter);
        reclamacoes = await collection
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .toArray();
        
        // Mapear tipo para exibição (normalizar nomes)
        let tipoParaAdicionar = tipoUpper;
        if (tipoUpper === 'N2' || tipoUpper === 'N2 & PIX' || tipoUpper === 'N2&PIX' || tipoUpper === 'N2 PIX') {
          tipoParaAdicionar = 'N2 Pix';
        } else if (tipoUpper === 'RECLAME AQUI' || tipoUpper === 'RECLAMEAQUI') {
          tipoParaAdicionar = 'Reclame Aqui';
        } else if (tipoUpper === 'PROCESSOS' || tipoUpper === 'JUDICIAL' || tipoUpper === 'AÇÃO JUDICIAL' || tipoUpper === 'ACAO JUDICIAL') {
          tipoParaAdicionar = 'Ação Judicial';
        } else if (tipoUpper === 'OUVIDORIA') {
          tipoParaAdicionar = 'N2 Pix';
        } else if (tipoUpper === 'PROCON') {
          tipoParaAdicionar = 'Procon';
        }
        
        // Adicionar tipo aos resultados
        reclamacoes = reclamacoes.map(r => ({ ...r, tipo: tipoParaAdicionar }));
      } else {
        // Buscar em todas as coleções (5 collections - reclamacoes_ouvidoria descontinuada/renomeada para n2Pix)
        const [bacen, n2Pix, reclameAqui, procon, judicial] = await Promise.all([
          db.collection('reclamacoes_bacen').find(mesclarFilter('reclamacoes_bacen')).toArray(),
          db.collection('reclamacoes_n2Pix').find(mesclarFilter('reclamacoes_n2Pix')).toArray(),
          db.collection('reclamacoes_reclameAqui').find(mesclarFilter('reclamacoes_reclameAqui')).toArray(),
          db.collection('reclamacoes_procon').find(mesclarFilter('reclamacoes_procon')).toArray(),
          db.collection('reclamacoes_judicial').find(mesclarFilter('reclamacoes_judicial')).toArray()
        ]);
        
        // Adicionar tipo aos resultados (n2Pix inclui N2 e OUVIDORIA - collection unificada)
        const todas = [
          ...bacen.map(r => ({ ...r, tipo: 'BACEN' })),
          ...n2Pix.map(r => ({ ...r, tipo: 'N2 Pix' })),
          ...reclameAqui.map(r => ({ ...r, tipo: 'Reclame Aqui' })),
          ...procon.map(r => ({ ...r, tipo: 'Procon' })),
          ...judicial.map(r => ({ ...r, tipo: 'Ação Judicial' }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        totalCount = todas.length;
        reclamacoes = todas.slice(skip, skip + limitNum);
      }

      const totalPages = Math.ceil(totalCount / limitNum);

      console.log(`✅ Reclamações encontradas: ${reclamacoes.length} de ${totalCount} (página ${pageNum}/${totalPages})`);

      res.json({
        success: true,
        data: reclamacoes,
        count: reclamacoes.length,
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: totalPages
      });
    } catch (error) {
      console.error('❌ Erro ao buscar reclamações:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar reclamações',
        error: error.message
      });
    }
  });

  /**
   * GET /api/ouvidoria/reclamacoes/:id
   * Buscar reclamação por ID
   * Busca em todas as coleções se tipo não especificado
   */
  router.get('/:id', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado'
        });
      }

      await connectToMongo();
      const db = client.db('hub_ouvidoria');

      const { id } = req.params;
      const { tipo } = req.query;
      
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }

      let reclamacao = null;

      if (tipo) {
        // Buscar apenas na coleção específica
        const collection = getCollectionByType(db, tipo);
        reclamacao = await collection.findOne({ _id: new ObjectId(id) });
      } else {
        // Buscar em todas as coleções (5 collections - reclamacoes_ouvidoria descontinuada)
        const [bacen, n2Pix, reclameAqui, procon, judicial] = await Promise.all([
          db.collection('reclamacoes_bacen').findOne({ _id: new ObjectId(id) }),
          db.collection('reclamacoes_n2Pix').findOne({ _id: new ObjectId(id) }),
          db.collection('reclamacoes_reclameAqui').findOne({ _id: new ObjectId(id) }),
          db.collection('reclamacoes_procon').findOne({ _id: new ObjectId(id) }),
          db.collection('reclamacoes_judicial').findOne({ _id: new ObjectId(id) })
        ]);
        
        reclamacao = bacen || n2Pix || reclameAqui || procon || judicial;
        if (reclamacao) {
          // Adicionar tipo ao resultado
          if (bacen) reclamacao.tipo = 'BACEN';
          else if (n2Pix) reclamacao.tipo = 'N2 Pix';
          else if (reclameAqui) reclamacao.tipo = 'Reclame Aqui';
          else if (procon) reclamacao.tipo = 'Procon';
          else if (judicial) reclamacao.tipo = 'Ação Judicial';
        }
      }

      if (!reclamacao) {
        return res.status(404).json({
          success: false,
          message: 'Reclamação não encontrada'
        });
      }

      res.json({
        success: true,
        data: reclamacao
      });
    } catch (error) {
      console.error('❌ Erro ao buscar reclamação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar reclamação',
        error: error.message
      });
    }
  });

  /**
   * POST /api/ouvidoria/reclamacoes
   * Criar nova reclamação
   * Salva na coleção correta baseado no tipo
   */
  router.post('/', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado'
        });
      }

      await connectToMongo();
      const db = client.db('hub_ouvidoria');

      const dados = req.body;

      // Validar tipo obrigatório
      if (!dados.tipo) {
        return res.status(400).json({
          success: false,
          message: 'Campo obrigatório: tipo (BACEN, OUVIDORIA, RECLAME_AQUI, PROCON ou PROCESSOS/AÇÃO JUDICIAL)'
        });
      }


      // Validar campos obrigatórios básicos
      if (!dados.nome || !dados.cpf) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios: nome, cpf'
        });
      }

      // Normalizar CPF (apenas números)
      dados.cpf = String(dados.cpf).replace(/\D/g, '');
      
      if (dados.cpf.length !== 11) {
        return res.status(400).json({
          success: false,
          message: 'CPF deve ter 11 dígitos'
        });
      }

      // Obter coleção correta baseado no tipo
      const collection = getCollectionByType(db, dados.tipo);
      
      // Log para confirmar coleção usada
      console.log(`📝 [Reclamações API] Tipo: ${dados.tipo} → Coleção: ${collection.collectionName}`);

      // Normalizar estrutura de telefones (compatibilidade com dados antigos e novos)
      if (Array.isArray(dados.telefones)) {
        // Estrutura antiga: array direto
        dados.telefones = { lista: dados.telefones };
      } else if (dados.telefones && !dados.telefones.lista) {
        // Se for objeto mas não tiver lista, criar lista vazia
        dados.telefones = { lista: [] };
      } else if (!dados.telefones) {
        // Se não existir, criar estrutura padrão
        dados.telefones = { lista: [] };
      }

      // Normalizar estrutura de tentativasContato (compatibilidade com dados antigos e novos)
      if (Array.isArray(dados.tentativasContato)) {
        // Estrutura antiga: array direto
        dados.tentativasContato = { lista: dados.tentativasContato };
      } else if (dados.tentativasContato && !dados.tentativasContato.lista) {
        // Se for objeto mas não tiver lista, criar lista vazia
        dados.tentativasContato = { lista: [] };
      } else if (!dados.tentativasContato) {
        // Se não existir, criar estrutura padrão
        dados.tentativasContato = { lista: [] };
      }

      // Preparar documento (remover tipo do documento pois já está na coleção)
      const { tipo, ...dadosSemTipo } = dados;
      const documento = aplicarMotivoReduzidoNormalizado(
        normalizarCamposDataParaDate({
          ...dadosSemTipo,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      aplicarPrazoAutomaticoPorColecao(documento, collection.collectionName, documento.createdAt);

      const resultado = await collection.insertOne(documento);

      console.log(`✅ Reclamação criada na coleção ${collection.collectionName}: ${resultado.insertedId}`);

      // Log de atividade se disponível
      if (userActivityLogger && dados.responsavel) {
        try {
          await userActivityLogger.log({
            colaboradorNome: dados.responsavel,
            action: 'reclamacao_criada',
            details: {
              reclamacaoId: resultado.insertedId.toString(),
              tipo: tipo,
              cpf: dados.cpf.substring(0, 3) + '***' + dados.cpf.substring(9), // CPF parcial para privacidade
            },
            source: 'ouvidoria',
          });
        } catch (logError) {
          console.error('Erro ao registrar log:', logError);
        }
      }

      res.status(201).json({
        success: true,
        message: 'Reclamação criada com sucesso',
        data: {
          _id: resultado.insertedId,
          tipo: tipo,
          ...documento
        }
      });
    } catch (error) {
      console.error('❌ Erro ao criar reclamação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar reclamação',
        error: error.message
      });
    }
  });

  /**
   * PUT /api/ouvidoria/reclamacoes/:id
   * Atualizar reclamação
   * Requer tipo como query param ou no body
   */
  router.put('/:id', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado'
        });
      }

      await connectToMongo();
      const db = client.db('hub_ouvidoria');

      const { id } = req.params;
      const dados = req.body;
      const { tipo } = req.query || dados.tipo;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }

      if (!tipo) {
        return res.status(400).json({
          success: false,
          message: 'Tipo é obrigatório (query param ou body)'
        });
      }

      // Obter coleção correta
      const collection = getCollectionByType(db, tipo);

      const existente = await collection.findOne({ _id: new ObjectId(id) });
      if (!existente) {
        return res.status(404).json({
          success: false,
          message: 'Reclamação não encontrada',
        });
      }

      // Normalizar CPF se fornecido
      if (dados.cpf) {
        dados.cpf = String(dados.cpf).replace(/\D/g, '');
      }

      // Normalizar estrutura de telefones (compatibilidade)
      if (Array.isArray(dados.telefones)) {
        dados.telefones = { lista: dados.telefones };
      } else if (dados.telefones && !dados.telefones.lista) {
        dados.telefones = { lista: [] };
      }

      // Normalizar estrutura de tentativasContato (compatibilidade)
      if (Array.isArray(dados.tentativasContato)) {
        dados.tentativasContato = { lista: dados.tentativasContato };
      } else if (dados.tentativasContato && !dados.tentativasContato.lista) {
        dados.tentativasContato = { lista: [] };
      }

      // Remover tipo do updateDoc se presente (não deve ser atualizado)
      const { tipo: tipoRemovido, ...dadosSemTipo } = dados;
      
      // Atualizar documento (normalizar datas para Date)
      const updateDoc = aplicarMotivoReduzidoNormalizado(
        normalizarCamposDataParaDate({
          ...dadosSemTipo,
          updatedAt: new Date(),
        })
      );

      aplicarPrazoAutomaticoPorColecao(updateDoc, collection.collectionName, existente.createdAt);

      const resultado = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateDoc }
      );

      if (resultado.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Reclamação não encontrada'
        });
      }

      console.log(`✅ Reclamação atualizada: ${id}`);

      res.json({
        success: true,
        message: 'Reclamação atualizada com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar reclamação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar reclamação',
        error: error.message
      });
    }
  });

  /**
   * DELETE /api/ouvidoria/reclamacoes/:id
   * Excluir reclamação (documento removido da coleção do tipo informado)
   * Query: tipo (obrigatório) — mesmo conjunto de valores aceitos em PUT
   */
  router.delete('/:id', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({
          success: false,
          message: 'MongoDB não configurado'
        });
      }

      await connectToMongo();
      const db = client.db('hub_ouvidoria');

      const { id } = req.params;
      const { tipo } = req.query;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }

      if (!tipo || !String(tipo).trim()) {
        return res.status(400).json({
          success: false,
          message: 'Tipo é obrigatório (query param tipo)'
        });
      }

      const collection = getCollectionByType(db, tipo);
      const resultado = await collection.deleteOne({ _id: new ObjectId(id) });

      if (resultado.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Reclamação não encontrada na coleção do tipo informado'
        });
      }

      console.log(`✅ Reclamação excluída: ${id} (tipo: ${tipo})`);

      res.json({
        success: true,
        message: 'Reclamação excluída com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao excluir reclamação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao excluir reclamação',
        error: error.message
      });
    }
  });

  return router;
};

module.exports = initReclamacoesRoutes;
