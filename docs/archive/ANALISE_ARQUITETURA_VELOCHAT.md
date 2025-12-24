# Análise da Arquitetura do VeloChat
<!-- VERSION: v1.0.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team -->

## Objetivo da Análise
Verificar e garantir que o sistema de chat use:
- **Database**: `velochat`
- **Collections**: `chat_mensagens` e `chat_salas`
- **Servidor de controle**: VeloChat Server (não backend direto do VeloHub)

---

## 1. Verificação do VeloChat Server

### ❌ **CONCLUSÃO: VeloChat Server NÃO EXISTE como servidor separado**

#### Evidências:
1. **Variáveis de ambiente não configuradas**:
   - `REACT_APP_VELOCHAT_API_URL` não está definida no `app.yaml`
   - `REACT_APP_VELOCHAT_WS_URL` não está definida no `app.yaml`
   - Fallback padrão: `http://localhost:3001` (servidor local não existe)

2. **Código misto**:
   - `src/services/velochatApi.js` referencia `VELOCHAT_API_URL` mas:
     - `getContacts()` → Backend VeloHub (`${API_BASE_URL}/chat/contacts`)
     - `getChatStatus()` → Backend VeloHub (`${API_BASE_URL}/status`)
     - `updateChatStatus()` → Backend VeloHub (`${API_BASE_URL}/auth/session/chat-status`)
     - `getConversations()` → Tentaria VeloChat Server (`${VELOCHAT_API_URL}/api/salas`)
     - `getMessages()` → Tentaria VeloChat Server (`${VELOCHAT_API_URL}/api/messages/salas/${id}/messages`)
     - `createConversation()` → Tentaria VeloChat Server (`${VELOCHAT_API_URL}/api/salas`)

3. **WebSocket**:
   - `src/hooks/useWebSocket.js` tenta conectar ao `VELOCHAT_WS_URL` (localhost:3001)
   - Não há servidor WebSocket separado configurado

4. **Backend VeloHub**:
   - Rotas REST implementadas diretamente em `backend/routes/api/chat/*`
   - Todas as rotas estão registradas no `backend/server.js`
   - Não há proxy ou redirecionamento para servidor externo

---

## 2. Verificação da Configuração do Database

### ⚠️ **PROBLEMA IDENTIFICADO: Database usando fallback incorreto**

#### Situação Atual:
- **Configuração**: `VELOCHAT_DB_NAME` usa fallback `'console_conteudo'` quando não definido
- **Localização**: `backend/config.js` linha 23
- **Arquivos afetados**:
  - `backend/routes/api/chat/mensagens.js` (linha 22)
  - `backend/routes/api/chat/salas.js` (linha 25)
  - `backend/routes/api/chat/contacts.js` (linha 19)
  - `backend/routes/api/chat/conversations.js` (linha 18)
  - `backend/routes/api/chat/upload.js` (linha 35)

#### Verificação de Variáveis de Ambiente:
- ❌ `VELOCHAT_DB_NAME` **NÃO está definido** no `app.yaml`
- ❌ Não há secret no Secret Manager para `VELOCHAT_DB_NAME`
- ⚠️ Sistema está usando fallback `console_conteudo` (incorreto)

#### Collections Verificadas:
- ✅ `chat_mensagens` - Nome correto (usado em todos os arquivos)
- ✅ `chat_salas` - Nome correto (usado em todos os arquivos)

---

## 3. Mapeamento do Fluxo de Mensagens Atual

### Fluxo Real Implementado:

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  - VeloChatWidget.js                                         │
│  - velochatApi.js                                            │
│  - useWebSocket.js                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ REST API (HTTP)
                     │ WebSocket (tentativa - falha)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND VELOHUB (Express.js)                   │
│  - /api/chat/salas/:salaId/mensagens (GET/POST)            │
│  - /api/chat/mensagens/:mensagemId (PUT/DELETE)             │
│  - /api/chat/salas (GET/POST)                              │
│  - /api/chat/contacts (GET)                                 │
│  - /api/chat/conversations (GET)                            │
│  - /api/chat/upload (POST)                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ MongoDB Driver
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    MONGODB                                   │
│  Database: console_conteudo (INCORRETO - deveria ser       │
│            velochat)                                         │
│  Collections:                                                │
│    - chat_mensagens ✅                                       │
│    - chat_salas ✅                                           │
│    - hub_sessions (para autenticação)                      │
└─────────────────────────────────────────────────────────────┘
```

### Detalhamento das Chamadas:

#### 1. **Carregar Conversas**:
```
Frontend: velochatApi.getConversations()
  → Tentaria: ${VELOCHAT_API_URL}/api/salas
  → Realmente: Backend VeloHub /api/chat/salas (via conversations router)
  → MongoDB: console_conteudo.chat_salas
```

#### 2. **Carregar Mensagens**:
```
Frontend: velochatApi.getMessages(conversationId)
  → Tentaria: ${VELOCHAT_API_URL}/api/messages/salas/${id}/messages
  → Realmente: Backend VeloHub /api/chat/salas/:salaId/mensagens
  → MongoDB: console_conteudo.chat_mensagens
