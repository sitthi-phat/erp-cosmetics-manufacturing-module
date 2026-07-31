# Module — Sales Order (SO, Own-Brand)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 (**+ DN→SO status link 2026-07-30 · + Invoice one-active link 2026-07-30 · + SO document print 2026-07-31 · ★ + Gate-1 reconciliation r20 2026-07-31: (C1) SO(ก) FG shortage = WARN-not-block · (C2) SO(ข) terminal "ผลิตเข้าคลังแล้ว" (exclude จาก Route) · (C3) cancel blocked while active DN**)
กฎอ้างอิง: **D1** (เอกสาร/เลขแยก) · **D2** (2 sub-case · ★ D2 Own-Brand ก sell-from-stock = warn-not-block เมื่อ FG ไม่พอ) · **D8 v2** (prefill จาก Supply Planning · **★ พก batch count ที่เลือก**) · D12/D16 (FG จอง/ตัด FIFO per-Batch) · D18-2 (ไม่มี Quotation) · README §3/§4 (**G8**) · **`customer.md` §4.2 (hard block Disabled/Blacklist — เฉพาะโหมด ก ที่มีลูกค้า)** · **`bom.md` §5c (inactive-BOM/FG block — ทั้ง 2 โหมด)** · **`comment-convention.md` (comment + change-history)** · **`numbering-on-save.md` (G8 — เลขออกตอนบันทึก)** · **`supply-planning.md` §5/§5b (ที่มา prefill produce-to-stock + batch count)** · **★ `delivery-note.md` §8 / `po.md` §4b (SO delivery status = สะท้อนจาก DN)** · **★ `invoice.md` §4b (SO billing = สะท้อนใบ active; 1 SO หลายใบ active ทีละใบ)** · **★ `shipping.md` §4d / `delivery-note.md` §4 (cancel blocked while non-void DN active — C3)** · **★ `stock.md` §3 (negative FG reserve — Available ติดลบ = "จองเกิน")**

## สรุปภาษาไทย
ใบสั่งขาย **Own-Brand** เอกสาร/เลขแยกจาก PO `SO-{YYYYMM}-{NNNNNN}` (คนละโมดูล, ไม่มี Quotation). 2 แบบ: **(ก) ขายจากสต็อก** = เลือกลูกค้า (customer dropdown), กด **"ยืนยันใบสั่งขาย (จอง FG)"** → **จอง FG per-Batch + SO = พร้อมส่ง (Ready to Ship)** → รอในโมดูล **การจัดส่ง** → ตัด FG FIFO ตอน dispatch → DN/Invoice. **★ (C1 r20 — Pond D2): SO(ก) ยืนยันได้แม้ FG Available < จำนวนสั่ง → เตือน ไม่บล็อก (WARN-not-block, มิเรอร์ RM) → จอง FG ได้จนติดลบ (Available ติดลบ = "จองเกิน (รอเติมสต็อก)"); ตัดจริง FIFO ตอน dispatch (ตัดติดลบตามนโยบาย negative stock ได้).** **★ โหมด (ก): ลูกค้าสถานะ Disabled/Blacklist = เปิด/ยืนยัน SO ไม่ได้ (HARD block)** — เลือกไม่ได้ใน dropdown + บล็อกตอนยืนยัน. **(ข) ผลิตเก็บสต็อก** = **ไม่เลือกลูกค้า** (hard block ลูกค้าไม่เกี่ยว), ทำตัวเหมือนเปิด PO: BOM RM stock check → production; RM ขาด → สร้าง production order ได้ + **AUTO-open PR**; QC ผ่าน → FG เข้าคลัง → **สถานะสุดท้าย = "ผลิตเข้าคลังแล้ว (Completed/stocked)"** (★ C2 r20 — terminal เฉพาะของโหมด ข, **ไม่ใช่ "พร้อมจัดส่ง" และไม่เข้าคิว Route**); ขายภายหลังผ่าน (ก). **★ ถ้าโหมด (ข) มาจากปุ่ม "สั่งผลิต" ใน Supply Planning (D8 v2) → หน้าถูก PRE-FILL FG + จำนวนผลิต = จำนวน batch ที่ผู้ใช้เลือกใน modal × Batch Size**. **★ ทั้ง 2 โหมด: FG/BOM ที่ถูกตั้ง Inactive = เปิด SO ไม่ได้ (HARD block, `bom.md` §5c)**. **★ เลข SO ไม่โชว์ล่วงหน้าบนหน้า create (แสดง "(ระบบออกให้เมื่อบันทึก)") → ออก gapless ตอนบันทึกสำเร็จ + popup ยืนยันแสดงเลข SO + สรุป (G8 · `numbering-on-save.md`)**. **★ พิมพ์เอกสาร SO (ทั้งโหมด ก และ ข): หลังบันทึก/ออกเลข SO (G8) เปิด print-ready view เพื่อ พิมพ์/ส่ง (print/share) เอกสาร SO ได้ — มิเรอร์ QT; พิมพ์ได้เฉพาะหลังบันทึกเท่านั้น (ก่อนบันทึกยังไม่มีเลข/ไม่มีเอกสารให้พิมพ์ — กติกาปอนด์) · สิทธิ์ = SO.Read (R).** List ค้นด้วยเลข/ช่วงวันที่. **★★ ใหม่ (2026-07-30): SO (ก) สถานะจัดส่ง = LINKED จากสถานะ DN** — SO แสดงถึง "พร้อมส่ง" แล้วสะท้อนสถานะ DN (อยู่ระหว่างการเตรียม/อยู่ระหว่างจัดส่ง/ส่งสำเร็จ/ลูกค้าเลื่อนส่ง/ลูกค้ายกเลิก/ลูกค้ายังไม่กำหนดวันรับใหม่) เหมือน PO (§4). **★ (C3 r20): ยกเลิก SO(ก) โดยตรง = BLOCKED ขณะมี DN (non-void) ที่ active (อยู่ระหว่างการเตรียม/อยู่ระหว่างจัดส่ง) — ต้องจัดการผ่าน Route/DN (void DN ก่อน) — §8.** **★★ ใหม่ (2026-07-30 — Invoice review): 1 SO ออกใบแจ้งหนี้ได้หลายใบ แต่ "active" ทีละ 1 ใบ** — billing สะท้อนใบ active; ใบ void = ประวัติ (`invoice.md` §4b). **★ มีช่องหมายเหตุ (comment) แก้ในที่ + เก็บประวัติการแก้ครบ (comment-convention.md).**

