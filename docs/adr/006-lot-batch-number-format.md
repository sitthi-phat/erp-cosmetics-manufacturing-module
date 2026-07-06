# ADR-006: Lot / Batch / Document Number Format

- **สถานะ**: Proposed — **ต้องให้ปอนด์ยืนยันที่ Human Gate 1** (BA ส่งต่อเป็น open item)
- **วันที่**: 2026-07-06
- **ผู้ตัดสินใจ**: Tech-Lead (เสนอ) / ปอนด์ (ยืนยัน format)
- **ขอบเขต**: รูปแบบเลขเอกสาร/lot/batch ทั้งระบบ

## บริบท (Context)

BA ระบุว่า **format ของ Lot number และ Batch number ยังไม่ถูกกำหนดจากปอนด์**
(Data Rules หมายเหตุเปิดข้อ 1) และให้ Tech-Lead เสนอ format กลางมายืนยัน ตัวเลขในตัวอย่าง
user story (เช่น `L2026-001`, `B2026-010`, `INV-0001`) เป็นเพียงตัวอย่างประกอบ ไม่ใช่ spec

ต้องแยก 2 ประเภท:
- **Lot number** = ผู้จำหน่ายเป็นคนกำหนดมา ผู้ใช้กรอกเอง (ECP-008) — ระบบไม่ควรบังคับ format
- **เลขที่ระบบออกให้เอง** = PO, Batch, Shipment, Invoice — ต้อง unique และควรมี format สม่ำเสมอ

## การตัดสินใจ (Decision) — เสนอเพื่อยืนยัน

| ประเภท | ที่มา | Format ที่เสนอ | ตัวอย่าง |
|---|---|---|---|
| Lot number | ผู้ใช้กรอก (จากผู้จำหน่าย) | **free text**, unique ต่อ material; ถ้าเว้นว่าง ระบบเสนอ default `L-YYYYMMDD-NNN` | `SUP-88123` หรือ `L-20260706-001` |
| Batch number | ระบบออก | `B-YYYYMMDD-NNN` (NNN = running ต่อวัน) | `B-20260706-001` |
| PO number | ระบบออก | `PO-YYYYMM-NNNN` (running ต่อเดือน) | `PO-202607-0001` |
| Shipment number | ระบบออก | `SH-YYYYMMDD-NNN` | `SH-20260706-001` |
| Invoice number | ระบบออก | `INV-YYYY-NNNNN` (running ต่อปี) | `INV-2026-00001` |

หลักการ implement:
- มี **`NumberSequence` service กลาง** (ตาราง `number_sequence` เก็บ counter ต่อ prefix ต่อ
  period) ออกเลขภายใน DB transaction เดียวกับการสร้างเอกสาร → กัน race/เลขซ้ำ
- Prefix/pattern เก็บเป็น config ไม่ hardcode กระจาย → ถ้าปอนด์อยากเปลี่ยน format แก้ที่เดียว

## ทางเลือกที่พิจารณา (Alternatives Considered)

- **ใช้ UUID/auto-increment ล้วน** — unique ง่ายแต่มนุษย์อ่าน/สื่อสารยาก ไม่เหมาะ GMP/เอกสารโรงงาน
- **บังคับ format Lot number ด้วย** — ปฏิเสธ: Lot มาจากผู้จำหน่ายภายนอก บังคับ format จะ block
  การรับของจริง (ขัด ECP-008)
- **ฝัง sequence ใน timestamp อย่างเดียว (ไม่มี counter)** — เสี่ยงชนกันถ้าออกหลายเลขในวินาที
  เดียว; ใช้ counter ต่อ period ปลอดภัยกว่า

## ผลที่ตามมา (Consequences)

- **ต้องการการยืนยันจากปอนด์**: (1) รับ format ที่เสนอหรือปรับ, (2) โดยเฉพาะว่าจะบังคับ format
  Lot number หรือปล่อย free text — ถ้าปอนด์ยืนยัน ให้บันทึกลง `CLAUDE.md` §Domain Knowledge
  ตามที่เตรียมช่องไว้
- ถ้าปอนด์ไม่ระบุ ระบบ implement ตาม default ข้างต้น (ไม่ block งาน Engineer — เป็น config
  เปลี่ยนภายหลังได้) แต่ **ควร acknowledge ที่ Gate 1**