```

#### 3. **Enviar Mensagem**:
```
Frontend: wsSendMessage() via WebSocket
  → Tentaria: VeloChat Server WebSocket (localhost:3001) - FALHA
  → Fallback: Não há fallback REST implementado no frontend
  → Backend: Não recebe mensagem via WebSocket (servidor não existe)
```

**PROBLEMA CRÍTICO**: Mensagens não estão sendo salvas porque:
- WebSocket tenta conectar ao servidor inexistente
- Não há chamada REST de fallback no frontend para salvar mensagem
- Backend tem rotas REST mas frontend não as usa para envio

#### 4. **Criar Conversa**:
```
Frontend: velochatApi.createConversation()
  → Tentaria: ${VELOCHAT_API_URL}/api/salas (POST)
  → Realmente: Backend VeloHub /api/chat/salas (POST)
  → MongoDB: console_conteudo.chat_salas
```

#### 5. **Carregar Contatos**:
```
Frontend: velochatApi.getContacts()
  → Backend VeloHub: /api/chat/contacts (GET)
  → MongoDB: console_analises.qualidade_funcionarios
```

---

## 4. Verificação de Conformidade com Requisitos

### ❌ **NÃO CONFORME**

| Requisito | Status | Observação |
|-----------|--------|------------|
| Database `velochat` | ❌ | Usando fallback `console_conteudo` |
| Collection `chat_mensagens` | ✅ | Nome correto |
| Collection `chat_salas` | ✅ | Nome correto |
| Fluxo via VeloChat Server | ❌ | VeloChat Server não existe |

---

## 5. Problemas Identificados

### 🔴 **CRÍTICOS**:

1. **Database incorreto**:
   - Sistema usando `console_conteudo` ao invés de `velochat`
   - Variável `VELOCHAT_DB_NAME` não configurada

2. **Envio de mensagens não funciona**:
   - WebSocket tenta conectar ao servidor inexistente
   - Não há fallback REST no frontend
   - Mensagens não são salvas no MongoDB

3. **VeloChat Server não existe**:
   - Código referencia servidor separado que não existe
   - WebSocket não consegue conectar
   - Algumas chamadas REST tentam usar servidor inexistente

### 🟡 **MODERADOS**:

1. **Arquitetura mista**:
   - Algumas chamadas usam backend VeloHub diretamente
   - Outras tentam usar VeloChat Server inexistente
   - Inconsistência na implementação

2. **Configuração incompleta**:
   - Variáveis de ambiente não definidas
   - Fallbacks usando valores incorretos

---

## 6. Recomendações

### ✅ **AÇÕES NECESSÁRIAS**:

1. **Configurar Database `velochat`**:
   - Adicionar `VELOCHAT_DB_NAME=velochat` no `app.yaml`
   - Criar secret no Secret Manager se necessário
   - Remover fallback `console_conteudo` ou alterar para `velochat`

2. **Corrigir Envio de Mensagens**:
   - Opção A: Implementar servidor VeloChat Server separado com WebSocket
   - Opção B: Usar REST API diretamente do backend VeloHub (mais simples)
   - Implementar fallback REST quando WebSocket falhar

3. **Unificar Arquitetura**:
   - Decidir: VeloChat Server separado OU backend VeloHub único
   - Se backend único: Remover referências ao VeloChat Server
   - Se servidor separado: Criar e configurar VeloChat Server

4. **Verificar Collections no MongoDB**:
   - Confirmar que `chat_mensagens` e `chat_salas` existem no database `velochat`
   - Se não existirem, criar ou migrar dados

---

## 7. Próximos Passos

### Fase 1: Correções Imediatas
1. ✅ Configurar `VELOCHAT_DB_NAME=velochat` no `app.yaml`
2. ✅ Alterar fallback de `console_conteudo` para `velochat` em todos os arquivos
3. ✅ Implementar fallback REST para envio de mensagens

### Fase 2: Decisão Arquitetural
1. ⏳ Decidir se cria VeloChat Server separado ou usa backend único
2. ⏳ Se backend único: Remover referências ao VeloChat Server
3. ⏳ Se servidor separado: Criar VeloChat Server com WebSocket

### Fase 3: Verificação e Testes
1. ⏳ Verificar se database `velochat` existe no MongoDB
2. ⏳ Verificar se collections existem
3. ⏳ Testar fluxo completo de envio/recebimento de mensagens

---

## 8. Arquivos que Precisam de Alteração

### Backend:
- `backend/config.js` - Alterar fallback para `velochat`
- `backend/routes/api/chat/mensagens.js` - Alterar fallback
- `backend/routes/api/chat/salas.js` - Alterar fallback
- `backend/routes/api/chat/contacts.js` - Alterar fallback
- `backend/routes/api/chat/conversations.js` - Alterar fallback
- `backend/routes/api/chat/upload.js` - Alterar fallback

### Frontend:
- `src/services/velochatApi.js` - Decidir: usar backend único ou servidor separado
- `src/hooks/useWebSocket.js` - Implementar fallback ou remover se não usar servidor separado
- `src/components/VeloChatWidget.js` - Adicionar fallback REST para envio de mensagens

### Configuração:
- `app.yaml` - Adicionar `VELOCHAT_DB_NAME=velochat`
- Secret Manager (GCP) - Criar secret se necessário

---

**Data da Análise**: 2025-01-31  
**Versão do Documento**: v1.0.0