---

## 1. Purpose
เปิด/จัดการคำสั่งขายแบรนด์ตัวเอง 2 โหมด: ขายของที่มีในสต็อก (a) และผลิตเพื่อเติมสต็อก (b, ไม่ผูกลูกค้า). แยกโมดูลจาก PO เพื่อไม่กระทบสาย OEM (D1/D17).

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `so-list.html` | list SO + filter (สถานะ **รวมสถานะจัดส่งที่สะท้อน DN — §4 · รวม "ผลิตเข้าคลังแล้ว" ของโหมด ข**, โหมด ก/ข) + **search เลข SO / ช่วงวันที่สร้าง** (G2) + 20/หน้า (G1) |
| `so-create.html` | สร้าง SO — สลับโหมด (ก) เลือกลูกค้า+FG / (ข) ไม่เลือกลูกค้า+ผลิต + **ช่อง comment** · **★ ช่องเลข SO = "(ระบบออกให้เมื่อบันทึก)" (G8)** |
| `so-detail.html` | รายละเอียด + lifecycle ตามโหมด (**ก: สถานะจัดส่งสะท้อน DN — §4 · billing สะท้อนใบ active — §5 step5 · ข: terminal "ผลิตเข้าคลังแล้ว" — §4**) + **★ print-ready view (พิมพ์/ส่งเอกสาร SO — เฉพาะหลังบันทึก/ออกเลข, ทั้งโหมด ก/ข §5c)** + **comment ปัจจุบัน + "ประวัติการแก้ไข comment"** |

## 3. Fields
| ฟิลด์ | หน่วย/ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| เลข `SO-{YYYYMM}-{NNNNNN}` | string | computed (gapless ต่อเดือน) | แยกจาก PO (D1) · **★ ไม่โชว์บน create (แสดง "(ระบบออกให้เมื่อบันทึก)") → ออกตอนบันทึกสำเร็จ + popup (G8)** · **★ เลขนี้ปรากฏบนเอกสาร print-ready (พิมพ์ได้เฉพาะหลังออกเลข §5c)** |
| โหมด | enum {ขายจากสต็อก(ก), ผลิตเก็บสต็อก(ข)} | editable | (ก) มีลูกค้า / (ข) ไม่มี (D2) |
| ลูกค้า | ref customer | editable (dropdown G4) | **(ก) บังคับ · (ข) ว่าง** · (ก) **Disabled/Blacklist เลือกไม่ได้ (§8)** |
| line items | (ก) FG + qty · (ข) FG(BOM) + qty ผลิต | editable | (ก) โชว์ FG Available ราย Batch (D16) · **(ข) prefill จาก Supply Planning = FG + qty = batch count × Batch Size (§6)** · **FG/BOM ต้อง Active — Inactive เลือกไม่ได้/บล็อก ทั้ง 2 โหมด (§8, `bom.md` §5c)** |
| FG Available (ราย Batch) | units | computed (read-only) | (ก) เท่านั้น — จาก FG stock · **★ อาจ < จำนวนสั่ง → เตือนไม่บล็อก (C1 §8)** |
| วันที่ต้องการรับของ (ก) | date | editable | **★ ใช้จัดเรียง candidate ในหน้า Route + ค้น DN (shipping.md §5 / delivery-note.md §11)** |
| **สถานะ** | enum (§4) | mostly auto | ต่างกันตามโหมด · **(ก) หลังพร้อมส่ง = สะท้อน DN (§4) · (ข) terminal = "ผลิตเข้าคลังแล้ว" (§4)** |
| ราคา/ยอดรวม/VAT | THB | (ก) computed | (ข) ไม่มีลูกค้า/ราคาตอนนี้ |
| **★ หมายเหตุ (comment)** | free-text (ช่องเดียว) | **editable (แก้ในที่/overwrite)** | **แก้ทุกครั้งเก็บประวัติ ใคร/เมื่อ/เดิม→ใหม่ + โผล่ trace — `comment-convention.md` (CC1–CC7)** · ใช้ได้ทั้งโหมด ก/ข |

