# Module — Invoice / การเงิน

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 (**+ Invoice review 2026-07-30: search · multi-invoice/one-active · create-when-none (no status lock this phase) · pull-customer-data + per-invoice override · DN-unify** · **+ m2 financial-summary-intended + stray-tag cleanup 2026-07-31**) · **AUTHORITATIVE SPEC** (absorbs functional-spec `invoice.html` US-INV-01..04 + credit-term reconcile)
Mockups: `mockups/invoices.html` · `mockups/invoice-detail.html` · `mockups/invoice-print.html`
กฎอ้างอิง: entity-status-map §1.3 (billing) · `settings.md` (VAT effective date + ข้อมูลบริษัท) · `customer.md`/README §2.2 (credit term 30/60/90 default 60) + **`customer.md` §3 (pull ชื่อ/ที่อยู่ลูกค้า/เลขภาษี → snapshot แก้ในใบได้)** · `delivery-note.md` §5 (**DN-unify: สร้าง/พิมพ์ Invoice จากหน้า DN = ใบเดียวกัน**) · deletion-policy §2.8 (void) · README §3 (**G8**) · **`comment-convention.md` (comment + change-history)** · **`numbering-on-save.md` (G8 — เลข INV ออกตอนสร้างใบ)**

## สรุปภาษาไทย
ออกใบแจ้งหนี้/ใบกำกับภาษีไทยจาก **PO หรือ SO**. **★ ค้น PO/SO/Invoice ด้วย: ชื่อลูกค้า · ชื่อผู้ติดต่อ · เลข PO/SO/Invoice · ช่วงวันที่สร้าง (ของ PO/SO/Invoice)**. **★★ 1 PO/SO มีได้หลายใบแจ้งหนี้ แต่ "active" ได้ทีละ 1 ใบเท่านั้น** — active = ใบที่ยังไม่ถูกยกเลิก (ปัจจุบัน); ใบที่ยกเลิก/void ยังอยู่เป็นประวัติ (§4b). **★ เจอ PO/SO ที่ยังไม่มีใบ → สร้างใบได้เลย; เฟสนี้ "ไม่ล็อกสถานะ"** (ไม่ gate ว่าต้อง Confirmed — relaxed for this phase, ดู reconcile note). **★ สร้างใบ → ระบบออกเลข INV (G8) + พิมพ์ได้ทันที (print-ready)**; ตอนสร้างระบบ **ดึงข้อมูลลูกค้าจากโมดูลลูกค้า (ชื่อ/ที่อยู่ออกเอกสาร/เลขภาษี)** มาใส่ **แต่ "แก้ได้ในใบ" (per-invoice override — snapshot เก็บบนใบ ไม่แก้ master ลูกค้า)**. ใบกำกับครบฟิลด์ (logo, ผู้ออก+เลขภาษี 13 หลัก, ลูกค้า, เลขที่/วันที่/เครดิต, ตารางรายการ, subtotal/discount/**VAT ตาม effective date ยึด invoice date**/grand total/**ตัวหนังสือไทย**/ลายเซ็น 2 ช่อง). **★ ยกเลิกใบ (cancel/void) ได้** — เก็บเลข/ประวัติ (commercial-docs void-only, deletion §2.8). **Overdue = ส่งของแล้ว (DN ส่งสำเร็จ) + เลยเครดิต + ยังไม่จ่าย** (เครดิตระดับลูกค้า **30/60/90 default 60**, override รายใบได้). เลข `INV-{YYYY}-{NNNNNN}` gapless. **★ เลข INV ไม่โชว์ล่วงหน้า → ออก gapless ตอน "สร้างใบแจ้งหนี้" สำเร็จ + popup ยืนยัน (เลข INV + สรุป ลูกค้า/อ้าง PO-SO/grand total + ลิงก์ detail/print · G8) · void = ใช้เลขเดิม (NS5/NS6)**. **★ มีช่องหมายเหตุ (comment) แก้ในที่ + เก็บประวัติครบ (comment-convention.md).** **★★ DN-unify: การ "สร้าง/พิมพ์ Invoice" จากหน้า DN = ทำงานบน "ใบ active ของ PO/SO เดียวกัน" — ไม่ใช่คนละใบ; ใบที่สร้างจาก DN โผล่ในโมดูล Invoice ด้วย** (§10).

