# Module — QC (ควบคุมคุณภาพ)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE SPEC** (absorbs functional-spec `qc.html` US-QC-01..03)
Mockups: `mockups/qc.html`
กฎอ้างอิง: entity-status-map §1.5/§1.6 (Batch/Lot QC) · `production.md` (Rework run gen · **§7.3 QC-gate "พร้อมส่ง"** · **§7.4 deep-link "ไปหน้า QC"**) · `return.md` (Lot ไม่ผ่าน→คืน) · `goods-receipt.md`/`pr.md` (Lot ผ่าน→อาจปิด PR) · **`comment-convention.md` (G6/CC1–CC7 — comment field)** · README §3

## สรุปภาษาไทย
QC มี 2 งาน: **ตรวจ Batch การผลิต** (ตัดสินราย line: ✓ ผ่าน / ✕ ไม่ผ่าน) และ **ตรวจรับ Lot วัตถุดิบขาเข้า**. **การตัดสิน QC ทำที่หน้านี้เท่านั้น** (หน้าผลิตไม่มีปุ่มตัดสิน). Batch ผ่าน → PRD line "พร้อมส่งมอบ (eligible)" — **เป็น precondition ให้ฝ่ายผลิตกด "✓ พร้อมส่ง" ที่หน้าผลิต** (ถ้ายังไม่ผ่าน ปุ่มพร้อมส่ง disabled + popup "QC ต้องผ่านก่อน" — `production.md` §7.3); ทุก PRD ของ PO/SO พร้อมส่ง → order พร้อมส่ง + noti Shipping. Batch ไม่ผ่าน → **PRD line = Rework + feedback บังคับ + gen Batch run ถัดไป**. Lot ขาเข้า ผ่าน → "พร้อมใช้ผลิต"; ไม่ผ่าน → "ระงับ" → ทำใบคืน supplier. **★ เข้าหน้านี้ได้ผ่าน deep-link "ไปหน้า QC ›" จากหน้าผลิต → แท็บ "ตรวจแบตช์" → Batch นั้นโดยตรง** (production.md §7.4). เห็น GMP chain Lot→Batch→PO + ประวัติ run. **★ QC record มีช่องหมายเหตุ (comment) แยกจาก feedback ตัดสิน** — แก้ในที่ + เก็บประวัติครบ ตามกติกากลาง G6.

---

## 1. Purpose
เป็นจุดควบคุมคุณภาพเดียวของระบบ: ปล่อย/ตีกลับงานผลิตราย Batch line และตรวจรับวัตถุดิบขาเข้าราย Lot — เพื่อให้เฉพาะของที่ผ่านคุณภาพเดินต่อ พร้อม trace GMP ครบ.

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `qc.html` | แท็บ **ตรวจรับ Lot ขาเข้า** + แท็บ **ตรวจแบตช์ (ตรวจ Batch)** (ผ่าน/ไม่ผ่าน+feedback) + GMP chain + ประวัติ run · **+ ช่อง comment (หมายเหตุ) + ประวัติการแก้ไข บน QC record (G6)** · **★ รองรับ deep-link เข้าตรง Batch จากปุ่ม "ไปหน้า QC ›" ของหน้าผลิต (§9)** |

## 3. Fields
| ฟิลด์ | ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| Batch id `B-{PO}-{line}-{run}` | string | computed | run ใหม่เมื่อ rework |
| ผลตัดสิน Batch | enum {ผ่าน, ไม่ผ่าน} | editable (Approve) | ราย line |
| feedback | text | editable | **บังคับเมื่อไม่ผ่าน** — ผล/เหตุตัดสิน QC (ฟิลด์เดิม) |
| Lot id | string | computed | ขาเข้า |
| ผลตรวจรับ Lot | enum {ผ่าน, ไม่ผ่าน} | editable (Approve) | |
| **comment (หมายเหตุ)** | text | editable | **ช่องเดียว, แก้ในที่ (overwrite), ว่างได้** บน QC record · เก็บประวัติครบ · **แยกจาก "feedback"** · ตามกติกากลาง **`comment-convention.md` (G6/CC1–CC7)** |
| GMP chain | view Lot→Batch→PO | computed | recall |

