# Scope Expansion — OEM vs Own-Brand Orders + Supply Planning + FG Stock + BOM Cost Snapshot

slug: `erp-v2-ui-first` · เขียนโดย PO · 2026-07-28 (r4 — ฝังครบ 18 คำตอบปอนด์ + OEM Quotation · **ZERO open questions**) · ที่มา: ประชุมลูกค้า 2026-07-24 + คำตอบปอนด์ 2026-07-27/28
สถานะ: **DELTA ต่อ spec ที่ล็อกอยู่ (Gate 2 FINAL)** — ต่อยอด/แก้บางส่วน ไม่แทน `entity-status-map.md` / `status-journeys.md` / `stock-reservation.md`
ผู้อ่านหลัก: **UX/UI** (Stage 1 รอบใหม่ — วาดเฉพาะ delta ตาม §10.3) · รอง: BA/TL (Stage 2 ต่อ)

> ✅ **ปอนด์เคาะครบทุกข้อ (D1–D18) — ไม่มีคำถามค้าง.** พร้อมส่ง Stage 1 ให้ UX/UI วาด mockup delta.

---

## สรุปภาษาไทย
สโคปนี้เคาะครบแล้ว: ออเดอร์แยก **2 สาย เป็นคนละโมดูล** — **OEM = ใบเสนอราคา (Quotation, optional) → PO** (line เป็น BOM/วัตถุดิบ, วัตถุดิบตรงก็ยังผ่านขั้นผลิต) และ **Own Brand = ใบสั่งขาย `SO-{YYYYMM}-{NNNNNN}` หน้าแยก (ไม่มี Quotation)** (ขายจากสต็อก=เลือกลูกค้า / ผลิตเก็บสต็อก=ไม่เลือกลูกค้า). **OEM Quotation `QT-{YYYYMM}-{NNNNNN}`** (Draft/Sent/Agreed/Rejected, แก้=เวอร์ชันใหม่เสมอ, ไม่มีวันหมดอายุ) → "ตกลง" แล้ว **Convert เป็น PO เลขใหม่** (ยกยอด line/จำนวน/ราคา + เก็บลิงก์ QT↔PO) · **สร้าง PO ตรงโดยไม่มี Quotation ก็ได้**. โมดูล **Supply Planning** (FG on-hand read-only, in-production นับจาก Batch, ป้าย Low/OK/Overstock ที่ <Target / Target–2×Target / >2×Target, ปุ่ม "สั่งผลิต"=PRD เก็บสต็อกไม่ผูกลูกค้า). **BOM เพิ่มหมวดต้นทุนเองได้ (per-unit) + snapshot ตอนขาย** (เก็บไว้เฉย ๆ ยังไม่ทำรายงาน COGS). **สต็อก:** 1 BOM = 1 FG (auto), **FG แตกราย Batch ตัด FIFO (recall GMP)**, produce-to-stock เข้าคลังตอน QC ผ่าน, **OEM ผลิตเกิน → ฝ่ายผลิตกรอกจำนวนผลิตจริง → ตอน "พร้อมส่ง" ตัดจำนวนสั่งให้ลูกค้า + ส่วนเกินเข้า FG stock (แจ้ง remark ไม่ต้อง approve)**, **loss บังคับเหตุผล ไม่ต้องอนุมัติ ตัด on_hand**, ทุก movement มี reason + source. **RBAC generic (สิทธิ์ราย module/capability)**. ไม่มีคำถามค้าง → **READY_FOR_UX_UI**.

---

## 0. Business context
โรงงานทำ **2 โมเดลพร้อมกัน**: OEM (รับจ้างผลิต, made-to-order) และ Own Brand (แบรนด์ตัวเอง, produce-to-stock/sell-from-stock). spec ที่ล็อกรองรับเฉพาะ OEM. สโคปนี้เพิ่มสาย Own Brand + สต็อกสินค้าสำเร็จรูปที่นับได้จริง + เครื่องมือวางแผน demand/cover + จับ **surplus การผลิตเกิน** เข้าสต็อก + **ใบเสนอราคา (Quotation) เป็นก้าวหน้าของ OEM**.

---

## 1. ★ Decided Rules — ปอนด์เคาะแล้ว (LOCKED, ไม่มีคำถามค้าง)

