# Module — Goods Receipt (GR — รับเข้าวัตถุดิบ)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE SPEC** (absorbs GR-specific parts of functional-spec `stock.html` US-STK-02/US-STK-03 + PR auto-close)
Mockups: `mockups/goods-receipt.html` (+ `mockups/stock.html` for balances + GR (RM) tab)
กฎอ้างอิง: `stock.md` (3 ยอด, ledger D15, **RM master §3b**, **"Good Receipt (RM)" tab §2b**) · entity-status-map §1.6 (negative on_hand, FIFO retro-link) / **§1.8 (GR object lifecycle · QC-gated stock-in)** · **`qc.md` §4.1 (ตรวจรับ RM = gate เข้าสต็อก · ผ่าน→credit · ไม่ผ่าน→ระงับ)** · `pr.md` (auto-close/partial) · `return.md` (RM return link) · README §3 (**G8**) · **`comment-convention.md` (comment + change-history)** · **`numbering-on-save.md` (G8 — เลข GR + Lot ออกตอนบันทึก, NS7)**

## สรุปภาษาไทย
รับเข้าวัตถุดิบ (RM) แบบ **multi-line ต่อ 1 supplier ต่อใบ** → gen **GR object (`GR-…`) + Lot รายบรรทัด สถานะ "รอตรวจ (QC ตรวจสอบ)"**. **★ RM ยังไม่เข้าสต็อกทันที** — การรับเข้า **ไม่ credit on_hand ตอนบันทึก GR** (ต่างจากเดิม) → **credit เกิดตอน QC ตรวจรับ "ผ่าน"** (ผ่าน → บวก on_hand ของ Lot + `GR (+)` ledger + **ชดเชยยอดติดลบ + FIFO retro-link ตอนนี้** · ไม่ผ่าน → ไม่เข้าสต็อก, Lot ระงับ). **★ เลข GR + เลข Lot ไม่โชว์ล่วงหน้าบนหน้ารับเข้า (แสดง "(ระบบออกให้เมื่อบันทึก)") → ออก gapless ตอนบันทึกสำเร็จ + popup ยืนยันแสดง "เลข GR + ทุก Lot ที่ gen + สรุป (supplier/จำนวน line)" (G8 · `numbering-on-save.md` NS7)** พร้อมย้ำ "ยังไม่เข้าสต็อก รอ QC ตรวจรับ". **วัตถุดิบใน line = อ้าง RM master ที่สร้างไว้แล้ว** (สร้าง/ตั้งรหัส unique ที่แท็บ RM ของ `stock.md` §3b — GR ไม่สร้าง RM ใหม่). **★ GR object มี lifecycle: QC ตรวจสอบ → ผ่าน / ไม่ผ่าน / ยกเลิก** — **ไม่ผ่าน → ส่งกลับ QC (re-submit) หรือ ยกเลิก GR**; warehouse เห็น/จัดการ GR ทุกใบ (รวมที่ไม่ผ่าน) ที่ **แท็บ "Good Receipt (RM)" ของ stock** (`stock.md` §2b). อ้าง PR ได้: รับครบ (ผ่านครบ) → **PR "ของเข้าครบ" อัตโนมัติ**; รับบางส่วน → **PR "รับบางส่วน" + เสนอสร้าง PR ใหม่ส่วนที่ขาด (รอ user review)**. เลข Lot `{supplier prefix}{YYMM}` · GR `GR-{YYYYMMDD}-{NNN}`. RM ที่ตรวจเจอเสีย/QC ไม่ผ่าน → ลิงก์ไปทำใบคืน (`return.md`). **★ มีช่องหมายเหตุ (comment) แก้ในที่ + เก็บประวัติการแก้ครบ (comment-convention.md).**

---

