# Scope Expansion — OEM vs Own-Brand Orders + Supply Planning + FG Stock + BOM Cost Snapshot

slug: `erp-v2-ui-first` · เขียนโดย PO · 2026-07-27 (r2 — ฝัง 12 คำตอบปอนด์ + เพิ่ม A–E) · ที่มา: ประชุมลูกค้า 2026-07-24 + คำตอบปอนด์ 2026-07-27
สถานะ: **DELTA ต่อ spec ที่ล็อกอยู่ (Gate 2 FINAL)** — ต่อยอด/แก้บางส่วน ไม่แทน `entity-status-map.md` / `status-journeys.md` / `stock-reservation.md`
ผู้อ่านหลัก: **UX/UI** (Stage 1 รอบใหม่ — วาดเฉพาะ delta) · รอง: BA/TL (Stage 2 ต่อ)

> ปอนด์บอก "ถามได้อีกเรื่อย ๆ" — ยังห้ามเดา business fact. คำถามใหม่ที่ยังต้องเคาะอยู่ **§12**. ค่าที่ยังไม่เคาะใส่ป้าย **[รอ NQ#]**.

---

## สรุปภาษาไทย
สโคปใหม่ (ปอนด์เคาะครบ 12 ข้อ + เพิ่มงาน): ออเดอร์แยก **2 สาย** — **OEM = PO เดิม** (Sale HQ คีย์, line เป็น BOM/วัตถุดิบ, วัตถุดิบตรงก็ยังวิ่งผ่าน "ขั้นผลิต" แม้ไม่ต้องแปรรูปจริง) และ **Own Brand = เอกสารใหม่ ใบสั่งขาย `SO-{YYYYMM}-{NNNNNN}` หน้าแยกจาก PO** (ขายจากสต็อก=ต้องเลือกลูกค้า / ผลิตเก็บสต็อก=ไม่ต้องเลือกลูกค้า). เพิ่มโมดูล **Supply Planning** (FG on-hand read-only, in-production นับจาก Batch, ป้าย Low/OK/Overstock ที่ <Target / Target–2×Target / >2×Target, ปุ่ม "สั่งผลิต" = สร้าง PRD เก็บสต็อกไม่ผูกลูกค้า). **BOM เพิ่มหมวดต้นทุนเองได้ (per-unit) + snapshot ตอนขาย** (เก็บไว้เฉย ๆ ยังไม่ทำรายงาน COGS). **สต็อก:** 1 BOM = 1 FG (auto), FG เข้าคลังตอน QC ผ่าน, OEM ส่งตรงไม่เก็บ FG **ยกเว้นผลิตเกิน (เผื่อ/เทสต์) → ส่วนเกินเข้าเป็น FG stock**, loss ตัด on_hand อย่างเดียว. เพิ่ม **A) เช็ค journey ครบ · B) สิทธิ์ RBAC · C) การ trace · D) loss เชิงลึก · E) ตาราง As-Is→To-Be** (อินพุตหลักให้ Stage 1 วาด mockup delta). **ยังมีคำถามใหม่ค้าง 5 ข้อ (§12): จุด/คนยืนยัน surplus, role Sale HQ, สิทธิ์โมดูลใหม่, กติกา loss, การ trace FG ราย Batch → ต้องเคาะก่อนวาด**.

---

## 0. Business context
โรงงานทำ **2 โมเดลพร้อมกัน**: OEM (รับจ้างผลิต, made-to-order) และ Own Brand (แบรนด์ตัวเอง, produce-to-stock/sell-from-stock). spec ที่ล็อกรองรับเฉพาะ OEM. สโคปนี้เพิ่มสาย Own Brand + สต็อกสินค้าสำเร็จรูปที่นับได้จริง + เครื่องมือวางแผน demand/cover + จับ **surplus การผลิตเกิน** เข้าสต็อก.

---

## 1. ★ Decided Rules — ปอนด์เคาะแล้ว 2026-07-27 (LOCKED)
> ทั้งหมดนี้เป็น **ข้อสรุป** (ไม่ใช่คำถามอีกต่อไป). อ้างเป็น D1–D12.

