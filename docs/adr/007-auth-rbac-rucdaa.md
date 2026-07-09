# ADR-007: Authentication (local + Google) + RUCDAA Authorization + Session Policy

- **Status**: Accepted
- **Date**: 2026-07-09
- **Deciders**: Tech-Lead (design), Pond (auth + session answers, NFR 2026-07-08)
- **Scope**: AuthN/AuthZ for all of `erp-v2-ui-first`

## สรุป (สำหรับผู้อ่านที่ไม่ใช่ engineer)
เข้าระบบได้ 2 ทาง: (1) username/password ที่สร้างในระบบเอง หรือ (2) ปุ่ม **Login with Google**
โดย Admin เป็นคนผูกบัญชี Google เข้ากับ user ในหน้าตั้งค่า. เรื่องสิทธิ์ใช้ **RUCDAA** = แต่ละ
role กำหนดได้ราย module ว่าทำอะไรได้บ้าง 6 อย่าง: อ่าน(R)/แก้(U)/สร้าง(C)/ลบ(D)/อนุมัติ(A)/
สิทธิ์พิเศษ Admin(A) — เช่นปลด blacklist, reopen PO, archive trace ต้องมีบิต Admin. Session
(การล็อกอินค้างไว้) หมดอายุใน 24 ชม. และ **ทุกเช้า 06:00 ระบบเตะออกทั้งหมดให้ล็อกอินใหม่**
ตามที่ปอนด์กำหนด. รหัสผ่านเก็บแบบเข้ารหัส (bcrypt) ไม่เคยเก็บเป็นตัวอักษรจริง.

## Context

Pond answers: create local accounts (MySQL) **and** support Google Login, with the user linked
in the admin page; session expires 24h **and** all sessions are force-reset every day at 06:00.
Authorization = RUCDAA per module (`status-journeys.md` §9): Read, Update, Create, Delete,
Approve, **Admin**. Roles are unlimited; users sit under a role. The `Read` bit also drives
notification visibility (ADR-005). Special capabilities (reassign customer, archive trace, unban
blacklist, status force-override, PO cancel/reopen, undelete) require the **Admin** bit.

## Decision

### Authentication
- **Local**: username + bcrypt(password). No plaintext ever stored; password fields are on the
  audit-exclude list (ADR-003).
- **Google**: OAuth 2.0 / OIDC. Admin links a Google `sub`/email to an existing user in Settings;
  login matches on the verified Google identity. (Phase 2 local still needs outbound internet for
  Google's endpoints — acceptable per Pond's choice.)
- On success the server issues a **JWT access token** (24h `exp`) carrying `user_id`, `role_id`,
  and `iat`.

### Session policy (24h + daily 06:00 reset)
- A global `session_epoch` timestamp is stored server-side and **advanced to 06:00 every day**
  by a scheduler. A token is valid only if `iat >= session_epoch` **and** not past its 24h `exp`.
  This forces every user to re-login after 06:00 without tracking per-session rows.
- (Night-shift note: this logs everyone out at 06:00 including an active night shift — flagged to
  BA/PO as a UX confirmation; the mechanism honors Pond's rule as stated.)

### Authorization (RUCDAA)
- Tables: `role`, `role_permission(role_id, module, r, u, c, d, approve, admin)`, `user(role_id,
  ...)`. Roles unlimited; company profile in Settings.
- A global **`RbacGuard`** (NestJS) checks the required bit for each endpoint/action (read =R,
  create =C, update =U, delete =D, approve/transition =A, special/override/undelete =Admin).
  Frontend hides controls the user lacks, but the **server is authoritative** — never trust the
  client.
- Roles seeded: Sale, Sale Manager, Stock, Production, QA/QC, Shipping, Finance, Super User,
  System Admin (mockup Settings). Super User = trace archive; Sale Manager = reassign + team
  dashboard + set Follow-up.

## Alternatives considered

- **Session table per login** instead of `session_epoch`: works but adds a hot table and cleanup;
  the epoch trick meets "24h + 06:00 reset" with far less machinery.
- **Google-only or password-only**: rejected — Pond wants both.
- **Permissions as a bitmask integer**: compact but unreadable in DB/audit; explicit boolean
  columns are clearer for a Pond-reviewed schema and for the Settings matrix.

## Consequences

- One guard enforces RUCDAA everywhere; adding the `Admin` bit gates all special capabilities
  consistently.
- The `Read` bit doubles as notification scope (ADR-005) — single source for "who can see this".
- Daily 06:00 re-login is a one-line scheduler + one comparison; no session GC.
- Google OAuth requires a GCP OAuth client even in Phase 2 (env secret via ADR-006-style config).
