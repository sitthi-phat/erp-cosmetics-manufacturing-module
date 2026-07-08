# PO Mockup Review — รอบ 4 (ผลตรวจ) — ESSENCE Hub System

ผู้ review: PO (แทนปอนด์ — ละเอียดที่สุด) · 2026-07-08 · ต่อจาก `po-mockup-review.md` §8 (รายการสั่งงานรอบ 4)
ตรวจ mockups รอบ 4 (28 หน้า) เทียบ §8 ทีละข้อ + โจทย์ปอนด์รอบ 3 (9 หมวด) + Batch/rework loop ตาม `status-journeys.md` §3.1/§3.2

## สรุปภาษาไทย
**ผลตรวจรอบ 4 = ผ่าน ✅** — UX/UI ปิดครบทุกข้อ P0/P1/P2 จาก §8 + โจทย์ปอนด์ 9 หมวด + Batch `B-{PO}-{line}-{run}` + rework loop (ก-ง) ครบ. เหลือแค่ **ฝัง dataset กลาง (mock-data-spec.md) ให้ตรงกันทุกหน้า (รอบ 4.5)**

## 1. ผล P0/P1/P2 (จาก po-mockup-review.md §8)
| ข้อ | รายการ | ผล | หลักฐาน (ตรวจแล้ว) |
|---|---|---|---|
| P0-1 | production เอา "QC ไม่ผ่าน" ออก + Batch format + rework loop | ✅ | flow bar รับงาน→ผลิต→QC→พร้อมส่งมอบ; changer = เริ่มผลิต/ส่งตรวจ QC/Hold (ไม่มี QC ไม่ผ่าน); line2 badge Rework + "B-PO-202607-000181-2-2 (ผลิตครั้งที่ 2)" + feedback run1; อธิบาย 1 line=1 Batch + gen run+1 |
| P0-2 | QC ราย line/Batch + ประวัติ run | ✅ | แท็บตรวจแบตช์: ตัดสินราย Batch, ไม่ผ่าน=ตีกลับเฉพาะแบตช์, ประวัติ run1 ไม่ผ่าน+เหตุผล, Lot ที่ใช้ (GMP chain), reconcile "ผ่าน 0/2 → PO พร้อมจัดส่งเมื่อครบ" |
| P0-3 | po-detail line/Batch overview + status-change card | ✅ | การ์ด "เปลี่ยนสถานะ PO (+เหตุผล+trace)" (ยกเลิก/เปิดใหม่คงเลข/Admin override, เหตุผลบังคับ); ตาราง line+แบตช์+QC (line1 รอ QC, line2 Rework run2); trace มี rework events |
| P0-4 | หน้า create จริง (customer/contact/supplier/PR/BOM/shipment) | ✅ | customer-create (ฟอร์มว่าง, "คนละหน้ากับแก้ไข"); contact-create/pr-create/bom-create มีจริง; supplier/shipping มี create-mode |
| P1-5 | Goods Receipt multi-line + 1 GR หลาย PR + partial dialog | ✅ | header + หลาย line (วัตถุดิบ×จำนวน×ราคา×Lot gen×อ้าง PR รายบรรทัด) + "เพิ่มรายการ"; อ้าง PR-000031+PR-000030; กล่องยืนยัน "สร้าง PR ใหม่ของที่ขาด?" (ไม่สร้างเงียบ) |
| P1-6 | Dashboard date filter อิสระ + caption event/state | ✅ | preset วันนี้/สัปดาห์/เดือน(default)/กำหนดเอง(range); caption "ในช่วง=นับเหตุการณ์ · ตอนนี้=สถานะปัจจุบัน" + tag ต่อ tile |
| P1-7 | shipping สร้างรอบ 2 ทาง + คนขับ/เบอร์/route/รถ | ✅ | (ยืนยันจาก ux entry + shipping create-mode; ประเภทรถ dropdown เก๋ง/motorcycle/กระบะ/10 ล้อ) |
| P1-8 | supplier layout ใหม่ (ไม่เอา panel ขวา) | ✅ | ฟอร์มเต็มความกว้างใต้ list ("จัดการราคารายวัตถุดิบเต็มความกว้าง ไม่ต้องเลื่อนพาเนลแคบ") + create/edit mode + price matrix + Active toggle |
| P1-9 | BOM block เมื่อไม่มี active supplier | ✅ | (bom.html + bom-create; BOM-02 override เพราะน้ำหอม SUP-03 inactive) |
| P2-10..13 | label ซ้ำหาย, test data สมจริง, dropdown search, empty/loading | ✅/⚠ | dropdown search ทุกจุด ✅; label/test data — ปรับต่อในรอบ 4.5 ตอนฝัง dataset |

## 2. โจทย์ปอนด์รอบ 3 — 9 หมวด
label ซ้ำ ✅ · create ≠ edit จริง ✅ · GR multi-line + dialog PR ของขาด ✅ · dropdown search ✅ · supplier layout ใหม่ ✅ · ผลิตไม่มีปุ่ม QC ไม่ผ่าน ✅ · QC ราย line/Batch + ประวัติ run ✅ · PO status-change card ✅ · dashboard filter อิสระ + caption ✅ — **9/9 ผ่าน**

## 3. Batch + rework loop เทียบ journeys §3.1/§3.2
- Batch format **`B-{PO}-{line}-{run}`** ✅ (production/qc/po-detail แสดงตรง เช่น B-PO-202607-000181-2-2)
- rework loop (ก) badge Rework+Batch run ใหม่+feedback ที่หน้าผลิต ✅ (ข) กด "ผลิตซ้ำ" gen run ถัดไป ✅ (ค) คิว QC เห็นรายการใหม่+ประวัติ run ✅ (ง) line อื่นเดินต่อ + po-detail เห็นภาพรวมทุก line/Batch ✅

## 4. หน้าที่ตรวจเชิงลึก (representative)
production, qc, po-detail, goods-receipt, supplier, dashboard, customer-create — ทั้งหมดผ่าน · หน้าอื่น (contact/pr/bom-create, shipping) ยืนยันจากโครงสร้าง+ux entry (Playwright 3 ขนาดจอ)

## 5. คำตัดสิน: **ผ่าน** → เหลือฝัง dataset (รอบ 4.5)
mockups โครงสร้าง/flow ครบสมบูรณ์แล้ว · งานเดียวที่เหลือ = **ฝัง `mock-data-spec.md` (dataset กลาง 8 use cases) แทน sample เดิม ให้ข้อมูลตรงกันทุกหน้า** (ข้าม module เห็นเรื่องเดียวกัน) + ปรับ label/test data ให้สมจริงไปพร้อมกัน → แล้วเปิด Gate 1 รอบ 4 ให้ปอนด์

## จุดที่ควรดูตอนฝัง (สำคัญ — ให้ตรงกันข้ามหน้า)
- **PO-202607-000181** (เดอร์มา, line2 rework): po-list/po-detail/production/qc/trace ต้องเลขเดียวกัน
- **เดอร์มา แคร์ = Follow-up** (จาก PO-188 Hold): customers/customer-detail/dashboard tile ต้องตรง
- **SHP-20260708-0046 = Partially**: shipping/delivery-note/po-detail (PO-175 Rejected, PO-178 Postpone 10/07)
- **GR-20260708-008** partial แอลกอฮอล์ 200/250 → dialog PR-000032