### 1.1 รอบแรก D1–D12 (2026-07-27)
| # | เรื่อง | กติกาที่ล็อก |
|---|---|---|
| **D1** | เอกสาร Own-Brand | เอกสาร+เลข **ใหม่แยก** `SO-{YYYYMM}-{NNNNNN}` (gapless ต่อเดือน) · **หน้าแยกจาก PO** (`so-create`/`so-detail`/`so-list`) — คนละโมดูล เพื่อไม่ให้อนาคตกระทบ PO |
| **D2** | Lifecycle Own-Brand | **(a) ขายจากสต็อก: ต้องเลือกลูกค้า** · **(b) ผลิตเก็บสต็อก: ไม่ต้องเลือกลูกค้า** |
| **D3** | OEM line = วัตถุดิบตรง | **ยังวิ่งผ่านขั้นผลิตเสมอ** (PO เดินสถานะผ่าน production flow) แต่ **แปรรูปจริง optional** — ใช้ flow เดียวกับการผลิต |
| **D4** | Supply Planning ที่มาข้อมูล | **FG On Hand = read-only จาก FG stock** · **In Production = นับจาก Batch ของ FG นั้น** |
| **D5** | ป้ายสถานะ | **Low = cover < Target · OK = Target ≤ cover ≤ 2×Target · Overstock = cover > 2×Target** |
| **D6** | Suggested production | **Available < Target → ผลิตเติมถึง Target ปัดขึ้น (ceil) เป็นทวีคูณ Batch Size** (FG-101=1500, FG-204=0) |
| **D7** | แปลง Sales Rate | **สัปดาห์ ÷7, เดือน ÷30** เป็น per-day · runs-out/through date นับ **วันปฏิทิน** |
| **D8** | ปุ่ม "สั่งผลิต" | **สร้าง PRD เก็บสต็อก ไม่ผูกลูกค้า** (produce-to-stock) |
| **D9** | BOM ต้นทุนเพิ่ม | **ผู้ใช้เพิ่มหมวดต้นทุนเองได้อิสระ (ไม่ตายตัว)** · **ต่อหน่วย (per-unit)** |
| **D10** | Cost snapshot | **เก็บ snapshot ไว้เฉย ๆ — ยังไม่ทำรายงาน COGS/กำไร** · ใช้ค่า snapshot **ตอนเกิดการขาย** (แนบต้นทุน ณ ตอนขาย) · data model พร้อมรองรับ COGS แต่ไม่สร้าง UI รายงานเฟสนี้ |
| **D11** | รหัส FG ↔ BOM | **1 BOM = 1 FG · รหัส FG สร้างอัตโนมัติ** |
| **D12** | กติกาสต็อก FG (option ก) | **OEM ส่งตรง ไม่เก็บ FG (ยกเว้น surplus D13)** · **produce-to-stock: FG เข้าคลังตอน Batch QC ผ่าน** · **loss ตัด on_hand อย่างเดียว** · **FG จอง/ตัดเหมือน RM** (จองตอนยืนยัน SO → ตัดตอนพร้อมจัดส่ง) |

### 1.2 รอบสอง D13–D17 (2026-07-28)
| # | เรื่อง | กติกาที่ล็อก |
|---|---|---|
| **D13** | ★ OEM surplus capture (เปลี่ยน trigger จากเดิม!) | **จับ surplus ที่ transition "พร้อมส่ง (Ready to Ship)" — ไม่ใช่ตอน QC pass.** กลไก: (1) ระหว่างผลิต **ฝ่ายผลิตกรอก "จำนวนผลิตจริง (actual produced qty)"** (อาจเกินจำนวนสั่ง) · (2) ตอนเปลี่ยนเป็น "พร้อมส่ง" ระบบ **ยืนยัน: จำนวนสั่งส่งลูกค้า, ส่วนเกิน (actual − ordered) เพิ่มเข้า FG stock อัตโนมัติ** · (3) **แจ้งคลังผ่าน remark/note** บน ledger entry: "สต็อกเพิ่มจากการผลิตเกิน" (ลิงก์กลับ Batch/PRD/PO) · **ไม่ใช่ approval gate** (แจ้งเฉย ๆ) |
| **D14** | RBAC generic (permission-per-module) | **ไม่ hardcode role "Sale HQ".** ใครถือสิทธิ์ที่ถูกต้องก็ทำได้ — บังคับสิทธิ์ **ที่ระดับ module/capability**. สร้าง role ใหม่/มัดรวมสิทธิ์ = admin config ใน Settings. spec **ไม่ fix ว่า role ชื่อใดได้ capability ใด** — ทำให้ **แต่ละ capability grant แยกได้อิสระ** (ดู §7 catalog) |
| **D15** | Loss + stock ledger | **loss: บังคับเหตุผล (mandatory comment)** · แก้ได้ทั้ง **production process และ warehouse module** · **ตัด on_hand อย่างเดียว (D12)** · **ไม่ต้องอนุมัติ (no approval)** · **★ ทุกการเคลื่อนไหวสต็อก (loss / surplus / adjust / reserve-consume / GR) = ledger movement type ที่มี "เหตุผล/แหล่งที่มา (reason + source ref)" บังคับ** ลิงก์ Batch/PRD/PO/SO — สอดคล้อง append-only stock ledger เดิม · **loss ที่ทำให้ได้ของไม่ครบตามสั่ง = ไม่ auto re-produce** — ให้คนตัดสินกด "ผลิตซ้ำ" เอง (derived จากหลัก manual-rework + warning-not-block เดิม; ปอนด์ override ได้) |
| **D16** | FG tracked per Batch | **FG stock แตกราย Batch (Batch = "lot" ของ FG) · ตัด FIFO ตอนขาย/ส่ง · UI โชว์ breakdown ราย Batch** — คง GMP recall/backward-trace |
| **D17** | Alignment confirmations (ปอนด์ยืนยัน) | **(i) 2 ประเภทออเดอร์ = คนละโมดูลจริง** (PO vs SO แยก, ตรง D1) · **(ii) RBAC เป็น generic/permission-per-module จริง** (ตรง D14) |

