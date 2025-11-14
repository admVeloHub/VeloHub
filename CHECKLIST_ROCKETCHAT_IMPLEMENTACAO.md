# 📋 CHECKLIST DE IMPLEMENTAÇÃO - ROCKET.CHAT INTEGRADO VELOHUB GCP
<!-- VERSION: v2.0.0 | DATE: 2025-01-27 | AUTHOR: VeloHub Development Team -->

## 🎯 **OBJETIVO**
Implementar sistema de chat integrado diretamente no VeloHub deployado no GCP, com comunicação segura e privada para a equipe VeloTax, mantendo SSO unificado.

---

## ⚠️ **REGRAS OBRIGATÓRIAS**
- **CONFIDENCIALIDADE TOTAL**: Dados de chat isolados e criptografados
- **INTEGRAÇÃO DIRETA**: Rocket.Chat integrado no VeloHub existente
- **SSO OBRIGATÓRIO**: Apenas usuários @velotax.com.br
- **DEPLOY GCP**: Utilizar infraestrutura GCP existente
- **APROVAÇÃO NECESSÁRIA**: Cada fase deve ser aprovada antes de prosseguir
- **VERSIONAMENTO**: Incrementar versão de cada arquivo modificado

---

## 📅 **CRONOGRAMA GERAL**
- **Semana 1**: Configuração GCP e Integração Rocket.Chat
- **Semana 2**: Deploy Integrado e Testes
- **Semana 3**: Segurança e Monitoramento
- **Semana 4**: Otimização e Documentação

---

# 🏗️ **FASE 1: CONFIGURAÇÃO GCP E INTEGRAÇÃO ROCKET.CHAT (SEMANA 1)**

## ✅ **1.1 CONFIGURAÇÃO DO PROJETO GCP**

### **1.1.1 Configuração do Projeto GCP**
- [x] **Verificar projeto GCP atual**
  ```bash
  gcloud config get-value project
  gcloud projects list
  ```
  - **Verificação**: Projeto VeloHub identificado (velohub-471220)
  - **Status**: ✅ Concluído

- [x] **Configurar região e zona**
  ```bash
  gcloud config set compute/region us-east1
  gcloud config set compute/zone us-east1-b
  ```
  - **Verificação**: `gcloud config list`
  - **Status**: ✅ Concluído (us-east1 configurado)

### **1.1.2 Configuração de VPC e Segurança**
- [ ] **Criar VPC privada para chat**
  ```bash
  gcloud compute networks create velohub-chat-vpc --subnet-mode=custom
  gcloud compute networks subnets create velohub-chat-subnet \
    --network=velohub-chat-vpc \
    --range=10.0.1.0/24 \
    --region=us-east1
  ```
  - **Verificação**: `gcloud compute networks list`
  - **Status**: ✅ Concluído / ❌ Erro

### **1.1.3 Configuração do Repositório Git**
- [ ] **Criar repositório velochat**
  - **Nome**: `velochat`
  - **URL**: `https://github.com/admVeloHub/velochat`
  - **Organização**: `admVeloHub`
  - **Visibilidade**: Privado
  - **Status**: ✅ Concluído / ❌ Erro

### **1.1.4 Configuração MongoDB**
- [ ] **Configurar database e collection**
  - **Database**: `chat`
  - **Collection**: `velochat`
  - **URI**: Mesma do VeloHub atual
  - **Status**: ✅ Concluído / ❌ Erro

- [ ] **Configurar firewall rules**
  ```bash
  gcloud compute firewall-rules create velohub-chat-allow-internal \
    --network=velohub-chat-vpc \
    --allow=tcp:3000,tcp:27017 \
    --source-ranges=10.0.1.0/24
  ```
  - **Verificação**: `gcloud compute firewall-rules list`
  - **Status**: ✅ Concluído / ❌ Erro

## ✅ **1.2 INTEGRAÇÃO ROCKET.CHAT NO VELOHUB**

