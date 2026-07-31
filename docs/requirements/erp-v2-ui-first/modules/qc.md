# Module — QC (ควบคุมคุณภาพ)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE SPEC** (absorbs functional-spec `qc.html` US-QC-01..03 · **★ + Gate-1 A4: purge stale C-codes → r19 event names / queue-discovered notes r20 2026-07-31**)
Mockups: `mockups/qc.html`
กฎอ้างอิง: entity-status-map §1.5/§1.6/**§1.8 (GR object QC-gate)** (Batch/Lot/GR QC) · `production.md` (Rework run gen · **§7.3 QC-gate "พร้อมส่ง"** · **§7.4 deep-link "ไปหน้า QC"**) · `return.md` (Lot ไม่ผ่าน→คืน) · **`goods-receipt.md` §4 (GR object lifecycle · QC-gated stock-in · credit/retro-link on pass)** · `pr.md` (Lot ผ่าน→อาจปิด PR) · **`stock.md` §2b ("Good Receipt (RM)" tab)** · **`comment-convention.md` (G6/CC1–CC7 — comment field)** · **`non-functional.md` §7 / `platform.md` §7 (noti: QC ผ่าน/ไม่ผ่าน = event r19; order-ready-to-ship = queue-discovered)** · README §3

## สรุปภาษาไทย
QC มี 2 งานหลัก: **(A) ตรวจรับวัตถุดิบขาเข้า (RM incoming — ราย Lot/GR)** และ **(B) ตรวจแบตช์การผลิต (Batch — ราย line)**. **การตัดสิน QC ทำที่หน้านี้เท่านั้น**. **★ (A) RM ที่รับเข้ายังไม่เข้าสต็อกทันที** — Goods Receipt สร้าง **GR object + Lot สถานะรอตรวจ** → QC บันทึกผล **ผ่าน/ไม่ผ่าน**: **ผ่าน → RM เข้าสต็อก (credit on_hand + ชดเชยยอดติดลบ + FIFO retro-link)** · **ไม่ผ่าน → ไม่เข้าสต็อก, Lot ระงับ → ใบคืน supplier หรือส่งกลับตรวจ/ยกเลิก GR** (`goods-receipt.md` §4). **(B) Batch** ผ่าน → PRD line "พร้อมส่งมอบ (eligible)" — **precondition ให้ฝ่ายผลิตกด "✓ พร้อมส่ง"** (`production.md` §7.3); ทุก PRD ของ PO/SO พร้อมส่ง → **order พร้อมส่ง (Shipping หยิบผ่าน Route candidate = queue-discovered, ไม่ยิง noti แยก)**. **Batch ไม่ผ่าน → PRD line = Rework + feedback บังคับ + gen Batch run ถัดไป**. **★ แท็บ (B) ตรวจแบตช์ แยก 2 sub-tab: "Batch OEM" / "Batch Own-Brand"** (§2b). **★ deep-link "ไปหน้า QC ›" จากหน้าผลิต**. **★ QC record มีช่องหมายเหตุ (comment) แยกจาก feedback** (G6). **★ การแจ้งเตือน (r19): "QC ตรวจรับ RM/Batch ผ่าน/ไม่ผ่าน" = noti หมวด 1 (Read module ปลายทาง); การปิด PR + order-ready-to-ship = queue-discovered (ไม่ยิง noti แยก).**

---

## 1. Purpose
เป็นจุดควบคุมคุณภาพเดียวของระบบ: **(A)** ตรวจรับวัตถุดิบขาเข้าราย Lot/GR **โดยเป็น gate ของการเข้าสต็อก** และ **(B)** ปล่อย/ตีกลับงานผลิตราย Batch line — เพื่อให้เฉพาะของที่ผ่านคุณภาพเดินต่อ พร้อม trace GMP ครบ.

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `qc.html` แท็บ **(A) ตรวจรับวัตถุดิบ (RM incoming)** | คิว **GR/Lot สถานะ "รอตรวจ (QC ตรวจสอบ)"** → บันทึก **ผ่าน/ไม่ผ่าน** ราย Lot · **ผ่าน = gate ให้ RM เข้าสต็อก** · ไม่ผ่าน = Lot ระงับ (→ `return.md`) + GR ไม่ผ่าน · **+ ช่อง comment (G6)** |
| `qc.html` แท็บ **(B) ตรวจแบตช์ (Batch)** — **2 sub-tab: "Batch OEM" / "Batch Own-Brand"** | ตัดสินราย Batch line (✓ ผ่าน / ✕ ไม่ผ่าน + feedback) · **แยก OEM (ผูก PO/ลูกค้า) กับ Own-Brand (produce-to-stock)** (§2b) · comment/feedback แสดง **ในบริบท Batch นั้น** (§4b) · **★ deep-link เข้าตรง Batch (§9)** |
| ทั้งหน้า | GMP chain Lot→Batch→PO + ประวัติ run · **+ ช่อง comment + ประวัติการแก้ไข บน QC record (G6)** |

### 2b. ★ แท็บ (B) ตรวจแบตช์ — 2 sub-tab (OEM vs Own-Brand) (ปอนด์สั่งแยก 2026-07-29)
Batch มาจาก **OEM** (ผูก PO/ลูกค้า) และ **Own-Brand produce-to-stock** (ไม่ผูกลูกค้า). แยก 2 sub-tab เพราะ **action/บริบทปลายทางต่างกัน**:

| มิติ | **Batch OEM** | **Batch Own-Brand (produce-to-stock)** |
|---|---|---|
| ผูกกับ | **PO + ลูกค้า** | **SO produce-to-stock — ไม่ผูกลูกค้า** (D8 v2 / SO โหมด ข) |
| เมื่อ QC ผ่าน (ปลายทาง) | PRD eligible → "พร้อมส่ง" → **ส่งลูกค้า = จำนวนสั่ง · surplus → FG stock (★ C4: OEM identity, sellable)** (D13) | PRD eligible → "พร้อมส่ง" → **FG เข้าคลังเต็มจำนวน (ส่ง 0)** (D12) → **SO(ข) = "ผลิตเข้าคลังแล้ว" (`so.md` §4)** |
| context ที่แสดง | PO no. + ลูกค้า + line | SO no. (produce-to-stock) + FG + batch count |
| เมื่อ QC ไม่ผ่าน (เหมือนกัน) | PRD = Rework + feedback + gen run ถัดไป | เหมือนกัน |

- **การตัดสิน QC เหมือนกันทั้ง 2 sub-tab** — ต่างแค่ grouping/context + ปลายทางหลังผ่าน.
- **default sub-tab:** "Batch OEM"; deep-link เลือก sub-tab อัตโนมัติตามชนิด PRD (§9).

## 3. Fields
| ฟิลด์ | ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| Batch id `B-{PO}-{line}-{run}` | string | computed | run ใหม่เมื่อ rework |
| ผลตัดสิน Batch | enum {ผ่าน, ไม่ผ่าน} | editable (Approve) | ราย line |
| feedback | text | editable | **บังคับเมื่อไม่ผ่าน** ("QC ไม่ผ่าน") · **แสดงในบริบท Batch (§4b)** |
| Lot id | string | computed | ขาเข้า |
| **GR id `GR-{YYYYMMDD}-{NNN}`** | string | computed | GR object ต้นทางของ Lot (แท็บ A) |
| ผลตรวจรับ Lot | enum {ผ่าน, ไม่ผ่าน} | editable (Approve) | **★ ผ่าน = gate credit on_hand + FIFO retro-link** · ไม่ผ่าน = Lot ระงับ |
| **comment (หมายเหตุ)** | text | editable | **ช่องเดียว, แก้ในที่, ว่างได้** · **แยกจาก "feedback"** · `comment-convention.md` (G6) |
| GMP chain | view Lot→Batch→PO | computed | recall |

## 4. Statuses / lifecycle (entity-status-map §1.5/§1.6/§1.8)
### 4.1 (A) ตรวจรับ RM ขาเข้า (Lot/GR) — ★ QC-gated stock-in
- **Lot ขาเข้า:** รอตรวจรับ → **ผ่าน "พร้อมใช้ผลิต"** (+อาจปิด PR — **queue-discovered**) · **ไม่ผ่าน "ระงับ"** → คืนของ (`return.md`).
- **★ credit สต็อกเกิดตอน "ผ่าน":** GR สร้าง Lot + GR object **โดยยังไม่ credit on_hand**. **QC ผ่าน → credit on_hand ของ Lot + ชดเชยยอดติดลบ + FIFO retro-link ตอนนี้** (`goods-receipt.md` §9, `stock.md` §6 `GR (+)`). **QC ไม่ผ่าน → ไม่ credit**.
- **GR object (roll-up):** QC ตรวจสอบ → ผ่าน / ไม่ผ่าน → **ส่งกลับ QC หรือ ยกเลิก GR** (`goods-receipt.md` §4). warehouse เห็นที่ **แท็บ "Good Receipt (RM)"** (`stock.md` §2b).

### 4.2 (B) ตรวจ Batch การผลิต
- **Batch QC ผ่าน** → PRD line "พร้อมส่งมอบ (eligible)".
- **★ QC pass = precondition ของการกด "✓ พร้อมส่ง" ที่หน้าผลิต (production.md §7.3):** ยังไม่ผ่าน → ปุ่มพร้อมส่ง disabled + popup "QC ต้องผ่านก่อน". QC ไม่ตั้ง Ready-to-Ship เอง.
- **★ Batch QC ไม่ผ่าน → PRD line = Rework → "กำลังผลิต · Rework"** (feedback "QC ไม่ผ่าน" บังคับ + gen Batch run ถัดไป). CONFIRMED ตรง entity-status-map §1.4.
- **★ "QC ไม่ผ่าน" comment = reuse ฟิลด์ feedback เดิม** — แสดงบน Batch นั้น + โผล่ trace.

### 4b. ★ Comment field (G6) + comment placement (UX)
- QC record มี **ช่องหมายเหตุ (comment) เดียว** — **แยกจาก "feedback"**.
- **แก้ในที่ (overwrite)** · **เก็บประวัติครบ** ผ่าน field-audit (entity=QC record, field=`comment`).
- ดูประวัติ inline · การแก้ = activity-log + โผล่ trace/GMP chain. `comment-convention.md`.
- **★ Comment placement — UX note:** ทั้ง **comment (G6)** และ **feedback** ต้องแสดง **ติดกับ card ของ Batch นั้นโดยตรง** ให้ชัดว่าเป็นของ Batch ใด. งานหน้าตา = UX/UI.

## 5. User Stories (absorbed) + AC สรุป
- **★ US-QC-00 (Must) — ตรวจรับ RM ขาเข้า = gate เข้าสต็อก (ผ่าน):** GR-…/Lot L-GLY-2607 "รอตรวจ" → "✓ ผ่าน" → **credit on_hand ของ Lot ตอนนี้** (`GR (+)`) + ชดเชยติดลบ/FIFO retro-link; Lot = พร้อมใช้ผลิต; อาจปิด PR (**queue-discovered**); GR = ผ่าน; **★ noti "QC ตรวจรับ RM ผ่าน" (r19 หมวด 1 → Read Stock/QC/Procurement)**. **Edge:** on_hand ก่อนตรวจ = −4 → ผ่านแล้ว = +2 + notice ชดเชยติดลบ 4. **Error:** ตัดสิน Lot ที่ผ่านแล้ว → error.
- **US-QC-01 (Must) — ตรวจ Batch (ผ่าน):** B-…-176-1-1 รอ QC → "✓ ผ่าน" → Batch=ผ่าน; PRD line=พร้อมส่งมอบ (eligible) → **เปิดปุ่ม "พร้อมส่ง" ที่หน้าผลิต**; ถ้าทุก PRD ของ PO พร้อมส่งครบ → **PO=พร้อมส่ง (★ Shipping หยิบผ่าน Route candidate list = queue-discovered — ไม่ยิง noti "ส่งต่อ Shipping" แยก)**. **Edge:** PO 2 line ผ่านแค่ line 1 → PO ยังไม่พร้อม ("ผ่าน 1/2"). **Error:** ตัดสิน Batch ที่ไม่อยู่คิว → error "รายการไม่พร้อมตรวจ".
- **US-QC-02 (Must) — ตรวจ Batch (ไม่ผ่าน → Rework/กำลังผลิต):** B-…-181-2-1 → "✕ ไม่ผ่าน" + feedback "QC ไม่ผ่าน" → Batch=ไม่ผ่าน; **PRD line 2 = Rework (กำลังผลิต · Rework)**; **★ noti "QC ไม่ผ่าน" (r19 หมวด 1 → Read Production)**; trace เก็บ feedback. **Edge:** เห็นประวัติ run1 + feedback เดิมเมื่อเปิด run2. **Error:** ไม่ผ่านโดย feedback ว่าง → error "ต้องระบุ feedback".
- **US-QC-03 (Should) — ตรวจรับ Lot ขาเข้า (ไม่ผ่าน):** L-GLY-2607 รอตรวจ → "ไม่ผ่าน" → **ไม่ credit สต็อก** · Lot=ระงับ → ใบคืน supplier (`return.md`); GR=ไม่ผ่าน → warehouse ส่งกลับ QC/ยกเลิกได้ (`stock.md` §2b). **★ noti "QC ตรวจรับ RM ไม่ผ่าน" (r19 หมวด 1 → Read Stock/QC)**. **Error:** ตัดสิน Lot ที่ผ่านแล้ว → error.
- **US-QC-04 (Should) — comment + ประวัติ (G6):** ผู้ใช้ (QC.Update) แก้ **comment** บน QC record → บันทึก old→new + ใคร/เมื่อ; comment โผล่ trace. **Edge:** แก้ comment ว่าง → ค่าเดิมยังอยู่ในประวัติ. **Error:** Read อย่างเดียว → แก้ comment ไม่ได้.
- **★ US-QC-05 (Should) — deep-link จากหน้าผลิต:** ฝ่ายผลิตกด "ไปหน้า QC ›" → เปิด qc **แท็บ "ตรวจแบตช์" → sub-tab ตามชนิด PRD → Batch นั้นโดยตรง**. **Edge:** QC.Read → เห็นรายการ; ตัดสินต้อง QC.Approve/Update. **Error:** deep-link ของ Batch ที่ไม่อยู่คิว → record read-only + ปุ่มตัดสิน disabled (`production.md` §7.4).

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ดูคิว QC / GMP chain / ประวัติ / **เปิด deep-link Batch** | QC.**Read (R)** |
| **ตัดสินรับ Lot ขาเข้า (ผ่าน/ไม่ผ่าน) — ★ ผ่าน = credit stock** | QC.**Approve (A)** |
| ตัดสิน Batch (ผ่าน/ไม่ผ่าน+feedback) | QC.**Approve (A)** (บาง config = Update) |
| **แก้ comment (หมายเหตุ) บน QC record (G6)** | QC.**Update (U)** · ดู/เปิดประวัติ = **Read (R)** |
> ตัดสินได้ที่หน้า QC เท่านั้น. **การ credit on_hand เป็นผลอัตโนมัติของ "ผ่าน".**

## 7. Validations
- **RM ขาเข้า: ผ่าน = credit on_hand + FIFO retro-link · ไม่ผ่าน = ไม่ credit** · ตัดสินซ้ำ Lot ที่ตัดสินแล้วไม่ได้.
- Batch ไม่ผ่าน = **feedback บังคับ** ("QC ไม่ผ่าน").
- ตัดสินได้เฉพาะรายการในคิว.
- rework = gen Batch run ใหม่ เฉพาะ line ที่ไม่ผ่าน → PRD = กำลังผลิต · Rework.
- **comment (หมายเหตุ) = optional** · การแก้ทุกครั้งถูก audit (G6/CC3).
- **★ deep-link "ไปหน้า QC" เปิดได้จากหน้าผลิตเฉพาะสถานะ ส่งตรวจคุณภาพ (QC)** (production.md §7.4).

## 8. Formulas
- PO/SO พร้อมส่ง = ทุก PRD line ถูกกด "พร้อมส่ง" ครบ (ผ่าน QC + capture surplus — production.md §4/§5b) · **order-ready-to-ship = queue-discovered โดย Shipping (Route candidate) — ไม่ยิง noti แยก**.
- **★ GR object status (roll-up):** QC ตรวจสอบ = ยังมี Lot รอตรวจ · ผ่าน = ทุก Lot ผ่าน · ไม่ผ่าน = ≥1 Lot ไม่ผ่าน (`goods-receipt.md` §4/§9).

## 9. Pagination / Search + Deep-link
- คิว QC (A + B) + ประวัติ run: 20/หน้า (G1) · ค้นเลข Batch/PRD/Lot/**GR/supplier** · filter ผ่าน/ไม่ผ่าน/รอตรวจ/ช่วงวันที่ (G2).
- **★ Deep-link "ตรวจแบตช์" ต่อ Batch:** ปุ่ม "ไปหน้า QC ›" → เปิด `qc.html` แท็บ **ตรวจแบตช์** → **sub-tab ตามชนิด PRD** + focus Batch `B-{PO}-{line}-{run}`. ถ้า Batch ไม่อยู่คิว → record read-only + ปุ่มตัดสิน disabled.

## 10. Cross-links
- **★ RM ขาเข้า: ผ่าน → credit stock + FIFO retro-link → `goods-receipt.md` §9 · `stock.md` §6.** GR object lifecycle → `goods-receipt.md` §4 · warehouse view → `stock.md` §2b. ไม่ผ่าน → Lot ระงับ → `return.md`. **Lot ขาเข้า ผ่าน → `pr.md` (ปิด PR = queue-discovered, ไม่ยิง noti แยก).**
- **★ Batch ผ่าน → order พร้อมส่ง (`po.md`/`so.md`) — queue-discovered โดย Shipping (Route candidate). Batch ไม่ผ่าน → Rework/กำลังผลิต (`production.md`) — noti "QC ไม่ผ่าน" (r19 หมวด 1, Read Production).** **★ QC-gate "พร้อมส่ง" + deep-link "ไปหน้า QC" → `production.md` §7.3/§7.4.**
- **★ noti event set (QC ผ่าน/ไม่ผ่าน = r19 หมวด 1; order-ready-to-ship + PR-close = queue-discovered) → `platform.md` §7 · `non-functional.md` §7.**
- GMP chain + comment audit → `traceability.md` · **comment field → `comment-convention.md` (G6)** · **GR status audit → `traceability.md` §3/§4.**

## 11. Module changelog
- **★ NEW (2026-07-29 — QC + GR/Stock flow review, ปอนด์):**
  1. **แท็บ (A) ตรวจรับวัตถุดิบ = QC-gate ของการเข้าสต็อก** — ผ่าน → credit on_hand + FIFO retro-link · ไม่ผ่าน → ไม่เข้าสต็อก + Lot ระงับ — §1/§2/§4.1/§5/§7/§8/§10.
  2. **แท็บ (B) ตรวจแบตช์ แยก 2 sub-tab: Batch OEM / Batch Own-Brand** — §2/§2b/§9.
  3. **CONFIRM Batch QC ไม่ผ่าน → PRD = Rework** — §4.2/§5.
  4. **★ Comment placement:** comment (G6) + feedback แสดง **ในบริบทของ Batch นั้น** — §2b/§4b.
- **★ เพิ่ม (2026-07-29 — comment cross-cutting):** ช่อง comment + ประวัติบน QC record (G6).
- **★ เพิ่ม (2026-07-29 — Production module review, ปอนด์):** QC pass = precondition ของ "✓ พร้อมส่ง" · Deep-link "ไปหน้า QC ›".
- **★ เพิ่ม (2026-07-31 — Gate-1 review reconciliation r20 · A4, ปอนด์):** **purge stale C-codes** (C5/C6/C17/C18) ใน 全 US + cross-links → แทนด้วย **ชื่อ event r19** ("QC ตรวจรับ RM/Batch ผ่าน/ไม่ผ่าน" = noti หมวด 1, Read module ปลายทาง) หรือ **note "queue-discovered"** (order-ready-to-ship = Shipping หาผ่าน Route candidate; ปิด PR = ไม่ยิง noti แยก). §5/§8/§10 + summary/header. ไม่มี C-code เหลือค้าง. **ใช้ view เดิม (`qc.html` render จาก .md).**
- **Absorbed:** functional-spec `qc.html` US-QC-01..03 (9 AC).
- **คงเดิม:** ตัดสินที่หน้า QC เท่านั้น · per-line Batch/Lot · feedback บังคับ · rework เฉพาะ line เสีย · Lot ไม่ผ่าน→คืน · QC-gate credit.
