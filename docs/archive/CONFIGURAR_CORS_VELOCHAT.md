# Configuração de CORS para Bucket GCS - velochat_anexos

## Objetivo
Configurar CORS no bucket `velochat_anexos` para permitir uploads diretos do frontend usando signed URLs.

## ⚠️ Problema
O bucket `velochat_anexos` precisa ter CORS configurado para aceitar requisições PUT do frontend (`localhost:8080` em desenvolvimento e domínios de produção).

## Método 1: Via gsutil (Recomendado - Mais Rápido)

### Pré-requisitos:
- Ter `gsutil` instalado e configurado
- Ter permissões de administrador no projeto GCP

### Comando:

```bash
gsutil cors set gcs-cors-config-velochat.json gs://velochat_anexos
```

### Verificar configuração:

```bash
gsutil cors get gs://velochat_anexos
```

## Método 2: Via Google Cloud Console

### Passo a Passo:

1. **Acesse o Google Cloud Console**
   - URL: https://console.cloud.google.com/
   - Selecione o projeto: `velohub-471220`

2. **Navegue até Cloud Storage**
   - Menu lateral → Storage → Browser
   - Ou acesse diretamente: https://console.cloud.google.com/storage/browser

3. **Selecione o bucket `velochat_anexos`**
   - Clique no nome do bucket na lista

4. **Acesse a aba "Configuration" (Configuração)**
   - No menu superior do bucket, clique em "Configuration"

5. **Role até a seção "Cross-origin resource sharing (CORS)"**
   - Clique em "Edit CORS configuration"

6. **Cole a seguinte configuração JSON:**
```json
[
  {
    "origin": [
      "http://localhost:8080",
      "http://localhost:3000",
      "https://app.velohub.velotax.com.br",
      "https://velohub-278491073220.us-east1.run.app"
    ],
    "method": ["GET", "HEAD", "PUT", "POST", "OPTIONS"],
    "responseHeader": [
      "Content-Type",
      "Content-Length",
      "Content-Disposition",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Headers",
      "x-goog-resumable"
    ],
    "maxAgeSeconds": 3600
  }
]
```

7. **Salve as alterações**
   - Clique em "Save"

8. **Aguarde alguns segundos**
   - A configuração pode levar alguns segundos para ser aplicada

## Método 3: Via API REST do GCS

### Usando curl:

```bash
curl -X PATCH \
  "https://storage.googleapis.com/storage/v1/b/velochat_anexos?fields=cors" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d @gcs-cors-config-velochat.json
```

## Configuração Aplicada

A configuração permite:
- ✅ Requisições de origens específicas (localhost em dev, domínios de produção)
- ✅ Métodos GET, HEAD, PUT, POST, OPTIONS (PUT é necessário para uploads)
- ✅ Headers necessários para CORS e uploads
- ✅ Cache de 1 hora (3600 segundos)

## Validação

Após configurar, teste:

1. **Acesse o frontend** (http://localhost:8080)
2. **Abra o console do navegador** (F12)
3. **Tente fazer upload de um arquivo no VeloChat**
4. **Verifique no Network tab:**
   - Requisição PUT para `storage.googleapis.com/velochat_anexos/...` deve retornar 200
   - Não deve haver erros de CORS

## Troubleshooting

### Se ainda houver erro de CORS:

1. **Verifique se a configuração foi aplicada:**
   ```bash
   gsutil cors get gs://velochat_anexos
   ```

2. **Limpe o cache do navegador** (Ctrl+Shift+Delete)

3. **Verifique se o bucket tem permissões corretas:**
   - Cloud Console → Storage → Bucket → Permissions
   - O Service Account usado deve ter permissão de escrita

4. **Verifique os logs do backend:**
   - Confirme que a signed URL está sendo gerada corretamente
   - Verifique se há erros relacionados a CORS

### Configuração Automática (Desenvolvimento)

O backend tenta configurar CORS automaticamente em desenvolvimento, mas pode falhar se não tiver permissões administrativas. Nesse caso, use um dos métodos acima.

## Notas Importantes

- ⚠️ A configuração permite origens específicas (não `*`) por segurança
- ✅ PUT é necessário para uploads diretos do frontend
- ⏱️ Mudanças podem levar alguns segundos para serem aplicadas
- 🔄 Pode ser necessário limpar cache do navegador após configurar
- 🔐 Requer permissões de administrador no projeto GCP