## 4. Statuses / lifecycle
### (ก) Sell-from-stock
```
ร่าง → ยืนยันใบสั่งขาย (จอง FG) ──► พร้อมส่ง (Ready to Ship) [จอง FG per-Batch — ★ C1: จองได้แม้ Available ไม่พอ = warn]
     → [โมดูลการจัดส่ง = Route] gen DN → ตัด FG FIFO ราย Batch ตอน dispatch
     ──► [สถานะจัดส่งสะท้อนจาก DN]: อยู่ระหว่างการเตรียม → อยู่ระหว่างจัดส่ง → ส่งสำเร็จ
         (หรือ ลูกค้าเลื่อนส่ง / ลูกค้ายกเลิก / ลูกค้ายังไม่กำหนดวันรับใหม่)
     → Invoice (อ้าง SO · ใบ active) → ชำระ · ยกเลิก SO = คืนจอง FG (★ C3: บล็อกถ้ามี DN active — §8)
```
> **★★ SO (ก) delivery status = LINKED จาก DN status** — เหมือน PO (`po.md` §4b / `delivery-note.md` §8): SO แสดงสถานะตัวเองถึง "พร้อมส่ง" แล้วสะท้อนสถานะ DN. **rollup = "DN ล่าสุด (active)" = DN (non-void) ที่มี timestamp การเปลี่ยนสถานะล่าสุด (most-recent status-change) ในบรรดา DN ที่ไม่ถูก void ของ SO นั้น** (นิยามเดียวกับ `delivery-note.md` §8 / `po.md` §4b). **บังคับใช้ทุกจอที่โชว์สถานะ SO** (so-list/so-detail/dashboard). sync entity-status-map §1.10.
> **★★ SO (ก) billing = สะท้อนใบแจ้งหนี้ active** — 1 SO หลายใบ active ทีละใบ; ใบ void = ประวัติ (`invoice.md` §4b).

### (ข) Produce-to-stock
```
ร่าง (ไม่เลือกลูกค้า) → ยืนยัน → BOM RM stock check → PRD ไม่ผูกลูกค้า
     → (RM ขาด) auto-open PR → ผลิต → QC ผ่าน → FG เข้าคลัง (per-Batch, D12)
     ──► ★ ผลิตเข้าคลังแล้ว (Completed / stocked) [terminal ของโหมด ข]
     → ขายภายหลังผ่าน (ก)
```
> **★ (C2 r20 — BA M1): โหมด (ข) มี terminal status ของตัวเอง = "ผลิตเข้าคลังแล้ว (Completed / stocked)"** — เกิดเมื่อทุก PRD ของ SO(ข) QC ผ่าน + กด "พร้อมส่ง" → FG เข้าคลังครบ. **โหมด (ข) ไม่ผูกลูกค้า/ไม่มี DN → ไม่ inherit "พร้อมจัดส่ง (Ready to Ship)" และไม่เข้าคิว "พร้อมจัดส่ง" (Route candidate list)** — Route หยิบได้เฉพาะ order ที่พร้อมส่งให้ลูกค้าจริง (โหมด ก / PO). โหมด (ข) → ไม่มีสถานะสะท้อน DN · ไม่มี Invoice (ขายภายหลังผ่านโหมด ก). **แต่ยังพิมพ์เอกสาร SO โหมด (ข) ได้หลังบันทึก/ออกเลข (§5c).** sync `production.md` §4 (rollup label) · entity-status-map.

## 5. ★ (ก) Sell-from-stock — RESOLVED flow (README §4)
1. `so-create` โหมด (ก) → **เลือกลูกค้าผ่าน customer search dropdown (G4)** (ค้นเบอร์/บริษัท/ผู้ติดต่อ/เบอร์ผู้ติดต่อ; โชว์สถานะ+credit term; ดู detail modal แล้วกลับไม่เสีย state). **★ ช่องเลข SO บนหน้านี้ = read-only "(ระบบออกให้เมื่อบันทึก)" (G8/NS1).**
   - **★ Hard block ลูกค้า Disabled/Blacklist (customer.md §4.2):** ลูกค้าสถานะ Disabled/Blacklist **ค้นเจอ+เห็นสถานะ แต่เลือกไม่ได้** (disabled option); ถ้าหลุดเข้ามาต้อง **บล็อกตอนยืนยันใบสั่งขาย** พร้อมข้อความ *"ลูกค้าสถานะ {Disabled/Blacklist} — เปิดใบสั่งขายไม่ได้"*. เป็น **HARD block** (ต่างจาก FG ไม่พอ = เตือน).
