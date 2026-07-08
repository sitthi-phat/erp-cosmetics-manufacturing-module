# Requirement จากปอนด์ (2026-07-08) — ERP v2, UI-First Rebuild

เริ่มรอบใหม่หลังปิด phase prototype (งานเดิมทั้งหมดอยู่ที่ tag `prototype-v1`)
ปอนด์สั่งให้เริ่มจาก process นี้ (ข้าม PO/BA — ใช้ functional scope เดิมจาก prototype):

```
──▶ UX/UI: design system + mockup ทุกหน้า
──▶ 🚧 GATE 1 = ปอนด์อนุมัติ "หน้าตา" (ไม่ใช่ architecture)
──▶ Engineer ∥ QA (regression) ──▶ UX/UI visual audit ──▶ DevOps ──▶ 🚧 GATE 2
```

## ขอบเขต functional (อ้างอิงจาก prototype-v1)
ระบบ ERP โรงงานผลิตเครื่องสำอาง order-to-cash เต็มสาย: ลูกค้า (พร้อมข้อมูลใบกำกับภาษี)
→ เปิด PO → ตรวจ stock/BOM → ผลิต (auto-calc จาก BOM, FIFO lot) → QC (รับเข้า + batch)
→ จัดส่ง → invoice/versioning/VAT/ใบกำกับภาษีไทย → เก็บเงิน + User Management (7 roles,
permission config ได้) + audit log + dashboard ตามส่วนงาน + BOM management + traceability
(Lot → Batch → FG ตาม GMP)

เอกสารต้นทางทั้งหมดดูได้จาก git: `git show prototype-v1:docs/requirements/erp-core-prototype/user-stories.md`
(44 stories / 14 epics), brief.md, architecture.md ฯลฯ

## โจทย์ความสวยงามจากปอนด์ (สะสมจาก feedback prototype)
- หน้าจอเดิม "ดูไม่ professional" — ต้องยกระดับ UX/UI ทั้งระบบ
- ต้อง responsive
- ผู้ใช้ไม่เคยใช้ ERP → ใช้ง่าย นำทางตัวเองได้ อ่านออกทุกจุด (ห้ามแสดง enum/รหัสดิบ)
- ยังไม่ได้ระบุ: สีแบรนด์ / logo / โทน / ระบบ reference — UX/UI ต้องเสนอทางเลือกให้ปอนด์ตัดสินที่ Gate 1
