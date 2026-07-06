# ADR-005: Authentication & RBAC — JWT identity + DB-driven Permission with ≤5-min TTL cache

- **สถานะ**: Accepted (แก้ไขตามเงื่อนไข Human Gate 1 — ปอนด์ approve แบบมีเงื่อนไข 2026-07-06)
- **วันที่**: 2026-07-06 (rev.2)
- **ผู้ตัดสินใจ**: Tech-Lead (เสนอ) / ปอนด์ (approve-with-conditions)
- **ขอบเขต**: Epic 8 (User Management/RBAC) + ทุก endpoint/หน้าจอที่ต้องคุมสิทธิ์

## ประวัติการแก้ไข (Revision History)

| rev | วันที่ | สาระ |
|---|---|---|
| 1 | 2026-07-06 | JWT ฝัง permission snapshot ณ login → role/permission change มีผล "login ใหม่/refresh" เท่านั้น |
| **2** | **2026-07-06** | **แก้ตามเงื่อนไข Gate 1 #3: role/permission change ไม่ต้อง revoke session ทันที แต่ต้องมีผลจริงภายใน TTL ≤5 นาที → เลิกฝัง permission ใน token, เปลี่ยนเป็น resolve permission ต่อ request จาก cache TTL ≤5 นาที (source of truth = DB)** |

## บริบท (Context)

- 7 roles, สิทธิ์ต้อง **config ผ่านหน้าจอได้โดยไม่ต้องแก้โค้ด/deploy** (ECP-024) เพราะปรับบ่อยระหว่างสำรวจ user journey
- ต้องกัน config จนไม่มีใครเข้าหน้าจัดการสิทธิ์ได้ (ECP-024 AC2)
- เข้าหน้า/ยิง action ที่ไม่มีสิทธิ์ต้องถูกปฏิเสธแม้เรียก URL ตรง (ECP-016/022/027–033 AC3)
- **เงื่อนไข Gate 1 #3 (ใหม่):** role/permission change **ไม่จำเป็นต้อง revoke session ทันที** แต่
  **ต้องมีผลจริงภายใน TTL ไม่เกิน 5 นาที** — rev.1 (permission snapshot ใน JWT อายุ 8 ชม.) มีผลเฉพาะตอน
  login ใหม่ ซึ่ง **ไม่การันตี ≤5 นาที** จึงต้องแก้

## การตัดสินใจ (Decision — rev.2)

### Authentication: JWT เก็บ "อัตลักษณ์" เท่านั้น (ไม่ฝาก permission)
- Login ตรวจ username/password (hash **bcrypt**) → ออก JWT เก็บใน **httpOnly cookie**
- Token payload = **`user_id` เท่านั้น** (อัตลักษณ์/หลักฐาน auth) — **ไม่ฝัง role_id/permission snapshot อีกต่อไป**
- Session lifetime = config `SESSION_TTL` (default 8 ชม.) — เป็นอายุการล็อกอิน ไม่เกี่ยวกับความสด
  ของสิทธิ์ (แยกคนละเรื่องกับ permission TTL)
- prototype ไม่ทำ refresh-token rotation ซับซ้อน (out-of-scope hardening) — re-login เมื่อ token หมดอายุ

### Authorization: resolve permission ต่อ request จาก cache TTL ≤5 นาที (กลไกตอบเงื่อนไข #3)
- ตาราง `Role` และ `Permission` (mapping `role_id × resource × action → allow/deny`) เป็น **source of truth**
- ทุก request ที่ผ่าน `auth`: resolver โหลด **(role_id ปัจจุบันของ user + permission ของ role นั้น)**
  ผ่าน **in-memory cache keyed by `user_id`** ที่มี **TTL = `PERMISSION_CACHE_TTL`**
  - default = **60 วินาที**, **บังคับเพดานสูงสุด 300 วินาที (5 นาที)** ใน config loader (ถ้าตั้งเกินให้ clamp เป็น 300)
  - cache miss/expired → query DB ใหม่แล้ว cache ใหม่
