# Module — Purchase Order (PO, OEM)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29
Mockups: `mockups/po-list.html` · `mockups/po-create.html` · `mockups/po-detail.html`
กฎอ้างอิง: entity-status-map §1.2/§1.3 (2 ราง) · stock-reservation (จอง→ตัดจริง Option A) · D3 · D13 · D18 · README §3 · **`customer.md` §4.2 (hard block Disabled/Blacklist)**

## สรุปภาษาไทย
ใบสั่งซื้อ OEM (รับจ้างผลิต, made-to-order). Create ("เปิดใบสั่งซื้อใหม่") เพิ่ม **customer search dropdown** (โชว์สถานะ+credit term, ดู detail แบบ modal แล้วกลับไม่เสีย state). **★ ลูกค้าสถานะ Disabled/Blacklist = เปิด/ยืนยัน PO ไม่ได้ (HARD block)** — เลือกไม่ได้ใน dropdown + บล็อกตอนบันทึก/ยืนยัน (ต่างจาก TYPE mismatch/RM ขาด ที่เตือนไม่บล็อก). line = BOM/วัตถุดิบตรง (RM-direct ยังผ่านขั้นผลิต D3). ยืนยัน PO = จองวัตถุดิบ (Reserve); ขาด → เตือน + auto PR (ไม่บล็อก). รองรับ **origin ref "created from QT-…"**. ผลิตเกิน → surplus เข้า FG ตอน "พร้อมส่ง" (D13). 2 ราง: fulfilment + billing (credit term 30/60/90 default 60).

---

## 1. Purpose
เปิด/จัดการคำสั่งผลิต OEM ต่อ 1 ลูกค้า, ขับ lifecycle การผลิต+จัดส่ง (fulfilment) และการวางบิล+ชำระ (billing) แบบ 2 ราง.

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `po-list.html` | list PO + filter สถานะ + **search เลข PO / ช่วงวันที่สร้าง** (G2) + 20/หน้า (G1) + คอลัมน์ "🔗 จาก QT-…" ถ้ามี |
| `po-create.html` | เปิด PO ใหม่ (customer dropdown, line BOM/RM, material check + reserve, origin QT optional) |
| `po-detail.html` | 2 ราง (fulfilment/billing) + PRD ต่อ line + เปลี่ยนสถานะ + surplus/actual qty (ผ่าน production) |

## 3. Fields
| ฟิลด์ | หน่วย/ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| เลข `PO-{YYYYMM}-{NNNNNN}` | string | computed (gapless) | reopen คงเลขเดิม |
| ลูกค้า | ref customer | editable (dropdown G4) | โชว์สถานะ + credit term · **Disabled/Blacklist เลือกไม่ได้ (§7)** |
| origin `created from QT-…` | ref QT (optional) | editable/computed | ว่างได้ (สร้างตรง D18-3); auto-fill เมื่อ Convert-to-PO |
| line items | list {item(BOM/RM), qty, ราคา/หน่วย} | editable | RM-direct ยังผ่านขั้นผลิต (D3) |
| วันที่ต้องการรับของ | date | editable | กรอกตอน create (รวมกรณี prefill จาก QT) |
| credit term (rางบิล) | enum {30,60,90} วัน default 60 | editable | default จากลูกค้า, override รายใบแจ้งหนี้ได้ |
| สถานะ fulfilment | enum (§4) | mostly auto | Draft→Confirmed→In Production→Ready→In Delivery→Delivered→Cancelled |
| สถานะ billing | enum | Finance/auto | Not Invoiced→Invoiced→Paid→Overdue |
| ยอดรวม + VAT | THB | computed | |

## 4. Statuses / lifecycle (entity-status-map §1.2/§1.3)
- **Fulfilment:** ร่าง (Draft) → **ยืนยันแล้ว (Confirmed)** [→ line เข้าคิว "รอรับงาน" + **จองวัตถุดิบ** (reserve, Option A)] → กำลังผลิต (In Production) → พร้อมจัดส่ง (Ready to Deliver) → กำลังจัดส่ง (In Delivery) → ส่งถึงแล้ว (Delivered) · ยกเลิก (Cancelled)→reopen (คงเลข).
- **Billing:** ยังไม่วางบิล → วางบิลแล้ว (ออก invoice ได้ตั้งแต่ Confirmed) → ชำระแล้ว · เกินกำหนด (Overdue = ส่งของแล้ว + เลย credit term + ยังไม่จ่าย).
- **จอง/ตัดจริง:** Confirmed = จอง (Reserved = ΣBOM×qty); **เริ่มผลิต = ตัดจริง (Consume FIFO, ติดลบได้)** — ยึด Option A (stock-reservation). Cancel = release ที่ยังไม่ consume.
- **Surplus (D13):** ฝ่ายผลิตกรอก actual produced qty; ตอน "พร้อมส่ง" ส่วนเกิน → FG stock (remark, ไม่ approve).

