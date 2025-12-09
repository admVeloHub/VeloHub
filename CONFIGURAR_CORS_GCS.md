# Configuração de CORS para Bucket GCS - mediabank_velohub

## Objetivo
Configurar CORS no bucket `mediabank_velohub` para permitir que o navegador carregue imagens após redirecionamento do backend.

## Método 1: Via Google Cloud Console (Recomendado)

### Passo a Passo:

1. **Acesse o Google Cloud Console**
   - URL: https://console.cloud.google.com/
   - Selecione o projeto correto

2. **Navegue até Cloud Storage**
   - Menu lateral → Storage → Browser
   - Ou acesse diretamente: https://console.cloud.google.com/storage/browser

3. **Selecione o bucket `mediabank_velohub`**
   - Clique no nome do bucket na lista

4. **Acesse a aba "Configuration" (Configuração)**
   - No menu superior do bucket, clique em "Configuration"

5. **Role até a seção "Cross-origin resource sharing (CORS)"**
   - Clique em "Edit CORS configuration"

6. **Cole a seguinte configuração JSON:**
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "responseHeader": [
      "Content-Type",
      "Content-Length",
      "Content-Disposition",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Headers"
    ],
    "maxAgeSeconds": 3600
  }
]
```

7. **Salve as alterações**
   - Clique em "Save"

8. **Aguarde alguns segundos**
   - A configuração pode levar alguns segundos para ser aplicada

## Método 2: Via gsutil (Linha de Comando)

### Pré-requisitos:
- Ter `gsutil` instalado e configurado
- Ter permissões de administrador no projeto GCP

### Comando:

```bash
gsutil cors set gcs-cors-config.json gs://mediabank_velohub
```

### Verificar configuração:

```bash
gsutil cors get gs://mediabank_velohub
```

## Método 3: Via API REST do GCS

### Usando curl:

```bash
curl -X PATCH \
  "https://storage.googleapis.com/storage/v1/b/mediabank_velohub?fields=cors" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d @gcs-cors-config.json
```

## Configuração Aplicada

A configuração permite:
- ✅ Requisições de qualquer origem (`origin: ["*"]`)
- ✅ Métodos GET e HEAD (suficiente para carregar imagens)
- ✅ Headers necessários para CORS
- ✅ Cache de 1 hora (3600 segundos)

## Validação

Após configurar, teste:

1. **Acesse o frontend** (http://localhost:8080)
2. **Abra o console do navegador** (F12)
3. **Tente carregar uma imagem**
4. **Verifique no Network tab:**
   - Requisição para `/api/images/...` deve retornar 302
   - Requisição para `storage.googleapis.com/...` deve retornar 200
   - Não deve haver erros de CORS

## Troubleshooting

### Se ainda houver erro de CORS:

1. **Verifique se a configuração foi aplicada:**
   ```bash
   gsutil cors get gs://mediabank_velohub
   ```

2. **Limpe o cache do navegador** (Ctrl+Shift+Delete)

3. **Verifique se o bucket tem permissões públicas:**
   - Cloud Console → Storage → Bucket → Permissions
   - Deve ter "allUsers" com role "Storage Object Viewer"

4. **Verifique os logs do backend:**
   - Confirme que o redirecionamento está funcionando
   - Verifique a URL final sendo gerada

### Se precisar de configuração mais restritiva:

Para produção, você pode restringir as origens:

```json
[
  {
    "origin": [
      "https://app.velohub.velotax.com.br",
      "https://velohub-278491073220.us-east1.run.app",
      "http://localhost:8080",
      "http://localhost:3000"
    ],
    "method": ["GET", "HEAD"],
    "responseHeader": [
      "Content-Type",
      "Content-Length",
      "Content-Disposition"
    ],
    "maxAgeSeconds": 3600
  }
]
```

## Notas Importantes

- ⚠️ A configuração com `origin: ["*"]` permite acesso de qualquer domínio
- ✅ Para produção, considere restringir às origens específicas
- ⏱️ Mudanças podem levar alguns segundos para serem aplicadas
- 🔄 Pode ser necessário limpar cache do navegador após configurar

