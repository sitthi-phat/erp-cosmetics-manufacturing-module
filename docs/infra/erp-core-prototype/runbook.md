# Runbook — ERP Core Prototype (Local PC only, Phase 2)

- **slug**: `erp-core-prototype`
- **เขียนโดย**: DevOps
- **อัปเดตล่าสุด**: 2026-07-09 (หลัง final smoke **รอบที่ 2** ก่อน Human Gate 2 — QA gate2-verify เขียวทั้งหมด
  รวม Gate 2 Rework จาก feedback 10 ข้อของปอนด์)
- **เป้าหมาย**: ให้ปอนด์ (หรือใครก็ตาม) รันระบบนี้บนเครื่องตัวเองได้ "จากศูนย์" โดยไม่ต้องถามใคร

> ✅ **สถานะล่าสุด**: Gate 2 Rework (feedback 10 ข้อของปอนด์รอบแรก — BOM management, material-plan
> auto-calculate, trace ค้นหาช่องเดียว, QC incoming form, ใบกำกับภาษี+print, customer tax fields, responsive,
> UI consistency) implement+verify ครบแล้ว — unit 233/233, integration 211/211 (26/26 suites, 3 documented
> skip), e2e 45/45 (1 documented skip) เขียวทั้งหมด รวม regression guard เฉพาะที่ครอบ defect เดิมทั้ง 5 ที่ปอนด์
> เจอรอบแรก. DevOps ทำ **final smoke รอบ 2 จากศูนย์จริง** (ล้าง Docker volume ทั้งหมด แล้วตั้งใหม่ตาม runbook
> นี้ทีละบรรทัด รวมถึงคลิกผ่านฟีเจอร์ใหม่จริงในเบราว์เซอร์) ยืนยันว่าใช้งานได้จริง — รายละเอียดที่ §5.1
>
> ⚠ **ก่อนปอนด์ approve Gate 2 รอบนี้**: มี 1 คำถามค้างรอปอนด์ตัดสินใจ (ไม่ใช่บั๊ก) + 1 responsive gap ระดับ
> Minor ที่ Engineer เปิดเผยเองแล้ว — ดู §6

---

## 1. สิ่งที่ต้องมีในเครื่องก่อนเริ่ม (Prerequisites)

- **Docker Desktop** (ต้องเปิดและ daemon รันอยู่จริง — เช็คด้วย `docker info` ต้องเห็นส่วน `Server:` ไม่ใช่แค่
  `Client:`)
- **Node.js** เวอร์ชัน LTS (โปรเจกต์ทดสอบกับ Node ที่มี npm workspaces รองรับ — v18+)
- ไม่ต้องติดตั้ง MySQL เองในเครื่อง — ใช้ MySQL ผ่าน Docker Compose ทั้งหมด (container-first ตามนโยบาย
  Phase 3 → GCP)

---

## 2. Setup จากศูนย์ (ครั้งแรก หรือหลังล้างเครื่อง) — คำสั่งเดียวจบ

```bash
npm install
cp .env.example .env        # ถ้ายังไม่มี .env — ค่า default ใน .env.example ใช้ได้เลยสำหรับ local
npm run setup
```

`npm run setup` จะทำให้ครบทุกอย่างตามลำดับ:
1. `docker compose up -d mysql` — ยก MySQL container (สร้าง 2 schema: `erp_core_prototype` สำหรับ
   dev/ใช้งานจริง และ `erp_core_prototype_test` สำหรับรัน automated integration tests แยกกัน ไม่ปนข้อมูล)
2. `prisma migrate deploy` กับ dev schema
3. `npm run db:seed` — ใส่ข้อมูลตัวอย่าง (9 users ครอบคลุม 8 roles, ลูกค้า, วัตถุดิบ, สินค้า, PO→ผลิต→QC→
   จัดส่ง→invoice ตัวอย่างครบสาย)
4. migrate + seed schema สำหรับเทสต์ (`erp_core_prototype_test`) เช่นกัน
5. `npx playwright install chromium` — ติดตั้ง browser สำหรับรัน e2e test

**ใช้เวลาประมาณ 2-5 นาที** (ส่วนใหญ่คือดาวน์โหลด MySQL image + Chromium ครั้งแรก)

### ⚠ ปัญหาที่รู้อยู่แล้ว (infra-level, ไม่ใช่บั๊กโค้ด): MySQL healthcheck race บน volume ใหม่ล้วนๆ

