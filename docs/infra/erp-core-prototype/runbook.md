# Runbook — ERP Core Prototype (Local PC only, Phase 2)

- **slug**: `erp-core-prototype`
- **เขียนโดย**: DevOps
- **อัปเดตล่าสุด**: 2026-07-07
- **เป้าหมาย**: ให้ปอนด์ (หรือใครก็ตาม) รันระบบนี้บนเครื่องตัวเองได้ "จากศูนย์" โดยไม่ต้องถามใคร

> ⚠ **อ่านก่อนเริ่ม**: ระบบนี้พบบั๊กจริงระดับ Critical ระหว่างการทดสอบกับ MySQL จริงเป็นครั้งแรก (ดู
> §6 "ปัญหาที่รู้อยู่แล้ว" ด้านล่าง) ทำให้ `npm run db:seed` **อาจ fail แบบสุ่มถ้าไม่มี workaround** —
> runbook นี้ใส่ workaround ไว้ให้แล้วใน `.env`/`.env.test`/`docker-compose.yml` (parameter
> `connection_limit=1` ใน `DATABASE_URL`) ดังนั้นทำตามขั้นตอนด้านล่างตรงๆ จะไม่เจอปัญหานี้ แต่ถ้าไปแก้ค่า
> `DATABASE_URL` เองแล้วลบ `connection_limit=1` ออก อาจเจอ seed พังอีกครั้ง

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
3. `npm run db:seed` — ใส่ข้อมูลตัวอย่าง (7 users/roles, ลูกค้า, วัตถุดิบ, สินค้า, PO→ผลิต→QC→จัดส่ง→invoice
   ตัวอย่างครบสาย)
4. migrate + seed schema สำหรับเทสต์ (`erp_core_prototype_test`) เช่นกัน
5. `npx playwright install chromium` — ติดตั้ง browser สำหรับรัน e2e test

**ใช้เวลาประมาณ 2-5 นาที** (ส่วนใหญ่คือดาวน์โหลด MySQL image + Chromium ครั้งแรก)

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

---

## 4. บัญชีทดสอบ (จาก seed data) — ครบ 7 roles

รหัสผ่านเดียวกันทุกบัญชี: **`Password123!`**

| Username | บทบาท (role) | หน้าที่หลักที่ทดสอบได้ |
|---|---|---|
| `sales_demo` | Sales/CS | สร้าง/ดู PO, ลูกค้า |
| `warehouse_demo` | คลังสินค้า | รับของเข้า (goods receipt), ดู stock real-time |
| `production_demo` | ฝ่ายผลิต | คิวผลิต, assign, ผลิต batch |
| `qc_demo` | QA/QC | ตรวจ batch/lot |
| `logistics_demo` | ฝ่ายจัดส่ง | สร้าง/อัปเดตสถานะ shipment |
| `finance_demo` | บัญชี/การเงิน | ออก invoice, บันทึกชำระเงิน |
| `admin` | Admin | จัดการผู้ใช้/สิทธิ์, ตั้งค่า VAT |

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

> ⚠ **หมายเหตุจากการทดสอบจริง**: ตอนนี้ยังมีบั๊กที่ทำให้ flow ข้อ 1 (คลิก "คำสั่งซื้อ (PO)" ทันทีหลัง login
> ครั้งแรก) ค้างได้ เพราะ onboarding tour overlay ไม่ยอมหายไปและบังปุ่มกด — ถ้าเจอปัญหานี้ให้กด Escape หรือ
> คลิกที่พื้นที่ว่างก่อน แล้วค่อยคลิกเมนู (ดู §6 DEF-07)

---

## 6. ปัญหาที่รู้อยู่แล้ว (Known Issues) — พบจากการทดสอบกับ MySQL/browser จริงเป็นครั้งแรก

รายละเอียดเต็มอยู่ที่ `docs/infra/erp-core-prototype/devops-verify-report.md`. สรุปสั้นๆ:

- **DEF-06 (Critical)**: `npm run db:seed` อาจ fail แบบสุ่มด้วย "Unique constraint failed on customer_id"
  (หรือ user_id/PO number ฯลฯ) — เกิดจากบั๊กจริงใน `src/backend/lib/numberSequence.ts` (MySQL
  `LAST_INSERT_ID()` ไม่ถูกตั้งค่าตอน insert แถวใหม่ครั้งแรกของแต่ละ prefix) **มี workaround ใส่ไว้แล้ว**
  ใน `.env`/`.env.test`/`docker-compose.yml` (`?connection_limit=1` ใน `DATABASE_URL`) ทำให้
  `npm run setup`/`npm run db:seed` ปกติไม่เจอปัญหานี้ — **ถ้าเจอ error นี้อยู่ดี ให้รัน `npm run db:seed`
  ซ้ำอีกครั้ง** (มักจะผ่านในการรันครั้งถัดไป) แล้วแจ้ง Engineer ให้แก้ root cause
