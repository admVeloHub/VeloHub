# VeloHub - Aplicação Next.js no GitHub Pages

Este projeto é uma aplicação Next.js moderna que serve o VeloHub, uma plataforma de conhecimento da Velotax, hospedada no GitHub Pages com MongoDB.

## 🚀 Tecnologias Utilizadas

### Frontend
- ✅ **Next.js 14** - Framework React moderno
- ✅ **TypeScript** - Tipagem estática
- ✅ **GitHub Pages** - Hospedagem estática
- ✅ **GitHub Actions** - Deploy automático

### Backend
- ✅ **MongoDB Atlas** - Banco de dados na nuvem
- ✅ **API Routes** - Endpoints do Next.js
- ✅ **Mongoose** - ODM para MongoDB

## 📋 Pré-requisitos

1. **Conta no GitHub**: [github.com](https://github.com)
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

## 🚀 Deploy no GitHub Pages

### 1. Configurar Secrets no GitHub

1. Vá para: https://github.com/admVeloHub/VeloHub/settings/secrets/actions
2. Clique em "New repository secret"
3. Adicione: `MONGODB_URI` com sua string de conexão

### 2. Configurar GitHub Pages

1. Vá para: https://github.com/admVeloHub/VeloHub/settings/pages
2. Em "Source", selecione: **"GitHub Actions"**
3. O deploy será automático a cada push

### 3. Deploy Automático

O GitHub Actions fará deploy automático a cada push para o branch `main`.

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
├── .github/               # GitHub Actions
│   └── workflows/         # Workflows de deploy
├── package.json           # Dependências
├── next.config.js         # Configuração Next.js
├── tsconfig.json          # Configuração TypeScript
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

## 🎯 Benefícios da Arquitetura

### Performance
- ✅ Carregamento rápido via CDN do GitHub Pages
- ✅ Build estático otimizado
- ✅ Cache eficiente

### Escalabilidade
- ✅ Banco de dados escalável (MongoDB Atlas)
- ✅ Deploy automático
- ✅ Sem custos de servidor

### Manutenibilidade
- ✅ Código TypeScript
- ✅ Estrutura modular
- ✅ Versionamento Git

### Funcionalidades
- ✅ Interface moderna
- ✅ Dados em tempo real
- ✅ API robusta

## 🐛 Troubleshooting

### Erro de Conexão MongoDB
- Verifique se `MONGODB_URI` está configurado
- Confirme se o IP está liberado no MongoDB Atlas
- Teste a conexão localmente primeiro

### Erro no Deploy
- Verifique se todas as variáveis de ambiente estão configuradas no GitHub
- Confirme se o build está passando localmente
- Verifique os logs do GitHub Actions

### Dados Não Aparecem
- Execute o script de migração
- Verifique se as coleções foram criadas no MongoDB
- Confirme se a API está retornando dados

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do GitHub Actions
2. Teste localmente primeiro
3. Confirme a configuração do MongoDB
4. Execute o script de migração novamente

## 🔄 Atualizações Futuras

Para adicionar novos dados:
1. Atualize o Google Apps Script
2. Execute o script de migração
3. Faça push para o GitHub
4. O deploy será automático

---

**VeloHub** - Aplicação Next.js moderna hospedada no GitHub Pages! 🎉