> **หมายเหตุ reconcile (สถานะตอนสร้าง):** เดิมล็อกว่า "ออกใบได้ตั้งแต่ PO=Confirmed เท่านั้น". **★ เฟสนี้ปอนด์สั่งผ่อน (2026-07-30): ไม่ gate สถานะตอนสร้าง** — เจอ PO/SO ใน search แล้วสร้างใบได้เลย. กฎ Confirmed-gate = **deferred (เลื่อนไปเฟสหลัง)** ไม่ได้ยกเลิกถาวร — บันทึกไว้เพื่อ re-tighten ภายหลัง (**register: `non-functional.md` §15 DEF-1**).
> **หมายเหตุ reconcile (เครดิต):** functional-spec เดิมยกตัวอย่างเครดิต "30 วัน"; แหล่งความจริงล่าสุด = **preset 30/60/90 default 60** (README §2.2 / `customer.md`). ใช้ค่านี้ — override รายใบยังทำได้.

---

## 1. Purpose
ให้ Finance/Sale วางบิลได้เร็วจาก PO/SO ที่ค้นเจอ (ไม่ล็อกสถานะในเฟสนี้), ออกใบกำกับภาษีถูกต้องตามสรรพากร (VAT ตามวันออกใบ), แก้ข้อมูลลูกค้าเฉพาะรายใบได้ (per-invoice override) โดยไม่แตะ master, และติดตามหนี้ค้าง/เกินกำหนดได้ — โดย **1 PO/SO มีใบ active ได้ทีละใบเดียว** เพื่อไม่ให้ยอดซ้ำ.

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `invoices.html` | **★ ค้น PO/SO/Invoice (ชื่อลูกค้า · ผู้ติดต่อ · เลข PO/SO/INV · ช่วงวันที่สร้าง)** + list ที่โชว์ **PO/SO พร้อมใบ active + ประวัติใบที่ยกเลิก** + overdue alert + PO/SO stage · **★ PO/SO ที่ยังไม่มีใบ → ปุ่ม "สร้างใบแจ้งหนี้ (C)"** → เลข INV = "(ระบบออกให้เมื่อบันทึก)" → ออกตอนสร้าง + popup (G8) |
| `invoice-detail.html` | รายละเอียด + **★ บล็อกข้อมูลลูกค้าที่แก้ได้ (ชื่อ/ที่อยู่ออกเอกสาร/เลขภาษี — per-invoice override)** + **ยกเลิกใบ (void, D)** + สถานะ PO/SO + **comment ปัจจุบัน + "ประวัติการแก้ไข comment"** |
| `invoice-print.html` | ใบกำกับภาษีไทยเต็มรูป (พิมพ์ · print-ready ทันทีหลังสร้าง) |

## 3. Fields
| ฟิลด์ | หน่วย/ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| เลข `INV-{YYYY}-{NNNNNN}` | string | computed | gapless ต่อปี · **★ ไม่โชว์ก่อนสร้างใบ (แสดง "(ระบบออกให้เมื่อบันทึก)") → ออกตอน "สร้างใบแจ้งหนี้" สำเร็จ + popup (G8)** · void = เลขเดิม (NS5/NS6) |
| อ้าง PO/SO | ref | computed | 1 ใบผูก 1 PO/SO · **สร้างได้ทุกสถานะในเฟสนี้ (ไม่ล็อกสถานะ)** |
| **★ active?** | boolean | computed | **1 PO/SO มี active ได้ทีละ 1 ใบ** (§4b) · void → ไม่ active (เป็นประวัติ) |
| PO/SO stage (แสดง) | enum | computed | แสดง fulfilment จริงเสมอ |
| **★ ชื่อลูกค้า (บนใบ)** | text | **editable (override รายใบ)** | ดึงจาก customer master ตอนสร้าง แล้ว **แก้ได้เฉพาะใบนี้** (snapshot) — ไม่แก้ master |
| **★ ที่อยู่ออกเอกสาร (registered/billing address บนใบ)** | text | **editable (override รายใบ)** | ดึงจาก `customer.md` §3 "ที่อยู่ลูกค้า (registered)" ตอนสร้าง → แก้ได้เฉพาะใบ |
| **★ เลขภาษี (Tax ID บนใบ)** | text | **editable (override รายใบ)** | ดึงจาก customer ตอนสร้าง → แก้ได้เฉพาะใบ |
| เครดิต | enum {30,60,90} วัน default 60 | editable (override รายใบ) | ดึงจากระดับลูกค้าตอนสร้าง |
| รายการ + subtotal/discount | THB | editable/computed | ดึงจาก PO/SO |
| VAT | % ตาม effective date | computed | ยึด invoice date |
| grand total + ตัวหนังสือไทย | THB/text | computed | |
| ข้อมูลผู้ออก (logo/ชื่อ/เลขภาษี 13 หลัก) | จาก settings | computed | บังคับครบก่อนพิมพ์ |
| billing status | enum (§4) | mixed | |
| **★ หมายเหตุ (comment)** | free-text (ช่องเดียว) | **editable (แก้ในที่/overwrite)** | **แก้ทุกครั้งเก็บประวัติ ใคร/เมื่อ/เดิม→ใหม่ + โผล่ trace — `comment-convention.md` (CC1–CC7)** · **ไม่พิมพ์ลงใบกำกับ** (หมายเหตุภายใน) · คนละฟิลด์กับเหตุผล void |

