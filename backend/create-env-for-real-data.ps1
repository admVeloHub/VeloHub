# VeloHub V3 - Script para Criar .env com Dados Reais
# VERSION: v1.0.0 | DATE: 2025-01-30 | AUTHOR: VeloHub Development Team

Write-Host "🔧 VeloHub V3 - Configuração para Dados Reais" -ForegroundColor Cyan
Write-Host ""

# Verificar se .env já existe
if (Test-Path ".env") {
    Write-Host "⚠️  Arquivo .env já existe!" -ForegroundColor Yellow
    $response = Read-Host "Deseja sobrescrever? (s/n)"
    if ($response -ne "s" -and $response -ne "S") {
        Write-Host "❌ Operação cancelada." -ForegroundColor Red
        exit
    }
}

Write-Host "📝 Criando arquivo .env para dados reais..." -ForegroundColor Green

# Criar conteúdo do .env
$envContent = @"
# VeloHub V3 - Configuração para Testes com Dados Reais
# VERSION: v1.0.0 | DATE: 2025-01-30 | AUTHOR: VeloHub Development Team

# ===========================================
# BANCO DE DADOS - DADOS REAIS
# ===========================================
# MongoDB Connection String (usar string real do MongoDB Atlas)
MONGO_ENV=mongodb+srv://usuario:senha@cluster.mongodb.net/console_conteudo

# ===========================================
# APIs DE INTELIGÊNCIA ARTIFICIAL - DADOS REAIS
# ===========================================
# OpenAI API Key (para fallback)
OPENAI_API_KEY=sk-your-openai-key-here

# Google Gemini API Key (IA primária)
GEMINI_API_KEY=AI-your-gemini-key-here

# ===========================================
# GOOGLE SERVICES - DADOS REAIS
# ===========================================
# Google OAuth (para SSO)
GOOGLE_CLIENT_ID=278491073220-eb4ogvn3aifu0ut9mq3rvu5r9r9l3137.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Google Sheets API (para logs)
GOOGLE_CREDENTIALS=your-google-credentials-json-here

# ===========================================
# CONFIGURAÇÕES DO SERVIDOR
# ===========================================
# Ambiente de execução (forçar produção para usar dados reais)
NODE_ENV=production

# Porta do servidor
PORT=8080

# ===========================================
# CONFIGURAÇÕES DE TESTE
# ===========================================
# Desabilitar fallback local (usar dados reais)
LOCAL_TESTING=false

# Cache timeout para dados do chatbot (em ms)
CHATBOT_CACHE_TIMEOUT=300000

# ===========================================
# CONFIGURAÇÕES OPCIONAIS
# ===========================================
# Ponto Mais API (se necessário)
PONTO_MAIS_API_KEY=your-ponto-mais-key-here
PONTO_MAIS_COMPANY_ID=your-company-id-here
"@

# Escrever arquivo .env
$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "✅ Arquivo .env criado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Edite o arquivo .env e substitua os valores 'your-*-here' pelas credenciais reais"
Write-Host "2. Execute: npm start"
Write-Host "3. O sistema usará dados reais do MongoDB e APIs reais"
Write-Host ""
Write-Host "🔒 SEGURANÇA:" -ForegroundColor Yellow
Write-Host "- O arquivo .env está no .gitignore e NÃO será commitado"
Write-Host "- Mantenha suas credenciais seguras"
Write-Host ""
Write-Host "🎯 TESTE:" -ForegroundColor Magenta
Write-Host "- Acesse: http://localhost:8080"
Write-Host "- Teste o chatbot com dados reais"
Write-Host "- Verifique os logs para confirmar conexão com MongoDB"
