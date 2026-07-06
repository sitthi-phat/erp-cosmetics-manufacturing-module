# Runbook — ERP Core Prototype (Local PC only, Phase 2)

- **slug**: `erp-core-prototype`
- **เขียนโดย**: DevOps
- **อัปเดตล่าสุด**: 2026-07-08 (หลัง final smoke ก่อน Human Gate 2 — QA verify-5 เขียวทั้งหมด, defect 15/15 ปิด)
- **เป้าหมาย**: ให้ปอนด์ (หรือใครก็ตาม) รันระบบนี้บนเครื่องตัวเองได้ "จากศูนย์" โดยไม่ต้องถามใคร

> ✅ **สถานะล่าสุด**: DEF-01 ถึง DEF-15 ปิดครบทั้งหมดแล้ว (QA verify-5, 2026-07-08) — unit 175/175, integration
> 152/154 (2 documented skip), e2e 18/19 (1 documented skip) เขียวทั้งหมด. DevOps ทำ **final smoke จากศูนย์จริง**
> (ล้าง Docker volume ทั้งหมด แล้วตั้งใหม่ตาม runbook นี้ทีละบรรทัด) ยืนยันว่าใช้งานได้จริง — รายละเอียดที่ §5.1

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
| `sales_demo` | Sales/CS (SA) | สร้าง/ดู PO, ลูกค้า |
| `warehouse_demo` | คลังสินค้า (WH) | รับของเข้า (goods receipt), ดู stock real-time |
| `production_demo` | ฝ่ายผลิต (PR) | คิวผลิต, assign, ผลิต batch |
| `qc_demo` | QA/QC (QA) | ตรวจ batch/lot |
| `logistics_demo` | ฝ่ายจัดส่ง (LO) | สร้าง/อัปเดตสถานะ shipment |
| `finance_demo` | บัญชี/การเงิน (FI) | ออก invoice, บันทึกชำระเงิน, ดูตัวเลือกสินค้าตอน revise invoice (`product.view`) |
| `admin` | Admin (AD) | จัดการผู้ใช้/สิทธิ์ (`user.view_basic` ให้ role อื่นดูรายชื่อผู้ใช้แบบจำกัดได้), ตั้งค่า VAT |
| `role_with_no_menu_demo` | No Menu (NM, ไม่มี permission ใดๆ เลยโดยตั้งใจ) | ทดสอบเคส "role ไม่มีเมนูที่กำหนด → ต้องเห็นข้อความ 'ติดต่อ Admin' ไม่ใช่หน้าว่างเปล่า" (ECP-034 AC3) |
| `brand_new_user_demo` | Sales (SA, บัญชีแยกจาก `sales_demo`) | ทดสอบเคส "login ครั้งแรกสุด → ต้องเห็น onboarding tooltip อย่างน้อย 1 จุด" (ECP-034 AC2) — แยกบัญชีจาก `sales_demo` เพื่อไม่ให้ onboarding state (เก็บใน browser ผ่าน localStorage) ปนกัน |

---

## 5. Flow แนะนำให้คลิกทดสอบ (demo flow เต็มสาย, ตรงกับ brief.md DoD #1)

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

### 5.1 ผลการทำ Final Smoke จากศูนย์ (2026-07-08, ยืนยันจริงก่อนเปิด Human Gate 2)

ทำตาม runbook นี้ทีละขั้นเหมือนคนที่ไม่เคยเห็นระบบมาก่อน (`npm run reset` → `npm run setup` → `npm run dev`):