### 1.3 รอบสาม D18 (2026-07-28) — OEM Quotation
| # | เรื่อง | กติกาที่ล็อก |
|---|---|---|
| **D18** | ★ OEM Quotation (ก้าวหน้าของ OEM) | **สาย OEM เริ่มด้วย ใบเสนอราคา (Quotation) → ส่งลูกค้า → ลูกค้าตกลง → Convert เป็น PO → เข้า OEM flow เดิม** (จอง stock → ผลิต → QC → surplus→FG ตอนพร้อมส่ง → ส่ง → invoice). กติกา: **(1) เลขของตัวเอง `QT-{YYYYMM}-{NNNNNN}`** (gapless ต่อปี/เดือน) · **Convert = สร้าง PO เลขใหม่ `PO-{YYYYMM}-{NNNNNN}`** พร้อม **เก็บลิงก์ Quotation↔PO** เพื่อ trace · Convert **ยกยอด line items (BOM/RM) + จำนวน + ราคา** จาก QT เข้าสู่ PO ใหม่ · **(2) OEM เท่านั้น** — **Own-Brand SO ไม่มี Quotation** · **(3) ข้ามได้ (optional)** — สร้าง PO ตรงโดยไม่มี Quotation ได้ (po-create คงรองรับ create ตรง) · **(4) สถานะ: ร่าง (Draft) / ส่งแล้ว (Sent) / ตกลง (Agreed) / ปฏิเสธ (Rejected)** — **"ตกลง (Agreed)" คือสถานะที่เปิดปุ่ม "Convert to PO"** · **แก้ทุกครั้ง = เวอร์ชัน/เลขใหม่เสมอ** (immutable เมื่อออกไปแล้ว, เปลี่ยน = เวอร์ชันใหม่ เก็บประวัติ) · **ไม่มีวันหมดอายุ (no Expired status) ตอนนี้** |

---

## 2. สองสายการเปิดออเดอร์ (OEM vs Own Brand)

### 2.1 ตารางเทียบ
| มิติ | **OEM — (Quotation →) PO (รับจ้างผลิต)** | **Own Brand — SO (สั่งขาย)** |
|---|---|---|
| ก้าวหน้า | **Quotation `QT-{YYYYMM}-{NNNNNN}` (optional, D18)** | **ไม่มี Quotation (D18-2)** |
| เอกสาร/เลข | `PO-{YYYYMM}-{NNNNNN}` (เดิม; Convert = เลขใหม่) | **`SO-{YYYYMM}-{NNNNNN}` (D1, ใหม่)** |
| โมดูล/หน้าจอ | quotation-* (ใหม่) + po-create/detail/list (เดิม) | **so-create/detail/list (D1/D17, คนละโมดูล)** |
| ใครเปิด | ผู้มีสิทธิ์ **create @ Quotation / PO module** (ไม่ fix role — D14) | ผู้มีสิทธิ์ **create @ SO module** (ไม่ fix role — D14) |
| line | BOM / วัตถุดิบตรง (RM-direct → ผ่านขั้นผลิต D3) | **FG (สินค้าสำเร็จรูปที่มีสต็อก)** |
| ต้องผลิต | ทุกใบ (รวม RM-direct — D3) | (a) ขายจากสต็อก = ไม่ผลิต · (b) เติมสต็อก = ผลิต |
| ลูกค้า | ผูกเสมอ | (a) **เลือก** · (b) **ไม่เลือก** (D2) |
| ผลิตเกิน | **surplus → FG stock ตอน "พร้อมส่ง" (D13)** | ผลิตเก็บสต็อกเข้า FG อยู่แล้ว |

### 2.2 OEM flow (ฝัง D18)
- **มี Quotation:** quotation-create (Draft) → ส่งลูกค้า (Sent) → ลูกค้าตกลง (**Agreed**) → กด **"Convert to PO"** → **PO เลขใหม่** (ยกยอด line/จำนวน/ราคา + ลิงก์ QT↔PO) → OEM flow เดิม (จอง RM → ผลิต → QC → surplus→FG ตอนพร้อมส่ง → DN → invoice).
  - ลูกค้าไม่ตกลง → Quotation = **Rejected** (จบสาย ไม่เกิด PO).
  - แก้ราคา/รายการ → **เวอร์ชัน/เลข QT ใหม่เสมอ** (เก็บประวัติ, immutable — D18-4).
- **ไม่มี Quotation (ข้าม):** สร้าง PO ตรงที่ po-create (เดิม) → OEM flow (po-create มี field origin optional "created from QT-…" ว่างได้).

