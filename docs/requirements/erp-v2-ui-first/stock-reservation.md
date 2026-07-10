# Stock Reservation (Lock / จอง) Lifecycle — ESSENCE Hub System

slug: `erp-v2-ui-first` · ออกแบบโดย PO · 2026-07-10 · ที่มา: คำถามปอนด์ "lock stock ตอนไหน — PO เสร็จ→lock, ตัดจริงตอนพร้อมส่ง, cancel→คืน"
เป็น **ส่วนเสริมของ** `entity-status-map.md` §1.6 (Stock) · **source of truth เรื่อง reservation** · negative-stock + FIFO retro-link เดิมยังอยู่ (ไม่ทับ)

## สรุปภาษาไทย
เพิ่มชั้น **"จอง (Reserve)"** ก่อน **"ตัดจริง (Consume)"**: **PO ยืนยัน (Confirmed) → จองวัตถุดิบ = ΣBOM×จำนวน ต่อ line** (ยังไม่ตัดจริง) → เกิดยอดใหม่ **ใช้ได้ (Available) = คงคลัง (on_hand) − จองแล้ว (Reserved)** · **ตัดจริง** ตอนไหน = **คำถามหลักถึงปอนด์** (PO เสนอ: ตัดจริงตอน "เริ่มผลิต" ราย Batch เพื่อคง GMP Batch↔Lot — ปอนด์เคยพูดทั้ง "ตัดตอนพร้อมส่ง" และ "รับงานก็น่าจะตัด" → ต้องเคาะ) · **Cancel PO = คืน (Release) ของที่จองทั้งหมดอัตโนมัติ** · **แก้ PO ตอน Hold = ปรับยอดจอง** · **จองเกิน available ได้ + เตือน (ไม่บล็อก)** สอดคล้อง warning-not-block · negative-stock (ตัดจริงจน on_hand ติดลบ) + GR retro-link FIFO เดิมยังทำงาน

---

## 1. โมเดล — 3 ยอด + สถานะ Reservation
### 1.1 สามยอดต่อวัตถุดิบ (material-level)
| ยอด | นิยาม | ติดลบได้ไหม |
|---|---|---|
| **คงคลัง (on_hand)** | ยอดกายภาพจริง = Σ stock_movement (physical) ราย lot | ได้ (ตัดจริงเกิน = ติดลบ, GR retro-link) |
| **จองแล้ว (Reserved)** | Σ reservation ที่ยัง active (ยังไม่ consume/ยังไม่ release) | ไม่ (≥0 เสมอ) |
| **ใช้ได้ (Available) = on_hand − Reserved** | ยอดที่ยัง"รับปากได้" กับ PO ใหม่ | **ได้** (จองเกิน = available ติดลบ → เตือนไม่บล็อก) |
> reservation เป็นการ "จองวัตถุดิบ" ระดับ **material** (ยังไม่เจาะจง lot) — lot จะถูกเลือก **FIFO ตอน consume จริง** (คง GMP + สอดคล้อง FIFO retro-link เดิม)

### 1.2 สถานะ Reservation (ต่อ po_line × material)
| สถานะ | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| **จอง (Reserved)** | auto | **PO Confirmed** (qty = ΣBOM_line.qty × po_line.qty ต่อวัตถุดิบ) |
| **ใช้จริงแล้ว (Consumed)** | auto | **ตอน "ตัดจริง"** (ดู §3) — reservation ถูก settle เป็นการตัด on_hand จริง (FIFO lot) |
| **คืนแล้ว (Released)** | auto | PO Cancel / แก้ PO ลดจำนวน / (บาง flow) — reserved ลด, available คืน |

---