| ขั้นตอน | ผล |
|---|---|
| `npm run reset` (ล้าง Docker volume ทั้งหมดจริง) → `npm run setup` | เจอ timing race ที่ §2 ระบุไว้ 1 ครั้ง (`P1017` ตอน migrate) — แก้ตามขั้นตอนใน §2 แล้วผ่านทันทีในรอบถัดไป ไม่ต้อง `down -v` ซ้ำ |
| `docker compose ps` | `mysql` container `Up (healthy)` |
| `npm run dev` → `curl http://localhost:4000/health` | `{"status":"ok"}` |
| `curl http://localhost:5173/` | HTTP 200 |
| Login จริงผ่าน HTTP (`POST /api/v1/auth/login`) ด้วย `admin` + `sales_demo` | ทั้งคู่ 200 OK, คุกกี้ set ถูกต้อง, `GET /auth/me` คืน role/permissions ตรง (เห็น `product.view`/`user.view_basic` ใน payload ของ admin) |
| Login `brand_new_user_demo` + `role_with_no_menu_demo` ผ่าน HTTP | ทั้งคู่ 200 OK — `role_with_no_menu_demo` คืน `"permissions": []` ตรงตามที่ตั้งใจ |
| เปิดหน้าเว็บจริงผ่าน browser (Playwright, chromium) — login ครบทั้ง 7 role หลัก | ทุก role โหลดหน้าแรกสำเร็จ, เมนูซ้ายตรงกับสิทธิ์ของแต่ละ role (admin เห็นครบ, sales เห็นเฉพาะที่เกี่ยวข้อง) |
| คลิกเมนู "คำสั่งซื้อ (PO)" ทันทีหลัง login (`sales_demo`) | **คลิกได้ทันที ไม่มี overlay บัง** (ยืนยันว่า DEF-07 onboarding-tour-block fix ยังอยู่ ไม่ regress) → navigate ไป `/pos` สำเร็จ |
| Console error บนหน้าแรกหลัง login | พบ 1 รายการที่ไม่ block (`Failed to load resource: 401`) เกิดจาก request แรกสุดก่อนคุกกี้ auth ถูกตั้งค่าเสร็จ (retry ตามมาสำเร็จ, หน้าโหลด/render ถูกต้อง 100% ไม่กระทบการใช้งาน) — ไม่ยกเป็น defect ใหม่ เป็นแค่ observation |
| ปิด background process (backend/frontend) ที่ smoke test เปิดไว้ | ปิดเรียบร้อยผ่าน `taskkill` ตาม PID, ตรวจซ้ำด้วย `netstat` ว่า port 4000/5173 ว่างแล้ว |
| MySQL container | **คงไว้ให้ปอนด์ใช้ต่อ** (`docker compose ps` ยังเห็น `Up (healthy)`) พร้อมข้อมูล seed สดใหม่ (reseed ล่าสุดหลัง smoke) |

**สรุป**: runbook นี้ทำตามได้จริงตั้งแต่ศูนย์ (fresh Docker volume) จนถึงเปิดเว็บ+login ได้ครบทุก role — พร้อม
ให้ปอนด์ทดสอบเองได้ทันที

### 5.2 สิ่งที่ปอนด์ควรลองกด (ครอบคลุม flow เด่นทั้งหมดของ prototype นี้)

ลำดับแนะนำสำหรับปอนด์ทดสอบเอง (ใช้เวลาประมาณ 15-20 นาที ถ้าไล่ครบทุกข้อ):

1. **สร้างลูกค้าใหม่** — login `sales_demo` → เมนู "ลูกค้า" → เพิ่มลูกค้าใหม่ (สังเกตว่า customer_id
   สร้างอัตโนมัติ ไม่มีช่องให้กรอกเอง)
2. **สร้าง PO** — จากลูกค้าที่เพิ่งสร้าง (หรือลูกค้าเดิมจาก seed) → เพิ่มสินค้า → ยืนยัน PO → สังเกตว่า
   ระบบเช็ค stock วัตถุดิบตาม BOM ให้อัตโนมัติก่อนอนุมัติ
3. **ดู stock real-time** — เปิดอีกแท็บ login `warehouse_demo` → หน้า "สต็อกวัตถุดิบ" เปิดค้างไว้ → กลับไป
   ทำ goods receipt (รับวัตถุดิบเข้า) ในแท็บเดิมหรือแท็บใหม่ → สังเกตว่าตัวเลขในแท็บ "สต็อกวัตถุดิบ" อัปเดต
   เองโดยไม่ต้อง refresh หน้า (ภายใน 1 นาที)