### 2.3 Own-Brand 2 sub-case (flow)
- **(a) Sell-from-stock:** so-create → เลือก **ลูกค้า** + FG ที่มีสต็อก → โชว์ **FG Available (ราย Batch, D16)** → ยืนยัน SO = **จอง FG** → (ข้ามการผลิต) → พร้อมจัดส่ง = **ตัด FG FIFO ราย Batch** → DN/ส่ง → invoice → ชำระ.
- **(b) Produce-to-stock:** **Supply Planning** กด "สั่งผลิต" (D8) → **PRD ไม่ผูกลูกค้า** → ผลิต → QC ผ่าน → **FG เข้าคลัง (ราย Batch)** → พร้อมขายภายหลังผ่าน (a).
> **ย้ำ (D18-2): Own-Brand ไม่มีขั้น Quotation ใด ๆ.**

---

## 3. โมดูลใหม่ — Supply Planning — Demand & Production Cover (ฝัง D4–D8)

### 3.1 โครงหน้า (ตาม screenshot = target look)
- **Header:** "SUPPLY PLANNING / Demand & Production Cover"
- **3 stat tiles:** (1) **ITEMS BELOW TARGET** "X of N" (cover < Target) · (2) **SUGGESTED PRODUCTION** = Σ suggested · (3) **SHORTEST COVER** = min(cover) วัน
- **การ์ดต่อ FG:** badge (D5) + 7 ช่อง + coverage bar (4 markers) + narrative + 3 footer chips

### 3.2 ฟิลด์ (หน่วย + ชนิด — ฝัง D4)
| ฟิลด์ | หน่วย | ชนิด |
|---|---|---|
| FG On Hand | units | **read-only จาก FG stock (D4)** |
| In Production | units | **computed = นับจาก Batch ของ FG นั้น (D4)** |
| Sales Rate | /day·/week·/month | editable — normalize per-day (D7: ÷7, ÷30) |
| Lead Time / Safety Cover / Target Cover | days | editable |
| Batch Size | units | editable |

### 3.3 Outputs + สูตร (ตรวจกับ FG-101 = ✓)
r = Sales Rate per-day (แปลงตาม D7):
| Output | สูตร | ตรวจ FG-101 |
|---|---|---|
| **Available** | `FG On Hand + In Production` | 1200+13 = **1213** ✓ |
| **Cover today (d)** | `Available ÷ r` | 1213/85 = **14.3** ✓ |
| **Safety stock** | `Safety Cover × r` | 5×85 = **425** ✓ |
| **Reorder point** | `(Lead + Safety) × r` | 12×85 = **1020** ✓ |
| **Target stock** | `Target Cover × r` | 30×85 = **2550** ✓ |
| **Risk line (d)** | `Lead + Safety` | **12** ✓ |
| **Suggested production** | `ceil( max(0, Target stock − Available) ÷ Batch ) × Batch` **(D6)** | **1500** ✓ |
| **Cover after (d)** | `(Available + Suggested) ÷ r` | 2713/85 = **31.9** ✓ |
| **Runs-out / through date** | `today + cover(วัน)` วันปฏิทิน (D7) | 10 Aug / 27 Aug |

FG-204 (Overstock): 96.7 > 2×30 → Overstock (D5); suggested 0 ✓.

### 3.4 Badge (D5) + coverage bar
Low <Target (แดง) · OK Target..2×Target (เหลือง/เขียว) · Overstock >2×Target (ฟ้า/เทา) · markers: Cover today / After production / Risk line / Target.

### 3.5 Narrative template
```
"{Available} units available at {r}/day covers {CoverToday} days — runs out {RunsOutDate}.
 Produce {Suggested} units to hold {Available+Suggested} and cover {CoverAfter} days through {CoverThroughDate}."
```
Overstock (Suggested=0): คงประโยค "...Produce 0 units...".

### 3.6 ปุ่ม "สั่งผลิต" (D8)
กด → สร้าง **PRD เก็บสต็อก ไม่ผูกลูกค้า** จำนวน = Suggested → สาย production ปกติ → QC ผ่าน → FG เข้าคลัง. **สิทธิ์ = capability "press สั่งผลิต / create produce-to-stock PRD" ตาม catalog §7 (D14)**.

---

## 4. BOM — ต้นทุนเพิ่ม + snapshot (ฝัง D9–D10)
- กลุ่ม **"ต้นทุนอื่น (ต่อหน่วย)"** — ผู้ใช้ **เพิ่มหมวดเองได้อิสระ** (ค่าแรง/โสหุ้ย/บรรจุภัณฑ์/อื่น ๆ — ไม่ตายตัว, D9). แต่ละหมวด: ชื่อ + มูลค่า/หน่วย.
- **ต้นทุนรวม/หน่วย** = ต้นทุนวัตถุดิบ (เดิม) + Σ ต้นทุนอื่น/หน่วย → **snapshot ทั้งก้อน**.
- **ใช้ snapshot (D10):** แนบตอนเกิดการขาย (line ของ SO/PO) · **ไม่สร้าง UI รายงาน COGS/กำไรเฟสนี้** · data model พร้อมรองรับ.
- คง badge "ราคาทุนอาจล้าสมัย" ครอบต้นทุนรวมใหม่ · ไม่ลบกติกาเดิม (ราคาขาย mandatory, block ถ้าไม่มี active supplier + ไม่ override).

---

## 5. Stock model delta — FG inventory + produce-to-stock + surplus + loss (ฝัง D11–D16)

