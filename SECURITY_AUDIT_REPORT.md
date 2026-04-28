# Relatório de auditoria de segurança — ecossistema VeloHub

<!--
  VERSION: v1.2.0 | DATE: 2026-04-22 | AUTHOR: VeloHub Development Team
  Mudanças v1.2.0: secção 8 — actualizações posteriores à v1.1.0 (filter-repo, hotfix Cloud Run/OAuth,
  versões de ficheiros); §3 histórico Git; tabela R7; §2.4/§2.6; mitigações §1.2 alargadas.
  Mudanças v1.1.0: plano P0 dependências; esclarecimentos CORS/Escalações/Mongo/ping/XSS/Cloud Run;
  registo de mitigações (logs chatbot, instrumentação, anexos req.user).
-->

## 1. Resumo executivo

Esta auditoria cobre o **VeloHub** (React + `backend/`), o **VeloChat Server** e a **política de ficheiros na raiz do workspace** (presença de `.env` ignorado pelo Git). Não existe “segurança total”; o objetivo é **inventário de risco**, priorização e **ações sujeitas à tua aprovação** onde há impacto em contratos de API, schemas MongoDB ou comportamento dos clientes.

### 1.1 Plano P0 urgência — dependências (ordem de execução)

**Sem `npm audit fix --force` na primeira onda.** Documentar contagens antes/depois em cada passo.

1. **VeloChat Server** (`dev - VeloChat Server/`): `npm audit` → `npm audit fix`; regressão: REST + WebSocket; rever **fast-xml-parser** e **socket.io-parser** na árvore resultante.
2. **Backend VeloHub** (`dev VeloHub/backend/`): idem; atenção a **express** / **path-to-regexp** / transitivas de **@google-cloud/storage**.
3. **Frontend VeloHub** (raiz `dev VeloHub/`): priorizar CVEs no **bundle de produção** (**axios**, **react-router**); muitas entradas são **devDependencies** (CRA/webpack/jest).
4. **xlsx** (SheetJS Community): **sem correção** publicada no ecossistema típico — planear: substituição de biblioteca, parsing só no backend com quotas, ficheiros de origem confiável, ou licença/comercial conforme política do projeto.

### 1.2 Esclarecimentos pedidos pelo projeto

**CORS e secrets no container**

- **CORS** não transporta segredos: define apenas **origens** autorizadas a chamar a API com credenciais no browser.
- **Secret Manager (GCP)** injeta valores no **processo** (ex.: `MONGO_ENV`, `GOOGLE_CREDENTIALS`). Isso resolve **conexão** ao Mongo e outros serviços; é **independente** do CORS.

**Escalações e Mongo**

- O fluxo legado (ex.: Firebase) **não é o modelo actual**; a ligação ao Mongo em produção usa **`MONGO_ENV` no container**.
- **Importante:** ter `MONGO_ENV` configurado **não** equivale a **autorização HTTP** nas rotas `/api/escalacoes/*`. São camadas distintas: infraestrutura de dados vs. **quem pode invocar** cada endpoint na Internet.

**`GET /api/ouvidoria/dashboard/ping`**

- Resposta **estática** (`ok` + mensagem). **Não** lê `process.env`, **não** consulta MongoDB, **não** devolve URI ou credenciais.
- Valores do Secret Manager existem só como variáveis de ambiente **no processo**; **não** “vazam” por esta rota a menos que código futuro os inclua em resposta ou logs.

**`localStorage` e sessão (XSS)**

- `velohub_session_id` e dados de sessão em **`localStorage`** são legíveis por **qualquer JavaScript na mesma origem**.
- Se ocorrer **XSS** (script injectado), o atacante pode **ler o storage** e **roubar a sessão** (uso do `sessionId` como se fosse o utilizador).
- Mitigações: **CSP**, higiene de conteúdo/HTML, dependências sem XSS conhecidos; evolução possível: token em cookie **HttpOnly** (mudança arquitectural maior).

**`--allow-unauthenticated` no Cloud Run**

