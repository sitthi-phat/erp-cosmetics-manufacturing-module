# ADR-002: Backend Framework, ORM, and Frontend Libraries

- **Status**: Accepted
- **Date**: 2026-07-09
- **Deciders**: Tech-Lead
- **Scope**: `erp-v2-ui-first` implementation. Detail decision permitted under ADR-000.

## Context

ADR-000 locks the stack to React + Node.js + MySQL and delegates framework/ORM/UI-library
choices to the Tech-Lead. We need a stable, boring, well-documented set that a mixed AI team can
implement consistently, that runs on a local PC (Phase 2) and lifts to GCP (Phase 3) without
rework, and that supports: transactional multi-table writes (state transitions + ledger + audit
in one tx), row-level locking (gapless counters), and a large clickable UI matching the mockups.

## Decision

| Concern | Choice | Why |
|---|---|---|
| Language | **TypeScript** (FE + BE) | one language, typed contracts shared FE/BE |
| Backend HTTP | **NestJS** (Express platform) | opinionated modular structure (one module per business module), DI, guards for RUCDAA, interceptors for the generic audit + envelope |
| ORM | **Prisma** | typed schema = single DDL source (feeds `db-schema.html`), explicit transactions (`$transaction`), raw SQL escape hatch for `SELECT ... FOR UPDATE` gapless counters and ledger sums |
| DB | **MySQL 8 / InnoDB** (ADR-000) | row locking, CTEs, JSON columns for audit old/new |
| Frontend | **React + Vite + TypeScript** | fast dev; mockups are static HTML to be ported |
| UI kit | **Ant Design (antd)** | matches the mockups' table/form density; humanized Thai labels via a wrapper layer (no raw enums) |
| Data fetching | **TanStack Query** | caching + 15s dashboard auto-refresh (keep-view), pagination |
| Auth token | **JWT (access) + server session-epoch check** | see ADR-007 (24h expiry + 06:00 forced re-login) |
| Validation | **zod** (shared FE/BE schemas) | one validation truth |
| Migrations | **Prisma Migrate** → SQL in `db/migrations/` | reviewable, replayable on local + Cloud SQL |

- **One NestJS module per business module** (customers, po, production, stock, purchase-request,
  goods-receipt, supplier, bom, qc, shipping, invoice, trace, settings, notification, auth).
- Cross-cutting concerns are framework-level, not per-module: `AuditInterceptor` (ADR-003),
  `RbacGuard` (ADR-007), `ResponseEnvelopeInterceptor` (ADR-004), `OutboxService` (ADR-005),
  `StorageService` (ADR-006), `SequenceService` (ADR-008), soft-delete base repository (ADR-009).

## Alternatives considered

- **Plain Express**: rejected — no structure for a 15-module app; we'd rebuild DI/guards/interceptors.
- **Fastify**: viable and fast, but NestJS's guard/interceptor model maps 1:1 onto our cross-cutting
  needs (RBAC, audit, envelope) and is more prescriptive for a multi-author team.
- **TypeORM / Sequelize / Knex**: Prisma's generated types and single-file schema give us a
  cleaner DDL source-of-truth and safer transactions; raw SQL is still available where needed.
- **MUI instead of antd**: antd's dense data-grid/table + form ergonomics better match the ERP
  mockups already delivered.

## Consequences

- Prisma `schema.prisma` becomes the canonical DDL; `db-schema.html` is generated/derived from it,
  keeping one truth (guardrail G1 from prep).
- NestJS guards/interceptors enforce RUCDAA, audit, and envelope **globally** — a module author
  cannot forget them.
- Runs on Node 20 LTS locally and on Cloud Run/GCE + Cloud SQL later with no code change
  (env-config only). Storage/secret access goes through abstractions (ADR-006/007).
- Team must standardize on TS strict mode + zod at the boundary; no `any` at controller edges.
