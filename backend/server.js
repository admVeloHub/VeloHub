/**
 * VeloHub V3 - Backend Server
 * VERSION: v2.46.1 | DATE: 2026-02-23 | AUTHOR: VeloHub Development Team
 * 
 * Mudanças v2.46.1:
 * - Corrigido caminho para arquivos estáticos com fallback automático
 * - No Docker/produção: public está em ./public (mesmo diretório)
 * - No desenvolvimento local: tenta ../public se ./public não existir
 * - Adicionados logs de diagnóstico para verificar existência de arquivos estáticos
 * 
 * Mudanças v2.46.0:
 * - Corrigido caminho para arquivos estáticos (public está um nível acima do backend)
 * - Adicionados logs de diagnóstico para verificar existência de arquivos estáticos
 * - Corrigido caminho do index.html para apontar para ../public/index.html
 * 
 * Mudanças v2.45.1:
 * 
 * Mudanças v2.45.1:
 * - Corrigido tratamento de erros no endpoint /api/pilulas/list
 * - Adicionado tratamento específico para erro ao listar arquivos do bucket
 * - Melhorados logs de diagnóstico com informações de variáveis de ambiente
 * - Adicionada validação de erro na listagem de arquivos antes de processar
 * 
 * Mudanças v2.45.0:
 * - Adicionado endpoint GET /api/pilulas/list para listar imagens de pílulas
 * - Melhorado tratamento de erros no endpoint /api/pilulas/list
 * - Adicionada verificação de existência do bucket antes de listar arquivos
 * - Adicionada validação de inicialização do Storage antes de usar
 * - Melhorados logs de erro para facilitar diagnóstico em produção
 * 
 * Mudanças v2.44.0:
 * - CRÍTICO: Melhorada busca de usuário no endpoint /api/auth/validate-access
 * - Adicionada busca com múltiplas variações (case-insensitive, campos alternativos)
 * - Adicionados logs detalhados para debug de problemas de login
 * - Melhorada validação de acesso ao VeloHub (verifica múltiplas variações do campo)
 * - Corrigido uso de normalizedEmail em todas as buscas para manter consistência
 * 
 * Mudanças v2.43.1:
 * - Removida instrumentação de debug do endpoint PUT /api/velo-news/:id/comment
 * 
 * Mudanças v2.43.0:
 * - Adicionado endpoint PUT /api/velo-news/:id/comment para adicionar comentários ao thread
 * - Modificado endpoint GET /api/velo-news para incluir campo thread no mapeamento
 * 
 * Mudanças v2.42.0:
 * 
 * Mudanças v2.42.0:
 * - Corrigida porta padrão de 8090 para 8080 (padrão Cloud Run)
 * - Cloud Run usa PORT=8080 automaticamente, desenvolvimento local pode usar outra porta via .env
 * 
 * Mudanças v2.41.0:
 * - Adicionadas dependências faltantes: @google-cloud/storage e google-auth-library
 * - Tornado carregamento de config-local condicional (apenas em desenvolvimento)
 * - Melhorado tratamento de erros no carregamento de serviços (servidor não encerra mais)
 * - Servidor agora inicia mesmo se alguns serviços falharem ao carregar
 * 
 * Mudanças v2.40.0:
 * - Atualizado endpoint confirm-upload para tornar arquivos públicos permanentemente ao invés de gerar signed URLs
 * - Removido endpoint get-read-url (não é mais necessário com arquivos públicos)
 * - Arquivos agora são tornados públicos após upload bem-sucedido
 * - URLs públicas permanentes são retornadas e salvas no MongoDB
 * 
 * Mudanças v2.39.0:
 * - Corrigido bucket de anexos do chat: agora usa GCS_BUCKET_CHAT (velochat_anexos) ao invés de GCS_BUCKET_NAME2
 * - Corrigida estrutura de pastas: removido prefixo velochat_anexos/ (pastas agora são imagens, videos, documentos, audios)
 * - Adicionado suporte para mediaType 'audio' → pasta 'audios'
 * - GCS_BUCKET_NAME2 mantido para outras mídias do VeloHub (fotos de perfil, imagens de artigos, etc.)
 * 
 * Mudanças v2.38.0:
 * - Adicionado endpoint GET /api/status para retornar chatStatus e isActive da sessão atual
 * - Endpoint permite que ChatStatusSelector exiba corretamente o status baseado no MongoDB
 * - Campo chatStatus já é inicializado corretamente na criação da sessão (logLogin)
 * 
 * Mudanças v2.37.2:
 * - Adicionados logs detalhados no endpoint get-upload-url para diagnóstico de problemas com credenciais
 * - Melhorada validação da chave privada (verificação de formato BEGIN/END PRIVATE KEY)
 * - Adicionado tratamento específico para erros de decodificação de credenciais
 * - Logs agora mostram preview das credenciais e tamanho da chave privada para debug
 * 
 * Mudanças v2.37.1:
 * - Adicionada validação de GCP_PROJECT_ID e GOOGLE_CREDENTIALS em todos os endpoints de Storage
 * - Adicionada detecção de credenciais placeholder para retornar erro claro ao usuário
 * - Melhorado tratamento de erros com mensagens específicas sobre configuração faltante
 * - Adicionada variável GCP_PROJECT_ID ao arquivo backend/env
 * 
 * Mudanças v2.37.0:
 * - Implementado upload via signed URLs para foto de perfil
 * - Adicionado endpoint GET /api/auth/profile/get-upload-url para gerar signed URL
 * - Adicionado endpoint POST /api/auth/profile/confirm-upload para confirmar upload e atualizar MongoDB
 * - Upload agora é feito diretamente do frontend para GCS, sem passar pelo backend
 * - Corrigida inicialização do Storage para suportar credenciais JSON ou caminho de arquivo
 * 
 * Mudanças v2.36.0:
 * - Adicionado endpoint GET /api/auth/profile para buscar dados do perfil
 * - Adicionado endpoint POST /api/auth/profile/change-password para alterar senha
 * - Endpoints retornam campos conforme schema MongoDB: colaboradorNome, telefone, userMail, profile_pic
 * 
 * Mudanças v2.35.0:
 * - Adicionado endpoint POST /api/auth/profile/upload-photo para upload de foto de perfil
 * - Upload para GCS (mediabank_velohub/profile_picture)
 * - Atualiza campo profile_pic no MongoDB após upload bem-sucedido
 * - Retorna URL pública do GCS
 * 
 * Mudanças v2.34.0:
 * - Adicionado endpoint POST /api/auth/login para login por email/senha
 * - Adicionado endpoint POST /api/auth/validate-access para validar acesso do usuário
 * - Validação contra console_analises.qualidade_funcionarios
 * - Verifica acessos.Velohub, desligado, afastado e suspenso
 * 
 * Mudanças v2.33.0:
 * - Adicionado endpoint PUT /api/auth/session/chat-status para atualizar chatStatus diretamente no hub_sessions
 * - Endpoint atualiza chatStatus IMEDIATAMENTE quando usuário seleciona status no ChatStatusSelector
 * - Adicionados logs detalhados da alteração de chatStatus
 * 
 * Mudanças v2.32.0:
 * - Removidas todas as rotas e referências ao RocketChat
 * - Adicionado registro das rotas do VeloChat interno (/api/chat/*)
 * - Configurado uso de VELOCHAT_DB_NAME para database do chat
 * 
 * Mudanças v2.31.15:
 * - Corrigido catch-all route para não interceptar rotas da API (app.all ao invés de app.get)
 * - Adicionados logs de debug para diagnóstico de rotas
 * - Melhorado tratamento de rotas não encontradas para retornar JSON ao invés de HTML
 * - Adicionados logs de instrumentação para debug de rotas
 * 
 * Mudanças v2.31.14:
 * - Melhorado tratamento de erro 403 no endpoint /api/images/*
 * - Adicionadas instruções detalhadas nos logs quando bucket não está público
 * - Criado documento TORNAR_BUCKET_PUBLICO.md com instruções completas
 * 
 * Mudanças v2.31.13:
 * - Alterado endpoint /api/images/* de redirecionamento (302) para proxy direto
 * - Proxy baixa imagem do GCS e serve diretamente, resolvendo ERR_BLOCKED_BY_ORB
 * - Adicionado suporte a Content-Type automático e cache de 1 ano
 * 
 * Mudanças v2.31.12:
 * - Adicionados headers CORS no endpoint /api/images/* para facilitar redirecionamento
 * 
 * Mudanças v2.31.11:
 * - Corrigido encoding duplo no endpoint /api/images/* - decodifica req.path antes de processar
 * 
 * Mudanças v2.31.10:
 * - Corrigida codificação de URLs no endpoint /api/images/* para lidar com espaços e caracteres especiais
 * - Caminhos de imagens agora são codificados corretamente antes de redirecionar para o GCS
 * 
 * Mudanças v2.31.9:
 * - Adicionado endpoint GET /api/images/* para servir imagens do Google Cloud Storage
 * - Endpoint redireciona para URL pública do GCS (storage.googleapis.com)
 * - Suporta caminhos img_velonews/ e img_artigos/
 * - Resolve problema de "imagem não encontrada" no frontend
 */

// ===== FALLBACK PARA TESTES LOCAIS =====
const FALLBACK_FOR_LOCAL_TESTING = {
  _id: "devId123",
  pergunta: "Fallback para teste",
  resposta: "Texto para preenchimento de teste via fallback",
  palavrasChave: "fallback",
  sinonimos: "teste, interno",
  tabulacao: "Categoria: Teste; Motivo: Tabulação; Detalhe: exibição"
};

// Função para verificar se deve usar fallback local
const shouldUseLocalFallback = () => {
  return process.env.NODE_ENV === 'development' || 
         process.env.LOCAL_TESTING === 'true' ||
         !process.env.MONGODB_URI;
};

// LOG DE DIAGNÓSTICO #1: Identificar a versão do código
console.log("🚀 INICIANDO APLICAÇÃO - VERSÃO DO CÓDIGO: 1.5.5 - DIAGNÓSTICO ATIVO");

