# Module — Production (การผลิต · PRD/Batch)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29
Mockups: `mockups/production.html` · `mockups/qc.html`
กฎอ้างอิง: entity-status-map §1.4/§1.5 (PRD/Batch) · stock-reservation (ตัดจริง Option A) · **D3** (RM-direct) · **D8 v2** (produce-to-stock PRD ไม่ผูกลูกค้า) · **D13** (actual qty + surplus) · **D15** (loss) · README §3

## สรุปภาษาไทย
คิวงานผลิต + PRD/Batch. Queue "คิวงานผลิต" **ค้นด้วย customer / PO / Own-Brand production order เลข หรือช่วงวันที่สร้าง** (G2), 20/หน้า (G1), **filter PO(OEM) vs Own-Brand production order**. รองรับ PRD ผูกลูกค้า (OEM) + PRD **ไม่ผูกลูกค้า** (produce-to-stock, D8 v2). ฝ่ายผลิตกรอก **จำนวนผลิตจริง (actual qty)** (D13); ตอน "พร้อมส่ง" ส่วนเกิน → FG stock (remark). loss = เหตุผลบังคับ ไม่อนุมัติ (D15). ตัดจริงตอน "เริ่มผลิต" (Option A, FIFO, ติดลบได้).

---

## 1. Purpose
รับงานจากคิว → สร้าง PRD (1/line) → เริ่มผลิต (gen Batch + ตัด RM) → ส่ง QC → พร้อมส่งมอบ; รองรับทั้ง OEM (ผูก PO/ลูกค้า) และ Own-Brand produce-to-stock (ไม่ผูกลูกค้า).

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `production.html` | คิวงานผลิต (รอรับงาน/รับงาน/กำลังผลิต/รอ QC/พร้อมส่งมอบ/Hold/Rework) + actual qty + surplus + loss |
| `qc.html` | ตรวจ Batch (ผ่าน/ไม่ผ่าน+feedback) — รวม Batch produce-to-stock ไม่ผูกลูกค้า (U1) |

## 3. Entities / Fields
| ฟิลด์ | ชนิด | หมายเหตุ |
|---|---|---|
| PRD `PRD-{YYYYMM}-{NNNNNN}` | computed | 1/line, ออกตอน "รับงาน" · ผูก PO(OEM) **หรือ** SO produce-to-stock (ไม่ผูกลูกค้า) |
| Batch `B-{PO}-{line}-{run}` | computed | ออกตอน "เริ่มผลิต", +run เมื่อ rework |
| **จำนวนผลิตจริง (actual produced qty)** | units, editable | D13 · อาจเกินจำนวนสั่ง |
| ส่วนเกิน (surplus) | units, computed | = actual − ordered (OEM) → FG stock ตอน "พร้อมส่ง" |
| loss | units + เหตุผล(บังคับ) | ตัด on_hand, ไม่อนุมัติ (D15) |
| แหล่งงาน | enum {PO(OEM), Own-Brand produce-to-stock} | ใช้ filter |

## 4. Statuses / lifecycle (entity-status-map §1.4/§1.5)
รอรับงาน → **รับงาน** (gen PRD) → **กำลังผลิต** (gen Batch + **ตัดจริง FIFO**, ติดลบได้ — Option A) → **รอ QC** → (QC ผ่าน) **พร้อมส่งมอบ** / (ไม่ผ่าน+feedback) **Rework** (gen Batch run+1) · **Hold** (บังคับ comment).
- **produce-to-stock PRD (ไม่ผูกลูกค้า):** QC ผ่าน → **FG เข้าคลัง per-Batch** (D12) แทนการส่งลูกค้า.
- **RM-direct (D3):** line วัตถุดิบตรงยังเดินผ่าน production flow (แปรรูปจริง optional).

## 5. ★ Actual qty + Surplus (D13)
- ระหว่างผลิต ฝ่ายผลิตกรอก **actual produced qty** (อาจ > สั่ง).
- ตอน transition → **"พร้อมส่ง (Ready to Ship)"**: ระบบยืนยัน จำนวนสั่ง → ส่งลูกค้า · ส่วนเกิน → **เพิ่ม FG stock อัตโนมัติ (per-Batch, คง Batch identity ผูก OEM Batch/PRD/PO)** + **remark** ("สต็อกเพิ่มจากการผลิตเกิน") — **ไม่ใช่ approval gate**.

## 6. ★ Production Queue — search/filter (delta)
- "คิวงานผลิต" **ค้นด้วย:** เลข customer / PO / Own-Brand production order **หรือ** ช่วงวันที่สร้าง (G2).
- **paginate 20/หน้า** (G1).
- **filter:** PO (OEM) **vs** Own-Brand production order.

## 7. Actions & Permissions (D14)
| ปุ่ม/action | Permission required (Production module) |
|---|---|
| ดูคิว/PRD/Batch | Production.**Read (R)** |
| รับงาน (gen PRD) | Production.**Update (U)** (หรือ Create @ PRD) |
| เริ่มผลิต (gen Batch + ตัด RM) | Production.**Update (U)** |
| กรอก actual qty / กด "พร้อมส่ง" | Production.**Update (U)** |
| บันทึก loss | Production.**Update (U)** + เหตุผล |
| ผลิตซ้ำ (rework) | Production.**Update (U)** |
| Hold | Production.**Update (U)** + comment |
| ตัดสิน QC (ผ่าน/ไม่ผ่าน) | **QC.Update (U)** (หน้า qc เท่านั้น) |
> surplus = auto (ไม่มี permission แยก).

## 8. Validations
- actual qty ≥ 0; surplus < 0 (ผลิตขาด) → ไม่ auto re-produce (คนกด "ผลิตซ้ำ", D15).
- loss = เหตุผลบังคับ.
- QC ไม่ผ่าน = feedback บังคับ.
- production ไม่มีปุ่มตัดสิน QC (เห็นผลเท่านั้น).

## 9. Pagination / Search
- คิวงานผลิต: 20/หน้า (G1) · search เลข (customer/PO/Own-Brand order) หรือช่วงวันที่ (G2) · filter OEM vs Own-Brand.

## 10. Cross-links
- FG-in/surplus → `stock.md` · produce-to-stock ที่มา → `so.md` §6 + `supply-planning.md` (D8 v2) · reservation/consume → stock-reservation · QC Batch → qc (U1).

## 11. Module changelog
- **เพิ่ม:** queue search (เลข/ช่วงวันที่) + filter OEM vs Own-Brand · (คงเดิม) actual qty/surplus (D13), PRD ไม่ผูกลูกค้า (D8 v2), loss (D15).
