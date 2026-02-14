# CCH-002: Auto-Sync ao Publicar Novo Post em Qualquer Rede/Perfil

**Story ID:** `CCH-002`
**Pattern:** HO-TP-001
**Version:** 1.0
**Squad:** SaaS Squad
**Primary Agent:** @saas-engineer (Forge)
**Support Agent:** @saas-infra (Vault)
**Priority:** High
**Type:** Feature

---

## Task Anatomy

| Field | Value |
|-------|-------|
| **task_name** | Auto-sync de posts em todas as redes e perfis |
| **status** | `in-progress` |
| **responsible_executor** | @saas-engineer |
| **execution_type** | Agent |
| **input** | APIs de webhooks Instagram/TikTok, sync endpoints existentes |
| **output** | Sistema de sync automático multi-plataforma |
| **action_items** | 7 steps |
| **acceptance_criteria** | 6 criteria |

---

## Overview

Atualmente o sync de posts é **manual** (botão na página /social) ou **on-mount** (ao abrir /metrics). O usuário quer que toda vez que publicar um post novo no Instagram ou TikTok, os dados sincronizem automaticamente com o aplicativo, sem precisar abrir nenhuma página ou clicar botão.

**Abordagem técnica (2 estratégias combinadas):**

### Estratégia 1: Webhooks (Real-time) - Preferencial
- **Instagram**: Meta Webhooks API - subscribe to `feed` field changes
- **TikTok**: TikTok Webhooks - subscribe to `video.publish` events

### Estratégia 2: Polling via Cron (Fallback confiável)
- **Vercel Cron Jobs** (`vercel.json`) - executar sync a cada 15-30 minutos
- Garante sync mesmo se webhooks falharem
- Mais simples de implementar e manter

### Decisão recomendada
Implementar **Cron Polling primeiro** (mais confiável e simples) + **Webhooks depois** como otimização. Webhooks do Meta requerem App Review e HTTPS callback verificado.

---

## Input

- **instagram_sync** (file) - `src/app/api/social/instagram/sync/route.ts`
- **tiktok_sync** (file) - `src/app/api/social/tiktok/sync/route.ts`
- **social_accounts** (file) - `src/app/api/social/accounts/route.ts`
- **prisma_schema** (file) - `prisma/schema.prisma`
- **vercel_config** (file) - `vercel.json` (criar se não existe)

---

## Output

- **cron_endpoint** (code) - `/api/cron/sync-all` - endpoint para Vercel Cron
- **webhook_endpoints** (code) - `/api/webhooks/instagram`, `/api/webhooks/tiktok`
- **vercel_cron_config** (config) - `vercel.json` com cron schedule
- **sync_log** (schema) - Tabela `SyncLog` para rastrear execuções
- **updated_schema** (migration) - Migration com nova tabela

---

## Action Items

### Step 1: Criar Tabela SyncLog (Prisma Migration)
- [x] Adicionar model `SyncLog` ao schema:
  ```prisma
  model SyncLog {
    id            String   @id @default(cuid())
    accountId     String
    platform      String
    trigger       String   // "cron" | "webhook" | "manual"
    postsFound    Int      @default(0)
    postsSynced   Int      @default(0)
    status        String   // "success" | "error" | "partial"
    errorMessage  String?
    duration      Int      @default(0) // ms
    createdAt     DateTime @default(now())

    account       SocialAccount @relation(fields: [accountId], references: [id])
  }
  ```
- [x] Adicionar relação em `SocialAccount`: `syncLogs SyncLog[]`
- [x] Criar migration SQL em `prisma/migrations/20260214_add_sync_log/migration.sql`

### Step 2: Refatorar Sync Logic para Função Reutilizável
- [x] Extrair lógica de sync do Instagram para `src/lib/sync/instagram-sync.ts`
- [x] Extrair lógica de sync do TikTok para `src/lib/sync/tiktok-sync.ts`
- [x] Criar `src/lib/sync/sync-all.ts` que sincroniza TODAS as contas ativas
- [x] Cada sync deve:
  - Verificar token válido (auto-refresh se necessário)
  - Buscar posts novos (desde `lastSyncAt`)
  - Upsert em PostMetrics
  - Atualizar `lastSyncAt` na SocialAccount
  - Criar registro em SyncLog
  - Retornar resultado tipado