ยืนยันซ้ำแล้วหลายรอบ (รวมรอบ final smoke ล่าสุด): เมื่อรัน `npm run setup`/`npm run reset` บน Docker volume
ที่**เพิ่งสร้างใหม่ล้วนๆ** (ไม่เคยมีมาก่อน) บางครั้ง `prisma migrate deploy` จะ error
`P1017: Server has closed the connection.` แม้ Docker Compose จะรายงานว่า `mysql` container "healthy" แล้ว —
สาเหตุคือ MySQL ต้องรัน `docker/mysql/init/01-create-test-db.sql` (สร้าง schema ที่ 2) ตอน initialize
data directory ครั้งแรก ซึ่งใช้เวลานานกว่า healthcheck รอบแรกเล็กน้อย

**วิธีแก้ (ทำตามนี้ถ้าเจอ error นี้)**:
```bash
# รอให้ container ขึ้นสถานะ healthy จริงๆ ก่อน (ไม่ใช่แค่ "Up")
docker inspect --format='{{.State.Health.Status}}' <container-name-mysql>
# พอเห็นคำว่า healthy แล้ว รอเพิ่มอีก ~5 วินาที แล้วรันคำสั่งที่ fail ซ้ำ (ไม่ต้อง down -v ใหม่):
npm run prisma:migrate && npm run db:seed && npm run db:migrate:test && npm run db:seed:test
```
ปกติจะผ่านทันทีในการลองครั้งที่ 2 — นี่คือ timing race ระดับ infra ไม่ใช่บั๊ก schema/seed

### ตรวจว่า setup สำเร็จ
```bash
docker compose ps          # ต้องเห็น mysql ... Up (healthy)
```

---

## 3. วิธีรันระบบ (ทุกวันหลังจาก setup ครั้งแรกแล้ว)

```bash
docker compose up -d mysql   # ถ้า MySQL ยังไม่ได้รันอยู่
npm run dev                  # รัน backend (:4000) + frontend (:5173) พร้อมกัน, auto-reload เมื่อแก้โค้ด
```

เปิดเบราว์เซอร์ไปที่ **http://localhost:5173**

### ทางเลือก: รันทั้ง stack ผ่าน Docker (backend+frontend+mysql ใน container ทั้งหมด)
```bash
docker compose up -d
```
ใช้ทางนี้ถ้าต้องการจำลองสภาพแวดล้อมที่ใกล้เคียง production/Phase 3 มากที่สุด (ไม่มี hot-reload เร็วเท่า
`npm run dev` แต่ปิดโอกาสที่ "รันได้ในเครื่องฉันแต่พังในเครื่องอื่น")

### ⚠ ถ้าเคยรัน `npm run dev` ค้างไว้จากรอบก่อน (stale server)

ถ้าเปิด `npm run dev` ใหม่แล้วเจอ error ว่า port ถูกใช้อยู่ (`EADDRINUSE`) แปลว่ามี process เก่าจากรอบก่อนค้าง
port `4000`/`5173` อยู่ — ปิดก่อนด้วย:
```bash
# หา PID ที่จับ port ค้างอยู่ แล้วปิด (Windows PowerShell/Git Bash)
netstat -ano | findstr ":4000"
netstat -ano | findstr ":5173"
taskkill /F /PID <PID ที่เจอ>
```
แล้วค่อยรัน `npm run dev` ใหม่

---

## 4. บัญชีทดสอบ (จาก seed data) — ครบ 8 roles + 2 บัญชีสาธิตพิเศษ (รวม 9 users)

รหัสผ่านเดียวกันทุกบัญชี: **`Password123!`**

