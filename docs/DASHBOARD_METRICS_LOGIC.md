# Lógica de Cálculo dos Cards do Dashboard - Módulo Bacen & N2

## Versão: v1.4.0 | Data: 2026-02-26

Este documento explica a lógica de cálculo de cada métrica exibida no dashboard.

---

## LINHA 1: Métricas Gerais

### 1. Total de Reclamações
**Cálculo:** `total = todas.length` onde `todas = [...bacen, ...n2Pix]`
- **Fonte:** Soma de todas as reclamações das coleções `reclamacoes_bacen` + `reclamacoes_n2Pix`
- **Filtro aplicado:** `createdAt` dentro do período selecionado (se houver filtro de data)
- **Razão:** Contagem total de reclamações registradas no sistema no período (BACEN + N2 Pix)
- **✅ CORRIGIDO:** Agora soma corretamente ambas as coleções

### 2. BACEN
**Cálculo:** `totalBacen = bacen.length`
- **Fonte:** Apenas coleção `reclamacoes_bacen`
- **Filtro aplicado:** `createdAt` dentro do período selecionado (se houver filtro de data)
- **Razão:** Contagem de reclamações do tipo BACEN registradas no período

### 3. N2 Pix
**Cálculo:** `totalOuvidoria = n2Pix.length`
- **Fonte:** Apenas coleção `reclamacoes_n2Pix`
- **Filtro aplicado:** `createdAt` dentro do período selecionado (se houver filtro de data)
- **Razão:** Contagem de reclamações do tipo N2 Pix registradas no período
- **✅ CORRIGIDO:** Agora busca da collection correta `reclamacoes_n2Pix`

### 4. Liquidação Antecipada
**Cálculo:** Dupla verificação - filtro por `motivoReduzido` contendo "liquidação antecipada" ou "liquidacao antecipada" (case insensitive) E `statusContratoQuitado === true`
- **Fonte:** Campos `motivoReduzido` e `statusContratoQuitado` de todas as reclamações
- **Condição:** Reclamação é contabilizada quando:
  - `motivoReduzido` contém "liquidação antecipada" ou "liquidacao antecipada" (case insensitive) E
  - `statusContratoQuitado === true`
- **Filtro aplicado:** `createdAt` dentro do período selecionado (se houver filtro de data)
- **✅ CORRIGIDO v1.2.0:** Agora requer dupla verificação: motivo reduzido contém liquidação antecipada E status do contrato é quitado
- **Razão:** Contagem de reclamações cujo motivo reduzido menciona liquidação antecipada E o contrato está efetivamente quitado

---

## LINHA 2: Status e Prazos

### 5. Em Aberto (Em Tratativa)
**Cálculo:** `emTratativa = todas.filter(r => !r.Finalizado || r.Finalizado.Resolvido !== true).length`
- **Fonte:** Campo `Finalizado.Resolvido` de todas as reclamações
- **Condição:** Reclamação está "Em Aberto" quando:
  - `Finalizado` não existe OU
  - `Finalizado.Resolvido !== true`
- **Filtro aplicado:** `createdAt` dentro do período selecionado (se houver filtro de data)
- **Razão:** Contagem de reclamações que ainda não foram marcadas como resolvidas

### 6. Concluída
**Cálculo:** `concluidas = todas.filter(r => r.Finalizado?.Resolvido === true).length`
- **Fonte:** Campo `Finalizado.Resolvido` de todas as reclamações
- **Condição:** Reclamação está "Concluída" quando `Finalizado.Resolvido === true`
- **Filtro aplicado:** `createdAt` dentro do período selecionado (se houver filtro de data)
- **Razão:** Contagem de reclamações marcadas como resolvidas

### 7. Prazo Vencendo
**Cálculo:** Filtro por `prazoBacen` (BACEN) ou `prazoOuvidoria` (N2) entre hoje e amanhã às 23:59:59.999
- **Fonte:** 
  - Campo `prazoBacen` para reclamações BACEN
  - Campo `prazoOuvidoria` para reclamações N2 Pix
- **Condição:** `prazo >= hoje && prazo <= amanhã às 23:59:59.999`
- **Filtro aplicado:** `createdAt` dentro do período selecionado (se houver filtro de data)
- **✅ CORRIGIDO:** 
  - Agora verifica ambos os campos de prazo (BACEN e N2)
  - Ajustado para considerar até 1 dia antes do vencimento (ao invés de 3 dias)
  - Inclui todo o dia de amanhã até 23:59:59.999
