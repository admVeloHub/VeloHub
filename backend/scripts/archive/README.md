# Scripts Arquivados - Backend

Esta pasta contém scripts que foram movidos do diretório principal por não serem mais utilizados em produção.

## Scripts Movidos

### Scripts de Análise e Investigação
- `analyzeDataVolume.js` - Análise de volume de dados MongoDB (credenciais removidas)
- `checkVelonews.js` - Verificação de coleção Velonews (credenciais removidas)
- `investigateIndexes.js` - Investigação de índices MongoDB
- `investigateTitleContent.js` - Investigação de título/conteudo
- `runDataAnalysis.js` - Execução de análise de dados
- `testOptimizedFilter.js` - Teste de filtro otimizado
- `testExistingIndexes.js` - Teste de índices existentes
- `checkExistingIndexes.js` - Verificação de índices existentes

### Scripts de Configuração
- `insert_module_status_mongodb.js` - Script MongoDB para inserir status de módulos
- `mongodb_module_status_example.json` - Exemplo de configuração de módulos

### Scripts de Correção
- `fix-solicitacoes-final.ps1` - Script de correção de encoding (correção única já aplicada)

## Nota de Segurança

**ATENÇÃO**: Os scripts `analyzeDataVolume.js` e `checkVelonews.js` foram limpos removendo credenciais hardcoded. 
Eles agora usam variáveis de ambiente (`MONGO_ENV`) para conexão com MongoDB.

## Data de Arquivamento

2025-01-30 - Limpeza de arquivos não utilizados

## Motivo do Arquivamento

Estes scripts não são referenciados no `backend/server.js` e não são utilizados em produção.
Foram mantidos aqui para referência histórica caso sejam necessários no futuro.

