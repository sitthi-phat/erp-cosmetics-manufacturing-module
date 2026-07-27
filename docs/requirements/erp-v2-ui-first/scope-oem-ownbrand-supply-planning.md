# Scope Expansion — OEM vs Own-Brand Orders + Supply Planning + FG Stock + BOM Cost Snapshot

slug: `erp-v2-ui-first` · เขียนโดย PO · 2026-07-27 · ที่มา: ประชุมลูกค้า 2026-07-24 (ปอนด์ส่ง scope ใหม่)
สถานะ: **DELTA ต่อ spec ที่ล็อกอยู่ (Gate 2 FINAL)** — เอกสารนี้ **ไม่แทน** `entity-status-map.md` / `status-journeys.md` / `stock-reservation.md` แต่ **ต่อยอด/แก้บางส่วน** เท่านั้น
ผู้อ่านหลัก: **UX/UI** (สร้าง/แก้หน้าจอ) · รอง: BA/TL (Stage 2 ต่อ)

> ⚠ **กติกาสำคัญจากปอนด์:** ห้ามเดา business fact — ทุกจุดที่ยังคลุมเครือถูกยกไปที่ **§7 คำถามถึงปอนด์** (ตอบก่อน UX/UI ลงมือ จะได้ไม่ต้อง rework) · ค่าที่เอกสารนี้ "เสนอ" ทั้งหมดใส่ป้าย **[PROPOSED — รอ Q#]** ห้ามถือเป็นข้อสรุป

---

## สรุปภาษาไทย
สโคปใหม่หลังประชุมลูกค้า: การเปิดออเดอร์แยกเป็น **2 สาย** — (1) **OEM (รับจ้างผลิต)** = PO เดิม (Sale HQ คีย์ออเดอร์ลูกค้า, เลือกได้ทั้ง BOM หรือวัตถุดิบ) · (2) **Own Brand (สั่งขาย)** = เอกสารใหม่ **ใบสั่งขาย (Sales Order)** ขายสินค้าสำเร็จรูปที่มีสต็อกอยู่แล้ว หรือสั่งผลิตเก็บสต็อก. เพิ่ม **โมดูลใหม่ "Supply Planning — Demand & Production Cover"** วางแผนสินค้า Own-Brand รายตัว (FG คงคลัง/กำลังผลิต/อัตราขาย/lead time/safety-target cover/batch size → คำนวณวันคุ้มครอง, reorder point, จำนวนที่ควรผลิต, ป้าย Low/OK/Overstock). **BOM เพิ่มช่องต้นทุนอื่นนอกจากค่าวัตถุดิบ** + snapshot ต้นทุนตอนขาย (ขยายจาก snapshot เดิม — กระทบขอบเขต COGS ที่เคยตัดออก). **สต็อก:** สินค้าสำเร็จรูป (BOM) กลายเป็น **สินค้าคงคลังที่นับได้ (FG stock)**, ผลิตเก็บสต็อกได้, คลังปรับสต็อกได้ทุกเมื่อ, ผลิตเกินแจ้งคลังปรับ, ปรับ loss ได้ทั้ง BOM และวัตถุดิบ. **เอกสารนี้มีคำถามค้างถึงปอนด์เยอะ (§7) — ต้องเคาะก่อนสร้างหน้าจอ**.

---

## 0. ทำไมต้องมีสโคปนี้ (business context)
โรงงานทำ **2 โมเดลธุรกิจพร้อมกัน**: รับจ้างผลิตให้แบรนด์ลูกค้า (OEM, made-to-order) และผลิตแบรนด์ตัวเองขาย (Own Brand, produce-to-stock). spec ที่ล็อกไว้รองรับเฉพาะสาย OEM (PO → ผลิต → ส่ง). สาย Own Brand ต้องการ (ก) ขายจากสต็อกที่มีทันที และ (ข) วางแผนผลิตล่วงหน้าไม่ให้ของขาด/ของบวม → จึงต้องมีสต็อกสินค้าสำเร็จรูปที่นับได้จริง + เครื่องมือวางแผน demand/production cover.

---

## 1. สองสายการเปิดออเดอร์ (OEM vs Own Brand) — diverge จาก single-PO flow เดิม

### 1.1 ภาพรวมความต่าง
| มิติ | **OEM — PO (รับจ้างผลิต / made-to-order)** | **Own Brand — Sales Order (สั่งขาย / produce-to-stock)** |
|---|---|---|
| เอกสาร | **PO** `PO-{YYYYMM}-{NNNNNN}` (เดิม) | **ใบสั่งขาย (Sales Order)** — เลข? **[รอ Q1]** |
| ใครเปิด | **Sale HQ** คีย์ออเดอร์ที่รับจากลูกค้า | Sale (ขายแบรนด์ตัวเอง) |
| line เลือกอะไรได้ | **BOM (สินค้าสูตร)** หรือ **วัตถุดิบตรง** (ขยายจากเดิม — เดิม US-PO-01 รองรับ BOM/วัตถุดิบอยู่แล้ว แต่ต้องระบุ order type ให้ชัด) | **สินค้าสำเร็จรูปที่มีอยู่แล้ว (FG)** — ขายของที่มีสต็อก |
| ต้องผลิตไหม | ผลิตตามสั่งทุกใบ (ยกเว้น line วัตถุดิบตรง? **[รอ Q3]**) | **2 sub-case:** (a) มีสต็อก → ขาย/ส่งทันที ไม่ต้องผลิต · (b) สั่งผลิตเติมสต็อก |
| ผูกลูกค้า | ผูกลูกค้าเสมอ | (a) ผูกลูกค้า · (b) เติมสต็อกอาจไม่ผูกลูกค้า **[รอ Q2]** |
| lifecycle | เดิม (Confirmed→ผลิต→QC→พร้อมส่ง→ส่ง) | **[รอ Q2 — ต้องเคาะ lifecycle]** |

### 1.2 หน้าจอที่ **เปลี่ยน** (modified)
- **po-create.html** — เพิ่ม **ตัวเลือก "ประเภทออเดอร์" (Order Type)** ที่หัวฟอร์ม: OEM (PO) / Own Brand (Sales Order). เมื่อเลือก Own Brand ฟอร์มเปลี่ยนพฤติกรรม (ดู 1.3). ถ้าปอนด์ต้องการแยกเป็นคนละหน้า (so-create.html) แทน tab เดียว → **[รอ Q1b]**.
- **po-list.html** — เพิ่มคอลัมน์/ฟิลเตอร์ **ประเภทออเดอร์** เพื่อแยก OEM vs Own-Brand ในลิสต์เดียว หรือแยกลิสต์ **[รอ Q1b]**.
- **US-PO-01/US-PO-07 (po functional-spec)** — line item ต้องรองรับ "ประเภทรายการ": BOM / วัตถุดิบ / **FG (สินค้าสำเร็จรูปสำเร็จ)** พร้อม default ราคาขายตามชนิด.

### 1.3 หน้าจอที่ **เพิ่มใหม่** (new) จากสาย Own Brand
- **(NEW) Sales Order create/detail** — ถ้าปอนด์เลือกแยกเอกสาร (เสนอแยก เพราะ lifecycle ต่างจาก PO): เลือกลูกค้า, เลือก **FG ที่มีสต็อก**, ระบบโชว์ **FG Available** ต่อรายการ, sub-case (a) ขายจากสต็อก → จอง/ตัด FG · sub-case (b) เกินสต็อก → เสนอ **สั่งผลิตเติม** (ผูกไป Supply Planning / สร้างใบสั่งผลิตเก็บสต็อก) **[รอ Q2/Q6]**.
- **(NEW) Supply Planning — Demand & Production Cover** — โมดูลวางแผน (ดู §2 เต็ม).

> **หมายเหตุ UX/UI:** ยัง **อย่าเพิ่งสร้าง Sales Order/แก้ po-create** จนกว่าปอนด์เคาะ **Q1–Q3** (เอกสาร/เลข/lifecycle) — เดี๋ยว rework. โมดูลที่พร้อมสุดคือ **Supply Planning** แต่ก็มี Q4–Q5 (สูตร/ป้าย) ค้างเช่นกัน.

---

## 2. โมดูลใหม่ — Supply Planning — Demand & Production Cover (สเปกเต็ม)

**เป้าหมาย:** ให้ผู้วางแผนตั้งค่าพารามิเตอร์ต่อสินค้า Own-Brand แล้วระบบคำนวณ "วันคุ้มครอง (cover days)", จุดสั่งผลิต, จำนวนที่ควรผลิต, และป้ายสถานะ — เพื่อผลิตเก็บสต็อกไม่ให้ขาด/บวม. อ้าง **screenshot ที่ปอนด์แนบเป็น target look**.

### 2.1 โครงหน้า (ตาม screenshot)
- **Header:** "SUPPLY PLANNING / Demand & Production Cover"
- **แถวบน = 3 stat tiles (รวมทั้งพอร์ต):**
  1. **ITEMS BELOW TARGET** — "X of N" = จำนวนสินค้าที่ cover today < Target Cover / จำนวนสินค้าทั้งหมดในแผน
  2. **SUGGESTED PRODUCTION** — Σ suggested production (units) ทุกสินค้า
  3. **SHORTEST COVER** — ค่า min(cover today) ในหน่วยวัน
- **หนึ่งการ์ดต่อสินค้า FG** (ตัวอย่าง FG-101 · Facial Serum 30 ml):
  - **ป้ายสถานะ (badge):** Low / OK / Overstock (เกณฑ์ = **[รอ Q5a]**)
  - **ช่องกรอกแถวเดียว (editable inputs):** FG ON HAND · IN PRODUCTION · SALES RATE · LEAD TIME · SAFETY COVER · TARGET COVER · BATCH SIZE
  - **แถบ coverage bar แนวนอน** + markers: Cover today · After production · Risk line · Target
  - **ประโยคบรรยาย (narrative)** (ดู template 2.4)
  - **footer chips (computed):** Safety stock · Reorder point · Target stock

### 2.2 ฟิลด์ต่อสินค้า — หน่วย + editable/computed
| ฟิลด์ | หน่วย | ชนิด | ที่มา/หมายเหตุ |
|---|---|---|---|
| **FG On Hand** | units | **computed (จาก FG stock)** หรือ editable? **[รอ Q4b]** | screenshot โชว์เป็นเลขแก้ได้ — แต่ควร sync กับ FG stock จริง |
| **In Production** | units | **computed** | ยอดที่กำลังผลิตของ FG นี้ (Batch ที่ยังไม่เข้าคลัง) — **แหล่งข้อมูล [รอ Q4c]** |
| **Sales Rate** | u/day (screenshot) แต่ตั้งได้ /day·/week·/month | **editable (config)** | ต้องnormalize เป็น per-day สำหรับสูตร — **การแปลง [รอ Q5c]** |
| **Lead Time** | days | editable (config) | เวลาผลิตกว่าจะได้ของ |
| **Safety Cover** | days | editable (config) | กันชนขั้นต่ำ |
| **Target Cover** | days | editable (config) | เป้าที่อยากถือ |
| **Batch Size** | units | editable (config) | ขนาดล็อตผลิต (สำหรับปัดจำนวน) |

### 2.3 Outputs ที่คำนวณ — สูตร (derivable ระบุชัด · ที่ไม่ชัด flag)
สมมติ Sales Rate ถูกแปลงเป็น **per-day (r)** แล้ว:

| Output | สูตร (derived จาก screenshot — ตรวจกับ FG-101) | สถานะ |
|---|---|---|
| **Available (planning)** | `FG On Hand + In Production` → 1200+13 = **1213** ✓ | ✅ ชัด (ตรง narrative "1,213 units available") |
| **Cover today (days)** | `Available ÷ r` → 1213 ÷ 85 = **14.3** ✓ | ✅ ชัด |
| **Safety stock (units)** | `Safety Cover × r` → 5 × 85 = **425** ✓ | ✅ ชัด (ตรง chip) |
| **Reorder point (units)** | `(Lead Time + Safety Cover) × r` → 12 × 85 = **1020** ✓ | ✅ ชัด (ตรง chip + Risk line 12d) |
| **Target stock (units)** | `Target Cover × r` → 30 × 85 = **2550** ✓ | ✅ ชัด (ตรง chip) |
| **Risk line (days)** | `Lead Time + Safety Cover` → 7+5 = **12** ✓ | ✅ ชัด (marker) |
| **Suggested production (units)** | `ceil( max(0, Target stock − Available) ÷ Batch Size ) × Batch Size` → ceil((2550−1213)/500)×500 = ceil(2.67)×500 = 3×500 = **1500** ✓ | ⚠ ตรงตัวเลข แต่ **trigger** (เมื่อไร) = **[รอ Q5b]** |
| **Cover after production (days)** | `(Available + Suggested) ÷ r` → (1213+1500)/85 = 2713/85 = **31.9** ✓ | ✅ ชัด |
| **Runs-out date** | `today + Cover today (วัน)` → "runs out 10 Aug" | ⚠ วิธีนับวันทำการ/ปฏิทิน? **[รอ Q5d]** |
| **Cover-through date** | `today + Cover after (วัน)` → "through 27 Aug" | ⚠ เหมือน Q5d |

> ตรวจ FG-204 (Overstock): Available 4800+1000=5800; cover = 5800/60 = **96.7** ✓; target stock 30×60=1800; suggested = max(0,1800−5800)=0 → **produce 0** ✓ — สูตรสอดคล้องทั้ง 2 การ์ด.

### 2.4 Narrative template (ให้ UX/UI ผูกตัวแปร)
```
"{Available} units available at {r}/day covers {CoverToday} days —
 runs out {RunsOutDate}. Produce {Suggested} units to hold {Available+Suggested}
 and cover {CoverAfter} days through {CoverThroughDate}."
```
กรณี Overstock (Suggested = 0): "... Produce 0 units ..." (คงประโยคเดียวกัน ตัดท่อน produce หรือแสดง 0 — **[รอ Q5e ยืนยันถ้อยคำ]**).

### 2.5 Coverage bar markers
แถบแนวนอน scale = วัน · markers: **Cover today** (ปัจจุบัน) · **After production** (หลังผลิตตามที่เสนอ) · **Risk line** = Lead+Safety (เส้นเสี่ยง) · **Target** = Target Cover. สีตามโซน (< Risk = แดง, Risk..Target = เหลือง, > Target = เขียว/overstock) — **[รอ Q5a ยืนยัน mapping สี↔ป้าย]**.

### 2.6 ป้ายสถานะ (badge) — **เกณฑ์ยังไม่ชัด [รอ Q5a]**
สังเกตจาก screenshot: FG-101 cover 14.3 (< target 30, > reorder-cover 12) = **"Low"** · FG-204 cover 96.7 (>> target) = **"Overstock"** · ข้อ 3 (ไม่แสดง) cover 6.7 = น่าจะ Low. เสนอเกณฑ์ **[PROPOSED — รอ Q5a]:**
- **Low** = Cover today < Target Cover
- **OK** = Target Cover ≤ Cover today ≤ Overstock threshold
- **Overstock** = Cover today > Overstock threshold (เช่น 2× Target? หรือค่าคงที่?) — **ต้องเคาะ**

### 2.7 การเชื่อมต่อ (ให้ชัดว่าปุ่ม "สั่งผลิต" ทำอะไร) — **[รอ Q6]**
เมื่อผู้วางแผนกด "ผลิตตามที่เสนอ" → สร้างอะไร? (ก) ใบสั่งผลิตเก็บสต็อก (PRD ไม่ผูกลูกค้า) · (ข) แค่ suggestion ไม่สร้างงาน · (ค) Sales Order ประเภทเติมสต็อก. ต้องเคาะเพื่อออกแบบปุ่ม/flow.

---

## 3. BOM — ช่องต้นทุนเพิ่ม + cost snapshot ตอนขาย (แก้จาก US-BOM-01)

### 3.1 เดิม (locked)
`bom.html` มี **ราคาทุน** = ราคารับซื้อวัตถุดิบสูงสุดของ supplier active (override ได้ + snapshot ตอน save + badge ล้าสมัย) + **ราคาขาย** (mandatory). snapshot ปัจจุบัน = **เฉพาะต้นทุนวัตถุดิบ**.

### 3.2 ใหม่ (delta)
- เพิ่ม **ช่องต้นทุนอื่นนอกเหนือวัตถุดิบ** ต่อ BOM — หมวดที่เสนอ **[PROPOSED — รอ Q7a]:** ค่าแรง (labor) · ค่าโสหุ้ย (overhead) · ค่าบรรจุภัณฑ์ (packaging) · อื่น ๆ (freeform). ปอนด์ต้องยืนยัน **ชุดหมวดตายตัว หรือให้ผู้ใช้เพิ่มหมวดเอง**.
- **ต้นทุนรวมสินค้า** = ต้นทุนวัตถุดิบ + Σ ต้นทุนอื่น → **snapshot ทั้งก้อน** เพื่อ **คำนวณต้นทุนสินค้าตอนเกิดการขาย (SALE)**.
- ต้นทุนอื่นเป็น **ต่อหน่วย หรือ ต่อ batch** = **[รอ Q7b]**.

### 3.3 ⚠ กระทบขอบเขต COGS ที่เคยตัดออก — **ต้อง flag ให้ปอนด์**
เดิม COGS ถูกประกาศ **out-of-scope** เหลือแค่ BOM snapshot. การ snapshot ต้นทุนหลายหมวด "เพื่อคำนวณตอนขาย" = **เริ่มแตะ COGS**. ต้องเคาะ **[Q7c]:** เก็บ snapshot ไว้เฉย ๆ (ยังไม่ทำรายงานกำไร/COGS) **หรือ** เปิดขอบเขต COGS/margin เข้ามาในเฟสนี้ (กระทบ invoice/report/ dashboard การเงิน).

### 3.4 หน้าจอที่กระทบ
- **bom-create.html / bom.html** — เพิ่มกลุ่มช่อง "ต้นทุนอื่น" + แสดง **ต้นทุนรวม (สรุป)** + คง badge snapshot/ล้าสมัยให้ครอบคลุมต้นทุนใหม่.
- (ถ้า Q7c = เปิด COGS) — invoice-detail / dashboard การเงิน อาจต้องโชว์ต้นทุน/กำไร → **แยกเป็นสโคปย่อย รอเคาะ**.

---

## 4. Stock model delta — FG stock เป็นสินค้าคงคลัง + produce-to-stock + ปรับ/loss

### 4.1 หลักที่เปลี่ยนจากเดิม
เดิม: จัดการสต็อก **เฉพาะวัตถุดิบ** (3 ยอด on_hand/reserved/available) · สินค้าสำเร็จรูปผลิตตาม PO แล้วส่งออกเลย ไม่ได้นับเป็นสต็อก.
ใหม่: **สินค้าสำเร็จรูป (BOM) กลายเป็นรายการสินค้าคงคลังที่นับได้ (FG stock item)** — มีรหัส `FG-xxx` (ความสัมพันธ์ FG↔BOM = **[รอ Q8]**), มียอดคงคลัง, จอง, ใช้ได้ เหมือนวัตถุดิบ.

### 4.2 Produce-to-stock (ผลิตเข้าสต็อก)
- **ผลิตเสร็จ → เพิ่ม FG stock** (ทั้ง Own Brand เติมสต็อก และ — **[รอ Q9]** — OEM ด้วยหรือไม่).
- **จุดที่ FG เข้าสต็อกเกิดเมื่อไร** = **[รอ Q10]:** ตอน Batch QC ผ่าน (auto) · หรือมีขั้น "รับสินค้าสำเร็จรูปเข้าคลัง (FG receipt)" คล้าย GR ให้คลังยืนยันจำนวนจริง (รองรับ over-production).

### 4.3 Warehouse ปรับสต็อกได้ทุกเมื่อ + over-production
- คลังปรับยอด **FG stock** และ **RM stock** ได้ตลอดเวลา (มี comment + trace บังคับ).
- **ผลิตเกิน (over-produce):** แจ้งคลัง → คลัง **ปรับ FG stock** ให้ตรงจริง (notification + หน้าปรับสต็อก). **[รอ Q10 — auto จาก Batch เกินจำนวน หรือ manual โดยคลัง]**.

### 4.4 Loss handling (ปรับเมื่อมีของเสีย/สูญ)
- ปรับ loss ได้ **ทั้ง FG(BOM) และ RM** — ทำได้ **2 จุด:** (ก) ในขั้นตอนการผลิต (production) · (ข) ในโมดูลคลัง (stock/warehouse). ต้องมี **เหตุผล + trace บังคับ**.
- loss ลด on_hand → กระทบ available; ลด reserved ด้วยไหม = **[รอ Q11]**.

### 4.5 ปฏิสัมพันธ์กับ reserve/consume เดิม (`stock-reservation.md`)
- **RM:** คงโมเดลเดิม — จองตอน PO Confirmed, ตัดจริงตอน "เริ่มผลิต" (Option A ที่ PO เสนอ · จุดตัดจริงยังรอปอนด์เคาะเดิม).
- **FG (Own Brand sell-from-stock):** เสนอ **มิเรอร์โมเดล RM [PROPOSED — รอ Q12]:** จอง FG ตอน Sales Order ยืนยัน → ตัด FG จริงตอน "พร้อมจัดส่ง". ต้องเคาะเพราะ FG เป็น entity ใหม่ในชั้น reservation.
- **stock.html** ต้องรองรับ **2 ชนิดสินค้าคงคลัง (RM + FG)** — แสดง 3 ยอดต่อ FG ด้วย, badge ติดลบ/จองเกินเหมือน RM.

### 4.6 หน้าจอที่กระทบ
- **stock.html** — เพิ่มมุมมอง/แท็บ **FG stock** (3 ยอด, ปรับยอด, loss, badge) นอกเหนือ RM เดิม.
- **production.html** — เพิ่มจุดบันทึก loss + (ถ้า Q10 = มีขั้น FG receipt) ปุ่ม/flow "รับเข้าคลังสินค้าสำเร็จรูป" + แจ้ง over-production.
- **(อาจ) goods-receipt** หรือหน้าใหม่ **fg-receipt** — ถ้าเลือกให้มีขั้นรับ FG เข้าคลัง.

---

## 5. เช็คลิสต์ "UX/UI ต้องออกแบบอะไร" (new vs modified)

> ⚠ **ทั้งหมดนี้ยังไม่ควรเริ่มจนกว่าปอนด์ตอบ §7** (โดยเฉพาะ Q1–Q3, Q5a-b, Q6, Q8, Q10). รายการนี้คือ scope งานออกแบบเมื่อคำตอบครบ.

### หน้าจอ **ใหม่ (NEW)**
| # | หน้าจอ | acceptance note (เมื่อคำตอบครบ) |
|---|---|---|
| N1 | **Supply Planning — Demand & Production Cover** | ตรง screenshot: 3 stat tiles + การ์ดต่อสินค้า (7 ช่อง input + coverage bar 4 markers + narrative + 3 footer chips + badge) · สูตรตาม §2.3 · ปุ่ม "สั่งผลิต" ตาม Q6 |
| N2 | **Sales Order create + detail** (ถ้า Q1 = เอกสารแยก) | เลือกลูกค้า+FG ที่มีสต็อก · โชว์ FG Available · sub-case ขายจากสต็อก vs สั่งผลิตเติม · lifecycle ตาม Q2 |
| N3 | **FG stock view** (แท็บใน stock.html หรือหน้าใหม่) | 3 ยอดต่อ FG · ปรับยอด+loss+comment/trace · badge ติดลบ/จองเกิน |
| N4 | **FG receipt** (ถ้า Q10 = มีขั้นรับเข้าคลัง) | รับสินค้าสำเร็จรูปจากการผลิตเข้าคลัง + จัดการ over-production |

### หน้าจอ **แก้ (MODIFIED)**
| # | หน้าจอ | สิ่งที่แก้ |
|---|---|---|
| M1 | **po-create.html** | เพิ่ม Order Type (OEM/Own Brand) + ชนิดรายการ line (BOM/RM/FG) — หรือแยกเป็น Sales Order ตาม Q1b |
| M2 | **po-list.html** | คอลัมน์/ฟิลเตอร์ประเภทออเดอร์ (หรือแยกลิสต์ Own-Brand) |
| M3 | **bom-create.html / bom.html** | กลุ่มช่องต้นทุนอื่น (labor/overhead/packaging/อื่น ๆ ตาม Q7a) + ต้นทุนรวม + snapshot ครอบต้นทุนใหม่ |
| M4 | **stock.html** | แท็บ FG stock (RM + FG) · ปรับยอด · loss |
| M5 | **production.html** | บันทึก loss (FG+RM) · จุด FG เข้าคลัง/แจ้ง over-production (ตาม Q10) |
| M6 | **Document Hub (functional-spec/index.html)** | เพิ่มลิงก์การ์ดโมดูล "Supply Planning" + ลิงก์เอกสาร delta นี้ (ดู §6) |

---

## 6. Document Hub / index (การแก้เล็กสุด)
เสนอเพิ่มในหมวด ② ของ `functional-spec/index.html` **การ์ดโมดูลใหม่** ชี้ Supply Planning + note "OEM/Own-Brand order split" และเพิ่มลิงก์เอกสารนี้ในหมวด ④ (เอกสาร PO). **PO จะยังไม่แก้ index จนกว่าปอนด์เคาะ scope** (กันแก้ซ้ำ). — บันทึกไว้ให้ UX/UI ทราบจุดลิงก์.

---

## 7. คำถามถึงปอนด์ (ต้องตอบก่อน UX/UI ลงมือ — แต่ละข้อมีตัวเลือก)

**A. สองสายออเดอร์ / เอกสาร / lifecycle**
1. **Sales Order (Own Brand) เป็นเอกสารใหม่ หรือใช้เลข PO เดิม?**
   - (ก) เอกสาร+เลขใหม่ `SO-{YYYYMM}-{NNNNNN}` แยกจาก PO **[PO เสนอ — lifecycle ต่างกัน]**
   - (ข) ใช้ระบบ PO เดิม แต่ติดธง "ประเภท = Own Brand"
   - (ค) อื่น ๆ (ระบุ)
   - **1b.** UI: **แยกหน้า** (so-create แยกจาก po-create) หรือ **หน้าเดียวสลับ Order Type**?
2. **Lifecycle ของ Own-Brand Sales Order** เป็นอย่างไร? (ขอเป็นสถานะ)
   - (ก) sell-from-stock: ยืนยัน → จอง FG → พร้อมจัดส่ง → ส่ง (ข้ามการผลิต)
   - (ข) produce-to-replenish: สร้างงานผลิตเก็บสต็อก (ไม่ผูกลูกค้า) แยกจากการขาย
   - ต้องการให้ทั้ง (ก)+(ข) อยู่ในใบเดียว หรือแยก? และเติมสต็อก **ผูกลูกค้าไหม**?
3. **OEM line ที่เป็น "วัตถุดิบตรง" (ขายวัตถุดิบ ไม่ใช่ BOM)** — พฤติกรรม?
   - (ก) จอง RM → ส่งเลย ไม่ต้องผลิต (ไม่มี PRD)
   - (ข) ต้องมีขั้นตอนผลิต/แปรรูป
   - (ค) อื่น ๆ

**B. Supply Planning — สูตร/ป้าย/หน่วย/ปุ่ม**
4. **แหล่งข้อมูล FG On Hand / In Production ในการ์ด**
   - (4a) FG On Hand = ดึงจาก FG stock จริง (read-only) หรือแก้ในการ์ดได้?
   - (4b) ถ้าแก้ได้ → override ชั่วคราวหรือเขียนกลับ stock?
   - (4c) In Production = นับจาก Batch/PRD ที่ยังไม่เข้าคลังของ FG นั้น ใช่ไหม? นับเฉพาะ Own-Brand หรือรวม OEM ด้วย?
5. **สูตร/การแสดงผล Supply Planning** (ตัวเลขในการ์ดตรวจแล้วตรง screenshot — ขอยืนยันกติกา):
   - (5a) **เกณฑ์ป้าย Low/OK/Overstock** — เสนอ: Low = cover < Target; OK = Target ≤ cover ≤ Overstock-threshold; Overstock = cover > **?** (เป็น 2×Target? หรือค่าคงที่วัน? หรือ cover > Target อย่างเดียว?) → **ขอค่าเกณฑ์ Overstock ชัด ๆ + สีแต่ละโซน**
   - (5b) **Suggested production trigger** — เสนอ: เมื่อ Available < Target stock ให้ผลิตเติมถึง Target แล้วปัดขึ้นเป็นทวีคูณ Batch Size (ceil). ยืนยัน? หรือให้ trigger เฉพาะเมื่อ **Available < Reorder point** เท่านั้น?
   - (5c) **Sales Rate ตั้งได้ /day·/week·/month** — แปลงเป็น per-day อย่างไร? (สัปดาห์ ÷7, เดือน ÷30 ตามปฏิทิน? หรือ ÷ วันทำการ? กำหนดวันทำการ/สัปดาห์กี่วัน?)
   - (5d) **runs-out / through date** — นับแบบวันปฏิทิน (รวมเสาร์-อาทิตย์) หรือวันทำการ?
   - (5e) narrative กรณี Overstock ("Produce 0 units...") — ใช้ถ้อยคำเต็มเดิม หรือให้ตัดท่อน produce ทิ้ง?
6. **ปุ่ม "สั่งผลิต" ใน Supply Planning ทำอะไร?**
   - (ก) สร้างใบสั่งผลิตเก็บสต็อก (PRD ไม่ผูกลูกค้า) ทันที
   - (ข) เป็นแค่คำแนะนำ (ไม่สร้างงาน) ต้องไปเปิด Sales Order/PRD เอง
   - (ค) สร้าง Sales Order ประเภทเติมสต็อก

**C. BOM ต้นทุน / COGS**
7. **BOM ต้นทุนเพิ่ม**
   - (7a) **หมวดต้นทุนอื่น** — ยืนยันชุด: ค่าแรง / ค่าโสหุ้ย / ค่าบรรจุภัณฑ์ / อื่น ๆ (freeform)? เป็น **ชุดตายตัว** หรือให้ผู้ใช้ **เพิ่มหมวดเองได้**?
   - (7b) ต้นทุนอื่นคิด **ต่อหน่วย** หรือ **ต่อ batch**?
   - (7c) ⚠ **snapshot ต้นทุนตอนขาย = แตะ COGS** (เดิม COGS out-of-scope) — ต้องการแค่ **เก็บ snapshot ไว้** (ยังไม่ทำรายงานกำไร/COGS) หรือ **เปิดขอบเขต COGS/margin** เข้าเฟสนี้ (กระทบ invoice/report/dashboard การเงิน)?

**D. Stock / FG inventory**
8. **รหัส FG (`FG-xxx`) กับ BOM สัมพันธ์กันอย่างไร?**
   - (ก) 1 BOM = 1 FG item อัตโนมัติ (FG ผูกกับ BOM ตรง ๆ)
   - (ข) FG เป็น master แยก ผูก BOM ทีหลัง
   - (ค) อื่น ๆ · และ **การออกรหัส FG** (auto running / ตั้งเอง)
9. **OEM (made-to-order) — ของที่ผลิตเสร็จ เข้าคลัง FG ด้วยไหม** หรือส่งออกตรงไม่แตะ FG stock (เฉพาะ Own-Brand ที่เข้าคลัง)?
10. **FG เข้าคลังตอนไหน + over-production**
    - (ก) auto ตอน Batch QC ผ่าน (จำนวน = จำนวนผลิต)
    - (ข) มีขั้น "รับสินค้าสำเร็จรูปเข้าคลัง (FG receipt)" ให้คลังยืนยันจำนวนจริง (รองรับผลิตเกิน/ขาด)
    - over-produce: แจ้งคลังปรับ **auto** (ตามจำนวน Batch จริง) หรือ **manual** โดยคลัง?
11. **Loss** — ลด on_hand แล้ว **ลด reserved ด้วยไหม** (กรณีของถูกจองไว้แล้วเสีย) หรือแตะเฉพาะ on_hand?
12. **FG reservation** — Own-Brand sell-from-stock ใช้โมเดลเดียวกับ RM (จองตอนยืนยัน → ตัดตอนพร้อมจัดส่ง) ใช่ไหม? หรือจอง / ตัด จุดอื่น?

---

## 8. Cross-reference (ยืนยันไม่ขัดของเดิม)
- **`stock-reservation.md`** — RM reserve/consume คงเดิม; เอกสารนี้ **เพิ่มชั้น FG** เข้าโมเดล 3 ยอด (Q12) ไม่ทับ RM.
- **`entity-status-map.md`** — เพิ่ม entity ใหม่ที่ต้องนิยามหลังปอนด์เคาะ: **Sales Order** (Q1/Q2), **FG stock item** (Q8), อาจ **FG Receipt** (Q10). ยังไม่แก้ไฟล์จนเคาะ.
- **`mock-data-spec.md` / `mock-data-journeys.md`** — dataset 8 use case เดิมเป็น OEM ล้วน; ต้องเพิ่ม dataset Own-Brand + FG stock + Supply Planning (FG-101/FG-204 ตัวอย่าง) หลังเคาะ — งาน PO รอบถัดไป.
- **BOM (US-BOM-01)** — §3 ขยาย snapshot; ไม่ลบกติกา max-active-supplier/override/badge เดิม.
- **PO (US-PO-01/07)** — §1 เพิ่ม Order Type + ชนิดรายการ FG; ไม่ลบ flow เดิม.