// LOG DE DIAGNÓSTICO #2: Verificar as variáveis de ambiente
console.log("🔍 Verificando variáveis de ambiente...");
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- OPENAI_API_KEY existe: ${!!process.env.OPENAI_API_KEY}`);
console.log(`- GEMINI_API_KEY existe: ${!!process.env.GEMINI_API_KEY}`);
console.log(`- MONGO_ENV existe: ${!!process.env.MONGO_ENV}`);
console.log(`- PORT: ${process.env.PORT}`);

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch');
const { Storage } = require('@google-cloud/storage');
// Carregar variáveis de ambiente
// IMPORTANTE: dotenv deve ser carregado ANTES de qualquer outro módulo que use process.env
// O arquivo de ambiente é 'env' (sem ponto), não '.env'
const envPath = require('path').join(__dirname, 'env');
require('dotenv').config({ path: envPath });

// Log para debug - verificar se env foi carregado
if (process.env.MONGO_ENV) {
  console.log('✅ Arquivo env carregado - MONGO_ENV encontrado');
  console.log('🔍 MONGO_ENV (primeiros 50 chars):', process.env.MONGO_ENV.substring(0, 50) + '...');
} else {
  console.warn('⚠️ Arquivo env não encontrado ou MONGO_ENV não definido');
  console.warn('⚠️ Verifique se backend/env existe e contém MONGO_ENV');
}

// Carregar configuração local para testes (apenas em desenvolvimento)
let localConfig = null;
if (process.env.NODE_ENV !== 'production') {
  try {
    localConfig = require('./config-local');
    console.log('✅ Configuração local carregada (modo desenvolvimento)');
  } catch (error) {
    console.warn('⚠️ Não foi possível carregar config-local.js:', error.message);
  }
}

// Importar serviços do chatbot
// VERSION: v2.19.0 | DATE: 2025-01-10 | AUTHOR: VeloHub Development Team
let aiService, searchService, sessionService, dataCache, userActivityLogger, botFeedbackService, responseFormatter, userSessionLogger;

console.log('🔄 Iniciando carregamento de serviços...');

try {
  console.log('📦 Carregando aiService...');
  aiService = require('./services/chatbot/aiService');
  console.log('✅ aiService carregado');
  
  console.log('📦 Carregando searchService...');
  searchService = require('./services/chatbot/searchService');
  console.log('✅ searchService carregado');
  
  console.log('📦 Carregando sessionService...');
  sessionService = require('./services/chatbot/sessionService');
  console.log('✅ sessionService carregado');
  
  console.log('📦 Carregando dataCache...');
  dataCache = require('./services/chatbot/dataCache');
  console.log('✅ dataCache carregado');
  
  console.log('📦 Carregando userActivityLogger...');
  userActivityLogger = require('./services/logging/userActivityLogger');
  console.log('✅ userActivityLogger carregado');
  
  console.log('📦 Carregando botFeedbackService...');
  botFeedbackService = require('./services/chatbot/botFeedbackService');
  console.log('✅ botFeedbackService carregado');
  
  console.log('📦 Carregando responseFormatter...');
  responseFormatter = require('./services/chatbot/responseFormatter');
  console.log('✅ responseFormatter carregado');
  
  console.log('📦 Carregando userSessionLogger...');
  userSessionLogger = require('./services/logging/userSessionLogger');
  console.log('✅ userSessionLogger carregado');
  
  // Iniciar limpeza automática de sessões inativas
  if (userSessionLogger && typeof userSessionLogger.startAutoCleanup === 'function') {
    userSessionLogger.startAutoCleanup();
  }
  
  console.log('🎉 Todos os serviços carregados com sucesso!');
} catch (error) {
  console.error('❌ Erro ao carregar serviços:', error.message);
  console.error('Stack:', error.stack);
  console.error('⚠️ AVISO: Servidor continuará iniciando mesmo com falha no carregamento de serviços');
  console.error('⚠️ Algumas funcionalidades podem não estar disponíveis');
  // Não encerrar o processo - permitir que o servidor inicie mesmo com serviços faltando
  // Isso garante que o container não falhe completamente no Cloud Run
}

// Carregar config para verificação de configurações WhatsApp
const config = require('./config');

// Log de configurações WhatsApp (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  console.log('📱 Configurações WhatsApp:');
  console.log('   - WHATSAPP_API_URL:', config.WHATSAPP_API_URL ? '✅ Configurado' : '❌ Não configurado');
  console.log('   - WHATSAPP_DEFAULT_JID:', config.WHATSAPP_DEFAULT_JID ? '✅ Configurado' : '❌ Não configurado');
  if (config.WHATSAPP_API_URL) {
    console.log('   - URL:', config.WHATSAPP_API_URL);
  }
  if (config.WHATSAPP_DEFAULT_JID) {
    console.log('   - JID:', config.WHATSAPP_DEFAULT_JID);
  }
}

const app = express();
// Cloud Run usa PORT=8080 (padrão). Desenvolvimento local pode usar outra porta via .env
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: [
    'https://app.velohub.velotax.com.br', // NOVO DOMÍNIO PERSONALIZADO
    process.env.CORS_ORIGIN || 'https://velohub-278491073220.us-east1.run.app',
    'http://localhost:8080', // Frontend padrão (regra estabelecida)
    'http://localhost:3000', // Compatibilidade
    'http://localhost:5000'  // Compatibilidade
  ],
  credentials: true
}));
// Configurar limite de payload para suportar imagens/vídeos em base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ===== FUNÇÕES AUXILIARES =====

/**
 * Converte \n literais em quebras de linha reais
 * @param {string} text - Texto a ser processado
 * @returns {string} Texto com quebras de linha convertidas
 */
function parseTextContent(text) {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/\\n/g, '\n');
}

// Middleware para garantir que erros sempre retornem JSON
app.use((err, req, res, next) => {
  console.error('❌ Erro no servidor:', err);
  if (!res.headersSent) {
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      message: err.message 
    });
  }
});

// Middleware de debug para capturar problemas de JSON
app.use((req, res, next) => {
  if (req.path === '/api/chatbot/ask') {
    console.log('🔍 Debug: Headers recebidos:', JSON.stringify(req.headers, null, 2));
    console.log('🔍 Debug: Body recebido:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Middleware para capturar bytes brutos da resposta (diagnóstico)
app.use((req, res, next) => {
  const oldWrite = res.write;
  const oldEnd = res.end;
  const chunks = [];

  res.write = function(chunk, ...args) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return oldWrite.apply(res, [chunk, ...args]);
  };
  
  res.end = function(chunk, ...args) {
    if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    const bodyBuf = Buffer.concat(chunks);
    
    if (req.path === '/api/chatbot/ask' && res.get('Content-Type')?.includes('application/json')) {
      console.log('--- OUTGOING RAW BYTES (first 200) ---');
      console.log('UTF8:', bodyBuf.slice(0,200).toString('utf8'));
      console.log('HEX:', bodyBuf.slice(0,50));
      console.log('First byte:', bodyBuf[0], '(', String.fromCharCode(bodyBuf[0]), ')');
    }
    
    return oldEnd.apply(res, [chunk, ...args]);
  };
  
  next();
});

// Função para formatar conteúdo de artigos seguindo padrões do schema
const formatArticleContent = (content) => {
  if (!content) return '';
  
  return content
    // Converter \n literais para quebras reais
    .replace(/\\n/g, '\n')
    // Converter quebras múltiplas excessivas
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

// MongoDB Connection
const uri = process.env.MONGO_ENV;

console.log('🔍 Verificando configuração MongoDB...');
console.log('🔍 MONGO_ENV definida:', !!uri);
if (uri) {
  console.log('🔍 MONGO_ENV (primeiros 50 chars):', uri.substring(0, 50) + '...');
} else {
  console.warn('⚠️ MONGO_ENV não configurada - servidor iniciará sem MongoDB');
  console.warn('⚠️ APIs que dependem do MongoDB não funcionarão');
}
const client = uri ? new MongoClient(uri, {
  serverSelectionTimeoutMS: 15000, // 15 segundos timeout (otimizado para us-east-1)
  connectTimeoutMS: 20000, // 20 segundos timeout
  socketTimeoutMS: 45000, // 45 segundos timeout
}) : null;

// Conectar ao MongoDB uma vez no início
let isConnected = false;
const connectToMongo = async () => {
  if (!client) {
    console.error('❌ MongoDB client não configurado');
    throw new Error('MongoDB não configurado');
  }
  
  if (!isConnected) {
    try {
      console.log('🔌 Tentando conectar ao MongoDB...');
      await client.connect();
      isConnected = true;
      console.log('✅ Conexão MongoDB estabelecida!');
    } catch (error) {
      console.error('❌ Erro ao conectar MongoDB:', error);
      throw error;
    }
  } else {
    console.log('✅ MongoDB já conectado');
  }
  
  return client;
};

// Health check endpoint (não depende do MongoDB)
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Servidor funcionando!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test connection endpoint
app.get('/api/test', async (req, res) => {
  try {
    if (!client) {
      return res.status(503).json({ 
        success: false, 
        error: 'MongoDB não configurado',
        message: 'Servidor funcionando, mas MongoDB não disponível'
      });
    }
    await connectToMongo();
    res.json({ success: true, message: 'Conexão com MongoDB OK!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test chatbot endpoint
app.get('/api/chatbot/test', async (req, res) => {
  try {
    const config = require('./config');
    const aiStatus = aiService.getConfigurationStatus();
    
    res.json({
      success: true,
      data: {
        ai_service: {
          gemini: {
            configured: aiStatus.gemini.configured,
            model: aiStatus.gemini.model,
            priority: aiStatus.gemini.priority
          },
          openai: {
            configured: aiStatus.openai.configured,
            model: aiStatus.openai.model,
            priority: aiStatus.openai.priority
          },
          any_available: aiStatus.anyAvailable
        },
        mongodb_configured: !!config.MONGODB_URI,
        environment: config.NODE_ENV
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para Top 10 FAQ (substitui Google Apps Script)
app.get('/api/faq/top10', async (req, res) => {
  try {
    console.log('📋 Buscando Top 10 FAQ do MongoDB (console_analises.faq_bot)...');
    
    // Tentar conectar ao MongoDB
    const client = await connectToMongo();
    if (!client) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB não disponível',
        data: []
      });
    }
    
    const db = client.db('console_analises');
    const faqBotCollection = db.collection('faq_bot');
    
    // Buscar dados do FAQ da coleção console_analises.faq_bot
    const faqData = await faqBotCollection.findOne({ _id: "faq" });
    
    if (!faqData || !faqData.dados || faqData.dados.length === 0) {
      console.log('⚠️ Nenhum dado encontrado em console_analises.faq_bot');
      return res.json({
        success: true,
        data: []
      });
    }
    
    // Converter dados para formato esperado pelo frontend
    const top10FAQ = faqData.dados.slice(0, 10).map((pergunta, index) => ({
      pergunta: pergunta || 'Pergunta não disponível',
      frequencia: Math.max(100 - (index * 10), 10), // Simular frequência decrescente baseada na posição
      _id: `faq_${index + 1}`, // ID gerado baseado na posição
      palavrasChave: '', // Campo não disponível na nova estrutura
      sinonimos: '' // Campo não disponível na nova estrutura
    }));
    
    console.log(`✅ Top 10 FAQ carregado de console_analises.faq_bot: ${top10FAQ.length} perguntas`);
    console.log(`📊 Total de perguntas no período: ${faqData.totalPerguntas || 'N/A'}`);
    console.log(`🕒 Última atualização: ${faqData.updatedAt || 'N/A'}`);
    
    res.json({
      success: true,
      data: top10FAQ
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar Top 10 FAQ:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      data: []
    });
  }
});

// Endpoint único para buscar todos os dados
app.get('/api/data', async (req, res) => {
  try {
    if (!client) {
      return res.status(503).json({
        success: false,
        message: 'MongoDB não configurado',
        data: { velonews: [], articles: [], faq: [] }
      });
    }
    
    console.log('🔌 Conectando ao MongoDB...');
    await connectToMongo();
    console.log('✅ Conexão estabelecida!');
    
    const db = client.db('console_conteudo');
    
    // Buscar dados de todas as collections de uma vez
    console.log('📊 Buscando dados das collections...');
    
    const [velonews, artigos, faq] = await Promise.all([
      db.collection('Velonews').find({}).sort({ createdAt: -1 }).toArray(),
      db.collection('Artigos').find({}).sort({ createdAt: -1 }).toArray(),
      db.collection('Bot_perguntas').find({}).sort({ createdAt: -1 }).toArray()
    ]);
    
    console.log(`📰 Velonews encontrados: ${velonews.length}`);
    console.log(`📚 Artigos encontrados: ${artigos.length}`);
    console.log(`❓ FAQ encontrados: ${faq.length}`);
    
    // Debug: mostrar estrutura dos primeiros velonews
    if (velonews.length > 0) {
      console.log('🔍 Estrutura do primeiro velonews:', JSON.stringify(velonews[0], null, 2));
    }
    
    // Mapear dados para o formato esperado pelo frontend
    const mappedData = {
      velonews: velonews.map(item => {
        // Processar campo media conforme novo schema
        // Suporta formato novo (media: { images: [], videos: [] }) e formato antigo (images: [], videos: []) para compatibilidade
        let media = {
          images: [],
          videos: []
        };

        if (item.media && typeof item.media === 'object') {
          // Formato novo: media: { images: [], videos: [] }
          media.images = Array.isArray(item.media.images) ? item.media.images : [];
          media.videos = Array.isArray(item.media.videos) ? item.media.videos : [];
        } else {
          // Formato antigo: images: [], videos: [] (compatibilidade)
          if (Array.isArray(item.images)) {
            media.images = item.images;
          }
          if (Array.isArray(item.videos)) {
            media.videos = item.videos;
          }
        }

        return {
          _id: item._id,
          title: item.title || item.velonews_titulo || item.titulo || '(sem título)',
          content: parseTextContent(item.content || item.velonews_conteudo || item.conteudo || ''),
          is_critical: item.alerta_critico === 'Y' || item.alerta_critico === true || item.is_critical === 'Y' || item.is_critical === true || item.isCritical === 'Y' || item.isCritical === true ? 'Y' : 'N',
          solved: item.solved || false,
          media: media, // ✅ Campo media com images e videos
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        };
      }),
      
      articles: artigos.map(item => ({
        _id: item._id,
        title: item.artigo_titulo,
        content: parseTextContent(item.artigo_conteudo || ''),
        category: item.categoria_titulo,
        category_id: item.categoria_id,
        tag: item.tag,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      })),
      
      faq: faq.map(item => ({
        _id: item._id,
        topic: item.topico || item.topic,
        context: item.contexto || item.context,
        keywords: item.keywords || '',
        question: item.topico || item.question,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }))
    };
    
    console.log('✅ Dados mapeados com sucesso!');
    console.log(`📊 Resumo: ${mappedData.velonews.length} velonews, ${mappedData.articles.length} artigos, ${mappedData.faq.length} faq`);
    
    // Debug: mostrar velonews críticos mapeados
    const criticalNews = mappedData.velonews.filter(n => n.is_critical === 'Y');
    console.log(`🚨 Velonews críticos encontrados: ${criticalNews.length}`);
    if (criticalNews.length > 0) {
      console.log('🚨 Primeiro velonews crítico:', JSON.stringify(criticalNews[0], null, 2));
    }
    
    res.json({
      success: true,
      data: mappedData
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados',
      error: error.message
    });
  }
});

// Endpoints individuais mantidos para compatibilidade
app.get('/api/velo-news', async (req, res) => {
  try {
    if (!client) {
      return res.status(503).json({
        success: false,
        message: 'MongoDB não configurado',
        data: []
      });
    }
    
    await connectToMongo();
    const db = client.db('console_conteudo');
    const collection = db.collection('Velonews');

    // Parâmetros de paginação (opcionais)
    const limit = parseInt(req.query.limit) || null; // null = retornar todas
    const skip = parseInt(req.query.skip) || 0;

    // Query base
    const query = {
      $nor: [
        { artigo_titulo: { $exists: true } },
        { artigo_conteudo: { $exists: true } },
        { tipo: 'artigo' },
      ]
    };

    // Construir cursor com paginação
    let cursor = collection.find(query).sort({ createdAt: -1, _id: -1 });
    
    if (skip > 0) {
      cursor = cursor.skip(skip);
    }
    
    if (limit && limit > 0) {
      cursor = cursor.limit(limit);
    }

    const raw = await cursor.toArray();

    // Contar total de documentos (apenas se limit foi especificado)
    let totalCount = null;
    if (limit !== null) {
      totalCount = await collection.countDocuments(query);
    }

    console.log('🔍 Buscando dados da collection Velonews...');
    console.log(`📰 Encontrados ${raw.length} documentos na collection Velonews`);
    
    // ADICIONE ESTE LOG PARA DEPURAR
    console.log('DADOS BRUTOS DA COLLECTION VELONEWS:', JSON.stringify(raw, null, 2));
    
    // Debug: mostrar estrutura dos primeiros 3 documentos
    if (raw.length > 0) {
      console.log('🔍 Estrutura dos primeiros documentos:');
      raw.slice(0, 3).forEach((item, index) => {
        console.log(`Documento ${index + 1}:`, {
          _id: item._id,
          title: item.title,
          velonews_titulo: item.velonews_titulo,
          content: item.content ? item.content.substring(0, 100) + '...' : null,
          velonews_conteudo: item.velonews_conteudo ? item.velonews_conteudo.substring(0, 100) + '...' : null,
          alerta_critico: item.alerta_critico,
          is_critical: item.is_critical,
          createdAt: item.createdAt
        });
      });
    }

    const mappedNews = raw.map(item => {
      // Normalização de datas
      const createdAt =
        item.createdAt ??
        item.updatedAt ??
        (item._id && item._id.getTimestamp ? item._id.getTimestamp() : null);

      // Processar campo media conforme novo schema
      // Suporta formato novo (media: { images: [], videos: [] }) e formato antigo (images: [], videos: []) para compatibilidade
      let media = {
        images: [],
        videos: []
      };

      if (item.media && typeof item.media === 'object') {
        // Formato novo: media: { images: [], videos: [] }
        media.images = Array.isArray(item.media.images) ? item.media.images : [];
        media.videos = Array.isArray(item.media.videos) ? item.media.videos : [];
      } else {
        // Formato antigo: images: [], videos: [] (compatibilidade)
        if (Array.isArray(item.images)) {
          media.images = item.images;
        }
        if (Array.isArray(item.videos)) {
          media.videos = item.videos;
        }
      }

      return {
        _id: item._id,
        // Usando campos padrão do schema
        title: item.titulo ?? '(sem título)',
        content: parseTextContent(item.conteudo ?? ''),
        is_critical: item.isCritical === true ? 'Y' : 'N',
        solved: item.solved || false,
        media: media, // ✅ Campo media com images e videos
        thread: Array.isArray(item.thread) ? item.thread : [], // ✅ Campo thread (array de comentários)
        createdAt,
        updatedAt: item.updatedAt ?? createdAt,
        source: 'Velonews'
      };
    });
    
    console.log(`✅ Dados mapeados com sucesso: ${mappedNews.length} velonews${limit ? ` (limit: ${limit}, skip: ${skip})` : ''}`);
    
    const response = {
      success: true,
      data: mappedNews
    };
    
    // Incluir informações de paginação se limit foi especificado
    if (limit !== null && totalCount !== null) {
      response.pagination = {
        total: totalCount,
        limit: limit,
        skip: skip,
        hasMore: (skip + mappedNews.length) < totalCount
      };
    }
    
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar notícias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar notícias',
      error: error.message
    });
  }
});

// PUT /api/velo-news/:id/comment - Adicionar comentário ao thread
app.put('/api/velo-news/:id/comment', async (req, res) => {
  try {
    const { id } = req.params;
    const { userName, comentario } = req.body;

    // Validação
    if (!userName || !comentario || !comentario.trim()) {
      return res.status(400).json({
        success: false,
        error: 'userName e comentario são obrigatórios'
      });
    }

    if (!client) {
      return res.status(503).json({
        success: false,
        message: 'MongoDB não configurado'
      });
    }

    await connectToMongo();
    const db = client.db('console_conteudo');
    const collection = db.collection('Velonews');

    // Verificar se a notícia existe
    const news = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'Notícia não encontrada'
      });
    }

    // Criar novo comentário
    const novoComentario = {
      userName: userName.trim(),
      timestamp: new Date(),
      comentario: comentario.trim()
    };

    // Adicionar ao array thread (usar $push para adicionar ao array)
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $push: { thread: novoComentario },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notícia não encontrada'
      });
    }

    // Buscar notícia atualizada
    const updatedNews = await collection.findOne({ _id: new ObjectId(id) });

    console.log(`✅ Comentário adicionado à notícia ${id} por ${userName}`);

    res.json({
      success: true,
      message: 'Comentário adicionado com sucesso',
      news: {
        _id: updatedNews._id,
        thread: updatedNews.thread || []
      }
    });

  } catch (error) {
    console.error('❌ Erro ao adicionar comentário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar comentário',
      error: error.message
    });
  }
});

app.get('/api/articles', async (req, res) => {
  try {
    if (!client) {
      return res.status(503).json({
        success: false,
        message: 'MongoDB não configurado',
        data: []
      });
    }
    
    await connectToMongo();
    const db = client.db('console_conteudo');
    const collection = db.collection('Artigos');
    
    const articles = await collection.find({}).toArray();
    
    const mappedArticles = articles.map(item => ({
      _id: item._id,
      title: item.artigo_titulo,
      content: parseTextContent(item.artigo_conteudo || ''),
      category: item.categoria_titulo,
      category_id: item.categoria_id,
      tag: item.tag,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));
    
    res.json({
      success: true,
      data: mappedArticles
    });
  } catch (error) {
    console.error('Erro ao buscar artigos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar artigos',
      error: error.message
    });
  }
});

app.get('/api/faq', async (req, res) => {
  try {
    if (!client) {
      return res.status(503).json({
        success: false,
        message: 'MongoDB não configurado',
        data: []
      });
    }
    
    await connectToMongo();
    const db = client.db('console_conteudo');
    const collection = db.collection('Bot_perguntas');
    
    const faq = await collection.find({}).toArray();
    
    const mappedFaq = faq.map(item => ({
      _id: item._id,
      topic: item.topico || item.topic,
      context: item.contexto || item.context,
      keywords: item.keywords || '',
      question: item.topico || item.question,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));
    
    res.json({
      success: true,
      data: mappedFaq
    });
  } catch (error) {
    console.error('Erro ao buscar FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar FAQ',
      error: error.message
    });
  }
});

// Sistema de Ponto - Endpoints seguros (não interferem nas APIs existentes)
app.post('/api/ponto/entrada', async (req, res) => {
  try {
    // Validar se usuário está autenticado (implementar conforme sua lógica)
    // const user = req.user; // Sua validação de usuário
    
    // Chamar API do Ponto Mais
    const response = await fetch('https://api.pontomais.com.br/time_clock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PONTO_MAIS_API_KEY}`,
      },
      body: JSON.stringify({
        type: 'in',
        timestamp: new Date().toISOString(),
        company_id: process.env.PONTO_MAIS_COMPANY_ID
      })
    });

    if (!response.ok) {
      throw new Error('Falha ao registrar entrada no Ponto Mais');
    }

    res.json({ success: true, message: 'Entrada registrada com sucesso!' });
  } catch (error) {
    console.error('Erro ao registrar entrada:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/ponto/saida', async (req, res) => {
  try {
    // Validar se usuário está autenticado (implementar conforme sua lógica)
    // const user = req.user; // Sua validação de usuário
    
    // Chamar API do Ponto Mais
    const response = await fetch('https://api.pontomais.com.br/time_clock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PONTO_MAIS_API_KEY}`,
      },
      body: JSON.stringify({
        type: 'out',
        timestamp: new Date().toISOString(),
        company_id: process.env.PONTO_MAIS_COMPANY_ID
      })
    });

    if (!response.ok) {
      throw new Error('Falha ao registrar saída no Ponto Mais');
    }

    res.json({ success: true, message: 'Saída registrada com sucesso!' });
  } catch (error) {
    console.error('Erro ao registrar saída:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/ponto/status', async (req, res) => {
  try {
    // Validar se usuário está autenticado (implementar conforme sua lógica)
    // const user = req.user; // Sua validação de usuário
    
    // Chamar API do Ponto Mais para status
    const response = await fetch('https://api.pontomais.com.br/time_clock/current', {
      headers: {
        'Authorization': `Bearer ${process.env.PONTO_MAIS_API_KEY}`,
      }
    });

    if (!response.ok) {
      throw new Error('Falha ao buscar status no Ponto Mais');
    }

    const data = await response.json();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao buscar status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Iniciar limpeza automática de sessões
sessionService.startAutoCleanup();

/**
 * Filtra perguntas do MongoDB por keywords/sinônimos
 * @param {string} question - Pergunta do usuário
 * @param {Array} botPerguntasData - Dados do MongoDB
 * @returns {Array} Perguntas filtradas
 */
function filterByKeywords(question, botPerguntasData) {
  const questionWords = question.toLowerCase().split(/\s+/);
  const filtered = [];
  
  for (const item of botPerguntasData) {
    const palavrasChave = (item.palavrasChave || '').toLowerCase();
    const sinonimos = (item.sinonimos || '').toLowerCase();
    const pergunta = (item.pergunta || '').toLowerCase();
    
    // Combinar todos os campos de busca
    const searchText = `${palavrasChave} ${sinonimos} ${pergunta}`;
    
    // Verificar se alguma palavra da pergunta está presente
    const hasMatch = questionWords.some(word => {
      if (word.length < 2) return false; // Ignorar palavras muito curtas
      return searchText.includes(word);
    });
    
    if (hasMatch) {
      filtered.push(item);
    }
  }
  
  // Fallback: se filtro muito restritivo, retornar primeiras 50
  if (filtered.length === 0) {
    console.log('⚠️ Filtro muito restritivo, usando fallback (primeiras 50 perguntas)');
    return botPerguntasData.slice(0, 50);
  }
  
  // Limitar a 30 perguntas para não sobrecarregar a IA
  return filtered.slice(0, 30);
}

// ===== FUNÇÕES AUXILIARES =====

/**
 * Aplica filtro otimizado nos campos palavrasChave e sinonimos (PONTO 1)
 * @param {string} question - Pergunta do usuário
 * @returns {Promise<Object>} Resultados filtrados
 */
const applyOptimizedFilter = async (question) => {
  try {
    console.log('🔍 PONTO 1: Iniciando filtro com índices MongoDB...');
    const startTime = Date.now();
    
    // 1. TENTAR FILTRO COM ÍNDICES PRIMEIRO
    try {
      const client = await connectToMongo();
      const db = client.db('console_conteudo');
      
      // Filtro com índices MongoDB ($text search)
      const [filteredBotPerguntas, filteredArticles] = await Promise.all([
        filterByKeywordsWithIndexes(question, db),
        filterArticlesWithIndexes(question, db)
      ]);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`⚡ PONTO 1: Filtro com índices concluído em ${duration}ms`);
      console.log(`📊 PONTO 1: Resultados - Bot_perguntas: ${filteredBotPerguntas.length}, Artigos: ${filteredArticles.length}`);
      
      return {
        botPerguntas: filteredBotPerguntas,
        articles: filteredArticles,
        duration: duration,
        method: 'indexes'
      };
      
    } catch (indexError) {
      console.warn('⚠️ PONTO 1: Erro no filtro com índices, usando fallback:', indexError.message);
      
      // 2. FALLBACK PARA FILTRO MANUAL
      let botPerguntasData = dataCache.getBotPerguntasData();
      let articlesData = dataCache.getArticlesData();
      
      // Se cache inválido, carregar do MongoDB
      if (!botPerguntasData || !articlesData) {
        console.log('⚠️ PONTO 1: Cache inválido, carregando do MongoDB...');
        
        const client = await connectToMongo();
        const db = client.db('console_conteudo');
        const botPerguntasCollection = db.collection('Bot_perguntas');
        const articlesCollection = db.collection('Artigos');
        
        [botPerguntasData, articlesData] = await Promise.all([
          botPerguntasCollection.find({}).toArray(),
          articlesCollection.find({}).toArray()
        ]);
        
        // Atualizar cache
        dataCache.updateBotPerguntas(botPerguntasData);
        dataCache.updateArticles(articlesData);
        
        console.log(`📦 PONTO 1: Cache atualizado - Bot_perguntas: ${botPerguntasData.length}, Artigos: ${articlesData.length}`);
      } else {
        console.log('✅ PONTO 1: Usando dados do cache');
      }

      // Filtro manual (fallback)
      const filteredBotPerguntas = filterByKeywordsOptimized(question, botPerguntasData);
      const filteredArticles = filterArticlesOptimized(question, articlesData);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`⚡ PONTO 1: Filtro manual (fallback) concluído em ${duration}ms`);
      console.log(`📊 PONTO 1: Resultados - Bot_perguntas: ${filteredBotPerguntas.length}/${botPerguntasData.length}, Artigos: ${filteredArticles.length}/${articlesData.length}`);
      
      return {
        botPerguntas: filteredBotPerguntas,
        articles: filteredArticles,
        duration: duration,
        method: 'fallback'
      };
    }
    
  } catch (error) {
    console.error('❌ PONTO 1: Erro no filtro otimizado:', error.message);
    return {
      botPerguntas: [],
      articles: [],
      duration: 0,
      error: error.message,
      method: 'error'
    };
  }
};

/**
 * Filtro com índices MongoDB para Bot_perguntas (PONTO 1 - OTIMIZADO)
 * @param {string} question - Pergunta do usuário
 * @param {Object} db - Database MongoDB
 * @returns {Array} Perguntas filtradas
 */
const filterByKeywordsWithIndexes = async (question, db) => {
  try {
    const collection = db.collection('Bot_perguntas');
    
    // Query otimizada com $text search
    const results = await collection.find({
      $text: { $search: question }
    }, {
      score: { $meta: "textScore" }
    })
    .sort({ score: { $meta: "textScore" } })
    .limit(30)
    .toArray();
    
    // Adicionar relevanceScore baseado no score do MongoDB
    return results.map(item => ({
      ...item,
      relevanceScore: item.score || 0
    }));
    
  } catch (error) {
    console.error('❌ Erro no filtro com índices Bot_perguntas:', error.message);
    throw error;
  }
};

/**
 * Filtro com índices MongoDB para Artigos (PONTO 1 - OTIMIZADO)
 * @param {string} question - Pergunta do usuário
 * @param {Object} db - Database MongoDB
 * @returns {Array} Artigos filtrados
 */
const filterArticlesWithIndexes = async (question, db) => {
  try {
    const collection = db.collection('Artigos');
    
    // Query otimizada com $text search
    const results = await collection.find({
      $text: { $search: question }
    }, {
      score: { $meta: "textScore" }
    })
    .sort({ score: { $meta: "textScore" } })
    .limit(10)
    .toArray();
    
    // Adicionar relevanceScore baseado no score do MongoDB
    return results.map(item => ({
      ...item,
      relevanceScore: item.score || 0
    }));
    
  } catch (error) {
    console.error('❌ Erro no filtro com índices Artigos:', error.message);
    throw error;
  }
};

/**
 * Filtro otimizado por keywords/sinônimos (PONTO 1 - FALLBACK)
 * @param {string} question - Pergunta do usuário
 * @param {Array} botPerguntasData - Dados do Bot_perguntas
 * @returns {Array} Perguntas filtradas
 */
const filterByKeywordsOptimized = (question, botPerguntasData) => {
  if (!question || !botPerguntasData || botPerguntasData.length === 0) {
    return [];
  }

  const questionWords = question.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  const filtered = [];

  for (const item of botPerguntasData) {
    let score = 0;
    
    // Verificar palavras-chave
    if (item.palavrasChave && Array.isArray(item.palavrasChave)) {
      for (const keyword of item.palavrasChave) {
        if (questionWords.some(word => keyword.toLowerCase().includes(word) || word.includes(keyword.toLowerCase()))) {
          score += 2; // Peso maior para palavras-chave
        }
      }
    }
    
    // Verificar sinônimos
    if (item.sinonimos && Array.isArray(item.sinonimos)) {
      for (const synonym of item.sinonimos) {
        if (questionWords.some(word => synonym.toLowerCase().includes(word) || word.includes(synonym.toLowerCase()))) {
          score += 1; // Peso menor para sinônimos
        }
      }
    }
    
    // Verificar na pergunta
    if (item.pergunta) {
      const perguntaWords = item.pergunta.toLowerCase().split(/\s+/);
      for (const word of questionWords) {
        if (perguntaWords.some(pWord => pWord.includes(word) || word.includes(pWord))) {
          score += 1;
        }
      }
    }
    
    if (score > 0) {
      filtered.push({
        ...item,
        relevanceScore: score
      });
    }
  }

  // Ordenar por score e retornar top 30
  return filtered
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 30);
};

/**
 * Filtro otimizado para artigos (PONTO 1)
 * @param {string} question - Pergunta do usuário
 * @param {Array} articlesData - Dados dos artigos
 * @returns {Array} Artigos filtrados
 */
const filterArticlesOptimized = (question, articlesData) => {
  if (!question || !articlesData || articlesData.length === 0) {
    return [];
  }

  const questionWords = question.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  const filtered = [];

  for (const article of articlesData) {
    let score = 0;
    
    // Verificar no título
    if (article.title) {
      const titleWords = article.title.toLowerCase().split(/\s+/);
      for (const word of questionWords) {
        if (titleWords.some(tWord => tWord.includes(word) || word.includes(tWord))) {
          score += 2;
        }
      }
    }
    
    // Verificar no conteúdo
    if (article.content) {
      const contentWords = article.content.toLowerCase().split(/\s+/);
      for (const word of questionWords) {
        if (contentWords.some(cWord => cWord.includes(word) || word.includes(cWord))) {
          score += 1;
        }
      }
    }
    
    if (score > 0) {
      filtered.push({
        ...article,
        relevanceScore: score
      });
    }
  }

  // Ordenar por score e retornar top 10
  return filtered
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 10);
};

/**
 * Gera resposta da IA otimizada (PONTO 1)
 * @param {string} question - Pergunta do usuário
 * @param {string} context - Contexto das perguntas e artigos filtrados
 * @param {Array} sessionHistory - Histórico da sessão
 * @param {string} userId - ID do usuário
 * @param {string} sessionId - ID da sessão
 * @returns {Promise<Object>} Resposta da IA
 */
const generateAIResponseOptimized = async (question, context, sessionHistory, userId, sessionId) => {
  try {
    console.log('🤖 PONTO 1: Gerando resposta da IA com contexto otimizado...');
    
    // Usar IA primária definida no handshake do Ponto 0 (TTL 3min)
    const aiStatus = aiService.statusCache.data;
    let primaryAI = 'OpenAI'; // Fallback padrão
    
    if (aiStatus && aiStatus.openai && aiStatus.openai.available) {
      primaryAI = 'OpenAI';
    } else if (aiStatus && aiStatus.gemini && aiStatus.gemini.available) {
      primaryAI = 'Gemini';
    }
    
    console.log(`🤖 PONTO 1: Usando IA primária do handshake: ${primaryAI}`);
    
    // Gerar resposta com contexto otimizado
    const aiResult = await aiService.generateResponse(
      question,
      context,
      sessionHistory,
      userId,
      userId,
      null, // searchResults
      'conversational',
      primaryAI
    );
    
    if (aiResult.success) {
      console.log(`✅ PONTO 1: Resposta da IA gerada com sucesso (${aiResult.provider})`);
      return {
        success: true,
        response: aiResult.response,
        provider: aiResult.provider,
        model: aiResult.model,
        source: 'ai'
      };
    } else {
      console.warn('⚠️ PONTO 1: IA falhou, usando fallback');
      return {
        success: false,
        response: 'Desculpe, não consegui processar sua pergunta no momento. Tente novamente.',
        provider: 'fallback',
        model: null,
        source: 'fallback'
      };
    }
    
  } catch (error) {
    console.error('❌ PONTO 1: Erro na geração da resposta da IA:', error.message);
    return {
      success: false,
      response: 'Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.',
      provider: 'error',
      model: null,
      source: 'error',
      error: error.message
    };
  }
};

/**
 * Carrega dados do Bot_perguntas do MongoDB
 * @returns {Promise<Array>} Dados do Bot_perguntas
 */
const getBotPerguntasData = async () => {
  try {
    const client = await connectToMongo();
    const db = client.db('console_conteudo');
    const collection = db.collection('Bot_perguntas');
    const data = await collection.find({}).toArray();
    console.log(`📊 Bot_perguntas: ${data.length} perguntas carregadas do MongoDB`);
    return data;
  } catch (error) {
    console.error('❌ Erro ao carregar Bot_perguntas:', error);
    return [];
  }
};

/**
 * Carrega dados dos Artigos do MongoDB
 * @returns {Promise<Array>} Dados dos Artigos
 */
const getArticlesData = async () => {
  try {
    const client = await connectToMongo();
    const db = client.db('console_conteudo');
    const collection = db.collection('Artigos');
    const data = await collection.find({}).toArray();
    console.log(`📊 Artigos: ${data.length} artigos carregados do MongoDB`);
    return data;
  } catch (error) {
    console.error('❌ Erro ao carregar Artigos:', error);
    return [];
  }
};

// ===== API DO CHATBOT INTELIGENTE =====

/**
 * Inicialização do VeloBot - 3 Ações Essenciais
 * GET /api/chatbot/init
 */
app.get('/api/chatbot/init', async (req, res) => {
  try {
    const { userId } = req.query;
    
    // Validação - usuário já autenticado via OAuth
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId é obrigatório'
      });
    }
    
    const cleanUserId = userId.trim();
    console.log(`🚀 VeloBot Init: Inicializando para ${cleanUserId}`);
    
    // 1. VALIDAÇÃO DA SESSÃO (memória de conversa - 10 minutos)
    const session = sessionService.getOrCreateSession(cleanUserId, null);
    console.log(`✅ VeloBot Init: Sessão criada/obtida: ${session.id}`);
    
    // 2. CARGA DO CACHE DO BOT_PERGUNTAS DO MONGODB (OTIMIZADO)
    console.log('📦 VeloBot Init: Carregando dados MongoDB no cache...');
    try {
      // Verificar se cache precisa ser recarregado
      if (dataCache.needsReload()) {
        console.log('🔄 VeloBot Init: Cache expirado, recarregando do MongoDB...');
        
        const [botPerguntasData, articlesData] = await Promise.all([
          getBotPerguntasData(),
          getArticlesData()
        ]);
        
        // Atualizar cache
        dataCache.updateBotPerguntas(botPerguntasData);
        dataCache.updateArticles(articlesData);
        
        console.log(`✅ VeloBot Init: Cache atualizado - Bot_perguntas: ${botPerguntasData.length}, Artigos: ${articlesData.length}`);
      } else {
        console.log('✅ VeloBot Init: Cache válido, usando dados existentes');
        const cacheStatus = dataCache.getCacheStatus();
        console.log(`📊 VeloBot Init: Cache status - Bot_perguntas: ${cacheStatus.botPerguntas.count} registros, Artigos: ${cacheStatus.articles.count} registros`);
      }
    } catch (error) {
      console.error('❌ VeloBot Init: Erro ao carregar dados no cache:', error.message);
    }
    
    // 3. HANDSHAKE INTELIGENTE PARA DETERMINAR IA PRIMÁRIA (OTIMIZADO)
    const aiStatus = await aiService.testConnectionIntelligent();
    let primaryAI = null;
    let fallbackAI = null;
    
    if (aiStatus.openai.available) {
      // Cenário 1: OpenAI OK → OpenAI primária + Gemini secundária + pesquisa convencional fallback
      primaryAI = 'OpenAI';
      fallbackAI = aiStatus.gemini.available ? 'Gemini' : null;
      console.log(`✅ VeloBot Init: Cenário 1 - OpenAI primária, Gemini secundária`);
    } else if (aiStatus.gemini.available) {
      // Cenário 2: OpenAI NULL + Gemini OK → Gemini primária + OpenAI secundária + pesquisa convencional fallback
      primaryAI = 'Gemini';
      fallbackAI = 'OpenAI'; // Sempre OpenAI como secundária, mesmo se não disponível
      console.log(`✅ VeloBot Init: Cenário 2 - Gemini primária, OpenAI secundária`);
    } else {
      // Cenário 3: OpenAI NULL + Gemini NULL → Mantém primeira opção + pesquisa convencional fallback
      primaryAI = 'OpenAI'; // Mantém primeira opção
      fallbackAI = null;
      console.log(`⚠️ VeloBot Init: Cenário 3 - Nenhuma IA disponível, usando pesquisa convencional`);
    }
    
    console.log(`✅ VeloBot Init: IA primária: ${primaryAI}, Fallback: ${fallbackAI}`);
    
    // RESPOSTA COMPLETA
    const response = {
      success: true,
      sessionId: session.id,
      aiStatus: {
        primaryAI: primaryAI,
        fallbackAI: fallbackAI,
        anyAvailable: aiStatus.openai.available || aiStatus.gemini.available
      },
      cacheStatus: {
        botPerguntas: dataCache.getBotPerguntasData()?.length || 0,
        articles: dataCache.getArticlesData()?.length || 0
      },
      message: 'VeloBot inicializado - memória de conversa ativa por 10 minutos',
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ VeloBot Init: Inicialização concluída para ${cleanUserId}`);
    res.json(response);
    
  } catch (error) {
    console.error('❌ VeloBot Init Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erro na inicialização do VeloBot',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Clarification Direto - Resposta sem re-análise da IA
 * POST /api/chatbot/clarification
 */
app.post('/api/chatbot/clarification', async (req, res) => {
  try {
    const { question, userId, sessionId } = req.body;
    
    if (!question || !userId) {
      return res.status(400).json({
        success: false,
        error: 'question e userId são obrigatórios'
      });
    }
    
    const cleanUserId = userId.trim();
    const cleanSessionId = sessionId ? sessionId.trim() : null;
    const cleanQuestion = question.trim();
    
    console.log(`🔍 Clarification Direto: Buscando resposta para "${cleanQuestion}"`);
    
    // 1. BUSCAR RESPOSTA DIRETA NO CACHE
    let botPerguntasData = dataCache.getBotPerguntasData();
    
    // Se cache inválido, carregar do MongoDB
    if (!botPerguntasData) {
      console.log('⚠️ Clarification Direto: Cache inválido, carregando do MongoDB...');
      botPerguntasData = await getBotPerguntasData();
      dataCache.updateBotPerguntas(botPerguntasData);
    }
    const directMatch = botPerguntasData.find(item => 
      item.pergunta && item.pergunta.toLowerCase().includes(cleanQuestion.toLowerCase())
    );
    
    if (directMatch) {
      console.log(`✅ Clarification Direto: Resposta encontrada no MongoDB`);
      
      // 2. LOG DA ATIVIDADE
      await userActivityLogger.logQuestion(cleanUserId, cleanQuestion, cleanSessionId);
      
      // 3. BUSCAR ARTIGOS RELACIONADOS
      let articlesData = dataCache.getArticlesData();
      if (!articlesData) {
        console.log('⚠️ Clarification Direto: Cache de artigos inválido, carregando do MongoDB...');
        articlesData = await getArticlesData();
        dataCache.updateArticles(articlesData);
      }
      
      // Filtrar artigos por palavras-chave da pergunta
      const filteredArticles = filterByKeywords(cleanQuestion, articlesData);
      const relatedArticles = filteredArticles.slice(0, 3).map(article => ({
        id: article._id,
        title: article.artigo_titulo,
        content: article.artigo_conteudo.substring(0, 150) + '...',
        tag: article.tag,
        relevanceScore: 0.8 // Score padrão para artigos relacionados
      }));
      
      // 4. RESPOSTA DIRETA COM ARTIGOS
      const response = {
        success: true,
        response: parseTextContent(responseFormatter.formatCacheResponse(directMatch.resposta || 'Resposta não encontrada', 'clarification')),
        source: 'Bot_perguntas',
        sourceId: directMatch._id,
        sourceRow: directMatch.pergunta,
        timestamp: new Date().toISOString(),
        sessionId: cleanSessionId,
        tabulacao: directMatch.tabulacao || null,
        articles: relatedArticles
      };
      
      console.log(`✅ Clarification Direto: Resposta com ${relatedArticles.length} artigos enviada para ${cleanUserId}`);
      return res.json(response);
    }
    
    // 4. FALLBACK: BUSCA TRADICIONAL
    console.log(`⚠️ Clarification Direto: Nenhuma correspondência direta, usando busca tradicional`);
    
    const searchResults = await searchService.performHybridSearch(cleanQuestion, botPerguntasData, []);
    
    if (searchResults.botPergunta) {
      // Buscar artigos relacionados também no fallback
      let articlesData = dataCache.getArticlesData();
      if (!articlesData) {
        articlesData = await getArticlesData();
        dataCache.updateArticles(articlesData);
      }
      
      const filteredArticles = filterByKeywords(cleanQuestion, articlesData);
      const relatedArticles = filteredArticles.slice(0, 3).map(article => ({
        id: article._id,
        title: article.artigo_titulo,
        content: article.artigo_conteudo.substring(0, 150) + '...',
        tag: article.tag,
        relevanceScore: 0.8
      }));
      
      const response = {
        success: true,
        response: parseTextContent(responseFormatter.formatCacheResponse(searchResults.botPergunta.resposta || 'Resposta não encontrada', 'clarification_fallback')),
        source: 'Bot_perguntas',
        sourceId: searchResults.botPergunta._id,
        sourceRow: searchResults.botPergunta.pergunta,
        timestamp: new Date().toISOString(),
        sessionId: cleanSessionId,
        tabulacao: searchResults.botPergunta.tabulacao || null,
        articles: relatedArticles
      };
      
      console.log(`✅ Clarification Direto: Resposta via busca tradicional com ${relatedArticles.length} artigos para ${cleanUserId}`);
      return res.json(response);
    }
    
    // 5. RESPOSTA PADRÃO
    const response = {
      success: true,
      response: responseFormatter.formatFallbackResponse('Não consegui encontrar uma resposta precisa para sua pergunta. Pode fornecer mais detalhes ou reformular sua pergunta para que eu possa ajudá-lo melhor?'),
      source: 'fallback',
      timestamp: new Date().toISOString(),
      sessionId: cleanSessionId
    };
    
    console.log(`⚠️ Clarification Direto: Resposta padrão para ${cleanUserId}`);
    return res.json(response);
    
  } catch (error) {
    console.error('❌ Clarification Direto Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erro no clarification direto',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Limpar Cache das IAs - Força novo teste
 * POST /api/chatbot/clear-cache
 */
app.post('/api/chatbot/clear-cache', async (req, res) => {
  try {
    console.log('🧹 Limpando cache das IAs...');
    
    // Limpar cache do aiService
    aiService.statusCache = {
      data: null,
      timestamp: null,
      ttl: 5 * 60 * 1000 // 5 minutos em ms
    };
    
    // Forçar novo teste
    const aiStatus = await aiService.testConnection();
    
    res.json({
      success: true,
      message: 'Cache limpo e IAs testadas',
      aiStatus: aiStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erro ao limpar cache das IAs',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Status do Cache de Dados
 * GET /api/chatbot/cache-status
 */
app.get('/api/chatbot/cache-status', async (req, res) => {
  try {
    const cacheStatus = dataCache.getCacheStatus();
    
    res.json({
      success: true,
      cacheStatus: cacheStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Cache Status Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter status do cache',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Health Check das IAs - Determina IA primária
 * GET /api/chatbot/health-check
 */
app.get('/api/chatbot/health-check', async (req, res) => {
  try {
    console.log('🔍 Health Check: Testando disponibilidade das IAs...');
    
    const aiStatus = await aiService.testConnection();
    
    // Determinar IA primária baseada na disponibilidade
    let primaryAI = null;
    let fallbackAI = null;
    
    if (aiStatus.openai.available) {
      primaryAI = 'OpenAI';
      fallbackAI = aiStatus.gemini.available ? 'Gemini' : null;
    } else if (aiStatus.gemini.available) {
      primaryAI = 'Gemini';
      fallbackAI = null;
    }
    
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      aiStatus: aiStatus,
      primaryAI: primaryAI,
      fallbackAI: fallbackAI,
      anyAvailable: aiStatus.openai.available || aiStatus.gemini.available
    };
    
    console.log(`✅ Health Check: IA primária: ${primaryAI}, Fallback: ${fallbackAI}`);
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Health Check Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar status das IAs',
      timestamp: new Date().toISOString()
    });
  }
});

// API de Chat Inteligente - PONTO 1 OTIMIZADO (Fundido com Ponto 2)
app.post('/api/chatbot/ask', async (req, res) => {
  try {
    const { question, userId, sessionId } = req.body;

    // Validação simplificada
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Pergunta é obrigatória'
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId é obrigatório'
      });
    }

    const cleanQuestion = question.trim();
    const cleanUserId = userId.trim();
    const cleanSessionId = sessionId || null;

    console.log(`🤖 PONTO 1: Nova pergunta de ${cleanUserId}: "${cleanQuestion}"`);

    // Obter sessão para memória de conversa (10 minutos)
    const session = sessionService.getOrCreateSession(cleanUserId, cleanSessionId);
    
    // Adicionar pergunta à sessão (memória de conversa)
    sessionService.addMessage(session.id, 'user', cleanQuestion, {
      timestamp: new Date(),
      userId: cleanUserId
    });

    // PONTO 1: FILTRO OTIMIZADO + LOG PARALELO
    console.log('🔍 PONTO 1: Aplicando filtro nos campos palavrasChave e sinonimos...');
    
    // Executar filtro e log em paralelo
    const [filteredResults, logResult] = await Promise.allSettled([
      // Filtro otimizado nos campos palavrasChave e sinonimos
      applyOptimizedFilter(cleanQuestion),
      // Log da atividade (MongoDB) em paralelo
      userActivityLogger.logQuestion(cleanUserId, cleanQuestion, session.id)
    ]);

    // Processar resultados do filtro
    let botPerguntasData = [];
    let articlesData = [];
    
    if (filteredResults.status === 'fulfilled') {
      botPerguntasData = filteredResults.value.botPerguntas || [];
      articlesData = filteredResults.value.articles || [];
      console.log(`✅ PONTO 1: Filtro aplicado - ${botPerguntasData.length} perguntas relevantes, ${articlesData.length} artigos`);
    } else {
      console.error('❌ PONTO 1: Erro no filtro:', filteredResults.reason);
    }

    // Processar resultado do log
    if (logResult.status === 'fulfilled') {
      console.log('✅ PONTO 1: Log enviado ao MongoDB em paralelo');
    } else {
      console.warn('⚠️ PONTO 1: Erro no log MongoDB:', logResult.reason);
    }

    // PONTO 1: ENVIO PARA IA COM CONTEXTO RECENTE E PROMPT
    console.log('🤖 PONTO 1: Enviando resultados do filtro, contexto recente e prompt para IA...');
    
    // Obter histórico da sessão para contexto
    const sessionHistory = sessionService.getSessionHistory(session.id);
    
    // Construir contexto otimizado
    let context = '';
    
    // Adicionar contexto das perguntas filtradas
    if (botPerguntasData.length > 0) {
      context += 'Perguntas relevantes encontradas:\n';
      botPerguntasData.slice(0, 5).forEach((item, index) => {
        context += `${index + 1}. ${item.pergunta}\n   Resposta: ${item.resposta}\n\n`;
      });
    }
    
    // Adicionar contexto dos artigos filtrados
    if (articlesData.length > 0) {
      context += 'Artigos relacionados:\n';
      articlesData.slice(0, 3).forEach((article, index) => {
        context += `${index + 1}. ${article.artigo_titulo}: ${article.artigo_conteudo.substring(0, 200)}...\n\n`;
      });
    }
    
    // PONTO 3: ANÁLISE DA IA PARA DETERMINAR AÇÃO
    console.log('🤖 PONTO 3: IA analisando se há respostas válidas...');
    
    let aiAnalysis = null;
    let needsClarification = false;
    let clarificationMenu = null;
    
    // SEMPRE usar IA para analisar as opções disponíveis
    if (botPerguntasData.length > 0) {
      try {
        // Usar IA primária definida no handshake do Ponto 0 (TTL 3min)
        const aiStatus = aiService.statusCache.data;
        let primaryAI = 'OpenAI'; // Fallback padrão
        
        if (aiStatus && aiStatus.openai && aiStatus.openai.available) {
          primaryAI = 'OpenAI';
        } else if (aiStatus && aiStatus.gemini && aiStatus.gemini.available) {
          primaryAI = 'Gemini';
        }
        
        console.log(`🤖 PONTO 3: Usando IA primária do handshake: ${primaryAI}`);
        aiAnalysis = await aiService.analyzeQuestionWithAI(cleanQuestion, botPerguntasData, sessionHistory, primaryAI);
        console.log(`✅ PONTO 3: IA analisou ${botPerguntasData.length} opções`);
        
        if (aiAnalysis.needsClarification && aiAnalysis.relevantOptions.length > 1) {
          // CENÁRIO 2: IA considera múltiplas respostas cabíveis - clarification
          needsClarification = true;
          clarificationMenu = searchService.generateClarificationMenuFromAI(aiAnalysis.relevantOptions, cleanQuestion);
          console.log(`🔍 PONTO 3: Clarification necessário - ${aiAnalysis.relevantOptions.length} opções relevantes`);
        } else if (aiAnalysis.relevantOptions.length === 0) {
          // CENÁRIO 3: IA não considera que nenhuma se aplique
          console.log('❌ PONTO 3: IA determinou que nenhuma resposta se aplica');
        } else {
          // CENÁRIO 1: IA considera 1 resposta perfeita
          console.log('✅ PONTO 3: IA determinou 1 resposta perfeita');
        }
      } catch (error) {
        console.warn('⚠️ PONTO 3: Erro na análise da IA, continuando sem análise:', error.message);
        aiAnalysis = { relevantOptions: [], needsClarification: false, hasData: false };
      }
    } else {
      // Nenhuma opção disponível - continuar para fallback da IA
      console.log('⚠️ PONTO 3: Nenhuma opção do Bot_perguntas disponível - continuando para fallback da IA');
      aiAnalysis = { relevantOptions: [], needsClarification: false, hasData: false };
    }
    
    // CENÁRIO 2: Se precisa de esclarecimento, retornar menu
    if (needsClarification && clarificationMenu) {
      console.log('🔍 PONTO 3: Retornando menu de esclarecimento');
      
      const responseData = {
        success: true,
        messageId: `clarification_${Date.now()}`,
        response: clarificationMenu.resposta,
        source: 'clarification',
        aiProvider: null,
        sessionId: session.id,
        clarificationMenu: {
          options: clarificationMenu.options,
          question: cleanQuestion
        },
        timestamp: new Date().toISOString()
      };
      
      console.log(`✅ PONTO 3: Menu de esclarecimento enviado para ${cleanUserId}`);
      return res.json(responseData);
    }
    
    // CENÁRIO 3: Se IA não considera nenhuma resposta aplicável (apenas quando há dados do Bot_perguntas)
    if (aiAnalysis && aiAnalysis.relevantOptions.length === 0 && aiAnalysis.hasData !== false) {
      console.log('❌ PONTO 3: Informando usuário que nenhuma resposta se aplica');
      
      const responseData = {
        success: true,
        messageId: `no_match_${Date.now()}`,
        response: 'Não consegui encontrar uma resposta que se aplique exatamente à sua pergunta. Pode reformular ou fornecer mais detalhes para que eu possa ajudá-lo melhor?',
        source: 'no_match',
        aiProvider: null,
        sessionId: session.id,
        timestamp: new Date().toISOString()
      };
      
      console.log(`✅ PONTO 3: Resposta "nenhuma se aplica" enviada para ${cleanUserId}`);
      return res.json(responseData);
    }
    
    // CENÁRIO 1: IA considera 1 resposta perfeita - continuar com resposta normal
    console.log('🤖 PONTO 3: Gerando resposta da IA para resposta perfeita...');
    
    // Enviar para IA (sem log)
    const aiResponse = await generateAIResponseOptimized(cleanQuestion, context, sessionHistory, cleanUserId, session.id);

    // Processar resposta da IA
    let finalResponse = '';
    let responseSource = 'fallback';
    let aiProvider = null;
    
    if (aiResponse.success) {
      // Aplicar formatação da resposta da IA
      finalResponse = parseTextContent(responseFormatter.formatAIResponse(aiResponse.response, aiResponse.provider));
      responseSource = aiResponse.source;
      aiProvider = aiResponse.provider;
      console.log(`✅ PONTO 1: Resposta da IA processada e formatada com sucesso (${aiProvider})`);
    } else {
      // Fallback para resposta direta do Bot_perguntas se IA falhar
      if (botPerguntasData.length > 0) {
        // Aplicar formatação da resposta do Bot_perguntas
        finalResponse = parseTextContent(responseFormatter.formatCacheResponse(botPerguntasData[0].resposta || 'Resposta encontrada na base de conhecimento.', 'bot_perguntas'));
        responseSource = 'bot_perguntas';
        console.log('✅ PONTO 1: Usando resposta direta do Bot_perguntas formatada (fallback)');
      } else {
        if (shouldUseLocalFallback()) {
          // Aplicar formatação do fallback local
          finalResponse = parseTextContent(responseFormatter.formatFallbackResponse(FALLBACK_FOR_LOCAL_TESTING.resposta));
          responseSource = 'local_fallback';
          console.log('🧪 PONTO 1: Usando fallback formatado para teste local');
        } else {
          // Aplicar formatação da resposta padrão
          finalResponse = parseTextContent(responseFormatter.formatFallbackResponse('Não consegui encontrar uma resposta precisa para sua pergunta. Pode fornecer mais detalhes?'));
          responseSource = 'no_results';
          console.log('❌ PONTO 1: Nenhuma resposta encontrada - usando fallback formatado');
        }
      }
    }

    // Adicionar resposta à sessão
    const messageId = sessionService.addMessage(session.id, 'bot', finalResponse, {
      timestamp: new Date(),
      source: responseSource,
      aiProvider: aiProvider,
      botPerguntaUsed: botPerguntasData.length > 0 ? botPerguntasData[0]._id : null,
      articlesUsed: articlesData.slice(0, 3).map(a => a._id)
    });

    // Preparar resposta final otimizada
    const responseData = {
      success: true,
      messageId: messageId,
      response: finalResponse,
      source: responseSource,
      aiProvider: aiProvider,
      sessionId: session.id,
      tabulacao: shouldUseLocalFallback() ? FALLBACK_FOR_LOCAL_TESTING.tabulacao : (botPerguntasData.length > 0 ? botPerguntasData[0].tabulacao : null),
      articles: articlesData.slice(0, 3).map(article => ({
        id: article._id,
        _id: article._id,
        title: article.artigo_titulo,
        content: formatArticleContent(article.artigo_conteudo),  // COMPLETO E FORMATADO
        tag: article.tag || null,
        category: article.categoria_titulo || null,
        author: article.autor || null,
        createdAt: article.createdAt || null,
        relevanceScore: article.relevanceScore
      })),
      botPerguntaUsed: botPerguntasData.length > 0 ? {
        id: botPerguntasData[0]._id,
        question: botPerguntasData[0].pergunta,
        answer: botPerguntasData[0].resposta,
        relevanceScore: botPerguntasData[0].relevanceScore
      } : null,
      timestamp: new Date().toISOString()
    };

    console.log(`✅ PONTO 1: Resposta final enviada para ${cleanUserId} (${responseSource}${aiProvider ? ` - ${aiProvider}` : ''})`);
    
    res.json(responseData);

  } catch (error) {
    console.error('❌ Chat V2 Error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// API de Feedback - MongoDB apenas
app.post('/api/chatbot/feedback', async (req, res) => {
  try {
    const { messageId, feedbackType, comment, userId, sessionId, question, answer, source, aiProvider, responseSource } = req.body;

    // Validação básica
    if (!messageId || !feedbackType) {
      return res.status(400).json({
        success: false,
        error: 'messageId e feedbackType são obrigatórios'
      });
    }

    if (!['positive', 'negative'].includes(feedbackType)) {
      return res.status(400).json({
        success: false,
        error: 'feedbackType deve ser "positive" ou "negative"'
      });
    }

    const cleanUserId = userId || 'anonymous';
    const cleanSessionId = sessionId || null;

    console.log(`📝 Feedback: Novo feedback de ${cleanUserId} - ${feedbackType} para mensagem ${messageId}`);


    // Registrar feedback no MongoDB usando botFeedbackService
    const feedbackSuccess = await botFeedbackService.logFeedback({
      colaboradorNome: cleanUserId,
      messageId: messageId,
      feedbackType: feedbackType,
      comment: comment || '',
      question: question || '',
      answer: answer || '',
      sessionId: cleanSessionId,
      source: source || 'chatbot',
      aiProvider: aiProvider || null,
      responseSource: responseSource || 'bot_perguntas'
    });

    if (!feedbackSuccess) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao registrar feedback no banco de dados'
      });
    }

    // Log da atividade
    await userActivityLogger.logFeedback(cleanUserId, feedbackType, messageId, cleanSessionId, {
      hasComment: !!comment,
      commentLength: comment ? comment.length : 0
    });

    // Resposta de sucesso
    const responseData = {
      success: true,
      data: {
        messageId: messageId,
        feedbackType: feedbackType,
        timestamp: new Date().toISOString(),
        message: feedbackType === 'positive' ? 
          'Obrigado pelo seu feedback positivo!' : 
          'Obrigado pelo seu feedback. Vamos melhorar com base na sua sugestão.'
      }
    };

    console.log(`✅ Feedback: Feedback registrado com sucesso para ${cleanUserId}`);
    
    res.json(responseData);

  } catch (error) {
    console.error('❌ Feedback Error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// API de Log de Atividade
app.post('/api/chatbot/activity', async (req, res) => {
  try {
    const { action, details, userId, sessionId, source } = req.body;

    // Validação básica
    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'action é obrigatório'
      });
    }

    const cleanUserId = userId || 'anonymous';
    const cleanSessionId = sessionId || null;
    const cleanSource = source || 'chatbot';

    console.log(`📊 Activity: Nova atividade de ${cleanUserId} - ${action}`);

    // Preparar dados da atividade seguindo schema user_activity
    const activityData = {
      colaboradorNome: cleanUserId,
      action: action,
      details: details || {},
      sessionId: cleanSessionId,
      source: cleanSource
    };

    // Registrar atividade no MongoDB
    const activitySuccess = await userActivityLogger.logActivity(activityData);

    if (!activitySuccess) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao registrar atividade no banco de dados'
      });
    }

    // Resposta de sucesso
    const responseData = {
      success: true,
      data: {
        action: action,
        userId: cleanUserId,
        sessionId: cleanSessionId,
        timestamp: new Date().toISOString(),
        message: 'Atividade registrada com sucesso'
      }
    };

    console.log(`✅ Activity: Atividade registrada com sucesso para ${cleanUserId}`);
    
    res.json(responseData);

  } catch (error) {
    console.error('❌ Activity Error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// API do Botão IA - Resposta Conversacional
app.post('/api/chatbot/ai-response', async (req, res) => {
  try {
    const { question, botPerguntaResponse, articleContent, userId, sessionId, formatType } = req.body;

    // Debug: Log dos dados recebidos
    console.log('🔍 AI Response Debug - Dados recebidos:', {
      question: question ? 'presente' : 'ausente',
      botPerguntaResponse: botPerguntaResponse ? 'presente' : 'ausente',
      articleContent: articleContent ? 'presente' : 'ausente',
      userId: userId || 'não fornecido',
      sessionId: sessionId || 'não fornecido',
      formatType: formatType || 'conversational'
    });

    if (!question || !botPerguntaResponse) {
      console.log('❌ AI Response: Validação falhou - question:', !!question, 'botPerguntaResponse:', !!botPerguntaResponse);
      return res.status(400).json({
        success: false,
        error: 'Pergunta e resposta do Bot_perguntas são obrigatórias'
      });
    }

    const cleanUserId = userId || 'anonymous';
    const cleanSessionId = sessionId || null;

    console.log(`🤖 AI Button: Nova solicitação de ${cleanUserId} para resposta conversacional`);

    // Verificar se IA está configurada
    if (!aiService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Serviço de IA não configurado',
        response: 'Desculpe, o serviço de IA não está disponível no momento.'
      });
    }

    // Construir contexto para a IA
    let context = `Resposta do Bot_perguntas: ${botPerguntaResponse}`;
    
    if (articleContent) {
      context += `\n\nConteúdo do artigo relacionado: ${articleContent}`;
    }

    // Obter ou criar sessão se disponível
    const session = cleanSessionId ? sessionService.getOrCreateSession(cleanUserId, cleanSessionId) : null;
    const sessionHistory = session ? sessionService.getSessionHistory(session.id) : [];

    // Determinar IA primária baseada na disponibilidade (mesma lógica da inicialização)
    const aiStatus = await aiService.testConnection();
    let primaryAI = null;
    
    if (aiStatus.openai.available) {
      // Cenário 1: OpenAI OK → OpenAI primária + Gemini secundária + pesquisa convencional fallback
      primaryAI = 'OpenAI';
    } else if (aiStatus.gemini.available) {
      // Cenário 2: OpenAI NULL + Gemini OK → Gemini primária + OpenAI secundária + pesquisa convencional fallback
      primaryAI = 'Gemini';
    } else {
      // Cenário 3: OpenAI NULL + Gemini NULL → Mantém primeira opção + pesquisa convencional fallback
      primaryAI = 'OpenAI';
    }
    
    // Gerar resposta conversacional da IA
    const aiResult = await aiService.generateResponse(
      question,
      context,
      sessionHistory,
      cleanUserId,
      cleanUserId,
      null, // searchResults
      formatType || 'conversational',
      primaryAI
    );

    if (!aiResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao gerar resposta da IA',
        response: aiResult.response
      });
    }

    // Adicionar mensagem à sessão
    if (session) {
      sessionService.addMessage(session.id, 'bot', aiResult.response, {
        timestamp: new Date(),
        source: 'ai_button',
        aiProvider: aiResult.provider,
        botPerguntaUsed: null,
        articlesUsed: [],
        sitesUsed: false
      });
    }

    // Log da atividade do botão AI
    await userActivityLogger.logAIButtonUsage(cleanUserId, formatType || 'conversational', cleanSessionId);

    // Resposta de sucesso
    const responseData = {
      success: true,
      response: parseTextContent(responseFormatter.formatAIResponse(aiResult.response, aiResult.provider)),
      aiProvider: aiResult.provider,
      model: aiResult.model,
      source: 'ai_button',
      timestamp: new Date().toISOString(),
      sessionId: cleanSessionId
    };

    console.log(`✅ AI Button: Resposta conversacional gerada por ${aiResult.provider} para ${cleanUserId}`);
    
    res.json(responseData);

  } catch (error) {
    console.error('❌ AI Button Error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      response: 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===== API DE AUTENTICAÇÃO - LOGIN COM EMAIL/SENHA =====
console.log('🔧 Registrando endpoint POST /api/auth/login...');

const { comparePassword, validatePassword, validateUserAccess } = require('./utils/password');

// Contador de tentativas de senha incorreta por email
// Estrutura: Map<email, { count: number, firstAttempt: Date }>
const failedPasswordAttempts = new Map();
const FAILED_ATTEMPTS_TTL = 15 * 60 * 1000; // 15 minutos
const MAX_FAILED_ATTEMPTS = 3;

// Limpar tentativas antigas periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of failedPasswordAttempts.entries()) {
    if (now - data.firstAttempt.getTime() > FAILED_ATTEMPTS_TTL) {
      failedPasswordAttempts.delete(email);
    }
  }
}, 5 * 60 * 1000); // Verificar a cada 5 minutos

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Validação
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios'
      });
    }

    console.log(`🔐 Tentativa de login: ${email}`);

    // Conectar ao MongoDB
    await connectToMongo();
    const db = client.db('console_analises');
    const funcionariosCollection = db.collection('qualidade_funcionarios');

    // Buscar usuário por email
    const funcionario = await funcionariosCollection.findOne({
      userMail: email.toLowerCase()
    });

    if (!funcionario) {
      console.log(`❌ Usuário não encontrado: ${email}`);
      return res.status(404).json({
        success: false,
        error: 'Usuário Inexistente. Contate seu gestor'
      });
    }

    // Validar acesso ao VeloHub
    const acessos = funcionario.acessos || {};
    const acessoVelohub = acessos.Velohub || acessos.velohub || false;
    
    if (!acessoVelohub) {
      console.log(`❌ Acesso negado para ${email}: Velohub = false`);
      return res.status(403).json({
        success: false,
        error: 'Acesso Negado. Contate Administrador do Acesso'
      });
    }

    // Validar senha
    const passwordHash = funcionario.password || '';
    
    // Se senha não está definida, gerar senha padrão
    let passwordToCompare = passwordHash;
    if (!passwordHash || passwordHash.trim() === '') {
      const { generateDefaultPassword } = require('./utils/password');
      const defaultPassword = generateDefaultPassword(
        funcionario.colaboradorNome || '',
        funcionario.CPF || ''
      );
      passwordToCompare = defaultPassword;
      console.log(`🔑 Senha padrão gerada para ${email}: ${defaultPassword.substring(0, 10)}...`);
    }
    
    // Comparar senha fornecida com senha armazenada ou padrão (case-insensitive)
    const passwordMatch = passwordToCompare && 
      password.toLowerCase() === passwordToCompare.toLowerCase();
    
    if (!passwordMatch) {
      console.log(`❌ Senha incorreta para: ${email}`);
      
      // Incrementar contador de tentativas
      const emailLower = email.toLowerCase();
      const attemptData = failedPasswordAttempts.get(emailLower) || { count: 0, firstAttempt: new Date() };
      attemptData.count += 1;
      failedPasswordAttempts.set(emailLower, attemptData);
      
      // Preparar mensagem de erro
      let errorMessage = 'Email ou senha incorretos';
      if (attemptData.count >= MAX_FAILED_ATTEMPTS) {
        errorMessage += '. Se esqueceu sua senha, solicite o Reset ao gestor';
      }
      
      return res.status(401).json({
        success: false,
        error: errorMessage,
        failedAttempts: attemptData.count
      });
    }
    
    // Login bem-sucedido - limpar contador de tentativas
    const emailLower = email.toLowerCase();
    if (failedPasswordAttempts.has(emailLower)) {
      failedPasswordAttempts.delete(emailLower);
      console.log(`✅ Contador de tentativas resetado para: ${email}`);
    }

    // Login bem-sucedido - preparar dados do usuário
    const userData = {
      name: funcionario.colaboradorNome || email,
      email: funcionario.userMail,
      picture: funcionario.profile_pic || funcionario.fotoPerfil || null
    };

    // Registrar login no sistema de sessões
    const sessionResult = await userSessionLogger.logLogin(
      funcionario.colaboradorNome,
      funcionario.userMail,
      ipAddress,
      userAgent
    );

    if (!sessionResult.success) {
      console.error('⚠️ Erro ao registrar sessão:', sessionResult.error);
      // Continuar mesmo com erro na sessão (login foi bem-sucedido)
    }

    console.log(`✅ Login bem-sucedido: ${funcionario.colaboradorNome} (${email})`);

    res.json({
      success: true,
      user: userData,
      sessionId: sessionResult.sessionId,
      message: 'Login realizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Login Error:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

console.log('✅ Endpoint POST /api/auth/login registrado');

/**
 * Função helper para sincronizar avatar SSO do Google para GCS
 * Faz download da imagem do Google, upload para GCS e atualiza MongoDB
 */
async function syncSSOAvatar(email, googlePictureUrl) {
  try {
    console.log(`🔄 [syncSSOAvatar] Iniciando sincronização de avatar para: ${email}`);
    console.log(`🔄 [syncSSOAvatar] URL do Google: ${googlePictureUrl}`);
    
    // Validar URL do Google
    if (!googlePictureUrl || !googlePictureUrl.startsWith('http')) {
      console.warn('⚠️ [syncSSOAvatar] URL inválida do Google:', googlePictureUrl);
      return null;
    }
    
    // Conectar ao MongoDB
    await connectToMongo();
    const db = client.db('console_analises');
    const funcionariosCollection = db.collection('qualidade_funcionarios');
    
    // Buscar funcionário atual
    const funcionario = await funcionariosCollection.findOne({
      userMail: email.toLowerCase()
    });
    
    if (!funcionario) {
      console.warn(`⚠️ [syncSSOAvatar] Funcionário não encontrado: ${email}`);
      return null;
    }
    
    // Verificar se já tem profile_pic e se é diferente da URL do Google
    const currentProfilePic = funcionario.profile_pic || null;
    
    // Se já tem profile_pic e é uma URL do GCS (não do Google), não sobrescrever
    // Isso permite que usuários que já fizeram upload manual mantenham sua foto
    if (currentProfilePic && currentProfilePic.includes('storage.googleapis.com')) {
      console.log(`ℹ️ [syncSSOAvatar] Usuário já tem foto no GCS, mantendo: ${currentProfilePic}`);
      return currentProfilePic;
    }
    
    // Fazer download da imagem do Google
    console.log(`📥 [syncSSOAvatar] Fazendo download da imagem do Google...`);
    const imageResponse = await fetch(googlePictureUrl);
    
    if (!imageResponse.ok) {
      console.error(`❌ [syncSSOAvatar] Erro ao fazer download: ${imageResponse.status} ${imageResponse.statusText}`);
      return null;
    }
    
    // Obter tipo de conteúdo da imagem
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const imageType = contentType.split('/')[1] || 'jpg';
    
    // Validar tipo de imagem
    const allowedTypes = ['jpeg', 'jpg', 'png', 'webp'];
    if (!allowedTypes.includes(imageType.toLowerCase())) {
      console.warn(`⚠️ [syncSSOAvatar] Tipo de imagem não suportado: ${contentType}`);
      return null;
    }
    
    // Converter resposta para buffer
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    
    // Validar tamanho (máx 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageBuffer.length > maxSize) {
      console.warn(`⚠️ [syncSSOAvatar] Imagem muito grande: ${imageBuffer.length} bytes`);
      return null;
    }
    
    // Preparar nome do arquivo: email-timestamp.extensao
    const timestamp = Date.now();
    const emailSanitized = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const nomeArquivo = `sso_${emailSanitized}_${timestamp}.${imageType === 'jpeg' ? 'jpg' : imageType}`;
    const filePath = `profile_picture/${nomeArquivo}`;
    
    // Inicializar Google Cloud Storage
    const bucketName = process.env.GCS_BUCKET_NAME2 || 'mediabank_velohub';
    
    let storage;
    try {
      const googleCredentials = process.env.GOOGLE_CREDENTIALS;
      let gcpProjectId = process.env.GCP_PROJECT_ID;
      
      // Tentar obter project_id das credenciais se não estiver definido
      if ((!gcpProjectId || gcpProjectId === 'your-gcp-project-id') && googleCredentials) {
        try {
          const credentials = JSON.parse(googleCredentials);
          if (credentials.project_id) {
            gcpProjectId = credentials.project_id;
          }
        } catch (parseError) {
          // Ignorar erro de parse
        }
      }
      
      if (!gcpProjectId || gcpProjectId === 'your-gcp-project-id') {
        console.error('❌ [syncSSOAvatar] GCP_PROJECT_ID não configurado');
        return null;
      }
      
      if (googleCredentials) {
        if (googleCredentials.trim().startsWith('{') || googleCredentials.trim().startsWith('[')) {
          try {
            const credentials = JSON.parse(googleCredentials);
            if (credentials.private_key) {
              credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
            }
            storage = new Storage({
              projectId: gcpProjectId,
              credentials: credentials
            });
          } catch (parseError) {
            storage = new Storage({
              projectId: gcpProjectId,
              keyFilename: googleCredentials
            });
          }
        } else {
          storage = new Storage({
            projectId: gcpProjectId,
            keyFilename: googleCredentials
          });
        }
      } else {
        console.error('❌ [syncSSOAvatar] GOOGLE_CREDENTIALS não configurado');
        return null;
      }
    } catch (error) {
      console.error('❌ [syncSSOAvatar] Erro ao inicializar Storage:', error);
      return null;
    }
    
    const bucket = storage.bucket(bucketName);
    const blob = bucket.file(filePath);
    
    // Upload do arquivo
    await new Promise((resolve, reject) => {
      const stream = blob.createWriteStream({
        metadata: {
          contentType: contentType,
          metadata: {
            originalName: nomeArquivo,
            uploadedBy: email,
            uploadedAt: new Date().toISOString(),
            source: 'google_sso'
          }
        }
      });
      
      stream.on('error', (error) => {
        console.error('❌ [syncSSOAvatar] Erro ao fazer upload:', error);
        reject(error);
      });
      
      stream.on('finish', () => {
        resolve();
      });
      
      stream.end(imageBuffer);
    });
    
    // Obter URL pública
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;
    
    // Atualizar campo profile_pic no MongoDB
    await funcionariosCollection.updateOne(
      { userMail: email.toLowerCase() },
      { 
        $set: { 
          profile_pic: publicUrl,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log(`✅ [syncSSOAvatar] Avatar sincronizado com sucesso para: ${email}`);
    console.log(`📸 [syncSSOAvatar] URL: ${publicUrl}`);
    
    return publicUrl;
    
  } catch (error) {
    console.error('❌ [syncSSOAvatar] Erro ao sincronizar avatar:', error);
    console.error('❌ [syncSSOAvatar] Stack:', error.stack);
    return null;
  }
}

// POST /api/auth/validate-access
app.post('/api/auth/validate-access', async (req, res) => {
  try {
    const { email, picture } = req.body; // picture é opcional (URL do Google SSO)

    // Validação
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email é obrigatório'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`🔍 [validate-access] Validando acesso para: ${normalizedEmail}`);
    console.log(`🔍 [validate-access] Email original: ${email}`);

    // Conectar ao MongoDB
    await connectToMongo();
    const db = client.db('console_analises');
    const funcionariosCollection = db.collection('qualidade_funcionarios');

    // Buscar usuário por email - tentar múltiplas variações
    let funcionario = await funcionariosCollection.findOne({
      userMail: normalizedEmail
    });

    // Se não encontrou, tentar sem normalização (caso o campo tenha case diferente)
    if (!funcionario) {
      console.log(`⚠️ [validate-access] Tentativa 1 falhou, tentando variações...`);
      funcionario = await funcionariosCollection.findOne({
        $or: [
          { userMail: email }, // Email original
          { userMail: normalizedEmail }, // Email normalizado
          { userMail: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } } // Case-insensitive
        ]
      });
    }

    // Se ainda não encontrou, tentar buscar por email (campo alternativo)
    if (!funcionario) {
      console.log(`⚠️ [validate-access] Tentativa 2 falhou, tentando campo 'email'...`);
      funcionario = await funcionariosCollection.findOne({
        $or: [
          { email: normalizedEmail },
          { email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
        ]
      });
    }

    if (!funcionario) {
      console.log(`❌ [validate-access] Usuário não encontrado após todas as tentativas: ${normalizedEmail}`);
      console.log(`❌ [validate-access] Tentativas realizadas:`);
      console.log(`   - userMail: ${normalizedEmail}`);
      console.log(`   - userMail (case-insensitive)`);
      console.log(`   - email: ${normalizedEmail}`);
      
      // Log adicional para debug - contar total de funcionários na collection
      try {
        const totalFuncionarios = await funcionariosCollection.countDocuments({});
        console.log(`📊 [validate-access] Total de funcionários na collection: ${totalFuncionarios}`);
        
        // Buscar alguns exemplos de emails para debug (apenas em desenvolvimento)
        if (process.env.NODE_ENV === 'development') {
          const sampleEmails = await funcionariosCollection.find({}, { projection: { userMail: 1, email: 1, colaboradorNome: 1 } }).limit(5).toArray();
          console.log(`📋 [validate-access] Exemplos de emails na collection:`, sampleEmails.map(f => ({ 
            userMail: f.userMail, 
            email: f.email, 
            nome: f.colaboradorNome 
          })));
        }
      } catch (debugError) {
        console.error(`❌ [validate-access] Erro ao buscar exemplos para debug:`, debugError.message);
      }
      
      return res.status(404).json({
        success: false,
        error: 'Usuário Inexistente. Contate seu gestor'
      });
    }

    console.log(`✅ [validate-access] Usuário encontrado: ${funcionario.colaboradorNome} (${funcionario.userMail || funcionario.email})`);

    // Validar acesso ao VeloHub - verificar múltiplas variações do campo
    const acessos = funcionario.acessos || {};
    const acessoVelohub = acessos.Velohub || acessos.velohub || acessos.VeloHub || acessos.VELOHUB || false;
    
    console.log(`🔍 [validate-access] Verificando acesso para ${normalizedEmail}:`, {
      acessos: acessos,
      Velohub: acessos.Velohub,
      velohub: acessos.velohub,
      VeloHub: acessos.VeloHub,
      acessoVelohub: acessoVelohub
    });
    
    if (!acessoVelohub) {
      console.log(`❌ [validate-access] Acesso negado para ${normalizedEmail}: Velohub = false`);
      console.log(`❌ [validate-access] Objeto de acessos completo:`, JSON.stringify(acessos, null, 2));
      return res.status(403).json({
        success: false,
        error: 'Acesso Negado. Contate Administrador do Acesso'
      });
    }

    // Sincronizar avatar SSO se fornecido
    let profilePic = funcionario.profile_pic || funcionario.fotoPerfil || null;
    
    if (picture && picture.startsWith('http')) {
      // Se há picture do Google e não há profile_pic no GCS, sincronizar
      const currentProfilePic = funcionario.profile_pic || null;
      if (!currentProfilePic || !currentProfilePic.includes('storage.googleapis.com')) {
        console.log(`🔄 [validate-access] Sincronizando avatar SSO para: ${email}`);
        const syncedPic = await syncSSOAvatar(email, picture);
        if (syncedPic) {
          profilePic = syncedPic;
          // Buscar funcionário atualizado para garantir dados mais recentes
          const updatedFuncionario = await funcionariosCollection.findOne({
            userMail: normalizedEmail
          });
          if (updatedFuncionario && updatedFuncionario.profile_pic) {
            profilePic = updatedFuncionario.profile_pic;
          }
        }
      }
    }

    // Preparar dados do usuário
    // Usar userMail do funcionário encontrado (pode ser de qualquer variação da busca)
    const funcionarioEmail = funcionario.userMail || funcionario.email || normalizedEmail;
    
    const userData = {
      name: funcionario.colaboradorNome || funcionarioEmail,
      email: funcionarioEmail,
      picture: profilePic
    };

    console.log(`✅ [validate-access] Acesso validado: ${funcionario.colaboradorNome} (${funcionarioEmail})`);

    res.json({
      success: true,
      user: userData,
      message: 'Acesso validado com sucesso'
    });

  } catch (error) {
    console.error('❌ Validate Access Error:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

console.log('✅ Endpoint POST /api/auth/validate-access registrado');

// GET /api/auth/check-module-access
// Verificar acesso a um módulo específico
console.log('🔧 Registrando endpoint GET /api/auth/check-module-access...');
app.get('/api/auth/check-module-access', async (req, res) => {
  try {
    const { email, module } = req.query;

    // Validação
    if (!email || !module) {
      return res.status(400).json({
        success: false,
        error: 'Email e módulo são obrigatórios',
        hasAccess: false
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`🔍 [check-module-access] Verificando acesso ao módulo ${module} para: ${normalizedEmail}`);

    // Lista de emails com bypass de acesso (desenvolvedores/admin)
    // Bypass removido - acesso agora é verificado normalmente através da coleção qualidade_funcionarios
    const BYPASS_EMAILS = [];

    // Bypass para desenvolvedores/admin (desabilitado)
    // if (BYPASS_EMAILS.includes(normalizedEmail) && module === 'ouvidoria') {
    //   console.log(`✅ [check-module-access] Bypass ativado para: ${normalizedEmail}`);
    //   return res.json({
    //     success: true,
    //     hasAccess: true,
    //     module: module,
    //     email: normalizedEmail,
    //     bypass: true
    //   });
    // }

    // Conectar ao MongoDB
    await connectToMongo();
    const db = client.db('console_analises');
    const funcionariosCollection = db.collection('qualidade_funcionarios');

    // Buscar usuário por email
    let funcionario = await funcionariosCollection.findOne({
      userMail: normalizedEmail
    });

    // Se não encontrou, tentar variações
    if (!funcionario) {
      funcionario = await funcionariosCollection.findOne({
        $or: [
          { userMail: email },
          { userMail: normalizedEmail },
          { userMail: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
        ]
      });
    }

    if (!funcionario) {
      console.log(`❌ [check-module-access] Usuário não encontrado: ${normalizedEmail}`);
      return res.json({
        success: false,
        hasAccess: false,
        module: module,
        error: 'Usuário não encontrado'
      });
    }

    // Verificar acesso ao VeloHub primeiro (pré-requisito)
    const acessos = funcionario.acessos || {};
    const acessoVelohub = acessos.Velohub || acessos.velohub || acessos.VeloHub || acessos.VELOHUB || false;
    
    if (!acessoVelohub) {
      console.log(`❌ [check-module-access] Acesso negado: usuário não tem acesso ao VeloHub`);
      return res.json({
        success: false,
        hasAccess: false,
        module: module,
        error: 'Acesso ao VeloHub não autorizado'
      });
    }

    // Verificar acesso ao módulo específico
    let hasModuleAccess = false;
    
    if (module === 'ouvidoria') {
      // Verificar acesso ao módulo Ouvidoria (verifica variações de case)
      hasModuleAccess = acessos.ouvidoria === true || 
                        acessos.Ouvidoria === true || 
                        acessos.OUVIDORIA === true;
    } else {
      // Para outros módulos, verificar campo correspondente
      const moduleKey = module.charAt(0).toLowerCase() + module.slice(1);
      hasModuleAccess = acessos[module] === true || acessos[moduleKey] === true;
    }

    console.log(`🔍 [check-module-access] Acesso ao módulo ${module}: ${hasModuleAccess}`);

    res.json({
      success: true,
      hasAccess: hasModuleAccess,
      module: module,
      email: normalizedEmail
    });
  } catch (error) {
    console.error('❌ [check-module-access] Erro:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      hasAccess: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

console.log('✅ Endpoint GET /api/auth/check-module-access registrado');

// POST /api/auth/profile/upload-photo
console.log('🔧 Registrando endpoint POST /api/auth/profile/upload-photo...');
app.post('/api/auth/profile/upload-photo', async (req, res) => {
  try {
    const { email, nome, sobrenome, imageData } = req.body;

    // Validações
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email é obrigatório'
      });
    }

    if (!imageData) {
      return res.status(400).json({
        success: false,
        error: 'Imagem é obrigatória'
      });
    }

    // Validar formato base64
    if (!imageData.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        error: 'Formato de imagem inválido. Use data:image/jpeg;base64,... ou data:image/png;base64,...'
      });
    }

    // Extrair tipo e dados da imagem
    const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({
        success: false,
        error: 'Formato de imagem inválido'
      });
    }

    const imageType = matches[1].toLowerCase();
    const base64Data = matches[2];

    // Validar tipo de imagem
    const allowedTypes = ['jpeg', 'jpg', 'png', 'webp'];
    if (!allowedTypes.includes(imageType)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de imagem não suportado. Use JPEG, PNG ou WebP'
      });
    }

    // Converter base64 para buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Validar tamanho (máx 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageBuffer.length > maxSize) {
      return res.status(400).json({
        success: false,
        error: 'Imagem muito grande. Tamanho máximo: 5MB'
      });
    }

    // Conectar ao MongoDB
    await connectToMongo();
    const db = client.db('console_analises');
    const funcionariosCollection = db.collection('qualidade_funcionarios');

    // Verificar se usuário existe
    const funcionario = await funcionariosCollection.findOne({
      userMail: email.toLowerCase()
    });

    if (!funcionario) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Preparar nome do arquivo: nome.sobrenome-timestamp.extensao
    const timestamp = Date.now();
    const nomeArquivo = `${nome || 'user'}.${sobrenome || 'profile'}-${timestamp}.${imageType === 'jpeg' ? 'jpg' : imageType}`;
    const filePath = `profile_picture/${nomeArquivo}`;

    // Inicializar Google Cloud Storage
    const bucketName = process.env.GCS_BUCKET_NAME2 || 'mediabank_velohub';
    
    let storage;
    try {
      const googleCredentials = process.env.GOOGLE_CREDENTIALS;
      const gcpProjectId = process.env.GCP_PROJECT_ID;
      
      // Verificar se variáveis necessárias estão definidas
      if (!gcpProjectId || gcpProjectId === 'your-gcp-project-id') {
        console.error('❌ GCP_PROJECT_ID não está definido ou está com valor placeholder');
        return res.status(500).json({
          success: false,
          error: 'GCP_PROJECT_ID não configurado. Verifique o arquivo backend/env'
        });
      }
      
      if (googleCredentials) {
        if (googleCredentials.trim().startsWith('{') || googleCredentials.trim().startsWith('[')) {
          try {
            const credentials = JSON.parse(googleCredentials);
            
            // Verificar se credenciais são placeholders
            if (credentials.project_id === 'your-project-id' || 
                credentials.private_key === '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n' ||
                credentials.private_key?.includes('...')) {
              console.error('❌ GOOGLE_CREDENTIALS contém valores placeholder. Configure credenciais reais no arquivo backend/env');
              return res.status(500).json({
                success: false,
                error: 'Credenciais do Google Cloud não configuradas. Verifique o arquivo backend/env'
              });
            }
            
            // Corrigir chave privada: converter \n literais para quebras de linha reais
            if (credentials.private_key) {
              credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
            }
            
            storage = new Storage({
              projectId: gcpProjectId,
              credentials: credentials
            });
          } catch (parseError) {
            console.error('❌ Erro ao fazer parse das credenciais JSON:', parseError);
            storage = new Storage({
              projectId: gcpProjectId,
              keyFilename: googleCredentials
            });
          }
        } else {
          storage = new Storage({
            projectId: gcpProjectId,
            keyFilename: googleCredentials
          });
        }
      } else {
        console.error('❌ GOOGLE_CREDENTIALS não está definido');
        return res.status(500).json({
          success: false,
          error: 'GOOGLE_CREDENTIALS não configurado. Verifique o arquivo backend/env'
        });
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar Storage:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao inicializar Google Cloud Storage',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    const bucket = storage.bucket(bucketName);
    const blob = bucket.file(filePath);

    // Upload do arquivo
    const contentType = `image/${imageType === 'jpeg' ? 'jpeg' : imageType}`;
    
    await new Promise((resolve, reject) => {
      const stream = blob.createWriteStream({
        metadata: {
          contentType: contentType,
          metadata: {
            originalName: nomeArquivo,
            uploadedBy: email,
            uploadedAt: new Date().toISOString()
          }
        }
      });

      stream.on('error', (error) => {
        console.error('❌ Erro ao fazer upload:', error);
        reject(error);
      });

      stream.on('finish', async () => {
        try {
          // Nota: Não é necessário tornar arquivo público manualmente quando o bucket tem uniform bucket-level access habilitado
          resolve();
        } catch (error) {
          console.error('❌ Erro ao finalizar upload:', error);
          reject(error);
        }
      });

      stream.end(imageBuffer);
    });

    // Obter URL pública
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

    // Atualizar campo profile_pic no MongoDB
    await funcionariosCollection.updateOne(
      { userMail: email.toLowerCase() },
      { 
        $set: { 
          profile_pic: publicUrl,
          updatedAt: new Date()
        } 
      }
    );

    console.log(`✅ Foto de perfil enviada com sucesso para: ${email}`);
    console.log(`📸 URL: ${publicUrl}`);

    res.json({
      success: true,
      url: publicUrl,
      message: 'Foto de perfil enviada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao fazer upload da foto de perfil:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Erro ao fazer upload da foto de perfil',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
console.log('✅ Endpoint POST /api/auth/profile/upload-photo registrado');

// GET /api/auth/profile/get-upload-url
console.log('🔧 Registrando endpoint GET /api/auth/profile/get-upload-url...');
app.get('/api/auth/profile/get-upload-url', async (req, res) => {
  try {
    const { email, fileName, contentType } = req.query;
    
    console.log('🔍 [get-upload-url] Parâmetros recebidos:', { email, fileName, contentType });

    // Validações
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email é obrigatório'
      });
    }

    if (!contentType || !contentType.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        error: 'Content-Type deve ser image/jpeg, image/png ou image/webp'
      });
    }

    console.log(`🔍 Gerando signed URL para upload: ${email}`);

    // Conectar ao MongoDB para validar usuário
    await connectToMongo();
    const db = client.db('console_analises');
    const funcionariosCollection = db.collection('qualidade_funcionarios');

    // Verificar se usuário existe
    const funcionario = await funcionariosCollection.findOne({
      userMail: email.toLowerCase()
    });

    if (!funcionario) {
      console.log(`❌ Usuário não encontrado: ${email}`);
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Preparar nome do arquivo
    const timestamp = Date.now();
    const nomeArquivo = fileName || `profile-${timestamp}.${contentType.split('/')[1]}`;
    const filePath = `profile_picture/${nomeArquivo}`;

    // Inicializar Google Cloud Storage
    const bucketName = process.env.GCS_BUCKET_NAME2 || 'mediabank_velohub';
    
    let storage;
    try {
      const googleCredentials = process.env.GOOGLE_CREDENTIALS;
      const googleApplicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      const gcpProjectId = process.env.GCP_PROJECT_ID;
      
      console.log('🔍 [get-upload-url] Verificando credenciais...');
      console.log('🔍 [get-upload-url] GCP_PROJECT_ID:', gcpProjectId ? `${gcpProjectId.substring(0, 20)}...` : 'NÃO DEFINIDO');
      console.log('🔍 [get-upload-url] GOOGLE_CREDENTIALS:', googleCredentials ? `${googleCredentials.substring(0, 50)}...` : 'NÃO DEFINIDO');
      console.log('🔍 [get-upload-url] GOOGLE_APPLICATION_CREDENTIALS:', googleApplicationCredentials || 'NÃO DEFINIDO');
      
      // Verificar se variáveis necessárias estão definidas
      if (!gcpProjectId || gcpProjectId === 'your-gcp-project-id') {
        console.error('❌ [get-upload-url] GCP_PROJECT_ID não está definido ou está com valor placeholder');
        return res.status(500).json({
          success: false,
          error: 'GCP_PROJECT_ID não configurado. Verifique o arquivo backend/env'
        });
      }
      
      // Prioridade 1: GOOGLE_APPLICATION_CREDENTIALS (caminho para arquivo JSON)
      if (googleApplicationCredentials) {
        console.log('🔍 [get-upload-url] Usando GOOGLE_APPLICATION_CREDENTIALS:', googleApplicationCredentials);
        try {
          storage = new Storage({
            projectId: gcpProjectId,
            keyFilename: googleApplicationCredentials
          });
          console.log('✅ [get-upload-url] Storage inicializado com GOOGLE_APPLICATION_CREDENTIALS');
        } catch (fileError) {
          console.error('❌ [get-upload-url] Erro ao carregar arquivo de credenciais:', fileError);
          // Continuar para tentar outras opções
        }
      }
      
      // Prioridade 2: GOOGLE_CREDENTIALS (JSON string ou caminho de arquivo)
      if (!storage && googleCredentials) {
        // Se começa com { ou [, é JSON
        if (googleCredentials.trim().startsWith('{') || googleCredentials.trim().startsWith('[')) {
          try {
            const credentials = JSON.parse(googleCredentials);
            
            console.log('🔍 [get-upload-url] Credenciais parseadas com sucesso');
            console.log('🔍 [get-upload-url] Project ID nas credenciais:', credentials.project_id);
            console.log('🔍 [get-upload-url] Client email:', credentials.client_email);
            console.log('🔍 [get-upload-url] Private key length:', credentials.private_key ? credentials.private_key.length : 'N/A');
            console.log('🔍 [get-upload-url] Private key preview:', credentials.private_key ? credentials.private_key.substring(0, 50) + '...' : 'N/A');
            
            // Verificar se credenciais são placeholders
            if (credentials.project_id === 'your-project-id' || 
                credentials.private_key === '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n' ||
                credentials.private_key?.includes('...')) {
              console.warn('⚠️ [get-upload-url] GOOGLE_CREDENTIALS contém valores placeholder. Tentando usar Application Default Credentials...');
              // Não retornar erro, tentar usar ADC
              storage = null; // Será inicializado abaixo com ADC
            } else {
              // Credenciais válidas, usar normalmente
              // Corrigir chave privada: converter \n literais para quebras de linha reais
              if (credentials.private_key) {
                const originalLength = credentials.private_key.length;
                credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
                console.log('🔍 [get-upload-url] Chave privada processada. Tamanho original:', originalLength, 'Tamanho após processamento:', credentials.private_key.length);
                
                // Verificar se a chave privada tem formato válido
                if (!credentials.private_key.includes('BEGIN PRIVATE KEY') || 
                    !credentials.private_key.includes('END PRIVATE KEY')) {
                  console.error('❌ [get-upload-url] Chave privada não tem formato válido');
                  return res.status(500).json({
                    success: false,
                    error: 'Chave privada inválida: não contém BEGIN/END PRIVATE KEY'
                  });
                }
              }
              
              console.log('🔍 [get-upload-url] Inicializando Storage com credenciais JSON...');
              storage = new Storage({
                projectId: gcpProjectId,
                credentials: credentials
              });
              console.log('✅ [get-upload-url] Storage inicializado com credenciais JSON');
            }
          } catch (parseError) {
            console.error('❌ Erro ao fazer parse das credenciais JSON:', parseError);
            // Tentar como caminho de arquivo mesmo assim
            storage = new Storage({
              projectId: gcpProjectId,
              keyFilename: googleCredentials
            });
          }
        } else {
          // É um caminho de arquivo
          console.log('🔍 [get-upload-url] Inicializando Storage com arquivo de credenciais...');
          storage = new Storage({
            projectId: gcpProjectId,
            keyFilename: googleCredentials
          });
          console.log('✅ [get-upload-url] Storage inicializado com arquivo de credenciais');
        }
      } else {
        console.warn('⚠️ [get-upload-url] GOOGLE_CREDENTIALS não está definido. Tentando usar Application Default Credentials...');
        storage = null; // Será inicializado abaixo com ADC
      }
      
      // Se storage ainda não foi inicializado (credenciais eram placeholders ou não existiam), usar ADC
      if (!storage) {
        console.log('⚠️ [get-upload-url] Tentando usar Application Default Credentials (ADC)...');
        console.log('⚠️ [get-upload-url] Se não funcionar, execute: gcloud auth application-default login');
        try {
          storage = new Storage({
            projectId: gcpProjectId
            // Sem credentials - usa ADC automaticamente
          });
          console.log('✅ [get-upload-url] Storage inicializado com Application Default Credentials');
        } catch (adcError) {
          console.error('❌ [get-upload-url] Erro ao usar Application Default Credentials:', adcError);
          const errorMessage = adcError.message || 'Erro desconhecido';
          
          // Mensagem mais detalhada para desenvolvimento
          let userMessage = 'Credenciais do Google Cloud não configuradas.';
          let instructions = [];
          
          if (errorMessage.includes('Could not load the default credentials')) {
            instructions.push('Opção 1: Execute no terminal: gcloud auth application-default login');
            instructions.push('Opção 2: Configure GOOGLE_CREDENTIALS no arquivo backend/env com o JSON completo do Service Account');
            instructions.push('Opção 3: Configure GOOGLE_APPLICATION_CREDENTIALS apontando para o arquivo JSON do Service Account');
          }
          
          return res.status(500).json({
            success: false,
            error: userMessage,
            instructions: instructions.length > 0 ? instructions : undefined,
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
          });
        }
      }
    } catch (error) {
      console.error('❌ [get-upload-url] Erro ao inicializar Storage:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao inicializar Google Cloud Storage',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    console.log('🔍 [get-upload-url] Tentando gerar signed URL para:', filePath);
    console.log('🔍 [get-upload-url] ContentType:', contentType);
    console.log('🔍 [get-upload-url] Bucket:', bucketName);

    // Gerar signed URL para upload (válida por 15 minutos)
    let signedUrl;
    try {
      [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutos
        contentType: contentType
      });
      console.log('✅ [get-upload-url] Signed URL gerada com sucesso');
    } catch (signError) {
      console.error('❌ [get-upload-url] Erro ao gerar signed URL:', signError);
      console.error('❌ [get-upload-url] Stack:', signError.stack);
      throw signError;
    }

    // URL pública esperada após upload
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

    console.log(`✅ Signed URL gerada para: ${email}`);
    console.log(`📸 FilePath: ${filePath}`);

    res.json({
      success: true,
      signedUrl: signedUrl,
      filePath: filePath,
      publicUrl: publicUrl,
      expiresIn: 15 * 60 * 1000 // 15 minutos em ms
    });

  } catch (error) {
    console.error('❌ [get-upload-url] Erro ao gerar signed URL:', error);
    console.error('❌ [get-upload-url] Stack:', error.stack);
    console.error('❌ [get-upload-url] Error name:', error.name);
    console.error('❌ [get-upload-url] Error message:', error.message);
    
    // Verificar se é erro de credenciais
    if (error.message && error.message.includes('DECODER')) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao processar credenciais do Google Cloud. Verifique se GOOGLE_CREDENTIALS está configurado corretamente no arquivo backend/env',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Verificar se é erro de credenciais não encontradas
    if (error.message && error.message.includes('Could not load the default credentials')) {
      return res.status(500).json({
        success: false,
        error: 'Credenciais do Google Cloud não configuradas',
        instructions: [
          'Opção 1: Execute no terminal: gcloud auth application-default login',
          'Opção 2: Configure GOOGLE_CREDENTIALS no arquivo backend/env com o JSON completo do Service Account',
          'Opção 3: Configure a variável GOOGLE_APPLICATION_CREDENTIALS apontando para o arquivo JSON'
        ],
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Verificar se é erro de falta de client_email (ADC de usuário não funciona para signed URLs)
    if (error.message && error.message.includes('Cannot sign data without `client_email`')) {
      return res.status(500).json({
        success: false,
        error: 'Credenciais de usuário não podem gerar signed URLs. É necessário um Service Account.',
        instructions: [
          'Para gerar signed URLs, você precisa de um Service Account com chave privada.',
          'Opção 1: Configure GOOGLE_CREDENTIALS no arquivo backend/env com o JSON completo do Service Account',
          'Opção 2: Configure GOOGLE_APPLICATION_CREDENTIALS apontando para o arquivo JSON do Service Account',
          'Como obter: Google Cloud Console > IAM & Admin > Service Accounts > Criar/Selecionar > Keys > Add Key > JSON'
        ],
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar URL de upload',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
console.log('✅ Endpoint GET /api/auth/profile/get-upload-url registrado');

// POST /api/auth/profile/confirm-upload
console.log('🔧 Registrando endpoint POST /api/auth/profile/confirm-upload...');
app.post('/api/auth/profile/confirm-upload', async (req, res) => {
  try {
    const { email, filePath } = req.body;

    // Validações
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email é obrigatório'
      });
    }

    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'filePath é obrigatório'
      });
    }

    console.log(`🔍 Confirmando upload para: ${email}, arquivo: ${filePath}`);

    // Conectar ao MongoDB
    await connectToMongo();
    const db = client.db('console_analises');
    const funcionariosCollection = db.collection('qualidade_funcionarios');

    // Verificar se usuário existe
    const funcionario = await funcionariosCollection.findOne({
      userMail: email.toLowerCase()
    });

    if (!funcionario) {
      console.log(`❌ Usuário não encontrado: ${email}`);
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Verificar se arquivo existe no GCS
    const bucketName = process.env.GCS_BUCKET_NAME2 || 'mediabank_velohub';
    
    let storage;
    try {
      const googleCredentials = process.env.GOOGLE_CREDENTIALS;
      const gcpProjectId = process.env.GCP_PROJECT_ID;
      
      // Verificar se variáveis necessárias estão definidas
      if (!gcpProjectId || gcpProjectId === 'your-gcp-project-id') {
        console.error('❌ GCP_PROJECT_ID não está definido ou está com valor placeholder');
        return res.status(500).json({
          success: false,
          error: 'GCP_PROJECT_ID não configurado. Verifique o arquivo backend/env'
        });
      }
      
      if (googleCredentials) {
        if (googleCredentials.trim().startsWith('{') || googleCredentials.trim().startsWith('[')) {
          try {
            const credentials = JSON.parse(googleCredentials);
            
            // Verificar se credenciais são placeholders
            if (credentials.project_id === 'your-project-id' || 
                credentials.private_key === '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n' ||
                credentials.private_key?.includes('...')) {
              console.error('❌ GOOGLE_CREDENTIALS contém valores placeholder. Configure credenciais reais no arquivo backend/env');
              return res.status(500).json({
                success: false,
                error: 'Credenciais do Google Cloud não configuradas. Verifique o arquivo backend/env'
              });
            }
            
            // Corrigir chave privada: converter \n literais para quebras de linha reais
            if (credentials.private_key) {
              credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
            }
            
            storage = new Storage({
              projectId: gcpProjectId,
              credentials: credentials
            });
          } catch (parseError) {
            console.error('❌ Erro ao fazer parse das credenciais JSON:', parseError);
            storage = new Storage({
              projectId: gcpProjectId,
              keyFilename: googleCredentials
            });
          }
        } else {
          storage = new Storage({
            projectId: gcpProjectId,
            keyFilename: googleCredentials
          });
        }
      } else {
        console.error('❌ GOOGLE_CREDENTIALS não está definido');
        return res.status(500).json({
          success: false,
          error: 'GOOGLE_CREDENTIALS não configurado. Verifique o arquivo backend/env'
        });
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar Storage:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao inicializar Google Cloud Storage',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    // Verificar se arquivo existe
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado no GCS'
      });
    }

    // Nota: Não é necessário tornar arquivo público manualmente quando o bucket tem uniform bucket-level access habilitado
    // O arquivo já será acessível publicamente se o bucket estiver configurado corretamente

    // URL pública
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

    // Atualizar campo profile_pic no MongoDB
    await funcionariosCollection.updateOne(
      { userMail: email.toLowerCase() },
      { 
        $set: { 
          profile_pic: publicUrl,
          updatedAt: new Date()
        } 
      }
    );

    console.log(`✅ Upload confirmado para: ${email}`);
    console.log(`📸 URL: ${publicUrl}`);

    res.json({
      success: true,
      url: publicUrl,
      message: 'Upload confirmado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao confirmar upload:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Erro ao confirmar upload',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
console.log('✅ Endpoint POST /api/auth/profile/confirm-upload registrado');

// POST /api/chat/attachments/get-upload-url
console.log('🔧 Registrando endpoint POST /api/chat/attachments/get-upload-url...');
app.post('/api/chat/attachments/get-upload-url', async (req, res) => {
  try {
    const { fileName, contentType, mediaType } = req.body;
    const sessionId = req.headers['x-session-id'] || req.body?.sessionId;
    
    console.log('🔍 [chat-attachments/get-upload-url] Parâmetros recebidos:', { fileName, contentType, mediaType });

    // Validações
    if (!sessionId) {
      return res.status(401).json({
        success: false,
        error: 'Sessão não encontrada'
      });
    }

    if (!contentType || !contentType.startsWith('image/') && !contentType.startsWith('video/') && !contentType.startsWith('application/') && !contentType.startsWith('text/')) {
      return res.status(400).json({
        success: false,
        error: 'Content-Type inválido'
      });
    }

    if (!mediaType || !['image', 'video', 'file', 'audio'].includes(mediaType)) {
      return res.status(400).json({
        success: false,
        error: 'mediaType deve ser: image, video, file ou audio'
      });
    }

    // Obter dados do usuário da sessão
    await connectToMongo();
    const db = client.db('console_conteudo');
    const session = await db.collection('hub_sessions').findOne({
      sessionId: sessionId,
      isActive: true
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Sessão inválida ou expirada'
      });
    }

    const userEmail = session.userEmail;

    // Determinar pasta baseado em mediaType
    // NOTA: Pastas são criadas diretamente no bucket velochat_anexos (sem prefixo)
    let folderPath;
    switch (mediaType) {
      case 'image':
        folderPath = 'imagens';
        break;
      case 'video':
        folderPath = 'videos';
        break;
      case 'file':
        folderPath = 'documentos';
        break;
      case 'audio':
        folderPath = 'audios';
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'mediaType inválido'
        });
    }

    // Preparar nome do arquivo com timestamp
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const finalFileName = `${timestamp}-${sanitizedFileName}`;
    const filePath = `${folderPath}/${finalFileName}`;

    console.log(`🔍 Gerando signed URL para upload de anexo: ${filePath}`);
    console.log(`📁 [Classificação] mediaType: ${mediaType}, folderPath: ${folderPath}, contentType: ${contentType}`);
    
    // Validação adicional: garantir que contentType corresponde ao mediaType
    if (mediaType === 'image' && !contentType.startsWith('image/')) {
      console.warn(`⚠️ [Classificação] Inconsistência: mediaType=image mas contentType=${contentType}`);
    }
    if (mediaType === 'video' && !contentType.startsWith('video/')) {
      console.warn(`⚠️ [Classificação] Inconsistência: mediaType=video mas contentType=${contentType}`);
    }

    // Inicializar Google Cloud Storage
    // NOTA: GCS_BUCKET_CHAT é específico para anexos do chat
    // GCS_BUCKET_NAME2 continua sendo usado para outras mídias do VeloHub (fotos de perfil, etc.)
    const bucketName = process.env.GCS_BUCKET_CHAT || 'velochat_anexos';
    
    let storage;
    try {
      const googleCredentials = process.env.GOOGLE_CREDENTIALS;
      const googleApplicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      let gcpProjectId = process.env.GCP_PROJECT_ID;
      
      console.log('🔍 [chat-attachments/get-upload-url] Verificando credenciais...');
      console.log('🔍 [chat-attachments/get-upload-url] GCP_PROJECT_ID:', gcpProjectId ? `${gcpProjectId.substring(0, 20)}...` : 'NÃO DEFINIDO');
      console.log('🔍 [chat-attachments/get-upload-url] GOOGLE_CREDENTIALS:', googleCredentials ? `${googleCredentials.substring(0, 50)}...` : 'NÃO DEFINIDO');
      console.log('🔍 [chat-attachments/get-upload-url] GOOGLE_APPLICATION_CREDENTIALS:', googleApplicationCredentials || 'NÃO DEFINIDO');
      
      // Tentar obter project_id das credenciais se GCP_PROJECT_ID não estiver definido
      if ((!gcpProjectId || gcpProjectId === 'your-gcp-project-id') && googleCredentials) {
        try {
          const credentials = JSON.parse(googleCredentials);
          if (credentials.project_id) {
            gcpProjectId = credentials.project_id;
            console.log('✅ [chat-attachments/get-upload-url] Usando project_id das credenciais:', gcpProjectId);
          }
        } catch (parseError) {
          // Ignorar erro de parse, tentará usar como arquivo depois
        }
      }
      
      // Prioridade 1: GOOGLE_APPLICATION_CREDENTIALS (caminho para arquivo JSON)
      // Tentar obter project_id do arquivo se ainda não foi obtido
      if ((!gcpProjectId || gcpProjectId === 'your-gcp-project-id') && googleApplicationCredentials) {
        try {
          const fs = require('fs');
          const credentialsContent = fs.readFileSync(googleApplicationCredentials, 'utf8');
          const credentials = JSON.parse(credentialsContent);
          if (credentials.project_id) {
            gcpProjectId = credentials.project_id;
            console.log('✅ [chat-attachments/get-upload-url] Usando project_id do arquivo GOOGLE_APPLICATION_CREDENTIALS:', gcpProjectId);
          }
        } catch (readError) {
          console.warn('⚠️ [chat-attachments/get-upload-url] Não foi possível ler project_id do arquivo GOOGLE_APPLICATION_CREDENTIALS:', readError.message);
        }
      }
      
      // Verificar se variáveis necessárias estão definidas (após tentar obter de todas as fontes)
      if (!gcpProjectId || gcpProjectId === 'your-gcp-project-id') {
        console.error('❌ [chat-attachments/get-upload-url] GCP_PROJECT_ID não está definido ou está com valor placeholder');
        return res.status(500).json({
          success: false,
          error: 'GCP_PROJECT_ID não configurado. Verifique o arquivo backend/env ou configure GOOGLE_CREDENTIALS/GOOGLE_APPLICATION_CREDENTIALS com project_id'
        });
      }
      
      if (googleApplicationCredentials) {
        console.log('🔍 [chat-attachments/get-upload-url] Usando GOOGLE_APPLICATION_CREDENTIALS:', googleApplicationCredentials);
        try {
          storage = new Storage({
            projectId: gcpProjectId,
            keyFilename: googleApplicationCredentials
          });
          console.log('✅ [chat-attachments/get-upload-url] Storage inicializado com GOOGLE_APPLICATION_CREDENTIALS');
        } catch (fileError) {
          console.error('❌ [chat-attachments/get-upload-url] Erro ao carregar arquivo de credenciais:', fileError);
          // Continuar para tentar outras opções
        }
      }
      
      // Prioridade 2: GOOGLE_CREDENTIALS (JSON string ou caminho de arquivo)
      if (!storage && googleCredentials) {
        // Se começa com { ou [, é JSON
        if (googleCredentials.trim().startsWith('{') || googleCredentials.trim().startsWith('[')) {
          try {
            const credentials = JSON.parse(googleCredentials);
            
            console.log('🔍 [chat-attachments/get-upload-url] Credenciais parseadas com sucesso');
            console.log('🔍 [chat-attachments/get-upload-url] Project ID nas credenciais:', credentials.project_id);
            console.log('🔍 [chat-attachments/get-upload-url] Client email:', credentials.client_email);
            console.log('🔍 [chat-attachments/get-upload-url] Private key length:', credentials.private_key ? credentials.private_key.length : 'N/A');
            console.log('🔍 [chat-attachments/get-upload-url] Private key preview:', credentials.private_key ? credentials.private_key.substring(0, 50) + '...' : 'N/A');
            
            // Usar project_id das credenciais se disponível e GCP_PROJECT_ID não foi definido
            if (credentials.project_id && (!gcpProjectId || gcpProjectId === 'your-gcp-project-id')) {
              gcpProjectId = credentials.project_id;
              console.log('✅ [chat-attachments/get-upload-url] Usando project_id das credenciais:', gcpProjectId);
            }
            
            // Verificar se credenciais são placeholders
            if (credentials.project_id === 'your-project-id' || 
                credentials.private_key === '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n' ||
                credentials.private_key?.includes('...')) {
              console.warn('⚠️ [chat-attachments/get-upload-url] GOOGLE_CREDENTIALS contém valores placeholder. Tentando usar Application Default Credentials...');
              // Não retornar erro, tentar usar ADC
              storage = null; // Será inicializado abaixo com ADC
            } else {
              // Credenciais válidas, usar normalmente
              // Corrigir chave privada: converter \n literais para quebras de linha reais
              if (credentials.private_key) {
                const originalLength = credentials.private_key.length;
                credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
                console.log('🔍 [chat-attachments/get-upload-url] Chave privada processada. Tamanho original:', originalLength, 'Tamanho após processamento:', credentials.private_key.length);
                
                // Verificar se a chave privada tem formato válido
                if (!credentials.private_key.includes('BEGIN PRIVATE KEY') || 
                    !credentials.private_key.includes('END PRIVATE KEY')) {
                  console.error('❌ [chat-attachments/get-upload-url] Chave privada não tem formato válido');
                  return res.status(500).json({
                    success: false,
                    error: 'Chave privada inválida: não contém BEGIN/END PRIVATE KEY'
                  });
                }
              }
              
              console.log('🔍 [chat-attachments/get-upload-url] Inicializando Storage com credenciais JSON...');
              storage = new Storage({
                projectId: gcpProjectId,
                credentials: credentials
              });
              console.log('✅ [chat-attachments/get-upload-url] Storage inicializado com credenciais JSON');
            }
          } catch (parseError) {
            console.error('❌ [chat-attachments/get-upload-url] Erro ao fazer parse das credenciais JSON:', parseError);
            // Tentar como caminho de arquivo mesmo assim
            try {
              storage = new Storage({
                projectId: gcpProjectId,
                keyFilename: googleCredentials
              });
            } catch (fileError) {
              console.error('❌ [chat-attachments/get-upload-url] Erro ao usar como arquivo:', fileError);
              // Continuar para tentar ADC
            }
          }
        } else {
          // É um caminho de arquivo
          console.log('🔍 [chat-attachments/get-upload-url] Inicializando Storage com arquivo de credenciais...');
          try {
            // Tentar ler o arquivo para obter project_id se necessário
            if ((!gcpProjectId || gcpProjectId === 'your-gcp-project-id')) {
              try {
                const fs = require('fs');
                const credentialsContent = fs.readFileSync(googleCredentials, 'utf8');
                const credentials = JSON.parse(credentialsContent);
                if (credentials.project_id) {
                  gcpProjectId = credentials.project_id;
                  console.log('✅ [chat-attachments/get-upload-url] Usando project_id do arquivo de credenciais:', gcpProjectId);
                }
              } catch (readError) {
                console.warn('⚠️ [chat-attachments/get-upload-url] Não foi possível ler project_id do arquivo:', readError.message);
              }
            }
            
            storage = new Storage({
              projectId: gcpProjectId,
              keyFilename: googleCredentials
            });
            console.log('✅ [chat-attachments/get-upload-url] Storage inicializado com arquivo de credenciais');
          } catch (fileError) {
            console.error('❌ [chat-attachments/get-upload-url] Erro ao carregar arquivo de credenciais:', fileError);
            // Continuar para tentar ADC
          }
        }
      }
      
      // Se storage ainda não foi inicializado (credenciais eram placeholders ou não existiam), usar ADC
      if (!storage) {
        // Tentar obter project_id do ADC se ainda não foi obtido
        if ((!gcpProjectId || gcpProjectId === 'your-gcp-project-id')) {
          try {
            const { GoogleAuth } = require('google-auth-library');
            const auth = new GoogleAuth({
              scopes: ['https://www.googleapis.com/auth/cloud-platform']
            });
            const projectId = await auth.getProjectId();
            if (projectId) {
              gcpProjectId = projectId;
              console.log('✅ [chat-attachments/get-upload-url] Usando project_id do ADC:', gcpProjectId);
            }
          } catch (adcProjectError) {
            console.warn('⚠️ [chat-attachments/get-upload-url] Não foi possível obter project_id do ADC:', adcProjectError.message);
          }
        }
        
        console.log('⚠️ [chat-attachments/get-upload-url] Tentando usar Application Default Credentials (ADC)...');
        console.log('⚠️ [chat-attachments/get-upload-url] Se não funcionar, execute: gcloud auth application-default login');
        try {
          storage = new Storage({
            projectId: gcpProjectId || undefined // Se não tiver projectId, deixa undefined para usar ADC
            // Sem credentials - usa ADC automaticamente
          });
          console.log('✅ [chat-attachments/get-upload-url] Storage inicializado com Application Default Credentials');
          
          // Verificar se as credenciais ADC têm client_email (necessário para signed URLs)
          // ADC de usuário não tem client_email, apenas Service Accounts têm
          try {
            const { GoogleAuth } = require('google-auth-library');
            const auth = new GoogleAuth({
              scopes: ['https://www.googleapis.com/auth/cloud-platform']
            });
            const client = await auth.getClient();
            
            let hasClientEmail = false;
            
            // Verificar se é Service Account (tem client_email) ou credencial de usuário
            // Tentar múltiplas formas de verificar
            if (client) {
              // Método 1: getCredentials()
              if (typeof client.getCredentials === 'function') {
                try {
                  const credentials = await client.getCredentials();
                  hasClientEmail = !!credentials?.client_email;
                  console.log('🔍 [chat-attachments/get-upload-url] Verificação via getCredentials():', { hasClientEmail, clientEmail: credentials?.client_email?.substring(0, 20) + '...' });
                } catch (getCredsError) {
                  console.warn('⚠️ [chat-attachments/get-upload-url] Erro ao chamar getCredentials():', getCredsError.message);
                }
              }
              
              // Método 2: Verificar propriedades diretas do client
              if (!hasClientEmail && client.client_email) {
                hasClientEmail = true;
                console.log('🔍 [chat-attachments/get-upload-url] client_email encontrado diretamente no client');
              }
              
              // Método 3: Verificar se é JWT (Service Account) vs OAuth2 (usuário)
              if (!hasClientEmail && client.credentials && client.credentials.client_email) {
                hasClientEmail = true;
                console.log('🔍 [chat-attachments/get-upload-url] client_email encontrado em client.credentials');
              }
            }
            
            if (!hasClientEmail) {
              console.error('❌ [chat-attachments/get-upload-url] ADC não tem client_email - credenciais de usuário não podem gerar signed URLs');
              return res.status(500).json({
                success: false,
                error: 'Credenciais de usuário não podem gerar signed URLs. É necessário um Service Account.',
                instructions: [
                  'Para gerar signed URLs, você precisa de um Service Account com chave privada.',
                  'Opção 1: Configure GOOGLE_CREDENTIALS no arquivo backend/env com o JSON completo do Service Account',
                  'Opção 2: Configure GOOGLE_APPLICATION_CREDENTIALS apontando para o arquivo JSON do Service Account',
                  'Como obter: Google Cloud Console > IAM & Admin > Service Accounts > Criar/Selecionar > Keys > Add Key > JSON'
                ],
                details: process.env.NODE_ENV === 'development' ? 'ADC não possui client_email necessário para assinar URLs' : undefined
              });
            } else {
              console.log('✅ [chat-attachments/get-upload-url] Credenciais ADC têm client_email - Service Account detectado');
            }
          } catch (checkError) {
            console.warn('⚠️ [chat-attachments/get-upload-url] Não foi possível verificar tipo de credenciais ADC:', checkError.message);
            console.warn('⚠️ [chat-attachments/get-upload-url] Continuando - se falhar ao gerar signed URL, será capturado abaixo');
            // Continuar e tentar gerar signed URL - se falhar, será capturado abaixo
          }
        } catch (adcError) {
          console.error('❌ [chat-attachments/get-upload-url] Erro ao usar Application Default Credentials:', adcError);
          const errorMessage = adcError.message || 'Erro desconhecido';
          
          // Mensagem mais detalhada para desenvolvimento
          let userMessage = 'Credenciais do Google Cloud não configuradas.';
          let instructions = [];
          
          if (errorMessage.includes('Could not load the default credentials')) {
            instructions.push('Opção 1: Execute no terminal: gcloud auth application-default login');
            instructions.push('Opção 2: Configure GOOGLE_CREDENTIALS no arquivo backend/env com o JSON completo do Service Account');
            instructions.push('Opção 3: Configure GOOGLE_APPLICATION_CREDENTIALS apontando para o arquivo JSON do Service Account');
          }
          
          // Verificar se é erro de falta de client_email (ADC de usuário não funciona para signed URLs)
          if (errorMessage.includes('Cannot sign data without `client_email`')) {
            userMessage = 'Credenciais de usuário não podem gerar signed URLs. É necessário um Service Account.';
            instructions = [
              'Para gerar signed URLs, você precisa de um Service Account com chave privada.',
              'Opção 1: Configure GOOGLE_CREDENTIALS no arquivo backend/env com o JSON completo do Service Account',
              'Opção 2: Configure GOOGLE_APPLICATION_CREDENTIALS apontando para o arquivo JSON do Service Account',
              'Como obter: Google Cloud Console > IAM & Admin > Service Accounts > Criar/Selecionar > Keys > Add Key > JSON'
            ];
          }
          
          return res.status(500).json({
            success: false,
            error: userMessage,
            instructions: instructions.length > 0 ? instructions : undefined,
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
          });
        }
      }
    } catch (error) {
      console.error('❌ [chat-attachments/get-upload-url] Erro ao inicializar Storage:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao inicializar Google Cloud Storage',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    // Gerar signed URL válida por 15 minutos
    let signedUrl;
    try {
      [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutos
        contentType: contentType
      });
    } catch (signError) {
      console.error('❌ [chat-attachments/get-upload-url] Erro ao gerar signed URL:', signError);
      console.error('❌ [chat-attachments/get-upload-url] Stack:', signError.stack);
      
      // Verificar se é erro de falta de client_email (ADC de usuário não funciona para signed URLs)
      if (signError.message && signError.message.includes('Cannot sign data without `client_email`')) {
        return res.status(500).json({
          success: false,
          error: 'Credenciais de usuário não podem gerar signed URLs. É necessário um Service Account.',
          instructions: [
            'Para gerar signed URLs, você precisa de um Service Account com chave privada.',
            'Opção 1: Configure GOOGLE_CREDENTIALS no arquivo backend/env com o JSON completo do Service Account',
            'Opção 2: Configure GOOGLE_APPLICATION_CREDENTIALS apontando para o arquivo JSON do Service Account',
            'Como obter: Google Cloud Console > IAM & Admin > Service Accounts > Criar/Selecionar > Keys > Add Key > JSON'
          ],
          details: process.env.NODE_ENV === 'development' ? signError.message : undefined
        });
      }
      
      // Re-lançar outros erros para serem capturados pelo catch externo
      throw signError;
    }

    // URL pública esperada após upload
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

    console.log(`✅ Signed URL gerada para: ${filePath}`);

    // Tentar configurar CORS automaticamente se necessário (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      try {
        const corsConfig = [
          {
            origin: [
              'http://localhost:8080',
              'http://localhost:3000',
              'https://app.velohub.velotax.com.br',
              'https://velohub-278491073220.us-east1.run.app'
            ],
            method: ['GET', 'HEAD', 'PUT', 'POST', 'OPTIONS'],
            responseHeader: [
              'Content-Type',
              'Content-Length',
              'Content-Disposition',
              'Access-Control-Allow-Origin',
              'Access-Control-Allow-Methods',
              'Access-Control-Allow-Headers',
              'x-goog-resumable'
            ],
            maxAgeSeconds: 3600
          }
        ];
        
        // Configurar CORS no bucket (pode falhar se não tiver permissões)
        await bucket.setCorsConfiguration(corsConfig).catch(err => {
          // Log silencioso - não é crítico se falhar
          console.log('ℹ️ [get-upload-url] Não foi possível configurar CORS automaticamente:', err.message);
          console.log('ℹ️ [get-upload-url] Configure manualmente via: gsutil cors set gcs-cors-config-velochat.json gs://velochat_anexos');
        });
      } catch (corsError) {
        // Ignorar erro de CORS - não é crítico
        console.log('ℹ️ [get-upload-url] CORS não configurado automaticamente. Configure manualmente se necessário.');
      }
    }

    return res.json({
      success: true,
      signedUrl,
      publicUrl,
      filePath
    });

  } catch (error) {
    console.error('❌ [chat-attachments/get-upload-url] Erro ao gerar signed URL:', error);
    console.error('❌ [chat-attachments/get-upload-url] Stack:', error.stack);
    console.error('❌ [chat-attachments/get-upload-url] Error name:', error.name);
    console.error('❌ [chat-attachments/get-upload-url] Error message:', error.message);
    
    // Verificar se é erro de credenciais
    if (error.message && error.message.includes('DECODER')) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao processar credenciais do Google Cloud. Verifique se GOOGLE_CREDENTIALS está configurado corretamente no arquivo backend/env',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Verificar se é erro de credenciais não encontradas
    if (error.message && error.message.includes('Could not load the default credentials')) {
      return res.status(500).json({
        success: false,
        error: 'Credenciais do Google Cloud não configuradas',
        instructions: [
          'Opção 1: Execute no terminal: gcloud auth application-default login',
          'Opção 2: Configure GOOGLE_CREDENTIALS no arquivo backend/env com o JSON completo do Service Account',
          'Opção 3: Configure a variável GOOGLE_APPLICATION_CREDENTIALS apontando para o arquivo JSON'
        ],
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Verificar se é erro de falta de client_email (ADC de usuário não funciona para signed URLs)
    if (error.message && error.message.includes('Cannot sign data without `client_email`')) {
      return res.status(500).json({
        success: false,
        error: 'Credenciais de usuário não podem gerar signed URLs. É necessário um Service Account.',
        instructions: [
          'Para gerar signed URLs, você precisa de um Service Account com chave privada.',
          'Opção 1: Configure GOOGLE_CREDENTIALS no arquivo backend/env com o JSON completo do Service Account',
          'Opção 2: Configure GOOGLE_APPLICATION_CREDENTIALS apontando para o arquivo JSON do Service Account',
          'Como obter: Google Cloud Console > IAM & Admin > Service Accounts > Criar/Selecionar > Keys > Add Key > JSON'
        ],
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar URL de upload',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
console.log('✅ Endpoint POST /api/chat/attachments/get-upload-url registrado');

// POST /api/chat/attachments/confirm-upload
// Tornar arquivo público após upload bem-sucedido
app.post('/api/chat/attachments/confirm-upload', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'filePath é obrigatório'
      });
    }

    const bucketName = 'velochat_anexos';
    
    // Inicializar Storage
    let storage;
    try {
      if (process.env.GOOGLE_CREDENTIALS) {
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
        storage = new Storage({
          projectId: credentials.project_id || process.env.GCP_PROJECT_ID,
          credentials: credentials
        });
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        storage = new Storage({
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
        });
      } else {
        storage = new Storage({
          projectId: process.env.GCP_PROJECT_ID
        });
      }
    } catch (error) {
      console.error('❌ [confirm-upload] Erro ao inicializar Storage:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao inicializar Google Cloud Storage'
      });
    }

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    // Verificar se arquivo existe
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado no GCS'
      });
    }

    // Tornar arquivo público (public access prevention foi removida)
    try {
      await file.makePublic();
      console.log(`✅ Arquivo tornado público: ${filePath}`);
    } catch (makePublicError) {
      // Se já for público, não é erro crítico
      if (makePublicError.message && makePublicError.message.includes('already public')) {
        console.log(`ℹ️ Arquivo já é público: ${filePath}`);
      } else {
        console.error('❌ Erro ao tornar arquivo público:', makePublicError);
        return res.status(500).json({
          success: false,
          error: 'Erro ao tornar arquivo público',
          details: process.env.NODE_ENV === 'development' ? makePublicError.message : undefined
        });
      }
    }

    // URL pública permanente
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

    return res.json({
      success: true,
      publicUrl: publicUrl,
      filePath
    });

  } catch (error) {
    console.error('❌ [confirm-upload] Erro ao confirmar upload:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao confirmar upload',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
console.log('✅ Endpoint POST /api/chat/attachments/confirm-upload registrado');

// GET /api/auth/profile
console.log('🔧 Registrando endpoint GET /api/auth/profile...');
app.get('/api/auth/profile', async (req, res) => {
  try {
    const { email } = req.query;

    // Validação
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email é obrigatório'
      });
    }

    console.log(`🔍 Buscando perfil para: ${email}`);

    // Conectar ao MongoDB
    await connectToMongo();
    const db = client.db('console_analises');
    const funcionariosCollection = db.collection('qualidade_funcionarios');

    // Buscar usuário por email
    const funcionario = await funcionariosCollection.findOne({
      userMail: email.toLowerCase()
    });

    if (!funcionario) {
      console.log(`❌ Usuário não encontrado: ${email}`);
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Preparar dados do perfil
    const profile = {
      colaboradorNome: funcionario.colaboradorNome || '',
      telefone: funcionario.telefone || '',
      userMail: funcionario.userMail || email,
      profile_pic: funcionario.profile_pic || null,
      idSecao: funcionario.idSecao || funcionario.secao || funcionario.id_secao || null
    };

    console.log(`✅ Perfil encontrado: ${funcionario.colaboradorNome} (${email})`);

    res.json({
      success: true,
      profile: profile
    });

  } catch (error) {
    console.error('❌ Profile Error:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
console.log('✅ Endpoint GET /api/auth/profile registrado');

// PUT /api/auth/profile
console.log('🔧 Registrando endpoint PUT /api/auth/profile...');
app.put('/api/auth/profile', async (req, res) => {
  try {
    const { email, colaboradorNome, telefone } = req.body;

    // Validação
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email é obrigatório'
      });
    }

    console.log(`🔍 Atualizando perfil para: ${email}`);

    // Conectar ao MongoDB
    await connectToMongo();
    const db = client.db('console_analises');
    const funcionariosCollection = db.collection('qualidade_funcionarios');

    // Verificar se usuário existe
    const funcionario = await funcionariosCollection.findOne({
      userMail: email.toLowerCase()
    });

    if (!funcionario) {
      console.log(`❌ Usuário não encontrado: ${email}`);
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Preparar campos para atualização
    const updateFields = {
      updatedAt: new Date()
    };

    if (colaboradorNome !== undefined) {
      updateFields.colaboradorNome = colaboradorNome;
    }

    if (telefone !== undefined) {
      updateFields.telefone = telefone;
    }

    // Atualizar perfil no MongoDB
    await funcionariosCollection.updateOne(
      { userMail: email.toLowerCase() },
      { $set: updateFields }
    );

    console.log(`✅ Perfil atualizado com sucesso para: ${email}`);

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Update Profile Error:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
console.log('✅ Endpoint PUT /api/auth/profile registrado');

// POST /api/auth/profile/change-password
console.log('🔧 Registrando endpoint POST /api/auth/profile/change-password...');
app.post('/api/auth/profile/change-password', async (req, res) => {
  try {
    const { email, novaSenha } = req.body;

    // Validações
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email é obrigatório'
      });
    }

    if (!novaSenha) {
      return res.status(400).json({
        success: false,
        error: 'Nova senha é obrigatória'
      });
    }

    // Validar senha usando validatePassword (mínimo 8 caracteres)
    const passwordValidation = validatePassword(novaSenha);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: passwordValidation.error || 'A senha deve ter no mínimo 8 caracteres'
      });
    }

    console.log(`🔍 Alterando senha para: ${email}`);

    // Conectar ao MongoDB
    await connectToMongo();
    const db = client.db('console_analises');
    const funcionariosCollection = db.collection('qualidade_funcionarios');

    // Buscar usuário por email
    const funcionario = await funcionariosCollection.findOne({
      userMail: email.toLowerCase()
    });

    if (!funcionario) {
      console.log(`❌ Usuário não encontrado: ${email}`);
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Armazenar senha em texto plano (sem hash)
    // Atualizar senha no MongoDB (texto plano)
    await funcionariosCollection.updateOne(
      { userMail: email.toLowerCase() },
      { 
        $set: { 
          password: novaSenha, // Armazenar em texto plano
          updatedAt: new Date()
        } 
      }
    );

    console.log(`✅ Senha alterada com sucesso para: ${email}`);

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });

  } catch (error) {
    console.error('❌ Change Password Error:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
console.log('✅ Endpoint POST /api/auth/profile/change-password registrado');

// ===== API DE SESSÕES DE LOGIN/LOGOUT =====

// POST /api/auth/session/login
app.post('/api/auth/session/login', async (req, res) => {
  try {
    const { colaboradorNome, userEmail } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Validação
    if (!colaboradorNome || !userEmail) {
      return res.status(400).json({
        success: false,
        error: 'colaboradorNome e userEmail são obrigatórios'
      });
    }

    console.log(`🔐 Login: Novo login de ${colaboradorNome} (${userEmail})`);

    // Registrar login
    const result = await userSessionLogger.logLogin(
      colaboradorNome,
      userEmail,
      ipAddress,
      userAgent
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao registrar login',
        details: result.error
      });
    }

    // Resposta de sucesso
    res.json({
      success: true,
      sessionId: result.sessionId,
      message: 'Login registrado com sucesso'
    });

  } catch (error) {
    console.error('❌ Login Error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/auth/session/logout
app.post('/api/auth/session/logout', async (req, res) => {
  try {
    const { sessionId } = req.body;

    // Validação
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId é obrigatório'
      });
    }

    console.log(`🚪 Logout: Logout da sessão ${sessionId}`);

    // Registrar logout
    const result = await userSessionLogger.logLogout(sessionId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    // Resposta de sucesso
    res.json({
      success: true,
      duration: result.duration,
      colaboradorNome: result.colaboradorNome,
      message: 'Logout registrado com sucesso'
    });

  } catch (error) {
    console.error('❌ Logout Error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===== API DE SESSÃO - HEARTBEAT E REATIVAÇÃO =====
console.log('🔧 Registrando endpoints de sessão (heartbeat, reactivate, validate)...');

// POST /api/auth/session/heartbeat
app.post('/api/auth/session/heartbeat', async (req, res) => {
  try {
    const { sessionId } = req.body;

    // Validação
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId é obrigatório'
      });
    }

    // Atualizar sessão (heartbeat)
    const result = await userSessionLogger.updateSession(sessionId);

    if (result.expired) {
      return res.status(401).json({
        success: false,
        expired: true,
        error: 'Sessão expirada (4 horas) - novo login necessário'
      });
    }

    if (!result.success) {
      return res.status(400).json({
        success: false,
        expired: false,
        error: result.error || 'Erro ao atualizar sessão'
      });
    }

    res.json({
      success: true,
      message: 'Heartbeat recebido'
    });

  } catch (error) {
    console.error('❌ Heartbeat Error:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

console.log('✅ Endpoint POST /api/auth/session/heartbeat registrado');

// POST /api/auth/session/reactivate
app.post('/api/auth/session/reactivate', async (req, res) => {
  try {
    const { userEmail } = req.body;

    // Validação
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        error: 'userEmail é obrigatório'
      });
    }

    console.log(`🔄 Reativação: Tentando reativar sessão de ${userEmail}`);

    // Reativar sessão
    const result = await userSessionLogger.reactivateSession(userEmail);

    if (result.expired) {
      return res.status(401).json({
        success: false,
        expired: true,
        error: 'Sessão expirada (4 horas) - novo login necessário'
      });
    }

    if (!result.success) {
      return res.status(400).json({
        success: false,
        expired: false,
        error: result.error || 'Erro ao reativar sessão'
      });
    }

    res.json({
      success: true,
      sessionId: result.sessionId,
      message: 'Sessão reativada com sucesso'
    });

  } catch (error) {
    console.error('❌ Reactivate Error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/auth/session/validate
app.get('/api/auth/session/validate/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId é obrigatório'
      });
    }

    const result = await userSessionLogger.validateSession(sessionId);

    res.json({
      success: true,
      valid: result.valid,
      expired: result.expired,
      session: result.session ? {
        sessionId: result.session.sessionId,
        userEmail: result.session.userEmail,
        colaboradorNome: result.session.colaboradorNome,
        isActive: result.session.isActive,
        loginTimestamp: result.session.loginTimestamp
      } : null
    });

  } catch (error) {
    console.error('❌ Validate Error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

console.log('✅ Endpoint GET /api/auth/session/validate/:sessionId registrado');

// PUT /api/auth/session/chat-status
console.log('🔧 Registrando endpoint PUT /api/auth/session/chat-status...');
app.put('/api/auth/session/chat-status', async (req, res) => {
  try {
    const sessionId = req.body.sessionId || req.headers['x-session-id'];
    const { status } = req.body;

    // Validação
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId é obrigatório (body ou header x-session-id)'
      });
    }

    if (!status || !['online', 'ausente'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status inválido. Deve ser: online ou ausente. Offline é automático quando sessão está inativa.'
      });
    }

    // Conectar ao MongoDB
    if (!client) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB não configurado'
      });
    }

    await connectToMongo();
    const db = client.db('console_conteudo');
    const sessionsCollection = db.collection('hub_sessions');

    // Buscar sessão ativa
    const session = await sessionsCollection.findOne({
      sessionId: sessionId,
      isActive: true
    });

    if (!session) {
      return res.status(400).json({
        success: false,
        error: 'Sessão não encontrada ou não está ativa. Status offline é automático quando sessão está inativa.'
      });
    }

    // Atualizar chatStatus no hub_sessions IMEDIATAMENTE
    const { getCurrentTimestamp, getCurrentTimestampISO } = require('./utils/timestamp');
    const now = getCurrentTimestamp();
    const timestampISO = getCurrentTimestampISO();

    const result = await sessionsCollection.updateOne(
      { _id: session._id },
      {
        $set: {
          chatStatus: status,
          updatedAt: now
        }
      }
    );

    if (result.modifiedCount > 0) {
      // Logs detalhados da alteração
      console.log(`✅ ChatStatus atualizado: ${session.colaboradorNome} (${session.userEmail}) → ${status}`);
      console.log(`📝 SessionId: ${sessionId}`);
      console.log(`🕒 Timestamp: ${timestampISO}`);

      // Notificar VeloChat Server sobre mudança de status (para emitir evento WebSocket)
      // NOTA: O VeloChat Server deve ter um endpoint POST /api/notify-status-change
      // que recebe { userEmail, status, timestamp } e emite evento WebSocket
      const velochatServerUrl = process.env.VELOCHAT_SERVER_URL || 'http://localhost:3002';
      
      // Log no console do backend para debug
      console.log(`📡 [STATUS CHANGE] Tentando notificar VeloChat Server: ${velochatServerUrl}/api/notify-status-change`);
      console.log(`📡 [STATUS CHANGE] Dados:`, {
        userEmail: session.userEmail,
        userName: session.colaboradorNome,
        status: status,
        timestamp: timestampISO
      });
      
      fetch(`${velochatServerUrl}/api/notify-status-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userEmail: session.userEmail,
          userName: session.colaboradorNome,
          status: status,
          timestamp: timestampISO
        })
      }).then(response => {
        console.log(`✅ [STATUS CHANGE] VeloChat Server respondeu: ${response.status} ${response.ok ? 'OK' : 'ERROR'}`);
      }).catch(err => {
        console.log(`❌ [STATUS CHANGE] Erro ao notificar VeloChat Server: ${err.message}`);
        console.log(`❌ [STATUS CHANGE] Stack:`, err.stack);
        // Log silencioso - VeloChat Server pode não estar disponível ou endpoint não implementado
        console.log(`⚠️ Não foi possível notificar VeloChat Server sobre mudança de status: ${err.message}`);
      });

      res.json({
        success: true,
        status: status,
        message: `Status atualizado para ${status}`
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Erro ao atualizar status - nenhum documento modificado'
      });
    }

  } catch (error) {
    console.error('❌ Erro ao atualizar chatStatus:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

console.log('✅ Endpoint PUT /api/auth/session/chat-status registrado');

// GET /api/status
console.log('🔧 Registrando endpoint GET /api/status...');
app.get('/api/status', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId é obrigatório (header x-session-id ou query sessionId)'
      });
    }

    // Conectar ao MongoDB
    if (!client) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB não configurado'
      });
    }

    await connectToMongo();
    const db = client.db('console_conteudo');
    const sessionsCollection = db.collection('hub_sessions');

    // Buscar sessão no MongoDB
    const session = await sessionsCollection.findOne({
      sessionId: sessionId
    });

    if (!session) {
      console.log(`⚠️ Get Status: Sessão não encontrada - ${sessionId}`);
      return res.status(401).json({
        success: false,
        error: 'Sessão não encontrada'
      });
    }

    // Retornar status e isActive
    const isActive = session.isActive || false;
    
    // Se sessão está inativa, sempre retornar offline
    // Se sessão está ativa e chatStatus existe, usar chatStatus
    // Se sessão está ativa mas chatStatus não existe (sessões antigas), usar 'online' como padrão
    const chatStatus = !isActive 
      ? 'offline' 
      : (session.chatStatus || 'online');

    console.log(`✅ Get Status: ${session.colaboradorNome} (${session.userEmail}) - status: ${chatStatus}, isActive: ${isActive}`);

    res.json({
      success: true,
      status: chatStatus,
      isActive: isActive
    });

  } catch (error) {
    console.error('❌ Get Status Error:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

console.log('✅ Endpoint GET /api/status registrado');
console.log('✅ Todos os endpoints de sessão registrados com sucesso!');
console.log('📋 Endpoints de sessão disponíveis:');
console.log('   - POST /api/auth/session/heartbeat');
console.log('   - POST /api/auth/session/reactivate');
console.log('   - GET /api/auth/session/validate/:sessionId');
console.log('   - PUT /api/auth/session/chat-status');
console.log('   - GET /api/status');

// ===== API VELONEWS - ACKNOWLEDGE =====

// POST /api/velo-news/:id/acknowledge
app.post('/api/velo-news/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName } = req.body;

    // Validação
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId é obrigatório'
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID da notícia é obrigatório'
      });
    }

    console.log(`📝 Acknowledge: Usuário ${userName} (${userId}) confirmou leitura da notícia ${id}`);

    // Conectar ao MongoDB
    if (!client) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB não configurado'
      });
    }

    await connectToMongo();
    const db = client.db('console_conteudo');
    const collection = db.collection('velonews_acknowledgments');

    // Verificar se já existe acknowledge para esta notícia e usuário
    const existingAck = await collection.findOne({
      newsId: new ObjectId(id),
      userEmail: userId
    });

    if (existingAck) {
      return res.status(409).json({
        success: false,
        error: 'Notícia já foi confirmada por este usuário'
      });
    }

    // Criar registro de acknowledge
    const acknowledgeData = {
      newsId: new ObjectId(id),
      colaboradorNome: userName || 'Usuário',
      userEmail: userId,
      acknowledgedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(acknowledgeData);

    if (result.insertedId) {
      console.log(`✅ Acknowledge registrado: ${result.insertedId}`);
      
      res.json({
        success: true,
        message: 'Leitura confirmada com sucesso',
        acknowledgeId: result.insertedId
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Erro ao registrar acknowledge'
      });
    }

  } catch (error) {
    console.error('❌ Acknowledge Error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/velo-news/acknowledgments/:userEmail
app.get('/api/velo-news/acknowledgments/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        error: 'userEmail é obrigatório'
      });
    }

    // Conectar ao MongoDB
    if (!client) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB não configurado'
      });
    }

    await connectToMongo();
    const db = client.db('console_conteudo');
    const collection = db.collection('velonews_acknowledgments');

    // Buscar todos os acknowledges do usuário
    const acknowledges = await collection.find({
      userEmail: userEmail
    }).toArray();

    // Extrair apenas os IDs das notícias (como strings)
    const acknowledgedNewsIds = acknowledges.map(ack => ack.newsId.toString());

    console.log(`📋 Acknowledges encontrados para ${userEmail}: ${acknowledgedNewsIds.length} notícias`);

    res.json({
      success: true,
      acknowledgedNewsIds: acknowledgedNewsIds
    });

  } catch (error) {
    console.error('❌ Erro ao buscar acknowledges:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Iniciar servidor
console.log('🔄 Iniciando servidor...');
console.log(`📍 Porta configurada: ${PORT}`);
console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
console.log(`📁 Diretório de trabalho: ${process.cwd()}`);
console.log(`📁 Arquivos no diretório:`, require('fs').readdirSync('.'));

console.log('🚀 Tentando iniciar servidor na porta', PORT);

const server = app.listen(PORT, '0.0.0.0', (error) => {
  if (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
  
  console.log(`✅ Servidor backend rodando na porta ${PORT}`);
  console.log(`🌐 Acessível em: http://localhost:${PORT}`);
  console.log(`🌐 Acessível na rede local: http://0.0.0.0:${PORT}`);
  console.log(`📡 Endpoint principal: http://localhost:${PORT}/api/data`);
  console.log(`📡 Teste a API em: http://localhost:${PORT}/api/test`);
  
  // Tentar conectar ao MongoDB em background (não bloqueia o startup)
  connectToMongo().catch(error => {
    console.warn('⚠️ MongoDB: Falha na conexão inicial, tentando reconectar...', error.message);
  });
  
  // Inicializar cache de status dos módulos
  setTimeout(async () => {
    try {
      console.log('🚀 Inicializando cache de status dos módulos...');
      await getModuleStatus();
      console.log('✅ Cache de status inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar cache de status:', error);
    }
  }, 2000); // Aguardar 2 segundos para MongoDB conectar
});

// Log de erro se o servidor não conseguir iniciar
server.on('error', (error) => {
  console.error('❌ Erro no servidor:', error);
  process.exit(1);
});

server.on('listening', () => {
  console.log('🎉 Servidor está escutando na porta', PORT);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
  // Não encerrar o processo, apenas logar o erro
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  // Não encerrar o processo, apenas logar o erro
});

// ========================================
// SISTEMA DE CONTROLE DE STATUS DOS MÓDULOS
// ========================================

// Cache do status dos módulos (atualizado do MongoDB)
let moduleStatusCache = {
  'credito-trabalhador': 'on',
  'credito-pessoal': 'on',
  'antecipacao': 'off',
  'pagamento-antecipado': 'on',
  'modulo-irpf': 'off',
  'seguro-cred': 'on',
  'seguro-cel': 'on',
  'clube-velotax': 'on',
  'divida-zero': 'on'
};

// Timestamp do último cache para controle de validade
let lastCacheUpdate = null;
const CACHE_VALIDITY_MS = 3 * 60 * 1000; // 3 minutos

// Forçar atualização imediata do cache na inicialização
console.log('🔄 Forçando atualização inicial do cache de status...');

/**
 * Busca o status mais recente dos módulos no MongoDB
 * @returns {Promise<Object>} Status dos módulos
 */
const fetchModuleStatusFromMongoDB = async () => {
  try {
    console.log('🔍 fetchModuleStatusFromMongoDB: Iniciando busca...');
    
    if (!client) {
      console.warn('⚠️ MongoDB client não configurado - usando cache local');
      return moduleStatusCache;
    }

    console.log('🔍 Conectando ao MongoDB...');
    await connectToMongo();
    const db = client.db('console_config');
    const collection = db.collection('module_status');

    console.log('🔍 Buscando documento mais recente na collection module_status...');
    // Buscar o documento mais recente (maior createdAt)
    const latestStatus = await collection
      .findOne({}, { sort: { createdAt: -1 } });

    console.log('🔍 Documento encontrado no MongoDB:', latestStatus);

    if (!latestStatus) {
      console.warn('⚠️ Nenhum status encontrado no MongoDB - usando cache local');
      return moduleStatusCache;
    }

    // Mapear campos do MongoDB para o formato esperado pelo frontend
    const mappedStatus = {
      'credito-trabalhador': latestStatus._trabalhador || 'on',
      'credito-pessoal': latestStatus._pessoal || 'on',
      'antecipacao': latestStatus._antecipacao || 'revisao',
      'pagamento-antecipado': latestStatus._pgtoAntecip || 'off',
      'modulo-irpf': latestStatus._irpf || 'on',
      'seguro-cred': latestStatus._seguroCred || 'on',
      'seguro-cel': latestStatus._seguroCel || 'on',
      'clube-velotax': latestStatus._clubeVelotax || 'on',
      'divida-zero': latestStatus._dividaZero || 'on'
    };

    console.log('📊 Status dos módulos mapeado do MongoDB:', mappedStatus);
    console.log('📊 Campos originais do MongoDB:', {
      _trabalhador: latestStatus._trabalhador,
      _pessoal: latestStatus._pessoal,
      _antecipacao: latestStatus._antecipacao,
      _pgtoAntecip: latestStatus._pgtoAntecip,
      _irpf: latestStatus._irpf,
      _seguroCred: latestStatus._seguroCred,
      _seguroCel: latestStatus._seguroCel
    });
    
    console.log('✅ fetchModuleStatusFromMongoDB: Busca concluída com sucesso');
    return mappedStatus;

  } catch (error) {
    console.error('❌ Erro ao buscar status dos módulos do MongoDB:', error);
    console.error('❌ Stack trace:', error.stack);
    console.log('🔄 Usando cache local como fallback');
    return moduleStatusCache; // Fallback para cache local
  }
};

/**
 * Atualiza o cache se necessário (baseado no tempo)
 * @returns {Promise<Object>} Status atual dos módulos
 */
const getModuleStatus = async () => {
  const now = Date.now();
  
  // Se cache é válido, retornar cache
  if (lastCacheUpdate && (now - lastCacheUpdate) < CACHE_VALIDITY_MS) {
    console.log('📊 Cache válido - retornando cache:', moduleStatusCache);
    return moduleStatusCache;
  }

  // Cache expirado ou inexistente - buscar do MongoDB
  console.log('🔄 Cache expirado - buscando status do MongoDB...');
  console.log('🔄 Cache atual:', moduleStatusCache);
  console.log('🔄 Última atualização:', lastCacheUpdate);
  
  const freshStatus = await fetchModuleStatusFromMongoDB();
  
  // Atualizar cache
  moduleStatusCache = freshStatus;
  lastCacheUpdate = now;
  
  console.log('🔄 Cache atualizado:', moduleStatusCache);
  return moduleStatusCache;
};

// Endpoint para buscar status dos módulos (GET)
app.get('/api/module-status', async (req, res) => {
  try {
    console.log('📊 Status dos módulos solicitado - Iniciando...');
    console.log('📊 Headers da requisição:', req.headers);
    
    // Garantir que sempre retornamos JSON
    res.setHeader('Content-Type', 'application/json');
    
    const currentStatus = await getModuleStatus();
    console.log('📊 Status obtido do MongoDB/cache:', currentStatus);
    
    // Garantir que sempre retornamos dados válidos
    const validStatus = {
      'credito-trabalhador': currentStatus['credito-trabalhador'] || 'on',
      'credito-pessoal': currentStatus['credito-pessoal'] || 'on',
      'antecipacao': currentStatus['antecipacao'] || 'revisao',
      'pagamento-antecipado': currentStatus['pagamento-antecipado'] || 'off',
      'modulo-irpf': currentStatus['modulo-irpf'] || 'on',
      'seguro-cred': currentStatus['seguro-cred'] || 'on',
      'seguro-cel': currentStatus['seguro-cel'] || 'on',
      'clube-velotax': currentStatus['clube-velotax'] || 'on',
      'divida-zero': currentStatus['divida-zero'] || 'on'
    };
    
    console.log('📊 Retornando status dos módulos:', validStatus);
    console.log('📊 Status dos módulos enviado com sucesso');
    
    res.json(validStatus);
  } catch (error) {
    console.error('❌ Erro ao buscar status dos módulos:', error);
    console.error('❌ Stack trace:', error.stack);
    
    // Garantir que sempre retornamos JSON mesmo em caso de erro
    res.setHeader('Content-Type', 'application/json');
    
    // Fallback com dados padrão em caso de erro
    const fallbackStatus = {
      'credito-trabalhador': 'on',
      'credito-pessoal': 'on',
      'antecipacao': 'off',
      'pagamento-antecipado': 'on',
      'modulo-irpf': 'off',
      'seguro-cred': 'on',
      'seguro-cel': 'on',
      'clube-velotax': 'on',
      'divida-zero': 'on'
    };
    
    console.log('🔄 Usando status fallback:', fallbackStatus);
    console.log('🔄 Status fallback enviado com sucesso');
    
    res.json(fallbackStatus);
  }
});

// Endpoint para atualizar status dos módulos (POST) - Console VeloHub
app.post('/api/module-status', async (req, res) => {
  try {
    const { moduleKey, status } = req.body;
    
    // Validar entrada
    if (!moduleKey || !status) {
      return res.status(400).json({ error: 'moduleKey e status são obrigatórios' });
    }
    
    if (!['on', 'off', 'revisao'].includes(status)) {
      return res.status(400).json({ error: 'Status deve ser: on, off ou revisao' });
    }
    
    // Validar se o módulo existe no cache atual
    const currentStatus = await getModuleStatus();
    if (!currentStatus.hasOwnProperty(moduleKey)) {
      return res.status(400).json({ error: 'Módulo não encontrado' });
    }
    
    // Mapear moduleKey para campo do MongoDB
    const mongoFieldMap = {
      'credito-trabalhador': '_trabalhador',
      'credito-pessoal': '_pessoal',
      'antecipacao': '_antecipacao',
      'pagamento-antecipado': '_pgtoAntecip',
      'modulo-irpf': '_irpf',
      'seguro-cred': '_seguroCred',
      'seguro-cel': '_seguroCel',
      'clube-velotax': '_clubeVelotax',
      'divida-zero': '_dividaZero'
    };
    
    const mongoField = mongoFieldMap[moduleKey];
    if (!mongoField) {
      return res.status(400).json({ error: 'Módulo não mapeado para MongoDB' });
    }
    
    // Atualizar no MongoDB
    if (client) {
      try {
        await connectToMongo();
        const db = client.db('console_config');
        const collection = db.collection('module_status');
        
        // Criar novo documento com status atualizado
        const updateData = {
          ...currentStatus,
          [mongoField]: status,
          updatedAt: new Date()
        };
        
        // Mapear de volta para campos do MongoDB
        const mongoData = {
          _trabalhador: updateData['credito-trabalhador'],
          _pessoal: updateData['credito-pessoal'],
          _antecipacao: updateData['antecipacao'],
          _pgtoAntecip: updateData['pagamento-antecipado'],
          _irpf: updateData['modulo-irpf'],
          _seguroCred: updateData['seguro-cred'],
          _seguroCel: updateData['seguro-cel'],
          _clubeVelotax: updateData['clube-velotax'],
          _dividaZero: updateData['divida-zero'],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await collection.insertOne(mongoData);
        console.log(`✅ Status do módulo ${moduleKey} salvo no MongoDB: ${status}`);
        
        // Invalidar cache para forçar refresh na próxima consulta
        lastCacheUpdate = null;
        
      } catch (mongoError) {
        console.error('❌ Erro ao salvar no MongoDB:', mongoError);
        // Continuar com atualização local mesmo se MongoDB falhar
      }
    }
    
    // Atualizar cache local
    const oldStatus = currentStatus[moduleKey];
    moduleStatusCache[moduleKey] = status;
    lastCacheUpdate = Date.now();
    
    console.log(`🔄 Status do módulo ${moduleKey} alterado: ${oldStatus} → ${status}`);
    
    res.json({ 
      success: true, 
      message: `Status do módulo ${moduleKey} atualizado para ${status}`,
      moduleStatus: moduleStatusCache 
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar status dos módulos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para atualizar múltiplos módulos (PUT) - Console VeloHub
app.put('/api/module-status', async (req, res) => {
  try {
    const newStatus = req.body;
    
    // Validar se é um objeto
    if (typeof newStatus !== 'object' || Array.isArray(newStatus)) {
      return res.status(400).json({ error: 'Body deve ser um objeto com os status dos módulos' });
    }
    
    // Obter status atual
    const currentStatus = await getModuleStatus();
    
    // Validar cada status
    for (const [moduleKey, status] of Object.entries(newStatus)) {
      if (!currentStatus.hasOwnProperty(moduleKey)) {
        return res.status(400).json({ error: `Módulo ${moduleKey} não encontrado` });
      }
      
      if (!['on', 'off', 'revisao'].includes(status)) {
        return res.status(400).json({ error: `Status inválido para ${moduleKey}: ${status}` });
      }
    }
    
    // Atualizar no MongoDB
    if (client) {
      try {
        await connectToMongo();
        const db = client.db('console_config');
        const collection = db.collection('module_status');
        
        // Criar novo documento com todos os status atualizados
        const updatedStatus = { ...currentStatus, ...newStatus };
        
        // Mapear para campos do MongoDB
        const mongoData = {
          _trabalhador: updatedStatus['credito-trabalhador'],
          _pessoal: updatedStatus['credito-pessoal'],
          _antecipacao: updatedStatus['antecipacao'],
          _pgtoAntecip: updatedStatus['pagamento-antecipado'],
          _irpf: updatedStatus['modulo-irpf'],
          _seguroCred: updatedStatus['seguro-cred'],
          _seguroCel: updatedStatus['seguro-cel'],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await collection.insertOne(mongoData);
        console.log('✅ Status dos módulos salvos no MongoDB em lote:', newStatus);
        
        // Invalidar cache para forçar refresh na próxima consulta
        lastCacheUpdate = null;
        
      } catch (mongoError) {
        console.error('❌ Erro ao salvar no MongoDB:', mongoError);
        // Continuar com atualização local mesmo se MongoDB falhar
      }
    }
    
    // Atualizar cache local
    const oldStatus = { ...currentStatus };
    Object.assign(moduleStatusCache, newStatus);
    lastCacheUpdate = Date.now();
    
    console.log('🔄 Status dos módulos atualizados em lote:', newStatus);
    
    res.json({ 
      success: true, 
      message: 'Status dos módulos atualizados com sucesso',
      moduleStatus: moduleStatusCache,
      changes: newStatus
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar status dos módulos em lote:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== API CRUD PARA MÓDULO APOIO =====
console.log('🔧 Registrando rotas do módulo Apoio...');

// CREATE - Criar tickets tk_conteudos
app.post('/api/support/tk-conteudos', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Endpoint /api/support/tk-conteudos chamado');
    console.log('🔍 DEBUG: Body recebido:', req.body);
    
    if (!client) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB não configurado'
      });
    }

    // Validação obrigatória do campo _assunto
    if (!req.body._assunto || req.body._assunto.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Campo assunto é obrigatório'
      });
    }

    await connectToMongo();
    const db = client.db('console_chamados');
    const collection = db.collection('tk_conteudos');
    
    // Gerar próximo ID com prefixo TKC-
    const lastDoc = await collection.find().sort({ _id: -1 }).limit(1).toArray();
    const nextNumber = lastDoc.length > 0 ? parseInt(lastDoc[0]._id.split('-')[1]) + 1 : 1;
    const newId = `TKC-${String(nextNumber).padStart(6, '0')}`;
    
    // Transformar _corpo em array de mensagens
    const corpoArray = Array.isArray(req.body._corpo) ? req.body._corpo : [{
      autor: 'user',
      userName: req.body._userName || 'Usuário',
      timestamp: new Date(),
      mensagem: req.body._corpo || ''
    }];

    const ticketData = {
      _id: newId,
      ...req.body,
      _corpo: corpoArray,
      _statusHub: 'pendente',      // NOVO: valor padrão
      _statusConsole: 'novo',      // NOVO: valor padrão
      _lastUpdatedBy: 'user',      // NOVO: valor padrão
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await collection.insertOne(ticketData);
    
    res.json({ success: true, ticketId: newId });
  } catch (error) {
    console.error('❌ Erro ao criar ticket tk_conteudos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// CREATE - Criar tickets tk_gestão
app.post('/api/support/tk-gestao', async (req, res) => {
  try {
    if (!client) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB não configurado'
      });
    }

    await connectToMongo();
    const db = client.db('console_chamados');
    const collection = db.collection('tk_gestão');
    
    // Gerar próximo ID com prefixo TKG-
    const lastDoc = await collection.find().sort({ _id: -1 }).limit(1).toArray();
    const nextNumber = lastDoc.length > 0 ? parseInt(lastDoc[0]._id.split('-')[1]) + 1 : 1;
    const newId = `TKG-${String(nextNumber).padStart(6, '0')}`;
    
    // Transformar _corpo em array de mensagens
    const corpoArray = Array.isArray(req.body._corpo) ? req.body._corpo : [{
      autor: 'user',
      userName: req.body._userName || 'Usuário',
      timestamp: new Date(),
      mensagem: req.body._corpo || ''
    }];

    const ticketData = {
      _id: newId,
      ...req.body,
      _corpo: corpoArray,
      _statusHub: 'pendente',      // NOVO: valor padrão
      _statusConsole: 'novo',      // NOVO: valor padrão
      _lastUpdatedBy: 'user',      // NOVO: valor padrão
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await collection.insertOne(ticketData);
    
    res.json({ success: true, ticketId: newId });
  } catch (error) {
    console.error('❌ Erro ao criar ticket tk_gestão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// UPDATE - Atualizar ticket de conteúdo
app.put('/api/support/tk-conteudos', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Endpoint PUT /api/support/tk-conteudos chamado');
    console.log('🔍 DEBUG: Body recebido:', req.body);
    
    const { _id, _corpo } = req.body;
    
    if (!_id) {
      return res.status(400).json({
        success: false,
        error: '_id é obrigatório'
      });
    }
    
    if (!_id.startsWith('TKC-')) {
      return res.status(400).json({
        success: false,
        error: 'ID deve iniciar com TKC- para tickets de conteúdo'
      });
    }

    if (!client) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB não configurado'
      });
    }

    await connectToMongo();
    const db = client.db('console_chamados');
    const collection = db.collection('tk_conteudos');
    
    // Buscar ticket existente
    const ticket = await collection.findOne({ _id });
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket não encontrado'
      });
    }

    // Extrair nova mensagem do array _corpo (última mensagem)
    const novaMensagem = _corpo[_corpo.length - 1];
    
    if (!novaMensagem || !novaMensagem.mensagem) {
      return res.status(400).json({
        success: false,
        error: 'Nova mensagem é obrigatória'
      });
    }

    // Preservar campos originais e atualizar apenas o necessário
    const updateData = {
      _corpo: _corpo,  // Array completo de mensagens
      _statusHub: 'pendente',
      _statusConsole: 'aberto',
      _lastUpdatedBy: 'user',
      updatedAt: new Date()
    };

    // Preservar campos originais se fornecidos no body
    if (req.body._assunto !== undefined) updateData._assunto = req.body._assunto;
    if (req.body._genero !== undefined) updateData._genero = req.body._genero;
    if (req.body._tipo !== undefined) updateData._tipo = req.body._tipo;
    if (req.body._obs !== undefined) updateData._obs = req.body._obs;
    if (req.body._userEmail !== undefined) updateData._userEmail = req.body._userEmail;

    // Atualizar ticket
    const result = await collection.updateOne(
      { _id },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        error: 'Falha ao atualizar ticket'
      });
    }

    res.json({ success: true, message: 'Ticket atualizado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao atualizar ticket de conteúdo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// UPDATE - Atualizar ticket de gestão
app.put('/api/support/tk-gestao', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Endpoint PUT /api/support/tk-gestao chamado');
    console.log('🔍 DEBUG: Body recebido:', req.body);
    
    const { _id, _corpo } = req.body;
    
    if (!_id) {
      return res.status(400).json({
        success: false,
        error: '_id é obrigatório'
      });
    }
    
    if (!_id.startsWith('TKG-')) {
      return res.status(400).json({
        success: false,
        error: 'ID deve iniciar com TKG- para tickets de gestão'
      });
    }

    if (!client) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB não configurado'
      });
    }

    await connectToMongo();
    const db = client.db('console_chamados');
    const collection = db.collection('tk_gestão');
    
    // Buscar ticket existente
    const ticket = await collection.findOne({ _id });
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket não encontrado'
      });
    }

    // Extrair nova mensagem do array _corpo (última mensagem)
    const novaMensagem = _corpo[_corpo.length - 1];
    
    if (!novaMensagem || !novaMensagem.mensagem) {
      return res.status(400).json({
        success: false,
        error: 'Nova mensagem é obrigatória'
      });
    }

    // Atualizar ticket
    const result = await collection.updateOne(
      { _id },
      {
        $push: { _corpo: novaMensagem },
        $set: {
          _statusHub: 'pendente',
          _statusConsole: 'aberto',
          _lastUpdatedBy: 'user',
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        error: 'Falha ao atualizar ticket'
      });
    }

    res.json({ success: true, message: 'Ticket atualizado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao atualizar ticket de gestão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// READ - Buscar todos os tickets de um usuário
app.get('/api/support/tickets', async (req, res) => {
  try {
    const { userEmail } = req.query;
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        error: 'userEmail é obrigatório'
      });
    }

    if (!client) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB não configurado'
      });
    }

    await connectToMongo();
    const db = client.db('console_chamados');
    
    const [tkConteudos, tkGestao] = await Promise.all([
      db.collection('tk_conteudos')
        .find({ _userEmail: userEmail })
        .sort({ createdAt: -1 })
        .toArray(),
      db.collection('tk_gestão')
        .find({ _userEmail: userEmail })
        .sort({ createdAt: -1 })
        .toArray()
    ]);
    
    const allTickets = [...tkConteudos, ...tkGestao]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ success: true, tickets: allTickets });
  } catch (error) {
    console.error('❌ Erro ao buscar tickets:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// READ - Contar tickets não visualizados (aberto ou em espera)
app.get('/api/support/tickets/unread-count', async (req, res) => {
  try {
    const { userEmail } = req.query;
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        error: 'userEmail é obrigatório'
      });
    }

    if (!client) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB não configurado'
      });
    }

    await connectToMongo();
    const db = client.db('console_chamados');
    
    // Buscar tickets com status 'aberto' ou 'em espera'
    const [tkConteudos, tkGestao] = await Promise.all([
      db.collection('tk_conteudos')
        .find({ 
          _userEmail: userEmail,
          _statusHub: { $in: ['aberto', 'em espera'] }
        })
        .toArray(),
      db.collection('tk_gestão')
        .find({ 
          _userEmail: userEmail,
          _statusHub: { $in: ['aberto', 'em espera'] }
        })
        .toArray()
    ]);
    
    // Adicionar lastMessageTimestamp a cada ticket
    const processTickets = (tickets) => {
      return tickets.map(ticket => {
        let lastMessageTimestamp = ticket.updatedAt || ticket.createdAt || new Date();
        
        // Se _corpo é array e tem mensagens, pegar timestamp da última mensagem
        if (Array.isArray(ticket._corpo) && ticket._corpo.length > 0) {
          const lastMessage = ticket._corpo[ticket._corpo.length - 1];
          if (lastMessage && lastMessage.timestamp) {
            lastMessageTimestamp = new Date(lastMessage.timestamp);
          }
        }
        
        return {
          ...ticket,
          lastMessageTimestamp: lastMessageTimestamp instanceof Date ? lastMessageTimestamp.toISOString() : lastMessageTimestamp
        };
      });
    };
    
    const processedTkConteudos = processTickets(tkConteudos);
    const processedTkGestao = processTickets(tkGestao);
    const allTickets = [...processedTkConteudos, ...processedTkGestao];
    
    res.json({ 
      success: true, 
      unreadCount: allTickets.length,
      tickets: allTickets
    });
  } catch (error) {
    console.error('❌ Erro ao contar tickets não visualizados:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// READ - Buscar ticket específico
app.get('/api/support/ticket/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!client) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB não configurado'
      });
    }

    await connectToMongo();
    const db = client.db('console_chamados');
    
    const collection = id.startsWith('TKC-') ? 'tk_conteudos' : 'tk_gestão';
    const ticket = await db.collection(collection).findOne({ _id: id });
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket não encontrado'
      });
    }
    
    res.json({ success: true, ticket });
  } catch (error) {
    console.error('❌ Erro ao buscar ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});


// DELETE - Excluir ticket
app.delete('/api/support/ticket/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!client) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB não configurado'
      });
    }

    await connectToMongo();
    const db = client.db('console_chamados');
    const collection = id.startsWith('TKC-') ? 'tk_conteudos' : 'tk_gestão';
    
    const result = await db.collection(collection).deleteOne({ _id: id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Ticket não encontrado'
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao excluir ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// STATS - Estatísticas de tickets por usuário
app.get('/api/support/stats', async (req, res) => {
  try {
    const { userEmail } = req.query;
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        error: 'userEmail é obrigatório'
      });
    }

    if (!client) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB não configurado'
      });
    }

    await connectToMongo();
    const db = client.db('console_chamados');
    
    const [tkConteudosCount, tkGestaoCount] = await Promise.all([
      db.collection('tk_conteudos').countDocuments({ _userEmail: userEmail }),
      db.collection('tk_gestão').countDocuments({ _userEmail: userEmail })
    ]);
    
    res.json({ 
      success: true, 
      stats: { 
        total: tkConteudosCount + tkGestaoCount,
        tkConteudos: tkConteudosCount,
        tkGestao: tkGestaoCount
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// STATS - Estatísticas gerais (admin)
app.get('/api/support/stats/admin', async (req, res) => {
  try {
    if (!client) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB não configurado'
      });
    }

    await connectToMongo();
    const db = client.db('console_chamados');
    
    const [tkConteudosCount, tkGestaoCount, recentTickets] = await Promise.all([
      db.collection('tk_conteudos').countDocuments(),
      db.collection('tk_gestão').countDocuments(),
      db.collection('tk_conteudos').find().sort({ createdAt: -1 }).limit(10).toArray()
    ]);
    
    res.json({ 
      success: true, 
      stats: { 
        total: tkConteudosCount + tkGestaoCount,
        tkConteudos: tkConteudosCount,
        tkGestao: tkGestaoCount,
        recentTickets: recentTickets
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

console.log('✅ Rotas do módulo Apoio registradas com sucesso!');
console.log('📋 Rotas disponíveis: POST /api/support/tk-conteudos, POST /api/support/tk-gestao');

// ===== API PARA MÓDULO ESCALAÇÕES =====
console.log('🔧 Registrando rotas do módulo Escalações...');

try {
  console.log('📦 Carregando módulos de Escalações...');
  const initSolicitacoesRoutes = require('./routes/api/escalacoes/solicitacoes');
  const initErrosBugsRoutes = require('./routes/api/escalacoes/erros-bugs');
  const initLogsRoutes = require('./routes/api/escalacoes/logs');
  const createEscalacoesIndexes = require('./routes/api/escalacoes/indexes');
  console.log('✅ Módulos carregados com sucesso');

  console.log('🔧 Inicializando routers...');
  // Registrar rotas
  let solicitacoesRouter, errosBugsRouter, logsRouter;
  
  try {
    solicitacoesRouter = initSolicitacoesRoutes(client, connectToMongo, { userActivityLogger });
    console.log('✅ Router de solicitações inicializado:', typeof solicitacoesRouter);
  } catch (error) {
    console.error('❌ Erro ao inicializar router de solicitações:', error);
    throw error;
  }
  
  try {
    errosBugsRouter = initErrosBugsRoutes(client, connectToMongo, { userActivityLogger });
    console.log('✅ Router de erros/bugs inicializado:', typeof errosBugsRouter);
    console.log('🔍 [DEBUG] errosBugsRouter tem método get?', typeof errosBugsRouter?.get === 'function');
    console.log('🔍 [DEBUG] errosBugsRouter tem método post?', typeof errosBugsRouter?.post === 'function');
  } catch (error) {
    console.error('❌ Erro ao inicializar router de erros/bugs:', error);
    console.error('❌ Stack trace:', error.stack);
    throw error;
  }
  
  try {
    logsRouter = initLogsRoutes(client, connectToMongo);
    console.log('✅ Router de logs inicializado:', typeof logsRouter);
  } catch (error) {
    console.error('❌ Erro ao inicializar router de logs:', error);
    throw error;
  }
  
  console.log('✅ Routers inicializados');

  console.log('🔗 Registrando rotas no Express...');
  console.log('🔍 [DEBUG] errosBugsRouter tipo:', typeof errosBugsRouter);
  console.log('🔍 [DEBUG] errosBugsRouter é router?', errosBugsRouter && typeof errosBugsRouter === 'function');
  
  // Verificar se os routers são válidos antes de registrar
  if (!errosBugsRouter) {
    console.error('❌ [ERRO CRÍTICO] errosBugsRouter é null ou undefined!');
    throw new Error('errosBugsRouter não foi inicializado corretamente');
  }
  
  // Registrar rotas ANTES de qualquer middleware estático
  app.use('/api/escalacoes/solicitacoes', solicitacoesRouter);
  
  // Endpoint de compatibilidade para WhatsApp API (UPDATE PAINEL)
  // /api/requests/reply → chama a mesma lógica de /api/escalacoes/solicitacoes/reply
  app.post('/api/requests/reply', async (req, res) => {
    try {
      if (!client) {
        return res.status(503).json({
          ok: false,
          error: 'MongoDB não configurado'
        });
      }

      await connectToMongo();
      const db = client.db('hub_escalacoes');
      const collection = db.collection('solicitacoes_tecnicas');

      const { waMessageId, reactor, text, replyMessageId, replyMessageJid, replyMessageParticipant } = req.body || {};

      // Validação
      if (!waMessageId) {
        return res.status(400).json({
          ok: false,
          error: 'waMessageId é obrigatório'
        });
      }

      if (!text && !replyMessageId) {
        return res.status(400).json({
          ok: false,
          error: 'text ou replyMessageId é obrigatório'
        });
      }

      console.log('[requests/reply] Recebendo reply (compatibilidade):', {
        waMessageId,
        reactor,
        textLength: text?.length,
        replyMessageId,
        replyMessageJid
      });

      // Buscar primeiro em solicitacoes_tecnicas
      let solicitacao = await collection.findOne({ waMessageId });
      console.log(`[requests/reply] Busca em solicitacoes_tecnicas por waMessageId "${waMessageId}":`, solicitacao ? `✅ Encontrado (${solicitacao._id})` : '❌ Não encontrado');

      // Se não encontrou, buscar em payload.messageIds (array)
      if (!solicitacao) {
        console.log('[requests/reply] Não encontrado em waMessageId, buscando em payload.messageIds');
        solicitacao = await collection.findOne({
          'payload.messageIds': waMessageId
        });
        console.log(`[requests/reply] Busca em solicitacoes_tecnicas por payload.messageIds "${waMessageId}":`, solicitacao ? `✅ Encontrado (${solicitacao._id})` : '❌ Não encontrado');
      }

      // Se não encontrou em solicitacoes_tecnicas, buscar em erros_bugs
      let erroBug = null;
      let isErroBug = false;
      if (!solicitacao) {
        console.log('[requests/reply] Não encontrado em solicitacoes_tecnicas, buscando em erros_bugs');
        const errosBugsCollection = db.collection('erros_bugs');
        erroBug = await errosBugsCollection.findOne({ waMessageId });
        console.log(`[requests/reply] Busca em erros_bugs por waMessageId "${waMessageId}":`, erroBug ? `✅ Encontrado (${erroBug._id})` : '❌ Não encontrado');
        
        if (!erroBug) {
          erroBug = await errosBugsCollection.findOne({
            'payload.messageIds': waMessageId
          });
          console.log(`[requests/reply] Busca em erros_bugs por payload.messageIds "${waMessageId}":`, erroBug ? `✅ Encontrado (${erroBug._id})` : '❌ Não encontrado');
        }
        
        if (erroBug) {
          isErroBug = true;
          console.log('[requests/reply] ✅ Erro/Bug encontrado:', erroBug._id, {
            waMessageId: erroBug.waMessageId,
            payloadMessageIds: erroBug.payload?.messageIds,
            hasReplies: 'replies' in erroBug,
            repliesCount: Array.isArray(erroBug.replies) ? erroBug.replies.length : 'N/A'
          });
        }
      } else {
        console.log('[requests/reply] ✅ Solicitação encontrada:', solicitacao._id, {
          waMessageId: solicitacao.waMessageId,
          payloadMessageIds: solicitacao.payload?.messageIds,
          hasReplies: 'replies' in solicitacao,
          repliesCount: Array.isArray(solicitacao.replies) ? solicitacao.replies.length : 'N/A'
        });
      }

      if (!solicitacao && !erroBug) {
        console.log('[requests/reply] ❌ Solicitação/Erro não encontrado para waMessageId:', waMessageId);
        return res.status(404).json({
          ok: false,
          error: 'Solicitação/Erro não encontrado'
        });
      }

      const targetDoc = isErroBug ? erroBug : solicitacao;
      const targetCollection = isErroBug ? db.collection('erros_bugs') : collection;
      console.log(`[requests/reply] ✅ ${isErroBug ? 'Erro/Bug' : 'Solicitação'} encontrada:`, targetDoc._id);

      // Normalizar replies para array
      const replies = Array.isArray(targetDoc.replies) ? targetDoc.replies : [];

      // Verificar se já existe reply com mesmo replyMessageId (evitar duplicatas)
      if (replyMessageId) {
        const existingReply = replies.find(r => String(r.replyMessageId) === String(replyMessageId));
        if (existingReply) {
          console.log('[requests/reply] Reply já existe, ignorando duplicata:', replyMessageId);
          return res.json({
            ok: true,
            message: 'Reply já existe',
            replyId: replyMessageId
          });
        }
      }

      // Criar novo reply
      const newReply = {
        reactor: reactor || 'Desconhecido',
        text: text || '',
        at: new Date(),
        replyMessageId: replyMessageId || null,
        replyMessageJid: replyMessageJid || null,
        replyMessageParticipant: replyMessageParticipant || null,
        confirmedAt: null,
        confirmedBy: null
      };

      // Adicionar ao array de replies
      replies.push(newReply);

      // Atualizar documento no MongoDB
      await targetCollection.updateOne(
        { _id: targetDoc._id },
        {
          $set: {
            replies,
            updatedAt: new Date()
          }
        }
      );

      console.log(`[requests/reply] ✅ Reply adicionado com sucesso em ${isErroBug ? 'erro/bug' : 'solicitação'}. Total de replies:`, replies.length);

      return res.json({
        ok: true,
        [isErroBug ? 'erroBugId' : 'solicitacaoId']: targetDoc._id.toString(),
        repliesCount: replies.length,
        type: isErroBug ? 'erro_bug' : 'solicitacao'
      });
    } catch (error) {
      console.error('[requests/reply] Erro:', error);
      return res.status(500).json({
        ok: false,
        error: error.message || 'Erro ao processar reply'
      });
    }
  });
  
  // Registrar router de erros/bugs com validação adicional
  if (!errosBugsRouter || typeof errosBugsRouter !== 'function') {
    console.error('❌ [ERRO CRÍTICO] errosBugsRouter inválido!');
    console.error('❌ Tipo:', typeof errosBugsRouter);
    console.error('❌ Valor:', errosBugsRouter);
    throw new Error('errosBugsRouter não é um router válido');
  }
  
  app.use('/api/escalacoes/erros-bugs', errosBugsRouter);
  app.use('/api/escalacoes/logs', logsRouter);
  
  console.log('✅ Rotas registradas no Express');
  console.log('🔍 [DEBUG] Rotas /api/escalacoes/erros-bugs registradas com sucesso');

  // Criar índices MongoDB (em background, não bloqueia startup)
  setTimeout(async () => {
    try {
      console.log('📊 Criando índices MongoDB para Escalações...');
      await createEscalacoesIndexes(client, connectToMongo);
      console.log('✅ Índices criados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao criar índices de Escalações:', error);
      console.error('Stack:', error.stack);
    }
  }, 3000);

  console.log('✅ Rotas do módulo Escalações registradas com sucesso!');
  console.log('📋 Rotas disponíveis:');
  console.log('   - GET/POST/PUT/DELETE /api/escalacoes/solicitacoes');
  console.log('   - GET/POST /api/escalacoes/erros-bugs');
  console.log('   - GET/POST /api/escalacoes/logs');
} catch (error) {
  console.error('❌ Erro ao registrar rotas de Escalações:', error.message);
  console.error('Stack:', error.stack);
  console.error('Detalhes do erro:', error);
}

// ===== API PARA MÓDULO OUVIDORIA =====
// VERSION: v1.1.0 | DATE: 2025-02-19 | AUTHOR: VeloHub Development Team
// Mudanças v1.1.0:
// - Adicionado middleware de verificação de acesso (acessos.ouvidoria === true)
// - Rotas protegidas com checkOuvidoriaAccess
console.log('📋 Registrando rotas do módulo Ouvidoria...');
try {
  const initReclamacoesRoutes = require('./routes/api/ouvidoria/reclamacoes');
  const initDashboardRoutes = require('./routes/api/ouvidoria/dashboard');
  const initClientesRoutes = require('./routes/api/ouvidoria/clientes');
  const initRelatoriosRoutes = require('./routes/api/ouvidoria/relatorios');
  const initAnexosRoutes = require('./routes/api/ouvidoria/anexos');
  const initColaboradoresRoutes = require('./routes/api/ouvidoria/colaboradores');
  const checkOuvidoriaAccess = require('./middleware/ouvidoriaAccess');
  
  console.log('📦 Carregando módulos de Ouvidoria...');
  
  // Criar middleware de acesso
  const ouvidoriaAccessMiddleware = checkOuvidoriaAccess(client, connectToMongo);
  
  const reclamacoesRouter = initReclamacoesRoutes(client, connectToMongo, { userActivityLogger });
  const dashboardRouter = initDashboardRoutes(client, connectToMongo);
  const clientesRouter = initClientesRoutes(client, connectToMongo);
  const relatoriosRouter = initRelatoriosRoutes(client, connectToMongo);
  const anexosRouter = initAnexosRoutes(client, connectToMongo);
  const colaboradoresRouter = initColaboradoresRoutes(client, connectToMongo);
  
  // Logs de debug para verificar se routers foram inicializados corretamente
  console.log('🔍 [DEBUG] Verificando routers inicializados:');
  console.log(`   - reclamacoesRouter: ${typeof reclamacoesRouter} ${reclamacoesRouter ? '(OK)' : '(NULL/UNDEFINED)'}`);
  console.log(`   - dashboardRouter: ${typeof dashboardRouter} ${dashboardRouter ? '(OK)' : '(NULL/UNDEFINED)'}`);
  console.log(`   - clientesRouter: ${typeof clientesRouter} ${clientesRouter ? '(OK)' : '(NULL/UNDEFINED)'}`);
  console.log(`   - relatoriosRouter: ${typeof relatoriosRouter} ${relatoriosRouter ? '(OK)' : '(NULL/UNDEFINED)'}`);
  console.log(`   - anexosRouter: ${typeof anexosRouter} ${anexosRouter ? '(OK)' : '(NULL/UNDEFINED)'}`);
  
  if (dashboardRouter) {
    console.log(`   - dashboardRouter.get: ${typeof dashboardRouter.get === 'function' ? 'OK' : 'NÃO É FUNÇÃO'}`);
    console.log(`   - dashboardRouter.stack: ${dashboardRouter.stack ? dashboardRouter.stack.length : 'N/A'} rotas registradas`);
  }
  
  console.log('✅ Routers inicializados');
  
  console.log('🔗 Registrando rotas no Express com middleware de acesso...');
  
  // Validar que todos os routers foram inicializados antes de registrar
  if (!reclamacoesRouter) {
    console.error('❌ [ERRO CRÍTICO] reclamacoesRouter é null ou undefined!');
    throw new Error('reclamacoesRouter não foi inicializado corretamente');
  }
  if (!dashboardRouter) {
    console.error('❌ [ERRO CRÍTICO] dashboardRouter é null ou undefined!');
    throw new Error('dashboardRouter não foi inicializado corretamente');
  }
  if (!clientesRouter) {
    console.error('❌ [ERRO CRÍTICO] clientesRouter é null ou undefined!');
    throw new Error('clientesRouter não foi inicializado corretamente');
  }
  if (!relatoriosRouter) {
    console.error('❌ [ERRO CRÍTICO] relatoriosRouter é null ou undefined!');
    throw new Error('relatoriosRouter não foi inicializado corretamente');
  }
  if (!anexosRouter) {
    console.error('❌ [ERRO CRÍTICO] anexosRouter é null ou undefined!');
    throw new Error('anexosRouter não foi inicializado corretamente');
  }
  if (!colaboradoresRouter) {
    console.error('❌ [ERRO CRÍTICO] colaboradoresRouter é null ou undefined!');
    throw new Error('colaboradoresRouter não foi inicializado corretamente');
  }
  
  // Aplicar middleware de acesso em todas as rotas do módulo Ouvidoria
  console.log('📝 [DEBUG] Registrando rota: /api/ouvidoria/dashboard');
  app.use('/api/ouvidoria/reclamacoes', ouvidoriaAccessMiddleware, reclamacoesRouter);
  app.use('/api/ouvidoria/dashboard', ouvidoriaAccessMiddleware, dashboardRouter);
  app.use('/api/ouvidoria/clientes', ouvidoriaAccessMiddleware, clientesRouter);
  app.use('/api/ouvidoria/relatorios', ouvidoriaAccessMiddleware, relatoriosRouter);
  app.use('/api/ouvidoria/anexos', ouvidoriaAccessMiddleware, anexosRouter);
  app.use('/api/ouvidoria/colaboradores', ouvidoriaAccessMiddleware, colaboradoresRouter);
  
  console.log('✅ Rotas registradas no Express');
  console.log('🔍 [DEBUG] Verificando se rotas foram registradas corretamente...');
  console.log(`   - app._router.stack.length: ${app._router ? app._router.stack.length : 'N/A'}`);
  console.log('✅ Rotas do módulo Ouvidoria registradas com sucesso!');
  console.log('📋 Rotas disponíveis:');
  console.log('   - GET/POST/PUT/DELETE /api/ouvidoria/reclamacoes');
  console.log('   - GET /api/ouvidoria/dashboard/stats');
  console.log('   - GET /api/ouvidoria/dashboard/metricas');
  console.log('   - GET /api/ouvidoria/clientes/:cpf/historico');
  console.log('   - GET /api/ouvidoria/relatorios');
  console.log('   - POST /api/ouvidoria/anexos/upload');
  console.log('   - GET /api/ouvidoria/colaboradores');
} catch (error) {
  console.error('❌ Erro ao registrar rotas de Ouvidoria:', error.message);
  console.error('Stack:', error.stack);
  console.error('Detalhes do erro:', error);
  // NÃO permitir que o servidor continue sem as rotas de ouvidoria
  // Isso garante que o problema seja detectado imediatamente
  throw error;
}

// ===== API PARA MÓDULO VELOCHAT =====
// VERSION: v2.0.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
// 
// NOTA: Rotas de chat foram movidas para VeloChat Server conforme arquitetura definida
// Apenas rotas de status de usuário permanecem no Backend VeloHub:
// - GET /api/status - Obter status do chat do usuário
// - PUT /api/auth/session/chat-status - Atualizar status do chat
//
// Todas as outras rotas de chat (conversas, mensagens, salas, contatos, upload)
// devem ser acessadas via VeloChat Server (REACT_APP_VELOCHAT_API_URL)

// Rotas de chat comentadas - agora gerenciadas pelo VeloChat Server
/*
console.log('💬 Registrando rotas do módulo VeloChat...');

try {
  console.log('📦 Carregando módulos de VeloChat...');
  const { initConversationsRoutes } = require('./routes/api/chat/conversations');
  const { initMensagensRoutes } = require('./routes/api/chat/mensagens');
  const { initSalasRoutes } = require('./routes/api/chat/salas');
  const { initUploadRoutes } = require('./routes/api/chat/upload');
  const { initContactsRoutes } = require('./routes/api/chat/contacts');
  console.log('✅ Módulos carregados com sucesso');

  console.log('🔧 Inicializando routers...');
  // Registrar rotas
  let conversationsRouter, mensagensRouter, salasRouter, uploadRouter, contactsRouter;
  
  try {
    conversationsRouter = initConversationsRoutes(client, connectToMongo);
    console.log('✅ Router de conversas inicializado');
  } catch (error) {
    console.error('❌ Erro ao inicializar router de conversas:', error);
    throw error;
  }
  
  try {
    mensagensRouter = initMensagensRoutes(client, connectToMongo);
    console.log('✅ Router de mensagens inicializado');
  } catch (error) {
    console.error('❌ Erro ao inicializar router de mensagens:', error);
    throw error;
  }
  
  try {
    salasRouter = initSalasRoutes(client, connectToMongo);
    console.log('✅ Router de salas inicializado');
  } catch (error) {
    console.error('❌ Erro ao inicializar router de salas:', error);
    throw error;
  }
  
  try {
    uploadRouter = initUploadRoutes(client, connectToMongo);
    console.log('✅ Router de upload inicializado');
  } catch (error) {
    console.error('❌ Erro ao inicializar router de upload:', error);
    throw error;
  }
  
  try {
    contactsRouter = initContactsRoutes(client, connectToMongo);
    console.log('✅ Router de contatos inicializado');
  } catch (error) {
    console.error('❌ Erro ao inicializar router de contatos:', error);
    throw error;
  }
  
  console.log('✅ Routers inicializados');

  console.log('🔗 Registrando rotas no Express...');
  
  // Registrar rotas
  app.use('/api/chat/conversations', conversationsRouter);
  app.use('/api/chat', mensagensRouter);
  app.use('/api/chat/salas', salasRouter);
  app.use('/api/chat/upload', uploadRouter);
  app.use('/api/chat/contacts', contactsRouter);
  
  console.log('✅ Rotas registradas no Express');
  console.log('✅ Rotas do módulo VeloChat registradas com sucesso!');
  console.log('📋 Rotas disponíveis:');
  console.log('   - GET /api/chat/conversations');
  console.log('   - GET/POST /api/chat/salas/:salaId/mensagens');
  console.log('   - PUT /api/chat/mensagens/:mensagemId');
  console.log('   - DELETE /api/chat/mensagens/:mensagemId');
  console.log('   - GET/POST /api/chat/salas');
  console.log('   - POST /api/chat/upload');
} catch (error) {
  console.error('❌ Erro ao registrar rotas de VeloChat:', error.message);
  console.error('Stack:', error.stack);
  console.error('Detalhes do erro:', error);
}
*/

console.log('💬 Rotas de chat movidas para VeloChat Server conforme arquitetura definida');
console.log('📋 Rotas de status permanecem no Backend VeloHub:');
console.log('   - GET /api/status');
console.log('   - PUT /api/auth/session/chat-status');

// ===== API DE IMAGENS (GCS) =====
console.log('🖼️ Registrando endpoint de imagens GCS...');
// GET /api/images/* - Servir imagens do GCS (proxy direto)
// Usar middleware que intercepta requisições para /api/images/ antes das rotas estáticas
// Proxy resolve ERR_BLOCKED_BY_ORB (Opaque Response Blocking) ao servir imagem diretamente
app.use('/api/images', async (req, res, next) => {
  // Apenas processar requisições GET
  if (req.method !== 'GET') {
    return next();
  }
  
  try {
    // req.path pode vir codificado (%20) ou decodificado pelo Express
    // Precisamos decodificar completamente antes de processar para evitar encoding duplo
    let imagePath = req.path.startsWith('/') ? req.path.substring(1) : req.path;
    
    // Decodificar completamente (resolve encoding duplo se req.path vier codificado)
    try {
      imagePath = decodeURIComponent(imagePath);
    } catch (e) {
      // Se já estiver decodificado ou erro na decodificação, continuar com o valor original
      // Isso garante compatibilidade com ambos os casos
    }
    
    // imagePath agora está garantidamente decodificado: "img_velonews/1765293397337-mascote joia.jpg"
    
    console.log('🖼️ BACKEND - Requisição recebida:', {
      method: req.method,
      path: req.path,
      baseUrl: req.baseUrl,
      url: req.url,
      originalUrl: req.originalUrl,
      imagePath: imagePath,
      bucketName: process.env.GCS_BUCKET_NAME2
    });
    
    // Validar caminho (deve começar com img_velonews/, img_artigos/ ou mediabank_velohub/img_pilulas/)
    if (!imagePath || (!imagePath.startsWith('img_velonews/') && !imagePath.startsWith('img_artigos/') && !imagePath.startsWith('mediabank_velohub/img_pilulas/'))) {
      console.error('❌ BACKEND - Caminho inválido:', imagePath);
      return res.status(400).json({
        success: false,
        message: 'Caminho de imagem inválido. Deve começar com img_velonews/, img_artigos/ ou mediabank_velohub/img_pilulas/'
      });
    }

    const bucketName = process.env.GCS_BUCKET_NAME2;
    if (!bucketName) {
      console.error('❌ GCS_BUCKET_NAME2 não configurado');
      return res.status(503).json({
        success: false,
        message: 'GCS_BUCKET_NAME2 não configurado'
      });
    }

    // Construir URL pública do GCS
    // Codificar cada parte do caminho separadamente para lidar com espaços e caracteres especiais
    // Mantém as barras não codificadas, mas codifica o nome do arquivo
    let finalPath = imagePath;
    
    // Se o caminho começa com o nome do bucket, remover (o bucket já está na URL do GCS)
    if (finalPath.startsWith(`${bucketName}/`)) {
      finalPath = finalPath.substring(bucketName.length + 1);
    }
    
    const pathParts = finalPath.split('/');
    const encodedParts = pathParts.map(part => encodeURIComponent(part));
    const encodedPath = encodedParts.join('/');
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${encodedPath}`;
    
    // Fazer proxy: baixar imagem do GCS e servir diretamente
    // Isso resolve ERR_BLOCKED_BY_ORB (Opaque Response Blocking)
    const imageResponse = await fetch(publicUrl);
    
    if (!imageResponse.ok) {
      console.error(`❌ BACKEND - Erro ao buscar imagem do GCS: ${imageResponse.status} ${imageResponse.statusText}`);
      console.error(`❌ BACKEND - URL tentada: ${publicUrl}`);
      
      // Se for 403, o bucket não está público
      if (imageResponse.status === 403) {
        console.error(`❌ BACKEND - Bucket não está público! Para resolver:`);
        console.error(`   1. Acesse: https://console.cloud.google.com/storage/browser/${bucketName}`);
        console.error(`   2. Clique em "Permissions" (Permissões)`);
        console.error(`   3. Clique em "Add Principal"`);
        console.error(`   4. Em "New principals", digite: allUsers`);
        console.error(`   5. Em "Role", selecione: Storage Object Viewer`);
        console.error(`   6. Salve e aguarde alguns segundos`);
        
        return res.status(403).json({
          success: false,
          message: 'Bucket não está público. Configure permissões públicas no Google Cloud Console.',
          details: `Bucket: ${bucketName}`,
          help: 'Veja logs do backend para instruções detalhadas'
        });
      }
      
      return res.status(imageResponse.status).json({
        success: false,
        message: `Erro ao buscar imagem: ${imageResponse.statusText}`,
        details: `Status: ${imageResponse.status}`
      });
    }
    
    // Obter Content-Type da resposta (ou inferir do nome do arquivo)
    const contentType = imageResponse.headers.get('content-type') || 
                        (imagePath.toLowerCase().endsWith('.jpg') || imagePath.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' :
                         imagePath.toLowerCase().endsWith('.png') ? 'image/png' :
                         imagePath.toLowerCase().endsWith('.gif') ? 'image/gif' :
                         imagePath.toLowerCase().endsWith('.webp') ? 'image/webp' :
                         'application/octet-stream');
    
    // Obter buffer da imagem
    const imageBuffer = await imageResponse.buffer();
    
    // Adicionar headers CORS e Content-Type
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '3600');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', imageBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache por 1 ano
    
    // Enviar imagem diretamente
    res.send(imageBuffer);
    // Não chamar next() - finalizar a requisição aqui
    return;
  } catch (error) {
    console.error('❌ Erro ao servir imagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao servir imagem',
      error: error.message
    });
    // Não chamar next() em caso de erro também
    return;
  }
  
  // Se chegou aqui, não era uma requisição válida de imagem
  next();
});
console.log('✅ Endpoint GET /api/images/* registrado com sucesso (proxy direto)');

// ===== API DE PÍLULAS =====
console.log('💊 Registrando endpoint de pílulas...');
// GET /api/pilulas/list - Listar imagens disponíveis em mediabank_velohub/img_pilulas/
app.get('/api/pilulas/list', async (req, res) => {
  try {
    const bucketName = process.env.GCS_BUCKET_NAME2 || 'mediabank_velohub';
    
    if (!bucketName) {
      console.error('❌ GCS_BUCKET_NAME2 não configurado');
      return res.status(503).json({
        success: false,
        message: 'GCS_BUCKET_NAME2 não configurado'
      });
    }

    // Inicializar Google Cloud Storage
    let storage;
    try {
      const googleCredentials = process.env.GOOGLE_CREDENTIALS;
      const googleApplicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      const gcpProjectId = process.env.GCP_PROJECT_ID;
      
      // Verificar se variáveis necessárias estão definidas
      if (!gcpProjectId || gcpProjectId === 'your-gcp-project-id') {
        console.error('❌ [pilulas/list] GCP_PROJECT_ID não está definido ou está com valor placeholder');
        return res.status(500).json({
          success: false,
          error: 'GCP_PROJECT_ID não configurado. Verifique o arquivo backend/env'
        });
      }
      
      // Prioridade 1: GOOGLE_APPLICATION_CREDENTIALS (caminho para arquivo JSON)
      if (googleApplicationCredentials) {
        try {
          storage = new Storage({
            projectId: gcpProjectId,
            keyFilename: googleApplicationCredentials
          });
          console.log('✅ [pilulas/list] Storage inicializado com GOOGLE_APPLICATION_CREDENTIALS');
        } catch (fileError) {
          console.error('❌ [pilulas/list] Erro ao carregar arquivo de credenciais:', fileError);
        }
      }
      
      // Prioridade 2: GOOGLE_CREDENTIALS (JSON string ou caminho de arquivo)
      if (!storage && googleCredentials) {
        if (googleCredentials.trim().startsWith('{') || googleCredentials.trim().startsWith('[')) {
          try {
            const credentials = JSON.parse(googleCredentials);
            
            // Verificar se credenciais são placeholders
            if (credentials.project_id === 'your-project-id' || 
                credentials.private_key === '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n' ||
                credentials.private_key?.includes('...')) {
              console.error('❌ [pilulas/list] GOOGLE_CREDENTIALS contém valores placeholder');
              return res.status(500).json({
                success: false,
                error: 'Credenciais do Google Cloud não configuradas. Verifique o arquivo backend/env'
              });
            }
            
            // Corrigir chave privada: converter \n literais para quebras de linha reais
            if (credentials.private_key) {
              credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
            }
            
            storage = new Storage({
              projectId: gcpProjectId,
              credentials: credentials
            });
            console.log('✅ [pilulas/list] Storage inicializado com GOOGLE_CREDENTIALS (JSON)');
          } catch (parseError) {
            console.error('❌ [pilulas/list] Erro ao fazer parse das credenciais JSON:', parseError);
            try {
              storage = new Storage({
                projectId: gcpProjectId,
                keyFilename: googleCredentials
              });
              console.log('✅ [pilulas/list] Storage inicializado com GOOGLE_CREDENTIALS (arquivo)');
            } catch (fileError) {
              console.error('❌ [pilulas/list] Erro ao carregar arquivo de credenciais:', fileError);
            }
          }
        } else {
          try {
            storage = new Storage({
              projectId: gcpProjectId,
              keyFilename: googleCredentials
            });
            console.log('✅ [pilulas/list] Storage inicializado com GOOGLE_CREDENTIALS (arquivo)');
          } catch (fileError) {
            console.error('❌ [pilulas/list] Erro ao carregar arquivo de credenciais:', fileError);
          }
        }
      }
      
      // Se storage ainda não foi inicializado, tentar Application Default Credentials (ADC)
      if (!storage) {
        try {
          storage = new Storage({
            projectId: gcpProjectId
          });
          console.log('✅ [pilulas/list] Storage inicializado com Application Default Credentials (ADC)');
        } catch (adcError) {
          console.error('❌ [pilulas/list] Erro ao inicializar Storage com ADC:', adcError);
          return res.status(500).json({
            success: false,
            error: 'Erro ao inicializar Google Cloud Storage',
            details: process.env.NODE_ENV === 'development' ? adcError.message : undefined
          });
        }
      }
      
      // Verificar se storage foi inicializado com sucesso
      if (!storage) {
        console.error('❌ [pilulas/list] Storage não pôde ser inicializado com nenhum método disponível');
        return res.status(500).json({
          success: false,
          error: 'Erro ao inicializar Google Cloud Storage: nenhum método de autenticação funcionou',
          details: process.env.NODE_ENV === 'development' ? 'Verifique GOOGLE_CREDENTIALS, GOOGLE_APPLICATION_CREDENTIALS ou Application Default Credentials' : undefined
        });
      }
    } catch (error) {
      console.error('❌ [pilulas/list] Erro ao inicializar Storage:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao inicializar Google Cloud Storage',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    const bucket = storage.bucket(bucketName);
    // Prefixo correto: img_pilulas/ (dentro do bucket mediabank_velohub)
    const prefix = 'img_pilulas/';
    
    console.log(`💊 [pilulas/list] Bucket: ${bucketName}, Prefix: ${prefix}`);
    console.log(`💊 [pilulas/list] Listando arquivos em ${bucketName}/${prefix}`);
    
    // Verificar se o bucket existe e é acessível
    try {
      const [exists] = await bucket.exists();
      if (!exists) {
        console.error(`❌ [pilulas/list] Bucket ${bucketName} não existe ou não é acessível`);
        return res.status(500).json({
          success: false,
          error: `Bucket ${bucketName} não encontrado ou sem permissão de acesso`
        });
      }
    } catch (bucketError) {
      console.error(`❌ [pilulas/list] Erro ao verificar bucket ${bucketName}:`, bucketError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao acessar bucket do Google Cloud Storage',
        details: process.env.NODE_ENV === 'development' ? bucketError.message : undefined
      });
    }
    
    // Listar arquivos com prefix img_pilulas/
    let files = [];
    try {
      [files] = await bucket.getFiles({ prefix });
      console.log(`💊 [pilulas/list] Total de arquivos encontrados: ${files.length}`);
    } catch (listError) {
      console.error(`❌ [pilulas/list] Erro ao listar arquivos do bucket:`, listError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao listar arquivos do bucket',
        details: process.env.NODE_ENV === 'development' ? listError.message : undefined
      });
    }
    
    // Filtrar apenas arquivos de imagem
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const images = files
      .filter(file => {
        const fileName = file.name.toLowerCase();
        return imageExtensions.some(ext => fileName.endsWith(ext));
      })
      .map(file => {
        // Remover o prefix para retornar apenas o nome do arquivo
        const fileName = file.name.replace(prefix, '');
        return fileName;
      });
    
    console.log(`💊 [pilulas/list] Encontradas ${images.length} imagens de pílulas`);
    
    return res.json({
      success: true,
      images: images
    });
    
  } catch (error) {
    console.error('❌ [pilulas/list] Erro ao listar imagens de pílulas:', error);
    console.error('❌ [pilulas/list] Stack trace:', error.stack);
    console.error('❌ [pilulas/list] Variáveis de ambiente:', {
      GCP_PROJECT_ID: process.env.GCP_PROJECT_ID ? 'definido' : 'não definido',
      GOOGLE_CREDENTIALS: process.env.GOOGLE_CREDENTIALS ? 'definido' : 'não definido',
      GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'definido' : 'não definido',
      GCS_BUCKET_NAME2: process.env.GCS_BUCKET_NAME2 || 'mediabank_velohub'
    });
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar imagens de pílulas',
      error: error.message || 'Erro desconhecido',
      details: process.env.NODE_ENV === 'development' ? error.stack : 'Verifique os logs do servidor para mais detalhes'
    });
  }
});
console.log('✅ Endpoint GET /api/pilulas/list registrado com sucesso');

