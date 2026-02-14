# CCH-004: Aba de Metas - Seguidores por Rede e Perfil

**Story ID:** `CCH-004`
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
| **task_name** | Nova aba de Metas com goals de seguidores por rede/perfil |
| **status** | `in-progress` |
| **responsible_executor** | @saas-engineer |
| **execution_type** | Agent |
| **input** | SocialAccount (followersCount), design system |
| **output** | Nova página /goals, API CRUD, migration Prisma |
| **action_items** | 7 steps |
| **acceptance_criteria** | 7 criteria |

---

## Overview

O aplicativo não tem funcionalidade de metas dinâmicas. Existe apenas uma meta hardcoded de 16 posts/mês no Dashboard. O usuário quer uma **aba dedicada** onde possa definir metas de **seguidores** por **rede social** e por **perfil**, acompanhar o progresso visual e ver histórico.

**Funcionalidades:**
- Criar metas de seguidores para cada perfil conectado
- Ver progresso atual vs meta (barra de progresso)
- Histórico de evolução de seguidores (gráfico de linha)
- Dashboard de metas com cards por perfil
- Metas com prazo (mensal, trimestral, anual, custom)

---

## Input

- **social_account_model** (schema) - `SocialAccount` em `prisma/schema.prisma`
- **design_system** (css) - `src/app/globals.css`
- **sidebar** (component) - `src/components/sidebar.tsx`
- **mobile_nav** (component) - `src/components/mobile-bottom-nav.tsx`

---

## Output

- **goal_model** (migration) - Tabela `Goal` no Prisma
- **follower_snapshot** (migration) - Tabela `FollowerSnapshot` para histórico
- **goals_api** (code) - `/api/goals` CRUD + `/api/goals/progress`
- **goals_page** (page) - `/goals/page.tsx` com cards e gráficos
- **goals_store** (store) - Zustand store para goals
- **snapshot_cron** (code) - Registro diário de followersCount

---

## Action Items

### Step 1: Criar Models no Prisma
- [x] Adicionar model `Goal`:
  ```prisma
  model Goal {
    id              String        @id @default(cuid())
    socialAccountId String
    metricType      String        // "followers" | "views" | "engagement"
    targetValue     Int
    currentValue    Int           @default(0)
    startValue      Int           @default(0)
    period          String        // "monthly" | "quarterly" | "yearly" | "custom"
    startDate       DateTime      @default(now())
    endDate         DateTime
    status          String        @default("active") // "active" | "achieved" | "expired"
    createdAt       DateTime      @default(now())
    updatedAt       DateTime      @updatedAt

    socialAccount   SocialAccount @relation(fields: [socialAccountId], references: [id], onDelete: Cascade)
  }
  ```
- [x] Adicionar model `FollowerSnapshot`:
  ```prisma
  model FollowerSnapshot {
    id              String        @id @default(cuid())
    socialAccountId String
    followersCount  Int
    snapshotDate    DateTime      @default(now())

    socialAccount   SocialAccount @relation(fields: [socialAccountId], references: [id], onDelete: Cascade)

    @@unique([socialAccountId, snapshotDate])
  }
  ```
- [x] Adicionar relações em `SocialAccount`: `goals Goal[]`, `followerSnapshots FollowerSnapshot[]`
- [ ] Rodar migration: `npx prisma migrate dev --name add-goals-and-snapshots` (pendente - sera executada manualmente)

### Step 2: Criar API CRUD `/api/goals`
- [x] `GET /api/goals` - Listar goals com progresso calculado
  - Join com SocialAccount para pegar followersCount atual
  - Calcular `progress = ((current - start) / (target - start)) * 100`
  - Incluir info do perfil (username, platform, avatar)
- [x] `POST /api/goals` - Criar nova meta
  - Body: `{ socialAccountId, metricType, targetValue, period, endDate }`
  - Auto-preencher `startValue` e `currentValue` do followersCount atual
- [x] `PATCH /api/goals/[id]` - Atualizar meta (target, period, endDate)
- [x] `DELETE /api/goals/[id]` - Remover meta