### **1.2.1 Criar Componente RocketChatWidget**
- [ ] **Criar arquivo do componente**
  ```bash
  touch src/components/RocketChatWidget.js
  ```
  - **Verificação**: Arquivo criado
  - **URL Backend**: `https://velochat-back-278491073220.us-east1.run.app`
  - **Status**: ✅ Concluído / ❌ Erro

- [ ] **Implementar componente básico**
  ```javascript
  // src/components/RocketChatWidget.js
  import React, { useEffect, useState } from 'react';
  
  const RocketChatWidget = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    const ROCKETCHAT_URL = 'https://velochat-back-278491073220.us-east1.run.app';
    
    useEffect(() => {
      // Configurar iframe do Rocket.Chat
      const iframe = document.createElement('iframe');
      iframe.src = `${ROCKETCHAT_URL}/channel/general`;
      iframe.style.width = '100%';
      iframe.style.height = 'calc(100vh - 200px)';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '8px';
      
      const container = document.getElementById('rocketchat-container');
      if (container) {
        container.appendChild(iframe);
        setIsLoaded(true);
      }
    }, []);
    
    return (
      <div id="rocketchat-widget">
        {!isLoaded && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Carregando chat...</span>
          </div>
        )}
      </div>
    );
  };
  
  export default RocketChatWidget;
  ```
  - **Verificação**: Componente funcional
  - **Status**: ✅ Concluído / ❌ Erro

### **1.2.2 Configuração SSL Interno**
- [ ] **Gerar certificados SSL internos**
  ```bash
  mkdir -p rocketchat-compose/nginx/ssl
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout rocketchat-compose/nginx/ssl/velohub.key \
    -out rocketchat-compose/nginx/ssl/velohub.crt \
    -subj "/C=BR/ST=SP/L=SaoPaulo/O=VeloTax/CN=chat.velohub.internal"
  ```
  - **Verificação**: Arquivos .key e .crt criados
  - **Status**: ✅ Concluído / ❌ Erro

- [ ] **Configurar nginx como proxy reverso**
  ```bash
  # Criar arquivo nginx.conf
  cat > rocketchat-compose/nginx/nginx.conf << 'EOF'
  server {
      listen 443 ssl;
      server_name chat.velohub.internal;
      
      ssl_certificate /etc/ssl/velohub.crt;
      ssl_certificate_key /etc/ssl/velohub.key;
      
      location / {
          proxy_pass http://rocketchat:3000;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }
  }
  EOF
  ```
  - **Verificação**: Arquivo nginx.conf criado
  - **Status**: ✅ Concluído / ❌ Erro

## ✅ **1.3 CONFIGURAÇÃO DE SEGURANÇA**

### **1.3.1 Configuração de Firewall**
- [ ] **Configurar regras de firewall específicas**
  ```bash
  # Permitir apenas tráfego interno
  iptables -A INPUT -p tcp --dport 3000 -s 10.0.0.0/8 -j ACCEPT
  iptables -A INPUT -p tcp --dport 3000 -j DROP
  iptables -A INPUT -p tcp --dport 9458 -s 10.0.0.0/8 -j ACCEPT
  iptables -A INPUT -p tcp --dport 9458 -j DROP
  ```
  - **Verificação**: `iptables -L | grep 3000`
  - **Status**: ✅ Concluído / ❌ Erro

### **1.3.2 Configuração de Acesso Restrito**
- [ ] **Configurar whitelist de IPs**
  ```bash
  # Adicionar apenas IPs do GCP VeloHub
  echo "10.0.0.0/8" > /etc/rocketchat/whitelist.txt
  echo "172.16.0.0/12" >> /etc/rocketchat/whitelist.txt
  ```
  - **Verificação**: Arquivo whitelist.txt criado
  - **Status**: ✅ Concluído / ❌ Erro

## ✅ **1.4 TESTES DE CONECTIVIDADE**

### **1.4.1 Teste de Acesso Interno**
- [ ] **Testar acesso via curl**
  ```bash
  curl -k https://chat.velohub.internal:3000
  ```
  - **Critério**: Resposta HTTP 200
  - **Status**: ✅ Concluído / ❌ Erro

