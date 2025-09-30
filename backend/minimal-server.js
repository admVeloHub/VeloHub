// Servidor mínimo para teste de deploy
// VERSION: v1.0.0 | DATE: 2025-01-27 | AUTHOR: Lucas Gravina - VeloHub Development Team

console.log('🔄 Iniciando servidor mínimo...');

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

console.log(`📍 Porta: ${PORT}`);
console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);

// Middleware básico
app.use(express.json());

// Rota de teste
app.get('/api/test', (req, res) => {
  console.log('✅ Rota /api/test acessada');
  res.json({ 
    status: 'OK', 
    message: 'Servidor mínimo funcionando',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Rota de health check
app.get('/health', (req, res) => {
  console.log('✅ Health check acessado');
  res.status(200).json({ status: 'healthy' });
});

// Servir arquivos estáticos se existirem
try {
  app.use(express.static(path.join(__dirname, 'public')));
  console.log('✅ Arquivos estáticos configurados');
} catch (error) {
  console.log('⚠️ Pasta public não encontrada, continuando sem arquivos estáticos');
}

// Rota catch-all para SPA
app.get('*', (req, res) => {
  console.log(`📍 Rota catch-all: ${req.path}`);
  try {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } catch (error) {
    res.status(404).json({ 
      error: 'Not found',
      path: req.path,
      message: 'Arquivo não encontrado'
    });
  }
});

// Iniciar servidor
console.log('🚀 Iniciando servidor na porta', PORT);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
  console.log(`📡 Teste: http://0.0.0.0:${PORT}/api/test`);
  console.log(`❤️ Health: http://0.0.0.0:${PORT}/health`);
});

// Tratamento de erros
server.on('error', (error) => {
  console.error('❌ Erro no servidor:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada:', reason);
  process.exit(1);
});

console.log('✅ Servidor mínimo configurado');