| Username | บทบาท (role) | หน้าที่หลักที่ทดสอบได้ |
|---|---|---|
| `sales_demo` | Sales/CS (SA) | สร้าง/ดู PO, ลูกค้า (รวมข้อมูลภาษี) |
| `warehouse_demo` | คลังสินค้า (WH) | รับของเข้า (goods receipt), ดู stock real-time, ค้นหาใน stock, ดู BOM (`bom.view`) |
| `production_demo` | ฝ่ายผลิต (PR) | คิวผลิต, assign, ผลิตด้วย material-plan (FIFO auto-calculate), **จัดการ BOM ได้เต็มที่ (`bom.manage`)** |
| `qc_demo` | QA/QC (QA) | ตรวจ batch/lot **+ ตรวจรับวัตถุดิบขาเข้า (incoming inspection form ใหม่)** |
| `logistics_demo` | ฝ่ายจัดส่ง (LO) | สร้าง/อัปเดตสถานะ shipment |
| `finance_demo` | บัญชี/การเงิน (FI) | ออก invoice (พร้อม discount), บันทึกชำระเงิน, ดูตัวเลือกสินค้าตอน revise invoice (`product.view`), **เปิดหน้ารายละเอียด invoice + พิมพ์ใบกำกับภาษี** |
| `admin` | Admin (AD) | จัดการผู้ใช้/สิทธิ์ (`user.view_basic` ให้ role อื่นดูรายชื่อผู้ใช้แบบจำกัดได้), ตั้งค่า VAT, **ตั้งค่าข้อมูลบริษัท (CompanyProfile ใหม่ — ชื่อ/ที่อยู่/เลขผู้เสียภาษี/โทรศัพท์/โลโก้ ที่ใช้พิมพ์บนเอกสาร)**, `bom.manage` เต็มสิทธิ์เหมือน production |
| `role_with_no_menu_demo` | No Menu (NM, ไม่มี permission ใดๆ เลยโดยตั้งใจ) | ทดสอบเคส "role ไม่มีเมนูที่กำหนด → ต้องเห็นข้อความ 'ติดต่อ Admin' ไม่ใช่หน้าว่างเปล่า" (ECP-034 AC3) |
| `brand_new_user_demo` | Sales (SA, บัญชีแยกจาก `sales_demo`) | ทดสอบเคส "login ครั้งแรกสุด → ต้องเห็น onboarding tooltip อย่างน้อย 1 จุด" (ECP-034 AC2) — แยกบัญชีจาก `sales_demo` เพื่อไม่ให้ onboarding state (เก็บใน browser ผ่าน localStorage) ปนกัน |

---

## 5. Flow แนะนำให้คลิกทดสอบ (demo flow เต็มสาย, ตรงกับ brief.md DoD #1)

> รายการด้านล่างคือ flow พื้นฐานเดิม (ยังใช้ได้ปกติ) — **สำหรับรอบ Gate 2 นี้ ให้ดู §5.2 เป็นหลัก** เพราะครอบ
> ทั้ง flow พื้นฐานนี้ + ฟีเจอร์ใหม่ทั้งหมดที่ตรงกับ feedback ของปอนด์

1. Login เป็น `sales_demo` → เมนู "คำสั่งซื้อ (PO)" → สร้าง PO ใหม่ให้ลูกค้าที่มีอยู่ → ยืนยัน PO (ระบบเช็ค
   stock/reserve วัตถุดิบให้อัตโนมัติ)
2. Login เป็น `production_demo` → คิวผลิต → assign งาน → ผลิต (เลือก Lot วัตถุดิบ) → ได้ Batch ใหม่
3. Login เป็น `qc_demo` → ตรวจ batch ที่เพิ่งผลิต → Approve
4. Login เป็น `logistics_demo` → สร้าง shipment จาก batch ที่ QC Approved แล้ว → อัปเดตสถานะเป็น Delivered
5. Login เป็น `finance_demo` → ออก invoice จาก PO ที่ Shipped แล้ว (VAT คำนวณอัตโนมัติจากค่าที่ตั้งไว้) →
   บันทึกการชำระเงิน
6. Login เป็น `admin` → หน้า `/admin` → ดูว่าจัดการผู้ใช้ + ตั้งค่า VAT อยู่หน้าเดียวกัน
7. เปิด 2 แท็บพร้อมกัน (คนละ role) เพื่อดู real-time: รับของเข้าคลังในแท็บหนึ่ง แล้วดู stock อัปเดตในอีกแท็บ
   โดยไม่ต้อง refresh

### 5.1 ผลการทำ Final Smoke (สรุปทั้ง 2 รอบ, ล่าสุด 2026-07-09 ก่อนเปิด Human Gate 2 รอบนี้)

ทำตาม runbook นี้ทีละขั้นเหมือนคนที่ไม่เคยเห็นระบบมาก่อน (`npm run reset` → `npm run setup` → `npm run dev`):