| # | เรื่อง | กติกาที่ล็อก |
|---|---|---|
| **D1** | เอกสาร Own-Brand | เอกสาร+เลข **ใหม่แยก** `SO-{YYYYMM}-{NNNNNN}` (gapless ต่อเดือน เหมือนเลขอื่น) · **หน้าแยกจาก PO** (`so-create` / `so-detail` / `so-list`) เพื่อไม่ให้การเปลี่ยนในอนาคตกระทบ PO |
| **D2** | Lifecycle Own-Brand ตาม 2 sub-case | **(a) ขายจากสต็อก:** **ต้องเลือกลูกค้า** · **(b) ผลิตเก็บสต็อก:** **ไม่ต้องเลือกลูกค้า** |
| **D3** | OEM line = วัตถุดิบตรง | **ยังวิ่งผ่านขั้นผลิตเสมอ** (PO เดินสถานะผ่าน production flow ตามปกติ) แต่ **อาจไม่มีการแปรรูปจริง** — ใช้ flow เดียวกับการผลิต (มี PRD/Batch/QC ตามสถานะ, การแปรรูป optional) |
| **D4** | Supply Planning: ที่มาข้อมูล | **FG On Hand = read-only ดึงจาก FG stock** · **In Production = นับจาก Batch ของ FG นั้น** (Batch ที่ยังไม่เข้าคลัง) |
| **D5** | ป้ายสถานะ | **Low = cover < Target** · **OK = Target ≤ cover ≤ 2×Target** · **Overstock = cover > 2×Target** |
| **D6** | Suggested production | **เมื่อ Available < Target stock → ผลิตเติมให้ถึง Target แล้วปัดขึ้น (ceil) เป็นทวีคูณ Batch Size** (ตรง screenshot: FG-101 = 1500, FG-204 = 0) |
| **D7** | แปลง Sales Rate | **สัปดาห์ ÷7, เดือน ÷30** เป็น per-day · runs-out / through date นับแบบ **วันปฏิทิน** |
| **D8** | ปุ่ม "สั่งผลิต" ใน Supply Planning | **สร้างใบสั่งผลิตเก็บสต็อก (PRD) ที่ไม่ผูกลูกค้า** (produce-to-stock) |
| **D9** | BOM ต้นทุนเพิ่ม | **ผู้ใช้เพิ่มหมวดต้นทุนเองได้อิสระ** (ไม่ใช่ชุดตายตัว) · ต้นทุนเป็น **ต่อหน่วย (per-unit)** |
| **D10** | Cost snapshot | **เก็บ snapshot ไว้เฉย ๆ ตอนนี้ — ยังไม่ทำรายงาน COGS/กำไร** · snapshot ถูก "ใช้" เฉพาะ **ตอนเกิดการขาย** (แนบมูลค่าต้นทุน ณ ตอนขาย) เพื่อให้อนาคตคำนวณ COGS/margin ได้ · **data model ต้องพร้อมรองรับ COGS แต่ไม่สร้าง UI รายงานในเฟสนี้** |
| **D11** | รหัส FG ↔ BOM | **1 BOM = 1 FG** · รหัส FG **สร้างอัตโนมัติ** (ผูกกับ BOM ตรง ๆ) |
| **D12** | กติกาสต็อก FG (option ก) + surplus | **OEM ส่งตรง ไม่เก็บ FG** · **FG เข้าคลังอัตโนมัติตอน Batch QC ผ่าน** · **loss ตัด on_hand อย่างเดียว** · **FG จอง/ตัด เหมือน RM** (จองตอนยืนยัน → ตัดตอนพร้อมจัดส่ง) · **★ ข้อยกเว้น surplus:** OEM อาจ **ตั้งใจผลิตเกิน** (เทสต์ / เผื่อลูกค้าสั่งเพิ่ม) → **จำนวนที่ลูกค้าสั่งส่งให้ลูกค้า, ส่วนเกินกลายเป็น FG/BOM stock ที่ available สำหรับออเดอร์อนาคต** (คลังได้รับแจ้ง/ยืนยัน) — จุด/คนยืนยัน = **[รอ NQ1]** |

---

## 2. สองสายการเปิดออเดอร์ (OEM vs Own Brand)

### 2.1 ตารางเทียบ (อัปเดตตาม D1–D3)
| มิติ | **OEM — PO (รับจ้างผลิต)** | **Own Brand — SO (สั่งขาย)** |
|---|---|---|
| เอกสาร/เลข | `PO-{YYYYMM}-{NNNNNN}` (เดิม) | **`SO-{YYYYMM}-{NNNNNN}` (D1, ใหม่)** |
| หน้าจอ | po-create/detail/list (เดิม) | **so-create/detail/list (D1, หน้าแยก)** |
| ใครเปิด | **Sale HQ** (role = **[รอ NQ2]**) | Sale (role = **[รอ NQ2]**) |
| line | BOM / วัตถุดิบตรง (วัตถุดิบตรง → ผ่านขั้นผลิต D3) | **FG (สินค้าสำเร็จรูปที่มีสต็อก)** |
| ต้องผลิต | ทุกใบ (รวม RM-direct — D3) | (a) ขายจากสต็อก = ไม่ผลิต · (b) เติมสต็อก = ผลิต |
| ลูกค้า | ผูกเสมอ | (a) **เลือก** · (b) **ไม่เลือก** (D2) |
| ผลิตเกิน | **surplus → FG stock (D12)** | ผลิตเก็บสต็อกเข้า FG อยู่แล้ว |

