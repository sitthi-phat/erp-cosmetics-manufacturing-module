# Module — Goods Receipt (GR — รับเข้าวัตถุดิบ)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE SPEC** (absorbs GR-specific parts of functional-spec `stock.html` US-STK-02/US-STK-03 + PR auto-close)
Mockups: `mockups/goods-receipt.html` (+ `mockups/stock.html` for balances)
กฎอ้างอิง: `stock.md` (3 ยอด, ledger D15) · entity-status-map §1.6 (negative on_hand, FIFO retro-link) · `pr.md` (auto-close/partial) · `return.md` (RM return link) · README §3 · **`comment-convention.md` (comment + change-history)**

## สรุปภาษาไทย
รับเข้าวัตถุดิบ (RM) แบบ **multi-line ต่อ 1 supplier ต่อใบ** → gen Lot รายบรรทัด (สถานะ "รอตรวจรับ") → **บวก on_hand/Available (ไม่แตะ Reserved)** + `GR (+)` ledger. อ้าง PR ได้: รับครบ → **PR "ของเข้าครบ" อัตโนมัติ**; รับบางส่วน → **PR "รับบางส่วน" + เสนอสร้าง PR ใหม่ส่วนที่ขาด (รอ user review)**. รองรับ **ชดเชยยอดติดลบ**: ถ้า on_hand ติดลบจากผลิตล่วงหน้า → GR บวกกลับ + **back-allocate การตัดที่ติดลบเข้า lot ใหม่แบบ FIFO** (คง Batch↔Lot GMP) + notice ก่อนยืนยัน. เลข Lot `{supplier prefix}{YYMM}` · GR `GR-{YYYYMMDD}-{NNN}`. RM ที่ตรวจเจอเสีย/QC ไม่ผ่าน → ลิงก์ไปทำใบคืน (`return.md`). **★ มีช่องหมายเหตุ (comment) แก้ในที่ + เก็บประวัติการแก้ครบ (comment-convention.md).**

---

## 1. Purpose
บันทึกการรับวัตถุดิบเข้าคลังให้เป็นความจริงของ stock + Lot + PR + ledger: gen Lot, ปิด/แตก PR อัตโนมัติ, ชดเชยยอดติดลบด้วย FIFO retro-link, และเป็นต้นทางของ traceability (Lot).

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `goods-receipt.html` | รับเข้า multi-line: supplier→auto lot prefix, จำนวน, ราคาซื้อ, เลขใบรับจาก supplier, upload, อ้าง PR + **ช่อง comment (+ "ประวัติการแก้ไข comment")** |
| `stock.html` (RM tab) | ผลลัพธ์: on_hand/Available เพิ่ม + Lot ใหม่ + ledger `GR (+)` (ดู `stock.md`) |

## 3. Fields
| ฟิลด์ | หน่วย/ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| เลข GR `GR-{YYYYMMDD}-{NNN}` | string | computed | gapless |
| supplier | ref supplier | editable | 1 supplier ต่อ GR (header) · กำหนด lot prefix |
| เลขใบรับจาก supplier | text | editable | **บังคับ** |
| line items | list {วัตถุดิบ, จำนวน, ราคาซื้อ, อ้าง PR?} | editable | multi-line |
| ราคาซื้อ/หน่วย | THB | editable | 0 ได้, ติดลบไม่ได้ |
| Lot ที่ gen | `{supplier prefix}{YYMM}` | computed | 1 Lot ต่อ line · สถานะเริ่ม "รอตรวจรับ" |
| แนบไฟล์ | file | editable (optional) | หลักฐานรับเข้า |
| **★ หมายเหตุ (comment)** | free-text (ช่องเดียว) | **editable (แก้ในที่/overwrite)** | **แก้ทุกครั้งเก็บประวัติ ใคร/เมื่อ/เดิม→ใหม่ + โผล่ trace — `comment-convention.md` (CC1–CC7)** · ต่อ GR (header) |

## 4. Statuses / lifecycle
- **Lot (ผลลัพธ์):** รอตรวจรับ → พร้อมใช้ผลิต (QC ผ่าน) / ระงับ (QC ไม่ผ่าน → `return.md`) / หมด (entity-status-map §1.6).
- **GR:** บันทึกแล้ว = final (เอกสารการค้า — void เท่านั้น, ไม่ hard delete).
- **PR ที่อ้าง:** รับครบ → "ของเข้าครบ (Fulfilled)" auto · รับบางส่วน → "รับบางส่วน" + เสนอ PR ใหม่ (`pr.md`).
> **★ comment แก้ได้แม้ GR final/void** (metadata — comment-convention.md §3).

## 4b. ★ Comment + change-history (ยึด `comment-convention.md`)
- **1 ช่อง comment free-text ต่อ GR** (header) · แก้ในที่ (overwrite) จาก goods-receipt.
- ทุกครั้งที่แก้ → เก็บ **ใคร/เมื่อ/ค่าเดิม→ค่าใหม่** ผ่าน field-audit เดิม; goods-receipt แสดง **ค่าปัจจุบัน + affordance "ประวัติการแก้ไข comment"**.
- การแก้ = activity-log event + **โผล่บน trace** (entity=GR, field=`comment`) — ต่อจากสาย Lot GMP เดิม. กติกาเต็ม = `comment-convention.md` (CC1–CC7).