// Servir arquivos estáticos do frontend (DEPOIS das rotas da API)
// IMPORTANTE: Não servir arquivos estáticos para rotas da API
// No Docker/produção: public está em ./public (mesmo diretório do server.js)
// No desenvolvimento local: public pode estar em ../public (um nível acima)
let publicPath = path.join(__dirname, 'public');
console.log(`📁 [server.js] Tentando caminho padrão: ${publicPath}`);

// Verificar se a pasta public existe no caminho padrão
if (!fs.existsSync(publicPath)) {
  console.warn(`⚠️ [server.js] Pasta public não encontrada em: ${publicPath}`);
  // Tentar caminho alternativo (desenvolvimento local)
  const altPath = path.join(__dirname, '..', 'public');
  console.log(`📁 [server.js] Tentando caminho alternativo: ${altPath}`);
  if (fs.existsSync(altPath)) {
    publicPath = altPath;
    console.log(`✅ [server.js] Pasta public encontrada no caminho alternativo: ${publicPath}`);
  } else {
    console.error(`❌ [server.js] Pasta public não encontrada em nenhum dos caminhos:`);
    console.error(`   - ${path.join(__dirname, 'public')}`);
    console.error(`   - ${altPath}`);
    console.error(`   - __dirname atual: ${__dirname}`);
  }
} else {
  console.log(`✅ [server.js] Pasta public encontrada: ${publicPath}`);
}