## 1. Purpose
บันทึกการรับวัตถุดิบเข้าคลังเป็น **GR object + Lot (สถานะรอตรวจ)** แล้ว **ให้ QC เป็น gate ของการเข้าสต็อก** — QC ผ่านจึง credit on_hand + gen movement + ชดเชยติดลบด้วย FIFO retro-link; QC ไม่ผ่านของไม่เข้าสต็อก. ยัง gen Lot, ปิด/แตก PR (เมื่อผ่าน), และเป็นต้นทางของ traceability (Lot). **อ้าง RM master ที่มีอยู่** (RM ถูกสร้าง + ตั้งรหัส unique ที่แท็บ RM ของ `stock.md` §3b — ถ้ายังไม่มี RM ให้ไปสร้างก่อน).

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `goods-receipt.html` | รับเข้า multi-line: supplier→auto lot prefix, จำนวน, ราคาซื้อ, เลขใบรับจาก supplier, upload, อ้าง PR + **ช่อง comment (+ "ประวัติการแก้ไข comment")** · **★ ช่องเลข GR/Lot = "(ระบบออกให้เมื่อบันทึก)" (G8)** · **★ บันทึกแล้ว → gen GR object (สถานะ "QC ตรวจสอบ") + Lot รอตรวจ (ยังไม่ credit สต็อก) + popup เลข GR+Lot (NS7)** |
| `qc.html` แท็บ **ตรวจรับวัตถุดิบ** | QC บันทึกผล **ผ่าน/ไม่ผ่าน** ราย Lot (per GR line) — **ผ่าน = credit stock (gate)** (`qc.md` §4.1) |
| `stock.html` แท็บ **Good Receipt (RM)** | warehouse เห็น GR ทุกใบ + สถานะ (ผ่าน/ไม่ผ่าน/QC ตรวจสอบ/ยกเลิก) + **action ส่งกลับ QC / ยกเลิก** (`stock.md` §2b) |
| `stock.html` (RM tab) | ผลลัพธ์ (เมื่อ QC ผ่าน): on_hand/Available เพิ่ม + Lot พร้อมใช้ + ledger `GR (+)` (ดู `stock.md`) · **แหล่งสร้าง RM master (รหัส unique)** |

## 3. Fields
| ฟิลด์ | หน่วย/ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| เลข GR `GR-{YYYYMMDD}-{NNN}` | string | computed | gapless · **★ ไม่โชว์บนหน้ารับเข้า (แสดง "(ระบบออกให้เมื่อบันทึก)") → ออกตอนบันทึกสำเร็จ + popup (G8)** |
| supplier | ref supplier | editable | 1 supplier ต่อ GR (header) · กำหนด lot prefix |
| เลขใบรับจาก supplier | text | editable | **บังคับ** |
| line items | list {วัตถุดิบ, จำนวน, ราคาซื้อ, อ้าง PR?} | editable | multi-line |
| วัตถุดิบ (ต่อ line) | ref RM master | editable | **อ้าง RM ที่มีอยู่** (search dropdown ค้นชื่อ+รหัส) · สร้าง/ตั้งรหัส unique ที่ `stock.md` §3b |
| ราคาซื้อ/หน่วย | THB | editable | 0 ได้, ติดลบไม่ได้ |
| Lot ที่ gen | `{supplier prefix}{YYMM}` | computed | 1 Lot ต่อ line · **★ ออกเลขตอนบันทึกสำเร็จพร้อม GR (G8/NS7)** · **สถานะเริ่ม "รอตรวจ (QC ตรวจสอบ)" · ยังไม่ credit on_hand** |
| **★ สถานะ GR object** | enum {QC ตรวจสอบ, ผ่าน, ไม่ผ่าน, ยกเลิก} | computed (roll-up จากผล Lot) / editable ผ่าน action | ดู §4 |
| แนบไฟล์ | file | editable (optional) | หลักฐานรับเข้า |
| **★ หมายเหตุ (comment)** | free-text (ช่องเดียว) | **editable (แก้ในที่/overwrite)** | **แก้ทุกครั้งเก็บประวัติ ใคร/เมื่อ/เดิม→ใหม่ + โผล่ trace — `comment-convention.md` (CC1–CC7)** · ต่อ GR (header) |

## 4. Statuses / lifecycle — ★ GR object + Lot (QC-gated stock-in)
### 4.1 Lot (ผลลัพธ์ราย line)
- **Lot:** รอตรวจ (QC ตรวจสอบ) → **พร้อมใช้ผลิต (QC ผ่าน → ★ credit on_hand ตอนนี้)** / **ระงับ (QC ไม่ผ่าน → ไม่ credit → `return.md`)** / หมด (entity-status-map §1.6/§1.8).