### 2.2 Own-Brand 2 sub-case (flow)
- **(a) Sell-from-stock:** so-create → เลือก **ลูกค้า** + FG ที่มีสต็อก → ระบบโชว์ **FG Available** → ยืนยัน SO = **จอง FG** → (ข้ามการผลิต) → พร้อมจัดส่ง = **ตัด FG** → DN/ส่ง → invoice → ชำระ.
- **(b) Produce-to-stock:** ผ่าน **Supply Planning** กด "สั่งผลิต" (D8) → **PRD ไม่ผูกลูกค้า** → ผลิต → QC ผ่าน → **FG เข้าคลัง** (พร้อมขายภายหลังผ่าน sub-case a).

---

## 3. โมดูลใหม่ — Supply Planning — Demand & Production Cover (สเปกเต็ม, ฝัง D4–D8)

### 3.1 โครงหน้า (ตาม screenshot ปอนด์ = target look)
- **Header:** "SUPPLY PLANNING / Demand & Production Cover"
- **3 stat tiles (รวมพอร์ต):** (1) **ITEMS BELOW TARGET** "X of N" = จำนวนสินค้าที่ cover < Target · (2) **SUGGESTED PRODUCTION** = Σ suggested units · (3) **SHORTEST COVER** = min(cover) วัน
- **การ์ดต่อ FG:** badge (D5) + 7 ช่อง + coverage bar (4 markers) + narrative + 3 footer chips

### 3.2 ฟิลด์ (หน่วย + ชนิด — ฝัง D4)
| ฟิลด์ | หน่วย | ชนิด |
|---|---|---|
| FG On Hand | units | **read-only จาก FG stock (D4)** |
| In Production | units | **computed = นับจาก Batch ของ FG นั้น (D4)** |
| Sales Rate | /day·/week·/month | editable — normalize per-day (D7: ÷7, ÷30) |
| Lead Time | days | editable |
| Safety Cover | days | editable |
| Target Cover | days | editable |
| Batch Size | units | editable |

### 3.3 Outputs + สูตร (ตรวจกับ FG-101 = ✓ ทุกค่า)
สมมติ r = Sales Rate per-day (แปลงตาม D7):
| Output | สูตร | ตรวจ FG-101 |
|---|---|---|
| **Available** | `FG On Hand + In Production` | 1200+13 = **1213** ✓ |
| **Cover today (d)** | `Available ÷ r` | 1213/85 = **14.3** ✓ |
| **Safety stock** | `Safety Cover × r` | 5×85 = **425** ✓ |
| **Reorder point** | `(Lead Time + Safety Cover) × r` | 12×85 = **1020** ✓ |
| **Target stock** | `Target Cover × r` | 30×85 = **2550** ✓ |
| **Risk line (d)** | `Lead Time + Safety Cover` | **12** ✓ |
| **Suggested production** | `ceil( max(0, Target stock − Available) ÷ Batch Size ) × Batch Size` **(D6)** | ceil((2550−1213)/500)×500 = **1500** ✓ |
| **Cover after (d)** | `(Available + Suggested) ÷ r` | 2713/85 = **31.9** ✓ |
| **Runs-out date** | `today + Cover today` (วันปฏิทิน D7) | "10 Aug" |
| **Cover-through date** | `today + Cover after` (วันปฏิทิน D7) | "27 Aug" |

ตรวจ FG-204 (Overstock): 5800/60 = 96.7 (> 2×30=60 → **Overstock** ตาม D5); target stock 1800 < 5800 → suggested **0** ✓.

### 3.4 Badge (D5) + coverage bar
- **Low** cover < Target (แดง) · **OK** Target..2×Target (เหลือง/เขียว) · **Overstock** > 2×Target (ฟ้า/เทา)
- markers: Cover today · After production · Risk line (Lead+Safety) · Target — โซนสีตาม D5