### Step 3: Criar API `/api/goals/progress`
- [x] `GET /api/goals/progress?accountId=X` - Histórico de seguidores
- [x] Buscar FollowerSnapshots dos últimos 90 dias
- [x] Retornar série temporal para gráfico de linha
- [x] Incluir meta target como linha horizontal de referência

### Step 4: Criar Snapshot Cron
- [x] Adicionar ao cron existente (`/api/cron/sync-all` do CCH-002) ou criar `/api/cron/snapshot`
- [x] Para cada SocialAccount ativa:
  - Salvar FollowerSnapshot com followersCount atual
  - Atualizar `currentValue` em Goals ativos
  - Marcar Goals que atingiram target como `status: "achieved"`
  - Marcar Goals com endDate passada como `status: "expired"`
- [x] Executar 1x por dia (não precisa ser a cada 15 min)

### Step 5: Criar Goals Page `/goals`
- [x] Criar `src/app/goals/page.tsx`
- [x] **Header**: "Metas" + botão "Nova Meta"
- [x] **Cards de progresso** (1 por goal ativo):
  - Avatar + username + badge da plataforma
  - Barra de progresso linear
  - Atual / Meta (ex: "12.5k / 15k seguidores")
  - % progresso + diferença faltante
  - Prazo restante (ex: "23 dias restantes")
  - Status badge (ativo, atingido, expirado)
- [x] **Gráfico de evolução**: Line chart (Recharts) com histórico
  - Linha de dados reais + linha pontilhada da meta (ReferenceLine)
  - Selector de período (30d, 60d, 90d)
- [x] **Modal "Nova Meta"**:
  - Select de perfil (dropdown com contas conectadas)
  - Tipo de métrica: Seguidores (futuro: views, engagement)
  - Valor alvo (input numérico)
  - Período: Mensal / Trimestral / Anual / Custom
  - Data final (date picker)
- [x] **Filtros**: por plataforma, por perfil

### Step 6: Criar Goals Store (Zustand)
- [x] Criar `src/stores/goals-store.ts`
- [x] State: `goals`, `snapshots`, `loading`, `selectedAccountId`
- [x] Actions: `fetchGoals()`, `createGoal(data)`, `updateGoal(id, data)`, `deleteGoal(id)`, `fetchProgress(accountId)`

### Step 7: Adicionar na Navegação
- [x] Adicionar item "Metas" no sidebar (`src/components/ui/sidebar.tsx`)
  - Ícone: `Target` do lucide-react
  - Posição: após "Métricas"
- [x] Adicionar no mobile bottom nav (`src/components/ui/mobile-bottom-nav.tsx`)
- [ ] Adicionar no search command palette (search palette busca apenas posts, sem sistema de quick links)

---

## Acceptance Criteria

- [x] **AC-1:** Usuário consegue criar meta de seguidores para qualquer perfil conectado
- [x] **AC-2:** Card de progresso mostra valor atual, meta e % de progresso corretos
- [x] **AC-3:** Gráfico de evolução mostra histórico de seguidores ao longo do tempo
- [x] **AC-4:** Metas atingidas são automaticamente marcadas como "achieved"
- [x] **AC-5:** Filtro por plataforma e por perfil funciona na página de metas
- [x] **AC-6:** Navegação lateral e mobile incluem link para "Metas"
- [x] **AC-7:** Página é responsiva e segue Apple HIG design system

---

## Quality Gate

| Check | Criteria |
|-------|----------|
| **CRUD funcional** | Create, Read, Update, Delete goals via API |
| **Progresso correto** | % calculado corretamente (start, current, target) |
| **Gráfico** | Line chart renderiza com dados reais |
| **Auto-update** | Cron atualiza currentValue diariamente |
| **Responsivo** | Mobile funcional (320px+) |
| **Apple HIG** | Visual consistente com design system |
| **TypeScript** | Zero erros de tipo |

---

## Handoff

| Attribute | Value |
|-----------|-------|
| **Next Task** | CCH-005 (Dashboard date filter) |
| **Trigger** | Goals page funcional |
| **Executor** | @saas-qa (Lens) + @saas-designer (Hue) review |
| **Dependency** | CCH-002 (cron para snapshot diário) |
