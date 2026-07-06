# ADR-008: Frontend Stack — React + Vite + Ant Design (behind a UI wrapper layer) + React Query

- **สถานะ**: Accepted (แก้ไขตามเงื่อนไข Human Gate 1 — ปอนด์ approve แบบมีเงื่อนไข 2026-07-06)
- **วันที่**: 2026-07-06 (rev.2)
- **ผู้ตัดสินใจ**: Tech-Lead (เสนอ) / ปอนด์ (approve-with-conditions)
- **ขอบเขต**: web frontend ของ `erp-core-prototype` (React ตาม ADR-000)

## ประวัติการแก้ไข (Revision History)

| rev | วันที่ | สาระ |
|---|---|---|
| 1 | 2026-07-06 | เลือก Vite + TS + Ant Design + React Query; Engineer ใช้ antd component ตรงๆ |
| **2** | **2026-07-06** | **แก้ตามเงื่อนไข Gate 1 #4: antd OK แต่ต้องออกแบบเผื่อเปลี่ยน UI library ภายหลัง → เพิ่ม UI wrapper layer (`src/frontend/ui/`), ห้าม import antd ตรงนอก wrapper (ESLint rule), แยก business logic ออกจาก antd API** |

## บริบท (Context)

- ผู้ใช้ไม่เคยใช้ ERP มาก่อน → usability/self-navigation เป็น requirement จริง (Epic 10)
- ระบบ data-heavy: form/ตารางเยอะ, filter/pagination, สถานะหลายขั้น, dashboard 7 แบบ
- ต้องรับ real-time push จาก backend (ADR-004)
- **เงื่อนไข Gate 1 #4 (ใหม่):** ใช้ Ant Design ได้ แต่ต้อง **ออกแบบเผื่อเปลี่ยน UI library ภายหลัง** —
  ลด lock-in ไม่ผูก business logic กับ antd API ตรงๆ

## การตัดสินใจ (Decision — rev.2)

คงตัวเลือกหลักจาก rev.1 และ **เพิ่มชั้น isolation เพื่อลด lock-in**:

- **Build tool: Vite** ; **ภาษา: TypeScript** (แชร์ type API กับ backend ตาม ADR-002)
- **UI library: Ant Design (antd)** — component ERP ครบ (Table+filter+pagination, Form+validation,
  Steps timeline สถานะ PO, Descriptions, Tag, Tooltip/Tour onboarding) รองรับไทย
- **Server state: TanStack Query (React Query)** — fetch/cache/refetch + fallback polling stock (ADR-004)
- **Client/UI state: React Context + hook** (auth/permission, current user) — ไม่ใส่ Redux (over-engineer)
- **Routing: React Router** — guard route ตาม permission (ECP-034); backend เป็นด่านจริง (ADR-005)
- **Real-time client: socket.io-client** subscribe room `stock` → invalidate React Query cache

### กลยุทธ์ลด UI-library lock-in (ตอบเงื่อนไข #4)

1. **UI wrapper layer `src/frontend/ui/`** — ห่อ primitive ที่ใช้ทั่วระบบให้มี prop interface ที่เป็นกลาง
   (ไม่สะท้อน API ของ antd ตรงๆ): `Button`, `TextField/Form`, `DataTable`, `Modal`, `StatusTag`,
   `Toast/Notify`, `Tooltip`, `OnboardingTour`, `Descriptions`, `Steps/Timeline`, `Layout/Menu`.
   ภายใน wrapper เท่านั้นที่ import จาก `antd`.
2. **ห้าม import antd ตรงนอก `src/frontend/ui/`** — บังคับด้วย **ESLint `no-restricted-imports`**
   (pattern `antd`, `antd/*`, `@ant-design/*` allowed เฉพาะใต้ `ui/`). ทำให้ "จุดผูก antd" อยู่ที่เดียว
3. **business logic ไม่อยู่ในคอมโพเนนต์ UI** — วางใน React Query hooks (`lib/api*`, `hooks/`) และ service
   ที่ไม่พึ่ง antd; page components เป็น orchestrator บาง เรียก hook + ประกอบ `ui/` primitives
4. **error/notification รวมศูนย์** — layer กลาง (ECP-036) เรียกผ่าน `ui/Notify` ไม่เรียก `antd.message` กระจาย
5. **design token/theme รวมที่เดียว** (`ui/theme.ts`) — เปลี่ยนธีม/ไลบรารีแก้ที่เดียว

> **ขอบเขตที่ตั้งใจ "ไม่ over-abstract" (trade-off):** ไม่พยายาม abstract ทุก prop ของ antd ให้เป็น
> กลาง 100% (จะช้าและ over-engineer). เป้าหมายคือ **จำกัดพื้นผิวการผูก antd ไว้ในโฟลเดอร์เดียว**
> เพื่อให้การเปลี่ยนไลบรารีเป็น "งานเขียน wrapper ใหม่" ไม่ใช่ "รื้อทั้ง codebase" — เพียงพอต่อเงื่อนไข
> "เผื่อเปลี่ยนภายหลัง" โดยไม่จ่ายต้นทุน abstraction เต็มรูปในรอบ prototype

## ทางเลือกที่พิจารณา (Alternatives Considered)

- **ใช้ antd ตรงๆ ทั้ง codebase (rev.1)** — เร็วสุดแต่ผูกแน่น เปลี่ยนไลบรารียาก; ขัดเงื่อนไข #4; ถูกแทนที่
- **สร้าง component เอง / Tailwind ล้วน** — คุม design เต็มที่/ไม่ผูก vendor แต่ช้าและเสี่ยง usability
  ไม่สม่ำเสมอสำหรับผู้ใช้มือใหม่; ปฏิเสธ (wrapper layer ให้ประโยชน์ portability โดยยังได้ speed ของ antd)
- **abstraction เต็มรูป (headless + design system เอง)** — over-engineer สำหรับ prototype; ปฏิเสธ
- **MUI แทน antd** — ดีพอกัน แต่ทั้งคู่ผูก vendor เท่ากัน; ประเด็นจริงคือ isolation layer ไม่ใช่เลือกยี่ห้อ

## ผลที่ตามมา (Consequences)

- เพิ่มโฟลเดอร์ `src/frontend/ui/` + ESLint rule (ดู architecture.md §2, tasks E17)
- Engineer import UI จาก `@/ui` เสมอ; PR ที่ import antd ตรงนอก `ui/` จะถูก ESLint block
- Onboarding (ECP-034 AC2) = `ui/OnboardingTour` (ห่อ antd `Tour`); error ไทย (ECP-036) ผ่าน `ui/Notify`
- **Admin Portal (ECP-038)**: หน้า "ตั้งค่า VAT" อยู่หน้าเดียวกับ "จัดการผู้ใช้งาน" — ประกอบจาก `ui/` เช่นกัน
- Frontend เป็น static build → Phase 3 เสิร์ฟผ่าน Cloud Run/Cloud Storage+CDN ได้ (ไม่ปิดทาง GCP)
- ต้นทุนเพิ่ม = เขียน wrapper บางๆ ครั้งแรก (ยอมรับได้ แลกกับ portability ตามเงื่อนไขปอนด์)