2. เลือก FG ที่มีสต็อก → ระบบโชว์ **FG Available ราย Batch (FIFO, D16)**.
   - **★ Hard block FG Inactive (`bom.md` §5c):** FG ที่ถูกตั้ง **Inactive (ปิดใช้งาน)** **หายจาก dropdown เลือก FG**; ถ้าหลุดเข้ามา → **บล็อกตอนยืนยัน** ข้อความ *"สินค้านี้ปิดใช้งาน (Inactive) — เปิดใบสั่งขายไม่ได้"*. คนละแหล่งกับ block ลูกค้า. (FG stock เดิมที่มีอยู่ยัง trace/ดูได้ แต่เปิด SO ใหม่ขายไม่ได้.)
3. กด **"ยืนยันใบสั่งขาย (จอง FG)"** →
   - **★ (C1 r20 — Pond D2) การยืนยันไม่ต้องรอ "ของพร้อมในสต็อกเต็มจำนวน":** ถ้า **FG Available < จำนวนที่สั่ง** → **เตือน (warn) ไม่บล็อก** (มิเรอร์กติกา RM warning-not-block ของ PO) — ระบบยังให้ยืนยันและ **จอง FG per-Batch ได้ แม้เกินยอดคงเหลือ** → **reserved เพิ่มจน Available ติดลบ = badge "จองเกิน (รอเติมสต็อก)"** (`stock.md` §3, negative-reserve). *(เดิมข้อความ "ของ มี/พร้อมในสต็อก" = ถอดออก — ไม่ใช่เงื่อนไขบล็อกอีกต่อไป.)*
   - **★ ออกเลข SO gapless ตอนบันทึก/ยืนยันสำเร็จ + popup ยืนยัน "เลข SO + สรุป (ลูกค้า/FG/จำนวน) + คำเตือนถ้า FG ไม่พอ" + ลิงก์ so-detail / print-ready (G8/NS2–NS3).**
   - **จอง FG per-Batch** (มิเรอร์ RM reservation; reserved+, available−, ติดลบได้).
   - SO เปลี่ยนเป็น **พร้อมส่ง (Ready to Ship)**.
   - SO **รอในโมดูล "การจัดส่ง (Route)"** เพื่อจัดรอบส่ง.
4. โมดูลการจัดส่ง (Route) หยิบ SO เข้ารอบ → gen **DN อ้าง SO** → **ตัด FG FIFO ราย Batch** ตอน dispatch (**★ ถ้ายังไม่พอ = ตัดติดลบตามนโยบาย negative stock — เตือน, GR/ผลิตเติมชดเชยภายหลัง**) → **สถานะจัดส่งของ SO สะท้อน DN (§4)** → ส่งสำเร็จ.
5. ออก **Invoice อ้าง SO** (+ cost snapshot ที่ line, D10) → รับชำระ.
   - **★★ Invoice = ใบ active เดียวต่อ SO (1 SO หลายใบ, active ทีละใบ · `invoice.md` §4b).** ตอนสร้างใบระบบ **pull ข้อมูลลูกค้า (ชื่อ/ที่อยู่ออกเอกสาร/เลขภาษี) → แก้ในใบได้ (per-invoice override, ไม่แก้ master)**. **เฟสนี้ไม่ล็อกสถานะตอนสร้างใบ** (`invoice.md` §7). void ใบ → ออกใบใหม่แทนได้. **สร้าง/พิมพ์ Invoice จากหน้า DN = ใบ active เดียวกัน (DN-unify · `delivery-note.md` §5).**
6. **ยกเลิก SO** ก่อน dispatch = **คืนจอง FG** (release) — **★ (C3 r20) แต่บล็อกถ้ามี DN active (§8): ถ้า order เข้ารอบ Route แล้ว (มี DN non-void สถานะ อยู่ระหว่างการเตรียม/อยู่ระหว่างจัดส่ง) → ยกเลิก SO ตรงไม่ได้; ต้อง void DN/ยกเลิกรอบผ่าน Route ก่อน (`shipping.md` §4d), DN void → order กลับคิว "พร้อมจัดส่ง" → แล้วจึงยกเลิก SO ได้.**

## 5b. ★ Comment + change-history (ยึด `comment-convention.md`)
- **1 ช่อง comment free-text ต่อ SO** (ทั้งโหมด ก/ข) · แก้ได้จาก so-create (ตั้งค่าแรก) และ so-detail (แก้ทับ/overwrite).
- ทุกครั้งที่แก้ → เก็บ **ใคร/เมื่อ/ค่าเดิม→ค่าใหม่** ผ่าน field-audit เดิม; so-detail แสดง **ค่าปัจจุบัน + affordance "ประวัติการแก้ไข comment"** (popover/timeline).
- การแก้ comment = activity-log event ของ SO และ **โผล่บน trace** (entity=SO, field=`comment`). กติกาเต็ม = `comment-convention.md` (CC1–CC7) · คนละฟิลด์กับ "comment ตอนยกเลิก" (§8).