## 2. Cascade Delta (เพิ่ม/แก้จากเดิม)
| จุด | เดิม | ใหม่ (reservation) |
|---|---|---|
| **PO Confirmed** (C1) | สร้างคิว "รอรับงาน" | **+ สร้าง reservation ต่อ line = ΣBOM×qty → Reserved เพิ่ม, Available ลด** · จองเกิน available = เตือนไม่บล็อก |
| **เริ่มผลิต** (C3) | ตัด stock (CONSUME) FIFO ติดลบได้ | **[ถ้าเลือก Option A] convert reserve→consume:** Reserved ลด + on_hand ลด (FIFO lot, ติดลบได้+retro-link) · Available ไม่ขยับ (เพราะหักตอนจองแล้ว) |
| **PO Cancel / reopen** (C19) | ยกเลิก PRD/Batch | **+ Release reservation ที่ยังไม่ consume ทั้งหมดของ PO นั้น (คืนอัตโนมัติ)** → Reserved ลด, Available คืน |
| **แก้ PO ตอน Hold** (US-PO-05) | แก้ field + trace | **+ ปรับ reservation ให้ = ΣBOM×qty ใหม่** (เพิ่ม→reserve เพิ่ม / ลด→release ส่วนเกิน) |
| **Rework** (C7) | gen Batch run+1 + ตัด stock | **run เพิ่มใช้วัตถุดิบที่ไม่ได้จองไว้เดิม** → §4 (ตัดจาก available/ติดลบ หรือจองเพิ่ม — confirm) |
| **Goods Receipt** (C17) | +on_hand + retro-link | **on_hand เพิ่ม → Available เพิ่มอัตโนมัติ** (ไม่แตะ Reserved) · ถ้า available เคยติดลบ (จองเกิน) → GR ลดการติดลบ |

---

## 3. ★ จุด "ตัดจริง (Consume)" — 2 ทางเลือก (คำถามหลักถึงปอนด์)
ปอนด์พูด 2 แบบ ("ตัดจริงตอนเสร็จรอ deliver" และ "รับงานก็น่าจะตัด") → เสนอให้เลือก:

| | **Option A — ตัดจริงตอน "เริ่มผลิต" (ราย Batch)** [PO แนะนำ] | **Option B — ตัดจริงตอน "พร้อมส่ง" (หลัง QC ผ่านครบ)** |
|---|---|---|
| flow | Confirmed=จอง → **เริ่มผลิต=convert จอง→ตัดจริง FIFO** → QC → พร้อมส่ง | Confirmed=จอง → เริ่มผลิต=ยังจองอยู่ (เบิกของออกไซต์แต่ระบบยังไม่ตัด) → **พร้อมส่ง=ตัดจริง** |
| ข้อดี | **คง GMP Batch↔Lot** (เลือก lot FIFO ตอนผลิตจริง — ตรง genealogy + retro-link ที่ตกลงแล้ว) · on_hand สะท้อนของที่ออกจากคลังจริงตอนผลิต · แก้จากของเดิมน้อยสุด | ตรงคำ "ตัดตอนรอ deliver" · on_hand ไม่ลดจนกว่าจะผ่าน QC (ถ้า scrap ทิ้งกลางทางไม่ต้องคืน) |
| ข้อเสีย | ช่วง Confirmed→เริ่มผลิต ของถูก "จอง" ยังไม่ตัด (ถูกต้องตามที่ปอนด์ต้องการ) | **ขัด GMP timing:** ของถูกใช้จริงตอนผลิตแต่ระบบยังไม่ตัด → on_hand เกินจริงช่วงผลิต + การผูก Batch↔Lot ต้องเลื่อนไปตอนส่ง (ทำ FIFO retro ยาก) · rework/scrap ระหว่างผลิตทำให้ยอดเพี้ยน |
| Option C | **ตัดตอน "รับงาน"** — เร็วกว่า A แต่ถ้า Hold หลังรับงาน ของถูกตัดไปแล้ว (เสี่ยง) | — |

> **PO แนะนำ Option A** เพราะรักษา GMP Batch↔Lot + FIFO retro-link ที่ปอนด์ยืนยันไปแล้ว และ "จอง" ตั้งแต่ Confirmed ก็ตอบโจทย์ "lock ตั้งแต่ PO เสร็จ" ครบ · **ต้องให้ปอนด์เคาะ (Q1)**