- **Sem** verificação IAM Google na porta pública: **qualquer IP** pode enviar HTTP ao URL do serviço.
- **Riscos:** abuso de rotas pouco protegidas, brute-force, scraping, custo por tráfego, fuzzing. A segurança efectiva está na **aplicação** (sessão, validação, limites). É padrão para API que autentica **na app**; exige que rotas sensíveis estejam bem protegidas.

**Mitigações aplicadas em 2026-04-22 (código) — fase inicial (já descritas em v1.1.0)**

- Removidos middlewares de log completos de **`/api/chatbot/ask`** em `backend/server.js` (v2.50.4).
- Removida instrumentação **`127.0.0.1:7243`** em `backend/routes/api/escalacoes/erros-bugs.js` (v1.9.1).
- Removida instrumentação **`127.0.0.1:7244`** e escrita local em WebSocket em `dev - VeloChat Server` (`server.js` v2.21.1, `middleware/auth.js` v1.0.2).
- Removidos `fetch` de debug em `src/components/Ouvidoria/AnaliseDiaria.js` (v2.7.1).
- **Ouvidoria anexos:** email do uploader apenas de **`req.user.email`** (sessão); header/body divergente → **403** — `backend/routes/api/ouvidoria/anexos.js` (v1.1.0).

**Mitigações e correções posteriores (após a redacção inicial deste relatório)**

- **Histórico Git:** `git filter-repo` com `--replace-text` (ficheiro de regras no workspace pai: `git-history-redact-rules.txt`) nos repositórios **VeloHub** e **velochat_server**; **force push** de `main` com coordenação da equipa. *Lição:* evitar substituir PEM dentro de **literais JavaScript** multilinha — corrigido com `includes('REDACTED')` e padrões seguros.
- **Cloud Run / arranque:** `SyntaxError` em `server.js` e `anexos.js` após redacção → contentor não escutava `PORT`; corrigido (v2.50.5+ e `anexos.js` v1.1.1). **`app.listen`** passou para o **fim** do `server.js` (após static + SPA); registo de rotas **Ouvidoria** e **Sociais** sem `throw` no `catch`; `process.on` global cedo.
- **OAuth / GIS (Google Identity Services):** novo **GET** `/api/auth/oauth-client-id` — expõe apenas o **OAuth Web Client ID** (público por desenho; não o `client_secret`). Runtime lê `REACT_APP_GOOGLE_CLIENT_ID` **ou** `GOOGLE_CLIENT_ID` **ou** `GOOGLE_OAUTH_CLIENT_ID`; normalização (trim, JSON credentials, regex de fallback); resposta com `clientId` e `REACT_APP_GOOGLE_CLIENT_ID`. **`LoginPage.js`:** `fetch` **same-origin** (`window.location.origin`), prioridade ao valor da API sobre bundle com ID inválido, largura do botão GSI em px. Referência de versões: `server.js` v2.50.9, `LoginPage.js` v3.0.5, `google-config.js` v1.3.3.
- **Rastreio:** entradas correspondentes em [`DEPLOY_LOG.md`](DEPLOY_LOG.md) (ex.: v1.1.26).

---

**Principais conclusões (estado após mitigações parciais):**

| Severidade | Tema |
|------------|------|
| P0 | Dependências com CVEs elevados (incl. `xlsx`, cadeias `react-scripts`/webpack em dev); **VeloChat** com `fast-xml-parser` reportado como crítico pelo `npm audit` — seguir **§1.1**. |
| P1 | **Autorização nas Escalações**: Mongo via `MONGO_ENV` está resolvido ao nível de **infra**; rotas `/api/escalacoes/*` seguem **sem** o mesmo middleware de sessão que Ouvidoria — exposição HTTP é decisão de API a endurecer **com aprovação**. Chat principal no VeloChat com `validateSession` por rota; anexos VeloHub com `sessionId`. |
| P1 | ~~Logs de diagnóstico `/api/chatbot/ask`~~ — **removidos** (v2.50.4). |
| P1 | ~~Instrumentação 7243/7244~~ — **removida** nos ficheiros indicados em §1.2. |
| P2 | **GET `/api/ouvidoria/dashboard/ping`**: sem segredos na resposta; risco sobretudo **informacional** (serviço ativo). |
| P2 | **Sessão no browser** / **localStorage**: ver §1.2 (XSS). |
| P2 | **Cloud Run** não autenticado na borda: ver §1.2. |
| P2 | ~~**Ouvidoria anexos** spoofing de email~~ — **endurecido** com `req.user.email` + 403 se header/body divergir (v1.1.0); placeholder PEM pós-redacção corrigido em **v1.1.1**. |
| — | **Histórico Git** redigido + hotfix arranque/OAuth — ver §1.2 e **§8**; clones e SHAs antigos invalidados. |

