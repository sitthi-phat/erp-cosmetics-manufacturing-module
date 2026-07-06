# ADR-007: Audit Log Design — Append-only Ledger + Central Interceptor

- **สถานะ**: Proposed (รอ Human Gate 1)
- **วันที่**: 2026-07-06
- **ผู้ตัดสินใจ**: Tech-Lead (เสนอ) / ปอนด์ (approve)
- **ขอบเขต**: Epic 8 (ECP-025, ECP-026) + ทุก action สำคัญทั่วระบบ

## บริบท (Context)

- ต้องบันทึกทุก login (สำเร็จ+ล้มเหลว, ECP-025) และทุก action สำคัญ (สร้าง PO, อนุมัติ Batch,
  ออก invoice, แก้ permission ... ECP-026)
- **audit log ต้อง append-only — ห้ามแก้/ลบแม้แต่ Admin** (ECP-026 AC3)
- ต้องค้นย้อนหลังด้วย user/ประเภท/ช่วงวันที่ และรองรับ >1,000 รายการแบบแบ่งหน้า (ECP-026 AC2)
- ถ้าเขียน log ล้มเหลวขณะ login ห้ามเงียบ (ECP-025 AC3)

## การตัดสินใจ (Decision)

- ตาราง **`AuditLog`**: `log_id, user_id, action_type, entity_type, entity_id, timestamp,
  detail (JSON)` — index บน `(action_type, timestamp)` และ `(user_id, timestamp)` เพื่อค้นเร็ว
- **Append-only บังคับหลายชั้น**:
  1. ไม่มี service/endpoint ใดที่ update/delete `AuditLog` (ไม่เขียน method เลย)
  2. เตรียม DB-level guard เป็น future hardening (revoke UPDATE/DELETE grant / trigger กัน)
     — prototype อย่างน้อยบังคับที่ชั้น app + ไม่มี UI ให้แก้
- **การเขียน log**:
  - Login/LoginFailed เขียนใน auth service โดยตรง
  - Action สำคัญเขียนผ่าน **`audit` middleware/interceptor กลาง** ที่ทำงานหลัง controller สำเร็จ
    (คอนฟิกว่า route ไหนเป็น auditable action) → ไม่ต้องโรย `audit.write()` กระจายทุกที่
- **ECP-025 AC3 (เขียน log ล้มเหลว)**: การเขียน audit ของ login พยายาม retry; ถ้ายังล้มเหลว
  ให้ log error ลง system log (stderr/ไฟล์ผ่าน logger) เพื่อ Admin ตรวจพบภายหลัง — ไม่ปล่อยเงียบ

## ทางเลือกที่พิจารณา (Alternatives Considered)

- **เขียน audit ในทุก service เอง (ad-hoc)** — เสี่ยงลืม/ไม่สม่ำเสมอ; ปฏิเสธ ใช้ interceptor กลาง
  (แต่ login/approve ที่ต้องการ detail เฉพาะยังเขียนตรงได้)
- **ส่ง audit ไป external logging (เช่น Cloud Logging) ตั้งแต่แรก** — over-engineer สำหรับ
  prototype ที่ต้องค้นในหน้า Admin; เก็บใน MySQL ตรงกว่า แต่โครงสร้างเปิดทางส่งออกภายหลัง (Phase 3)
- **Soft-delete audit** — ปฏิเสธ: ขัดหลัก append-only ของ ECP-026 AC3

## ผลที่ตามมา (Consequences)

- ทุก action สำคัญ (Create/Update/Approve/Cancel/Login) ต้อง map เข้า auditable list กลาง
- หน้า Admin audit log (ECP-026, ECP-033) เป็น read-only + filter + pagination
- ไม่มี API path ใดที่แก้/ลบ audit ได้ — QA ต้องทดสอบว่าเรียก DELETE/PUT ตรงก็ถูกปฏิเสธ
