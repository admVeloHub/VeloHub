# 📋 DEPLOY LOG - VeloHub V3
<!-- VERSION: v1.0.0 | DATE: 2025-09-18 | AUTHOR: VeloHub Development Team -->

## 🚀 **DEPLOYS E PUSHES REALIZADOS**

### **GitHub Push - Implementação Completa VeloBot V2.0**
- **Data/Hora**: 2025-01-27 16:30:00
- **Tipo**: GitHub Push
- **Versão**: VeloBot V2.0.0
- **Commit**: 3861ffe
- **Arquivos Modificados**: 
  - `backend/server.js` (v2.0.0 - endpoint chatbot atualizado)
  - `backend/services/chatbot/openaiService.js` (v2.0.0 - Gemini primário, OpenAI fallback)
  - `backend/services/chatbot/searchService.js` (v2.0.0 - busca híbrida + sites)
  - `backend/services/chatbot/feedbackService.js` (v2.0.0 - métricas aprimoradas)
  - `backend/services/chatbot/logsService.js` (v1.0.0 - novo serviço)
  - `backend/package.json` (novas dependências)
  - `src/App_v2-1.js` (integração melhorias)
- **Arquivos Novos**:
  - `.cursorrules` (diretrizes do projeto)
  - `CHECKLIST_MIGRACAO_GCP.md` (checklist completo)
  - `CHECKLIST_ROCKETCHAT_IMPLEMENTACAO.md` (checklist chat)
  - `LAYOUT_GUIDELINES.md` (diretrizes visuais)
  - `PLANO DE IMPLEMENTAÇÃO BOT V5.ini` (plano executado)
  - `chatbot-vercel/` (protótipo de referência)
- **Descrição**: 
  - Implementação completa do PLANO DE IMPLEMENTAÇÃO BOT V5.0.0
  - Gemini 2.5 Pro configurado como IA primária
  - OpenAI configurado como fallback automático
  - Sistema de busca híbrida (FAQ + Artigos + Sites autorizados)
  - Sistema de desduplicação e menu de esclarecimento
  - Logs detalhados no Google Sheets
  - Métricas de performance do chatbot
  - Integração completa com SSO do VeloHub
- **Status**: ✅ Concluído com sucesso

### **GitHub Push - Correção Sistema Notícias Críticas**
- **Data/Hora**: 2025-09-18 15:45:00
- **Tipo**: GitHub Push
- **Versão**: backend/server.js v1.0.1
- **Commit**: facc15e
- **Arquivos Modificados**: 
  - `backend/server.js` (correção campo isCritical)
- **Descrição**: 
  - Corrigir reconhecimento de notícias críticas com campo isCritical (boolean)
  - Adicionar suporte ao campo isCritical (boolean) no backend
  - Corrigir mapeamento em /api/velo-news e /api/data
  - Resolver problema de novo registro não sendo identificado como crítico
  - Manter compatibilidade com campos legados (alerta_critico, is_critical)
- **Status**: ✅ Concluído com sucesso

---

## 📊 **RESUMO DE ALTERAÇÕES**

### **Problema Identificado**
- Novo registro no MongoDB com `isCritical: true` não estava sendo reconhecido como crítico
- Backend não suportava o formato boolean do campo `isCritical`

### **Solução Implementada**
- Adicionado suporte ao campo `isCritical` (boolean) no backend
- Mantida compatibilidade com campos legados
- Corrigido mapeamento em ambos os endpoints

### **Arquivos Afetados**
- `backend/server.js` - Linhas 116 e 224

---

*Log atualizado automaticamente após push para GitHub*