- [ ] **Testar acesso externo (deve falhar)**
  ```bash
  curl -k https://chat.velohub.internal:3000 --connect-timeout 5
  ```
  - **Critério**: Timeout ou conexão recusada
  - **Status**: ✅ Concluído / ❌ Erro

### **1.4.2 Teste de Isolamento**
- [ ] **Verificar que não há acesso à internet**
  ```bash
  docker exec rocketchat-compose-rocketchat-1 ping -c 1 8.8.8.8
  ```
  - **Critério**: Ping deve falhar
  - **Status**: ✅ Concluído / ❌ Erro

---

# 🔐 **FASE 2: INTEGRAÇÃO SSO (SEMANA 2)**

## ✅ **2.1 CONFIGURAÇÃO OAUTH GOOGLE**

### **2.1.1 Configuração no Rocket.Chat**
- [ ] **Acessar painel administrativo**
  ```bash
  # Acessar via navegador interno
  https://chat.velohub.internal:3000
  ```
  - **Verificação**: Login como administrador
  - **Status**: ✅ Concluído / ❌ Erro

- [ ] **Configurar OAuth Google**
  ```javascript
  // Configurações no painel admin do Rocket.Chat
  {
    "OAuth_Google": true,
    "OAuth_Google_client_id": "278491073220-eb4ogvn3aifu0ut9mq3rvu5r9r9l3137.apps.googleusercontent.com",
    "OAuth_Google_server_url": "https://accounts.google.com",
    "OAuth_Google_scope": "openid email profile",
    "OAuth_Google_merge_users": true,
    "OAuth_Google_merge_users_distinct_services": false
  }
  ```
  - **Verificação**: OAuth configurado e ativo
  - **Status**: ✅ Concluído / ❌ Erro

### **2.1.2 Configuração de Domínio Autorizado**
- [ ] **Configurar domínio @velotax.com.br**
  ```javascript
  // Configurações de domínio
  {
    "Accounts_Default_User_Preferences_mergeUsers": true,
    "Accounts_Default_User_Preferences_requireNameChange": false,
    "Accounts_Default_User_Preferences_requirePasswordChange": false,
    "Accounts_Default_User_Preferences_requireEmailVerification": false
  }
  ```
  - **Verificação**: Apenas emails @velotax.com.br aceitos
  - **Status**: ✅ Concluído / ❌ Erro

## ✅ **2.2 IMPLEMENTAÇÃO TOKEN SHARING**

### **2.2.1 Configuração de Token Compartilhado**
- [ ] **Criar serviço de token sharing**
  ```javascript
  // Arquivo: src/services/rocketchat.js
  export const ROCKETCHAT_CONFIG = {
    URL: 'https://chat.velohub.internal:3000',
    TOKEN_KEY: 'velohub_rocketchat_token',
    SESSION_DURATION: 6 * 60 * 60 * 1000 // 6 horas
  };
  
  export function shareTokenWithRocketChat(userData) {
    // Implementar compartilhamento de token
  }
  ```
  - **Verificação**: Arquivo criado e funcional
  - **Status**: ✅ Concluído / ❌ Erro

### **2.2.2 Configuração de Validação**
- [ ] **Implementar validação de token**
  ```javascript
  export function validateRocketChatToken(token) {
    // Validar token compartilhado
    return fetch(`${ROCKETCHAT_CONFIG.URL}/api/v1/me`, {
      headers: {
        'X-Auth-Token': token,
        'X-User-Id': getUserIdFromToken(token)
      }
    });
  }
  ```
  - **Verificação**: Validação funcionando
  - **Status**: ✅ Concluído / ❌ Erro

## ✅ **2.3 MAPEAMENTO DE USUÁRIOS**

### **2.3.1 Estrutura de Dados Unificada**
- [ ] **Criar schema de usuário unificado**
  ```javascript
  // Arquivo: src/config/user-schema.js
  export const USER_SCHEMA = {
    name: 'string',           // Nome completo do Google
    email: 'string',          // Email @velotax.com.br
    picture: 'string',        // Foto de perfil do Google
    username: 'string',       // Username baseado no email
    verified: 'boolean',      // Usuários do domínio são verificados
    active: 'boolean'         // Ativo por padrão
  };
  ```
  - **Verificação**: Schema definido e documentado
  - **Status**: ✅ Concluído / ❌ Erro