---

## 4. ปฏิสัมพันธ์กับกติกาที่ตกลงแล้ว
- **Negative stock (2 ชนิด ต้องแยกให้ชัด):**
  - **Available ติดลบ** = จองเกินของที่มี (over-reserve) → เตือน "จองเกินของในคลัง X หน่วย (รอรับเข้า)" **ไม่บล็อก** (สอดคล้อง warning-not-block)
  - **on_hand ติดลบ** = ตัดจริงตอนผลิตเกินของกายภาพ → แดง + badge "ติดลบ (รอรับเข้า)" + **GR retro-link FIFO** (เดิม)
- **Cancel PO** → release reservation ที่ยังไม่ consume ทั้งหมด (auto) · ถ้าบาง line เริ่มผลิต/ตัดจริงไปแล้ว = ตัดจริงส่วนนั้นคงอยู่ (ไม่คืน), คืนเฉพาะส่วนที่ยัง "จอง"
- **Hold + แก้ PO (จำนวน/สินค้า)** → recompute ΣBOM×qty ใหม่ → delta reserve/release อัตโนมัติ + trace
- **Rework (run เพิ่ม)** → ใช้วัตถุดิบเพิ่มที่ไม่ได้จองไว้เดิม → **[เสนอ default]** ตัดจาก available ตอนเริ่มผลิต run+1 (ติดลบได้+เตือน เหมือน consume ปกติ) — ไม่ pre-reserve เพราะ rework ไม่ได้วางแผนล่วงหน้า · (ทางเลือก: auto-reserve rework qty ก่อน) → **Q4**
- **GR** ไม่ auto-consume reservation — แค่เพิ่ม on_hand → available ขึ้น · reservation รอ consume ตามจุดตัดจริง (§3)
- **มูลค่าสต็อก (US-STK-05)** = คิดจาก **on_hand (กายภาพ)** × buy_price เท่านั้น — **ไม่หัก reserved** (ของยังอยู่ในคลัง) → **Q5 ยืนยัน**

---

## 5. Display (ให้ UX/UI + BA)
- **stock.html:** ต่อวัตถุดิบแสดง **3 ยอด: คงคลัง / จองแล้ว / ใช้ได้** · available < 0 = แดง + badge "จองเกิน (รอรับเข้า)" · on_hand < 0 = แดง + badge "ติดลบ (รอรับเข้า)" (เดิม) · (option) ลิงก์ดูว่า PO ใดจองอยู่
- **po-create (suggest US-PO-07):** เช็ค required เทียบ **available (ไม่ใช่ on_hand)** → ขาด = required > available → เตือน + เสนอ PR (ไม่บล็อก)
- **dashboard "ใกล้หมด" tile:** เกณฑ์ใช้ **available ≤ threshold** (แทน on_hand) — **Q2 ยืนยัน**
- **production:** ตอนเริ่มผลิต แสดงว่ากำลัง convert จอง→ตัดจริง (ถ้า Option A)

---