### 3.5 Narrative template
```
"{Available} units available at {r}/day covers {CoverToday} days — runs out {RunsOutDate}.
 Produce {Suggested} units to hold {Available+Suggested} and cover {CoverAfter} days through {CoverThroughDate}."
```
Overstock (Suggested=0): คงประโยคเดิม "...Produce 0 units..." (ตาม screenshot FG-204).

### 3.6 ปุ่ม "สั่งผลิต" (D8)
กด → สร้าง **PRD เก็บสต็อก ไม่ผูกลูกค้า** (produce-to-stock) จำนวน = Suggested production. เข้าสาย production ปกติ → QC ผ่าน → FG เข้าคลัง. **สิทธิ์ใครกดได้ = [รอ NQ3]**.

---

## 4. BOM — ต้นทุนเพิ่ม + snapshot (ฝัง D9–D10)
- เพิ่มกลุ่ม **"ต้นทุนอื่น (ต่อหน่วย)"** — ผู้ใช้ **เพิ่มหมวดเองได้อิสระ** (เช่น ค่าแรง/โสหุ้ย/บรรจุภัณฑ์/อื่น ๆ — ไม่ตายตัว, D9). แต่ละหมวด: ชื่อ + มูลค่า/หน่วย.
- **ต้นทุนรวม/หน่วย** = ต้นทุนวัตถุดิบ (เดิม: max active supplier + override + snapshot) + Σ ต้นทุนอื่น/หน่วย → **snapshot ทั้งก้อน**.
- **การใช้ snapshot (D10):** ค่า snapshot ถูก **แนบตอนเกิดการขาย** (ที่ line ของ SO/PO) เพื่อบันทึกต้นทุน ณ ตอนขาย · **ยังไม่สร้าง UI รายงาน COGS/กำไร** ในเฟสนี้ · data model เตรียมพร้อมรองรับ COGS อนาคต.
- คง badge "ราคาทุนอาจล้าสมัย" ให้ครอบคลุมต้นทุนรวมใหม่.
- **ไม่ลบ** กติกาเดิม: ราคาขาย mandatory, block ถ้าไม่มี supplier active + ไม่ override.

---

## 5. Stock model delta — FG เป็นสินค้าคงคลัง + produce-to-stock + surplus + loss (ฝัง D11–D12)

### 5.1 FG เป็น inventory
- **1 BOM = 1 FG (auto รหัส, D11)** — FG มี 3 ยอด (on_hand/reserved/available) เหมือน RM.
- stock.html รองรับ **2 ชนิด: RM + FG** (แท็บ/มุมมองแยก) · badge ติดลบ/จองเกินเหมือน RM.

### 5.2 FG เข้าคลัง (D12)
- **Own-Brand produce-to-stock:** Batch QC ผ่าน → **FG on_hand เพิ่มอัตโนมัติ** (จำนวน = จำนวน Batch ที่ผ่าน).
- **OEM ปกติ:** ผลิตเสร็จ QC ผ่าน → **ส่งตรงให้ลูกค้า ไม่เก็บ FG**.

### 5.3 ★ OEM surplus → FG stock (D12 ข้อยกเว้น — จุดใหม่)
- เคส: OEM PO สั่ง 100 แต่ผลิตจริง 120 (เผื่อ/เทสต์). **100 ผูก PO ส่งลูกค้า · 20 ส่วนเกิน → เข้าเป็น FG/BOM stock available** สำหรับออเดอร์อนาคต.
- **แจ้งคลัง + คลังยืนยันส่วนเกิน** ก่อนเข้าสต็อก (over-production notify + adjust).
- **จุด/สถานะที่จับ surplus + ใครยืนยัน = [รอ NQ1]** (ยังไม่ชัด — ดู §12).

### 5.4 Warehouse ปรับสต็อก + loss (deepen ที่ §9/Section D)
- คลังปรับ **FG + RM** ได้ทุกเมื่อ (comment + trace บังคับ).
- **loss ตัด on_hand อย่างเดียว (D12)** — reserved ไม่แตะ.
- รายละเอียด loss (จุดบันทึก/เหตุผล/อนุมัติ/shortfall) ดู **§9 (Section D)**.

### 5.5 FG reservation (D12: เหมือน RM)
- **Sell-from-stock SO:** จอง FG ตอนยืนยัน SO → ตัดตอนพร้อมจัดส่ง (มิเรอร์ `stock-reservation.md`). cancel SO = คืนจอง.

---

## 6. Section A — Journey Completeness Check (ปอนด์ถาม "ครบ journey รึยัง")
เดินทั้ง 2 สายเทียบ 6 visual journeys เดิม (Customer→PO→ผลิต→QC→จัดส่ง→Billing):