### **2.3.2 Sincronização de Perfil**
- [ ] **Implementar sincronização automática**
  ```javascript
  export function syncUserProfile(userData) {
    // Sincronizar dados entre VeloHub e Rocket.Chat
    const rocketChatUser = {
      name: userData.name,
      email: userData.email,
      picture: userData.picture,
      username: userData.email.split('@')[0],
      verified: true,
      active: true
    };
    
    return updateRocketChatProfile(rocketChatUser);
  }
  ```
  - **Verificação**: Sincronização funcionando
  - **Status**: ✅ Concluído / ❌ Erro

## ✅ **2.4 TESTES DE AUTENTICAÇÃO**

### **2.4.1 Teste de Login Automático**
- [ ] **Testar fluxo de login**
  ```bash
  # Testar login via SSO
  curl -X POST https://chat.velohub.internal:3000/api/v1/login \
    -H "Content-Type: application/json" \
    -d '{"serviceName": "google", "accessToken": "test_token"}'
  ```
  - **Critério**: Login bem-sucedido
  - **Status**: ✅ Concluído / ❌ Erro

### **2.4.2 Teste de Logout Simultâneo**
- [ ] **Testar logout em cascata**
  ```javascript
  export function logoutFromBothSystems() {
    // Logout do VeloHub
    logout();
    
    // Logout do Rocket.Chat
    return fetch(`${ROCKETCHAT_CONFIG.URL}/api/v1/logout`, {
      method: 'POST',
      headers: {
        'X-Auth-Token': getRocketChatToken(),
        'X-User-Id': getRocketChatUserId()
      }
    });
  }
  ```
  - **Verificação**: Logout em ambos os sistemas
  - **Status**: ✅ Concluído / ❌ Erro

---

# 🎨 **FASE 3: INTEGRAÇÃO FRONTEND (SEMANA 3)**

## ✅ **3.1 REMOÇÃO DO OVERLAY "EM BREVE"**

### **3.1.1 Localização e Remoção**
- [ ] **Identificar overlay no código**
  ```bash
  # Localizar no arquivo App_v2-1.js
  grep -n "Em Breve" src/App_v2-1.js
  ```
  - **Localização**: Linhas 928-967
  - **Status**: ✅ Concluído / ❌ Erro

- [ ] **Remover overlay e manter estrutura**
  ```javascript
  // Remover div com overlay (linhas 928-967)
  // Manter estrutura do container
  <aside className="lg:col-span-1 rounded-lg shadow-sm flex flex-col min-h-[calc(100vh-200px)] velohub-container">
    <h3 className="font-bold text-xl border-b text-center">Chat</h3>
    {/* OVERLAY REMOVIDO - SERÁ SUBSTITUÍDO PELO ROCKET.CHAT */}
  </aside>
  ```
  - **Verificação**: Overlay removido, estrutura mantida
  - **Status**: ✅ Concluído / ❌ Erro

### **3.1.2 Preparação do Container**
- [ ] **Configurar container para iframe**
  ```javascript
  // Adicionar ID e classes específicas
  <aside 
    id="rocketchat-container"
    className="lg:col-span-1 rounded-lg shadow-sm flex flex-col min-h-[calc(100vh-200px)] velohub-container"
    style={{
      borderRadius: '12px', 
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', 
      padding: '24px', 
      margin: '16px',
      position: 'relative'
    }}
  >
    <h3 className="font-bold text-xl border-b text-center" style={{color: 'var(--blue-dark)', borderColor: 'var(--blue-opaque)'}}>
      Chat
    </h3>
    {/* CONTAINER PREPARADO PARA IFRAME */}
  </aside>
  ```
  - **Verificação**: Container preparado
  - **Status**: ✅ Concluído / ❌ Erro

## ✅ **3.2 IMPLEMENTAÇÃO DO IFRAME**