- **DEF-07 (Major)**: onboarding tour (ECP-034 AC2) เปิดครั้งแรกหลัง login แล้ว overlay ค้างบังปุ่มกดเมนู
  จนคลิกไม่ได้ — ทดสอบจริงด้วย browser (Playwright) แล้วพบว่า demo flow หลักค้างที่ขั้นตอนนี้จริง
- **DEF-08 (Major, ต้อง QA/Engineer คุยกันเพื่อ sync)**: automated integration test หลายไฟล์คาดหวังว่า
  response body จะเป็น field แบนๆ (เช่น `res.body.customer_id`) แต่ API จริงห่อด้วย
  `{ data: {...}, warning: ... }` (เช่น `res.body.data.customerId`) ทำให้เทสต์จำนวนมากอ่านค่าไม่ตรง
  ไม่ใช่บั๊ก business logic แต่เป็นความไม่ตรงกันระหว่าง test spec กับ implementation ที่ต้อง reconcile

### วิธี Reset ระบบ (ล้างข้อมูล กลับไปเป็น seed เริ่มต้น)

```bash
npm run db:seed          # รันซ้ำได้ทุกเมื่อ (idempotent - ลบข้อมูลเก่าทั้งหมดแล้วสร้างใหม่)
```

### วิธี Reset ทั้งหมดจากศูนย์ (ล้าง MySQL container/volume ด้วย)

```bash
npm run reset             # = docker compose down -v && npm run setup
```
ใช้เมื่อสงสัยว่า schema/ข้อมูลเพี้ยนไปไกลเกินจะ `db:seed` แก้ได้ (เช่น เปลี่ยน `prisma/schema.prisma` แล้ว
migration ชนกัน)

### ปัญหาที่พบบ่อย (Troubleshooting)

| อาการ | สาเหตุที่เป็นไปได้ | วิธีแก้ |
|---|---|---|
| `docker info` บอกว่า `Server:` ต่อไม่ได้ | Docker Desktop ยังไม่เปิด/ยังไม่พร้อม | เปิด Docker Desktop รอจนไอคอนขึ้นสถานะ running แล้วลองใหม่ |
| `npm run db:seed` ล้ม ด้วย `Unique constraint failed` | DEF-06 (ดูด้านบน) | รันคำสั่งเดิมซ้ำอีกครั้ง 1-2 รอบ |
| Port 3306/4000/5173 ชนกับโปรแกรมอื่นที่รันอยู่ | มีโปรแกรมอื่นใช้ port เดียวกัน | ปิดโปรแกรมนั้น หรือแก้ port mapping ใน `docker-compose.yml`/`.env`/`src/frontend/vite.config.ts` ให้ตรงกันทั้ง 3 จุด |
| Login ไม่ได้ทั้งที่รหัสผ่านถูก | ยังไม่ได้ seed หรือ seed พังกลางทาง | รัน `npm run db:seed` แล้วเช็ค log ว่าจบด้วย `[seed] done.` |
| หน้าเว็บขึ้น error แต่ backend log ปกติ | frontend proxy (vite) ชี้ผิด port | เช็คว่า backend รันที่ `:4000` จริง (`curl http://localhost:4000/health`) |
| Integration test (`npm run test:integration`) ค้างนาน/timeout | seed-reset endpoint สร้าง reseed ทุกไฟล์ ใช้เวลาสะสม | ปกติ (30s timeout ต่อไฟล์ตั้งไว้แล้วใน jest.config.js) รอจนจบ |
| e2e test หา element ไม่เจอ/ค้าง | DEF-07 (onboarding tour บัง) หรือ testid ไม่ตรงกับหน้าจอปัจจุบัน | ดู `docs/infra/erp-core-prototype/devops-verify-report.md` สำหรับรายละเอียด |

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
- **สำคัญ**: ต้องแก้ DEF-06 (NumberSequence bug) ก่อนขึ้น production จริงที่มีมากกว่า 1 connection/instance
  — workaround `connection_limit=1` ใช้ได้เฉพาะ local single-instance เท่านั้น จะ**ใช้ไม่ได้จริง**ใน
  Cloud Run แบบ multi-instance (ทำให้ NumberSequence ชนกันข้าม instance รุนแรงกว่าเดิม)
