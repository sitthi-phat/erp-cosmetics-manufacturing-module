# Module — Invoice / การเงิน

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE SPEC** (absorbs functional-spec `invoice.html` US-INV-01..04 + credit-term reconcile)
Mockups: `mockups/invoices.html` · `mockups/invoice-detail.html` · `mockups/invoice-print.html`
กฎอ้างอิง: entity-status-map §1.3 (billing) · `settings.md` (VAT effective date + ข้อมูลบริษัท) · `customer.md`/README §2.2 (credit term 30/60/90 default 60) · `shipping.md` (Delivered→เริ่มนับเครดิต) · deletion-policy §2.8 (void) · README §3

## สรุปภาษาไทย
ออกใบแจ้งหนี้/ใบกำกับภาษีไทย ได้ตั้งแต่ **PO=Confirmed** (แต่ต้องแสดง stage จริงของ PO เสมอ). ใบกำกับภาษีครบฟิลด์ (logo, ผู้ออก+เลขภาษี 13 หลัก, ลูกค้า, เลขที่/วันที่/เครดิต, ตารางรายการ, subtotal/discount/**VAT ตาม effective date ยึด invoice date**/grand total/**ตัวหนังสือไทย**/ลายเซ็น 2 ช่อง). **Overdue = ส่งของแล้ว + เลยเครดิต + ยังไม่จ่าย** (เครดิตระดับลูกค้า **30/60/90 default 60**, override รายใบได้). แก้/ยกเลิกแบบ **versioning + void (ไม่ hard delete, เลข gapless)**. เลข `INV-{YYYY}-{NNNNNN}`.

> **หมายเหตุ reconcile:** functional-spec เดิมยกตัวอย่างเครดิต "30 วัน"; แหล่งความจริงล่าสุด = **preset 30/60/90 default 60** (README §2.2 / `customer.md`). ใช้ค่านี้ — override รายใบยังทำได้เหมือนเดิม.

---

## 1. Purpose
ให้ Finance/Sale วางบิลได้เร็ว (ตั้งแต่ PO ยืนยัน) โดยไม่หลุดสถานะงานจริง, ออกใบกำกับภาษีถูกต้องตามสรรพากร (VAT ตามวันออกใบ), และติดตามหนี้ค้าง/เกินกำหนดได้.

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `invoices.html` | รายการ + overdue alert + PO stage |
| `invoice-detail.html` | รายละเอียด + versioning + สถานะ PO |
| `invoice-print.html` | ใบกำกับภาษีไทยเต็มรูป (พิมพ์) |

## 3. Fields
| ฟิลด์ | หน่วย/ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| เลข `INV-{YYYY}-{NNNNNN}` | string | computed | gapless ต่อปี |
| อ้าง PO/SO | ref | editable | ออกได้ตั้งแต่ Confirmed |
| PO stage (แสดง) | enum | computed | แสดง fulfilment จริงเสมอ |
| ลูกค้า + ที่อยู่/เลขภาษี | ref/text | computed | |
| เครดิต | enum {30,60,90} วัน default 60 | editable (override รายใบ) | จากระดับลูกค้า |
| รายการ + subtotal/discount | THB | editable/computed | |
| VAT | % ตาม effective date | computed | ยึด invoice date |
| grand total + ตัวหนังสือไทย | THB/text | computed | |
| ข้อมูลผู้ออก (logo/ชื่อ/เลขภาษี 13 หลัก) | จาก settings | computed | บังคับครบก่อนพิมพ์ |
| billing status | enum (§4) | mixed | |

## 4. Statuses / lifecycle (entity-status-map §1.3)
รอชำระ (Invoiced) → ชำระแล้ว (Paid) / **เกินกำหนด (Overdue)**. **Overdue** = ส่งของแล้ว (PO Delivered) + เลยเครดิต + ยังไม่จ่าย (scheduler ประเมินรายวัน). void = ยกเลิกใบ (เลขคงอยู่ gapless, ออกใหม่แทนได้).