## 5. ★ Create flow (delta)
1. เปิด `po-create` → **customer search dropdown (G4)** (ค้นเบอร์/บริษัท/ผู้ติดต่อ/เบอร์ผู้ติดต่อ; โชว์สถานะ+credit term; ดู detail แบบ modal แล้วกลับ **ไม่เสีย state ฟอร์ม**).
   - **★ Hard block ลูกค้า Disabled/Blacklist (customer.md §4.2):** ลูกค้าสถานะ Disabled/Blacklist **ค้นเจอ+เห็นสถานะ แต่เลือกไม่ได้** (disabled option); ถ้าหลุดเข้ามาต้อง **บล็อกตอนบันทึก/ยืนยัน** พร้อมข้อความ *"ลูกค้าสถานะ {Disabled/Blacklist} — เปิดใบสั่งซื้อไม่ได้"*. เป็น **HARD block** (ต่างจาก TYPE mismatch/RM ขาด = เตือน).
2. (optional) field **"สร้างจากใบเสนอราคา"** = QT ต้นทาง (ว่าง = สร้างตรง; auto-fill เมื่อมาจาก Convert-to-PO พร้อม prefill line/qty/ราคา).
3. เพิ่ม line (BOM/RM). RM-direct → alert D3 ("ยังผ่านขั้นผลิต").
4. material check เทียบ **Available (on_hand − reserved)** → ขาด = เตือน (ไม่บล็อก) + **auto-สร้าง PR ส่วนขาด** (ต่างจาก Quotation).
5. บันทึก (Draft) → ยืนยัน (Confirmed) = จองวัตถุดิบ.

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required (PO module) |
|---|---|
| ดู list/detail | PO.**Read (R)** |
| เปิด PO ใหม่ / แก้ (Draft, Hold edit) | PO.**Create/Update (C/U)** |
| ยืนยัน PO (→ จองวัตถุดิบ) | PO.**Update (U)** |
| ยกเลิก/reopen PO | PO.**Delete/Approve (D/A)** + comment |
| force override สถานะ (ข้ามลำดับ) | PO.**Admin** + เหตุผล |
| ออก invoice (billing) | Invoice.**Create (C)** (Finance) |
| เปิด modal ลูกค้า | Customer.**Read (R)** |
> surplus (D13) = auto ตอนพร้อมส่ง ไม่มี permission แยก (แจ้ง remark).

## 7. Validations
- ต้องมีลูกค้า + ≥1 line + ราคา/หน่วย.
- **★ Hard block ลูกค้า Disabled/Blacklist (customer.md §4.2):** ห้ามเลือก/บันทึก/ยืนยัน PO ให้ลูกค้าสถานะ Disabled/Blacklist — **บล็อกจริง** + ข้อความชัด. (รวมกรณี Convert-to-PO ที่ลูกค้ากลายเป็น Disabled/Blacklist ภายหลัง.)
- material ขาด = เตือน ไม่บล็อก (+ auto PR) — **คนละกฎกับ hard block ข้างบน**.
- ยกเลิก = บังคับ comment; reopen = คงเลข PO เดิม (Draft).

## 8. Pagination / Search
- po-list: 20/หน้า (G1) · search เลข PO **หรือ** ช่วงวันที่สร้าง (G2) · filter สถานะ + (แสดงลิงก์ QT).

## 9. Cross-links
- QT→PO → `quotation.md` §6 · reservation → stock-reservation · production/surplus → `production.md` · flow → `flows/oem-flow.md`.
- **Hard block Disabled/Blacklist → `customer.md` §4.2.**

## 10. Module changelog
- **เพิ่ม:** customer search dropdown (G4) บน po-create · date-range search po-list · origin QT ref.
- **★ เพิ่ม (2026-07-29 — customer feedback):** **hard block เปิด/ยืนยัน PO เมื่อลูกค้า Disabled/Blacklist** (§5/§7, ref customer.md §4.2) — คนละกฎกับ TYPE mismatch/RM ขาด (warn).
- **คงเดิม:** 2 ราง, reserve/consume (Option A), surplus (D13), RM-direct (D3).