### **3.2.1 Criação do Componente RocketChat**
- [ ] **Criar componente RocketChatWidget**
  ```javascript
  // Arquivo: src/components/RocketChatWidget.js
  import React, { useEffect, useState } from 'react';
  import { ROCKETCHAT_CONFIG } from '../config/rocketchat-config';
  
  const RocketChatWidget = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    
    useEffect(() => {
      // Configurar iframe do Rocket.Chat
      const iframe = document.createElement('iframe');
      iframe.src = `${ROCKETCHAT_CONFIG.URL}/channel/general`;
      iframe.style.width = '100%';
      iframe.style.height = 'calc(100vh - 200px)';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '8px';
      
      const container = document.getElementById('rocketchat-container');
      if (container) {
        container.appendChild(iframe);
        setIsLoaded(true);
      }
    }, []);
    
    return (
      <div id="rocketchat-widget">
        {!isLoaded && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Carregando chat...</span>
          </div>
        )}
      </div>
    );
  };
  
  export default RocketChatWidget;
  ```
  - **Verificação**: Componente criado e funcional
  - **Status**: ✅ Concluído / ❌ Erro

### **3.2.2 Configuração de Comunicação**
- [ ] **Implementar comunicação entre sistemas**
  ```javascript
  // Arquivo: src/services/rocketchat.js
  export function initializeRocketChatCommunication() {
    // Configurar postMessage para comunicação
    window.addEventListener('message', (event) => {
      if (event.origin === ROCKETCHAT_CONFIG.URL) {
        handleRocketChatMessage(event.data);
      }
    });
  }
  
  function handleRocketChatMessage(data) {
    switch (data.type) {
      case 'AUTH_SUCCESS':
        // Usuário autenticado com sucesso
        break;
      case 'AUTH_FAILED':
        // Falha na autenticação
        break;
      case 'MESSAGE_SENT':
        // Mensagem enviada
        break;
    }
  }
  ```
  - **Verificação**: Comunicação funcionando
  - **Status**: ✅ Concluído / ❌ Erro

## ✅ **3.3 INTEGRAÇÃO NO APP PRINCIPAL**

### **3.3.1 Importação do Componente**
- [ ] **Importar RocketChatWidget no App_v2-1.js**
  ```javascript
  // Adicionar import
  import RocketChatWidget from './components/RocketChatWidget';
  
  // Substituir conteúdo do container
  <aside className="lg:col-span-1 rounded-lg shadow-sm flex flex-col min-h-[calc(100vh-200px)] velohub-container">
    <h3 className="font-bold text-xl border-b text-center" style={{color: 'var(--blue-dark)', borderColor: 'var(--blue-opaque)'}}>
      Chat
    </h3>
    <RocketChatWidget />
  </aside>
  ```
  - **Verificação**: Componente integrado
  - **Status**: ✅ Concluído / ❌ Erro

### **3.3.2 Configuração de Responsividade**
- [ ] **Configurar responsividade do iframe**
  ```css
  /* Adicionar ao index.css */
  #rocketchat-widget iframe {
    width: 100%;
    height: calc(100vh - 200px);
    border: none;
    border-radius: 8px;
  }
  
  @media (max-width: 768px) {
    #rocketchat-widget iframe {
      height: calc(100vh - 150px);
    }
  }
  ```
  - **Verificação**: Responsividade funcionando
  - **Status**: ✅ Concluído / ❌ Erro

## ✅ **3.4 TESTES DE INTEGRAÇÃO**

### **3.4.1 Teste de Carregamento**
- [ ] **Testar carregamento do iframe**
  ```bash
  # Verificar se o iframe carrega corretamente
  curl -k https://chat.velohub.internal:3000/channel/general
  ```
  - **Critério**: Página carrega sem erros
  - **Status**: ✅ Concluído / ❌ Erro

### **3.4.2 Teste de Responsividade**
- [ ] **Testar em diferentes tamanhos de tela**
  - Desktop (1920x1080)
  - Tablet (768x1024)
  - Mobile (375x667)
  - **Critério**: iframe se adapta corretamente
  - **Status**: ✅ Concluído / ❌ Erro