### 5.1 FG เป็น inventory (per-Batch)
- **1 BOM = 1 FG (auto, D11)** · FG มี 3 ยอด (on_hand/reserved/available) เหมือน RM.
- **FG แตกราย Batch (D16):** แต่ละ Batch = "lot" ของ FG · ตัด **FIFO** ตอนขาย/ส่ง · stock UI โชว์ **breakdown ราย Batch**.
- stock.html รองรับ **RM + FG** (แท็บแยก) · badge ติดลบ/จองเกินเหมือน RM.

### 5.2 FG เข้าคลัง (D12)
- **produce-to-stock:** Batch QC ผ่าน → **FG on_hand เพิ่มอัตโนมัติ** (ราย Batch).
- **OEM ปกติ:** QC ผ่าน → **ส่งตรงลูกค้า ไม่เก็บ FG** (เว้น surplus §5.3).

### 5.3 ★ OEM surplus → FG stock (D13 — trigger = "พร้อมส่ง")
- **(1)** ระหว่างผลิต ฝ่ายผลิตกรอก **"จำนวนผลิตจริง (actual produced qty)"** (อาจ > จำนวนสั่ง).
- **(2)** ตอน transition → **"พร้อมส่ง (Ready to Ship)"** ระบบยืนยัน: **จำนวนสั่ง → ส่งลูกค้า · ส่วนเกิน (actual − ordered) → เพิ่ม FG stock อัตโนมัติ (ราย Batch, คงลิงก์ Batch/PRD/PO)**.
- **(3)** **แจ้งคลังผ่าน remark** บน ledger entry: "สต็อกเพิ่มจากการผลิตเกิน" (ไม่ใช่ approval gate).
- *หมายเหตุ:* จับที่ **พร้อมส่ง ไม่ใช่ QC pass** — เพราะจำนวนที่ส่ง/เก็บสรุปแน่นอนตอนพร้อมส่ง.

### 5.4 Warehouse ปรับสต็อก + loss (ฝัง D15)
- ปรับ **FG + RM** ได้ทุกเมื่อ (comment + trace บังคับ).
- **loss:** บังคับเหตุผล · แก้ได้ทั้ง production + warehouse · ตัด **on_hand อย่างเดียว** · **ไม่ต้องอนุมัติ**.
- **stock ledger (D15):** ทุก movement (loss/surplus/adjust/reserve/consume/GR) มี **reason + source ref** (Batch/PRD/PO/SO) บังคับ — append-only เดิม.
- loss ทำให้ของไม่ครบตามสั่ง → **ไม่ auto re-produce** ให้คนกด "ผลิตซ้ำ" เอง (D15).

### 5.5 FG reservation (D12: เหมือน RM)
- **Sell-from-stock SO:** จอง FG ตอนยืนยัน SO → ตัด FIFO ราย Batch ตอนพร้อมจัดส่ง · cancel SO = คืนจอง.

---

## 6. Section A — Journey Completeness Check ✅
เดิน 2 สายเทียบ 6 visual journeys:

### 6.1 OEM (Quotation →) PO (+ surplus)
**(Quotation optional)** เสนอราคา → ส่ง → ตกลง → **Convert เป็น PO (D18)** → จอง RM → ผลิต (กรอก actual qty) → QC → **พร้อมส่ง = แยกจำนวนสั่ง(ส่ง)/ส่วนเกิน(→FG stock, D13)** → DN → invoice → ชำระ — **ทุกขั้นมีบ้านครบ** (Quotation เป็น head ที่มีบ้านใหม่ quotation-*; surplus จับที่ "พร้อมส่ง").

### 6.2 Own-Brand SO (a) sell-from-stock
สร้าง (เลือกลูกค้า) → จอง FG → พร้อมจัดส่ง (ตัด FG FIFO ราย Batch) → DN/ส่ง → invoice → ชำระ.
- ปรับโครงสร้าง (มีบ้าน): **DN/Invoice ต้องอ้าง SO ได้** (เดิม 1 DN=1 PO) — ระบุใน §10.

### 6.3 Own-Brand SO (b) produce-to-stock
Supply Planning → "สั่งผลิต" (PRD ไม่ผูกลูกค้า) → ผลิต → QC → FG เข้าคลัง (ราย Batch).
- ปรับโครงสร้าง (มีบ้าน): **PRD ไม่ผูก PO/ลูกค้า** = variant ใหม่ใน production/entity-status-map.

### 6.4 Verdict
**Journey ครบทุกสาย** — Quotation (D18), surplus (D13), DN/Invoice-อ้าง-SO, PRD-ไม่ผูกลูกค้า, FG-per-Batch/FIFO ล้วนมีบ้านชัดใน §10. **ไม่มี business-gap ค้าง**.

---

## 7. Section B — Permissions / RBAC (generic per-module, D14/D17)
**ยืนยัน:** RBAC เป็น **generic** — บังคับสิทธิ์ที่ระดับ **module/capability**, ไม่ fix ชื่อ role. ใช้โมเดลเดิม RUCDAA (R/U/C/D/Approve/Admin ต่อ module) + สร้าง role ไม่จำกัด (config ใน Settings).