## 5. User Stories (absorbed) + AC สรุป
- **GR multi-line + ปิด PR อัตโนมัติ (Must, จาก US-STK-02):** GR ของ SUP-01 อ้าง PR-000031 (กลีเซอรีน 6 กก.) → gen Lot `L-GLY-2607` (รอตรวจรับ); on_hand เพิ่ม → **Available เพิ่มอัตโนมัติ (ไม่แตะ Reserved)**; PR-000031 → "ของเข้าครบ" auto (continuity C17). **Edge:** รับ 200/250 ล. อ้าง PR-000028 → PR "รับบางส่วน" + กล่องยืนยัน "สร้าง PR ใหม่ 50 ล.?" **รอ user review** (ยังไม่สร้างจนกด). **Error:** เว้น supplier/เลขใบรับ → error ที่ field ที่ขาด, ไม่บันทึก/ไม่ gen Lot.
- **ชดเชยยอดติดลบ + FIFO retro-link (Must, จาก US-STK-03 edge):** on_hand กลีเซอรีน = −4 กก. (ผลิตล่วงหน้า) แล้วรับ 6 กก. → ก่อนยืนยันแสดง notice "การรับนี้ชดเชยยอดติดลบ 4 หน่วย"; หลังรับ on_hand = +2; ระบบ **back-allocate การตัดที่ติดลบเข้า lot ใหม่แบบ FIFO** (คง Batch↔Lot GMP) + trace.
- **ราคาซื้อ (จาก US-STK-03 error / US-STK-04):** ราคาซื้อ 0 ได้ แต่ติดลบ → error "ราคาต้อง ≥ 0".

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ดู GR / list + **ดูประวัติ comment** | Warehouse/Stock.**Read (R)** |
| สร้าง GR (รับเข้า) | Warehouse/Stock.**Create (C)** |
| **แก้ไข comment (แก้ในที่)** | Warehouse/Stock.**Update (U)** (เก็บประวัติ auto — comment-convention.md) |
| void GR | Warehouse/Stock.**Delete (D)** + เหตุผล |
| ทำใบคืน (RM เสีย) | ไปที่ `return.md` (Stock.**Update** + เหตุผล) |
> ไม่มีฟังก์ชันรับเข้าในหน้า Supplier — อยู่ที่นี่เท่านั้น.

## 7. Validations
- supplier + เลขใบรับจาก supplier + ≥1 line = บังคับ.
- ราคาซื้อ ≥ 0 (0 ได้).
- อ้าง PR: วัตถุดิบใน line ต้องตรงกับ PR ที่อ้าง (มิฉะนั้น error "วัตถุดิบไม่ตรงกับคำขอ" — ไม่ปิด PR, ดู `pr.md`).
- รับเกิน/ครบ/บางส่วน คำนวณเทียบยอด PR → ตั้งสถานะ PR อัตโนมัติ.
- **★ comment (หมายเหตุทั่วไป) = ไม่บังคับ** · ทุกการแก้ถูก audit (comment-convention.md CC2/CC3).

## 8. Pagination / Search
- GR list: 20/หน้า (G1) · ค้นเลข GR / supplier / วัตถุดิบ / ช่วงวันที่ (G2).

## 9. Formulas
- Available หลัง GR = `on_hand(+GR qty) − Reserved` (Reserved ไม่เปลี่ยน).
- ชดเชยติดลบ: ถ้า `on_hand < 0` ก่อนรับ → หลังรับ = `on_hand + GR qty`; ส่วนที่เคยตัดติดลบถูก back-allocate เข้า lot ใหม่ตาม FIFO.

## 10. Cross-links
- ผลลัพธ์ยอด/ledger → `stock.md` (§5/§6, `GR (+)`). PR auto-close/partial → `pr.md`. Lot QC → `qc.md`. RM เสีย → `return.md`. negative/retro-link → entity-status-map §1.6.
- **Comment + change-history → `comment-convention.md` · field-audit → `traceability.md` §4.**

## 11. Module changelog
- **Absorbed:** GR-specific requirements จาก `stock.html` US-STK-02 (GR multi-line + PR auto-close) + US-STK-03 (negative compensation + FIFO retro-link) → รวมเป็น module GR เดี่ยวตาม module list ของปอนด์ (stock.md ยังถือเรื่องยอด/ledger).
- **★ เพิ่ม (2026-07-29 — comment cross-cutting feedback, PO module 3 review):** ช่อง **หมายเหตุ (comment)** แบบแก้ในที่ + **เก็บประวัติการแก้ครบ** ต่อ GR (header) — ยึด `comment-convention.md` (§3 field, §4b, §6 permission).
- **คงเดิม:** 1 supplier/ใบ, gen Lot รายบรรทัด, PR partial→new PR รอ review, ราคาซื้อ ≥0.
