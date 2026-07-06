# ADR-008: Frontend Stack — React + Vite + Ant Design + React Query

- **สถานะ**: Proposed (รอ Human Gate 1)
- **วันที่**: 2026-07-06
- **ผู้ตัดสินใจ**: Tech-Lead (เสนอ) / ปอนด์ (approve)
- **ขอบเขต**: web frontend ของ `erp-core-prototype` (React ตาม ADR-000)

## บริบท (Context)

- ผู้ใช้ไม่เคยใช้ ERP มาก่อน → **usability/self-navigation เป็น requirement จริง** (Epic 10):
  เมนูตาม role, onboarding tooltip, error message ไทยที่ชัดเจน
- ระบบเป็น data-heavy ERP: form เยอะ, ตารางเยอะ, filter/pagination, สถานะหลายขั้น
- ต้องรับ real-time push จาก backend (ADR-004)
- Dashboard 7 แบบ (ECP-027–033)

## การตัดสินใจ (Decision)

- **Build tool: Vite** — dev server เร็ว, config น้อย, เหมาะ prototype
- **ภาษา: TypeScript** (สอดคล้อง ADR-002, แชร์ type ของ API contract ได้)
- **UI library: Ant Design (antd)** — มี component สำเร็จสำหรับ ERP ครบ (Table + filter +
  pagination, Form + validation, Steps สำหรับ timeline สถานะ PO, Descriptions, Tag สถานะ,
  Tooltip/Tour สำหรับ onboarding) → ลดเวลาและช่วยความสม่ำเสมอ/usability โดยตรง; รองรับไทย
- **Server state: TanStack Query (React Query)** — จัดการ fetch/cache/refetch, ทำ fallback
  polling ของ stock (ADR-004) และ invalidate ตอนได้ event real-time ได้สะอาด
- **Client/UI state: React Context + hook** เท่าที่จำเป็น (auth/permission, current user) —
  ไม่ใส่ Redux (over-engineer สำหรับ prototype)
- **Routing: React Router** — เมนู/หน้าแยกตาม permission (ECP-034); guard route ตาม permission
  (แต่ backend เป็นด่านจริงตาม ADR-005)
- **Real-time client: socket.io-client** subscribe room `stock` → invalidate React Query cache

## ทางเลือกที่พิจารณา (Alternatives Considered)

- **สร้าง component เอง / Tailwind ล้วน** — คุม design ได้เต็มที่แต่ช้าและเสี่ยง usability ไม่สม่ำเสมอ
  สำหรับผู้ใช้มือใหม่; ปฏิเสธเพื่อความเร็ว+ความสม่ำเสมอ
- **MUI (Material UI)** — เป็นตัวเลือกที่ดีพอกัน; เลือก antd เพราะชุด component ตาราง/ฟอร์ม
  เชิง enterprise/CRUD ครบและตรงกับงาน ERP มากกว่าเล็กน้อย (เป็น trade-off ระดับรอง)
- **Redux Toolkit เป็น state หลัก** — over-engineer; React Query + Context เพียงพอ

## ผลที่ตามมา (Consequences)

- Engineer ใช้ antd component เป็นหลัก ไม่ประดิษฐ์เอง เว้นแต่จำเป็น
- Onboarding (ECP-034 AC2) ใช้ antd `Tour`/`Tooltip`; error ไทย (ECP-036) รวมศูนย์ที่ error
  handler กลาง + antd `message`/`notification`
- แชร์ TypeScript type ของ API ระหว่าง FE/BE ได้ (โครง monorepo-lite ใน architecture.md)
- Frontend เป็น static build → Phase 3 เสิร์ฟผ่าน Cloud Run/Cloud Storage+CDN ได้ (ไม่ปิดทาง GCP)