### 7.1 Capability → Module → Permission catalog (สิ่งที่ต้องเพิ่ม/มี)
| Capability (ใหม่/เปลี่ยน) | Module (RUCDAA) | Permission bit |
|---|---|---|
| สร้าง/แก้ OEM Quotation + Convert to PO | **Quotation (module ใหม่, OEM)** | Create / Update (+ Convert = Create @ PO) |
| สร้าง/แก้ OEM PO | **PO** (เดิม) | Create / Update |
| สร้าง/แก้ Own-Brand SO | **SO (module ใหม่)** | Create / Update |
| ดู/ตั้งค่า Supply Planning (sales rate/lead/cover/batch) | **Supply Planning (module ใหม่)** | Read / Update |
| กด "สั่งผลิต" (สร้าง produce-to-stock PRD) | **Supply Planning** (หรือ Production) | Create |
| แก้ต้นทุน BOM (หมวดใหม่) | **BOM** (เดิม) | Update |
| ปรับ FG/RM stock + บันทึก loss + (surplus แจ้ง remark) | **Warehouse/Stock** (เดิม) | Update |

> **หลัก D14:** แต่ละ capability **grant แยกได้อิสระ**; role ใด ๆ ที่ถือ permission ตรงก็ทำได้ (เช่น AR team หรือ Sale เปิด PO/Quotation ได้ถ้ามีสิทธิ์). settings.html เพิ่ม **3 module ใหม่ (Quotation, SO, Supply Planning)** เข้าตาราง RUCDAA. **surplus ไม่มี permission แยก** (auto ตอนพร้อมส่ง + แจ้ง remark, ไม่ใช่ approval).

### 7.2 สรุป
ทุก capability **แสดงออกได้ในโมเดล RUCDAA เดิม** (เพิ่ม 3 module) — **ไม่มี capability ที่ model เดิมรองรับไม่ได้ → ไม่มีคำถามค้าง**.

---

## 8. Section C — Tracking / Tracing (ขยาย GMP + ledger reason/source, D15/D16/D18)
GMP เดิม: Lot → Batch → PRD → PO → ลูกค้า → DN/Invoice. ขยาย:
### 8.1 OEM chain มี Quotation เป็นหัว (D18)
- **หัวสาย OEM = Quotation:** trace **QT → PO → PRD/Batch → DN → Invoice** (ลิงก์ QT↔PO ยกยอด line/qty/price) · Quotation ที่ Rejected คงเก็บไว้ (ประวัติ) ไม่มี PO ต่อ · PO ที่สร้างตรง (ไม่มี QT) → หัวสาย = PO.
### 8.2 Produce-to-stock (ไม่มีลูกค้าตอนผลิต)
- **Backward:** FG stock (ราย Batch) → Batch → Lot (FIFO) — genealogy ครบแม้ยังไม่มีลูกค้า.
- **Forward เมื่อขาย (SO):** SO line → FG Batch ที่ตัด (FIFO) → Batch → Lot; และ SO → DN → ลูกค้า.
### 8.3 OEM surplus-to-stock
- ส่วนเกินคง **ลิงก์ Batch/PRD/PO เดิม** → ขายผ่าน SO ภายหลัง trace ย้อนถึงต้นทางได้.
### 8.4 Cost snapshot ใน trace
- ตอนขาย (SO/PO line) → แนบ **cost snapshot (D10)** เป็นส่วนของ trace (ต้นทุน ณ เวลาขาย).
### 8.5 Stock ledger — reason + source ต่อ movement (D15)
- **ทุกการเคลื่อนไหว** (loss / surplus / adjust / reserve / consume / GR / FG-in) เป็น **ledger movement type** ที่บันทึก **"เหตุผล + แหล่งที่มา (source ref)"** บังคับ ลิงก์ Batch/PRD/PO/SO — ตอบได้เสมอว่า **ทำไมสต็อกขึ้น/ลง** (append-only เดิม).
### 8.6 Cross-reference (forward+backward)
`Quotation(QT) ↔ PO ↔ PRD ↔ Batch ↔ FG stock (ราย Batch, D16) ↔ Lot ↔ DN ↔ ลูกค้า` (Own-Brand: `SO ↔ FG/Batch/Lot ↔ DN`) + cost snapshot ที่ line + ledger reason/source ทุก movement.

---

## 9. Section D — Loss (ฝัง D15)
- **จุดบันทึก:** (ก) หน้า **production** (ระหว่างผลิต) · (ข) หน้า **stock/warehouse** (ของในคลัง).
- **บังคับเหตุผล (mandatory comment) + trace** ทุกครั้ง · **ตัด on_hand อย่างเดียว** · **ไม่ต้องอนุมัติ**.
- เป็น **ledger movement (reason + source ref)** ตาม §8.5.
- **ไม่ auto re-produce:** loss ที่ทำให้ได้ไม่ครบตามสั่ง → คนกด "ผลิตซ้ำ" เอง (สอดคล้อง manual-rework + warning-not-block เดิม).