---

# ⚙️ **FASE 4: FUNCIONALIDADES E TESTES (SEMANA 4)**

## ✅ **4.1 CONFIGURAÇÃO DE UPLOAD DE ARQUIVOS**

### **4.1.1 Configuração de Limites**
- [ ] **Configurar limites de upload**
  ```javascript
  // Configurações no Rocket.Chat
  {
    "FileUpload_MaxFileSize": 10485760, // 10MB
    "FileUpload_Enabled": true,
    "FileUpload_Allowed_FileTypes": "pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif",
    "FileUpload_MaxFileSize_Image": 5242880, // 5MB para imagens
    "FileUpload_MaxFileSize_Video": 52428800, // 50MB para vídeos
    "FileUpload_MaxFileSize_Audio": 10485760 // 10MB para áudio
  }
  ```
  - **Verificação**: Limites configurados
  - **Status**: ✅ Concluído / ❌ Erro

### **4.1.2 Configuração de Tipos Permitidos**
- [ ] **Configurar tipos de arquivo permitidos**
  ```javascript
  const ALLOWED_FILE_TYPES = {
    documents: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    images: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ]
  };
  ```
  - **Verificação**: Tipos configurados
  - **Status**: ✅ Concluído / ❌ Erro

## ✅ **4.2 CONFIGURAÇÃO DE MODERAÇÃO**

### **4.2.1 Configuração de Administradores**
- [ ] **Configurar roles de administrador**
  ```javascript
  // Configurações de moderação
  {
    "Message_AllowEditing": true,
    "Message_AllowDeleting": true,
    "Message_AllowPinning": true,
    "Message_AllowStarring": true,
    "Message_AllowSnippeting": true,
    "Message_ShowEditedStatus": true,
    "Message_ShowDeletedStatus": true
  }
  ```
  - **Verificação**: Moderação configurada
  - **Status**: ✅ Concluído / ❌ Erro

### **4.2.2 Configuração de Canais**
- [ ] **Criar canais padrão**
  ```bash
  # Canais sugeridos
  - #general (geral)
  - #desenvolvimento (dev)
  - #suporte (suporte)
  - #administracao (admin)
  ```
  - **Verificação**: Canais criados
  - **Status**: ✅ Concluído / ❌ Erro

## ✅ **4.3 CONFIGURAÇÃO DE NOTIFICAÇÕES**

### **4.3.1 Configuração de Alertas**
- [ ] **Configurar notificações**
  ```javascript
  {
    "Push_Enable": true,
    "Push_Gateway": "https://gateway.rocket.chat",
    "Push_Production": false,
    "Email_Notifications": true,
    "Email_Notifications_User": "noreply@velotax.com.br"
  }
  ```
  - **Verificação**: Notificações configuradas
  - **Status**: ✅ Concluído / ❌ Erro

### **4.3.2 Configuração de Status**
- [ ] **Configurar status de presença**
  ```javascript
  {
    "Presence_broadcast_disabled": false,
    "Presence_broadcast_available": true,
    "Presence_broadcast_away": true,
    "Presence_broadcast_busy": true
  }
  ```
  - **Verificação**: Status configurado
  - **Status**: ✅ Concluído / ❌ Erro

## ✅ **4.4 TESTES FINAIS**

### **4.4.1 Teste de Funcionalidades**
- [ ] **Testar envio de mensagens**
  - Enviar mensagem de texto
  - Enviar arquivo PDF
  - Enviar arquivo Excel
  - Enviar imagem
  - **Critério**: Todas as funcionalidades funcionando
  - **Status**: ✅ Concluído / ❌ Erro

### **4.4.2 Teste de Segurança**
- [ ] **Testar isolamento de rede**
  ```bash
  # Verificar que não há acesso externo
  nmap -p 3000,9458 chat.velohub.internal
  ```
  - **Critério**: Portas não acessíveis externamente
  - **Status**: ✅ Concluído / ❌ Erro