### 6.1 OEM PO (made-to-order + surplus)
สร้าง → จอง RM → ผลิต (PRD/Batch) → QC → **[surplus→FG stock]** → ส่งลูกค้า (DN) → invoice → ชำระ
- ทุกขั้นมีบ้าน **ยกเว้นขั้น surplus-to-stock** ที่เป็นของใหม่ → บ้านควรอยู่ที่ production/stock แต่ **จุดจับ + ผู้ยืนยันยังไม่ระบุ = GAP → NQ1**.

### 6.2 Own-Brand SO (a) sell-from-stock
สร้าง (เลือกลูกค้า) → จอง FG → พร้อมจัดส่ง (ตัด FG) → DN/ส่ง → invoice → ชำระ
- **GAP เชิงโครงสร้าง (แก้ได้ ไม่ต้องถาม):** DN/Invoice ปัจจุบันผูก **"1 DN = 1 PO"** → ต้องขยายให้ **DN/Invoice อ้าง SO ได้** ด้วย. เป็น modification (ไม่ใช่คำถาม business) — ระบุใน As-Is→To-Be (§10).
- ข้าม PRD/Batch/QC (ไม่ผลิต) — flow รองรับได้ (SO ไม่ generate PRD ในเคส a).

### 6.3 Own-Brand SO (b) produce-to-stock
Supply Planning วางแผน → "สั่งผลิต" (PRD ไม่ผูกลูกค้า) → ผลิต → QC → FG เข้าคลัง
- **GAP เชิงโครงสร้าง (แก้ได้):** **PRD ที่ไม่ผูก PO/ลูกค้า** เป็น variant ใหม่ของ production/entity-status-map (เดิม PRD เกิดจาก PO line เท่านั้น) → ต้องเพิ่มนิยาม "PRD ต้นทาง = Supply Planning". ระบุใน As-Is→To-Be.

### 6.4 Verdict
**Journey ครอบคลุมได้** ด้วยการเพิ่ม/แก้ตาม §10 — **มี business-gap แท้จริงเพียง 1 จุด = surplus capture (NQ1)**; ที่เหลือเป็น structural modifications (DN/Invoice อ้าง SO, PRD ไม่ผูกลูกค้า, FG reservation) ที่มีบ้านชัดแล้ว. บวก RBAC (NQ2/3), loss (NQ4), FG-trace granularity (NQ5) ที่ต้องเคาะก่อนวาด.

---

## 7. Section B — Permissions / RBAC (ปอนด์ raise สิทธิ์)
โมเดลเดิม (`rbac-deletion` / entity-status-map §9): **RUCDAA ต่อ module × 6 ระดับ (R/U/C/D/Approve/Admin) + สร้าง role ไม่จำกัด** (มี Sale, Sale Manager, Production, QC, Stock, Finance, Shipping, Super User, Admin).

### 7.1 Mapping ความสามารถใหม่ → สิทธิ์
| ความสามารถใหม่ | module/สิทธิ์ที่เสนอ | สถานะ |
|---|---|---|
| เปิด OEM PO | **Sale HQ** = ? (Create @ PO) | ⚠ role "Sale HQ" ยังไม่มีในโมเดล → **NQ2** |
| เปิด Own-Brand SO | Sale/Sale HQ (Create @ **SO module ใหม่**) | ⚠ ต้องมี module SO ใน RUCDAA + role → **NQ2/NQ3** |
| ตั้งค่า Supply Planning (sales rate/lead/cover/batch) | Create/Update @ **Supply Planning module ใหม่** | ⚠ module ใหม่ + ใครถือ (Planner? Production? Sale?) → **NQ3** |
| กด "สั่งผลิต" (สร้าง PRD เก็บสต็อก) | Create @ Production หรือ @ Supply Planning | ⚠ → **NQ3** |
| ปรับ FG/RM stock + ยืนยัน surplus | Update @ Stock (+ Approve?) | ⚠ ต้อง Approve ไหม → **NQ1/NQ4** |
| แก้ต้นทุน BOM (หมวดใหม่) | Update @ BOM (เดิม) | ✅ ใช้สิทธิ์ BOM เดิมได้ (เว้นแต่ต้องแยกสิทธิ์ "แก้ต้นทุน" → NQ3) |