---

## 2. Fase 1 — Inventário da superfície de ataque

### 2.1 VeloHub — middleware global

- **CORS** (`server.js`): lista fixa de origens (app velotax, Cloud Run, `localhost` 8080/3000/5000) + `credentials: true`.
- **Payload**: `express.json` / `urlencoded` com **limite 50 MB** — aumenta superfície de DoS por memória; necessário para alguns fluxos, mas deve ser monitorizado.
- **Middlewares de segurança HTTP**: não foram encontrados `helmet`, `express-rate-limit` nem CSP no backend.

### 2.2 VeloHub — rotas com proteção explícita por sessão (hub_sessions)

- **`/api/ouvidoria/*`**: `ouvidoriaAccess` (exceto `GET /api/ouvidoria/dashboard/ping`).
- **`/api/sociais`**: `sociaisAccessMiddleware`.

**Rota pública (GIS):** **`GET /api/auth/oauth-client-id`** — sem middleware de sessão; resposta limitada ao **OAuth Web Client ID** (equivalente ao valor exposto no bundle quando `REACT_APP_GOOGLE_CLIENT_ID` está definido no build). Não expõe `client_secret`.

### 2.3 VeloHub — routers sem o middleware acima (registo em `server.js`)

- **`/api/escalacoes/*`**: solicitações, erros-bugs, logs, apoio-n1 — **sem** `ouvidoriaAccess` / validação de sessão ao nível do `app.use`.
- **Chat em tempo real (conversas, mensagens, salas, etc.)**: delegado ao **VeloChat Server**; o bloco que registava `./routes/api/chat/*` no VeloHub está **comentado** em `server.js`. No VeloHub permanecem rotas pontuais como **`POST /api/chat/attachments/get-upload-url`** e **`confirm-upload`**, que exigem **`sessionId`** (header/body).
- **Dezenas de rotas inline** em `server.js` (`/api/auth/*`, `/api/chatbot/*`, `/api/support/*`, `/api/data`, `/api/velo-news`, etc.): padrão de auth **por endpoint** (a confirmar rota a rota em endurecimento futuro).

### 2.4 VeloHub — uploads

- **Ouvidoria** [`backend/routes/api/ouvidoria/anexos.js`](backend/routes/api/ouvidoria/anexos.js): `multer` memória, **10 MB**, filtro por extensão; email de auditoria alinhado à sessão (**v1.1.0**); comparação de placeholder `GOOGLE_CREDENTIALS` segura pós-redacção Git (**v1.1.1**).
- **Perfil / chat / GCS**: signed URLs e fluxos em `server.js` (múltiplos blocos); logs verbosos em caminhos `get-upload-url`.

### 2.5 VeloChat Server

- Rotas HTTP em `dev - VeloChat Server/server.js`: `/api/messages`, `/api/upload`, `/api/contacts`, `/api/salas`, `/api/status`, `/api/p2p`, `/api/sala-mensagens`, `/api/conversations`.
- Cada ficheiro em `routes/` importa **`validateSession`** por rota (ver grep) — modelo **mais consistente** que o VeloHub para esses prefixos.
- **GET `/` e `/health`**: informação de serviço e lista `allowedOrigins` na resposta JSON — reduzir detalhe em produção é melhoria opcional.

### 2.6 CI/CD (VeloHub)