| ขั้นตอน | ผล |
|---|---|
| `npm run reset` (ล้าง Docker volume ทั้งหมดจริง) → `npm run setup` | เจอ timing race ที่ §2 ระบุไว้อีกครั้ง 1 ครั้ง (`P1017` ตอน migrate) — แก้ตามขั้นตอนใน §2 แล้วผ่านทันทีในรอบถัดไป ไม่ต้อง `down -v` ซ้ำ — **ยังคงเป็น timing gap เดิม ไม่ใช่ของใหม่จาก Gate 2 rework** |
| `npm run prisma:migrate` | ทั้ง 2 migration apply สำเร็จ (`20260706000000_init` + `20260706210210_gate2_rework`) |
| `npm run db:seed` (dev schema) + `npm run db:seed:test` (test schema) | สำเร็จทั้งคู่ — log ยืนยัน step ใหม่ `CompanyProfile (ECP-041)` และ `customers (Gate 2: tax_id/registered_address)` รันจริง |
| `docker compose ps` | `mysql` container `Up (healthy)` |
| `npm run dev` → `curl http://localhost:4000/health` | `{"status":"ok"}` |
| `curl http://localhost:5173/` | HTTP 200 |
| Login `admin` + `production_demo` + `sales_demo` ผ่าน HTTP จริง | ทั้งหมด 200 OK, permission payload ตรง (`bom.manage` เห็นใน `production_demo`/`admin`) |
| **คลิกหน้า "จัดการ BOM" จริง** (`admin`, `nav-bom`) | โหลดสำเร็จ, เห็นรายการ BOM ของสินค้าทั้ง 4 ตัวพร้อมจำนวนวัตถุดิบ + ฟอร์ม "สร้าง BOM ใหม่" |
| **ค้นหา `L-SEED-1` ในหน้า Traceability จริง** (`warehouse_demo`, ช่องค้นหาเดียว) | เจอผลลัพธ์จริง แสดง Batch ที่ใช้ Lot นี้ครบ (**ยืนยันแก้ feedback ข้อ 3 ของปอนด์แล้วจริง**) |
| **ออก invoice ใหม่จริง (สร้าง PO→confirm→assign→ผลิตด้วย material-plan FIFO→QC approve→ship→ออก invoice พร้อม discount) แล้วเปิดหน้ารายละเอียด + กดพิมพ์ใบกำกับภาษี** | เปิดหน้ารายละเอียดสำเร็จ (**แก้ feedback ข้อ 10 "เปิดดูไม่ได้" แล้วจริง**), หน้าพิมพ์แสดงครบ: ผู้ออก+เลขผู้เสียภาษี, ลูกค้า+เลขผู้เสียภาษี, ตารางรายการ, subtotal/discount/VAT/grand total, **ตัวหนังสือไทย ("หนึ่งพันสามร้อยเก้าสิบเอ็ดบาทถ้วน")** ตรงตามตัวอย่างที่ปอนด์แนบ |
| ⚠ **Observation ที่พบระหว่าง smoke**: เปิดหน้ารายละเอียด/พิมพ์ของ **invoice ที่มาจาก seed data เดิม** (INV-2026-000001 v1/v2) | ขึ้นข้อความ "กรุณาตั้งค่าข้อมูลบริษัทผู้ออกเอกสารก่อน" ทั้งที่ตั้งค่า CompanyProfile ไว้แล้วจริง — **ไม่ใช่บั๊ก**: invoice 2 ใบนี้ถูกสร้างตรงๆ ใน `prisma/seed.ts` (ไม่ผ่าน flow ออก invoice จริงของระบบ) จึงไม่มี `document_snapshot` ถูกบันทึกไว้ ตรงตาม design "block เมื่อไม่เคย snapshot" (ECP-041 AC4) — **invoice ที่ออกผ่านหน้าเว็บจริงทุกใบไม่เจอปัญหานี้** (ยืนยันแล้วด้านบน) — ถ้าปอนด์ทดสอบพิมพ์แล้วเจอข้อความนี้กับ invoice ที่เพิ่งออกเอง ให้แจ้งเป็นบั๊กจริง แต่ถ้าเจอกับ invoice หมายเลข `INV-2026-000001` (จาก seed) ถือเป็นข้อจำกัดของข้อมูลตัวอย่างเท่านั้น |
| Regression check DEF-07 (onboarding tour ไม่บังปุ่ม) | ยังไม่ regress — คลิกเมนูได้ทันทีหลัง login |
| ปิด background process (backend/frontend) ที่ smoke test เปิดไว้ทั้ง 2 รอบ | ปิดเรียบร้อยผ่าน `taskkill` ตาม PID, ตรวจซ้ำด้วย `netstat` ว่า port 4000/5173 ว่างแล้วทุกครั้ง |
| MySQL container | **คงไว้ให้ปอนด์ใช้ต่อ** (`docker compose ps` ยังเห็น `Up (healthy)`) พร้อม `npm run db:seed` รอบสุดท้ายให้ข้อมูลสดใหม่ (ล้าง PO/invoice ทดสอบที่ DevOps สร้างระหว่าง smoke ออกหมดแล้ว) |