### 7.2 สรุป
BOM cost edit ใช้สิทธิ์เดิมได้ · แต่ **2 module ใหม่ (SO, Supply Planning) + role "Sale HQ" + สิทธิ์ยืนยัน surplus/สั่งผลิต** ไม่ fit ของเดิม → **NQ2, NQ3**.

---

## 8. Section C — Tracking / Tracing (ขยาย GMP Lot→Batch→FG)
GMP เดิม: Lot → Batch → line(PRD) → PO → ลูกค้า → DN/Invoice. ขยายให้ครอบวัตถุใหม่:

### 8.1 Produce-to-stock (ไม่มีลูกค้าตอนผลิต)
- **Backward:** FG stock → Batch(es) ที่ผลิต → Lot วัตถุดิบ (FIFO) — genealogy ต้องครบแม้ยังไม่มีลูกค้า.
- **Forward เมื่อขายภายหลัง (SO):** ขาย(SO line) → FG stock ที่ตัด → Batch → Lot → **ย้อนถึงวันผลิต**; และ SO → DN → ลูกค้า.

### 8.2 OEM surplus-to-stock
- ส่วนเกินที่เข้าคลังต้อง **คงลิงก์ Batch/Lot เดิม** (มาจาก Batch ของ PO นั้น) → เมื่อขายผ่าน SO ภายหลัง trace ย้อนถึง PO/Batch/Lot ต้นทางได้.

### 8.3 Cost snapshot ใน trace
- ตอนขาย (SO/PO line) → **แนบ cost snapshot (D10)** เป็นส่วนหนึ่งของ trace record (ต้นทุน ณ เวลาขาย) — เพื่ออนาคตทำ COGS.

### 8.4 Cross-reference ที่ต้องมี (forward + backward)
`SO/PO line ↔ PRD ↔ Batch ↔ FG stock item (ราย Batch?) ↔ Lot ↔ DN ↔ ลูกค้า` + cost snapshot ที่ line.
- **★ ประเด็น granularity:** FG stock ควร **ติดตามราย Batch** (Batch = "lot" ของ FG, ตัด FIFO ตอนขาย) เพื่อคง recall GMP ย้อนได้ — เสนอ **ใช่** (สอดคล้อง requirement recall ที่ล็อกแล้ว) แต่กระทบ UI (stock ต้องโชว์ FG แตกราย Batch) → **ยืนยัน NQ5**.

---

## 9. Section D — Loss (deepen)
ปอนด์: loss เกิดที่ RM (ระหว่างผลิต) และ FG (ของที่ผลิตแล้ว).
- **จุดบันทึก:** (ก) หน้า **production** (ระหว่างผลิต — RM/FG เสียในสายผลิต) · (ข) หน้า **stock/warehouse** (ของในคลังเสีย/สูญ).
- **ปรับอะไร:** **on_hand อย่างเดียว (D12)** — reserved ไม่แตะ.
- **เหตุผล/อนุมัติ/threshold:** เสนอ **บังคับ comment เหตุผล + trace** ทุกครั้ง (เหมือน adjust อื่น) · จะต้อง **Approve** และมี **threshold** จำนวน/มูลค่าที่เกินต้องอนุมัติหรือไม่ = **[รอ NQ4]**.
- **ผลต่อ yield vs ordered qty:** ถ้า loss ทำให้ผลิตได้ไม่ครบตามสั่ง → trigger **ผลิตซ้ำ/เติมอัตโนมัติ** (คล้าย material-shortage→PR) หรือปล่อยให้คนตัดสินเอง = **[รอ NQ4]**.

---

## 10. Section E — As-Is → To-Be (อินพุตหลักให้ Stage 1 วาด mockup delta)