4. **Assign งานผลิต** — login `production_demo` → "งานผลิต" → คิวงาน → assign PO ที่ยืนยันแล้วเข้าคิว →
   ผลิต (เลือก Lot วัตถุดิบที่จะใช้) → ได้เลข Batch ใหม่
5. **QC Approve** — login `qc_demo` → "ตรวจสอบคุณภาพ (QC)" → หา batch ที่เพิ่งผลิต → Approve
6. **สร้าง Shipment** — login `logistics_demo` → "จัดส่งสินค้า" → สร้าง shipment จาก batch ที่ QC
   Approved แล้ว (batch ที่ยังไม่ผ่าน QC จะไม่ปรากฏให้เลือก) → อัปเดตสถานะจนถึง Delivered
7. **ออก Invoice + ดู VAT** — login `finance_demo` → "Invoice / การเงิน" → ออก invoice จาก PO ที่ Shipped
   แล้ว → สังเกตว่า VAT (7% ค่าเริ่มต้น) คำนวณให้อัตโนมัติในยอดรวม → บันทึกการชำระเงิน
8. **Revise Invoice** — จาก invoice ที่เพิ่งออก → กด "แก้ไข/revise" → ปรับจำนวน/ราคา → ยืนยัน → สังเกตว่า
   ระบบสร้างเป็น version ใหม่ (v2) โดยที่ v1 ยังดูย้อนหลังได้ (ไม่ถูกเขียนทับ) พร้อม timeline แสดงว่า v1 ถูก
   แทนที่โดย v2 เมื่อไหร่/โดยใคร
9. **ดู Dashboard** — สลับ login ไปแต่ละ role แล้วดูหน้า "หน้าแรก" ของแต่ละคน (ตัวเลขสรุปของแต่ละแผนก
   ตรงกับข้อมูลที่เพิ่งทำไปในข้อ 1-8 หรือไม่)
10. **ดู Audit Log** — login `admin` → "Audit Log" → ค้นหา action ที่เพิ่งทำไปทั้งหมด (สร้าง PO, ผลิต,
    QC approve, ออก invoice, revise invoice ฯลฯ) ต้องเห็นครบทุก action พร้อมชื่อผู้ทำ+เวลา
11. **ทดสอบ role ที่ไม่มีเมนู** — login `role_with_no_menu_demo` → ต้องเห็นข้อความชัดเจนว่า "ยังไม่มีเมนูที่
    กำหนดให้บทบาทนี้ กรุณาติดต่อ Admin" ไม่ใช่หน้าว่างเปล่า
12. **ทดสอบ onboarding ผู้ใช้ใหม่** — login `brand_new_user_demo` (ครั้งแรกในเบราว์เซอร์/โหมดไม่ระบุตัวตน
    ที่ยังไม่เคย login มาก่อน) → ต้องเห็น onboarding tooltip แนะนำอย่างน้อย 1 จุด และคลิกเมนูต่อได้ทันที
    ไม่มี overlay ค้างบัง

---

## 6. ปัญหาที่รู้อยู่แล้ว (Known Issues)

รายละเอียดเต็มอยู่ที่ `docs/infra/erp-core-prototype/devops-verify-report.md` และ
`docs/test-plans/erp-core-prototype/defects.md` (DEF-01 ถึง DEF-15, ปิดครบทั้งหมดแล้ว ณ verify-5)

- **ปัญหาเดียวที่ยังพบระหว่าง final smoke**: MySQL healthcheck race ตอน setup จาก Docker volume ใหม่ล้วนๆ
  (§2) — เป็นเรื่อง timing ของ infra ล้วนๆ ไม่ใช่บั๊ก schema/seed/business logic, แก้ได้ด้วยการรันคำสั่งที่
  fail ซ้ำอีกครั้งโดยไม่ต้องล้างอะไรเพิ่ม
- ไม่พบบั๊ก Critical/Major ใหม่ระหว่าง final smoke (console error 401 ที่พบเป็นแค่ observation ไม่กระทบ
  การใช้งานจริง — ดู §5.1)

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