**สรุป**: runbook นี้ทำตามได้จริงตั้งแต่ศูนย์ (fresh Docker volume, migration 2 ตัว) จนถึงคลิกผ่านฟีเจอร์ใหม่ทั้งหมด
จากรอบ Gate 2 Rework ได้จริงในเบราว์เซอร์ — พร้อมให้ปอนด์ทดสอบเองได้ทันที

### 5.2 สิ่งที่ปอนด์ควรลองกด — ครอบตรงกับ feedback ทั้ง 10 ข้อที่ปอนด์เคยให้ไว้รอบแรก

(อ้างอิงเต็มที่ `docs/requirements/erp-core-prototype/pond-gate2-feedback.md` — แต่ละข้อด้านล่างระบุว่าตรงกับ
feedback ข้อไหน)

1. **[feedback ข้อ 1] สร้าง PO แล้วดูว่ารายการอ่านออก + ลบได้** — login `sales_demo` → `/pos/new` → เพิ่ม
   สินค้า → ต้องเห็น **ชื่อสินค้าจริง + จำนวน + ราคา** (ไม่ใช่ `"Product #7 x 1 @ 1"` แบบเดิม) → ลองกด
   ลบรายการที่เพิ่งเพิ่ม → ต้องลบได้จริง
2. **[feedback ข้อ 2, 6] จัดการ BOM** — login `admin` หรือ `production_demo` → เมนู "จัดการ BOM" → ดูสูตร
   ของสินค้าที่มีอยู่ (สินค้า/จำนวนวัตถุดิบในสูตร) → ลองสร้าง BOM ใหม่ให้สินค้าที่ยังไม่มีสูตร
3. **[feedback ข้อ 3] ค้นหา `L-SEED-1` ในหน้า Traceability** — login role ใดก็ได้ที่มีสิทธิ์ → เมนู
   "Traceability" → พิมพ์ `L-SEED-1` ในช่องค้นหาเดียว (ค้นได้ทั้ง Lot/Batch/PO/Invoice) → กด "ค้นหา" →
   ต้องเจอ พร้อมคำอธิบาย Lot vs Batch ที่แสดงอยู่บนหน้าจอตลอดเวลา (ตอบคำถาม "Batch เอาไว้ทำอะไร")
4. **[feedback ข้อ 4] ผลิตด้วย material-plan (auto-calculate จาก BOM)** — login `production_demo` →
   "งานผลิต" → assign งานจากคิว → หน้าผลิตต้อง **คำนวณวัตถุดิบที่ต้องใช้ให้อัตโนมัติจาก BOM พร้อมเสนอ Lot
   ที่จะใช้ (FIFO)** ให้แค่ review/ปรับ ไม่ต้องกรอก Lot ID เองแบบเดิม → ยืนยันผลิต → ได้ Batch ใหม่
5. **[feedback ข้อ 5] QC ตรวจรับวัตถุดิบขาเข้า** — login `qc_demo` → เมนู QC → ต้องมีส่วน "ตรวจรับวัตถุดิบ
   ขาเข้า (incoming inspection)" แยกจากตรวจ batch — ลองกรอกฟอร์มตรวจรับ 1 รายการ
6. **[feedback ข้อ 9] ข้อมูลภาษีลูกค้า** — login `sales_demo` → เมนู "ลูกค้า" → สร้าง/แก้ไขลูกค้า → ต้องมี
   ช่องเลขประจำตัวผู้เสียภาษี (13 หลัก) + ที่อยู่จดทะเบียน ครบ
7. **[feedback ข้อ 10] เปิดดู invoice + พิมพ์ใบกำกับภาษี** — login `finance_demo` → ออก invoice ใหม่จาก PO
   ที่ Shipped แล้ว (ใส่ discount เป็นตัวเลขที่ไม่ใช่ 0 เพื่อทดสอบเต็มรูป) → **เปิดหน้ารายละเอียด invoice
   ต้องเห็นข้อมูลครบ** (แก้ปัญหาเดิมที่ "เรียกดูไม่ได้") → กด "พิมพ์/ดาวน์โหลด" → เทียบกับตัวอย่างที่ปอนด์แนบ
   ทีละส่วนตาม `docs/test-plans/erp-core-prototype/uat-print-responsive-script.md` ส่วนที่ 1 (หัวเอกสาร,
   ข้อมูลผู้ออก/ลูกค้า, ตารางรายการ, ยอดรวม+VAT+ตัวหนังสือไทย, ช่องลายเซ็น 2 ช่อง) — **ใช้ invoice ที่เพิ่ง
   ออกเองเท่านั้น อย่าใช้ invoice หมายเลข `INV-2026-000001` จาก seed (ดู observation ใน §5.1)**