## 4. Statuses / lifecycle (entity-status-map §1.5/§1.6)
- **Batch QC:** ผ่าน → PRD line "พร้อมส่งมอบ (eligible)" · ไม่ผ่าน → PRD line "Rework" + gen run ถัดไป (feedback บังคับ).
- **★ QC pass = precondition ของการกด "✓ พร้อมส่ง" ที่หน้าผลิต (production.md §7.3):** Batch QC ผ่าน → ฝ่ายผลิตจึงกด "พร้อมส่ง" ได้ (capture surplus D13 → PRD Ready to Ship). **ถ้ายังไม่ผ่าน → ปุ่มพร้อมส่งที่หน้าผลิต disabled + popup "QC ต้องผ่านก่อน"**. QC ไม่ตั้งสถานะ Ready-to-Ship เอง (ฝ่ายผลิตกดที่หน้าผลิต).
- **Lot QC ขาเข้า:** รอตรวจรับ → ผ่าน "พร้อมใช้ผลิต" (+อาจปิด PR) · ไม่ผ่าน "ระงับ" → คืนของ (`return.md`).

### 4b. ★ Comment field (G6 — ตามกติกากลาง)
- QC record (ทั้ง Batch line และ Lot record) มี **ช่องหมายเหตุ (comment) เดียว** — **แยกจาก "feedback"** ที่บังคับเมื่อ "ไม่ผ่าน".
- **แก้ในที่ (overwrite)** · **เก็บประวัติครบ** (ใคร/เมื่อ/เดิม→ใหม่) ผ่าน field-audit (entity=QC record, field=`comment`).
- ดูประวัติ inline (**"ประวัติการแก้ไข comment"**) · การแก้ = activity-log + โผล่ trace/GMP chain. กติกาเต็ม = `comment-convention.md`.

## 5. User Stories (absorbed) + AC สรุป
- **US-QC-01 (Must) — ตรวจ Batch (ผ่าน):** B-…-176-1-1 รอ QC → "✓ ผ่าน" → Batch=ผ่าน; PRD line=พร้อมส่งมอบ (eligible) → **เปิดปุ่ม "พร้อมส่ง" ที่หน้าผลิต**; ถ้าทุก PRD ของ PO พร้อมส่งครบ → PO=พร้อมส่ง + noti Shipping (C5). **Edge:** PO 2 line ผ่านแค่ line 1 → PO ยังไม่พร้อม (แสดง "ผ่าน 1/2"). **Error:** ตัดสิน Batch ที่ไม่อยู่คิว → error "รายการไม่พร้อมตรวจ".
- **US-QC-02 (Must) — ตรวจ Batch (ไม่ผ่าน → Rework):** B-…-181-2-1 → "✕ ไม่ผ่าน" + feedback → Batch=ไม่ผ่าน; PRD line 2=Rework; noti Production; trace เก็บ feedback (C6). **Edge:** เห็นประวัติ run1 + feedback เดิมเมื่อเปิด run2. **Error:** ไม่ผ่านโดย feedback ว่าง → error "ต้องระบุ feedback".
- **US-QC-03 (Should) — ตรวจรับ Lot ขาเข้า:** L-GLY-2607 รอตรวจรับ → "ผ่าน" → Lot=พร้อมใช้ผลิต; อาจปิด PR; noti Stock (C18). **Edge:** ไม่ผ่าน → Lot=ระงับ → ใบคืน supplier. **Error:** ตัดสิน Lot ที่ผ่านแล้ว → error.
- **US-QC-04 (Should) — comment + ประวัติ (G6):** ผู้ใช้ (QC.Update) แก้ **comment** บน QC record → บันทึก old→new + ใคร/เมื่อ; เปิด "ประวัติการแก้ไข comment"; comment โผล่ trace. **Edge:** แก้ comment ว่าง → ค่าเดิมยังอยู่ในประวัติ · comment คนละฟิลด์กับ feedback. **Error:** Read อย่างเดียว → แก้ comment ไม่ได้.
- **★ US-QC-05 (Should) — deep-link จากหน้าผลิต:** ฝ่ายผลิตกด "ไปหน้า QC ›" (เปิดได้เฉพาะสถานะ ส่งตรวจคุณภาพ) → เปิด qc **แท็บ "ตรวจแบตช์" ที่ Batch นั้นโดยตรง** (โฟกัส/highlight รายการ). **Edge:** ผู้ใช้มีสิทธิ์ QC.Read → เห็นรายการ; ตัดสินต้อง QC.Approve/Update. **Error:** เข้า deep-link ของ Batch ที่ไม่อยู่คิว QC → แสดง record แต่ปุ่มตัดสิน disabled (`production.md` §7.4).

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ดูคิว QC / GMP chain / ประวัติ / **เปิด deep-link Batch** | QC.**Read (R)** |
| ตัดสิน Batch (ผ่าน/ไม่ผ่าน+feedback) | QC.**Approve (A)** (บาง config = Update) |
| ตัดสินรับ Lot ขาเข้า (ผ่าน/ไม่ผ่าน) | QC.**Approve (A)** |
| **แก้ comment (หมายเหตุ) บน QC record (G6)** | QC.**Update (U)** · ดู/เปิดประวัติ = **Read (R)** |
> ตัดสินได้ที่หน้า QC เท่านั้น (หน้าผลิตไม่มีปุ่มตัดสิน — มีเพียง "ไปหน้า QC ›" นำทาง).

