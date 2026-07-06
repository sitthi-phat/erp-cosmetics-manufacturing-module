# ADR-009: Thai Tax-Invoice Document Rendering & Printing Approach

- **สถานะ**: Accepted (Gate 2 rework — 2026-07-07)
- **วันที่**: 2026-07-07
- **ผู้ตัดสินใจ**: Tech-Lead
- **ขอบเขต**: วิธี render/พิมพ์เอกสาร "ใบแจ้งหนี้/ใบกำกับภาษี" (ECP-042) ให้ตรงตัวอย่างที่ปอนด์แนบ
  100% + กลไก snapshot ข้อมูลผู้ออก/ลูกค้า + ฟังก์ชันแปลงจำนวนเงินเป็นตัวอักษรไทย
- **อ้างอิง**: ADR-008 (frontend React+Vite+antd behind ui/), pond-gate2-feedback.md §เอกสารตัวอย่าง,
  user-stories.md ECP-041, ECP-042

## บริบท (Context)

ปอนด์ทดสอบ prototype แล้วไม่ approve Gate 2 หนึ่งใน feedback หลัก (ข้อ 10b) คือต้อง **ออกเอกสาร
ใบแจ้งหนี้/ใบกำกับภาษีตามรูปแบบมาตรฐานไทย** ตรงตามตัวอย่างที่แนบ (หัวสองภาษา + โลโก้ + ผู้ออก +
ลูกค้า + เลขที่/วันที่ + ตารางรายการ + subtotal/discount/VAT7%/grand total + จำนวนเงินตัวอักษรไทย +
ช่องลายเซ็น 2 ช่อง + พื้นที่ตรายาง) ต้องเลือกวิธี render/พิมพ์ที่ "เรียบง่ายพอสำหรับ prototype แต่
ตรงตัวอย่าง 100%" และไม่ปิดทาง Phase 2 local → Phase 3 GCP

มี 2 การตัดสินใจย่อยที่ผูกกัน:
1. **วิธีสร้างเอกสาร**: React print view + CSS `@media print` (browser print / Save-as-PDF) vs
   server-side PDF (puppeteer/pdfkit)
2. **กลไก snapshot**: ECP-041 AC2 (ที่อยู่บริษัทที่พิมพ์ไปแล้วต้องไม่เปลี่ยนย้อนหลัง) และ ECP-002
   AC4 (tax_id ลูกค้าบนใบเดิมไม่เปลี่ยนย้อนหลัง) — ต้องเก็บภาพ ณ เวลาออกเอกสาร

## การตัดสินใจ (Decision)

### 1) Render/พิมพ์ = **React print view + CSS `@media print`** (browser-native print → Save as PDF)

- สร้าง component `InvoiceDocument` (อยู่ใน `src/frontend/pages/invoice/` ประกอบจาก `ui/` wrapper +
  plain CSS สำหรับ print) render layout ตรงตามตัวอย่างปอนด์ทุกส่วน
- ผู้ใช้กด "พิมพ์/ดาวน์โหลด" → เปิด print view → `window.print()` → ผู้ใช้เลือก "Save as PDF" หรือ
  พิมพ์จริงจาก browser dialog
- ใช้ `@media print` stylesheet: ซ่อน chrome ของแอป (เมนู/ปุ่ม), บังคับ A4, สี/เส้นตารางตามตัวอย่าง

### 2) Snapshot = เก็บ JSON บน Invoice row ตอนออก/แก้ไข (revise) แต่ละ version

- เพิ่มคอลัมน์ `document_snapshot Json?` บน `Invoice` (ดู architecture.md §3.1 rev.3)
- ตอนออก v1 (ECP-020) และตอน revise สร้าง version ใหม่ (ECP-037): snapshot
  `{ issuer: {companyName,address,taxId,phone,logoUrl}, customer: {name,address,taxId,phone} }`
  จาก CompanyProfile + Customer ปัจจุบัน แล้ว **freeze ลง row นั้น**