> **★ per-invoice override (data source rule):** ตอน **สร้างใบ** ระบบ **pull** ชื่อลูกค้า/ที่อยู่ออกเอกสาร/เลขภาษี/เครดิต จาก **Customer module** มาเป็น **ค่าเริ่มต้นบนใบ (snapshot)**. หลังจากนั้นแก้ค่าบนใบได้ (per-invoice override) → **การแก้อยู่บนใบเท่านั้น ไม่กระทบ customer master**. การแก้ทุกครั้ง audit (entity=Invoice, field ที่แก้).

## 4. Statuses / lifecycle (entity-status-map §1.3)
รอชำระ (Invoiced) → ชำระแล้ว (Paid) / **เกินกำหนด (Overdue)**. **Overdue** = ส่งของแล้ว (DN ส่งสำเร็จ) + เลยเครดิต + ยังไม่จ่าย (scheduler ประเมินรายวัน, J3). **void/ยกเลิกใบ** = เลขคงอยู่ gapless (G8/NS5) → ใบนั้น **ไม่ active** อีกต่อไป (เป็นประวัติ) → PO/SO สามารถออกใบใหม่แทนได้ (§4b).
> **★ comment แก้ได้ทุกสถานะรวม void** (metadata ภายใน ไม่กระทบ business state — comment-convention.md §3).

## 4b. ★★ Multiple invoices per PO/SO — ONE active (ปอนด์ 2026-07-30)
> **1 PO/SO ออกใบแจ้งหนี้ได้หลายใบตลอดอายุ แต่ "active" ได้ทีละ 1 ใบเท่านั้น.**
- **นิยาม "active":** = ใบแจ้งหนี้ปัจจุบันของ PO/SO **ที่ยังไม่ถูกยกเลิก (non-void/non-cancelled)**. ใบที่ยกเลิก/void = คงอยู่เป็น **ประวัติ (history)** (เลข gapless, trace ได้) แต่ **ไม่ active** และไม่นับยอด.
- **การ supersede / คงหนึ่งเดียว (PO reasonable decision — settled; ปอนด์ override ได้, ดู §13 Q):**
  - **ค่า default นี้ = "explicit cancel-then-create":** ถ้า PO/SO **มีใบ active อยู่แล้ว → ปุ่ม "สร้างใบแจ้งหนี้" ถูกบล็อก** พร้อมข้อความ *"PO/SO นี้มีใบแจ้งหนี้ active อยู่แล้ว (INV-…) — ต้องยกเลิกใบเดิมก่อนจึงออกใบใหม่ได้"* + ลิงก์ไปยกเลิกใบเดิม.
  - **ยกเลิก (void) ใบ active → PO/SO กลับเป็น "ยังไม่มีใบ active" → สร้างใบใหม่ได้ → ใบใหม่กลายเป็น active.** (นี่คือกลไก "ใบใหม่ supersede ใบเก่า": void เก่า → create ใหม่.)
  - **การแก้ข้อมูลบนใบ active (customer override / รายการ / เครดิต) = แก้ในใบเดิม (เลขเดิม, ยังเป็นใบ active เดิม)** — ไม่ใช่การออกใบใหม่. ใช้เมื่อแค่ปรับข้อมูล; ออกใบใหม่ (เลขใหม่) เมื่อจำเป็นต้องแทนใบทั้งใบ (void→create).
