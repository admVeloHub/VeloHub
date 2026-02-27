/**
 * VeloHub V3 - Ouvidoria API Routes - Reclamações
 * VERSION: v2.5.1 | DATE: 2026-02-26 | AUTHOR: VeloHub Development Team
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
const router = express.Router();
const { ObjectId } = require('mongodb');

/**
 * Obter coleção MongoDB baseado no tipo de reclamação
 * @param {Object} db - MongoDB database instance
 * @param {String} tipo - Tipo de reclamação: "BACEN", "OUVIDORIA"
 * @returns {Object} MongoDB collection
 */
const getCollectionByType = (db, tipo) => {
  const tipoUpper = String(tipo || '').toUpperCase();
  
  switch (tipoUpper) {
    case 'BACEN':
      return db.collection('reclamacoes_bacen');
    case 'OUVIDORIA':
      return db.collection('reclamacoes_n2Pix');
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
      const { cpf, colaboradorNome, tipo, page = '1', limit = '20' } = req.query;
      const filter = {};
      
      if (cpf) {
        filter.cpf = { $regex: String(cpf).replace(/\D/g, ''), $options: 'i' };
      }
      if (colaboradorNome) {
        filter.responsavel = { $regex: String(colaboradorNome), $options: 'i' };
      }

      // Parâmetros de paginação
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20)); // Máximo 100, mínimo 1
      const skip = (pageNum - 1) * limitNum;

      let reclamacoes = [];
      let totalCount = 0;

      if (tipo) {
        // Buscar apenas na coleção específica
        const collection = getCollectionByType(db, tipo);
        totalCount = await collection.countDocuments(filter);
        reclamacoes = await collection
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .toArray();
      } else {
        // Buscar em todas as coleções
        const [bacen, ouvidoria] = await Promise.all([
          db.collection('reclamacoes_bacen').find(filter).toArray(),
          db.collection('reclamacoes_n2Pix').find(filter).toArray()
        ]);
        
        // Adicionar tipo aos resultados
        const todas = [
          ...bacen.map(r => ({ ...r, tipo: 'BACEN' })),
          ...ouvidoria.map(r => ({ ...r, tipo: 'OUVIDORIA' }))
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
        // Buscar em todas as coleções
        const [bacen, ouvidoria] = await Promise.all([
          db.collection('reclamacoes_bacen').findOne({ _id: new ObjectId(id) }),
          db.collection('reclamacoes_n2Pix').findOne({ _id: new ObjectId(id) })
        ]);
        
        reclamacao = bacen || ouvidoria;
        if (reclamacao) {
          // Adicionar tipo ao resultado
          if (bacen) reclamacao.tipo = 'BACEN';
          else if (ouvidoria) reclamacao.tipo = 'OUVIDORIA';
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
          message: 'Campo obrigatório: tipo (BACEN ou OUVIDORIA)'
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
      const documento = {
        ...dadosSemTipo,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const resultado = await collection.insertOne(documento);

      console.log(`✅ Reclamação criada: ${resultado.insertedId}`);

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
      
      // Atualizar documento
      const updateDoc = {
        ...dadosSemTipo,
        updatedAt: new Date(),
      };

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



  return router;
};

module.exports = initReclamacoesRoutes;