### 10.1 ต่อหน้าจอ
| หน้าจอ | As-Is (ล็อกปัจจุบัน) | To-Be (หลังสโคปนี้) | ชนิดงาน |
|---|---|---|---|
| **po-create.html** | เปิด PO, line = BOM/RM, จองตอนยืนยัน | เหมือนเดิม + ระบุชัด **RM-direct line ยังผ่านขั้นผลิต (D3)**; ยัง **ไม่** มี Own-Brand ที่นี่ | **แก้เล็ก** |
| **po-list.html** | ลิสต์ PO | เหมือนเดิม (OEM เท่านั้น) | **ไม่เปลี่ยน** |
| **so-create.html** | — | **ใหม่:** เปิด SO, sub-case (a) เลือกลูกค้า+FG มีสต็อก / (b) เติมสต็อกไม่เลือกลูกค้า; โชว์ FG Available | **ใหม่** |
| **so-detail.html / so-list.html** | — | **ใหม่:** รายละเอียด+ลิสต์ SO, lifecycle ตาม D2 | **ใหม่** |
| **supply-planning.html** | — | **ใหม่:** ตาม §3 (3 tiles + การ์ด FG + สูตร + ปุ่มสั่งผลิต) | **ใหม่** |
| **bom-create.html / bom.html** | ราคาทุน(วัตถุดิบ)+ราคาขาย+snapshot | + **หมวดต้นทุนอื่น เพิ่มเองได้ ต่อหน่วย (D9)** + ต้นทุนรวม + snapshot ครอบใหม่ (D10) | **แก้** |
| **stock.html** | RM เท่านั้น (3 ยอด, negative) | + **แท็บ FG stock** (3 ยอด/ราย Batch?—NQ5) + ปรับยอด + loss + **ยืนยัน surplus (NQ1)** | **แก้ใหญ่** |
| **production.html** | PRD จาก PO line, ตัด RM, QC | + **FG เข้าคลังตอน QC ผ่าน (D12)** + **จับ surplus (NQ1)** + **บันทึก loss (§9)** + รองรับ **PRD จาก Supply Planning ไม่ผูกลูกค้า (D8)** | **แก้ใหญ่** |
| **qc.html** | ตรวจ Batch ราย PO line | + Batch ที่มาจาก PRD produce-to-stock (ไม่มีลูกค้า) | **แก้เล็ก** |
| **delivery-note.html** | 1 DN = 1 PO | + **DN อ้าง SO ได้** (Own-Brand ขายจากสต็อก) | **แก้** |
| **invoices / invoice-detail** | invoice ต่อ PO | + invoice ต่อ SO; แนบ cost snapshot ที่ line (เก็บ ไม่โชว์รายงาน — D10) | **แก้เล็ก** |
| **trace.html** | Lot→Batch→PRD→PO→ลูกค้า→DN | + FG stock (ราย Batch), produce-to-stock (ไม่มีลูกค้าตอนผลิต), surplus, cost snapshot ที่ขาย (§8) | **แก้** |
| **settings.html (RBAC)** | RUCDAA modules เดิม | + **module SO + Supply Planning + role Sale HQ + สิทธิ์ surplus/สั่งผลิต** (NQ2/3) | **แก้ (รอ NQ)** |
| **functional-spec/index.html (Hub)** | การ์ด module เดิม | + การ์ด SO, Supply Planning, FG stock + ลิงก์เอกสารนี้ | **แก้เล็ก** |
| **customers/supplier/pr/gr/shipping-round** | เดิม | ไม่เปลี่ยน (shipping round อาจรับ DN ของ SO — ตรวจตอน Stage 2) | **ไม่เปลี่ยน (ตรวจ)** |

### 10.2 ต่อ flow
| flow | As-Is | To-Be |
|---|---|---|
| การเปิดออเดอร์ | สายเดียว (PO) | **2 สาย** — PO (OEM) + SO (Own-Brand) แยกเอกสาร (D1) |
| การผลิต | PRD เกิดจาก PO line เท่านั้น | + **PRD produce-to-stock ไม่ผูกลูกค้า** จาก Supply Planning (D8) |
| สต็อก | RM เท่านั้น | + **FG stock (1 BOM=1 FG, D11)**; produce→stock; surplus→stock |
| การขาย | ผลิตแล้วส่ง | + **ขายจากสต็อก (ไม่ผลิต)** สำหรับ Own-Brand (a) |
| ต้นทุน | material cost snapshot | + **multi-category cost snapshot ต่อหน่วย**, ใช้ตอนขาย (D9/D10) |
| loss | (ไม่ชัด) | บันทึกที่ production/warehouse, ตัด on_hand, comment+trace (§9) |

### 10.3 Stage 1 work-list (ให้ UX/UI)
- **วาดใหม่:** supply-planning, so-create, so-detail, so-list, (FG stock view — แท็บใน stock หรือหน้าใหม่)
- **แก้:** stock, production, bom-create/bom, delivery-note, invoice-detail, trace, po-create(เล็ก), settings(RBAC), Hub index
- **ไม่แตะ:** po-list, customers, supplier, pr, gr, shipping-round (ตรวจ SO-DN ตอน Stage 2)
> ⚠ **ยังห้ามเริ่มวาดจนกว่า NQ1–NQ5 ถูกเคาะ** (กระทบ stock/production/settings/trace โดยตรง).

---