- **★ Partial / split billing = นอกขอบเขตเฟสนี้:** เฟสนี้ **1 ใบ active = คลุมทั้ง PO/SO เต็มใบ** (สอดคล้อง 1 DN = 1 PO เต็ม). ยังไม่รองรับหลายใบ active พร้อมกันแบ่งจ่ายบางส่วน — ถ้าอนาคตต้องแตกบิลบางส่วน จะนิยาม multi-active + aggregate เพิ่ม.
- **ผลต่อโมดูลอื่น:** ลิงก์ billing/สถานะวางบิลของ PO/SO = **สะท้อนใบ active** (`po.md` §4 billing rail / `so.md`); financial summary ของลูกค้า = Σ ใบที่ **ไม่ void** (customer.md §7).
- **★ m2 (2026-07-31 — INTENDED behaviour, ไม่ใช่ bug):** financial summary ของลูกค้า (`customer.md` §7) **นับเฉพาะใบ active (non-void)**. ดังนั้น **order (PO/SO) ที่ส่งของแล้ว แต่ใบแจ้งหนี้เดียวถูก void และ "ยังไม่ออกใบใหม่แทน" → contribute 0** ต่อยอดซื้อ/ยอดค้างของลูกค้า (จนกว่าจะออกใบ active ใหม่). **นี่เป็นพฤติกรรมที่ตั้งใจ (by design)** เพื่อไม่ให้เอกสารภาษีที่ถูกยกเลิกไปปนยอด — **QA เขียน AC ให้คาดหวัง 0 (ไม่ถือเป็น defect)**. ถ้าธุรกิจต้องการนับ order ที่ส่งแล้วแม้ใบถูก void จะต้องเปิด reconcile ใหม่ (เปลี่ยนนิยาม summary).

## 5. User Stories (absorbed + reconciled) + AC สรุป
- **US-INV-01 (Must) — สร้างใบจาก PO/SO ที่ค้นเจอ (ไม่ล็อกสถานะเฟสนี้) + เห็น stage จริง:** ค้นเจอ PO-176 → **★ กด "สร้างใบแจ้งหนี้" → ระบบ pull ข้อมูลลูกค้า (ชื่อ/ที่อยู่ออกเอกสาร/เลขภาษี/เครดิต) → ออกเลข INV-2026-000135 (gapless) + popup ยืนยัน (เลข + ลูกค้า/อ้าง PO-SO/grand total) + ลิงก์ detail/print (G8/NS2–NS3) + print-ready ทันที** → INV "รอชำระ" + เป็น **ใบ active** ของ PO-176; ราง billing PO="วางบิลแล้ว"; แสดง fulfilment จริง; เครดิต default จากลูกค้า (แก้ในใบได้). **Edge:** PO ยังไม่ Confirmed/ยังไม่ส่ง → **สร้างได้ (เฟสนี้ไม่ล็อกสถานะ)** + ป้ายบริบทสถานะ PO จริง. **Error:** PO-176 มีใบ active อยู่แล้ว → บล็อก "มีใบ active อยู่แล้ว — ยกเลิกใบเดิมก่อน" (§4b) · **ไม่ออกเลข INV (G8/NS4)**.
- **US-INV-01b (Must) — per-invoice customer override:** บน invoice-detail แก้ **ชื่อลูกค้า / ที่อยู่ออกเอกสาร / เลขภาษี** ได้เฉพาะใบนี้ → พิมพ์ใบด้วยค่าที่แก้ → **customer master ไม่เปลี่ยน**. ทุกการแก้ audit (entity=Invoice). **สิทธิ์ = Invoice.Update (U).**
- **US-INV-02 (Must) — ใบกำกับภาษีไทย + VAT effective date:** ตั้ง VAT 7% effective 01/01/2569, ออกใบ 08/07/2569 → ใบครบฟิลด์ + **VAT 7% (มีผล 01/01/2569)** + ตัวหนังสือไทย + ลายเซ็น 2 ช่อง. **Edge:** หลายอัตรา VAT → เลือกอัตราที่ effective ครอบ **invoice date**. **Error:** ข้อมูลบริษัทไม่ครบใน settings → เตือน "ข้อมูลผู้ออกไม่ครบ กรุณากรอกในตั้งค่า" — ไม่พิมพ์ใบที่ฟิลด์บังคับว่าง.
- **US-INV-03 (Should) — Overdue/ติดตามหนี้:** DN ส่งสำเร็จ + เลยเครดิต + ยังไม่จ่าย → scheduler (J3) → billing "เกินกำหนด" + จำนวนวันค้าง; noti Finance+Sale. **Edge:** ออกใบแล้วแต่ DN ยัง "ไม่ส่งสำเร็จ" → **ยังไม่ overdue** แม้เลยวันเครดิต. **Error:** บันทึกรับชำระเกินยอดใบ → error "ยอดรับชำระเกินยอดค้าง" — ไม่บันทึก.
- **US-INV-04 (Should) — Cancel/void + one-active:** ยกเลิกใบ (void) + เหตุผล → ใบ=void (ไม่ลบ, เลข gapless) → ไม่ active → PO/SO ออกใบใหม่แทนได้ (§4b, deletion §2.8). **Edge:** void ใบ active → ราง billing/financial summary หยุดนับใบนั้น (order ที่ยังไม่ออกใบใหม่แทน = 0 ในยอดลูกค้า, INTENDED — §4b m2). **Error:** ไม่มีปุ่ม "ลบ" ถาวร — มีเฉพาะ void (เอกสารการค้าห้าม hard delete).
- **US-INV-05 (Must) — DN-unify:** จากหน้า DN กด **"สร้าง/พิมพ์ Invoice"** → ทำงานบน **ใบ active ของ PO/SO เดียวกัน**: ถ้ายังไม่มีใบ → สร้างใบ active (Invoice.C, G8 popup) แล้ว **ใบนี้โผล่ในโมดูล Invoice ด้วย**; ถ้ามีใบ active แล้ว → **พิมพ์ใบ active ใบเดิม** (ไม่สร้างใบซ้ำ). ใบเดียวกันไม่ว่าเข้าจากหน้า DN หรือหน้า Invoice (§10 · `delivery-note.md` §5).