8. **[feedback ข้อ 7, 8] UI consistency + Responsive** — ทำตาม
   `docs/test-plans/erp-core-prototype/uat-print-responsive-script.md` ส่วนที่ 2 (responsive บนแท็บเล็ต/
   resize browser 768-1024px) และส่วนที่ 3 (เปิด 8 หน้าไล่ดูความสม่ำเสมอของ UI) — **มีจุดที่รู้อยู่แล้วว่า
   อาจ overflow บนแท็บเล็ต portrait ที่หน้า QC incoming (ดู MIN-09 ใน §6) ไม่ต้องแปลกใจถ้าเจอ**
9. **ดู Dashboard** — สลับ login ไปแต่ละ role แล้วดูหน้า "หน้าแรก" ของแต่ละคน (ตัวเลขสรุปตรงกับข้อมูลที่
   เพิ่งทำไปข้างต้นหรือไม่)
10. **ดู Audit Log** — login `admin` → "Audit Log" → ค้นหา action ที่เพิ่งทำไปทั้งหมด ต้องเห็นครบพร้อมชื่อ
    ผู้ทำ+เวลา (รวม action ใหม่ เช่น สร้าง/แก้ไข BOM, ตั้งค่า CompanyProfile)
11. **Revise Invoice** — จาก invoice ที่เพิ่งออก → กด "แก้ไข/revise" → ปรับจำนวน/ราคา → ยืนยัน → ดู version
    ใหม่ (v2) กับ timeline ว่า v1 ถูกแทนที่เมื่อไหร่/โดยใคร → ลองพิมพ์ version เก่า (Superseded) → ต้องเห็น
    ป้าย "ยกเลิกแล้ว — ใช้ version ล่าสุดแทน"
12. **ทดสอบ role ที่ไม่มีเมนู** — login `role_with_no_menu_demo` → ต้องเห็นข้อความ "ยังไม่มีเมนูที่กำหนดให้
    บทบาทนี้ กรุณาติดต่อ Admin" ไม่ใช่หน้าว่างเปล่า
13. **ทดสอบ onboarding ผู้ใช้ใหม่** — login `brand_new_user_demo` (browser/โหมดไม่ระบุตัวตนที่ยังไม่เคย login)
    → ต้องเห็น onboarding tooltip อย่างน้อย 1 จุด และคลิกเมนูต่อได้ทันที ไม่มี overlay ค้างบัง

---

## 6. ปัญหาที่รู้อยู่แล้ว (Known Issues)

รายละเอียดเต็มอยู่ที่ `docs/infra/erp-core-prototype/devops-verify-report.md` และ
`docs/test-plans/erp-core-prototype/defects.md` (DEF-01 ถึง DEF-15 ปิดครบจาก Gate 2 รอบแรก; Gate 2 Rework
verify ล่าสุดไม่พบ defect โค้ดจริงใหม่เลยแม้แต่ตัวเดียว)

### ⚠ 1 คำถามรอปอนด์ตัดสินใจก่อน approve Gate 2 (ไม่ใช่บั๊ก) — PENDING-POND-1

**ECP-013 AC5 (ผลิต — server-side re-validation ยอดวัตถุดิบที่ใช้จริง)**: สเปกเดิมระบุว่ายอดรวมที่ใช้ต้อง
"เท่ากับที่ BOM กำหนดพอดี" (ห้ามทั้งเกินและขาด) แต่ตอนนี้ระบบ implement แบบ **reject เฉพาะกรณีใช้น้อยกว่าที่
กำหนด (under-supply)** เท่านั้น (ใช้เกินได้) เพราะ exact-match เต็มรูปจะกระทบ fixture/flow การทดสอบเดิมเกือบ
ทั้งหมด มี 3 ทางเลือก:
- **A**: ยอมรับพฤติกรรมปัจจุบัน (under-only) ตามที่ verify ไว้แล้ว
- **B**: บังคับ exact-match เต็มรูปแบบตามสเปกเดิม (ต้องแก้โค้ด+เทสต์เพิ่มอีกรอบ)
- **C**: ยกเลิก server-side re-validation ส่วนนี้ทั้งหมด