## 11. Cross-reference (ไม่ขัดของเดิม)
- `stock-reservation.md` — RM คงเดิม; เพิ่มชั้น FG (D12, มิเรอร์ RM) ไม่ทับ.
- `entity-status-map.md` — ต้องเพิ่ม entity: **SO**, **FG stock item**, **PRD produce-to-stock (variant)**, **surplus adjustment** — เขียนหลังเคาะ NQ.
- `mock-data-spec/journeys` — dataset เดิม OEM ล้วน; เพิ่ม Own-Brand + FG (FG-101/204) + surplus เคส — งาน PO รอบถัดไป.
- BOM/PO functional-spec — §4/§2 ขยาย ไม่ลบกติกาเดิม.

---

## 12. §9 คำถามใหม่ถึงปอนด์ (ต้องเคาะก่อน UX/UI วาด delta)

**NQ1 — จุด/คนยืนยัน "surplus" OEM เข้าสต็อก (D12 ข้อยกเว้น)**
ผลิตเกินจำนวนที่สั่ง → ส่วนเกินเข้า FG/BOM stock ตอนไหน + ใครยืนยัน?
- (ก) ตอน **Batch QC ผ่าน**: ระบบแยกอัตโนมัติ (จำนวนสั่ง→PO, ส่วนเกิน→FG stock) แล้ว **แจ้งคลังให้ยืนยัน** ทีหลัง
- (ข) มีขั้น **"รับสินค้าสำเร็จรูปเข้าคลัง (FG receipt)"**: ฝ่ายผลิตระบุจำนวนผลิตจริง → **คลังยืนยันส่วนเกิน** ก่อนเข้าสต็อก
- (ค) ฝ่ายผลิตกรอกจำนวนผลิตจริงตอน "บันทึกการผลิต" → ส่วนเกินเข้า pending → คลัง approve
- *(ต้องระบุด้วยว่า **ผู้ยืนยัน = ฝ่ายผลิต หรือ คลัง**)*

**NQ2 — role "Sale HQ" + ใครเปิด SO**
- (ก) "Sale HQ" = **role ใหม่แยก** (เปิด OEM PO); Own-Brand SO = Sale ปกติ
- (ข) "Sale HQ" = **Sale เดิม** (ไม่มี role ใหม่ — แค่ทีมงาน); ทั้ง PO/SO ใช้สิทธิ์ Sale
- (ค) อื่น ๆ (ระบุใครเปิด PO / ใครเปิด SO)

**NQ3 — สิทธิ์ 2 module ใหม่ (SO, Supply Planning) + ปุ่มสั่งผลิต + แก้ต้นทุน BOM**
- (ก) เพิ่ม 2 module ใหม่ใน RUCDAA (SO, Supply Planning); **Supply Planning + ปุ่มสั่งผลิต ถือโดย role "ผู้วางแผน (Planner)" ใหม่**; แก้ต้นทุน BOM ใช้สิทธิ์ BOM เดิม
- (ข) ไม่มี role ใหม่ — Supply Planning/สั่งผลิต = สิทธิ์ **Production**; SO = สิทธิ์ **Sale**; BOM เดิม
- (ค) อื่น ๆ (ระบุ mapping)

**NQ4 — กติกา loss (เหตุผล/อนุมัติ/shortfall)**
- (4a) loss ต้อง **บังคับ comment + trace** ทุกครั้ง — ยืนยัน? ต้อง **Approve** ไหม + มี **threshold** จำนวน/มูลค่าที่เกินต้องอนุมัติไหม?
  - (ก) comment บังคับ + ไม่ต้อง approve · (ข) comment + เกิน threshold ต้อง approve (ระบุ threshold) · (ค) ต้อง approve ทุกครั้ง
- (4b) loss ทำให้ได้ของไม่ครบตามสั่ง →
  - (ก) trigger **ผลิตซ้ำ/เติมอัตโนมัติ** (คล้าย material-shortage→PR) · (ข) แจ้งเตือนแต่ให้คน**ตัดสินเอง** · (ค) อื่น ๆ

**NQ5 — FG stock ติดตามราย Batch (GMP recall)**
FG ในคลังตัด FIFO ราย Batch (Batch = "lot" ของ FG) เพื่อคง trace recall ย้อนได้ ใช่ไหม?
- (ก) **ใช่** — FG แตกราย Batch, ตัด FIFO, stock UI โชว์ breakdown ราย Batch (สอดคล้อง GMP เดิม) **[PO เสนอ]**
- (ข) ไม่ — FG นับรวมก้อนเดียว ไม่ผูก Batch (เสีย recall FG→Batch)
- (ค) อื่น ๆ