---

## 10. Section E — As-Is → To-Be (อินพุตหลักให้ Stage 1)

### 10.1 ต่อหน้าจอ
| หน้าจอ | As-Is (ล็อกปัจจุบัน) | To-Be (หลังสโคปนี้) | ชนิดงาน |
|---|---|---|---|
| **quotation-create/list/detail.html** | — | **ใหม่:** ใบเสนอราคา OEM `QT-{YYYYMM}-{NNNNNN}` (Draft/Sent/Agreed/Rejected), line BOM/RM+qty+ราคา, **แก้=เวอร์ชันใหม่**, ปุ่ม **"Convert to PO"** (เมื่อ Agreed) → PO เลขใหม่+ลิงก์ (D18) | **ใหม่** |
| **po-create.html** | เปิด PO, line = BOM/RM, จองตอนยืนยัน | + ระบุชัด **RM-direct line ยังผ่านขั้นผลิต (D3)**; ไม่มี Own-Brand ที่นี่; + **origin ref optional "created from QT-…"** (สร้างตรงก็ได้ D18-3) | **แก้เล็ก** |
| **po-list.html** | ลิสต์ PO | + แสดง **ลิงก์ QT ต้นทาง** ถ้ามี (อื่นเหมือนเดิม, OEM) | **แก้เล็ก** |
| **so-create.html** | — | **ใหม่:** SO — (a) เลือกลูกค้า+FG มีสต็อก / (b) เติมสต็อกไม่เลือกลูกค้า; โชว์ FG Available ราย Batch; **ไม่มี Quotation** | **ใหม่** |
| **so-detail.html / so-list.html** | — | **ใหม่:** รายละเอียด+ลิสต์ SO, lifecycle D2 | **ใหม่** |
| **supply-planning.html** | — | **ใหม่:** §3 (3 tiles + การ์ด FG + สูตร D4–D8 + ปุ่มสั่งผลิต) | **ใหม่** |
| **bom-create.html / bom.html** | ราคาทุน(วัตถุดิบ)+ขาย+snapshot | + **หมวดต้นทุนอื่นเพิ่มเองได้ ต่อหน่วย (D9)** + ต้นทุนรวม + snapshot ครอบใหม่ (D10) | **แก้** |
| **stock.html** | RM เท่านั้น (3 ยอด, negative) | + **แท็บ FG stock แตกราย Batch/FIFO (D16)** + ปรับยอด + **loss บังคับเหตุผล (D15)** + **surplus เข้าพร้อม remark (D13)** + ledger reason/source ทุก movement | **แก้ใหญ่** |
| **production.html** | PRD จาก PO line, ตัด RM, QC | + **ช่อง "จำนวนผลิตจริง (actual qty)" (D13)** + **surplus แยกตอน "พร้อมส่ง" → FG stock (D13)** + FG เข้าคลังตอน QC ผ่าน (produce-to-stock, D12) + **บันทึก loss (D15)** + รองรับ **PRD ไม่ผูกลูกค้า (D8)** | **แก้ใหญ่** |
| **qc.html** | ตรวจ Batch ราย PO line | + Batch จาก PRD produce-to-stock (ไม่มีลูกค้า) | **แก้เล็ก** |
| **delivery-note.html** | 1 DN = 1 PO | + **DN อ้าง SO ได้** (Own-Brand ขายจากสต็อก) | **แก้** |
| **invoices / invoice-detail** | invoice ต่อ PO | + invoice ต่อ SO; แนบ cost snapshot ที่ line (เก็บ ไม่โชว์รายงาน — D10) | **แก้เล็ก** |
| **trace.html** | Lot→Batch→PRD→PO→ลูกค้า→DN | + **QT เป็นหัวสาย OEM (D18)**, FG stock ราย Batch (D16), produce-to-stock, surplus, cost snapshot, **ledger reason/source ทุก movement (D15)** | **แก้** |
| **settings.html (RBAC)** | RUCDAA modules เดิม | + **module Quotation + SO + Supply Planning** ในตาราง RUCDAA (generic, ไม่ fix role — D14) | **แก้** |
| **functional-spec/index.html (Hub)** | การ์ด module เดิม | + การ์ด Quotation, SO, Supply Planning, FG stock + ลิงก์เอกสารนี้ | **แก้เล็ก** |
| **customers/supplier/pr/gr/shipping-round** | เดิม | ไม่เปลี่ยน (shipping round รับ DN ของ SO — ตรวจ Stage 2) | **ไม่เปลี่ยน (ตรวจ)** |

