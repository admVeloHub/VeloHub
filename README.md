# VeloHub - Aplicação Next.js no Vercel

Este projeto é uma aplicação Next.js moderna que serve o VeloHub, uma plataforma de conhecimento da Velotax, hospedada no Vercel com MongoDB.

## 🚀 Tecnologias Utilizadas

### Frontend
- ✅ **Next.js 14** - Framework React moderno
- ✅ **TypeScript** - Tipagem estática
- ✅ **Vercel** - Hospedagem com backend
- ✅ **Deploy automático** - Integração com GitHub

### Backend
- ✅ **MongoDB Atlas** - Banco de dados na nuvem
- ✅ **API Routes** - Endpoints do Next.js
- ✅ **Serverless Functions** - Vercel Functions

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
MONGODB_URI=mongodb+srv://seu_usuario:sua_senha@seu_cluster.mongodb.net/velohub?retryWrites=true&w=majority
```

### 3. Instalar Dependências

```bash
npm install
```

### 4. Testar Localmente

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

### 4. Deploy Automático

Conecte seu repositório GitHub ao Vercel para deploy automático a cada push.

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
├── package.json           # Dependências
├── next.config.js         # Configuração Next.js
├── tsconfig.json          # Configuração TypeScript
└── README.md              # Documentação
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
- ✅ Carregamento rápido via CDN do Vercel
- ✅ Serverless Functions otimizadas
- ✅ Cache inteligente

### Escalabilidade
- ✅ Banco de dados escalável (MongoDB Atlas)
- ✅ Deploy automático
- ✅ Serverless por natureza

### Manutenibilidade
- ✅ Código TypeScript
- ✅ Estrutura modular
- ✅ Versionamento Git

### Funcionalidades
- ✅ Interface moderna
- ✅ Dados em tempo real
- ✅ API robusta
- ✅ Rotas de API funcionais

## 🐛 Troubleshooting

### Erro de Conexão MongoDB
- Verifique se `MONGODB_URI` está configurado no Vercel
- Confirme se o IP está liberado no MongoDB Atlas
- Teste a conexão localmente primeiro

### Erro no Deploy
- Verifique se todas as variáveis de ambiente estão configuradas no Vercel
- Confirme se o build está passando localmente
- Verifique os logs do Vercel

### Dados Não Aparecem
- Verifique se as coleções foram criadas no MongoDB
- Confirme se a API está retornando dados
- Teste a conexão com o banco de dados

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do Vercel
2. Teste localmente primeiro
3. Confirme a configuração do MongoDB
4. Verifique se as variáveis de ambiente estão corretas

## 🔄 Atualizações Futuras

Para adicionar novos dados:
1. Insira diretamente no MongoDB Atlas
2. Ou crie endpoints de API para gerenciar conteúdo
3. Faça push para o GitHub
4. O Vercel fará deploy automático

---

**VeloHub** - Aplicação Next.js moderna hospedada no Vercel! 🎉
