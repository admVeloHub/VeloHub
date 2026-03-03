# Script de Importação de Dados Procon

## Descrição
Script Python para importar dados da planilha Excel "Copy of Planilha RA e Procon acompanhamento 2026.xlsx" (aba "Procons") para o MongoDB na coleção `hub_ouvidoria.reclamacoes_procon`.

## Pré-requisitos

1. **Python 3.7+**
2. **Dependências Python:**
   ```bash
   pip install pandas openpyxl pymongo python-dotenv
   ```

3. **Variável de Ambiente:**
   - Configure `MONGO_ENV` com a string de conexão do MongoDB
   - O script usa `python-dotenv` para carregar variáveis de um arquivo `.env`

## Mapeamento de Colunas

| Coluna Excel | Campo MongoDB | Observações |
|-------------|---------------|-------------|
| A | codigoProcon | Código Procon (16 caracteres) |
| B | cpf | CPF (11 dígitos, apenas números) |
| C | nome | Nome do cliente |
| D | dataProcon | Data Procon (convertida para Date) |
| E | motivoReduzido | Motivo reduzido |
| F | produto | Produto relacionado |
| G | solucaoApresentada | Solução Apresentada |
| H | processoAdministrativo + outros campos | Ver regras abaixo |
| I | processoEncerrado + dataProcessoEncerrado | Se houver informação |

## Regras de Processamento - Coluna H

### Cliente Desistiu
- Se contém "Cliente desistiu" → `clienteDesistiu = true`

### Status "Não Atendido"
Se contém qualquer um dos seguintes:
- "Sim"
- "Procon marcou como 'NÃO ATENDIDA'"
- "Sim, porém encerrado"

→ `processoAdministrativo = "Sim - Status Não Atendido"`

### Status "Atendido"
Se contém qualquer um dos seguintes:
- "Encerrado"
- "Procon marcou como 'ATENDIDA'"
- "Encerrado, sem manifestação do PROCON/SP."
- "Encerrado, falta de interação do consumidor."
- "resolvido"
- "cliente marcou como resolvido"

→ `processoAdministrativo = "Não - Status Atendido"`

### Subsídios Enviados
Se contém "Subsídios enviados à":
- **Celcoin** → `processoAdministrativo = "Sim - Status Não Atendido"`, `encaminhadoJuridico = true`, `processoEncaminhadoResponsavel = "Celcoin"`
- **Dr Tadeu** ou **Tadeu** → `processoAdministrativo = "Sim - Status Não Atendido"`, `encaminhadoJuridico = true`, `processoEncaminhadoResponsavel = "Tadeu"`
- **Aline** → `processoAdministrativo = "Sim - Status Não Atendido"`, `encaminhadoJuridico = true`, `processoEncaminhadoResponsavel = "Aline"`

## Coluna I - Processo Encerrado

Se a coluna I contém informação:
- `processoEncerrado = true`
- `dataProcessoEncerrado` = data extraída (se houver)

## Execução

### 1. Modo Dry-Run (Recomendado primeiro)

Execute em modo de validação para ver o que seria importado sem fazer alterações:

```bash
cd "dev VeloHub\backend\scripts"
python importar_procon_excel.py --dry-run
```

O dry-run irá:
- Ler e processar a planilha
- Validar todos os dados
- Mostrar exemplo do primeiro documento que seria inserido
- Mostrar exemplos de diferentes tipos de processamento da coluna H
- Exibir estatísticas completas
- **NÃO inserir dados no MongoDB**

### 2. Importação Real

Após verificar o resultado do dry-run, execute a importação real:

```bash
cd "dev VeloHub\backend\scripts"
python importar_procon_excel.py
```

## Validações

O script ignora linhas que:
- Não possuem CPF válido (11 dígitos)
- Não possuem código Procon

## Índices Criados

O script cria automaticamente os seguintes índices:
- `cpf`
- `codigoProcon`
- `telefones.lista`
- `email`
- `createdAt`

## Logs

O script exibe:
- Número de linhas lidas
- Número de documentos válidos
- Número de linhas ignoradas
- Número de documentos inseridos (ou que seriam inseridos em dry-run)
- Status da criação de índices
- Exemplo de documento processado (em dry-run)
- Exemplos de diferentes tipos de processamento da coluna H (em dry-run)