### 10.2 ต่อ flow
| flow | As-Is | To-Be |
|---|---|---|
| เปิดออเดอร์ | สายเดียว (PO) | **2 สาย คนละโมดูล** — OEM (**Quotation optional →** PO) + Own-Brand SO (ไม่มี Quotation) (D1/D17/D18) |
| การผลิต | PRD จาก PO line | + **PRD produce-to-stock ไม่ผูกลูกค้า (D8)** + **กรอกจำนวนผลิตจริง + surplus ตอนพร้อมส่ง (D13)** |
| สต็อก | RM เท่านั้น, movement ทั่วไป | + **FG stock (1 BOM=1 FG, ราย Batch/FIFO)** + **ledger reason/source ทุก movement (D15)** |
| การขาย | ผลิตแล้วส่ง | + **ขายจากสต็อก (ไม่ผลิต)** Own-Brand (a) |
| ต้นทุน | material cost snapshot | + **multi-category per-unit snapshot**, ใช้ตอนขาย (D9/D10) |
| loss | (ไม่ชัด) | production/warehouse, ตัด on_hand, บังคับเหตุผล, ไม่อนุมัติ, ledger reason/source (D15) |
| สิทธิ์ | RUCDAA per module | + 3 module ใหม่ (Quotation/SO/Supply Planning), **generic permission-per-capability (D14)** |
| เลขเอกสาร | PO/Batch/DN/SHP/INV/PR/GR/Lot | + **`QT-{YYYYMM}-{NNNNNN}` (Quotation)** + `SO-{YYYYMM}-{NNNNNN}` (gapless ต่อปี/เดือน) |

### 10.3 ★ Stage-1 UX/UI work-list (execute ได้เลย — zero guessing)
**วาดใหม่ (NEW):**
1. `quotation-create.html` + `quotation-list.html` + `quotation-detail.html` — OEM Quotation (Draft/Sent/Agreed/Rejected), line BOM/RM+qty+ราคา, แก้=เวอร์ชันใหม่, ปุ่ม **"Convert to PO"** เมื่อ Agreed (D18)
2. `supply-planning.html` — §3 ครบ (3 tiles, การ์ด FG per §3.2–3.5, ปุ่มสั่งผลิต)
3. `so-create.html` — 2 sub-case (a เลือกลูกค้า / b ไม่เลือก), เลือก FG + โชว์ Available ราย Batch (ไม่มี Quotation)
4. `so-detail.html` + `so-list.html` — lifecycle D2
5. **FG stock** — แท็บใน `stock.html` (หรือหน้าใหม่) แตกราย Batch/FIFO (D16)

**แก้ (MODIFIED):**
6. `stock.html` — FG tab (per-Batch), loss (บังคับเหตุผล), surplus remark, ledger reason/source
7. `production.html` — ช่องจำนวนผลิตจริง + surplus ตอนพร้อมส่ง + FG-in ตอน QC (produce-to-stock) + loss + PRD ไม่ผูกลูกค้า
8. `bom-create.html`/`bom.html` — หมวดต้นทุนเพิ่มเอง (per-unit) + ต้นทุนรวม + snapshot
9. `po-create.html` — RM-direct ผ่านขั้นผลิต + origin ref optional "created from QT-…" (สร้างตรงได้)
10. `po-list.html` — แสดงลิงก์ QT ต้นทาง (ถ้ามี)
11. `delivery-note.html` — DN อ้าง SO ได้
12. `invoice-detail.html` — invoice ต่อ SO + cost snapshot ที่ line
13. `trace.html` — QT หัวสาย OEM, FG per-Batch, produce-to-stock, surplus, snapshot, ledger reason/source
14. `settings.html` — เพิ่ม module Quotation + SO + Supply Planning ใน RUCDAA (generic)
15. `functional-spec/index.html` — การ์ด + ลิงก์เอกสารนี้

**ไม่แตะ:** customers, supplier, purchase-request, goods-receipt, shipping (round) — ตรวจ SO↔DN ตอน Stage 2.

> ✅ ทุกจุดในลิสต์อ้าง D1–D18 ที่ล็อกแล้ว — **ไม่มีที่ต้องเดา**. (Quotation line fields = มิเรอร์ PO line: item BOM/RM + qty + ราคา/หน่วย แก้ได้/0 ตามกติกาเดิม; VAT/ตัวเลขภาษี = ตามธรรมเนียม invoice เดิม (THB) — ไม่มี multi-currency).

---

## 11. Cross-reference (ไม่ขัดของเดิม)
- `stock-reservation.md` — RM คงเดิม; เพิ่มชั้น FG (D12/D16, มิเรอร์ RM + per-Batch) ไม่ทับ.
- `entity-status-map.md` — เพิ่ม entity: **Quotation (QT)**, **SO**, **FG stock item (per-Batch)**, **PRD produce-to-stock (variant)**, **surplus/loss ledger movement types** — PO อัปเดตหลัง Stage 1 (หรือคู่ขนาน BA/TL Stage 2).
- `mock-data-spec/journeys` — เพิ่ม Quotation (OEM) + Own-Brand + FG (FG-101/204) + surplus/loss เคส — งาน PO รอบถัดไป.
- BOM/PO functional-spec — §4/§2 ขยาย ไม่ลบกติกาเดิม.
- **Doc numbering (glossary):** เพิ่ม `QT-{YYYYMM}-{NNNNNN}` + `SO-{YYYYMM}-{NNNNNN}` (gapless ต่อปี/เดือน ตามธรรมเนียมเดิม).

---

## 12. Open questions
**ไม่มี** — ปอนด์เคาะครบ D1–D18. → **READY_FOR_UX_UI**.
