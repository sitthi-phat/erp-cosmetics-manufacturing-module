# ADR-005: Authentication & RBAC — JWT + DB-driven Permission Matrix

- **สถานะ**: Proposed (รอ Human Gate 1)
- **วันที่**: 2026-07-06
- **ผู้ตัดสินใจ**: Tech-Lead (เสนอ) / ปอนด์ (approve)
- **ขอบเขต**: Epic 8 (User Management/RBAC) + ทุก endpoint/หน้าจอที่ต้องคุมสิทธิ์

## บริบท (Context)

- 7 roles, สิทธิ์ต้อง **config ผ่านหน้าจอได้โดยไม่ต้องแก้โค้ด/deploy** (ECP-024) เพราะจะปรับบ่อย
  ระหว่างสำรวจ user journey
- role เปลี่ยนแล้วมีผล "การเข้าใช้งานครั้งถัดไป (login ใหม่/refresh)" (ECP-023 AC2)
- ต้องกัน config จนไม่มีใครเข้าหน้าจัดการสิทธิ์ได้ (ECP-024 AC2)
- เข้าหน้า/ยิง action ที่ไม่มีสิทธิ์ต้องถูกปฏิเสธแม้เรียก URL ตรง (ECP-016/022/027-033 AC3)

## การตัดสินใจ (Decision)

### Authentication: JWT (access token) เก็บใน httpOnly cookie
- Login ตรวจ username/password (hash ด้วย **bcrypt**) → ออก JWT อายุสั้น (เช่น 8 ชม.)
- Token ฝัง `user_id`, `role_id`, และ **snapshot ของ permission** ณ เวลา login
- role/permission เปลี่ยน → มีผลตอน login ใหม่/refresh token (ตรงกับ ECP-023 AC2 พอดี)
- prototype ไม่ทำ refresh-token rotation ซับซ้อน (out-of-scope security hardening) — re-login พอ

### Authorization: DB-driven permission matrix
- ตาราง `Role` และ `Permission` (mapping `role_id × resource × action → allow/deny`)
- **`requirePermission(resource, action)` middleware** เช็คทุก protected endpoint จาก permission
  ใน token; ฝั่ง frontend ใช้ permission เดียวกันซ่อน/แสดงเมนู (ECP-034) — **แต่ backend
  เป็นด่านบังคับจริงเสมอ** (frontend hide เป็น UX ไม่ใช่ security)
- Admin แก้ permission ผ่านหน้า config (ECP-024) → เขียนลงตาราง Permission → มีผล login ถัดไป
- **Guardrail (ECP-024 AC2)**: ห้ามบันทึก config ที่ทำให้ไม่มี role ใดมีสิทธิ์
  `user_management.manage_permission` → service ตรวจก่อน commit และปฏิเสธ

## ทางเลือกที่พิจารณา (Alternatives Considered)

- **Server-side session (เก็บใน DB/memory)** — ทำให้ role change มีผลทันทีได้ แต่ผูกกับ session
  store; JWT stateless เข้ากับ ADR-001 (stateless app, GCP-ready) มากกว่า และ ECP-023 AC2
  ระบุ "ครั้งถัดไป" อยู่แล้วจึงไม่ต้อง revoke ทันที
- **Hardcode role→permission ในโค้ด** — ปฏิเสธตรงๆ: ขัด ECP-024 (ต้อง config ผ่านหน้าจอ)
- **ใช้ 3rd-party IdP (Auth0/Firebase Auth)** — over-engineer + ผูก vendor สำหรับ prototype
  single company; ปฏิเสธ แต่ JWT-based ทำให้เปลี่ยนไป IdP ภายหลังได้ถ้าจำเป็น

## ผลที่ตามมา (Consequences)

- ทุก protected route ต้องผ่าน `auth` แล้วตามด้วย `requirePermission` — ไม่มี endpoint สำคัญใด
  เปิดโล่ง (ยกเว้น login)
- Permission matrix ตั้งต้น (seed) ต้องนิยามครบ 7 roles (ดู architecture.md §Permission Matrix)
- Password prototype ใช้ bcrypt จริง (ไม่ plain text) แม้เป็น prototype — ถือเป็น hygiene ขั้นต่ำ
- ต้องมี seed admin 1 บัญชีที่มีสิทธิ์เต็มเสมอ เพื่อกัน lockout