## 5b. ★ Comment + change-history (ยึด `comment-convention.md`)
- **1 ช่อง comment free-text ต่อ Invoice** (หมายเหตุภายใน) · แก้ในที่ (overwrite) จาก invoice-detail.
- ทุกครั้งที่แก้ → เก็บ **ใคร/เมื่อ/ค่าเดิม→ค่าใหม่** ผ่าน field-audit เดิม; invoice-detail แสดง **ค่าปัจจุบัน + affordance "ประวัติการแก้ไข comment"** (popover/timeline).
- การแก้ = activity-log event + **โผล่บน trace** (entity=Invoice, field=`comment`). **ไม่แสดงบน invoice-print** (หมายเหตุภายใน). กติกาเต็ม = `comment-convention.md` (CC1–CC7) · คนละฟิลด์กับเหตุผล void.

## 6. Actions & Permissions (D14 / G9)
| ปุ่ม/action | Permission required | Suffix (G9) |
|---|---|---|
| ดู list/detail/print + **ดูประวัติ comment** | Invoice.**Read (R)** | (R) |
| **★ พิมพ์ใบแจ้งหนี้/ใบกำกับ (print PDF)** | Invoice.**Read (R)** | **(R)** |
| **สร้างใบแจ้งหนี้ (อ้าง PO/SO, ★ ออกเลข INV + popup · รวมสร้างจากหน้า DN)** | Invoice.**Create (C)** | **(C)** |
| บันทึกรับชำระ / อัปเดตสถานะชำระ | Invoice.**Update (U)** | **(U)** |
| **★ แก้ข้อมูลลูกค้าบนใบ (ชื่อ/ที่อยู่ออกเอกสาร/เลขภาษี — per-invoice override)** | Invoice.**Update (U)** | **(U)** |
| **แก้ไข comment (แก้ในที่)** | Invoice.**Update (U)** (เก็บประวัติ auto — comment-convention.md) | **(U)** |
| **★ ยกเลิก/void ใบ** | Invoice.**Delete (D)** + เหตุผล | **(D)** |
> ไม่มี hard delete. สร้าง Invoice จากหน้า DN ก็ยึด Invoice.**Create (C)** เดียวกัน (DN-unify).

