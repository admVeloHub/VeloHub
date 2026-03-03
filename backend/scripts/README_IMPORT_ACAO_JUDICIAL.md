# Script de Importação - Ação Judicial

## Descrição
Script Python para importar dados de Ação Judicial do Excel para a collection `hub_ouvidoria.reclamacoes_judicial` no MongoDB.

## Versão
v1.0.0 | 2026-03-02

## Pré-requisitos
- Python 3.x instalado
- Bibliotecas Python:
  ```bash
  pip install pandas openpyxl pymongo python-dotenv
  ```
- Arquivo `.env` na raiz do projeto com `MONGO_ENV` configurada

## Mapeamento de Colunas

| Coluna | Campo MongoDB | Tipo | Observações |
|--------|--------------|------|-------------|
| A | `nroProcesso` | String | Número do Processo (obrigatório) |
| B | `empresaAcionada` | String | Empresa Acionada (Velotax ou Celcoin) |
| C | `cpf` | String | CPF (11 dígitos, apenas números, obrigatório) |
| D | `nome` | String | Nome do cliente |
| E | `dataEntrada` | Date | Data de Entrada |
| F | `produto` | String | Produto relacionado |
| G | `motivoReduzido` | [String] | Array de motivos (separados por vírgula ou ponto-e-vírgula) |
| H | `audiencia` | Boolean | Processado conforme regras abaixo |
| H | `dataAudiencia` | Date | Extraída da coluna H quando aplicável |

## Regras de Processamento

### Coluna G - Motivos (múltipla escolha)
- Aceita múltiplos motivos separados por vírgula (`,`) ou ponto-e-vírgula (`;`)
- Motivos válidos:
  - Juros
  - Chave Pix
  - Restituição BB
  - Relatório
  - Repetição Indébito
  - Superendividamento
  - Desconhece Contratação
- Motivos não reconhecidos são ignorados

### Coluna H - Audiência
Processamento da coluna H:

1. **Se contém "Sim"** (case-insensitive):
   - `audiencia = true`
   - Se houver data no texto, extrai e preenche `dataAudiencia`

2. **Se contém apenas uma data** (sem "Sim"):
   - `audiencia = true`
   - `dataAudiencia` preenchida com a data encontrada

3. **Se contém "Sim" seguido de data**:
   - `audiencia = true`
   - `dataAudiencia` preenchida com a data encontrada

4. **Se contém "Não" ou "Extinto"** (case-insensitive):
   - `audiencia = false`
   - `dataAudiencia = null`

5. **Qualquer data anterior a janeiro de 2026**:
   - Será ajustada para o ano de 2025

### Validações
- CPF deve ter 11 dígitos (zeros à esquerda são preenchidos automaticamente)
- Número do Processo é obrigatório
- Linhas com CPF inválido ou sem número de processo são ignoradas

## Uso

### Modo Dry-Run (apenas validação)
```bash
cd "dev VeloHub/backend/scripts"
python importar_acao_judicial_excel.py --dry-run
```

### Importação Real
```bash
cd "dev VeloHub/backend/scripts"
python importar_acao_judicial_excel.py
```

### Arquivo Customizado
```bash
python importar_acao_judicial_excel.py --arquivo "caminho/para/arquivo.xlsx"
```

### Dry-Run com Arquivo Customizado
```bash
python importar_acao_judicial_excel.py --dry-run --arquivo "caminho/para/arquivo.xlsx"
```

## Saída do Script

### Durante Execução
- Lista de colunas encontradas na planilha
- Linhas ignoradas (com motivo)
- Progresso de inserção (em batches de 1000)

### Resumo Final
- Total de registros processados
- Registros válidos
- Registros inseridos
- Registros ignorados
- Erros encontrados

### Modo Dry-Run
- Mostra exemplo do primeiro documento que seria inserido
- Mostra exemplos de processamento da coluna H
- **Nenhum dado é inserido no MongoDB**

## Índices Criados

O script cria os seguintes índices na collection (se não existirem):
- `cpf` (índice simples)
- `nroProcesso` (índice para buscas por número do processo)
- `telefones.lista` (índice para buscas em telefones)
- `email` (índice esparso)
- `createdAt` (índice para ordenação)

## Estrutura do Documento MongoDB

```javascript
{
  _id: ObjectId,
  nome: String,
  cpf: String,                    // 11 dígitos
  telefones: { lista: [] },
  email: String,
  observacoes: String,
  responsavel: String,            // "Sistema" por padrão
  
  nroProcesso: String,
  empresaAcionada: String,        // "Velotax" ou "Celcoin"
  dataEntrada: Date,
  produto: String,
  motivoReduzido: [String],       // Array de motivos
  motivoDetalhado: String,
  
  audiencia: Boolean,
  dataAudiencia: Date,            // null se audiencia = false
  situacaoAudiencia: String,
  
  subsidios: String,
  outrosProtocolos: String,
  anexos: [],
  
  // Campos de tratativa (vazios para Ação Judicial)
  acionouCentral: false,
  protocolosCentral: [],
  n2SegundoNivel: false,
  protocolosN2: [],
  reclameAqui: false,
  protocolosReclameAqui: [],
  procon: false,
  protocolosProcon: [],
  
  Finalizado: {
    Resolvido: null,
    dataResolucao: null
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

## Exemplos

### Exemplo 1: Coluna H com "Sim" e data
**Entrada:** `Sim 15/03/2025`  
**Resultado:**
```javascript
{
  audiencia: true,
  dataAudiencia: ISODate("2025-03-15T00:00:00Z")
}
```

### Exemplo 2: Coluna H apenas com data
**Entrada:** `20/12/2024`  
**Resultado:**
```javascript
{
  audiencia: true,
  dataAudiencia: ISODate("2025-12-20T00:00:00Z")  // Ajustado para 2025
}
```

### Exemplo 3: Coluna H com "Não"
**Entrada:** `Não`  
**Resultado:**
```javascript
{
  audiencia: false,
  dataAudiencia: null
}
```

### Exemplo 4: Coluna G com múltiplos motivos
**Entrada:** `Juros, Chave Pix, Restituição BB`  
**Resultado:**
```javascript
{
  motivoReduzido: ["Juros", "Chave Pix", "Restituição BB"]
}
```

## Troubleshooting

### Erro: "MONGO_ENV não configurada"
- Verifique se o arquivo `.env` existe na raiz do projeto
- Verifique se contém a variável `MONGO_ENV` com a string de conexão MongoDB

### Erro: "Planilha não encontrada"
- Verifique o caminho padrão: `dados procon/Copy of Planilha RA e Procon acompanhamento 2026.xlsx`
- Use `--arquivo` para especificar outro caminho

### Muitas linhas ignoradas
- Verifique se as colunas estão nomeadas corretamente (A, B, C, D, E, F, G, H)
- Verifique se CPF e Número do Processo estão preenchidos
- Execute em modo dry-run para ver os motivos de cada linha ignorada