### 4.2 ★ GR object lifecycle (ปอนด์สั่ง 2026-07-29)
| สถานะ GR | เกิดตอน / ผล | action ที่มี |
|---|---|---|
| **QC ตรวจสอบ (Under QC)** | บันทึก GR แล้ว (★ ออกเลข GR+Lot ตอนนี้ G8) — Lot ราย line = รอตรวจ · **ยังไม่ credit on_hand** | (รอ QC ตัดสินที่ `qc.md`) · ยกเลิก |
| **ผ่าน (Passed)** | ทุก Lot (ราย line) QC ผ่าน → **credit on_hand ครบ + FIFO retro-link + `GR (+)` ledger** (§9) · อาจปิด PR | (final; เอาของออกใช้ Return/Loss — §4.4) |
| **ไม่ผ่าน (Failed)** | ≥1 Lot QC ไม่ผ่าน (และไม่มี Lot ค้างตรวจ) → **ส่วนที่ไม่ผ่านไม่เข้าสต็อก, Lot ระงับ** | **ส่งกลับ QC (re-submit)** · **ยกเลิก GR** · ทำใบคืน (`return.md`) |
| **ยกเลิก (Cancelled)** | warehouse ยกเลิก GR (บังคับเหตุผล) | — (void, gapless — เลข GR คงอยู่ G8/NS5; comment ยังแก้ได้) |
> **★ roll-up:** QC ราย Lot (per line) = ความจริง granular; GR = roll-up label สำหรับ filter/มุมมอง warehouse. กรณี **partial (บาง line ผ่าน บาง line ไม่ผ่าน):** line ที่ผ่าน credit เข้าสต็อกแล้ว (Lot พร้อมใช้), line ที่ไม่ผ่านระงับ; GR อยู่ bucket **"ไม่ผ่าน"** พร้อม breakdown ราย line — ส่งกลับ QC/ยกเลิก/คืน ทำได้ราย line ที่ไม่ผ่าน.

### 4.3 ★ Action: ส่งกลับ QC (re-submit) / ยกเลิก
- **ส่งกลับ QC (re-submit):** จาก GR **ไม่ผ่าน** → ตั้ง Lot ที่ไม่ผ่านกลับ "รอตรวจ" + GR กลับ "QC ตรวจสอบ" (ให้ QC ตรวจใหม่ เช่น หลังเจรจา/คัดแยกของ). audit ทุกครั้ง.
- **ยกเลิก (Cancel) GR:** ยกเลิกได้ **เฉพาะสถานะ "QC ตรวจสอบ" หรือ "ไม่ผ่าน"** (ยังไม่ credit สต็อก/หรือส่วนที่ไม่ผ่าน) → GR = ยกเลิก (บังคับเหตุผล, gapless, void). **★ PO reasonable decision (settled):** เพราะ credit ถูก gate ที่ QC pass — GR ที่ยกเลิกได้จึง **ยังไม่เคย credit สต็อก → การยกเลิกไม่ต้อง reverse ยอดใด ๆ** และ **ไม่กระทบยอดติดลบ** (ยอดติดลบยังคงอยู่จนกว่าจะมี GR/Lot ที่ผ่านมาชดเชย). **ถ้า GR ผ่านแล้ว (credit + retro-link แล้ว) และต้องการเอาของออก → ใช้ "คืนของ (Return)" หรือ "Loss" แทน** (คง ledger + GMP genealogy) — ไม่ใช่ยกเลิก GR. *(ปอนด์ override ได้ ถ้าต้องการให้ยกเลิกหลังผ่านแบบ reverse credit — ดู §9 note.)*

### 4.4 GR / PR
- **GR:** เมื่อผ่าน = เอกสารการค้า final (void/ยกเลิกตามกติกา, ไม่ hard delete).
- **PR ที่อ้าง:** **รับครบ (QC ผ่านครบ) → "ของเข้าครบ (Fulfilled)" auto** · รับ/ผ่านบางส่วน → "รับบางส่วน" + เสนอ PR ใหม่ (`pr.md`).
> **★ comment แก้ได้ทุกสถานะ GR** (metadata — comment-convention.md §3).

## 4b. ★ Comment + change-history (ยึด `comment-convention.md`)
- **1 ช่อง comment free-text ต่อ GR** (header) · แก้ในที่ (overwrite) จาก goods-receipt.
- ทุกครั้งที่แก้ → เก็บ **ใคร/เมื่อ/ค่าเดิม→ค่าใหม่** ผ่าน field-audit เดิม; goods-receipt แสดง **ค่าปัจจุบัน + affordance "ประวัติการแก้ไข comment"**.
- การแก้ = activity-log event + **โผล่บน trace** (entity=GR, field=`comment`) — ต่อจากสาย Lot GMP เดิม. กติกาเต็ม = `comment-convention.md` (CC1–CC7).

