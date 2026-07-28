# Module — Quotation (ใบเสนอราคา OEM)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29
Mockups: `mockups/quotation-list.html` · `mockups/quotation-create.html` · `mockups/quotation-detail.html`
กฎอ้างอิง: **D18** (OEM Quotation) · D3 (RM-direct ผ่านขั้นผลิต) · README §3 (G1–G5) · §4 (Convert-to-PO resolution)

## สรุปภาษาไทย
ใบเสนอราคา **เฉพาะสาย OEM** (Own-Brand SO ไม่มี Quotation). เลข `QT-{YYYYMM}-{NNNNNN}`. สถานะ: ร่าง/ส่งแล้ว/ตกลง/ปฏิเสธ · **แก้ทุกครั้ง = เวอร์ชันใหม่เสมอ (immutable)** · ไม่มีวันหมดอายุ. Create: **customer search dropdown**, มี "เช็ควัตถุดิบตามสูตร" แบบ PO **แต่สร้างได้เสมอ + ไม่ auto-สร้าง/ส่ง PR** (ต่างจาก PO). ปุ่มหลักเปลี่ยนจาก "บันทึก+ส่งให้ลูกค้า" เป็น **"บันทึก"** เฉย ๆ แล้วโชว์ **print-ready view** ทันที. Edit → **"Convert to PO"** = ตั้ง QT เป็น **ตกลง (Agreed)** + ลิงก์ QT↔PO → เปิด po-create ที่ prefill line/qty/ราคา → กรอกที่เหลือ (เช่นวันรับของ) → PO เลขใหม่.

---

## 1. Purpose
เป็นก้าวหน้าเริ่มต้นของสาย OEM: เสนอราคาให้ลูกค้า, ต่อรอง (เวอร์ชันใหม่), เมื่อ "ตกลง" แปลงเป็น PO เข้าสายผลิตเดิม. **optional** — สร้าง PO ตรงโดยไม่มี Quotation ก็ได้ (D18-3).

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `quotation-list.html` | list QT + filter สถานะ + **search เลข QT / ช่วงวันที่สร้าง** (G2) + 20/หน้า (G1) |
| `quotation-create.html` | สร้าง QT ใหม่ (customer dropdown, line, material check) |
| `quotation-detail.html` | ดูรายละเอียด + ประวัติเวอร์ชัน + ปุ่ม Convert to PO (เมื่อ Agreed) + **print-ready view** |
| edit = สร้างเวอร์ชันใหม่จาก detail (immutable) | |

## 3. Fields
| ฟิลด์ | หน่วย/ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| เลข `QT-{YYYYMM}-{NNNNNN}` | string | computed (auto, gapless ต่อเดือน) | ออกตอนบันทึกครั้งแรก |
| เวอร์ชัน | int | computed | แก้ = +1, เก็บเวอร์ชันเก่า (immutable) |
| ลูกค้า | ref customer | editable (via dropdown G4) | แสดง สถานะ + credit term เมื่อเลือก |
| สถานะ | enum {ร่าง, ส่งแล้ว, ตกลง, ปฏิเสธ} | editable | ไม่มี Expired (D18-4) |
| line items | list {item(BOM/RM), qty, ราคา/หน่วย} | editable | mirror PO line · RM-direct = เตือน "ผ่านขั้นผลิตเมื่อเป็น PO" (D3) |
| ยอดรวม + VAT | THB | computed | THB เท่านั้น (ไม่มี multi-currency) |
| ลิงก์ PO (ถ้า convert แล้ว) | ref PO | computed | เก็บ QT↔PO (D18-1) |

## 4. Statuses / lifecycle (D18-4)
```
ร่าง (Draft) ── บันทึก/ส่ง ──► ส่งแล้ว (Sent)
   │                              │
   │  แก้ → เวอร์ชันใหม่เสมอ        ├── ลูกค้าตกลง ──► ตกลง (Agreed) ──► [ปุ่ม Convert to PO เปิด]
   │  (immutable, เก็บประวัติ)      └── ลูกค้าปฏิเสธ ─► ปฏิเสธ (Rejected) (จบสาย, เก็บประวัติ, ไม่เกิด PO)
```
- **แก้ = เวอร์ชันใหม่เสมอ** (เมื่อ QT ออกไปแล้ว immutable — เก็บ v เก่าเป็น "แทนที่แล้ว").
- **ไม่มีวันหมดอายุ** (ไม่มีสถานะ Expired ตอนนี้).

