# Module — QC (ควบคุมคุณภาพ)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE SPEC** (absorbs functional-spec `qc.html` US-QC-01..03)
Mockups: `mockups/qc.html`
กฎอ้างอิง: entity-status-map §1.5/§1.6/**§1.8 (GR object QC-gate)** (Batch/Lot/GR QC) · `production.md` (Rework run gen · **§7.3 QC-gate "พร้อมส่ง"** · **§7.4 deep-link "ไปหน้า QC"**) · `return.md` (Lot ไม่ผ่าน→คืน) · **`goods-receipt.md` §4 (GR object lifecycle · QC-gated stock-in · credit/retro-link on pass)** · `pr.md` (Lot ผ่าน→อาจปิด PR) · **`stock.md` §2b ("Good Receipt (RM)" tab — warehouse เห็น GR ผ่าน/ไม่ผ่าน + ส่งกลับ QC/ยกเลิก)** · **`comment-convention.md` (G6/CC1–CC7 — comment field)** · README §3

## สรุปภาษาไทย
QC มี 2 งานหลัก: **(A) ตรวจรับวัตถุดิบขาเข้า (RM incoming — ราย Lot/GR)** และ **(B) ตรวจแบตช์การผลิต (Batch — ราย line)**. **การตัดสิน QC ทำที่หน้านี้เท่านั้น** (หน้าผลิต/หน้ารับเข้าไม่มีปุ่มตัดสิน). **★ (A) RM ที่รับเข้ายังไม่เข้าสต็อกทันที** — Goods Receipt สร้าง **GR object + Lot สถานะรอตรวจ (ยังไม่ credit on_hand)** → QC บันทึกผล **ผ่าน/ไม่ผ่าน**: **ผ่าน → RM เข้าสต็อก (credit on_hand ของ Lot ตอนนี้ + ชดเชยยอดติดลบ + FIFO retro-link ตอนนี้)** · **ไม่ผ่าน → ไม่เข้าสต็อก, Lot ระงับ → ทำใบคืน supplier หรือส่งกลับตรวจ/ยกเลิก GR** (`goods-receipt.md` §4). **(B) Batch** ผ่าน → PRD line "พร้อมส่งมอบ (eligible)" — **precondition ให้ฝ่ายผลิตกด "✓ พร้อมส่ง"** (ยังไม่ผ่าน ปุ่ม disabled + popup "QC ต้องผ่านก่อน" — `production.md` §7.3); ทุก PRD ของ PO/SO พร้อมส่ง → order พร้อมส่ง + noti Shipping. **Batch ไม่ผ่าน → PRD line = Rework (สถานะ "กำลังผลิต · Rework") + feedback บังคับ ("QC ไม่ผ่าน") + gen Batch run ถัดไป** — ยืนยันตรง entity-status-map §1.4. **★ แท็บ (B) ตรวจแบตช์ แยกเป็น 2 sub-tab: "Batch OEM" (ผูก PO/ลูกค้า + surplus) และ "Batch Own-Brand" (produce-to-stock/ไม่ผูกลูกค้า)** เพราะปลายทางต่างกัน (§2b). **★ เข้าหน้านี้ได้ผ่าน deep-link "ไปหน้า QC ›" จากหน้าผลิต → sub-tab ตาม PRD → Batch นั้นโดยตรง** (production.md §7.4). เห็น GMP chain Lot→Batch→PO + ประวัติ run. **★ QC record มีช่องหมายเหตุ (comment) แยกจาก feedback ตัดสิน** — แก้ในที่ + เก็บประวัติครบ ตามกติกากลาง G6. **★ comment/feedback ของ Batch แสดง "ในบริบทของ Batch นั้น" (ติดกับ Batch) ให้ชัดว่าเป็นของ Batch ใด (UX-placement, §4b).**

---

## 1. Purpose
เป็นจุดควบคุมคุณภาพเดียวของระบบ: **(A)** ตรวจรับวัตถุดิบขาเข้าราย Lot/GR **โดยเป็น gate ของการเข้าสต็อก** (ผ่านจึง credit on_hand) และ **(B)** ปล่อย/ตีกลับงานผลิตราย Batch line — เพื่อให้เฉพาะของที่ผ่านคุณภาพเดินต่อ พร้อม trace GMP ครบ.

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `qc.html` แท็บ **(A) ตรวจรับวัตถุดิบ (RM incoming)** | คิว **GR/Lot สถานะ "รอตรวจ (QC ตรวจสอบ)"** → บันทึก **ผ่าน/ไม่ผ่าน** ราย Lot (per GR line) · **ผ่าน = gate ให้ RM เข้าสต็อก (credit on_hand + FIFO retro-link, `goods-receipt.md` §4/§9)** · ไม่ผ่าน = Lot ระงับ (→ `return.md`) + GR ไม่ผ่าน · **+ ช่อง comment (G6)** |
| `qc.html` แท็บ **(B) ตรวจแบตช์ (Batch)** — **2 sub-tab: "Batch OEM" / "Batch Own-Brand"** | ตัดสินราย Batch line (✓ ผ่าน / ✕ ไม่ผ่าน + feedback) · **แยก OEM (ผูก PO/ลูกค้า) กับ Own-Brand (produce-to-stock/ไม่ผูกลูกค้า) เพราะปลายทางต่างกัน (§2b)** · comment/feedback แสดง **ในบริบท Batch นั้น** (§4b) · **★ deep-link เข้าตรง Batch จากปุ่ม "ไปหน้า QC ›" ของหน้าผลิต (§9)** |
| ทั้งหน้า | GMP chain Lot→Batch→PO + ประวัติ run · **+ ช่อง comment (หมายเหตุ) + ประวัติการแก้ไข บน QC record (G6)** |

### 2b. ★ แท็บ (B) ตรวจแบตช์ — 2 sub-tab (OEM vs Own-Brand) (ปอนด์สั่งแยก 2026-07-29)
Batch มาจาก **OEM** (ผูก PO/ลูกค้า) และ **Own-Brand produce-to-stock** (ไม่ผูกลูกค้า). ปอนด์สั่งแยกเป็น 2 sub-tab เพราะ **action/บริบทปลายทางต่างกัน** — การตัดสิน QC (ผ่าน/ไม่ผ่าน+feedback) เหมือนกันทั้งคู่ แต่สิ่งที่ต่างคือสิ่งที่เกิดหลังผ่าน:

| มิติ | **Batch OEM** | **Batch Own-Brand (produce-to-stock)** |
|---|---|---|
| ผูกกับ | **PO + ลูกค้า** (OEM order) | **SO produce-to-stock — ไม่ผูกลูกค้า** (มาจาก Supply Planning "สั่งผลิต" D8 v2 หรือ SO โหมด ข) |
| เมื่อ QC ผ่าน (ปลายทาง) | PRD eligible → ฝ่ายผลิตกด "พร้อมส่ง" → **ส่งลูกค้า = จำนวนสั่ง · ส่วนเกิน (surplus, actual − ordered) → FG stock** (D13) | PRD eligible → ฝ่ายผลิตกด "พร้อมส่ง" → **FG เข้าคลังเต็มจำนวนผลิตจริง (ส่ง 0)** (D12) |
| context ที่แสดงในแถว | PO no. + ลูกค้า + line | SO no. (produce-to-stock) + FG + batch count |
| เมื่อ QC ไม่ผ่าน (เหมือนกัน) | PRD = Rework (กำลังผลิต · Rework) + feedback "QC ไม่ผ่าน" + gen run ถัดไป | เหมือนกันทุกประการ |
| การตัดสิน (เหมือนกัน) | ราย Batch line · ผ่าน/ไม่ผ่าน + feedback (บังคับเมื่อไม่ผ่าน) | เหมือนกัน |

- **การตัดสิน QC เหมือนกันทั้ง 2 sub-tab** — ต่างกันแค่ **grouping/context ที่แสดง + ปลายทางหลังผ่าน** (surplus vs FG-in เต็มจำนวน; ทั้งคู่ทำ **ที่หน้าผลิต** ตอนกด "พร้อมส่ง" ไม่ใช่ที่หน้า QC).
- **default sub-tab:** "Batch OEM"; deep-link "ไปหน้า QC ›" เลือก sub-tab อัตโนมัติตามชนิดของ PRD (OEM/Own-Brand) แล้ว focus Batch นั้น (§9).

## 3. Fields
| ฟิลด์ | ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| Batch id `B-{PO}-{line}-{run}` | string | computed | run ใหม่เมื่อ rework |
| ผลตัดสิน Batch | enum {ผ่าน, ไม่ผ่าน} | editable (Approve) | ราย line |
| feedback | text | editable | **บังคับเมื่อไม่ผ่าน** — ผล/เหตุตัดสิน QC ("QC ไม่ผ่าน") ที่บันทึกบน Batch (ฟิลด์เดิม, reuse) · **แสดงในบริบท Batch นั้น (§4b)** |
| Lot id | string | computed | ขาเข้า |
| **GR id `GR-{YYYYMMDD}-{NNN}`** | string | computed | GR object ต้นทางของ Lot (แสดงในแท็บ A) |
| ผลตรวจรับ Lot | enum {ผ่าน, ไม่ผ่าน} | editable (Approve) | **★ ผ่าน = gate credit on_hand ของ Lot + FIFO retro-link (`goods-receipt.md` §9)** · ไม่ผ่าน = Lot ระงับ + ไม่ credit |
| **comment (หมายเหตุ)** | text | editable | **ช่องเดียว, แก้ในที่ (overwrite), ว่างได้** บน QC record · เก็บประวัติครบ · **แยกจาก "feedback"** · ตามกติกากลาง **`comment-convention.md` (G6/CC1–CC7)** |
| GMP chain | view Lot→Batch→PO | computed | recall |

## 4. Statuses / lifecycle (entity-status-map §1.5/§1.6/§1.8)
### 4.1 (A) ตรวจรับ RM ขาเข้า (Lot/GR) — ★ QC-gated stock-in
- **Lot ขาเข้า:** รอตรวจรับ (QC ตรวจสอบ) → **ผ่าน "พร้อมใช้ผลิต"** (+อาจปิด PR) · **ไม่ผ่าน "ระงับ"** → คืนของ (`return.md`).
- **★ credit สต็อกเกิดตอน "ผ่าน" ไม่ใช่ตอน GR:** Goods Receipt สร้าง Lot + GR object **โดยยังไม่ credit on_hand** (Lot รอตรวจ). **QC ผ่าน → ระบบ credit on_hand ของ Lot ตอนนี้ + ชดเชยยอดติดลบ (ถ้ามี) + back-allocate FIFO retro-link ตอนนี้** (`goods-receipt.md` §9, `stock.md` §6 `GR (+)`). **QC ไม่ผ่าน → ไม่ credit เลย** (RM ไม่เข้าสต็อก) — ยอดติดลบ (ถ้ามี) คงอยู่จนกว่าจะมี GR/Lot ที่ผ่านมาชดเชย.
- **GR object (roll-up จากผล Lot ราย line):** QC ตรวจสอบ → ผ่าน (ทุก Lot ผ่าน) / ไม่ผ่าน (≥1 Lot ไม่ผ่าน) · **ไม่ผ่าน → ส่งกลับ QC (re-submit) หรือ ยกเลิก GR** (`goods-receipt.md` §4). warehouse เห็น/จัดการที่ **แท็บ "Good Receipt (RM)" ของ stock** (`stock.md` §2b).

### 4.2 (B) ตรวจ Batch การผลิต
- **Batch QC ผ่าน** → PRD line "พร้อมส่งมอบ (eligible)".
- **★ QC pass = precondition ของการกด "✓ พร้อมส่ง" ที่หน้าผลิต (production.md §7.3):** Batch QC ผ่าน → ฝ่ายผลิตจึงกด "พร้อมส่ง" ได้ (capture surplus D13 → PRD Ready to Ship). **ถ้ายังไม่ผ่าน → ปุ่มพร้อมส่งที่หน้าผลิต disabled + popup "QC ต้องผ่านก่อน"**. QC ไม่ตั้งสถานะ Ready-to-Ship เอง (ฝ่ายผลิตกดที่หน้าผลิต).
- **★ Batch QC ไม่ผ่าน → PRD line = Rework → สถานะ "กำลังผลิต · Rework"** (feedback "QC ไม่ผ่าน" บังคับ + gen Batch run ถัดไป). **CONFIRMED ตรง entity-status-map §1.4** (Rework = สีฟ้า processing, อยู่ในกลุ่ม "กำลังผลิต" สำหรับ ordering ในคิวผลิต — `production.md` §6.2). ปอนด์: "ถ้าใช่ เอาเป็นแบบนี้ไปก่อน" → **settled** (locked rule เห็นตรง).
- **★ "QC ไม่ผ่าน" comment = reuse ฟิลด์ feedback เดิม** (บังคับเมื่อไม่ผ่าน) — ไม่สร้างฟิลด์ใหม่. แสดงบน Batch นั้น + โผล่ trace.

### 4b. ★ Comment field (G6) + comment placement (UX)
- QC record (ทั้ง Batch line และ Lot record) มี **ช่องหมายเหตุ (comment) เดียว** — **แยกจาก "feedback"** ที่บังคับเมื่อ "ไม่ผ่าน".
- **แก้ในที่ (overwrite)** · **เก็บประวัติครบ** (ใคร/เมื่อ/เดิม→ใหม่) ผ่าน field-audit (entity=QC record, field=`comment`).
- ดูประวัติ inline (**"ประวัติการแก้ไข comment"**) · การแก้ = activity-log + โผล่ trace/GMP chain. กติกาเต็ม = `comment-convention.md`.
- **★ Comment placement (ปอนด์: comment เดี่ยว ๆ ไม่ชัดว่าเป็นของ Batch ไหน) — UX note:** ทั้ง **comment (G6)** และ **feedback ("QC ไม่ผ่าน")** ต้องแสดง **ภายใน/ติดกับ card ของ Batch นั้นโดยตรง** (ในบริบทของ Batch) ไม่ใช่ลอยแยกจาก Batch — ให้ผู้ใช้เห็นชัดว่าหมายเหตุ/ผลตัดสินเป็นของ Batch ใด (คล้ายการ fix comment placement ของ PR). งานหน้าตา = UX/UI.

## 5. User Stories (absorbed) + AC สรุป
- **★ US-QC-00 (Must) — ตรวจรับ RM ขาเข้า = gate เข้าสต็อก (ผ่าน):** GR-…/Lot L-GLY-2607 สถานะ "รอตรวจ (QC ตรวจสอบ)" → "✓ ผ่าน" → **credit on_hand ของ Lot ตอนนี้** (`GR (+)`, Available เพิ่ม) + ชดเชยติดลบ/FIFO retro-link ตอนนี้; Lot = พร้อมใช้ผลิต; อาจปิด PR; GR = ผ่าน; noti Stock (C17/C18). **Edge:** on_hand ก่อนตรวจ = −4 → ผ่านแล้ว on_hand = +2 + notice ชดเชยติดลบ 4 (ผูก Lot ย้อน FIFO). **Error:** ตัดสิน Lot ที่ผ่านแล้ว → error.
- **US-QC-01 (Must) — ตรวจ Batch (ผ่าน):** B-…-176-1-1 รอ QC → "✓ ผ่าน" → Batch=ผ่าน; PRD line=พร้อมส่งมอบ (eligible) → **เปิดปุ่ม "พร้อมส่ง" ที่หน้าผลิต**; ถ้าทุก PRD ของ PO พร้อมส่งครบ → PO=พร้อมส่ง + noti Shipping (C5). **Edge:** PO 2 line ผ่านแค่ line 1 → PO ยังไม่พร้อม (แสดง "ผ่าน 1/2"). **Error:** ตัดสิน Batch ที่ไม่อยู่คิว → error "รายการไม่พร้อมตรวจ".
- **US-QC-02 (Must) — ตรวจ Batch (ไม่ผ่าน → Rework/กำลังผลิต):** B-…-181-2-1 → "✕ ไม่ผ่าน" + feedback "QC ไม่ผ่าน" → Batch=ไม่ผ่าน; **PRD line 2 = Rework (กำลังผลิต · Rework)**; noti Production; trace เก็บ feedback (C6). **Edge:** เห็นประวัติ run1 + feedback เดิมเมื่อเปิด run2; feedback/comment แสดงในบริบท Batch. **Error:** ไม่ผ่านโดย feedback ว่าง → error "ต้องระบุ feedback".
- **US-QC-03 (Should) — ตรวจรับ Lot ขาเข้า (ไม่ผ่าน):** L-GLY-2607 รอตรวจ → "ไม่ผ่าน" → **ไม่ credit สต็อก** · Lot=ระงับ → ใบคืน supplier (`return.md`); GR=ไม่ผ่าน → warehouse ส่งกลับ QC/ยกเลิกได้ (`stock.md` §2b). noti Stock (C18). **Error:** ตัดสิน Lot ที่ผ่านแล้ว → error.
- **US-QC-04 (Should) — comment + ประวัติ (G6):** ผู้ใช้ (QC.Update) แก้ **comment** บน QC record → บันทึก old→new + ใคร/เมื่อ; เปิด "ประวัติการแก้ไข comment"; comment โผล่ trace; comment/feedback แสดงในบริบท Batch. **Edge:** แก้ comment ว่าง → ค่าเดิมยังอยู่ในประวัติ · comment คนละฟิลด์กับ feedback. **Error:** Read อย่างเดียว → แก้ comment ไม่ได้.
- **★ US-QC-05 (Should) — deep-link จากหน้าผลิต:** ฝ่ายผลิตกด "ไปหน้า QC ›" (เปิดได้เฉพาะสถานะ ส่งตรวจคุณภาพ) → เปิด qc **แท็บ "ตรวจแบตช์" → sub-tab ตามชนิด PRD (OEM/Own-Brand) → Batch นั้นโดยตรง** (โฟกัส/highlight). **Edge:** ผู้ใช้มีสิทธิ์ QC.Read → เห็นรายการ; ตัดสินต้อง QC.Approve/Update. **Error:** เข้า deep-link ของ Batch ที่ไม่อยู่คิว QC → แสดง record แต่ปุ่มตัดสิน disabled (`production.md` §7.4).

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ดูคิว QC / GMP chain / ประวัติ / **เปิด deep-link Batch** | QC.**Read (R)** |
| **ตัดสินรับ Lot ขาเข้า (ผ่าน/ไม่ผ่าน) — ★ ผ่าน = credit stock** | QC.**Approve (A)** |
| ตัดสิน Batch (ผ่าน/ไม่ผ่าน+feedback) | QC.**Approve (A)** (บาง config = Update) |
| **แก้ comment (หมายเหตุ) บน QC record (G6)** | QC.**Update (U)** · ดู/เปิดประวัติ = **Read (R)** |
> ตัดสินได้ที่หน้า QC เท่านั้น (หน้าผลิต/หน้ารับเข้าไม่มีปุ่มตัดสิน — มีเพียง "ไปหน้า QC ›" นำทาง). **การ credit on_hand เป็นผลอัตโนมัติของ "ผ่าน" (ไม่ใช่ action แยก).**

## 7. Validations
- **RM ขาเข้า: ผ่าน = credit on_hand + FIFO retro-link ตอนนี้ · ไม่ผ่าน = ไม่ credit** (stock-in gated on pass) · ตัดสินซ้ำ Lot ที่ตัดสินแล้วไม่ได้.
- Batch ไม่ผ่าน = **feedback บังคับ** ("QC ไม่ผ่าน").
- ตัดสินได้เฉพาะรายการในคิว; ตัดสินซ้ำของที่ผ่านแล้วไม่ได้.
- rework = gen Batch run ใหม่ เฉพาะ line ที่ไม่ผ่าน → PRD = กำลังผลิต · Rework.
- **comment (หมายเหตุ) = optional** · การแก้ทุกครั้งถูก audit (G6/CC3).
- **★ deep-link "ไปหน้า QC" เปิดได้จากหน้าผลิตเฉพาะสถานะ ส่งตรวจคุณภาพ (QC)** (production.md §7.4); ปลายทางเปิดที่ sub-tab (OEM/Own-Brand) ของ Batch นั้น.

## 8. Formulas
- PO/SO พร้อมส่ง = ทุก PRD line ของ order ถูกกด "พร้อมส่ง" ครบ (ผ่าน QC + capture surplus — production.md §4/§5b).
- **★ GR object status (roll-up):** QC ตรวจสอบ = ยังมี Lot รอตรวจ · ผ่าน = ทุก Lot (ราย line) ผ่าน · ไม่ผ่าน = ≥1 Lot ไม่ผ่าน (ราย line QC = truth granular; GR = roll-up สำหรับ filter, `goods-receipt.md` §4/§9).

## 9. Pagination / Search + Deep-link
- คิว QC (A + B) + ประวัติ run: 20/หน้า (G1) · ค้นเลข Batch/PRD/Lot/**GR/supplier** · filter ผ่าน/ไม่ผ่าน/รอตรวจ/ช่วงวันที่ (G2).
- **★ Deep-link "ตรวจแบตช์" ต่อ Batch:** ปุ่ม "ไปหน้า QC ›" ในหน้าผลิต (เฉพาะสถานะ QC) → เปิด `qc.html` แท็บ **ตรวจแบตช์** → **sub-tab ตามชนิด PRD (OEM/Own-Brand)** พร้อม focus Batch `B-{PO}-{line}-{run}` ที่ระบุ (deep-link parameter). ถ้า Batch ไม่อยู่คิว → แสดง record read-only + ปุ่มตัดสิน disabled.

## 10. Cross-links
- **★ RM ขาเข้า: ผ่าน → credit stock + FIFO retro-link → `goods-receipt.md` §9 · `stock.md` §6.** GR object lifecycle + ส่งกลับ QC/ยกเลิก → `goods-receipt.md` §4 · warehouse view → `stock.md` §2b. ไม่ผ่าน → Lot ระงับ → `return.md`. Lot ขาเข้า (C18) → `pr.md` (ปิด PR).
- **★ Batch ผ่าน → order พร้อมส่ง (`po.md`/`so.md`, C5). Batch ไม่ผ่าน → Rework/กำลังผลิต (`production.md`, C6).** **★ QC-gate "พร้อมส่ง" + deep-link "ไปหน้า QC" → `production.md` §7.3/§7.4.** GMP chain + comment audit → `traceability.md` · **comment field → `comment-convention.md` (G6)** · **GR status audit → `traceability.md` §3/§4.**

## 11. Module changelog
- **★ NEW (2026-07-29 — QC + GR/Stock flow review, ปอนด์):**
  1. **แท็บ (A) ตรวจรับวัตถุดิบ (RM incoming) = QC-gate ของการเข้าสต็อก** — RM ที่รับเข้ายังไม่เข้าสต็อกทันที; **ผ่าน → credit on_hand + FIFO retro-link ตอนนี้ · ไม่ผ่าน → ไม่เข้าสต็อก + Lot ระงับ** (reconcile กับ GR→Lot + negative compensation เดิม — credit ย้ายจากตอน GR มาที่ QC pass) — §1/§2/§4.1/§5 (US-QC-00/03)/§7/§8/§10, ref `goods-receipt.md` §4/§9 · `stock.md` §2b/§6.
  2. **แท็บ (B) ตรวจแบตช์ แยก 2 sub-tab: Batch OEM / Batch Own-Brand** (การตัดสินเหมือนกัน; ต่างที่ context + ปลายทางหลังผ่าน) — §2/§2b/§9.
  3. **CONFIRM Batch QC ไม่ผ่าน → PRD = Rework (สถานะ "กำลังผลิต · Rework"), reuse feedback "QC ไม่ผ่าน"** (settled ตรง entity-status-map §1.4) — §4.2/§5 (US-QC-02).
  4. **★ Comment placement:** comment (G6) + feedback แสดง **ในบริบทของ Batch นั้น (ติดกับ Batch)** ให้ชัดว่าเป็นของ Batch ใด (UX note) — §2b/§4b.
- **★ เพิ่ม (2026-07-29 — comment cross-cutting):** ช่อง comment + ประวัติบน QC record (G6) — แยกจาก feedback.
- **★ เพิ่ม (2026-07-29 — Production module review, ปอนด์):**
  1. **QC pass = precondition ของปุ่ม "✓ พร้อมส่ง" ที่หน้าผลิต** (ไม่ผ่าน = disabled + popup "QC ต้องผ่านก่อน") — §4.2/§5 (US-QC-01)/§8/§10, ref `production.md` §7.3. QC ไม่ตั้ง Ready-to-Ship เอง.
  2. **★ Deep-link "ไปหน้า QC ›" → แท็บ "ตรวจแบตช์" → Batch นั้นโดยตรง** (เปิดจากหน้าผลิตเฉพาะสถานะ QC) — §2/§5 (US-QC-05)/§7/§9/§10, ref `production.md` §7.4.
- **Absorbed:** functional-spec `qc.html` US-QC-01..03 (9 AC).
- **คงเดิม:** ตัดสินที่หน้า QC เท่านั้น · per-line Batch/Lot · feedback บังคับ · rework เฉพาะ line เสีย · Lot ไม่ผ่าน→คืน.