const staticMiddleware = express.static(publicPath, {
  index: false, // Não servir index.html automaticamente
  setHeaders: (res, filePath, stat) => {
    // Garantir que arquivos JavaScript sejam servidos com Content-Type correto
    if (filePath.endsWith('.js')) {
      // Verificar se é um módulo ES6 (arquivos com export/import)
      // Arquivos em static/js/ são módulos ES6 e precisam de type="module"
      const isModule = filePath.includes('/static/js/') || filePath.includes('/static/');
      if (isModule) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      }
    }
    // Adicionar headers CORS para arquivos estáticos
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
});
app.use((req, res, next) => {
  staticMiddleware(req, res, next);
});

// Rota para servir o React app (SPA) - DEVE SER A ÚLTIMA ROTA
// IMPORTANTE: Não capturar rotas que começam com /api
app.all('*', (req, res, next) => {
  // Se for uma rota da API, não servir o HTML
  if (req.path.startsWith('/api/')) {
    console.log(`⚠️ [CATCH-ALL] Rota da API não encontrada: ${req.method} ${req.path}`);
    return res.status(404).json({
      success: false,
      message: 'Rota da API não encontrada',
      path: req.path,
      method: req.method
    });
  }
  // Apenas GET deve servir o HTML do React
  if (req.method === 'GET') {
    const indexPath = path.join(publicPath, 'index.html');
    console.log(`📄 [server.js] Servindo index.html de: ${indexPath}`);
    
    // Verificar se o arquivo existe antes de servir
    if (!fs.existsSync(indexPath)) {
      console.error(`❌ [server.js] Arquivo index.html não encontrado em: ${indexPath}`);
      return res.status(404).json({
        success: false,
        message: 'Arquivo index.html não encontrado',
        path: indexPath
      });
    }
    
    res.sendFile(indexPath);
  } else {
    res.status(404).json({
      success: false,
      message: 'Rota não encontrada',
      path: req.path,
      method: req.method
    });
  }
});
