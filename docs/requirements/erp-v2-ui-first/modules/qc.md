# Module — QC (ควบคุมคุณภาพ)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE SPEC** (absorbs functional-spec `qc.html` US-QC-01..03)
Mockups: `mockups/qc.html`
กฎอ้างอิง: entity-status-map §1.5/§1.6 (Batch/Lot QC) · `production.md` (Rework run gen) · `return.md` (Lot ไม่ผ่าน→คืน) · `goods-receipt.md`/`pr.md` (Lot ผ่าน→อาจปิด PR) · **`comment-convention.md` (G6/CC1–CC7 — comment field)** · README §3

## สรุปภาษาไทย
QC มี 2 งาน: **ตรวจ Batch การผลิต** (ตัดสินราย line: ✓ ผ่าน / ✕ ไม่ผ่าน) และ **ตรวจรับ Lot วัตถุดิบขาเข้า**. **การตัดสิน QC ทำที่หน้านี้เท่านั้น** (หน้าผลิตไม่มีปุ่มตัดสิน). Batch ผ่าน → PRD line "พร้อมส่งมอบ"; ทุก PRD ของ PO/SO ผ่าน → order "พร้อมจัดส่ง" + noti Shipping. Batch ไม่ผ่าน → **PRD line = Rework + feedback บังคับ + gen Batch run ถัดไป** (rework เฉพาะ line ที่เสีย) + noti Production. Lot ขาเข้า ผ่าน → "พร้อมใช้ผลิต" (+อาจปิด PR); ไม่ผ่าน → "ระงับ" → ทำใบคืน supplier. เห็น GMP chain Lot→Batch→PO + ประวัติ run. **★ QC record มีช่องหมายเหตุ (comment) ทั่วไปเพิ่มแยกจาก feedback ตัดสิน** — แก้ในที่ + เก็บประวัติครบ ตามกติกากลาง G6.

---

## 1. Purpose
เป็นจุดควบคุมคุณภาพเดียวของระบบ: ปล่อย/ตีกลับงานผลิตราย Batch line และตรวจรับวัตถุดิบขาเข้าราย Lot — เพื่อให้เฉพาะของที่ผ่านคุณภาพเดินต่อ พร้อม trace GMP ครบ.

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `qc.html` | แท็บ **ตรวจรับ Lot ขาเข้า** + แท็บ **ตรวจ Batch** (ผ่าน/ไม่ผ่าน+feedback) + GMP chain + ประวัติ run · **+ ช่อง comment (หมายเหตุ) + ประวัติการแก้ไข บน QC record (G6)** |

## 3. Fields
| ฟิลด์ | ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| Batch id `B-{PO}-{line}-{run}` | string | computed | run ใหม่เมื่อ rework |
| ผลตัดสิน Batch | enum {ผ่าน, ไม่ผ่าน} | editable (Approve) | ราย line |
| feedback | text | editable | **บังคับเมื่อไม่ผ่าน** — ผล/เหตุตัดสิน QC (ฟิลด์เดิม) |
| Lot id | string | computed | ขาเข้า |
| ผลตรวจรับ Lot | enum {ผ่าน, ไม่ผ่าน} | editable (Approve) | |
| **comment (หมายเหตุ)** | text | editable | **ช่องเดียว, แก้ในที่ (overwrite), ว่างได้ (optional)** บน QC record (Batch line / Lot) · เก็บประวัติการแก้ครบ (ใคร/เมื่อ/เดิม→ใหม่) ผ่าน field-audit เดิม · **แยกจาก "feedback" (บังคับเมื่อไม่ผ่าน)** · ตามกติกากลาง **`comment-convention.md` (G6/CC1–CC7)** |
| GMP chain | view Lot→Batch→PO | computed | recall |

## 4. Statuses / lifecycle (entity-status-map §1.5/§1.6)
- **Batch QC:** ผ่าน → PRD line "พร้อมส่งมอบ" · ไม่ผ่าน → PRD line "Rework" + gen run ถัดไป (feedback บังคับ).
- **Lot QC ขาเข้า:** รอตรวจรับ → ผ่าน "พร้อมใช้ผลิต" (+อาจปิด PR) · ไม่ผ่าน "ระงับ" → คืนของ (`return.md`).

### 4b. ★ Comment field (G6 — ตามกติกากลาง)
- QC record (ทั้ง Batch line และ Lot record) มี **ช่องหมายเหตุ (comment) เดียว** แบบ free-text — **แยกจาก "feedback"** ที่บังคับกรอกเมื่อตัดสิน "ไม่ผ่าน". comment = บันทึกทั่วไปเพิ่มเติม (optional; เช่น หมายเหตุการตรวจ, ข้อสังเกตที่ไม่ใช่เหตุตัดสิน).
- **แก้ในที่ (overwrite)** เห็นค่าปัจจุบันค่าเดียว · **เก็บประวัติครบทุกครั้ง** (ใคร/เมื่อ/ค่าเดิม→ค่าใหม่) ผ่าน field-audit เดิม (entity=QC record, field=`comment`).
- ดูประวัติได้ inline บนหน้า QC (**"ประวัติการแก้ไข comment"** popover/timeline, 20/หน้า G1) · ค่าปัจจุบันแสดงเด่นบน record · การแก้ = activity-log event + โผล่บน trace/GMP chain.
- รายละเอียดกติกายึด `comment-convention.md` (CC1–CC7) — module นี้ไม่ทำสำเนากฎ.

