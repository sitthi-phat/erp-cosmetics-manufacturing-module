# Module — Sales Order (SO, Own-Brand)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29
Mockups: `mockups/so-list.html` · `mockups/so-create.html` · `mockups/so-detail.html`
กฎอ้างอิง: **D1** (เอกสาร/เลขแยก) · **D2** (2 sub-case) · **D8 v2** (prefill จาก Supply Planning) · D12/D16 (FG จอง/ตัด FIFO per-Batch) · D18-2 (ไม่มี Quotation) · README §3/§4
> โมดูลใหญ่ — sub-files แนะนำ: `so-sell-from-stock.md` (ก) · `so-produce-to-stock.md` (ข). รอบนี้รวมใน so.md.

## สรุปภาษาไทย
ใบสั่งขาย **Own-Brand** เอกสาร/เลขแยกจาก PO `SO-{YYYYMM}-{NNNNNN}` (คนละโมดูล, ไม่มี Quotation). 2 แบบ: **(ก) ขายจากสต็อก** = เลือกลูกค้า (customer dropdown), กด **"ยืนยันใบสั่งขาย (จอง FG)"** → ของมีในสต็อก → **จอง FG per-Batch + SO = พร้อมส่ง (Ready to Ship)** → รอในโมดูล **การจัดส่ง** → ตัด FG FIFO ตอน dispatch → DN/Invoice. **(ข) ผลิตเก็บสต็อก** = ไม่เลือกลูกค้า, ทำตัวเหมือนเปิด PO: โชว์ BOM RM stock check → ส่งงานเข้า production; RM ขาด → สร้าง production order ได้ + **AUTO-open PR ไปคลัง**; ผลิตเสร็จ (QC ผ่าน) → **FG เข้าคลัง** → ขายภายหลังผ่าน (ก). List ค้นด้วยเลข/ช่วงวันที่ (เหมือน QT/PO).

---

## 1. Purpose
เปิด/จัดการคำสั่งขายแบรนด์ตัวเอง 2 โหมด: ขายของที่มีในสต็อก (a) และผลิตเพื่อเติมสต็อก (b, ไม่ผูกลูกค้า). แยกโมดูลจาก PO เพื่อไม่กระทบสาย OEM (D1/D17).

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `so-list.html` | list SO + filter (สถานะ, โหมด ก/ข) + **search เลข SO / ช่วงวันที่สร้าง** (G2) + 20/หน้า (G1) |
| `so-create.html` | สร้าง SO — สลับโหมด (ก) เลือกลูกค้า+FG / (ข) ไม่เลือกลูกค้า+ผลิต |
| `so-detail.html` | รายละเอียด + lifecycle ตามโหมด |

## 3. Fields
| ฟิลด์ | หน่วย/ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| เลข `SO-{YYYYMM}-{NNNNNN}` | string | computed (gapless ต่อเดือน) | แยกจาก PO (D1) |
| โหมด | enum {ขายจากสต็อก(ก), ผลิตเก็บสต็อก(ข)} | editable | (ก) มีลูกค้า / (ข) ไม่มี (D2) |
| ลูกค้า | ref customer | editable (dropdown G4) | **(ก) บังคับ · (ข) ว่าง** |
| line items | (ก) FG + qty · (ข) FG(BOM) + qty ผลิต | editable | (ก) โชว์ FG Available ราย Batch (D16) |
| FG Available (ราย Batch) | units | computed (read-only) | (ก) เท่านั้น — จาก FG stock |
| สถานะ | enum (§4) | mostly auto | ต่างกันตามโหมด |
| ราคา/ยอดรวม/VAT | THB | (ก) computed | (ข) ไม่มีลูกค้า/ราคาตอนนี้ |

## 4. Statuses / lifecycle
### (ก) Sell-from-stock
```
ร่าง → ยืนยันใบสั่งขาย (จอง FG) ──► พร้อมส่ง (Ready to Ship) [จอง FG per-Batch]
     → [โมดูลการจัดส่ง] ตัด FG FIFO ราย Batch ตอน dispatch ──► ส่งถึงแล้ว
     → Invoice (อ้าง SO) → ชำระ · ยกเลิก SO = คืนจอง FG
```
### (ข) Produce-to-stock
```
ร่าง (ไม่เลือกลูกค้า) → ยืนยัน → BOM RM stock check → PRD ไม่ผูกลูกค้า
     → (RM ขาด) auto-open PR → ผลิต → QC ผ่าน → FG เข้าคลัง (per-Batch, D12)
     → ขายภายหลังผ่าน (ก)
```