## 5c. ★ Print SO document (พิมพ์เอกสาร SO — ทั้งโหมด ก และ ข · มิเรอร์ QT · Gate-1 completeness fix 2026-07-31)
- **หลังบันทึก/ยืนยันสำเร็จ (เลข SO ออกแล้ว — G8/`numbering-on-save.md`)** ระบบแสดง/ให้เข้าถึง **print-ready view** ของเอกสาร SO → ผู้ใช้กด **"พิมพ์/ส่งเอกสาร SO" (print/share)** เพื่อพิมพ์หรือส่งไฟล์.
- **★ ใช้ได้ทั้ง 2 โหมด:** โหมด (ก) ขายจากสต็อก และ โหมด (ข) ผลิตเก็บสต็อก — เอกสาร SO พิมพ์ได้เมื่อออกเลขแล้วทั้งคู่. *(หมายเหตุ: การพิมพ์ **Invoice** เป็นคนละเอกสาร ทำจากหน้า DN — โหมด ก เท่านั้น §5 step5; §5c นี้พูดถึงการพิมพ์ **เอกสาร SO เอง**.)*
- **★ พิมพ์ได้เฉพาะหลังบันทึก/ออกเลขเท่านั้น** — ก่อนบันทึก **ยังไม่มีเลข SO และยังไม่มีเอกสารให้พิมพ์** (กติกาชัดของปอนด์). เข้าถึง print-ready ได้จาก **popup หลังบันทึก** และจาก **so-detail** ทุกเมื่อหลังจากนั้น.
- **การพิมพ์/ส่ง = action เชิงเอกสาร ไม่เปลี่ยนสถานะ SO** (lifecycle/delivery/billing คงเดิม) — เหมือน QT (`quotation.md` §5/§7).
- **สิทธิ์ = SO.Read (R)** (มิเรอร์ QT print = Read; สอดคล้อง G9 print=R · §7).

## 6. ★ (ข) Produce-to-stock — RESOLVED flow (README §4)
> **ทำตัวเหมือนเปิด PO** (แต่ไม่มีลูกค้า → **hard block Disabled/Blacklist ไม่เกี่ยวกับโหมดนี้** แต่ **hard block FG/BOM Inactive ยังบังคับ**):
1. `so-create` โหมด (ข) → **ไม่เลือกลูกค้า** → เลือก FG(BOM) + จำนวนที่จะผลิต. **★ ช่องเลข SO = "(ระบบออกให้เมื่อบันทึก)" (G8/NS1).**
   - **★ ที่มาการ prefill (จาก Supply Planning "สั่งผลิต", D8 v2):** ถ้ามาจากปุ่ม "สั่งผลิต" ใน modal ของ Supply Planning → หน้านี้ถูก **prefill** FG + **จำนวนผลิต = จำนวน batch (batch count) ที่ผู้ใช้ระบุใน modal × Batch Size** (batches × batch size = qty). ผู้ใช้ทวน/ยืนยัน. *(เดิม prefill = Suggested คงที่; ตอนนี้พก **batch count ที่เลือก** — `supply-planning.md` §5/§5b. FG ที่ Inactive จะไม่โผล่ใน Supply Planning ตั้งแต่แรก — `supply-planning.md` §4.)*
   - **★ Hard block FG/BOM Inactive (`bom.md` §5c):** เลือกได้เฉพาะ FG(BOM) ที่ **Active**; Inactive **หายจาก dropdown**/บล็อกตอนยืนยัน ข้อความ *"สูตร/สินค้าปิดใช้งาน (Inactive) — สั่งผลิตเก็บสต็อกไม่ได้"*.
2. ยืนยัน → **★ ออกเลข SO gapless ตอนบันทึกสำเร็จ + popup ยืนยัน "เลข SO + สรุป (FG/จำนวนผลิต)" + ลิงก์ so-detail / print-ready (G8/NS2–NS3)** → แสดง **BOM raw-material stock check** (เทียบ Available).
3. ส่งงานเข้า **production** → สร้าง **PRD ไม่ผูกลูกค้า** (customerless).
4. **ถ้า RM ขาด** → ยังสร้าง production order ได้ (ไม่บล็อก) + **AUTO-open PR ไปคลัง** (ต่างจาก Quotation ที่ไม่ auto-PR; เหมือน PO).
5. ผลิต → QC ผ่าน → **FG เข้าคลัง per-Batch (D12)** → **★ SO(ข) = "ผลิตเข้าคลังแล้ว (Completed/stocked)" (terminal §4) — ไม่เข้าคิว Route/พร้อมจัดส่ง**.
6. FG พร้อมขายภายหลังผ่านโหมด (ก).
> **ที่มา produce-to-stock = เดียว** (หน้า SO produce-to-stock นี้). Supply Planning เป็นแค่ prefill (**พก batch count ที่เลือก**) — แก้ปัญหา PRD สองที่มา — README §5, ปิด U4.

