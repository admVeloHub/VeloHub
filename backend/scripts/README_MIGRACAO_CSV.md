# Scripts de Migração CSV → MongoDB

## 📋 Descrição

Scripts para migrar dados dos arquivos CSV para MongoDB, refazendo completamente o conteúdo das collections `reclamacoes_bacen` e `reclamacoes_n2Pix`.

## 🚀 Scripts Disponíveis

### 1. migrate-bacen-2025.js
- **Arquivo CSV:** `update bacen/Bacen 2025.csv`
- **Collection:** `hub_ouvidoria.reclamacoes_bacen`
- **Lógica:** Todos os registros são marcados como `Finalizado.Resolvido = true`

### 2. migrate-bacen-2026.js
- **Arquivo CSV:** `update bacen/Bacen 2026.csv`
- **Collection:** `hub_ouvidoria.reclamacoes_bacen`
- **Lógica:** 
  - Se `updatedAt` anterior a 15/02/2026: `Finalizado.Resolvido = true`
  - Se `updatedAt` posterior ou igual a 15/02/2026: `Finalizado.Resolvido = false`

### 3. migrate-ouvidoria-2025.js
- **Arquivo CSV:** `update bacen/Ouvidoria 2025.csv`
- **Collection:** `hub_ouvidoria.reclamacoes_n2Pix`
- **Lógica:** Todos os registros são marcados como `Finalizado.Resolvido = true`

### 4. migrate-ouvidoria-2026.js
- **Arquivo CSV:** `update bacen/Ouvidoria 2026.csv`
- **Collection:** `hub_ouvidoria.reclamacoes_n2Pix`
- **Lógica:**
  - Se `updatedAt` anterior a 15/02/2026: `Finalizado.Resolvido = true`
  - Se `updatedAt` posterior ou igual a 15/02/2026: `Finalizado.Resolvido = false`

## 📝 Como Usar

### Pré-requisitos

1. Node.js instalado (versão 18+)
2. Variável de ambiente `MONGO_ENV` configurada no arquivo `.env`
3. Arquivos CSV na pasta `update bacen/`

### Execução

#### Modo Dry-Run (Recomendado primeiro)

Execute em modo de validação para ver o que seria migrado sem fazer alterações:

```bash
cd "C:\DEV - Ecosistema Velohub\root - velohub\dev VeloHub\backend"
node scripts/migrate-bacen-2025.js --dry-run
```

#### Migração Real

Após verificar o resultado do dry-run, execute a migração real:

```bash
cd "C:\DEV - Ecosistema Velohub\root - velohub\dev VeloHub\backend"
node scripts/migrate-bacen-2025.js
```

## ⚠️ IMPORTANTE

**Cada script limpa completamente a collection antes de inserir os novos dados!**

- Se executar `migrate-bacen-2026.js` depois de `migrate-bacen-2025.js`, os dados de 2025 serão perdidos
- Se executar `migrate-ouvidoria-2026.js` depois de `migrate-ouvidoria-2025.js`, os dados de 2025 serão perdidos

**Recomendação:** Execute apenas os scripts de 2026 se os CSVs de 2026 contêm todos os dados (2025 + 2026).

## 📊 Mapeamento de Campos

### Campos Comuns (BACEN e OUVIDORIA)