## 5. ★ (ก) Sell-from-stock — RESOLVED flow (README §4)
1. `so-create` โหมด (ก) → **เลือกลูกค้าผ่าน customer search dropdown (G4)** (ค้นเบอร์/บริษัท/ผู้ติดต่อ/เบอร์ผู้ติดต่อ; โชว์สถานะ+credit term; ดู detail modal แล้วกลับไม่เสีย state).
2. เลือก FG ที่มีสต็อก → ระบบโชว์ **FG Available ราย Batch (FIFO, D16)**.
3. กด **"ยืนยันใบสั่งขาย (จอง FG)"** — **ความหมายที่ยืนยัน:** ของ **มี/พร้อมในสต็อก** →
   - **จอง FG per-Batch** (มิเรอร์ RM reservation; reserved+, available−).
   - SO เปลี่ยนเป็น **พร้อมส่ง (Ready to Ship)**.
   - SO **รอในโมดูล "การจัดส่ง (การจัดส่ง/Delivery)"** เพื่อจัดรอบส่ง.
4. โมดูลการจัดส่งหยิบ SO เข้ารอบ → **ตัด FG FIFO ราย Batch** ตอน dispatch → ออก **DN อ้าง SO** → ส่งถึง.
5. ออก **Invoice อ้าง SO** (+ cost snapshot ที่ line, D10) → รับชำระ.
6. **ยกเลิก SO** ก่อน dispatch = **คืนจอง FG** (release).

## 6. ★ (ข) Produce-to-stock — RESOLVED flow (README §4)
> **ทำตัวเหมือนเปิด PO** (แต่ไม่มีลูกค้า):
1. `so-create` โหมด (ข) → **ไม่เลือกลูกค้า** → เลือก FG(BOM) + จำนวนที่จะผลิต.
   - **ที่มาการ prefill:** ถ้ามาจาก Supply Planning ปุ่ม "สั่งผลิต" (D8 v2) → หน้านี้ถูก **prefill** FG + จำนวน = Suggested. ผู้ใช้ทวน/ยืนยัน.
2. ยืนยัน → แสดง **BOM raw-material stock check** (เทียบ Available).
3. ส่งงานเข้า **production** → สร้าง **PRD ไม่ผูกลูกค้า** (customerless).
4. **ถ้า RM ขาด** → ยังสร้าง production order ได้ (ไม่บล็อก) + **AUTO-open PR ไปคลัง** (ต่างจาก Quotation ที่ไม่ auto-PR; เหมือน PO).
5. ผลิต → QC ผ่าน → **FG เข้าคลัง per-Batch (D12)**.
6. FG พร้อมขายภายหลังผ่านโหมด (ก).
> **ที่มา produce-to-stock = เดียว** (หน้า SO produce-to-stock นี้). Supply Planning เป็นแค่ prefill (แก้ปัญหา PRD สองที่มา — README §5, ปิด U4).

## 7. Actions & Permissions (D14)
| ปุ่ม/action | Permission required (SO module) |
|---|---|
| ดู list/detail | SO.**Read (R)** |
| สร้าง/แก้ SO (ก/ข) | SO.**Create/Update (C/U)** |
| **ยืนยันใบสั่งขาย (จอง FG)** [ก] | SO.**Update (U)** |
| ยืนยันผลิตเก็บสต็อก (→ PRD) [ข] | SO.**Create (C)** (สร้าง produce-to-stock PRD) |
| ยกเลิก SO (คืนจอง) | SO.**Delete/Approve (D/A)** + comment |
| ออก DN (อ้าง SO) | Shipping.**Create (C)** |
| ออก Invoice (อ้าง SO) | Invoice.**Create (C)** (Finance) |
| เปิด modal ลูกค้า [ก] | Customer.**Read (R)** |

## 8. Validations
- (ก) บังคับเลือกลูกค้า + FG มี Available พอ (ขาด = เตือน/บล็อกตามนโยบาย FG reserve; มิเรอร์ RM warning-not-block).
- (ข) ห้ามมีลูกค้า; ต้องมี FG(BOM) + จำนวนผลิต.
- ยกเลิก = บังคับ comment.

## 9. Pagination / Search
- so-list: 20/หน้า (G1) · search เลข SO **หรือ** ช่วงวันที่สร้าง (G2) · filter สถานะ + โหมด ก/ข.

## 10. Cross-links
- D8 v2 prefill → `supply-planning.md` · FG stock/FIFO → `stock.md` · DN/Invoice อ้าง SO → delivery-note/invoice (scope §10.1) · flow → `flows/ownbrand-flow.md`.

## 11. Module changelog
- **เพิ่ม:** date-range search (list) · customer dropdown (ก) · resolved (ก) Ready-to-Ship→Delivery flow · resolved (ข) auto-PR flow · prefill จาก Supply Planning (D8 v2).