## 5. User Stories (absorbed) + AC สรุป
- **US-QC-01 (Must) — ตรวจ Batch (ผ่าน):** B-PO-…-176-1-1 รอ QC → "✓ ผ่าน" → Batch=ผ่าน; PRD line=พร้อมส่งมอบ; ถ้าทุก PRD ของ PO ผ่าน → PO=พร้อมจัดส่ง + noti Shipping (C5). **Edge:** PO 2 line ผ่านแค่ line 1 → PO ยังไม่พร้อมจัดส่ง (แสดง "ผ่าน 1/2"). **Error:** ตัดสิน Batch ที่ไม่อยู่คิว (ไม่ใช่รอ QC) → error "รายการไม่พร้อมตรวจ".
- **US-QC-02 (Must) — ตรวจ Batch (ไม่ผ่าน → Rework):** B-PO-…-181-2-1 (โฟม) → "✕ ไม่ผ่าน" + feedback "เนื้อโฟมเป็นก้อน ปั๊มไม่ออก" → Batch=ไม่ผ่าน; PRD line 2=Rework; noti Production; trace เก็บ feedback (C6). **Edge:** เห็นประวัติ run1 ไม่ผ่าน + feedback เดิม เมื่อเปิด run2. **Error:** ไม่ผ่านโดย feedback ว่าง → ไม่บันทึก + error "ต้องระบุ feedback".
- **US-QC-03 (Should) — ตรวจรับ Lot ขาเข้า:** Lot L-GLY-2607 รอตรวจรับ → "ผ่าน" → Lot=พร้อมใช้ผลิต; ถ้าอ้าง PR อาจปิด PR; noti Stock (C18). **Edge:** ไม่ผ่าน → Lot=ระงับ → เปิดใบคืน supplier (`return.md`). **Error:** ตัดสิน Lot ที่ผ่านแล้ว → ไม่อยู่คิว / error "Lot นี้ตรวจรับแล้ว".
- **US-QC-04 (Should) — comment + ประวัติ (G6):** ผู้ใช้ (QC.Update) เพิ่ม/แก้ **comment** บน QC record (Batch line/Lot) → บันทึก old→new + ใคร/เมื่อ ผ่าน field-audit; เปิด "ประวัติการแก้ไข comment" เห็นทุกครั้งที่แก้; comment โผล่บน trace/GMP chain. **Edge:** แก้ comment ให้ว่าง → ค่าเดิมยังอยู่ในประวัติ (ไม่ลบ) · comment คนละฟิลด์กับ feedback (feedback บังคับเมื่อไม่ผ่านยังคงเดิม). **Error:** ผู้ใช้สิทธิ์ Read อย่างเดียว → แก้ comment ไม่ได้. ยึด `comment-convention.md`.

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ดูคิว QC / GMP chain / ประวัติ | QC.**Read (R)** |
| ตัดสิน Batch (ผ่าน/ไม่ผ่าน+feedback) | QC.**Approve (A)** (บาง config = Update) — ตัดสิน = สิทธิ์ระดับ approve ของ QC |
| ตัดสินรับ Lot ขาเข้า (ผ่าน/ไม่ผ่าน) | QC.**Approve (A)** |
| **แก้ comment (หมายเหตุ) บน QC record (G6)** | QC.**Update (U)** · ดู/เปิดประวัติ = **Read (R)** |
> ตัดสินได้ที่หน้า QC เท่านั้น (หน้าผลิตไม่มีปุ่มตัดสิน).

## 7. Validations
- ไม่ผ่าน = **feedback บังคับ**.
- ตัดสินได้เฉพาะรายการในคิว (รอ QC / รอตรวจรับ); ตัดสินซ้ำของที่ผ่านแล้วไม่ได้.
- rework = gen Batch run ใหม่ เฉพาะ line ที่ไม่ผ่าน.
- **comment (หมายเหตุ) = optional** (ว่างได้) · การแก้ทุกครั้งถูก audit (G6/CC3) · แก้ได้ทุกสถานะของ QC record (CC default; comment ไม่กระทบผลตัดสิน).

## 8. Pagination / Search
- คิว QC + ประวัติ run: 20/หน้า (G1) · ค้นเลข Batch/PRD/Lot · filter ผ่าน/ไม่ผ่าน/ช่วงวันที่ (G2).

## 9. Formulas
- PO/SO พร้อมจัดส่ง = ทุก PRD line ของ order มีสถานะ "พร้อมส่งมอบ" (ผ่าน QC ครบ).

## 10. Cross-links
- ผ่าน → order พร้อมจัดส่ง (`po.md`/`so.md`, C5). ไม่ผ่าน → Rework (`production.md`, C6). Lot ขาเข้า (C18) → `goods-receipt.md`/`return.md`. GMP chain + comment audit → `traceability.md` · **comment field → `comment-convention.md` (G6)**.

## 11. Module changelog
- **★ NEW (2026-07-29 — ปอนด์เคาะตัวเลือก A, comment cross-cutting):** เพิ่ม **ช่อง comment (หมายเหตุ) + ประวัติการแก้ไข** บน QC record ตามกติกากลาง G6/`comment-convention.md` — **แยกจาก "feedback" (บังคับเมื่อไม่ผ่าน)** เดิม. เพิ่ม field (§3), §4b, US-QC-04 (§5), permission row (§6), validation (§7). QC record เข้า object list ของ comment-convention (10→12).
- **Absorbed:** functional-spec `qc.html` US-QC-01..03 (9 AC) verbatim ในความหมาย.
- **คงเดิม:** ตัดสินที่หน้า QC เท่านั้น · per-line Batch · feedback บังคับ · rework เฉพาะ line เสีย · Lot ไม่ผ่าน→คืน.