## 7. Validations
- **★ ไม่ล็อกสถานะตอนสร้างใบ (เฟสนี้):** สร้างใบจาก PO/SO ที่ค้นเจอได้ทุกสถานะ (Confirmed-gate = deferred; ดู reconcile note + `non-functional.md` §15 DEF-1). *(re-tighten ภายหลังได้.)*
- **★ 1 PO/SO มีใบ active ได้ทีละ 1 ใบ (§4b):** มีใบ active อยู่ → บล็อกการสร้างใบใหม่ (ต้อง void ใบเดิมก่อน).
- **★ เลข INV ออกตอน "สร้างใบแจ้งหนี้" สำเร็จเท่านั้น (G8/NS2) — บล็อก/ไม่ผ่าน = ไม่ออกเลข (NS4); void = เลขเดิม (NS5/NS6).**
- **★ per-invoice override:** แก้ชื่อ/ที่อยู่ออกเอกสาร/เลขภาษี บนใบ = แก้เฉพาะใบ **ไม่กระทบ customer master**; ทุกการแก้ audit.
- VAT ยึด effective date ตาม invoice date.
- overdue นับเมื่อ DN ส่งสำเร็จเท่านั้น.
- รับชำระ ≤ ยอดค้าง.
- พิมพ์ใบกำกับต้องมีข้อมูลผู้ออกครบ (จาก settings) + เลขภาษี 13 หลัก.
- void ไม่ลบ (gapless) · void → ใบไม่ active.
- **★ comment (หมายเหตุภายใน) = ไม่บังคับ** · แก้ได้ทุกสถานะรวม void · ทุกการแก้ถูก audit · ไม่พิมพ์ลงใบ (comment-convention.md CC2/CC3).

## 8. Pagination / Search
- invoice list: 20/หน้า (G1) · filter สถานะ billing/overdue + **filter "ใบ active / ประวัติ (void)"**.
- **★ Search (ปอนด์ 2026-07-30) — ค้น PO/SO/Invoice ด้วย:**
  - **ชื่อลูกค้า** (customer name)
  - **ชื่อผู้ติดต่อ** (contact name — ใช้ผู้ติดต่อของลูกค้า, ref `customer.md` §3)
  - **เลขเอกสาร** — เลข **PO** หรือ **SO** หรือ **Invoice (INV)**
  - **ช่วงวันที่สร้าง** — ของ **PO / SO / Invoice** (dropdown เลือกชนิดวันที่ตามแกน, G2)
  - ค้นเจอ PO/SO ที่ **ยังไม่มีใบ → แสดงพร้อมปุ่ม "สร้างใบแจ้งหนี้ (C)"**; ที่มีใบ → แสดงใบ active + ประวัติ.

## 9. Formulas
- VAT amount = subtotal(−discount) × อัตราที่ effective ครอบ invoice date.
- overdue days = today − credit due date; due date = **DN ส่งสำเร็จ date + credit term** (ระดับลูกค้า หรือ override รายใบ).
- grand total = subtotal − discount + VAT.

## 10. Cross-links
- **★★ DN-unify — สร้าง/พิมพ์ Invoice จากหน้า DN = ใบ active เดียวกันของ PO/SO → `delivery-note.md` §5.** ใบที่สร้างจาก DN โผล่ในโมดูล Invoice (list เดียวกัน).
- **★ pull customer data (ชื่อ/ที่อยู่ออกเอกสาร/เลขภาษี) → `customer.md` §3 · per-invoice override = ไม่แก้ master.**
- DN ส่งสำเร็จ→เริ่มนับเครดิต → `delivery-note.md` §7 / `shipping.md`. VAT/ข้อมูลบริษัท → `settings.md`. credit term → `customer.md`/README §2.2. billing state → entity-status-map §1.3.
- **★ เลข INV ออกตอนสร้างใบ (G8) → `numbering-on-save.md` · gapless → `non-functional.md` §5 (D-F5).**
- **Comment + change-history → `comment-convention.md` · field-audit → `traceability.md` §4.**
- **billing rail ของ PO/SO = สะท้อนใบ active → `po.md` §4 · `so.md`.** financial summary ลูกค้า → `customer.md` §7.