## 5. User Stories (absorbed) + AC สรุป
- **US-INV-01 (Must) — ออกตั้งแต่ Confirmed + เห็น stage จริง:** PO-176 "ส่งถึงแล้ว" → gen INV-2026-000135 "รอชำระ"; ราง billing PO="วางบิลแล้ว"; แสดง fulfilment="ส่งถึงแล้ว"; เครดิตจากระดับลูกค้า (C13). **Edge:** PO เพิ่งยืนยัน (ยังไม่ส่ง) → ออกได้ + ป้ายเตือน "ยืนยันแล้ว (ยังไม่ส่ง)". **Error:** PO ร่าง/ยกเลิก → บล็อก "ออกใบแจ้งหนี้ได้ตั้งแต่ PO ยืนยันแล้วเท่านั้น".
- **US-INV-02 (Must) — ใบกำกับภาษีไทย + VAT effective date:** ตั้ง VAT 7% effective 01/01/2569, ออกใบ 08/07/2569 → ใบแสดงฟิลด์ครบ + **VAT 7% (มีผล 01/01/2569)** + ตัวหนังสือไทย + ลายเซ็น 2 ช่อง. **Edge:** หลายอัตรา VAT → เลือกอัตราที่ effective ครอบ **invoice date** เท่านั้น. **Error:** ข้อมูลบริษัทไม่ครบใน settings → เตือน "ข้อมูลผู้ออกไม่ครบ กรุณากรอกในตั้งค่า" — ไม่พิมพ์ใบที่ฟิลด์บังคับว่าง.
- **US-INV-03 (Should) — Overdue/ติดตามหนี้:** ส่งของแล้ว + เลยเครดิต + ยังไม่จ่าย → scheduler → billing "เกินกำหนด" + จำนวนวันค้าง; noti Finance+Sale (C14). **Edge:** ออกใบแล้วแต่ PO ยังไม่ "ส่งถึงแล้ว" → **ยังไม่ overdue** แม้เลยวันเครดิต. **Error:** บันทึกรับชำระเกินยอดใบ → error "ยอดรับชำระเกินยอดค้าง" — ไม่บันทึก.
- **US-INV-04 (Should) — Versioning / void:** แก้ใบ → เก็บเวอร์ชันใหม่ + ประวัติ; เลขเดิมคงอยู่. **Edge:** void + เหตุผล → ใบ=void (ไม่ลบ), เลข gapless, ออกใหม่แทนได้ (deletion §2.8). **Error:** ไม่มีปุ่ม "ลบ" ถาวร — มีเฉพาะ void (เอกสารการค้าห้าม hard delete).

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ดู list/detail/print | Invoice.**Read (R)** |
| ออกใบแจ้งหนี้ (อ้าง PO/SO) | Invoice.**Create (C)** |
| บันทึกรับชำระ / แก้ (เวอร์ชันใหม่) | Invoice.**Update (U)** |
| void ใบ | Invoice.**Delete (D)** + เหตุผล |
> ไม่มี hard delete.

## 7. Validations
- ออกใบได้ตั้งแต่ PO/SO = Confirmed เท่านั้น (Draft/Cancelled บล็อก).
- VAT ยึด effective date ตาม invoice date.
- overdue นับเมื่อส่งของแล้วเท่านั้น.
- รับชำระ ≤ ยอดค้าง.
- พิมพ์ใบกำกับต้องมีข้อมูลผู้ออกครบ (จาก settings) + เลขภาษี 13 หลัก.
- void ไม่ลบ (gapless).

## 8. Pagination / Search
- invoice list: 20/หน้า (G1) · filter สถานะ billing/overdue · ค้นเลข INV/ลูกค้า/ช่วงวันที่ (G2).

## 9. Formulas
- VAT amount = subtotal(−discount) × อัตราที่ effective ครอบ invoice date.
- overdue days = today − (delivered credit due date); due date = delivered date + credit term (ระดับลูกค้า หรือ override รายใบ).
- grand total = subtotal − discount + VAT.

## 10. Cross-links
- Delivered→เริ่มนับเครดิต (C10) → `shipping.md`. VAT/ข้อมูลบริษัท → `settings.md`. credit term → `customer.md`/README §2.2. billing state → entity-status-map §1.3.

## 11. Module changelog
- **Absorbed:** functional-spec `invoice.html` US-INV-01..04 (12 AC) verbatim ในความหมาย.
- **แก้ (reconcile, ไม่ re-open):** ตัวอย่างเครดิต "30 วัน" → ใช้ค่าจริงล่าสุด **preset 30/60/90 default 60** (README §2.2) — กติกา overdue/effective คงเดิม.
- **เพิ่ม (delta):** ออก invoice อ้าง **SO (Own-Brand)** ได้ด้วย (ไม่ใช่แค่ PO).
