# 🔑 Configuração das Chaves de API - VeloHub V3

<!-- VERSION: v1.0.0 | DATE: 2025-01-27 | AUTHOR: Lucas Gravina - VeloHub Development Team -->

## 📋 **STATUS ATUAL**

✅ **Arquivo `.env` criado** com template completo  
✅ **Hardcode removido** do `config.js`  
✅ **Configuração baseada** em variáveis de ambiente  
✅ **Sistema de validação** implementado  

---

## 🚀 **INSTRUÇÕES DE CONFIGURAÇÃO**

### **1. APIs de Inteligência Artificial**

#### **🤖 OpenAI API Key (Fallback)**
```bash
# Obter em: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-REDACTED
```

#### **🧠 Google Gemini API Key (Primária)**
```bash
# Obter em: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=AIzaREDACTED_REDACTED_REDACTED_REDACTED_xxxxxx
```

### **2. Banco de Dados**

#### **🍃 MongoDB Connection String**
```bash
# Formato: mongodb+srv://REDACTED
MONGODB_URI=mongodb+srv://REDACTED
```

### **3. Google Services**

#### **🔐 Google OAuth (SSO)**
```bash
# Obter em: https://console.developers.google.com/
GOOGLE_CLIENT_ID=278491073220-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
```

#### **📊 Google Sheets API Credentials**
```bash
# Obter em: https://console.developers.google.com/
# Formato: JSON completo das service account credentials
GOOGLE_CREDENTIALS={"type":"service_account","project_id":"seu-projeto","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----
REDACTED
-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

---

## 🔧 **COMO OBTER AS CREDENCIAIS**

### **OpenAI API Key**
1. Acesse: https://platform.openai.com/api-keys
2. Faça login na sua conta OpenAI
3. Clique em "Create new secret key"
4. Copie a chave gerada (começa com `sk-proj-`)

### **Google Gemini API Key**
1. Acesse: https://makersuite.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada (começa com `AIzaSy`)

### **MongoDB Connection String**
1. Acesse: https://cloud.mongodb.com/
2. Vá em "Database" → "Connect"
3. Escolha "Connect your application"
4. Copie a connection string
5. Substitua `<password>` pela senha do usuário

### **Google OAuth Credentials**
1. Acesse: https://console.developers.google.com/
2. Crie um novo projeto ou selecione existente
3. Ative a "Google+ API"
4. Vá em "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure o tipo de aplicação como "Web application"
6. Adicione as URLs autorizadas:
   - `http://localhost:8080`
   - `https://app.velohub.velotax.com.br`
   - `https://velohub-v3-278491073220.us-east1.run.app`

### **Google Sheets Service Account**
1. Acesse: https://console.developers.google.com/
2. Vá em "Credentials" → "Create Credentials" → "Service Account"
3. Dê um nome para a service account
4. Clique em "Create and Continue"
5. Baixe o arquivo JSON das credentials
6. Converta o JSON para string única (remova quebras de linha)
7. Compartilhe a planilha com o email da service account

---

## ⚠️ **IMPORTANTE - SEGURANÇA**

### **✅ FAÇA:**
- Mantenha o arquivo `.env` **NUNCA** no Git
- Use chaves diferentes para desenvolvimento e produção
- Rotacione as chaves periodicamente
- Monitore o uso das APIs

### **❌ NÃO FAÇA:**
- Commite o arquivo `.env` no repositório
- Compartilhe as chaves por email ou chat
- Use chaves de produção em desenvolvimento
- Deixe as chaves expostas em logs

---

## 🧪 **TESTE DE CONFIGURAÇÃO**

Após configurar todas as chaves, teste a configuração:

```bash
# No terminal, na pasta do projeto:
node -e "
const config = require('./backend/config');
const validation = config.validateConfig();
console.log('🔍 Validação da Configuração:');
console.log('✅ Configuração válida:', validation.isValid);
console.log('❌ Faltando:', validation.missing);
console.log('✅ Disponível:', validation.available);
console.log('🤖 IA configurada:', validation.hasAI);
console.log('📊 Sheets configurado:', validation.hasSheets);
"
```

---

## 📊 **ESTRUTURA DAS GOOGLE SHEETS CREDENTIALS**

O campo `GOOGLE_CREDENTIALS` deve conter um JSON válido com esta estrutura:

```json
{
  "type": "service_account",
  "project_id": "seu-projeto-id",
  "private_key_id": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----
REDACTED
-----END PRIVATE KEY-----\n",
  "client_email": "sua-service-account@seu-projeto.iam.gserviceaccount.com",
  "client_id": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/sua-service-account%40seu-projeto.iam.gserviceaccount.com"
}
```

**⚠️ IMPORTANTE:** O JSON deve estar em uma única linha, sem quebras de linha, dentro do arquivo `.env`.

---

## 🎯 **PRÓXIMOS PASSOS**

1. **Configure todas as chaves** no arquivo `.env`
2. **Teste a configuração** com o comando acima
3. **Inicie o servidor** para verificar se tudo funciona
4. **Teste o chatbot** com uma pergunta simples

---

## 🆘 **SUPORTE**

Se encontrar problemas:

1. **Verifique os logs** do servidor
2. **Confirme as chaves** estão corretas
3. **Teste as APIs** individualmente
4. **Verifique as permissões** das service accounts

---

*Configuração criada em: 2025-01-27*  
*Versão: v1.0.0*