## 5. ★ Create flow + User Stories (absorbed) + AC สรุป
### 5.0 Create flow (delta — G8)
1. กรอก supplier (→ auto lot prefix) + เลขใบรับจาก supplier + line วัตถุดิบ (อ้าง RM master) + จำนวน/ราคา + อ้าง PR (optional) + comment. **★ ช่องเลข GR/Lot = read-only "(ระบบออกให้เมื่อบันทึก)" (G8/NS1).**
2. กด **บันทึกรับเข้า** → **★ ออกเลข GR gapless + ทุก Lot ราย line ตอนบันทึกสำเร็จ (G8/NS2, NS7) → popup ยืนยันแสดง "เลข GR + ทุก Lot ที่ gen + สรุป (supplier/จำนวน line)" + ย้ำ "ยังไม่เข้าสต็อก รอ QC ตรวจรับ" + ลิงก์เปิด GR / ไปหน้า QC ตรวจรับ (G8/NS3)**.
3. GR = "QC ตรวจสอบ" + Lot รอตรวจ (ยังไม่ credit). **★ ร่างที่ไม่บันทึก = ไม่กินเลข GR/Lot (NS4).**

### 5.1 User Stories
- **GR multi-line + Lot รอตรวจ + ปิด PR อัตโนมัติ (Must, จาก US-STK-02):** GR ของ SUP-01 อ้าง PR-000031 (กลีเซอรีน 6 กก.) → **บันทึก → ออกเลข GR + Lot `L-GLY-2607` + popup (G8/NS7)** → **GR object (QC ตรวจสอบ) + Lot (รอตรวจ, on_hand ยังไม่เพิ่ม)**. **★ QC ผ่าน (`qc.md`) → on_hand เพิ่ม → Available เพิ่มอัตโนมัติ (ไม่แตะ Reserved) → Lot พร้อมใช้ → PR-000031 "ของเข้าครบ" auto (continuity C17).** **Edge:** รับ 200/250 ล. อ้าง PR-000028 → (QC ผ่าน) PR "รับบางส่วน" + กล่องยืนยัน "สร้าง PR ใหม่ 50 ล.?" **รอ user review**. **Error:** เว้น supplier/เลขใบรับ → error ที่ field ที่ขาด, **ไม่บันทึก/ไม่ออกเลข/ไม่ gen GR/Lot** (G8/NS2 — save fail = ไม่ออกเลข).
- **★ ชดเชยยอดติดลบ + FIFO retro-link เกิดตอน QC ผ่าน (Must, จาก US-STK-03 edge · ปรับ trigger):** on_hand กลีเซอรีน = −4 กก. (ผลิตล่วงหน้า) แล้วรับ 6 กก. → **ตอนบันทึก GR ยังไม่ชดเชย (Lot รอตรวจ)** · **QC ผ่าน → ตอนนั้นแสดง notice "การรับนี้ชดเชยยอดติดลบ 4 หน่วย" + on_hand = +2 + back-allocate การตัดที่ติดลบเข้า lot ใหม่แบบ FIFO** (คง Batch↔Lot GMP) + trace. **★ ถ้า QC ไม่ผ่าน → ไม่ชดเชย, on_hand คง −4** (รอ GR/Lot ที่ผ่านใบถัดไป); Lot ระงับ → คืน supplier.
- **ราคาซื้อ (จาก US-STK-03 error / US-STK-04):** ราคาซื้อ 0 ได้ แต่ติดลบ → error "ราคาต้อง ≥ 0".

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ดู GR / list + **ดูประวัติ comment** | Warehouse/Stock.**Read (R)** |
| สร้าง GR (รับเข้า → gen GR object + Lot รอตรวจ, ★ ออกเลข GR+Lot) | Warehouse/Stock.**Create (C)** |
| **★ ตัดสินรับ Lot ผ่าน/ไม่ผ่าน (credit stock)** | **QC.Approve** (ที่ `qc.md` — ไม่ใช่หน้านี้) |
| **★ ส่งกลับ QC (re-submit GR ไม่ผ่าน)** | Warehouse/Stock.**Update (U)** |
| **★ ยกเลิก GR (สถานะ QC ตรวจสอบ/ไม่ผ่าน)** | Warehouse/Stock.**Delete (D)** + เหตุผล |
| **แก้ไข comment (แก้ในที่)** | Warehouse/Stock.**Update (U)** (เก็บประวัติ auto — comment-convention.md) |
| ทำใบคืน (RM เสีย/QC ไม่ผ่าน) | ไปที่ `return.md` (Stock.**Update** + เหตุผล) |
> ไม่มีฟังก์ชันรับเข้าในหน้า Supplier — อยู่ที่นี่เท่านั้น. **การสร้าง RM master (รหัส unique) = แท็บ RM ของ `stock.md` §3b (Stock.Create) — ไม่ใช่หน้านี้.** **การตัดสิน QC = หน้า `qc.md` เท่านั้น.**

