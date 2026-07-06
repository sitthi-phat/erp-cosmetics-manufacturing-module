# ADR-003: ORM & Database Access — Prisma

- **สถานะ**: Proposed (รอ Human Gate 1)
- **วันที่**: 2026-07-06
- **ผู้ตัดสินใจ**: Tech-Lead (เสนอ) / ปอนด์ (approve)
- **ขอบเขต**: data access layer ของ `erp-core-prototype` (MySQL ตาม ADR-000)

## บริบท (Context)

ระบบมี ~16 entity, ความสัมพันธ์เยอะ (PO→line→BOM→material→lot→batch...) และมี
transaction ที่ต้อง atomic ข้ามหลายตาราง (จองสต็อก, บันทึกผลิต) รวมถึงต้องมี schema
migration ที่ track ได้ (prototype จะแก้ schema บ่อยระหว่างสำรวจ user journey)

## การตัดสินใจ (Decision)

ใช้ **Prisma ORM** กับ MySQL

เหตุผล:
- **Type-safe** — generate TypeScript type จาก schema ตรงกับ ADR-002
- **Migration ในตัว** (`prisma migrate`) — track schema change เป็นไฟล์ version ได้ เหมาะกับ
  prototype ที่ schema เปลี่ยนบ่อย
- **`prisma.$transaction`** — รองรับ atomic multi-table write ที่ stock/production ต้องใช้
- **Portable** — ใช้ได้ทั้ง local MySQL (Phase 2) และ Cloud SQL for MySQL (Phase 3) โดยแก้แค่
  connection string ใน env (สอดคล้อง ADR-001)
- **Seed script** (`prisma db seed`) — ใช้ทำ mock/seed data ตามกลยุทธ์ใน architecture.md

## ทางเลือกที่พิจารณา (Alternatives Considered)

- **Sequelize** — mature แต่ type support อ่อนกว่า, migration verbose กว่า; ปฏิเสธ
- **Knex (query builder ล้วน)** — ยืดหยุ่นสูงแต่ต้องเขียน mapping/type เอง เพิ่มงาน; ปฏิเสธ
  เพราะ prototype ต้องการความเร็วในการพัฒนา
- **Raw SQL** — ปฏิเสธ: เสีย type safety, เสี่ยง SQL injection ถ้าทำเอง, migration ต้องจัดการเอง

## ผลที่ตามมา (Consequences)

- Repository layer wrap Prisma client (ไม่เรียก Prisma ตรงจาก controller) เพื่อคง boundary
- Business transaction ที่ต้อง atomic ต้องห่อด้วย `prisma.$transaction` ใน service layer
- Stock balance ที่อัปเดตแบบ real-time ต้องอยู่ในธุรกรรมเดียวกับ StockTransaction ledger
  (ดู ADR-004) — Prisma รองรับผ่าน interactive transaction
- DevOps ต้องรัน `prisma migrate deploy` ตอน deploy และ `prisma generate` ตอน build
