# CCH-005: Filtro de Datas no Dashboard

**Story ID:** `CCH-005`
**Pattern:** HO-TP-001
**Version:** 1.0
**Squad:** SaaS Squad
**Primary Agent:** @saas-engineer (Forge)
**Support Agent:** @saas-designer (Hue)
**Priority:** Medium
**Type:** Feature

---

## Task Anatomy

| Field | Value |
|-------|-------|
| **task_name** | Adicionar filtro de datas nas métricas do Dashboard |
| **status** | `done` |
| **responsible_executor** | @saas-engineer |
| **execution_type** | Agent |
| **input** | Dashboard page, API stats, design system |
| **output** | Dashboard com date picker e métricas filtradas |
| **action_items** | 5 steps |
| **acceptance_criteria** | 5 criteria |

---

## Overview

O Dashboard atual mostra métricas fixas do **mês atual** (hardcoded). O usuário quer poder filtrar as métricas por período: últimos 7 dias, 30 dias, 90 dias, este mês, mês anterior, ou range customizado.

**Métricas afetadas pelo filtro:**
- Posts publicados no período (card "Posts este Mês" → "Posts no Período")
- Consistência (recalcular para o período selecionado)
- Social Metrics (views, likes, comments, shares) - filtrar PostMetrics por data
- Mix de Conteúdo (distribuição por pilar no período)
- Consistency Heatmap (ajustar range visual)

---

## Input

- **dashboard_page** (file) - `src/app/page.tsx`
- **dashboard_stats_api** (file) - `src/app/api/dashboard/stats/route.ts`
- **design_system** (css) - `src/app/globals.css`
- **metrics_page_reference** (file) - `src/app/metrics/page.tsx` (já tem filtros de data)

---

## Output

- **date_filter_component** (component) - Componente reutilizável de filtro de datas
- **updated_dashboard_api** (code) - API stats aceitando date range params
- **updated_dashboard** (page) - Dashboard com filtro integrado

---

## Action Items

### Step 1: Criar Componente DateRangeFilter
- [x] Criar `src/components/dashboard/date-range-filter.tsx`
- [x] Presets rápidos (pill buttons / segmented control):
  - `7d` - Últimos 7 dias
  - `30d` - Últimos 30 dias (default)
  - `90d` - Últimos 90 dias
  - `Este mês` - Mês atual
  - `Mês anterior` - Mês passado
  - `Custom` - Abre date picker
- [x] Date picker custom com data início e data fim
- [x] Design Apple HIG: segmented control para presets, popover para custom
- [x] Callback `onChange(startDate, endDate)` para componente pai
- [x] Exportar tipo `DateRange = { start: Date, end: Date, preset: string }`
- [x] NOTA: Reutilizar padrão da página /metrics se já existir componente similar

### Step 2: Atualizar API `/api/dashboard/stats`
- [x] Aceitar query params: `startDate` e `endDate` (ISO strings)
- [x] Se não fornecidos, default = mês atual (backward compatible)
- [x] Ajustar queries Prisma:
  - Posts: `WHERE createdAt >= startDate AND createdAt <= endDate`
  - PostMetrics: `WHERE publishedAt >= startDate AND publishedAt <= endDate`
  - Consistência: calcular para semanas dentro do range
  - Mix de conteúdo: filtrar posts por pilar no período
- [x] Ajustar label dinâmico: "Posts este Mês" → "Posts no Período"
- [x] Retornar `dateRange` no response para confirmação

### Step 3: Integrar Filtro no Dashboard
- [x] Adicionar DateRangeFilter no topo do Dashboard (abaixo do header)
- [x] State local ou store: `selectedDateRange`
- [x] Ao mudar filtro: re-fetch `/api/dashboard/stats?startDate=X&endDate=Y`
- [x] Loading skeleton nos cards durante fetch
- [x] Preservar filtro durante a sessão (não resetar ao navegar)

### Step 4: Ajustar Cards do Dashboard
- [x] **Card "Posts"**: label dinâmico baseado no período
  - 7d → "Posts ultimos 7 dias"
  - 30d → "Posts ultimos 30 dias"
  - Mês → "Posts em Fevereiro"
  - Custom → "Posts 01/01 - 15/02"
- [x] **Card "Consistência"**: recalcular para o período
- [x] **Cards Social Metrics**: filtrar PostMetrics pelo range
- [x] **Card "Mix de Conteúdo"**: recalcular distribuição no período
- [x] **Heatmap**: ajustar range visual do heatmap
- [x] **Próximos Posts**: manter sempre futuro (não afetado pelo filtro)

### Step 5: Testes e Polish
- [x] Verificar que todos os cards atualizam ao mudar filtro
- [x] Verificar que presets calculam datas corretas (timezone local)
- [x] Verificar que range customizado funciona com date picker
- [x] Verificar responsividade do filtro no mobile
- [x] Verificar que filtro "Mês anterior" mostra dados corretos
- [x] Performance: fetch não deve demorar > 1s

---

## Acceptance Criteria

- [x] **AC-1:** Dashboard tem seletor de período visível no topo
- [x] **AC-2:** Presets (7d, 30d, 90d, este mês, mês anterior) funcionam corretamente
- [x] **AC-3:** Range customizado com date picker funciona
- [x] **AC-4:** Todos os cards de métricas atualizam ao mudar o filtro
- [x] **AC-5:** Labels dos cards refletem o período selecionado

---

## Quality Gate

| Check | Criteria |
|-------|----------|
| **Filtros corretos** | Cada preset retorna dados do período certo |
| **Custom range** | Date picker retorna range válido |
| **Cards atualizados** | Todos os 7+ cards refletem o filtro |
| **Performance** | Re-fetch < 1s ao mudar filtro |
| **Responsivo** | Filtro funciona no mobile |
| **Apple HIG** | Segmented control consistente com design system |
| **Backward compatible** | Sem params = mês atual (comportamento original) |
| **TypeScript** | Zero erros de tipo |

---

## File List

| File | Action | Description |
|------|--------|-------------|
| `src/components/dashboard/date-range-filter.tsx` | Created | Componente reutilizavel de filtro de datas com segmented control Apple HIG |
| `src/app/api/dashboard/stats/route.ts` | Modified | Aceita startDate/endDate query params, filtra todas as queries por range |
| `src/app/page.tsx` | Modified | Integra DateRangeFilter, labels dinamicos em todos os cards |

---

## Handoff

| Attribute | Value |
|-----------|-------|
| **Next Task** | Nenhum (último da batch) |
| **Trigger** | Dashboard com filtros funcional |
| **Executor** | @saas-qa (Lens) para validação final |
| **Dependency** | CCH-001 (dados de métricas corretos) |