- **Razão:** Contagem de reclamações com prazo vencendo hoje ou amanhã (incluindo todo o dia de amanhã até 23:59:59.999)

### 8. Taxa de Resolução
**Cálculo:** `taxaResolucao = Math.round((concluidas / total) * 1000) / 10`
- **Fonte:** `concluidas` e `total` calculados acima
- **Fórmula:** `(Reclamações Concluídas / Total de Reclamações) * 100`, arredondado para 1 casa decimal
- **Filtro aplicado:** `createdAt` dentro do período selecionado (se houver filtro de data)
- **Razão:** Percentual de reclamações resolvidas em relação ao total, exibido com 1 casa decimal (ex: 99.7% ao invés de 100%)
- **✅ ATUALIZADO v1.4.0:** Agora usa 1 casa decimal ao invés de arredondar para inteiro

---

## LINHA 3: Métricas Específicas

### 9. CA e Protocolos
**Cálculo:** Contagem de reclamações onde QUALQUER uma das condições abaixo é verdadeira:
- `acionouCentral === true` OU
- `protocolosCentral.length > 0` OU
- `n2SegundoNivel === true` OU
- `protocolosN2.length > 0` OU
- `reclameAqui === true` OU
- `protocolosReclameAqui.length > 0` OU
- `procon === true` OU
- `protocolosProcon.length > 0`

**✅ CORRIGIDO:** 
- Agora usa apenas os campos corretos do schema:
  - `acionouCentral` (Boolean)
  - `n2SegundoNivel` (Boolean)
  - `reclameAqui` (Boolean)
  - `procon` (Boolean)
  - Arrays de protocolos correspondentes
- Removidos campos inexistentes ou incorretos

**Filtro aplicado:** `createdAt` dentro do período selecionado (se houver filtro de data)
**Razão:** Contagem de reclamações que acionaram qualquer canal de atendimento ou protocolo

### 10. Com Procon
**Cálculo:** `comProcon = todas.filter(r => r.procon === true || r.protocolosProcon?.length > 0).length`
- **Fonte:** Campos `procon` (Boolean) e `protocolosProcon` (Array)
- **Condição:** `procon === true` OU `protocolosProcon` tem pelo menos 1 item
- **Filtro aplicado:** `createdAt` dentro do período selecionado (se houver filtro de data)
- **Razão:** Contagem de reclamações que acionaram Procon (checkbox marcado ou protocolo preenchido)

### 11. Média de Prazo
**Cálculo:** Média de dias entre `createdAt` e `Finalizado.dataResolucao` para reclamações concluídas
- **Fonte:** Campos `createdAt` e `Finalizado.dataResolucao`
- **Condição:** Apenas reclamações onde:
  - `Finalizado.Resolvido === true` E
  - Ambos os campos existem E
  - `dataResolucao >= createdAt` (validação para evitar valores negativos)
- **Fórmula:** `somaDias / concluidasComData.length`
  - Onde `somaDias` = soma de `Math.max(0, (dataResolucao - createdAt) / (1000 * 60 * 60 * 24))` para cada reclamação concluída
  - Garante que o resultado nunca seja negativo
- **Filtro aplicado:** `createdAt` dentro do período selecionado (se houver filtro de data)
- **✅ CORRIGIDO:** 
  - Valida que dataResolucao >= createdAt antes de calcular
  - Usa Math.max(0, ...) para garantir resultado não negativo
  - Filtra apenas reclamações com datas válidas
- **Razão:** Média de dias que uma reclamação leva para ser resolvida (do registro até a resolução)

---

## Observações Importantes

1. **Filtro de Data:** Todos os cálculos respeitam o filtro de data aplicado ao campo `createdAt` (data de criação da reclamação)

2. **Campos Removidos:** Os seguintes campos foram removidos do schema e não devem ser usados:
   - `status` (usar `Finalizado.Resolvido` para determinar status)
   - `idSecao` (removido)
   - `deletada` e `deletedAt` (soft delete removido)
   - `mes` (removido)

3. **Correções Aplicadas:**
   - **Prazo Vencendo:** ✅ Agora considera tanto `prazoBacen` quanto `prazoOuvidoria`
   - **CA e Protocolos:** ✅ Corrigido para usar apenas campos corretos do schema