ปอนด์สามารถลองผลิตจริงในหน้า "งานผลิต" (feedback ข้อ 4 ใน §5.2) แล้วลองปรับจำนวนวัตถุดิบที่ระบบเสนอให้มากกว่า
required เล็กน้อยก่อนยืนยัน เพื่อดูพฤติกรรมปัจจุบันด้วยตัวเองก่อนตัดสินใจ

### MIN-09 (Minor, ไม่ block, Engineer เปิดเผยเองแล้วในรอบพัฒนา) — QC incoming table อาจ overflow บนแท็บเล็ต portrait

หน้า "ตรวจรับวัตถุดิบขาเข้า" (QC incoming) อาจต้อง scroll แนวนอนทั้งหน้าแทนที่จะ scroll แค่ในตาราง เมื่อความ
กว้างข้อมูล (เช่น ชื่อผู้จำหน่ายยาว) เกิน viewport 768px — ดู `docs/test-plans/erp-core-prototype/
uat-print-responsive-script.md` ส่วนที่ 2 เพื่อทดสอบเอง ไม่ block Gate 2

### Observation ใหม่จาก final smoke รอบนี้ (ไม่ใช่ defect)

- **invoice ที่มาจาก seed data เดิม (`INV-2026-000001` v1/v2) เปิดพิมพ์ไม่ได้** เพราะไม่มี `document_snapshot`
  (สร้างตรงในสคริปต์ seed ไม่ผ่าน flow ออก invoice จริง) — invoice ที่ออกผ่านหน้าเว็บจริงทุกใบพิมพ์ได้ปกติ
  (ยืนยันแล้ว §5.1) — ให้ปอนด์ทดสอบพิมพ์ด้วย invoice ที่เพิ่งออกเองเท่านั้น

### ปัญหา infra เดิมที่ยังพบซ้ำ

- MySQL healthcheck race ตอน setup จาก Docker volume ใหม่ล้วนๆ (§2) — เป็นเรื่อง timing ของ infra ล้วนๆ
  ไม่ใช่บั๊ก schema/seed/business logic, แก้ได้ด้วยการรันคำสั่งที่ fail ซ้ำอีกครั้งโดยไม่ต้องล้างอะไรเพิ่ม
  (พบซ้ำอีกครั้งในรอบ final smoke นี้ ยืนยันว่ายังไม่ได้แก้ที่ root cause แต่ไม่ block เพราะมีวิธีแก้ชัดเจน)

### วิธี Reset ระบบ (ล้างข้อมูล กลับไปเป็น seed เริ่มต้น)

```bash
npm run db:seed          # รันซ้ำได้ทุกเมื่อ (idempotent - ลบข้อมูลเก่าทั้งหมดแล้วสร้างใหม่)
```

### วิธี Reset ทั้งหมดจากศูนย์ (ล้าง MySQL container/volume ด้วย)

```bash
npm run reset             # = docker compose down -v && npm run setup
```
ใช้เมื่อสงสัยว่า schema/ข้อมูลเพี้ยนไปไกลเกินจะ `db:seed` แก้ได้ (เช่น เปลี่ยน `prisma/schema.prisma` แล้ว
migration ชนกัน) — **ถ้าเจอ `P1017` ตอน migrate หลังคำสั่งนี้ ดู §2 สำหรับวิธีแก้ (ปกติ)**

### ปัญหาที่พบบ่อย (Troubleshooting)

| อาการ | สาเหตุที่เป็นไปได้ | วิธีแก้ |
|---|---|---|
| `docker info` บอกว่า `Server:` ต่อไม่ได้ | Docker Desktop ยังไม่เปิด/ยังไม่พร้อม | เปิด Docker Desktop รอจนไอคอนขึ้นสถานะ running แล้วลองใหม่ |
| `prisma migrate deploy` error `P1017: Server has closed the connection` (เฉพาะตอน setup จาก volume ใหม่) | MySQL healthcheck race (§2) | รอ container ขึ้น `healthy` จริง +5 วินาที แล้วรันคำสั่งที่ fail ซ้ำ ไม่ต้อง `down -v` ใหม่ |
| Port 3306/4000/5173 ชนกับโปรแกรมอื่นที่รันอยู่ (รวมถึง `npm run dev` ค้างจากรอบก่อน) | มีโปรแกรม/process อื่นใช้ port เดียวกัน | ดู §3 "ถ้าเคยรัน npm run dev ค้างไว้จากรอบก่อน" |
| Login ไม่ได้ทั้งที่รหัสผ่านถูก | ยังไม่ได้ seed หรือ seed พังกลางทาง | รัน `npm run db:seed` แล้วเช็ค log ว่าจบด้วย `[seed] done.` |
| หน้าเว็บขึ้น error แต่ backend log ปกติ | frontend proxy (vite) ชี้ผิด port | เช็คว่า backend รันที่ `:4000` จริง (`curl http://localhost:4000/health`) |
| Integration test (`npm run test:integration`) ค้างนาน/timeout | seed-reset endpoint สร้าง reseed ทุกไฟล์ ใช้เวลาสะสม | ปกติ (30s timeout ต่อไฟล์ตั้งไว้แล้วใน jest.config.js) รอจนจบ |