| Campo MongoDB | Campo CSV | Observações |
|---------------|-----------|-------------|
| `nome` | "Nome completo" | Obrigatório |
| `cpf` | "CPF Tratado" ou "CPF" | Limpar para 11 dígitos, obrigatório |
| `telefones.lista` | "Telefone" | Converter para array formatado |
| `email` | - | Vazio (não existe no CSV) |
| `observacoes` | "Observações" | |
| `responsavel` | "Responsável" | |
| `tentativasContato.lista` | "1ª tentativa", "2ª tentativa", "3ª tentativa" | Converter datas |
| `acionouCentral` | "Acionou a central?" | Converter TRUE/FALSE |
| `protocolosCentral` | "Protocolos Central (incluir todos)" | Split por vírgula |
| `n2SegundoNivel` | "N2 Portabilidade?" | Converter TRUE/FALSE |
| `reclameAqui` | "Reclame Aqui" | Converter TRUE/FALSE |
| `procon` | "Procon?" | Converter TRUE/FALSE |
| `pixStatus` | "PIX liberado ou excluído?" | Converter para "Liberado"/"Excluído"/"Não aplicável" |
| `statusContratoQuitado` | "Aceitou liquidação Antecipada?" = TRUE | |
| `statusContratoAberto` | "Aceitou liquidação Antecipada?" = FALSE | |
| `enviarParaCobranca` | "Enviar para cobrança?" | Converter Sim/Não/TRUE/FALSE |
| `createdAt` | "Data entrada" ou "Data de entrada Atendimento" | |
| `updatedAt` | "Finalizado em " | |
| `Finalizado.Resolvido` | Calculado conforme lógica | |
| `Finalizado.dataResolucao` | "Finalizado em " (se resolvido) | |

### Campos Específicos BACEN

| Campo MongoDB | Campo CSV | Observações |
|---------------|-----------|-------------|
| `dataEntrada` | "Data entrada" | |
| `origem` | "Origem" | |
| `produto` | "Produto" | Pode não existir em 2025 |
| `prazoBacen` | "Prazo Bacen" | |
| `motivoReduzido` | "Motivo reduzido" | |
| `motivoDetalhado` | "Motivo Reclamação" | |

### Campos Específicos OUVIDORIA

| Campo MongoDB | Campo CSV | Observações |
|---------------|-----------|-------------|
| `dataEntradaAtendimento` | "Data de entrada Atendimento" | |
| `dataEntradaN2` | "Data Entrada N2" ou segunda coluna | |
| `motivoReduzido` | "Motivo reduzido" | |
| `origem` | "Origem" | |
| `produto` | - | Vazio (não existe no CSV) |
| `prazoOuvidoria` | - | Null (não existe no CSV) |
| `motivoDetalhado` | "Motivo Reclamação" | |

## 🔄 Campos Descartados

Os seguintes campos do CSV são descartados (não existem no schema):

- "Mês"
- "Casos críticos"
- "Valor negociado"
- "Bacen?" (campo booleano redundante)
- "N2 conseguiu contato com cliente?" (apenas Ouvidoria)

## ✅ Validações

- CPF deve ter 11 dígitos (após limpeza)
- Nome não pode estar vazio
- Datas devem ser válidas
- Campos obrigatórios do schema devem estar presentes

## 📇 Índices Criados

Após inserção, os seguintes índices são criados automaticamente:

- `cpf: 1` - Buscas por CPF
- `telefones.lista: 1` - Buscas em telefones
- `email: 1` (sparse) - Buscas por email
- `createdAt: -1` - Ordenação por data de criação

## 📊 Relatórios

Cada script gera um relatório final com:

- Total de registros processados
- Total de registros válidos
- Total de registros inseridos
- Total de erros
- Estatísticas de finalização (para scripts de 2026)

## 🐛 Troubleshooting

### Erro de Conexão MongoDB
- Verifique se `MONGO_ENV` está configurada no `.env`
- Verifique sua conexão com a internet
- Verifique se o MongoDB Atlas permite conexões do seu IP

### Arquivo CSV não encontrado
- Verifique se os arquivos CSV estão na pasta `update bacen/`
- Verifique os nomes dos arquivos (case-sensitive)

### Erros de Validação
- Registros sem nome ou CPF serão ignorados (não inseridos)
- Verifique os logs para ver quais registros foram ignorados

### Campos não mapeados
- Verifique se o campo existe no schema `LISTA_SCHEMAS.rb`
- Campos não mapeados são descartados automaticamente

## 📝 Versão

**VERSION:** v1.0.0  
**DATE:** 2026-02-24  
**AUTHOR:** VeloHub Development Team