## 5. ★ Create flow (delta)
1. เปิด `quotation-create` → **เลือกลูกค้าผ่าน customer search dropdown (G4)** (ค้นเบอร์/บริษัท/ผู้ติดต่อ/เบอร์ผู้ติดต่อ; โชว์สถานะ+credit term; ดู detail แบบ modal แล้วกลับไม่เสีย state).
2. เพิ่ม line items (BOM/RM + qty + ราคา/หน่วย). RM-direct line → แสดง hint D3 ("ผ่านขั้นผลิตเมื่อเป็น PO").
3. **"เช็ควัตถุดิบตามสูตร"** — ฟังก์ชันเช็ค RM ตาม BOM เหมือน PO **แต่:**
   - **อนุญาตสร้าง Quotation ได้เสมอ** (ไม่บล็อกแม้ RM ขาด).
   - **ไม่ auto-สร้าง/ส่ง PR ไปคลัง** (ต่างจาก PO — Quotation ยังไม่ผูกพันการผลิต/จัดซื้อ).
4. กด **"บันทึก"** (rename จากเดิม "บันทึก + ส่งให้ลูกค้า (Sent)") → บันทึก QT → **แสดง print-ready view ทันที** (พร้อมพิมพ์/ส่งลูกค้าได้เลย).
> การเปลี่ยนสถานะเป็น "ส่งแล้ว (Sent)" ทำจาก detail (หรือถือว่าบันทึกแล้วพร้อมส่ง). primary action = "บันทึก".

## 6. ★ Convert to PO (RESOLVED — README §4)
**เงื่อนไข:** ปุ่ม "Convert to PO" เปิดเมื่อ QT พร้อมตกลง. **การกระทำ:**
1. กด **"Convert to PO"** → dialog ยืนยัน.
2. ระบบตั้ง QT = **ตกลง (Agreed)** (ถ้ายังไม่เป็น) → QT **immutable** (แก้ต่อ = เวอร์ชันใหม่).
3. สร้าง **ลิงก์ QT↔PO** (trace ทั้งสองทาง — D18-1/§8.1).
4. เปิดหน้า **`po-create` ที่ PRE-FILL** line items (BOM/RM) + qty + ราคา/หน่วย จาก QT.
5. ผู้ใช้ **กรอกฟิลด์ที่เหลือ** (เช่น **วันที่ต้องการรับของ (desired receive date)**, remark).
6. กดบันทึก → ออก **PO เลขใหม่ `PO-{YYYYMM}-{NNNNNN}`** → เข้า OEM flow เดิม (จอง RM → ผลิต → …).
> **ลูกค้าไม่ตกลง** → ตั้ง QT = ปฏิเสธ (Rejected) จาก detail → จบสาย ไม่เกิด PO.

## 7. Actions & Permissions (D14)
| ปุ่ม/action | Permission required (Quotation module) |
|---|---|
| ดู list/detail/print-ready | Quotation.**Read (R)** |
| สร้าง QT / แก้ (เวอร์ชันใหม่) | Quotation.**Create/Update (C/U)** |
| เช็ควัตถุดิบตามสูตร | Quotation.**Read (R)** (อ่าน stock/BOM) |
| ตั้งสถานะ ส่งแล้ว/ตกลง/ปฏิเสธ | Quotation.**Update (U)** |
| **Convert to PO** | Quotation.**Update (U)** **+ PO.Create (C)** (สร้าง PO เลขใหม่) |
| เปิด modal ลูกค้า | Customer.**Read (R)** |

## 8. Validations
- ต้องเลือกลูกค้า + อย่างน้อย 1 line + ราคา/หน่วย (ตามธรรมเนียม invoice เดิม, THB).
- แก้ QT ที่ Sent/Agreed → บังคับสร้างเวอร์ชันใหม่ (ห้ามแก้ทับ).
- Convert to PO ทำได้เมื่อ QT ไม่ใช่ Rejected.
- material check = เตือนเท่านั้น (ไม่บล็อก, ไม่ auto-PR).

## 9. Pagination / Search
- quotation-list: 20/หน้า (G1) · search เลข QT **หรือ** ช่วงวันที่สร้าง (G2) · filter สถานะ.
- QT history ยังโผล่บน customer-detail (customer.md §6).

## 10. Cross-links
- D18 spine · Convert flow → `po.md` §create-from-QT + `flows/oem-flow.md`.
- Customer dropdown → `customer.md` §9 (G4).
- Trace QT→PO→… → scope §8.1.

## 11. Module changelog
- **เพิ่ม:** customer search dropdown; material check (no auto-PR); print-ready view หลังบันทึก; Convert-to-PO prefill flow (resolved).
- **แก้:** primary action "บันทึก+ส่งให้ลูกค้า (Sent)" → **"บันทึก"** (แล้วโชว์ print-ready).