---

## 7. คำสั่งที่ใช้บ่อย (Cheat sheet)

| งาน | คำสั่ง |
|---|---|
| Setup จากศูนย์ | `npm run setup` |
| ล้างทุกอย่างแล้ว setup ใหม่ | `npm run reset` |
| รันระบบ (dev, hot-reload) | `npm run dev` |
| รันระบบผ่าน Docker เต็ม stack | `docker compose up -d` |
| หยุด MySQL container | `docker compose down` (เพิ่ม `-v` ถ้าต้องการลบข้อมูลด้วย) |
| Reset ข้อมูล seed อย่างเดียว | `npm run db:seed` |
| รัน unit tests (ไม่ต้องมี DB) | `npm run test:unit` |
| รัน integration tests (ต้องมี MySQL) | `npm run test:integration` |
| รัน e2e tests (ต้องรัน `npm run dev` ไว้ก่อน + `npx playwright install` แล้ว) | `npm run test:e2e` |
| Lint | `npm run lint` |
| Build (ก่อน deploy) | `npm run build` |

---

## 8. Config / secrets

- `.env.example` = template ที่ commit เข้า git ได้ ไม่มี secret จริง — ทุกค่าเป็นค่า default สำหรับ local
- `.env` = ไฟล์จริงที่ใช้รัน (อยู่ใน `.gitignore` แล้ว **ห้าม commit**) copy จาก `.env.example` แล้วปรับได้ตามต้องการ
- `.env.test` = ใช้เฉพาะตอนรัน `npm run test:integration` (ชี้ไป schema แยก `erp_core_prototype_test`
  ไม่ปนกับข้อมูล dev) — ไม่มี secret จริง (ค่า dummy เดียวกับ local dev) จึง commit ไว้ได้เพื่อให้ทีมถัดไป
  รันซ้ำได้ทันทีโดยไม่ต้องเดา
- ไม่มี secret จริงใดๆ ถูก hardcode ในโค้ด — ทุกค่าที่ต้องเปลี่ยนตอนขึ้น production จริง (JWT_SECRET,
  DB password ฯลฯ) มาจาก env ทั้งหมด (ดู ADR-001)

---

## 9. Phase 3 (GCP) readiness — อ่านเพิ่มที่ `docs/design/erp-core-prototype/tasks.md` D5

ระบบถูกออกแบบ container-first อยู่แล้ว (Dockerfile.backend/Dockerfile.frontend + docker-compose.yml
ใช้งานได้จริงในรอบนี้) การย้ายไป Phase 3 ไม่ต้อง rewrite โครงสร้าง แค่:
- MySQL local → Cloud SQL (เปลี่ยน `DATABASE_URL` เท่านั้น)
- container → Cloud Run
- Socket.IO ต้องเพิ่ม Redis adapter ถ้ามีมากกว่า 1 instance
- DEF-06 (NumberSequence bug) ถูกแก้ที่ root cause แล้วจริง (`LAST_INSERT_ID(1)` ใน VALUES clause ของ
  `src/backend/lib/numberSequence.ts`) และ workaround ชั่วคราว (`?connection_limit=1`) ที่ DevOps เคยใส่ไว้
  ใน `DATABASE_URL` **ถูกเอาออกแล้ว** (ยืนยันจาก `.env`/`.env.test`/`docker-compose.yml` ปัจจุบัน ไม่มี
  parameter นี้อีกต่อไป) — ยืนยันด้วย concurrency test เขียวทั้งหมด (verify-3 เป็นต้นมา) ปลอดภัยสำหรับ
  multi-connection/multi-instance บน Phase 3 แล้ว ไม่ต้องทำอะไรเพิ่มในจุดนี้