### **4.4.3 Teste de Performance**
- [ ] **Testar performance com múltiplos usuários**
  - 5 usuários simultâneos
  - 10 mensagens por minuto
  - Upload de arquivos simultâneos
  - **Critério**: Performance estável
  - **Status**: ✅ Concluído / ❌ Erro

---

# 📊 **MONITORAMENTO E LOGS**

## ✅ **5.1 CONFIGURAÇÃO DE MONITORAMENTO**

### **5.1.1 Integração com Prometheus**
- [ ] **Configurar métricas do Rocket.Chat**
  ```yaml
  # Adicionar ao prometheus.yml
  - job_name: 'rocketchat'
    static_configs:
      - targets: ['rocketchat:9458']
    scrape_interval: 30s
  ```
  - **Verificação**: Métricas sendo coletadas
  - **Status**: ✅ Concluído / ❌ Erro

### **5.1.2 Configuração de Alertas**
- [ ] **Configurar alertas críticos**
  ```yaml
  # Alertas para:
  - Rocket.Chat offline
  - MongoDB offline
  - Alta utilização de CPU
  - Alta utilização de memória
  - Falhas de autenticação
  ```
  - **Verificação**: Alertas configurados
  - **Status**: ✅ Concluído / ❌ Erro

## ✅ **5.2 CONFIGURAÇÃO DE LOGS**

### **5.2.1 Centralização de Logs**
- [ ] **Configurar coleta de logs**
  ```bash
  # Configurar logrotate
  /var/log/rocketchat/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
  }
  ```
  - **Verificação**: Logs sendo coletados
  - **Status**: ✅ Concluído / ❌ Erro

### **5.2.2 Configuração de Auditoria**
- [ ] **Configurar logs de auditoria**
  ```javascript
  {
    "Log_Level": "2",
    "Log_Package": true,
    "Log_File": true,
    "Log_Console": false,
    "Log_Exceptions": true
  }
  ```
  - **Verificação**: Logs de auditoria ativos
  - **Status**: ✅ Concluído / ❌ Erro

---

# 🔒 **VERIFICAÇÕES DE SEGURANÇA**

## ✅ **6.1 TESTES DE ISOLAMENTO**

### **6.1.1 Teste de Rede**
- [ ] **Verificar isolamento de rede**
  ```bash
  # Testar conectividade externa
  docker exec rocketchat-compose-rocketchat-1 ping -c 1 8.8.8.8
  # Deve falhar
  ```
  - **Critério**: Sem acesso à internet
  - **Status**: ✅ Concluído / ❌ Erro

### **6.1.2 Teste de Firewall**
- [ ] **Verificar regras de firewall**
  ```bash
  # Verificar regras ativas
  iptables -L | grep -E "(3000|9458)"
  ```
  - **Critério**: Apenas tráfego interno permitido
  - **Status**: ✅ Concluído / ❌ Erro

## ✅ **6.2 TESTES DE AUTENTICAÇÃO**

### **6.2.1 Teste de Domínio**
- [ ] **Testar acesso com email não autorizado**
  ```bash
  # Tentar login com email externo
  curl -X POST https://chat.velohub.internal:3000/api/v1/login \
    -H "Content-Type: application/json" \
    -d '{"email": "teste@gmail.com", "password": "teste"}'
  ```
  - **Critério**: Acesso negado
  - **Status**: ✅ Concluído / ❌ Erro

### **6.2.2 Teste de SSO**
- [ ] **Testar login com SSO autorizado**
  ```bash
  # Testar com email @velotax.com.br
  curl -X POST https://chat.velohub.internal:3000/api/v1/login \
    -H "Content-Type: application/json" \
    -d '{"serviceName": "google", "accessToken": "valid_token"}'
  ```
  - **Critério**: Login bem-sucedido
  - **Status**: ✅ Concluído / ❌ Erro

---

# 📋 **CHECKLIST FINAL**

## ✅ **7.1 VERIFICAÇÕES OBRIGATÓRIAS**

### **7.1.1 Funcionalidades**
- [ ] **Chat de mensagens funcionando**
- [ ] **Upload de arquivos funcionando**
- [ ] **SSO integrado funcionando**
- [ ] **Logout simultâneo funcionando**
- [ ] **Responsividade funcionando**

