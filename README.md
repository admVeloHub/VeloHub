# VeloHub - Migração para Vercel + MongoDB

Este projeto migra o VeloHub de uma aplicação estática hospedada no Google Sites com dados do Google Apps Script para uma aplicação Next.js hospedada no Vercel com MongoDB.

## 🚀 Mudanças Principais

### Antes (Google Sites + Apps Script)
- ✅ Hospedagem estática no Google Sites
- ✅ Dados via API do Google Apps Script
- ✅ Aplicação HTML/CSS/JavaScript pura

### Depois (Vercel + MongoDB)
- ✅ Hospedagem no Vercel (Next.js)
- ✅ Banco de dados MongoDB
- ✅ API Routes do Next.js
- ✅ Melhor performance e escalabilidade

## 📋 Pré-requisitos

1. **Conta no Vercel**: [vercel.com](https://vercel.com)
2. **Conta no MongoDB Atlas**: [mongodb.com/atlas](https://mongodb.com/atlas)
3. **Node.js**: Versão 18 ou superior
4. **Git**: Para versionamento

## 🛠️ Configuração

### 1. Configurar MongoDB Atlas

1. Crie uma conta no MongoDB Atlas
2. Crie um novo cluster (gratuito)
3. Configure acesso de rede (0.0.0.0/0 para desenvolvimento)
4. Crie um usuário de banco de dados
5. Obtenha a string de conexão

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
MONGODB_URI=mongodb+srv://REDACTED
```

### 3. Instalar Dependências

```bash
npm install
```

### 4. Migrar Dados

Execute o script de migração para transferir os dados do Google Apps Script para o MongoDB:

```bash
node scripts/migrate-data.js
```

### 5. Testar Localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 🚀 Deploy no Vercel

### 1. Conectar ao Vercel

```bash
npm install -g vercel
vercel login
```

### 2. Configurar Variáveis de Ambiente no Vercel

```bash
vercel env add MONGODB_URI
# Cole sua string de conexão do MongoDB
```

### 3. Fazer Deploy

```bash
vercel --prod
```

## 📁 Estrutura do Projeto

```
velohub/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   └── data/          # Endpoint principal (/api/data)
│   ├── globals.css        # Estilos globais
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página inicial
├── lib/                   # Utilitários
│   ├── mongodb.ts         # Configuração MongoDB
│   └── models.ts          # Tipos TypeScript
├── scripts/               # Scripts de migração
│   └── migrate-data.js    # Migração de dados
├── public/                # Arquivos estáticos
│   └── VELOHUB 2.html     # HTML original
├── package.json           # Dependências
├── next.config.js         # Configuração Next.js
├── tsconfig.json          # Configuração TypeScript
├── vercel.json            # Configuração Vercel
└── README.md              # Documentação
```

## 🔄 Migração de Dados

O script `scripts/migrate-data.js` faz a migração automática:

1. **Artigos**: Migra todos os artigos organizados por categoria
2. **Notícias**: Migra as VeloNews com status crítico
3. **FAQs**: Migra as perguntas frequentes do chatbot

### Executar Migração

```bash
# Certifique-se de que MONGODB_URI está configurado
node scripts/migrate-data.js
```

## 🗄️ Estrutura do MongoDB

### Coleções

1. **articles**: Artigos organizados por categoria
   ```json
   {
     "title": "Título do Artigo",
     "content": "Conteúdo HTML",
     "category": "categoria",
     "createdAt": "2024-01-01T00:00:00.000Z",
     "updatedAt": "2024-01-01T00:00:00.000Z"
   }
   ```

2. **velonews**: Notícias e avisos
   ```json
   {
     "title": "Título da Notícia",
     "content": "Conteúdo da notícia",
     "is_critical": "Y",
     "createdAt": "2024-01-01T00:00:00.000Z",
     "updatedAt": "2024-01-01T00:00:00.000Z"
   }
   ```

3. **chatbotFaq**: Perguntas frequentes
   ```json
   {
     "topic": "Pergunta",
     "context": "Resposta",
     "keywords": "palavra1,palavra2",
     "createdAt": "2024-01-01T00:00:00.000Z",
     "updatedAt": "2024-01-01T00:00:00.000Z"
   }
   ```

## 🔧 API Endpoints

### GET /api/data
Retorna todos os dados necessários para a aplicação:

```json
{
  "artigos": {
    "categoria1": {
      "key": "categoria1",
      "title": "Categoria 1",
      "articles": [...]
    }
  },
  "velonews": [...],
  "chatbotFaq": [...]
}
```

## 🎯 Benefícios da Migração

### Performance
- ✅ Carregamento mais rápido
- ✅ Melhor cache
- ✅ CDN global do Vercel

### Escalabilidade
- ✅ Banco de dados escalável
- ✅ API serverless
- ✅ Deploy automático

### Manutenibilidade
- ✅ Código TypeScript
- ✅ Estrutura modular
- ✅ Versionamento Git

### Funcionalidades
- ✅ Mesma interface
- ✅ Mesmos dados
- ✅ Mesma funcionalidade

## 🐛 Troubleshooting

### Erro de Conexão MongoDB
- Verifique se `MONGODB_URI` está configurado
- Confirme se o IP está liberado no MongoDB Atlas
- Teste a conexão localmente primeiro

### Erro no Deploy
- Verifique se todas as variáveis de ambiente estão configuradas no Vercel
- Confirme se o build está passando localmente
- Verifique os logs do Vercel

### Dados Não Aparecem
- Execute o script de migração
- Verifique se as coleções foram criadas no MongoDB
- Confirme se a API está retornando dados

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do Vercel
2. Teste localmente primeiro
3. Confirme a configuração do MongoDB
4. Execute o script de migração novamente

## 🔄 Atualizações Futuras

Para adicionar novos dados:
1. Atualize o Google Apps Script
2. Execute o script de migração
3. O Vercel fará deploy automático

---

**VeloHub v2.0** - Migrado com sucesso para Vercel + MongoDB! 🎉