## 6. รายการแก้ — BA (stories/AC)
| story | แก้อะไร |
|---|---|
| **US-PO-02** (ยืนยัน PO) | + cascade "สร้าง reservation ต่อ line = ΣBOM×qty; Available ลด; จองเกิน=เตือนไม่บล็อก" + AC |
| **US-PO-07** (suggest) | เช็คกับ **available** (on_hand − reserved) ไม่ใช่ on_hand; shortage นิยามใหม่ |
| **US-PO-04** (cancel/reopen) | + AC "cancel = release reservation ที่ยังไม่ consume ทั้งหมด (auto คืน)"; reopen→re-reserve ตอน confirm ใหม่ |
| **US-PO-05** (Hold edit) | + AC "แก้จำนวน/สินค้า → ปรับ reservation (delta reserve/release) + trace" |
| **US-PRD-02** (เริ่มผลิต) | [ถ้า Option A] เปลี่ยน "ตัด stock" → "convert reserve→consume (FIFO lot); Reserved ลด + on_hand ลด (ติดลบได้+retro-link); Available ไม่ขยับ" |
| **US-PRD-04** (rework) | + AC จุด material ของ run เพิ่ม (ตาม Q4) |
| **US-STK-01/03** (stock display + negative) | แสดง **3 ยอด**; แยก available-ติดลบ (จองเกิน) vs on_hand-ติดลบ (กายภาพ); ทั้งคู่ warn-not-block |
| **US-STK-05** (มูลค่าสต็อก) | ระบุคิดจาก on_hand เท่านั้น (ไม่หัก reserved) |
| **US-DSH-STK** (tile ใกล้หมด) | เกณฑ์ available ≤ threshold (ตาม Q2) |
| **NEW US-STK-06** (optional) | มุมมอง "วัตถุดิบถูกจองโดย PO ใด" (reservation ledger view) |
| **continuity / user-journeys** | เพิ่ม reserve (Confirmed) + release (cancel) ในตาราง cascade + Journey ②/③ |

## 7. รายการแก้ — TL (schema/API)
| จุด | แก้อะไร |
|---|---|
| **stock ledger** | เพิ่มชนิดเคลื่อนไหว **RESERVE (+reserved), RELEASE (−reserved), CONSUME (−on_hand + settle reserved)** — จะทำเป็น type ใน `stock_movement` หรือ ledger `reservation` แยก + `reserved_balance` cache = TL เลือก |
| **reservation table** | `reservation(id, po_line_id, material_id, qty, status[reserved/consumed/released], created_at)` + IDX (material_id, status) หา reserved รวมเร็ว |
| **available query** | `available = on_hand − reserved` (materialized/derived) — ใช้ใน stock, suggest, dashboard tile |
| **API** | `/api/po/confirm` = + สร้าง reservation ในทรานแซกชันเดียวกับ queue_item · `/api/po/cancel` = release · `/api/production/start` = convert reserve→consume (ถ้า A) · `/api/po/suggest` + `/api/stock/availability` (3 ยอด) ใช้ available · PATCH `/api/po/{id}` (Hold edit) = ปรับ reservation |
| **ADR** | อัปเดต ADR-001 (Stock Ledger) เพิ่มชั้น reservation + available (append-only ยังคง; reserve/release/consume เป็น movement) |

## 8. คำถามถึงปอนด์ (ตัดสินแทนไม่ได้ — มี default/แนะนำ)
1. **★ จุดตัดจริง (สำคัญสุด):** reserve ตอน Confirmed แล้ว **ตัด stock จริงตอนไหน**? — **[PO แนะนำ A]** เริ่มผลิต (ราย Batch, คง GMP Batch↔Lot) · B: พร้อมส่ง (หลัง QC) · C: รับงาน
2. **เกณฑ์ "ใกล้หมด"** (stock/dashboard) ใช้ **Available** (on_hand−reserved) [แนะนำ] หรือ on_hand?
3. **จองเกิน available** (of ไม่พอ) — อนุญาต + เตือน (ไม่บล็อก) [แนะนำ สอดคล้อง warning-not-block] หรือบล็อก?
4. **Rework (run เพิ่ม) ใช้วัตถุดิบเพิ่ม** — ตัดจาก available เลย (ติดลบได้+เตือน) [แนะนำ] หรือ auto-reserve ก่อน?
5. **มูลค่าสต็อก** คิดจาก **on_hand (กายภาพ) เท่านั้น** (ไม่หัก reserved — ของยังอยู่ในคลัง) ใช่ไหม? [แนะนำ ใช่]
> (คนละเรื่องกับ M1: สูตรมูลค่า per-lot vs latest-lot ที่ยังค้างใน po-stage2-review §5.3)