## 11. Module changelog
- **Absorbed:** functional-spec `invoice.html` US-INV-01..04 (12 AC) verbatim ในความหมาย.
- **แก้ (reconcile, ไม่ re-open):** ตัวอย่างเครดิต "30 วัน" → ใช้ค่าจริงล่าสุด **preset 30/60/90 default 60** (README §2.2).
- **เพิ่ม (delta):** ออก invoice อ้าง **SO (Own-Brand)** ได้ด้วย (ไม่ใช่แค่ PO).
- **★ เพิ่ม (2026-07-29 — number-on-save G8):** เลข INV **ไม่โชว์ก่อนสร้างใบ → ออก gapless ตอนสร้างใบสำเร็จ + popup ยืนยัน** — ยึด `numbering-on-save.md`. void = เลขเดิม.
- **★ เพิ่ม (2026-07-29 — comment cross-cutting):** ช่อง **หมายเหตุ (comment)** แก้ในที่ + เก็บประวัติ (invoice-detail, ไม่พิมพ์ลงใบ).
- **★★ เพิ่ม (2026-07-30 — Invoice module review, ปอนด์):**
  - **§8 Search** ครบ: ชื่อลูกค้า · ผู้ติดต่อ · เลข PO/SO/INV · ช่วงวันที่สร้าง PO/SO/INV.
  - **§4b Multiple-invoices-one-active:** 1 PO/SO หลายใบ, active ทีละใบ; void→create เป็นกลไก supersede; partial billing = out of scope เฟสนี้.
  - **§7 ไม่ล็อกสถานะตอนสร้าง (เฟสนี้)** — relax Confirmed-gate (deferred, บันทึกไว้).
  - **§3/§5b per-invoice customer override:** pull ชื่อ/ที่อยู่ออกเอกสาร/เลขภาษี จาก customer master → แก้ในใบได้ (snapshot, ไม่แก้ master).
  - **§5 US-INV-05 DN-unify:** สร้าง/พิมพ์ Invoice จากหน้า DN = ใบ active เดียวกันของ PO/SO; โผล่ในโมดูล Invoice.
  - **§6 permissions (G9):** สร้าง = (C) · ยกเลิก/void = (D) · แก้ข้อมูลลูกค้าบนใบ = (U) · พิมพ์ = (R). sync `permission-matrix.md`.
  - sync `po.md` · `so.md` · `customer.md` §7 · `delivery-note.md` §5 · `numbering-on-save.md` · `non-functional.md` · `permission-matrix.md` · README.
- **★★ เพิ่ม (2026-07-31 — reconciliation m2 + M2 cleanup, ปอนด์):** **§4b m2** ระบุชัดว่า financial summary นับเฉพาะใบ active (non-void); order ที่ส่งแล้วแต่ใบ void และยังไม่ออกใบใหม่ = **0 (INTENDED, ไม่ใช่ bug)** → QA เขียน AC ตามนี้ (+ US-INV-04 edge). Confirmed-gate deferral ชี้ไป `non-functional.md` §15 DEF-1. **ลบ stray tag `</content>`/`</invoke>` ท้ายไฟล์ (M2)** — ไม่ใช่ spec content.

## 12. Overdue trigger — DN ส่งสำเร็จ
- credit เริ่มนับเมื่อ **DN ส่งสำเร็จ (Delivered)** — ไม่ใช่ตอนออกใบ (delivery-note.md §7 / non-functional J3).

## 13. Open question (non-blocking — decided default, ปอนด์ confirm/override)
> **Q-INV1 (non-blocking):** เมื่อ PO/SO **มีใบ active อยู่แล้ว** แล้วผู้ใช้ต้องการออกใบใหม่ ควรเป็นแบบใด?
> - **(A · ค่า default ที่ PO เลือกไว้) explicit cancel-then-create** — บล็อกการสร้างใบใหม่จนกว่าจะ void ใบ active เดิม (ปลอดภัยกับเอกสารภาษี, ไม่ void โดยไม่ตั้งใจ).
> - **(B) auto-supersede** — กด "สร้างใบใหม่" แล้วระบบ void ใบเดิมให้อัตโนมัติ + ออกใบใหม่เป็น active (สะดวกกว่า แต่ void ใบภาษีอัตโนมัติ).
>
> **สถานะไม่ถูกบล็อก** — UX/UI เดินหน้าด้วยค่า default (A). ถ้าปอนด์เลือก (B) จะปรับ §4b + UX ปุ่มเดียว.
