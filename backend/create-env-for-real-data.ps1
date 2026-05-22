# VeloHub V3 - Script para Criar .env com Dados Reais
# VERSION: v1.0.1 | DATE: 2026-04-22 | AUTHOR: VeloHub Development Team
# v1.0.1: template sem URIs nem chaves que imitem credenciais reais (apenas marcadores).

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
# Substitua cada <definir_...> pelos valores reais (ou use FONTE DA VERDADE/. em dev).

# ===========================================
# BANCO DE DADOS - DADOS REAIS
# ===========================================
# String de conexão MongoDB (Atlas ou local) — não commitar valores reais neste repo
MONGO_ENV=<definir_uri_mongodb>

# ===========================================
# APIs DE INTELIGÊNCIA ARTIFICIAL - DADOS REAIS
# ===========================================
OPENAI_API_KEY=<definir_openai>
GEMINI_API_KEY=<definir_gemini>

# ===========================================
# GOOGLE SERVICES - DADOS REAIS
# ===========================================
GOOGLE_CLIENT_ID=<definir_google_oauth_client_id>
GOOGLE_CLIENT_SECRET=<definir_google_oauth_client_secret>
GOOGLE_CREDENTIALS=<definir_google_credentials_json_ou_caminho>

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
PONTO_MAIS_API_KEY=<definir>
PONTO_MAIS_COMPANY_ID=<definir>
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
