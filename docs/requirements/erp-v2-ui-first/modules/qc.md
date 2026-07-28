# Module — QC (ควบคุมคุณภาพ)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE SPEC** (absorbs functional-spec `qc.html` US-QC-01..03)
Mockups: `mockups/qc.html`
กฎอ้างอิง: entity-status-map §1.5/§1.6 (Batch/Lot QC) · `production.md` (Rework run gen) · `return.md` (Lot ไม่ผ่าน→คืน) · `goods-receipt.md`/`pr.md` (Lot ผ่าน→อาจปิด PR) · README §3

## สรุปภาษาไทย
QC มี 2 งาน: **ตรวจ Batch การผลิต** (ตัดสินราย line: ✓ ผ่าน / ✕ ไม่ผ่าน) และ **ตรวจรับ Lot วัตถุดิบขาเข้า**. **การตัดสิน QC ทำที่หน้านี้เท่านั้น** (หน้าผลิตไม่มีปุ่มตัดสิน). Batch ผ่าน → PRD line "พร้อมส่งมอบ"; ทุก PRD ของ PO/SO ผ่าน → order "พร้อมจัดส่ง" + noti Shipping. Batch ไม่ผ่าน → **PRD line = Rework + feedback บังคับ + gen Batch run ถัดไป** (rework เฉพาะ line ที่เสีย) + noti Production. Lot ขาเข้า ผ่าน → "พร้อมใช้ผลิต" (+อาจปิด PR); ไม่ผ่าน → "ระงับ" → ทำใบคืน supplier. เห็น GMP chain Lot→Batch→PO + ประวัติ run.

---

## 1. Purpose
เป็นจุดควบคุมคุณภาพเดียวของระบบ: ปล่อย/ตีกลับงานผลิตราย Batch line และตรวจรับวัตถุดิบขาเข้าราย Lot — เพื่อให้เฉพาะของที่ผ่านคุณภาพเดินต่อ พร้อม trace GMP ครบ.

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `qc.html` | แท็บ **ตรวจรับ Lot ขาเข้า** + แท็บ **ตรวจ Batch** (ผ่าน/ไม่ผ่าน+feedback) + GMP chain + ประวัติ run |

## 3. Fields
| ฟิลด์ | ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| Batch id `B-{PO}-{line}-{run}` | string | computed | run ใหม่เมื่อ rework |
| ผลตัดสิน Batch | enum {ผ่าน, ไม่ผ่าน} | editable (Approve) | ราย line |
| feedback | text | editable | **บังคับเมื่อไม่ผ่าน** |
| Lot id | string | computed | ขาเข้า |
| ผลตรวจรับ Lot | enum {ผ่าน, ไม่ผ่าน} | editable (Approve) | |
| GMP chain | view Lot→Batch→PO | computed | recall |

## 4. Statuses / lifecycle (entity-status-map §1.5/§1.6)
- **Batch QC:** ผ่าน → PRD line "พร้อมส่งมอบ" · ไม่ผ่าน → PRD line "Rework" + gen run ถัดไป (feedback บังคับ).
- **Lot QC ขาเข้า:** รอตรวจรับ → ผ่าน "พร้อมใช้ผลิต" (+อาจปิด PR) · ไม่ผ่าน "ระงับ" → คืนของ (`return.md`).

## 5. User Stories (absorbed) + AC สรุป
- **US-QC-01 (Must) — ตรวจ Batch (ผ่าน):** B-PO-…-176-1-1 รอ QC → "✓ ผ่าน" → Batch=ผ่าน; PRD line=พร้อมส่งมอบ; ถ้าทุก PRD ของ PO ผ่าน → PO=พร้อมจัดส่ง + noti Shipping (C5). **Edge:** PO 2 line ผ่านแค่ line 1 → PO ยังไม่พร้อมจัดส่ง (แสดง "ผ่าน 1/2"). **Error:** ตัดสิน Batch ที่ไม่อยู่คิว (ไม่ใช่รอ QC) → error "รายการไม่พร้อมตรวจ".
- **US-QC-02 (Must) — ตรวจ Batch (ไม่ผ่าน → Rework):** B-PO-…-181-2-1 (โฟม) → "✕ ไม่ผ่าน" + feedback "เนื้อโฟมเป็นก้อน ปั๊มไม่ออก" → Batch=ไม่ผ่าน; PRD line 2=Rework; noti Production; trace เก็บ feedback (C6). **Edge:** เห็นประวัติ run1 ไม่ผ่าน + feedback เดิม เมื่อเปิด run2. **Error:** ไม่ผ่านโดย feedback ว่าง → ไม่บันทึก + error "ต้องระบุ feedback".
- **US-QC-03 (Should) — ตรวจรับ Lot ขาเข้า:** Lot L-GLY-2607 รอตรวจรับ → "ผ่าน" → Lot=พร้อมใช้ผลิต; ถ้าอ้าง PR อาจปิด PR; noti Stock (C18). **Edge:** ไม่ผ่าน → Lot=ระงับ → เปิดใบคืน supplier (`return.md`). **Error:** ตัดสิน Lot ที่ผ่านแล้ว → ไม่อยู่คิว / error "Lot นี้ตรวจรับแล้ว".

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ดูคิว QC / GMP chain / ประวัติ | QC.**Read (R)** |
| ตัดสิน Batch (ผ่าน/ไม่ผ่าน+feedback) | QC.**Approve (A)** (บาง config = Update) — ตัดสิน = สิทธิ์ระดับ approve ของ QC |
| ตัดสินรับ Lot ขาเข้า (ผ่าน/ไม่ผ่าน) | QC.**Approve (A)** |
> ตัดสินได้ที่หน้า QC เท่านั้น (หน้าผลิตไม่มีปุ่มตัดสิน).

## 7. Validations
- ไม่ผ่าน = **feedback บังคับ**.
- ตัดสินได้เฉพาะรายการในคิว (รอ QC / รอตรวจรับ); ตัดสินซ้ำของที่ผ่านแล้วไม่ได้.
- rework = gen Batch run ใหม่ เฉพาะ line ที่ไม่ผ่าน.

## 8. Pagination / Search
- คิว QC + ประวัติ run: 20/หน้า (G1) · ค้นเลข Batch/PRD/Lot · filter ผ่าน/ไม่ผ่าน/ช่วงวันที่ (G2).

## 9. Formulas
- PO/SO พร้อมจัดส่ง = ทุก PRD line ของ order มีสถานะ "พร้อมส่งมอบ" (ผ่าน QC ครบ).

## 10. Cross-links
- ผ่าน → order พร้อมจัดส่ง (`po.md`/`so.md`, C5). ไม่ผ่าน → Rework (`production.md`, C6). Lot ขาเข้า (C18) → `goods-receipt.md`/`return.md`. GMP chain → `traceability.md`.

## 11. Module changelog
- **Absorbed:** functional-spec `qc.html` US-QC-01..03 (9 AC) verbatim ในความหมาย.
- **คงเดิม:** ตัดสินที่หน้า QC เท่านั้น · per-line Batch · feedback บังคับ · rework เฉพาะ line เสีย · Lot ไม่ผ่าน→คืน.