### Step 3: Criar Endpoint Cron `/api/cron/sync-all`
- [x] Criar `src/app/api/cron/sync-all/route.ts`
- [x] Proteger com header `Authorization: Bearer ${CRON_SECRET}`
- [x] Buscar todas as `SocialAccount` com `isActive: true` e `autoSync: true`
- [x] Executar sync em paralelo (Promise.allSettled)
- [x] Logar resultados em SyncLog
- [x] Timeout: 55 segundos (Vercel Pro = 60s max)
- [x] Retornar summary: `{ total, synced, failed, errors }`

### Step 4: Configurar Vercel Cron
- [x] Criar/atualizar `vercel.json`:
  ```json
  {
    "crons": [
      {
        "path": "/api/cron/sync-all",
        "schedule": "*/15 * * * *"
      }
    ]
  }
  ```
- [ ] Adicionar `CRON_SECRET` nas env vars do Vercel (acao manual no dashboard Vercel)
- [x] Documentar que Vercel Hobby = 1 cron/dia, Pro = unlimited (no codigo via TODO)

### Step 5: Criar Webhook Endpoint Instagram (Futuro - v2)
- [ ] Criar `src/app/api/webhooks/instagram/route.ts` -- **DEFERRED TO v2**
- [ ] Implementar verificação de webhook (GET - challenge)
- [ ] Implementar handler de eventos (POST - feed changes)
- [ ] Validar `X-Hub-Signature-256` header
- [ ] Triggar sync da conta específica ao receber evento
- [ ] NOTA: Requer Meta App Review - marcar como v2
> **TODO marcado nos arquivos de sync** (`sync-all.ts`, `cron/sync-all/route.ts`)

### Step 6: Criar Webhook Endpoint TikTok (Futuro - v2)
- [ ] Criar `src/app/api/webhooks/tiktok/route.ts` -- **DEFERRED TO v2**
- [ ] Implementar handler de eventos `video.publish`
- [ ] Validar assinatura do webhook
- [ ] Triggar sync da conta específica
- [ ] NOTA: Requer TikTok Developer Portal config - marcar como v2
> **TODO marcado nos arquivos de sync** (`sync-all.ts`, `cron/sync-all/route.ts`)

### Step 7: UI - Indicador de Sync Status
- [x] Adicionar badge "Auto-sync ativo" nas contas em `/social`
- [x] Mostrar timestamp do último sync automático
- [x] Toggle switch para ativar/desativar auto-sync por conta
- [x] Toast notification quando auto-sync é ativado/desativado
- [ ] Adicionar página/seção de "Sync Logs" em settings (backlog -- dados ja estao na tabela)

---

## Acceptance Criteria

- [x] **AC-1:** Posts novos publicados no Instagram aparecem automaticamente no app em até 15 minutos (via cron)
- [x] **AC-2:** Posts novos publicados no TikTok aparecem automaticamente no app em até 15 minutos (via cron)
- [x] **AC-3:** Sync automático funciona para TODAS as contas ativas com `autoSync: true`
- [x] **AC-4:** Cada execução de sync é logada na tabela `SyncLog` com detalhes
- [x] **AC-5:** Tokens expirados são automaticamente refreshed durante o cron
- [x] **AC-6:** Falha em uma conta NÃO bloqueia sync das outras (Promise.allSettled)

---

## Quality Gate

| Check | Criteria |
|-------|----------|
| **Cron funcional** | Endpoint responde 200 com summary |
| **Multi-conta** | Sync funciona com 2+ contas simultâneas |
| **Token refresh** | Auto-refresh durante cron sem falha |
| **Error handling** | Falha isolada por conta, sem crash geral |
| **TypeScript** | Zero erros de tipo |
| **Security** | CRON_SECRET validado, webhook signatures verificadas |

---

## Handoff

| Attribute | Value |
|-----------|-------|
| **Next Task** | CCH-003 (Calendário) - dados de sync alimentam o calendário |
| **Trigger** | Cron sync funcional em staging |
| **Executor** | @saas-qa (Lens) para validação |
| **Dependency** | CCH-001 deve estar resolvido (sync base funcional) |