## 7. Validations
- ไม่ผ่าน = **feedback บังคับ**.
- ตัดสินได้เฉพาะรายการในคิว; ตัดสินซ้ำของที่ผ่านแล้วไม่ได้.
- rework = gen Batch run ใหม่ เฉพาะ line ที่ไม่ผ่าน.
- **comment (หมายเหตุ) = optional** · การแก้ทุกครั้งถูก audit (G6/CC3).
- **★ deep-link "ไปหน้า QC" เปิดได้จากหน้าผลิตเฉพาะสถานะ ส่งตรวจคุณภาพ (QC)** (production.md §7.4); ปลายทางเปิดที่แท็บ "ตรวจแบตช์" ของ Batch นั้น.

## 8. Formulas
- PO/SO พร้อมส่ง = ทุก PRD line ของ order ถูกกด "พร้อมส่ง" ครบ (ผ่าน QC + capture surplus — production.md §4/§5b).

## 9. Pagination / Search + Deep-link
- คิว QC + ประวัติ run: 20/หน้า (G1) · ค้นเลข Batch/PRD/Lot · filter ผ่าน/ไม่ผ่าน/ช่วงวันที่ (G2).
- **★ Deep-link "ตรวจแบตช์" ต่อ Batch:** ปุ่ม "ไปหน้า QC ›" ในหน้าผลิต (เฉพาะสถานะ QC) → เปิด `qc.html` แท็บ **ตรวจแบตช์** พร้อม focus Batch `B-{PO}-{line}-{run}` ที่ระบุ (deep-link parameter). ถ้า Batch ไม่อยู่คิว → แสดง record read-only + ปุ่มตัดสิน disabled.

## 10. Cross-links
- ผ่าน → order พร้อมส่ง (`po.md`/`so.md`, C5). ไม่ผ่าน → Rework (`production.md`, C6). **★ QC-gate "พร้อมส่ง" + deep-link "ไปหน้า QC" → `production.md` §7.3/§7.4.** Lot ขาเข้า (C18) → `goods-receipt.md`/`return.md`. GMP chain + comment audit → `traceability.md` · **comment field → `comment-convention.md` (G6)**.

## 11. Module changelog
- **★ NEW (2026-07-29 — comment cross-cutting):** ช่อง comment + ประวัติบน QC record (G6) — แยกจาก feedback.
- **★ เพิ่ม (2026-07-29 — Production module review, ปอนด์):**
  1. **QC pass = precondition ของปุ่ม "✓ พร้อมส่ง" ที่หน้าผลิต** (ไม่ผ่าน = disabled + popup "QC ต้องผ่านก่อน") — §4/§5 (US-QC-01)/§8/§10, ref `production.md` §7.3. QC ไม่ตั้ง Ready-to-Ship เอง.
  2. **★ Deep-link "ไปหน้า QC ›" → แท็บ "ตรวจแบตช์" → Batch นั้นโดยตรง** (เปิดจากหน้าผลิตเฉพาะสถานะ QC) — §2/§5 (US-QC-05)/§7/§9/§10, ref `production.md` §7.4.
- **Absorbed:** functional-spec `qc.html` US-QC-01..03 (9 AC).
- **คงเดิม:** ตัดสินที่หน้า QC เท่านั้น · per-line Batch · feedback บังคับ · rework เฉพาะ line เสีย · Lot ไม่ผ่าน→คืน.
