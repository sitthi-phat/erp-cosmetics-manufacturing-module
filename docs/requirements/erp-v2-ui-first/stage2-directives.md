# Stage 2 Directives จากปอนด์ (สั่งล่วงหน้า) — 2026-07-08

คำสั่งเตรียมงาน Stage 2 (PO+BA+Tech-Lead: functional + non-functional requirements)
**เงื่อนไขสำคัญ: เข้าใจงาน + ถามคำถามได้ แต่ห้ามเริ่มทำ deliverable จนกว่า Gate 1 (หน้าตา) จะ approved**

## 1. BA
- เตรียม **User Stories + Acceptance Criteria** ที่ **map ตาม flow และหน้าจอที่ UX/UI เตรียมไว้**
  (mockups = spec — ทุก story ต้องอ้างหน้าจอ/element ที่มีจริงใน mockup + status journey ที่ PO นิยาม)
- ต้องครอบทั้ง **Happy case และ business/system exception** — ทุก exception ต้องมี flow รองรับ
  (เช่น วัตถุดิบขาด, QC ไม่ผ่าน, Hold, ลูกค้า reject/postpone, PR ค้าง, ราคา 0, supplier inactive)
- **ให้ PO review stories ก่อน** แล้วค่อยส่งให้ปอนด์ review

## 2. Tech-Lead
ออกแบบ 3 เรื่องให้รองรับ requirement **ทุก case**:
- **Security** (auth, RBAC+Admin permission 6 ระดับ, audit ระดับ field, สิทธิ์ Super User archive ฯลฯ)
- **API Spec** ครบทุก case (รวม exception flows, notification/deep link, dashboard drill-down)
- **Database Schema** รองรับทุก case (6 customer statuses, Shipment/DN 2 ชั้น, PR lifecycle,
  BOM cost snapshot, supplier-material price matrix, PO reopen คงเลขเดิม + trace ทุกการแก้ไข)

## ลำดับ review ของ Stage 2
BA stories → PO review → ปอนด์ review (Gate 2 = ปอนด์อนุมัติ requirements + NFR)
