# Script de Sincronização Firebase → MongoDB

## 📋 Descrição

Este script sincroniza apenas os **novos casos** do Firebase Realtime Database para o MongoDB, comparando com casos já existentes e inserindo apenas os que ainda não foram migrados.

**Database MongoDB:** `hub_ouvidoria`  
**Collections:**
- `reclamacoes_bacen`
- `reclamacoes_ouvidoria`

## 🚀 Como Usar

### Pré-requisitos

1. Node.js instalado (versão 18+)
2. Variável de ambiente `MONGO_ENV` configurada no arquivo `.env`
3. Conexão com internet para acessar o Firebase

### Execução

#### 1. Modo Dry-Run (Recomendado primeiro)

Execute em modo de validação para ver o que seria sincronizado sem fazer alterações:

```bash
cd "C:\DEV - Ecosistema Velohub\root - velohub\dev VeloHub\backend"
node scripts/sync-firebase-to-mongodb.js --dry-run
```

#### 2. Sincronização Real

Após verificar o resultado do dry-run, execute a sincronização real:

```bash
cd "C:\DEV - Ecosistema Velohub\root - velohub\dev VeloHub\backend"
node scripts/sync-firebase-to-mongodb.js
```

## 📊 O que o Script Faz

1. **Baixa dados do Firebase** diretamente via API REST
2. **Converte cada registro** para o formato correto do MongoDB
3. **Verifica duplicatas** usando múltiplas estratégias:
   - Por `firebaseId` (se disponível)
   - Por CPF + nome + data de criação (±1 dia)
   - Por CPF + email + data (±2 dias)
4. **Insere apenas novos casos** que não existem no MongoDB
5. **Valida dados** obrigatórios (nome, CPF)
6. **Gera relatório** com estatísticas detalhadas

## 🔍 Estratégias de Detecção de Duplicatas

O script usa três estratégias para evitar inserir casos duplicados:

1. **Por Firebase ID**: Se o caso já foi migrado anteriormente e tem `firebaseId` salvo
2. **Por CPF + Nome + Data**: Verifica se existe caso com mesmo CPF, nome e data próxima (±1 dia)
3. **Por CPF + Email + Data**: Verifica se existe caso com mesmo CPF, email e data próxima (±2 dias)

## 📝 Logs e Relatórios

O script exibe:
- Progresso em tempo real
- Registros ignorados (falta nome ou CPF)
- Registros duplicados (já existem)
- Erros durante o processamento
- Resumo final com estatísticas por tipo:
  - Total processados
  - Novos casos inseridos
  - Duplicatas encontradas
  - Erros encontrados

## ⚠️ Observações Importantes

1. **Modo Dry-Run**: Sempre execute primeiro com `--dry-run` para validar o que será sincronizado
2. **Duplicatas**: O script é inteligente e evita inserir casos duplicados usando múltiplas estratégias
3. **Campos Opcionais**: Campos não encontrados no Firebase serão preenchidos com valores padrão
4. **Conversão de Dados**: O script converte automaticamente:
   - Status do Firebase para formato MongoDB
   - Telefones de string para array
   - Datas para objetos Date
   - Campos específicos por tipo (BACEN, N2)
5. **Campo firebaseId**: Cada caso inserido recebe um campo `firebaseId` para rastreamento futuro

## 🔗 Conexão MongoDB

O script usa a variável de ambiente `MONGO_ENV` do arquivo `.env` do backend.

Database: `hub_ouvidoria`

## ✅ Validações

- Nome obrigatório
- CPF obrigatório
- CPF deve ter 11 dígitos (sem formatação)
- Datas convertidas para objetos Date do MongoDB

## 🐛 Troubleshooting

### Erro de Conexão MongoDB
- Verifique se `MONGO_ENV` está configurada no `.env`
- Verifique sua conexão com a internet
- Verifique se o MongoDB Atlas permite conexões do seu IP

### Erro ao Baixar do Firebase
- Verifique sua conexão com a internet
- Verifique se o Firebase está acessível
- Verifique se as URLs do Firebase estão corretas no script

### Erros de Validação
- Registros sem nome ou CPF serão ignorados (não inseridos)
- Verifique os logs para ver quais registros foram ignorados

### Muitas Duplicatas
- Isso é normal se a maioria dos casos já foi migrada anteriormente
- O script apenas insere casos realmente novos

## 📊 Exemplo de Saída

```
🚀 Iniciando sincronização Firebase → MongoDB (Apenas Novos Casos)...
   Modo: SINCRONIZAÇÃO REAL

✅ Conectado ao MongoDB

📂 Sincronizando BACEN...
   📥 Baixando dados do Firebase: fichas_bacen...
   ✅ 150 fichas baixadas do Firebase
   ✓ 10 novos casos inseridos...
   ✓ 20 novos casos inseridos...

✅ BACEN: 150 processadas | 25 novas | 125 duplicatas | 0 erros

📂 Sincronizando N2...
   📥 Baixando dados do Firebase: fichas_n2...
   ✅ 80 fichas baixadas do Firebase

✅ N2: 80 processadas | 5 novas | 75 duplicatas | 0 erros

======================================================================
📊 RESUMO DA SINCRONIZAÇÃO
======================================================================
BACEN:      150 processadas | 25 novas | 125 duplicatas | 0 erros
N2:         80 processadas | 5 novas | 75 duplicatas | 0 erros
======================================================================
TOTAL:      230 processadas | 30 novas | 200 duplicatas | 0 erros
======================================================================

✅ Sincronização concluída com sucesso!

🔌 Conexão MongoDB fechada
```

## 🔄 Uso Contínuo

Este script pode ser executado periodicamente para manter o MongoDB sincronizado com o Firebase:

- Execute sempre em modo `--dry-run` primeiro para verificar
- O script é seguro e não duplica dados
- Pode ser executado quantas vezes necessário

## 📝 Versão

**VERSION:** v1.0.0  
**DATE:** 2026-02-24  
**AUTHOR:** VeloHub Development Team
