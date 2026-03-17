/**
 * VeloHub V3 - SociaisMetricas Model
 * VERSION: v1.0.0 | DATE: 2026-03-17 | AUTHOR: VeloHub Development Team
 *
 * Model para tabulações de redes sociais (console_sociais.sociais_metricas)
 * Adaptado do natralha para usar client e connectToMongo do VeloHub
 */

const DB_NAME = process.env.CONSOLE_SOCIAIS_DB || 'console_sociais';
const COLLECTION_NAME = 'sociais_metricas';

const validNetworks = ['WhatsApp', 'Instagram', 'Facebook', 'TikTok', 'Messenger', 'YouTube', 'PlayStore'];
const validReasons = ['Produto', 'Suporte', 'Bug', 'Elogio', 'Reclamação', 'Oculto', 'Outro'];
const validSentiments = ['Positivo', 'Neutro', 'Negativo'];

/**
 * Cria instância do SociaisMetricas com client e connectToMongo
 * @param {Object} client - MongoDB client
 * @param {Function} connectToMongo - Função para conectar ao MongoDB
 */
function createSociaisMetricas(client, connectToMongo) {
  return {
    async getCollection() {
      await connectToMongo();
      return client.db(DB_NAME).collection(COLLECTION_NAME);
    },

    async create(tabulationData) {
      try {
        const collection = await this.getCollection();

        if (!tabulationData.clientName || !tabulationData.socialNetwork || !tabulationData.messageText) {
          return { success: false, error: 'Campos obrigatórios: clientName, socialNetwork, messageText' };
        }
        if (!validNetworks.includes(tabulationData.socialNetwork)) {
          return { success: false, error: `socialNetwork deve ser um dos seguintes: ${validNetworks.join(', ')}` };
        }
        if (tabulationData.contactReason && !validReasons.includes(tabulationData.contactReason)) {
          return { success: false, error: `contactReason deve ser um dos seguintes: ${validReasons.join(', ')}` };
        }
        if (tabulationData.sentiment && !validSentiments.includes(tabulationData.sentiment)) {
          return { success: false, error: `sentiment deve ser um dos seguintes: ${validSentiments.join(', ')}` };
        }
        if (tabulationData.socialNetwork === 'PlayStore' && !tabulationData.rating) {
          return { success: false, error: 'rating é obrigatório para PlayStore' };
        }

        let ratingValue = null;
        if (tabulationData.rating !== null && tabulationData.rating !== undefined && tabulationData.rating !== '') {
          ratingValue = typeof tabulationData.rating === 'string' ? parseInt(tabulationData.rating, 10) : Number(tabulationData.rating);
          if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
            return { success: false, error: 'rating deve ser um número entre 1 e 5' };
          }
        }

        let createdAtDate = new Date();
        if (tabulationData.createdAt) {
          const dateString = tabulationData.createdAt;
          if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            createdAtDate = new Date(`${dateString}T00:00:00`);
            if (isNaN(createdAtDate.getTime())) {
              const [y, m, d] = dateString.split('-');
              createdAtDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 0, 0, 0, 0);
            }
          } else {
            const d = new Date(dateString);
            if (!isNaN(d.getTime())) createdAtDate = d;
          }
        }

        const tabulation = {
          clientName: tabulationData.clientName,
          socialNetwork: tabulationData.socialNetwork,
          messageText: tabulationData.messageText,
          rating: ratingValue,
          contactReason: tabulationData.contactReason || null,
          sentiment: tabulationData.sentiment || null,
          directedCenter: tabulationData.directedCenter !== undefined ? Boolean(tabulationData.directedCenter) : false,
          link: tabulationData.link || null,
          createdAt: createdAtDate,
          updatedAt: new Date()
        };

        const result = await collection.insertOne(tabulation);
        return { success: true, data: { ...tabulation, _id: result.insertedId }, message: 'Tabulação criada com sucesso' };
      } catch (error) {
        console.error('❌ [SociaisMetricas] create:', error);
        return { success: false, error: `Erro ao criar tabulação: ${error.message}` };
      }
    },

    async getAll(filters = {}) {
      try {
        const collection = await this.getCollection();
        const query = {};
        if (filters.socialNetwork && Array.isArray(filters.socialNetwork) && filters.socialNetwork.length > 0) {
          query.socialNetwork = { $in: filters.socialNetwork };
        }
        if (filters.contactReason && Array.isArray(filters.contactReason) && filters.contactReason.length > 0) {
          query.contactReason = { $in: filters.contactReason };
        }
        if (filters.sentiment && Array.isArray(filters.sentiment) && filters.sentiment.length > 0) {
          query.sentiment = { $in: filters.sentiment };
        }
        if (filters.dateFrom || filters.dateTo) {
          query.createdAt = {};
          if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
          if (filters.dateTo) {
            const d = new Date(filters.dateTo);
            d.setHours(23, 59, 59, 999);
            query.createdAt.$lte = d;
          }
        }
        const tabulations = await collection.find(query).sort({ createdAt: -1 }).toArray();
        return { success: true, data: tabulations, count: tabulations.length };
      } catch (error) {
        console.error('❌ [SociaisMetricas] getAll:', error);
        return { success: false, error: 'Erro interno do servidor' };
      }
    },

    async getMetrics(filters = {}) {
      try {
        const collection = await this.getCollection();
        const query = {};
        if (filters.socialNetwork && Array.isArray(filters.socialNetwork) && filters.socialNetwork.length > 0) {
          query.socialNetwork = { $in: filters.socialNetwork };
        }
        if (filters.contactReason && Array.isArray(filters.contactReason) && filters.contactReason.length > 0) {
          query.contactReason = { $in: filters.contactReason };
        }
        if (filters.dateFrom || filters.dateTo) {
          query.createdAt = {};
          if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
          if (filters.dateTo) {
            const d = new Date(filters.dateTo);
            d.setHours(23, 59, 59, 999);
            query.createdAt.$lte = d;
          }
        }
        const total = await collection.countDocuments(query);
        const positive = await collection.countDocuments({ ...query, sentiment: 'Positivo' });
        const negative = await collection.countDocuments({ ...query, sentiment: 'Negativo' });
        const neutral = await collection.countDocuments({ ...query, sentiment: 'Neutro' });
        const networkCounts = await collection.aggregate([
          { $match: query },
          { $group: { _id: '$socialNetwork', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 1 }
        ]).toArray();
        const mostActiveNetwork = networkCounts.length > 0 ? networkCounts[0]._id : null;
        const positivePercent = total > 0 ? parseFloat(((positive / total) * 100).toFixed(1)) : 0;
        return {
          success: true,
          data: {
            totalContacts: total,
            positivePercent,
            mostActiveNetwork,
            sentimentBreakdown: { positive, negative, neutral }
          }
        };
      } catch (error) {
        console.error('❌ [SociaisMetricas] getMetrics:', error);
        return { success: false, error: 'Erro interno do servidor' };
      }
    },

    async getChartData(filters = {}) {
      try {
        const collection = await this.getCollection();
        const query = {};
        if (filters.socialNetwork && Array.isArray(filters.socialNetwork) && filters.socialNetwork.length > 0) {
          query.socialNetwork = { $in: filters.socialNetwork };
        }
        if (filters.contactReason && Array.isArray(filters.contactReason) && filters.contactReason.length > 0) {
          query.contactReason = { $in: filters.contactReason };
        }
        if (filters.dateFrom || filters.dateTo) {
          query.createdAt = {};
          if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
          if (filters.dateTo) {
            const d = new Date(filters.dateTo);
            d.setHours(23, 59, 59, 999);
            query.createdAt.$lte = d;
          }
        }
        const networkData = await collection.aggregate([
          { $match: query },
          { $group: { _id: '$socialNetwork', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]).toArray();
        const reasonData = await collection.aggregate([
          { $match: query },
          { $group: { _id: '$contactReason', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]).toArray();
        return {
          success: true,
          data: {
            networkVolume: networkData.map(i => ({ socialNetwork: i._id, count: i.count })),
            reasonFrequency: reasonData.map(i => ({ reason: i._id, count: i.count }))
          }
        };
      } catch (error) {
        console.error('❌ [SociaisMetricas] getChartData:', error);
        return { success: false, error: 'Erro interno do servidor' };
      }
    },

    async getById(id) {
      try {
        const collection = await this.getCollection();
        const { ObjectId } = require('mongodb');
        const tabulation = await collection.findOne({ _id: new ObjectId(id) });
        if (!tabulation) return { success: false, error: 'Tabulação não encontrada' };
        return { success: true, data: tabulation };
      } catch (error) {
        console.error('❌ [SociaisMetricas] getById:', error);
        return { success: false, error: 'Erro interno do servidor' };
      }
    },

    async update(id, updateData) {
      try {
        const collection = await this.getCollection();
        const { ObjectId } = require('mongodb');
        if (updateData.socialNetwork && !validNetworks.includes(updateData.socialNetwork)) {
          return { success: false, error: `socialNetwork deve ser um dos seguintes: ${validNetworks.join(', ')}` };
        }
        if (updateData.contactReason && !validReasons.includes(updateData.contactReason)) {
          return { success: false, error: `contactReason deve ser um dos seguintes: ${validReasons.join(', ')}` };
        }
        if (updateData.sentiment && !validSentiments.includes(updateData.sentiment)) {
          return { success: false, error: `sentiment deve ser um dos seguintes: ${validSentiments.join(', ')}` };
        }
        const updateDoc = { ...updateData, updatedAt: new Date() };
        const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateDoc });
        if (result.matchedCount === 0) return { success: false, error: 'Tabulação não encontrada' };
        return { success: true, message: 'Tabulação atualizada com sucesso' };
      } catch (error) {
        console.error('❌ [SociaisMetricas] update:', error);
        return { success: false, error: 'Erro interno do servidor' };
      }
    },

    async delete(id) {
      try {
        const collection = await this.getCollection();
        const { ObjectId } = require('mongodb');
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) return { success: false, error: 'Tabulação não encontrada' };
        return { success: true, message: 'Tabulação deletada com sucesso' };
      } catch (error) {
        console.error('❌ [SociaisMetricas] delete:', error);
        return { success: false, error: 'Erro interno do servidor' };
      }
    },

    async getRatingAverage(filters = {}) {
      try {
        const collection = await this.getCollection();
        const query = { rating: { $exists: true, $ne: null, $nin: [0, '', '0'] } };
        if (filters.socialNetwork) {
          if (Array.isArray(filters.socialNetwork) && filters.socialNetwork.length > 0) {
            query.socialNetwork = { $in: filters.socialNetwork };
          } else if (typeof filters.socialNetwork === 'string' && filters.socialNetwork !== '') {
            query.socialNetwork = filters.socialNetwork;
          }
        }
        if (filters.dateFrom || filters.dateTo) {
          query.createdAt = {};
          if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
          if (filters.dateTo) {
            const d = new Date(filters.dateTo);
            d.setHours(23, 59, 59, 999);
            query.createdAt.$lte = d;
          }
        }
        const result = await collection.aggregate([
          { $match: query },
          { $addFields: {
            ratingNumber: {
              $cond: {
                if: { $eq: [{ $type: '$rating' }, 'string'] },
                then: { $cond: { if: { $in: ['$rating', ['1', '2', '3', '4', '5']] }, then: { $toInt: '$rating' }, else: null } },
                else: { $cond: { if: { $and: [{ $gte: ['$rating', 1] }, { $lte: ['$rating', 5] }] }, then: '$rating', else: null } }
              }
            }
          }},
          { $match: { ratingNumber: { $ne: null, $gte: 1, $lte: 5 } } },
          { $group: { _id: null, average: { $avg: '$ratingNumber' }, count: { $sum: 1 }, total: { $sum: '$ratingNumber' } } }
        ]).toArray();
        if (result.length === 0 || result[0].count === 0) {
          return { success: true, data: { average: null, count: 0, total: 0 } };
        }
        return {
          success: true,
          data: {
            average: parseFloat(result[0].average.toFixed(2)),
            count: result[0].count,
            total: result[0].total
          }
        };
      } catch (error) {
        console.error('❌ [SociaisMetricas] getRatingAverage:', error);
        return { success: false, error: 'Erro interno do servidor' };
      }
    }
  };
}

module.exports = createSociaisMetricas;
