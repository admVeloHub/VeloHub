# 🔧 Configurar Variáveis de Ambiente no Cloud Run

## ⚠️ Variáveis Faltantes

As seguintes variáveis de ambiente **NÃO estão configuradas** no Cloud Run e precisam ser adicionadas:

1. **GCS_BUCKET_NAME2** = `mediabank_velohub`
2. **GCP_PROJECT_ID** = `velohub-471220`

## 📋 Instruções para Configurar via Console do GCP

### Passo 1: Acessar o Cloud Run
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Navegue até **Cloud Run** → **Services**
3. Selecione o serviço: **velohub-278491073220**

### Passo 2: Editar Variáveis de Ambiente
1. Clique em **EDIT & DEPLOY NEW REVISION**
2. Role até a seção **Variables & Secrets**
3. Clique em **ADD VARIABLE** para cada variável:

   **Variável 1:**
   - **Name**: `GCS_BUCKET_NAME2`
   - **Value**: `mediabank_velohub`

   **Variável 2:**
   - **Name**: `GCP_PROJECT_ID`
   - **Value**: `velohub-471220`

### Passo 3: Fazer Deploy
1. Clique em **DEPLOY** para aplicar as mudanças
2. Aguarde o deploy completar

## 🔧 Alternativa: Via gcloud CLI

Se você tiver permissões adequadas, execute:

```bash
gcloud run services update velohub-278491073220 \
  --region us-east1 \
  --update-env-vars GCS_BUCKET_NAME2=mediabank_velohub,GCP_PROJECT_ID=velohub-471220 \
  --project velohub-278491073220
```

## ✅ Verificação

Após configurar, teste o endpoint:
```
https://velohub-278491073220.us-east1.run.app/api/pilulas/list
```

Deve retornar:
```json
{
  "success": true,
  "images": ["1.png", "2.png", ...]
}
```

## 📝 Nota

O arquivo `cloudbuild.yaml` foi atualizado para incluir essas variáveis automaticamente em futuros deploys. No entanto, para o deploy atual, é necessário configurar manualmente.
