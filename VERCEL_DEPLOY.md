# 🚀 Deploy do VeloHub no Vercel

## 📋 Configurações Necessárias

### 1. Variáveis de Ambiente no Vercel
No painel do Vercel (https://vercel.com/dashboard), vá em:
- **Settings** → **Environment Variables**
- Adicione: `MONGODB_URI` = sua string de conexão do MongoDB

### 2. Configurações do Projeto
✅ `vercel.json` - Criado com configurações otimizadas
✅ `next.config.js` - Configurado para Vercel
✅ `package.json` - Scripts corretos

### 3. MongoDB Atlas
- Certifique-se de que o IP do Vercel está liberado
- Ou configure para aceitar conexões de qualquer lugar (0.0.0.0/0)

## 🔧 Troubleshooting

### Se o deploy falhar:

1. **Verifique os logs no Vercel:**
   - Vá para o projeto no dashboard
   - Clique em "Functions" para ver logs das APIs

2. **Teste localmente:**
   ```bash
   npm run build
   npm start
   ```

3. **Verifique variáveis de ambiente:**
   - Confirme se `MONGODB_URI` está configurada
   - Teste a conexão localmente

4. **Problemas comuns:**
   - Timeout na conexão MongoDB
   - Variáveis de ambiente não configuradas
   - Build falhando por dependências

## 📊 Status Atual
- ✅ Código otimizado para Vercel
- ✅ Configurações de build ajustadas
- ✅ API routes configuradas
- 🔄 Aguardando deploy

## 🔗 URLs Importantes
- **Vercel Dashboard:** https://vercel.com/dashboard
- **MongoDB Atlas:** https://cloud.mongodb.com
- **API Endpoint:** `/api/data`

## 🚨 Comandos de Debug
```bash
# Teste local
npm run dev

# Build de produção
npm run build

# Teste da API
curl http://localhost:3000/api/data
```