- **`requirePermission(resource, action)` middleware** เช็คจาก permission ที่ resolve มา (ไม่ใช่จาก token)
- **เหตุผลที่ ≤5 นาทีเป็นจริง:** cache เก็บสิทธิ์ที่ derive จาก DB นานสุด = TTL → เมื่อ Admin เปลี่ยน
  role ของ user (ECP-023 AC2) หรือแก้ permission ของ role (ECP-024) การเปลี่ยนจะ **มีผลภายใน ≤ TTL
  โดยไม่ต้องบังคับ re-login** เพราะ resolver ดึง role_id จาก DB (ผ่าน cache) ไม่ใช่จาก token ที่ freeze
- **การ invalidate เชิงรุก (optional, เพิ่มความทันที):** เมื่อ Admin บันทึกแก้ role ของ user หรือ
  permission ของ role → เรียก `permissionCache.invalidate(user_id)` / `invalidateByRole(role_id)`
  ให้มีผลเกือบทันที; **แต่ความถูกต้องไม่พึ่ง path นี้** — ถึงไม่ invalidate ก็ยังการันตี ≤5 นาทีจาก TTL
- ฝั่ง frontend ใช้ permission (จาก `GET /auth/me`) ซ่อน/แสดงเมนู (ECP-034) — **backend เป็นด่านบังคับจริงเสมอ**;
  FE ควร refetch `/auth/me` เป็นระยะ (หรือเมื่อ 401/403) เพื่อ sync เมนูภายในกรอบ TTL เดียวกัน
- **Guardrail (ECP-024 AC2):** ห้ามบันทึก config ที่ทำให้ไม่มี role ใดมี `user_management.manage_permission`
  → service ตรวจก่อน commit และปฏิเสธ

## ทางเลือกที่พิจารณา (Alternatives Considered)

- **rev.1: permission snapshot ใน JWT** — ไม่การันตี ≤5 นาที (ผูกกับอายุ token/การ re-login); **ถูกแทนที่**
- **Short-lived access token ≤5 นาที + refresh token rotation** — ตอบ TTL ได้แต่ต้องสร้างกลไก refresh/rotation
  เต็มรูป ซึ่ง over-engineer สำหรับ prototype และไม่ช่วยเรื่อง "role_id freeze ใน token" โดยตรง; ปฏิเสธ
  เลือก permission-cache TTL ที่เรียบง่ายและ bound staleness ได้ตรงกว่า
- **Server-side session store (DB/Redis) revoke ทันที** — ทำได้แต่ผูก session store, ขัดแนว stateless (ADR-001);
  และเงื่อนไขปอนด์ระบุชัดว่า "ไม่ต้อง revoke ทันที" จึงไม่จำเป็น
- **3rd-party IdP (Auth0/Firebase Auth)** — over-engineer + ผูก vendor สำหรับ prototype single company; ปฏิเสธ

## ผลที่ตามมา (Consequences)

- ทุก protected route ผ่าน `auth` → `resolvePermission(cache)` → `requirePermission` — ไม่มี endpoint สำคัญเปิดโล่ง (ยกเว้น login)
- **stateless/GCP-portable ยังคงอยู่:** cache เป็นเพียง optimization (rebuild จาก DB ได้เสมอ) ไม่ใช่ session store.
  Phase 3 หลาย instance: cache เป็น per-instance ได้ เพราะ TTL ≤5 นาที การันตีว่าทุก instance converge ภายใน
  5 นาทีอยู่แล้ว (ถ้าต้องการทันทีข้าม instance ค่อยเพิ่ม shared cache/pub-sub invalidation — backlog Phase 3)
- ต้องเพิ่ม env `PERMISSION_CACHE_TTL` (default 60s, clamp ≤300s) และ `SESSION_TTL` (default 8h) — ดู tasks D2
- Permission matrix ตั้งต้น (seed) ต้องนิยามครบ 7 roles (ดู architecture.md §7) + resource ใหม่
  `admin.manage_vat_config` (ECP-038) และ action `invoice.revise` (ECP-037)
- Password ใช้ bcrypt จริง; ต้อง seed admin 1 บัญชีสิทธิ์เต็มเสมอเพื่อกัน lockout
- ECP-023 AC2 ("มีผลการเข้าใช้ครั้งถัดไป") ยังคงจริง — และตอนนี้ **การันตีเพิ่มว่าไม่เกิน 5 นาทีแม้ไม่ re-login**
