# ADR-001: Application Architecture — Modular Monolith, Local-first & GCP-portable

- **สถานะ**: Proposed (รอ Human Gate 1)
- **วันที่**: 2026-07-06
- **ผู้ตัดสินใจ**: Tech-Lead (เสนอ) / ปอนด์ (approve)
- **ขอบเขต**: `erp-core-prototype` และเป็นแนวสถาปัตยกรรมตั้งต้นของทั้งโปรเจกต์

## บริบท (Context)

ระบบเป็น ERP order-to-cash ที่มี 10 โดเมนย่อย (Customer, PO, Stock, Production, QA/QC,
Shipping, Invoice, User/RBAC, Audit, Dashboard) ที่ผูกกันแน่นด้วย workflow เดียว
(PO → stock → ผลิต → QC → จัดส่ง → invoice) และมี transaction ข้ามโดเมนที่ต้อง atomic
(เช่น ยืนยัน PO = จองสต็อก + เขียน ledger + audit ในธุรกรรมเดียว)

Roadmap: **Phase 2 รันบน local PC ก่อน → Phase 3 ย้ายขึ้น GCP** — สถาปัตยกรรมห้ามปิดทางนี้

## การตัดสินใจ (Decision)

ใช้ **Modular Monolith** (Node.js เดี่ยว 1 process ต่อ 1 React SPA) แบ่งเป็น module ตามโดเมน
ภายใน codebase เดียว ไม่แตกเป็น microservices ในรอบ prototype

โครงเป็น layered ต่อ module: `route → controller → service → repository (Prisma)` โดย
business logic ที่ข้ามโดเมน (เช่น stock reservation) อยู่ใน service layer ที่เรียกข้าม module ได้

หลักการที่บังคับเพื่อคง GCP path (Phase 3):
1. **Stateless application** — ไม่เก็บ session/ไฟล์บน local disk ของ app; state อยู่ใน MySQL เท่านั้น
2. **Config ผ่าน environment variable** (12-factor) — DB host, JWT secret, port อ่านจาก `.env`
   ไม่ hardcode → ย้ายไป Cloud Run + Cloud SQL ได้โดยไม่แก้โค้ด
3. **Containerizable** — มี Dockerfile ตั้งแต่ Phase 2 (รันบน local ด้วย Docker Compose ได้)
4. ไม่ผูกกับ local-only dependency (ไม่มี native binary เฉพาะเครื่อง)

## ทางเลือกที่พิจารณา (Alternatives Considered)

- **Microservices ตั้งแต่ต้น** — ปฏิเสธ: over-engineer สำหรับ prototype ทีมเล็ก, transaction
  ข้ามโดเมนต้องทำ distributed transaction/saga โดยไม่จำเป็น, เพิ่ม ops cost มหาศาล
- **Serverless functions (แยก function ต่อ endpoint)** ตั้งแต่ Phase 2 — ปฏิเสธ: WebSocket
  สำหรับ real-time stock ทำยากบน function model, local dev ซับซ้อนขึ้น, ยังไม่จำเป็น
- **Modular Monolith (เลือก)** — คุมง่ายที่สุดสำหรับ prototype, transaction atomic ตรงไปตรงมา,
  ถ้าอนาคตต้องแตกบริการ ขอบเขต module ที่แบ่งไว้แล้วเป็นเส้นตัดที่ชัดเจน

## ผลที่ตามมา (Consequences)

- Engineer พัฒนาใน repo เดียว, deploy ชิ้นเดียว — เร็วสำหรับ prototype
- ต้องมีวินัยเรื่อง module boundary (ห้าม service เรียก repository ของ module อื่นตรงๆ
  ให้เรียกผ่าน service ของ module นั้น) เพื่อคงเส้นแบ่งไว้สำหรับ Phase 3
- DevOps เตรียม Docker (Node + MySQL) ตั้งแต่ Phase 2; Phase 3 = Cloud Run + Cloud SQL
- การ scale out หลาย instance ต้องแก้เรื่อง WebSocket adapter (ดู ADR-004) — บันทึกไว้เป็น
  future work ไม่ทำใน prototype