### **7.1.2 Segurança**
- [ ] **Rede isolada funcionando**
- [ ] **Firewall configurado**
- [ ] **SSL funcionando**
- [ ] **Apenas domínio @velotax.com.br**
- [ ] **Logs de auditoria ativos**

### **7.1.3 Performance**
- [ ] **Carregamento rápido**
- [ ] **Múltiplos usuários suportados**
- [ ] **Upload de arquivos estável**
- [ ] **Mensagens em tempo real**

## ✅ **7.2 DOCUMENTAÇÃO**

### **7.2.1 Documentação Técnica**
- [ ] **Arquitetura documentada**
- [ ] **Configurações documentadas**
- [ ] **Procedimentos de manutenção**
- [ ] **Procedimentos de backup**

### **7.2.2 Documentação de Usuário**
- [ ] **Manual do usuário**
- [ ] **FAQ de problemas comuns**
- [ ] **Guia de moderação**
- [ ] **Política de uso**

---

# 🚀 **DEPLOY EM PRODUÇÃO**

## ✅ **8.1 PREPARAÇÃO PARA PRODUÇÃO**

### **8.1.1 Backup de Segurança**
- [ ] **Backup do banco de dados**
  ```bash
  docker exec rocketchat-compose-mongodb-1 mongodump --db velohub_chat --out /backup
  ```
  - **Verificação**: Backup criado
  - **Status**: ✅ Concluído / ❌ Erro

### **8.1.2 Configuração de Produção**
- [ ] **Configurar variáveis de produção**
  ```bash
  # Atualizar .env.velohub para produção
  ROOT_URL=https://chat.velohub.internal
  TRAEFIK_PROTOCOL=https
  LETSENCRYPT_ENABLED=true
  ```
  - **Verificação**: Configurações atualizadas
  - **Status**: ✅ Concluído / ❌ Erro

## ✅ **8.2 ATIVAÇÃO**

### **8.2.1 Deploy Final**
- [ ] **Executar deploy em produção**
  ```bash
  docker compose -f compose.velohub.yml up -d
  ```
  - **Verificação**: Serviços rodando
  - **Status**: ✅ Concluído / ❌ Erro

### **8.2.2 Teste de Produção**
- [ ] **Testar todas as funcionalidades**
- [ ] **Verificar performance**
- [ ] **Verificar segurança**
- [ ] **Verificar logs**

---

# 📝 **REGISTRO DE VERSÕES**

## **Versões dos Arquivos Modificados**
- `src/App_v2-1.js` - v1.2.0 (remoção overlay, integração chat)
- `src/components/RocketChatWidget.js` - v1.0.0 (novo componente)
- `src/services/rocketchat.js` - v1.0.0 (novo serviço)
- `src/config/rocketchat-config.js` - v1.0.0 (nova configuração)
- `rocketchat-compose/.env.velohub` - v1.0.0 (configuração específica)
- `rocketchat-compose/compose.velohub.yml` - v1.0.0 (compose customizado)

---

# ⚠️ **LEMBRETES IMPORTANTES**

1. **APROVAÇÃO OBRIGATÓRIA**: Cada fase deve ser aprovada antes de prosseguir
2. **BACKUP ANTES DE CADA FASE**: Sempre fazer backup antes de modificações
3. **TESTES OBRIGATÓRIOS**: Todos os testes devem passar antes de prosseguir
4. **VERSIONAMENTO**: Incrementar versão de cada arquivo modificado
5. **DOCUMENTAÇÃO**: Documentar todas as alterações realizadas
6. **SEGURANÇA**: Verificar isolamento e segurança em cada etapa
7. **LOGS**: Monitorar logs durante toda a implementação
8. **ROLLBACK**: Ter plano de rollback para cada fase

---

**📅 Data de Criação**: 2025-01-27  
**👤 Autor**: VeloHub Development Team  
**📋 Versão**: v1.0.0  
**🎯 Status**: Pronto para Implementação