- [`cloudbuild.yaml`](cloudbuild.yaml): build Docker com `REACT_APP_*`; deploy Cloud Run com `--allow-unauthenticated`; substituição `_REACT_APP_GOOGLE_CLIENT_ID` **continua recomendada** no trigger (client id embutido no bundle), mas **não é obrigatória** para o GIS funcionar: o runtime expõe o mesmo valor via **GET** `/api/auth/oauth-client-id` a partir de `GOOGLE_CLIENT_ID` / `REACT_APP_GOOGLE_CLIENT_ID` no contentor (ver §1.2).

### 2.7 Workspace

- `.gitignore` na raiz e em cada projeto inclui `.env`. **Garantir** que nenhum `.env` real é commitado (auditoria por `git status` / revisão de PR, não por histórico neste relatório).

---

## 3. Fase 2 — Segredos (working tree)

- Pesquisa por `mongodb+srv`, chaves `AIza`, `BEGIN PRIVATE KEY` real: **não** foram encontrados literais de produção nos caminhos de código analisados; ocorrências de `BEGIN PRIVATE KEY` referem-se a **deteção de placeholders** ou validação.
- Nomes de secrets e variáveis documentados em [`DEPLOY_LOG.md`](DEPLOY_LOG.md) e docs — adequado como referência operacional.
- **Histórico Git (actualização):** em **2026-04-22** foi executada **redacção** do histórico com `git filter-repo` + **force push** nos repositórios **VeloHub** e **velochat_server** (regras em `git-history-redact-rules.txt` no workspace pai). **Rotação** de credenciais continua recomendada se alguma chave chegou a existir em commits antigos. Após qualquer redacção em massa, validar arranque com **`node --check`** nos entrypoints Node (evitar literais PEM multilinha partidos no código).

---

## 4. Fase 3 — Dependências (`npm audit`, 2026-04-22)

### 4.1 Raiz `dev VeloHub` (frontend + tooling)

- **54 vulnerabilidades** reportadas (11 low, 12 moderate, 30 high, 1 critical na saída da ferramenta).
- Destaques: **react-router / @remix-run/router** (XSS/open redirect); **axios**; **jspdf/dompurify**; **socket.io-parser**; **xlsx** (**sem fix** disponível no ecossistema atual); cadeia **react-scripts** / webpack / jest (muitas transitivas de **dev**).
- **Plano sugerido**: ver **§1.1**; `npm audit fix` sem `--force` numa branch de testes.

### 4.2 `dev VeloHub/backend`

- **12 vulnerabilidades** (6 low, 2 moderate, 4 high).
- Destaques: **express** / **path-to-regexp** / **qs** / **body-parser**; **@google-cloud/storage** → **teeny-request** / **http-proxy-agent**; **xlsx** sem fix; **fast-xml-parser** (high).

### 4.3 `dev - VeloChat Server`

