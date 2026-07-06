# ADR-000: Core Tech Stack — React + Node.js + MySQL

- **สถานะ**: Accepted
- **วันที่**: 2026-07-06
- **ผู้ตัดสินใจ**: ปอนด์ (Engineering Manager / Final Approver)
- **ขอบเขต**: ทุก feature ในโปรเจกต์ ERP Cosmetics Factory (เริ่มจาก `erp-core-prototype`)

## บริบท (Context)

โปรเจกต์นี้พัฒนาระบบ ERP สำหรับโรงงานผลิตเครื่องสำอาง เริ่มจาก prototype
ครอบคลุม flow order-to-cash (ลูกค้า → PO → stock/สูตร → ผลิต → จัดส่ง → invoice)
พร้อม User Management, audit log และ dashboard ตามส่วนงาน
ทีมต้องการ stack กลางที่ทุก agent (Tech-Lead, Engineer, QA, DevOps) ใช้ร่วมกัน
เพื่อไม่ต้องตัดสินใจซ้ำในทุก feature

## การตัดสินใจ (Decision)

ปอนด์กำหนด tech stack หลักของโปรเจกต์ดังนี้:

| Layer | เทคโนโลยี |
|---|---|
| Frontend | **React** (web application) |
| Backend | **Node.js** |
| Database | **MySQL** |

## ผลที่ตามมา (Consequences)

- Tech-Lead ออกแบบสถาปัตยกรรมบน stack นี้ — ไม่ต้องเสนอ/เปรียบเทียบ stack ทางเลือกอีก
  (รายละเอียดรอง เช่น framework ฝั่ง backend, ORM, UI library, state management
  ยังเป็นอำนาจตัดสินใจของ Tech-Lead ผ่าน ADR ฉบับถัดไป)
- Engineer เขียนโค้ดเป็น JavaScript/TypeScript ทั้ง frontend และ backend
- DevOps เตรียม environment สำหรับ Node.js runtime + MySQL
- การเปลี่ยน stack หลักในอนาคตต้องออก ADR ใหม่และให้ปอนด์ approve เท่านั้น

## ทางเลือกที่พิจารณา (Alternatives Considered)

ไม่มีการเปรียบเทียบทางเลือกอย่างเป็นทางการ — เป็นการตัดสินใจโดยตรงของปอนด์
(stakeholder / final approver) ตามความคุ้นเคยของทีมและความเหมาะสมกับ prototype