## 7. Validations
- supplier + เลขใบรับจาก supplier + ≥1 line = บังคับ.
- **วัตถุดิบใน line ต้องเป็น RM master ที่มีอยู่** (ถ้ายังไม่มี → สร้างที่ `stock.md` §3b ก่อน).
- ราคาซื้อ ≥ 0 (0 ได้).
- **★ บันทึก GR = ออกเลข GR + Lot gapless (G8/NS2, NS7) + gen GR object (QC ตรวจสอบ) + Lot รอตรวจ · ไม่ credit on_hand จนกว่า QC ผ่าน · ร่างที่ไม่บันทึกไม่กินเลข (NS4).**
- อ้าง PR: วัตถุดิบใน line ต้องตรงกับ PR ที่อ้าง (มิฉะนั้น error "วัตถุดิบไม่ตรงกับคำขอ" — ไม่ปิด PR, ดู `pr.md`).
- **★ PR สถานะรับครบ/บางส่วน คำนวณจากปริมาณที่ QC ผ่าน (ไม่ใช่ปริมาณที่บันทึกรับ)** — เทียบยอด PR → ตั้งสถานะ PR อัตโนมัติเมื่อผ่าน.
- **★ ยกเลิก GR = เฉพาะสถานะ QC ตรวจสอบ/ไม่ผ่าน** (ยังไม่ credit หรือส่วนที่ไม่ผ่าน) + เหตุผลบังคับ · เลข GR คงอยู่ (gapless, NS5).
- **★ comment (หมายเหตุทั่วไป) = ไม่บังคับ** · ทุกการแก้ถูก audit (comment-convention.md CC2/CC3).

## 8. Pagination / Search
- GR list: 20/หน้า (G1) · ค้นเลข GR / supplier / วัตถุดิบ (RM ชื่อ/รหัส) / Lot / ช่วงวันที่รับ (G2) · filter สถานะ GR (ผ่าน/ไม่ผ่าน/QC ตรวจสอบ/ยกเลิก). **★ มุมมอง warehouse เต็ม = แท็บ "Good Receipt (RM)" ของ stock (`stock.md` §2b).**

## 9. Formulas
- **★ credit gated on QC pass:** on_hand ของ Lot **ไม่เปลี่ยนตอนบันทึก GR** · **เมื่อ QC ผ่าน → on_hand += Lot qty (`GR (+)`) + Available += (Reserved ไม่เปลี่ยน)**.
- **★ ชดเชยติดลบ (ตอน QC ผ่าน):** ถ้า `on_hand < 0` ก่อน credit → หลัง credit = `on_hand + Lot qty`; ส่วนที่เคยตัดติดลบถูก back-allocate เข้า lot ใหม่ตาม FIFO. **QC ไม่ผ่าน = ไม่ credit, ไม่ retro-link** (ยอดติดลบคงอยู่).
> **★ Reconciliation note (settled, PO):** เดิม credit + FIFO retro-link เกิด **ตอนบันทึก GR**; ปอนด์สั่งให้ **RM เข้าสต็อกเมื่อ QC ผ่านเท่านั้น** → credit + retro-link **ย้ายมาที่จุด QC pass**. กลไก negative-stock/FIFO-retro-link **ไม่ขัดกัน** — เพียงเลื่อน trigger จาก GR → QC-pass (การ back-allocate ยังทำแบบ FIFO เหมือนเดิม, เพียงเกิดช้าลงหนึ่งขั้น). **ไม่มี genuine conflict.** *(ถ้าปอนด์ต้องการให้ credit เกิดตอนรับของ (GR) แล้ว QC เป็นแค่ release-to-use เหมือนเดิม → แจ้งกลับได้; default ปัจจุบัน = credit ตอน QC ผ่าน ตามคำสั่งล่าสุด.)*

