# ADR-002: Backend Framework & Language — Express + TypeScript

- **สถานะ**: Proposed (รอ Human Gate 1)
- **วันที่**: 2026-07-06
- **ผู้ตัดสินใจ**: Tech-Lead (เสนอ) / ปอนด์ (approve)
- **ขอบเขต**: backend ของ `erp-core-prototype`

## บริบท (Context)

ADR-000 ล็อก Node.js เป็น backend runtime แล้ว เหลือเลือก framework + ภาษา
ต้องรองรับ REST API, middleware (auth/RBAC/audit), และ WebSocket (ADR-004)

## การตัดสินใจ (Decision)

- **ภาษา: TypeScript** ทั้ง backend — type safety ช่วยลด bug ในระบบที่มี entity/สถานะเยอะ
  และเป็น self-documenting ให้ทีม AI อ่านต่อได้ (สอดคล้อง ADR-000 ที่ระบุ JS/TS)
- **Framework: Express** (v4) — minimal, ทีมคุ้น, ecosystem ใหญ่, ผสม Socket.IO ง่าย
- โครงสร้าง middleware pipeline: `requestId → auth (JWT) → RBAC (permission check) → controller
  → audit (สำหรับ action สำคัญ) → error handler กลาง`
- ใช้ **Zod** validate request body/params ที่ boundary (แปลง error เป็นข้อความไทยตาม ECP-036)

## ทางเลือกที่พิจารณา (Alternatives Considered)

- **NestJS** — โครงสร้าง/DI ดีสำหรับทีมใหญ่ แต่ learning curve + boilerplate สูงเกินจำเป็น
  สำหรับ prototype; ปฏิเสธเพื่อความเรียบง่าย
- **Fastify** — เร็วกว่า Express แต่ performance ไม่ใช่ข้อจำกัดของ prototype (brief ระบุ
  performance hardening = out-of-scope); ปฏิเสธเพราะทีมคุ้น Express มากกว่า
- **JavaScript ล้วน (ไม่ใช้ TS)** — ปฏิเสธ: เสีย type safety ในระบบที่ state machine ซับซ้อน

## ผลที่ตามมา (Consequences)

- Engineer เขียน TypeScript, build ด้วย `tsc`/`tsx`; DevOps เพิ่ม build step ใน Docker
- Express ไม่มี structure บังคับ → ต้องยึด layered structure ตาม ADR-001 ด้วยวินัยของทีม
- Validation กลาง (Zod) เป็น dependency ที่ทุก controller ต้องใช้ ไม่ validate เอง ad-hoc
