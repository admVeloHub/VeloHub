// Teste de Configuração - VeloHub V3
// VERSION: v1.0.0 | DATE: 2025-01-27 | AUTHOR: Lucas Gravina - VeloHub Development Team

require('dotenv').config();
const config = require('./backend/config');

console.log('🔍 VALIDAÇÃO DA CONFIGURAÇÃO VELOHUB V3');
console.log('=====================================\n');

// Validar configuração
const validation = config.validateConfig();

console.log('📊 STATUS GERAL:');
console.log(`✅ Configuração válida: ${validation.isValid ? 'SIM' : 'NÃO'}`);
console.log(`🤖 IA configurada: ${validation.hasAI ? 'SIM' : 'NÃO'}`);
console.log(`📊 Sheets configurado: ${validation.hasSheets ? 'SIM' : 'NÃO'}\n`);

if (validation.missing.length > 0) {
    console.log('❌ CONFIGURAÇÕES FALTANDO:');
    validation.missing.forEach(key => {
        console.log(`   - ${key}`);
    });
    console.log('');
}

if (validation.available.length > 0) {
    console.log('✅ CONFIGURAÇÕES DISPONÍVEIS:');
    validation.available.forEach(key => {
        console.log(`   - ${key}`);
    });
    console.log('');
}

// Detalhes das APIs
console.log('🔑 DETALHES DAS APIs:');
console.log(`   MongoDB: ${config.MONGODB_URI ? '✅ Configurado' : '❌ Não configurado'}`);
console.log(`   Google OAuth: ${config.GOOGLE_CLIENT_ID ? '✅ Configurado' : '❌ Não configurado'}`);
console.log(`   OpenAI: ${config.OPENAI_API_KEY ? '✅ Configurado' : '⚠️ Opcional'}`);
console.log(`   Gemini: ${config.GEMINI_API_KEY ? '✅ Configurado' : '⚠️ Opcional'}`);
console.log(`   Google Sheets: ${config.GOOGLE_CREDENTIALS ? '⚠️ Configurado (ALTO RISCO)' : '✅ Não configurado (SEGURO)'}\n`);

// Análise de segurança
console.log('🔒 ANÁLISE DE SEGURANÇA:');
if (config.GOOGLE_CREDENTIALS) {
    console.log('   ⚠️ ALERTA: Google Credentials configuradas');
    console.log('   ⚠️ RISCO: Acesso total ao Google Cloud');
    console.log('   💡 RECOMENDAÇÃO: Use apenas em produção com service account restrita');
} else {
    console.log('   ✅ SEGURO: Google Credentials não configuradas');
    console.log('   ✅ LOGS: Serão salvos apenas no MongoDB');
}
console.log('');

// Configurações do servidor
console.log('⚙️ CONFIGURAÇÕES DO SERVIDOR:');
console.log(`   Ambiente: ${config.NODE_ENV}`);
console.log(`   Porta: ${config.PORT}`);
console.log(`   Timeout API: ${config.EXTERNAL_API_TIMEOUT}ms`);
console.log(`   Cache Chatbot: ${config.CHATBOT_CACHE_TIMEOUT}ms\n`);

// Configurações do chatbot
console.log('🤖 CONFIGURAÇÕES DO CHATBOT:');
console.log(`   Spreadsheet ID: ${config.CHATBOT_SPREADSHEET_ID}`);
console.log(`   Log Sheet: ${config.CHATBOT_LOG_SHEET_NAME}\n`);

// Resumo final
if (validation.isValid) {
    console.log('🎉 CONFIGURAÇÃO COMPLETA!');
    console.log('   O servidor está pronto para ser iniciado.');
} else {
    console.log('⚠️ CONFIGURAÇÃO INCOMPLETA!');
    console.log('   Configure as chaves faltantes no arquivo .env');
    console.log('   Consulte o arquivo CONFIGURACAO_CHAVES_API.md para instruções.');
}

console.log('\n=====================================');
console.log('Para iniciar o servidor: npm start');
console.log('Para modo desenvolvimento: npm run dev');