## 7. Actions & Permissions (D14)
| ปุ่ม/action | Permission required (SO module) |
|---|---|
| ดู list/detail + **ดูประวัติ comment** | SO.**Read (R)** |
| **พิมพ์/ส่งเอกสาร SO (print-ready view · ทั้งโหมด ก/ข · เฉพาะหลังบันทึก/ออกเลข, ไม่เปลี่ยนสถานะ §5c)** | SO.**Read (R)** |
| สร้าง/แก้ SO (ก/ข) | SO.**Create/Update (C/U)** |
| **แก้ไข comment (แก้ในที่)** | SO.**Update (U)** (เก็บประวัติ auto — comment-convention.md) |
| **ยืนยันใบสั่งขาย (จอง FG)** [ก] | SO.**Update (U)** |
| ยืนยันผลิตเก็บสต็อก (→ PRD) [ข] | SO.**Create (C)** (สร้าง produce-to-stock PRD) |
| ยกเลิก SO (คืนจอง) — **★ C3: บล็อกถ้ามี DN active (§8)** | SO.**Delete/Approve (D/A)** + comment |
| ออก DN (อ้าง SO) | Shipping.**Create (C)** (ผ่าน Route) |
| **ออก Invoice (อ้าง SO · ใบ active) / ยกเลิก(void) ใบ** | Invoice.**Create (C)** / Invoice.**Delete (D)** (Finance · `invoice.md` §6) |
| เปิด modal ลูกค้า [ก] | Customer.**Read (R)** |
> **สถานะจัดส่งของ SO (ก) = สะท้อนจาก DN (§4) — ไม่มีปุ่มเปลี่ยนสถานะจัดส่งบน SO โดยตรง; ควบคุมผ่าน Route/DN.** **billing = สะท้อนใบ active (`invoice.md` §4b) — ควบคุมผ่านโมดูล Invoice.**

## 8. Validations
- (ก) บังคับเลือกลูกค้า + ต้องมี line FG + จำนวน. **★ (C1 r20) FG Available < จำนวนสั่ง = เตือน ไม่บล็อก (WARN-not-block; มิเรอร์ RM warning-not-block ของ PO) — ยืนยันได้ + จอง FG จนติดลบ (Available ติดลบ = "จองเกิน (รอเติมสต็อก)", `stock.md` §3); ตัดจริง FIFO ตอน dispatch (ตัดติดลบได้).** *(เดิมข้อความ "FG ต้องมีในสต็อกพอ/must be in stock" = ถอดออก — ไม่เป็นเงื่อนไขบล็อก.)*
- **★ (ก) Hard block ลูกค้า Disabled/Blacklist (customer.md §4.2):** ห้ามเลือก/ยืนยันใบสั่งขายให้ลูกค้าสถานะ Disabled/Blacklist — **บล็อกจริง** + ข้อความชัด (แยกจาก FG-availability warning).
- **★ Hard block FG/BOM Inactive (bom.md §5c) — ทั้ง 2 โหมด:** ห้ามเลือก/ยืนยัน SO ที่ line อ้าง FG/BOM **Inactive (ปิดใช้งาน)** — **บล็อกจริง** + ข้อความ *"สูตร/สินค้าปิดใช้งาน"*. คนละแหล่งกับ block ลูกค้า. ไม่กระทบ SO เดิม/FG stock เดิม (เดินต่อ/trace ได้ — deletion-policy §2.4).
- (ข) ห้ามมีลูกค้า; ต้องมี FG(BOM) + จำนวนผลิต — **hard block Disabled/Blacklist ไม่เกี่ยว** (ไม่มีลูกค้า) · **hard block Inactive ยังบังคับ** · **★ ถ้า prefill มาจาก Supply Planning จำนวน = batch count × Batch Size (แก้ต่อได้ก่อนยืนยัน)** · **★ (C2) terminal = "ผลิตเข้าคลังแล้ว" — ไม่เข้าคิว Route.**
- **★ เลข SO ออกตอนบันทึก/ยืนยันสำเร็จเท่านั้น (G8/NS2) — ร่างที่ไม่บันทึกไม่กินเลข (NS4).**
- **★ พิมพ์เอกสาร SO ได้เฉพาะหลังบันทึก/ออกเลขแล้วเท่านั้น (§5c · ทั้งโหมด ก/ข) — ก่อนบันทึกไม่มีเลข/ไม่มีเอกสารให้พิมพ์ (กติกาปอนด์); การพิมพ์ไม่เปลี่ยนสถานะ · สิทธิ์ = SO.Read (R).**
- **★ (ก) สถานะจัดส่ง = สะท้อน DN (§4)** — ทุกจอที่โชว์สถานะ SO ต้องใช้ combined logic. rollup = DN ล่าสุด (non-void, status-change ล่าสุด).
- **★ (ก) billing = สะท้อนใบ active (§5 step5 · `invoice.md` §4b)** — 1 SO มีใบ active ทีละ 1 ใบ; ใบ void ไม่นับ.
- **★ (C3 r20 — cancel vs active DN): ยกเลิก SO(ก) โดยตรง = BLOCKED ขณะมี DN (non-void) ที่ active (สถานะ อยู่ระหว่างการเตรียม / อยู่ระหว่างจัดส่ง)** — ต้องจัดการผ่าน Route/DN ก่อน (void DN / ยกเลิกรอบ, `shipping.md` §4d → order กลับคิว "พร้อมจัดส่ง") แล้วจึงยกเลิก SO ได้; ถ้า DN "ส่งสำเร็จ" แล้ว = สายจัดส่งปิด (การเอาของคืน = ผ่าน Return). ยกเลิก SO ก่อนเข้ารอบ (ยังไม่มี DN) = ทำได้ตามปกติ (คืนจอง FG).
- ยกเลิก = บังคับ comment.
- **★ comment (หมายเหตุทั่วไป) = ไม่บังคับ** · แก้ได้ทุกสถานะ · ทุกการแก้ถูก audit (comment-convention.md CC2/CC3) · คนละฟิลด์กับ comment ยกเลิก.