- **9 vulnerabilidades** (5 low, 1 moderate, 2 high, **1 critical**).
- **fast-xml-parser** marcado como crítico na árvore actual; **socket.io-parser** high; mesma família **express**/**qs**.

**Nota:** priorizar correções em **dependências de runtime** e CVEs com exploit público; validar sempre com testes integrados.

---

## 5. Fases 4–6 — Observações consolidadas

### 5.1 Autenticação e autorização

- **VeloHub**: sessão baseada em `hub_sessions` + header `x-session-id` (Ouvidoria/Sociais). Resto da API depende de implementação por rota — **risco arquitectural P1** se o serviço for alcançável sem camada perimetral (API Gateway, IAP, mTLS).
- **VeloChat**: validação por rota com `validateSession` — bom padrão; alinhar VeloHub gradualmente **só com aprovação** para não quebrar clientes.

### 5.2 CORS

- VeloHub permite vários `localhost` — OK para desenvolvimento; em produção, considerar lista mínima via `CORS_ORIGIN` + domínios fixos (mudança comportamental — aprovar).

### 5.3 Frontend

- `localStorage` para `velohub_session_id` e chaves de sessão — mitigar com CSP, sanitização rigorosa, e revisão de dependências XSS (ver `npm audit`).

### 5.4 Infraestrutura

- **GCP**: confirmar IAM do Cloud Build e service account do Cloud Run (least privilege), secrets montados, TLS terminado no Google.
- **Atlas**: TLS, lista de IPs / VPC, utilizador só read/write nas DB necessárias (checklist operacional; sem alteração de schema).

---

## 6. Plano de remediação sugerido (por aprovação)

| ID | Severidade | Acção | Impacto API/schema |
|----|------------|--------|---------------------|
| R1 | P0 | Plano de upgrade de dependências (fases: audit fix, depois majors) + tratamento específico **xlsx** — **§1.1** | Baixo se só versões patch |
| R2 | P1 | ~~Reduzir/remover logs completos de `/api/chatbot/ask`~~ | **Feito** v2.50.4 |
| R3 | P1 | ~~Remover instrumentação `127.0.0.1:7243/7244` e paths locais~~ | **Feito** (ver §1.2) |
| R4 | P1 | Desenho de **authZ uniforme** (ex.: middleware de sessão por prefixo) para escalações — **aprovação obrigatória** | Pode alterar clientes não autenticados |
| R5 | P2 | Rate limiting / helmet em Express | Pode afetar clientes agressivos |
| R6 | P2 | CSP e revisão XSS no React | Front apenas |
| R7 | — | ~~Histórico Git: filter-repo + force push~~ | **Feito** 2026-04-22 (VeloHub + velochat_server); manter política para incidentes futuros |
| R8 | P2 | ~~Ouvidoria anexos: email só da sessão~~ | **Feito** v1.1.0 |

---

## 7. Próximos passos

1. Executar **§1.1** (dependências) numa branch dedicada e registar resultados.
2. Rever **R4** se desejado endurecimento das Escalações na borda da API.
3. Manter [`DEPLOY_LOG.md`](DEPLOY_LOG.md) actualizado **antes** de cada push real (prática seguida nas entregas de 2026-04-22).
4. Repetir auditoria após mudanças grandes ou trimestralmente.

---

## 8. Actualizações posteriores à versão v1.1.0 deste relatório

Cronologia consolidada das alterações de segurança, compliance e robustez **depois** da redacção inicial do documento (v1.1.0). Nenhuma alteração a **schemas MongoDB** nem a contratos de **endpoints existentes** (método/rota/resposta), excepto **adição** do GET `/api/auth/oauth-client-id`.

| Área | Acção | Notas / versões |
|------|--------|------------------|
| **Repositório / histórico** | `git filter-repo --force --replace-text` (VeloHub, velochat_server) | Regras: URIs MongoDB, chaves estilo API, PEM; ficheiro `git-history-redact-rules.txt`; force push `main`; clones antigos invalidados. |
| **Regressão código (PEM)** | Literais multilinha inválidos após redacção | `server.js` (vários blocos) e `anexos.js` **v1.1.1**: `includes('REDACTED')` em vez de string PEM partida. |
| **Cloud Run — arranque** | `SyntaxError` / porta 8080 | `server.js` **v2.50.5+**: `app.listen` no fim; Ouvidoria/Sociais sem `throw` no registo; `process.on` cedo. |
| **OAuth / GIS** | Client id no runtime vs build CRA | **GET** `/api/auth/oauth-client-id`; env: `REACT_APP_GOOGLE_CLIENT_ID` \|\| `GOOGLE_CLIENT_ID` \|\| `GOOGLE_OAUTH_CLIENT_ID`; normalização; `LoginPage` **v3.0.5** same-origin + prioridade API; `google-config.js` **v1.3.3**; `server.js` **v2.50.9**. |
| **Rastreio** | [`DEPLOY_LOG.md`](DEPLOY_LOG.md) | Entradas de push e alterações locais (ex.: v1.1.26). |

**Risco residual:** dependências (§1.1, §4) e autorização uniforme nas Escalações (**R4**) permanecem como trabalho principal; o OAuth Web Client ID exposto por GET é **intencional** (equivalente ao visível no bundle) e **não** substitui protecção das rotas com dados sensíveis.

---

*Documento gerado como entregável do plano de auditoria de segurança; não substitui penetration test nem revisão IAM manual no GCP.*