- print อ่านจาก `document_snapshot` เสมอ → ที่อยู่/เลขภาษีที่พิมพ์ไปแล้วไม่เปลี่ยนย้อนหลัง (ECP-041
  AC2, ECP-002 AC4) — หลักการเดียวกับ `vat_rate_applied` snapshot ที่มีอยู่แล้ว (ADR-006/ECP-038)

### 3) Thai baht text = **pure function แยกไฟล์ + unit test** (ไม่พึ่ง UI/DB)

- `src/shared/thaiBahtText.ts` : `thaiBahtText(amount: number): string`
- deterministic ตามหลักภาษาไทย (หน่วย/สิบ/ร้อย/พัน/หมื่น/แสน/ล้าน, "เอ็ด"/"ยี่", สตางค์, "ถ้วน")
- รองรับ edge: 0 → "ศูนย์บาทถ้วน" (ECP-042 AC5), ทศนิยม 2 ตำแหน่งเป็นสตางค์, จำนวนเกินล้าน
- ไม่มีความกำกวมทางธุรกิจ → ไม่ต้องถามปอนด์ (ยืนยันไว้แล้วใน user-stories.md)

## ทางเลือกที่พิจารณา (Alternatives Considered)

- **Server-side PDF ด้วย puppeteer/headless-chromium** — คุม pagination/pixel ได้เป๊ะสุด และได้ไฟล์
  PDF archival จริง **แต่** เพิ่ม dependency หนัก (~300MB chromium), ทำ Docker image ใหญ่ + cold-start
  ช้าบน Cloud Run (Phase 3), ต้องจัดการ font ไทยฝั่ง server เพิ่ม — over-engineering สำหรับ prototype
  เอกสารหน้าเดียว; **ปฏิเสธ**
- **Server-side PDF ด้วย pdfkit (วาดเอง)** — ไม่มี chromium แต่ต้อง layout ด้วยมือทุก element +
  จัดการ font ไทย/การตัดบรรทัดเอง งานสูงและเปราะต่อการเทียบตัวอย่าง; **ปฏิเสธ**
- **library ใบกำกับภาษีสำเร็จรูป** — ผูก vendor/รูปแบบตายตัว ปรับให้ตรงตัวอย่างปอนด์ยาก; **ปฏิเสธ**
- **render live ไม่ snapshot** — ง่ายสุดแต่ **ละเมิด** ECP-041 AC2 / ECP-002 AC4 (เอกสารเก่าต้องคงค่าเดิม);
  **ปฏิเสธ**

## ผลที่ตามมา (Consequences)

- ไม่เพิ่ม dependency ฝั่ง server; ไม่กระทบ Docker/GCP portability (ADR-001 คงอยู่)
- ตรง ADR-008: print view ประกอบจาก `ui/` wrapper; print CSS เป็น plain CSS (อนุญาต ไม่ใช่ antd import
  นอก `ui/`)
- **ข้อจำกัดที่ยอมรับ**: การควบคุม pagination หลายหน้าอ่อนกว่า server PDF และผลลัพธ์ Save-as-PDF ขึ้นกับ
  browser ผู้ใช้ — ยอมรับได้เพราะ invoice prototype เป็นเอกสารหน้าเดียว/รายการไม่มาก และ DoD Gate 2 ให้
  ปอนด์ verify visual เทียบตัวอย่างจริงเป็นด่านสุดท้าย
- **ไม่ปิดทาง Phase 3**: ถ้าภายหลังต้องการ PDF archival ที่ server-generated (เก็บถาวร/ส่งอีเมล) เพิ่ม
  route server ได้โดย **ใช้ contract ข้อมูล invoice + `document_snapshot` เดิม** ไม่ต้อง redesign
- Engineer ต้องแยก `thaiBahtText` เป็น pure function ใน `src/shared/` เพื่อให้ QA unit-test ได้อิสระ
  (ECP-042 AC5)
- CompanyProfile ต้องถูกตั้งค่าก่อนพิมพ์ใบแรก มิฉะนั้น block (ECP-041 AC4); ลูกค้าต้องมี tax_id ก่อน
  พิมพ์ (ECP-042 AC4)
