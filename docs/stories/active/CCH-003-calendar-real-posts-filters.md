# CCH-003: Calendário com Posts Publicados/Agendados + Filtros por Perfil e Rede

**Story ID:** `CCH-003`
**Pattern:** HO-TP-001
**Version:** 1.0
**Squad:** SaaS Squad
**Primary Agent:** @saas-engineer (Forge)
**Support Agent:** @saas-designer (Hue)
**Priority:** High
**Type:** Feature

---

## Task Anatomy

| Field | Value |
|-------|-------|
| **task_name** | Calendário com posts reais e filtros por perfil/rede |
| **status** | `done` |
| **responsible_executor** | @saas-engineer |
| **execution_type** | Agent |
| **input** | Calendar page atual, PostMetrics, SocialAccount |
| **output** | Calendário visual com posts reais, filtros, thumbnails |
| **action_items** | 6 steps |
| **acceptance_criteria** | 7 criteria |

---

## Overview

O calendário atual mostra apenas posts internos do pipeline (IDEA → PUBLISHED). O usuário quer ver visualmente no calendário os posts que foram **publicados nas redes sociais** e os **agendados**, com opção de filtrar por **perfil** (conta) e **rede** (Instagram/TikTok).

**O que muda:**
- Calendário passa a integrar dados de `PostMetrics` (posts das redes) além dos posts internos
- Cada dia mostra thumbnails/cards dos posts publicados naquela data
- Filtros permitem ver: todos, só Instagram, só TikTok, ou perfil específico
- Posts agendados (status SCHEDULED com scheduledDate) continuam aparecendo

---

## Input

- **calendar_page** (file) - `src/app/calendar/page.tsx`
- **calendar_grid** (file) - `src/components/calendar-dnd-grid.tsx`
- **calendar_header** (file) - `src/components/calendar-header.tsx`
- **calendar_post_card** (file) - `src/components/calendar-post-card.tsx`
- **posts_store** (file) - `src/stores/posts-store.ts`
- **post_metrics_model** (schema) - `PostMetrics` em `prisma/schema.prisma`
- **social_account_model** (schema) - `SocialAccount` em `prisma/schema.prisma`

---

## Output

- **calendar_api** (code) - `/api/calendar` - endpoint unificado com filtros
- **calendar_filters** (component) - Componente de filtros (rede + perfil)
- **social_post_card** (component) - Card visual para post de rede social
- **updated_calendar** (page) - Calendário integrado com dados reais
- **calendar_store** (store) - Store com estado de filtros

---

## Action Items

### Step 1: Criar API Endpoint `/api/calendar`
- [x] Criar `src/app/api/calendar/route.ts`
- [x] Query params: `year`, `month`, `platform` (opcional), `accountId` (opcional)
- [x] Buscar posts internos (Post com scheduledDate no mês)
- [x] Buscar PostMetrics com publishedAt no mês
- [x] Unificar em formato calendário: `{ [date]: CalendarEntry[] }`
- [x] CalendarEntry type:
  ```typescript
  type CalendarEntry = {
    id: string
    type: 'internal' | 'social'
    title: string
    platform?: 'instagram' | 'tiktok'
    accountName?: string
    accountId?: string
    thumbnailUrl?: string
    status: string // SCHEDULED, PUBLISHED, etc
    format?: string // REEL, CAROUSEL, STATIC, STORY
    metrics?: { views: number, likes: number, comments: number }
    date: string // ISO date
    postUrl?: string
  }
  ```

### Step 2: Criar Componente de Filtros
- [x] Criar `src/components/calendar/calendar-filters.tsx`
- [x] Dropdown/SegmentedControl para plataforma: Todos | Instagram | TikTok
- [x] Dropdown para perfil: Todos | @perfil1 | @perfil2 (buscar de SocialAccount)
- [x] Filtros persistem no state (não reload ao trocar)
- [x] Ícone da rede ao lado do nome do perfil
- [x] Design Apple HIG: pill buttons ou segmented control

### Step 3: Criar Card Visual para Posts Sociais
- [x] Criar `src/components/calendar/calendar-social-card.tsx`
- [x] Exibir thumbnail do post (imagem pequena)
- [x] Badge da plataforma (Instagram roxo/rosa, TikTok preto)
- [x] Mini métricas: views + likes (ícones pequenos)
- [x] Hover: mostrar mais detalhes (caption preview, all metrics)
- [x] Click: abrir post original na rede social (link externo)
- [x] Responsivo: no mobile mostrar versão compacta

### Step 4: Integrar no Calendar Grid
- [x] Atualizar `calendar-dnd-grid.tsx` para renderizar CalendarEntry[]
- [x] Diferenciar visualmente posts internos vs posts sociais
- [x] Posts internos: manter drag & drop (arrastar = mudar scheduledDate)
- [x] Posts sociais: NÃO arrastáveis (são read-only, publicados na rede)
- [x] Se muitos posts no mesmo dia: mostrar "+3 mais" com expand
- [x] Ordenar por tipo: agendados primeiro, depois publicados

### Step 5: Atualizar Calendar Store
- [x] Criar ou atualizar `src/stores/calendar-store.ts`
- [x] State: `selectedPlatform`, `selectedAccountId`, `calendarEntries`
- [x] Action: `fetchCalendarData(year, month, filters)`
- [x] Action: `setFilter(platform?, accountId?)`
- [x] Integrar com posts-store para posts internos (manter drag & drop)

### Step 6: Atualizar Calendar Page
- [x] Atualizar `src/app/calendar/page.tsx`
- [x] Adicionar CalendarFilters acima do grid
- [x] Buscar dados da nova API ao montar e ao mudar filtros/mês
- [x] Loading skeleton enquanto busca
- [x] Empty state quando nenhum post no mês filtrado
- [x] Mobile: adaptar filtros para collapsible inline

---

## Acceptance Criteria

- [x] **AC-1:** Posts publicados no Instagram aparecem no calendário na data correta
- [x] **AC-2:** Posts publicados no TikTok aparecem no calendário na data correta
- [x] **AC-3:** Posts agendados (internos) continuam visíveis e arrastáveis
- [x] **AC-4:** Filtro por plataforma funciona (Todos/Instagram/TikTok)
- [x] **AC-5:** Filtro por perfil funciona (dropdown com contas conectadas)
- [x] **AC-6:** Posts sociais exibem thumbnail, badge da rede e mini métricas
- [x] **AC-7:** Calendário é responsivo e funciona no mobile

---

## Quality Gate

| Check | Criteria |
|-------|----------|
| **Dados corretos** | Posts aparecem na data certa (timezone correto) |
| **Filtros funcionais** | Combinação plataforma + perfil funciona |
| **Drag & drop** | Posts internos continuam arrastáveis |
| **Read-only sociais** | Posts de redes NÃO são arrastáveis |
| **Performance** | Calendar carrega < 1s com 50+ posts no mês |
| **Responsivo** | Funciona em mobile (320px+) |
| **Apple HIG** | Visual consistente com design system |
| **TypeScript** | Zero erros de tipo |

---

## Handoff

| Attribute | Value |
|-----------|-------|
| **Next Task** | CCH-004 (Metas) |
| **Trigger** | Calendário funcional com filtros |
| **Executor** | @saas-qa (Lens) + @saas-designer (Hue) review visual |
| **Dependency** | CCH-001 (sync funcional para dados existirem) |