## 9. Pagination / Search
- so-list: 20/หน้า (G1) · search เลข SO **หรือ** ช่วงวันที่สร้าง (G2) · filter สถานะ (**รวม "ผลิตเข้าคลังแล้ว" โหมด ข + สถานะจัดส่งสะท้อน DN โหมด ก**) + โหมด ก/ข.

## 10. Cross-links
- **D8 v2 prefill (FG + จำนวน = batch count × Batch Size) → `supply-planning.md` §5/§5b** · FG stock/FIFO + negative reserve → `stock.md` §3/§6 · DN/Invoice อ้าง SO → `delivery-note.md`/`invoice.md` · flow → `flows/ownbrand-flow.md`.
- **Hard block Disabled/Blacklist (โหมด ก) → `customer.md` §4.2.**
- **Inactive FG/BOM block (ทั้ง 2 โหมด) → `bom.md` §5c · `deletion-policy.md` §2.4.**
- **★ เลขออกตอนบันทึก (G8) → `numbering-on-save.md` · gapless → `non-functional.md` §5 (D-F2).**
- **★ พิมพ์เอกสาร SO (print-ready หลังออกเลข, สิทธิ์ R, ทั้งโหมด ก/ข) → มิเรอร์ `quotation.md` §5/§7 · G9 print=R (`permission-matrix.md` §3).**
- **★★ SO (ก) delivery status = สะท้อน DN → `delivery-note.md` §8 · `po.md` §4b · `shipping.md` §4b · entity-status-map §1.10.**
- **★ (C2) SO(ข) terminal "ผลิตเข้าคลังแล้ว" (exclude จาก Route candidate) → `production.md` §4 · `shipping.md` §5 (candidate = พร้อมจัดส่ง เท่านั้น).**
- **★ (C3) cancel blocked while active DN → `shipping.md` §4d · `delivery-note.md` §4/§7 · `non-functional.md` §10.**
- **★★ SO (ก) billing = สะท้อนใบ active (1 SO หลายใบ, active ทีละใบ) → `invoice.md` §4b/§7 · ออก/ยกเลิกใบ = `invoice.md` §6 · DN-unify = `delivery-note.md` §5.**
- **Comment + change-history → `comment-convention.md` · field-audit → `traceability.md` §4.**

