# 📋 DEPLOY LOG - VeloHub V3
<!-- VERSION: v1.0.0 | DATE: 2025-09-18 | AUTHOR: VeloHub Development Team -->

## 🚀 **DEPLOYS E PUSHES REALIZADOS**

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