## 10. Cross-links
- **★ credit on QC pass + FIFO retro-link → `qc.md` §4.1 · `stock.md` §6 (`GR (+)`).** ผลลัพธ์ยอด/ledger → `stock.md` (§5/§6). **RM master (รหัส unique) → `stock.md` §3b.** **★ GR object view + ส่งกลับ QC/ยกเลิก (warehouse) → `stock.md` §2b.** PR auto-close/partial (จากปริมาณผ่าน) → `pr.md`. RM เสีย/ไม่ผ่าน → `return.md`. negative/retro-link → entity-status-map §1.6/§1.8.
- **★ เลข GR + Lot ออกตอนบันทึก (G8/NS7) → `numbering-on-save.md` · gapless → `non-functional.md` §5 (D-F2).**
- **Comment + change-history → `comment-convention.md` · field-audit + GR status audit → `traceability.md` §3/§4.**

## 11. Module changelog
- **Absorbed:** GR-specific requirements จาก `stock.html` US-STK-02 (GR multi-line + PR auto-close) + US-STK-03 (negative compensation + FIFO retro-link) → รวมเป็น module GR เดี่ยว (stock.md ยังถือเรื่องยอด/ledger).
- **★ เพิ่ม (2026-07-29 — number-on-save G8, ปอนด์ cross-cutting · "Lot/รับเข้าคลัง"):** เลข **GR + ทุก Lot ราย line** ไม่โชว์บนหน้ารับเข้า → **ออก gapless ตอนบันทึกสำเร็จ + popup ยืนยัน (GR + ทุก Lot + summary) พร้อมย้ำ "ยังไม่เข้าสต็อก รอ QC"** — §2/§3/§4.2/§5.0/§5.1/§7/§10, ยึด `numbering-on-save.md` (G8/NS1–NS4, **NS7** หลายเลขต่อการบันทึก). ยกเลิก GR = เลขคงอยู่ (NS5).
- **★ CHANGED (2026-07-29 — QC + GR/Stock flow review, ปอนด์):**
  1. **★ QC-gated stock-in:** GR สร้าง **GR object + Lot สถานะ "รอตรวจ" โดยไม่ credit on_hand** → **credit + FIFO retro-link เกิดตอน QC "ผ่าน" เท่านั้น** (เดิม credit ตอนบันทึก GR) · ไม่ผ่าน = ไม่เข้าสต็อก — §1/§2/§3/§4.1/§5/§7/§9/§10, ref `qc.md` §4.1 · `stock.md` §6.
  2. **★ GR object lifecycle 4 สถานะ:** QC ตรวจสอบ → ผ่าน / ไม่ผ่าน / ยกเลิก + **action ส่งกลับ QC (re-submit) / ยกเลิก** — §3/§4.2/§4.3/§6/§7/§8, ref entity-status-map §1.8.
  3. **★ ยกเลิก GR = เฉพาะก่อน credit (QC ตรวจสอบ/ไม่ผ่าน) → ไม่ต้อง reverse ยอด/ไม่กระทบติดลบ; ผ่านแล้วเอาของออก = Return/Loss** (PO reasonable decision, settled, override ได้) — §4.3/§9.
  4. **★ PR auto-close/partial อ้างปริมาณที่ QC "ผ่าน"** (ไม่ใช่ปริมาณที่บันทึกรับ) — §4.4/§7.
- **★ เพิ่ม (2026-07-29 — comment cross-cutting feedback, PO module 3 review):** ช่อง **หมายเหตุ (comment)** แบบแก้ในที่ + **เก็บประวัติการแก้ครบ** ต่อ GR (header) — ยึด `comment-convention.md`.
- **★ เพิ่ม (2026-07-29 — Stock module 4 review):** วัตถุดิบใน GR line = อ้าง RM master ที่มีอยู่ (สร้าง/ตั้งรหัส unique ที่ `stock.md` §3b) + search dropdown (ชื่อ+รหัส). §1/§3/§6/§7/§10.
- **คงเดิม:** 1 supplier/ใบ, gen Lot รายบรรทัด, PR partial→new PR รอ review, ราคาซื้อ ≥0.