## 11. Module changelog
- **เพิ่ม:** date-range search (list) · customer dropdown (ก) · resolved (ก) Ready-to-Ship→Delivery flow · resolved (ข) auto-PR flow · prefill จาก Supply Planning (D8 v2).
- **★ เพิ่ม (2026-07-29 — number-on-save G8, ปอนด์ cross-cutting):** เลข SO **ไม่โชว์บน create → ออก gapless ตอนบันทึก/ยืนยันสำเร็จ + popup ยืนยัน (เลข + summary + ลิงก์ so-detail)** ทั้งโหมด ก/ข — §2/§3/§5/§6/§8/§10, ยึด `numbering-on-save.md` (G8/NS1–NS4).
- **★ เพิ่ม (2026-07-29 — customer feedback):** **hard block เปิด/ยืนยัน SO โหมด (ก) เมื่อลูกค้า Disabled/Blacklist** (§5/§8, ref customer.md §4.2) · โหมด (ข) ไม่เกี่ยว (ไม่มีลูกค้า).
- **★ เพิ่ม (2026-07-29 — comment cross-cutting feedback, PO module 3 review):** ช่อง **หมายเหตุ (comment)** แบบแก้ในที่ + **เก็บประวัติการแก้ครบ** บน so-create/so-detail (ทั้งโหมด ก/ข) — ยึด `comment-convention.md` (§3 field, §5b, §7 permission).
- **★ เพิ่ม (2026-07-29 — BOM module review, ปอนด์):** **hard block เปิด/ยืนยัน SO เมื่อ FG/BOM ที่อ้างถูกตั้ง Inactive — ทั้งโหมด ก และ ข** (§3/§5/§6/§8, ref `bom.md` §5c) — คนละแหล่งกับ block ลูกค้า; SO/FG stock เดิมเดินต่อ. FG Inactive ยังถูกกันออกจาก Supply Planning (ไม่โผล่ prefill โหมด ข).
- **★ เพิ่ม (2026-07-29 — Supply Planning module review, ปอนด์):** produce-to-stock SO จากปุ่ม **"สั่งผลิต" ใน Supply Planning (D8 v2)** พกจำนวน batch (batch count) → จำนวนผลิต = batch count × Batch Size — §3/§6/§8/§10, ref `supply-planning.md` §5/§5b.
- **★★ เพิ่ม (2026-07-30 — DN→SO status link, ปอนด์ Module C):** **SO (ก) สถานะจัดส่ง = สะท้อนจากสถานะ DN** (เหมือน PO §4b): SO แสดงสถานะตัวเองถึง "พร้อมส่ง" แล้ว mirror DN (อยู่ระหว่างการเตรียม/อยู่ระหว่างจัดส่ง/ส่งสำเร็จ/ลูกค้าเลื่อนส่ง/ลูกค้ายกเลิก/ลูกค้ายังไม่กำหนดวันรับใหม่); rollup = DN ล่าสุด; บังคับใช้ทุกจอที่โชว์สถานะ SO. §2/§3/§4/§5/§7/§8/§10, ref `delivery-note.md` §8 · `po.md` §4b. โหมด (ข) ไม่มี DN → ไม่สะท้อน.
- **★★ เพิ่ม (2026-07-30 — Invoice module review, ปอนด์):** **SO (ก) billing = สะท้อนใบแจ้งหนี้ active** (1 SO หลายใบ, active ทีละใบ; ใบ void = ประวัติ) · Invoice pull ข้อมูลลูกค้า + per-invoice override · เฟสนี้ไม่ล็อกสถานะตอนสร้างใบ · สร้าง/พิมพ์ Invoice จากหน้า DN = ใบ active เดียวกัน (DN-unify) · §5 step5/§7/§8/§10, ref `invoice.md` §4b/§6/§7 · `delivery-note.md` §5. โหมด (ข) ไม่มี Invoice.
- **★ เพิ่ม (2026-07-31 — Gate-1 completeness fix, ปอนด์):** **§5c พิมพ์เอกสาร SO (print-ready view) — ทั้งโหมด ก และ ข** — หลังบันทึก/ออกเลข SO (G8) เปิด print-ready view เพื่อ **พิมพ์/ส่งเอกสาร SO** ได้ (เข้าถึงจาก popup หลังบันทึก + so-detail); **พิมพ์ได้เฉพาะหลังบันทึกเท่านั้น**; การพิมพ์ **ไม่เปลี่ยนสถานะ**; **สิทธิ์ = SO.Read (R)** — มิเรอร์ `quotation.md` (QT print=R) + G9 print=R. §2/§3/§5c/§6 step2/§7/§8/§10.
- **★ เพิ่ม (2026-07-31 — Gate-1 review reconciliation r20, ปอนด์):**
  - **(C1 — Pond D2):** reconcile §5 step3/§8 — **SO(ก) FG shortage = WARN-not-block** (ถอด "ของ มี/พร้อมในสต็อก / must be in stock"); ยืนยันได้แม้ FG Available < qty → เตือน + จอง FG จนติดลบ (Available ติดลบ = "จองเกิน") + ตัดจริง FIFO ตอน dispatch (ตัดติดลบได้) — mirror RM. sync `flows/ownbrand-flow.md`. summary/§3/§4(ก)/§5/§8/§10.
  - **(C2 — BA M1):** เพิ่ม terminal status โหมด (ข) = **"ผลิตเข้าคลังแล้ว (Completed/stocked)"** — ไม่ inherit "พร้อมจัดส่ง", **exclude จาก Route candidate list** ("พร้อมจัดส่ง" = ก/PO เท่านั้น); sync `production.md` §4 rollup label + entity-status-map. summary/§2/§3/§4(ข)/§6/§8/§9/§10.
  - **(C3):** เพิ่มกติกา **ยกเลิก SO(ก) โดยตรง = BLOCKED ขณะมี DN (non-void) active** — ต้อง void DN/ยกเลิกรอบผ่าน Route ก่อน; ก่อนเข้ารอบ (ไม่มี DN) ยกเลิกได้ปกติ. summary/§4/§5 step6/§7/§8/§10, ref `shipping.md` §4d · `delivery-note.md` §4.
  - **ใช้ view เดิม (`so.html` render จาก .md).**
- **คงเดิม:** 2 โหมด (ก/ข), FG reserve/consume (Option A), print SO, DN-mirror, billing active-invoice.
