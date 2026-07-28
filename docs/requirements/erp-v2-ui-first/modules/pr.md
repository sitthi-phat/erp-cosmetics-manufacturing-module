# Module — Purchase Request (PR — คำขอสั่งซื้อ)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE SPEC** (absorbs functional-spec `purchase-request.html` US-PR-01..03)
Mockups: `mockups/purchase-request.html` · `mockups/pr-create.html`
กฎอ้างอิง: `po.md`/`so.md` (auto-open PR ส่วนขาด) · `goods-receipt.md` (GR→PR auto status) · deletion-policy (เอกสารการค้า void) · README §3

## สรุปภาษาไทย
คำขอสั่งซื้อวัตถุดิบ เกิด 2 ทาง: **auto จาก PO/SO-produce-to-stock ที่วัตถุดิบขาด (เฉพาะส่วนที่ขาด)** หรือ **ฝ่ายคลังสร้างตรง**. สถานะ: เปิดคำขอ → รับทราบ (manual) → รับบางส่วน (auto GR) → ของเข้าครบ (auto GR) → ปิดคำขอ (manual) · ยกเลิก (comment บังคับ). **แต่ละครั้งที่ขาดสร้าง PR ใบใหม่แยก ไม่รวมกับใบเดิม** (คำตอบปอนด์). รับบางส่วนจาก GR → **เสนอสร้าง PR ใหม่ส่วนที่ขาด (รอ user review)**. เลข `PR-{NNNNNN}`. ลบไม่ได้ — void เท่านั้น.

---

## 1. Purpose
เป็นคำขอจัดซื้อวัตถุดิบเพื่อให้ฝ่ายคลัง/จัดซื้อดำเนินการทัน โดย PO ไม่ถูกบล็อกเมื่อวัตถุดิบขาด (warning-not-block) และให้สถานะสะท้อนของจริงจากการรับเข้า (GR).

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `purchase-request.html` | รายการ PR + filter สถานะ + search + เปลี่ยนสถานะ (รับทราบ/ปิด/ยกเลิก) |
| `pr-create.html` | สร้าง PR ตรง (วัตถุดิบ + จำนวน) |

## 3. Fields
| ฟิลด์ | หน่วย/ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| เลข `PR-{NNNNNN}` | string | computed | gapless |
| วัตถุดิบ | ref RM | editable | 1 PR = 1 วัตถุดิบ (ส่วนที่ขาด) |
| จำนวนที่ขอ | number + UOM | editable | auto = ส่วนที่ขาด (จาก PO/SO) |
| ที่มา | enum {auto จาก PO/SO, สร้างตรง} | computed | auto ผูก PO/SO ต้นทาง |
| ผูก PO/SO | ref (optional) | computed | เมื่อ auto |
| สถานะ | enum (§4) | mixed (auto/manual) | |
| comment (ยกเลิก) | text | editable | บังคับเมื่อยกเลิก |

## 4. Statuses / lifecycle
เปิดคำขอ → **รับทราบ (manual)** → **รับบางส่วน (auto GR) / ของเข้าครบ (auto GR)** → **ปิดคำขอ (manual)** · **ยกเลิก (comment บังคับ)**. ปิด/ยกเลิก = final. เอกสารการค้า → void เท่านั้น (ไม่ hard delete).

## 5. User Stories (absorbed) + AC สรุป
- **US-PR-01 (Must) — PR auto จาก PO วัตถุดิบขาด:** PO-185 ขาดกลีเซอรีน 6 กก. → ยืนยัน PO → gen PR-000031 (6 กก. = ส่วนที่ขาด) ผูก PO-185; โผล่ Stock+Production dashboard; ยิง noti (C15). **Edge:** มี PR ค้างของวัตถุดิบเดิม → PO ใหม่ขาดอีก → **สร้าง PR ใบใหม่แยก** (ไม่รวมใบเดิม). **Error:** วัตถุดิบพอ → ไม่สร้าง PR.
- **US-PR-02 (Should) — สร้าง PR ตรง + รับทราบ/ปิด manual:** สร้าง PR-000028 (แอลกอฮอล์ 250 ล.) = เปิดคำขอ → "รับทราบ". **Edge:** ยกเลิก PR ที่ยังไม่รับของ + comment → ยกเลิก + trace. **Error:** ยกเลิกไม่ใส่ comment → error "ต้องระบุเหตุผล".
- **US-PR-03 (Must) — Fulfilled/Partially auto จาก GR:** PR-000031 (6 กก.) GR รับครบ → "ของเข้าครบ" auto + ระบุ lot (C17). **Edge:** PR-000028 (250 ล.) รับ 200 → "รับบางส่วน" + เสนอสร้าง PR-000032 (50 ล.) **รอ user review**. **Error:** GR line วัตถุดิบไม่ตรง PR ที่อ้าง → error "วัตถุดิบไม่ตรงกับคำขอ" — ไม่ปิด PR.

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ดู PR / list | PR (Warehouse).**Read (R)** |
| สร้าง PR ตรง | PR.**Create (C)** |
| รับทราบ / ปิดคำขอ | PR.**Update (U)** |
| ยกเลิก PR | PR.**Delete (D)** / **Update** + comment |
> auto-create (จาก PO/SO) + auto-status (จาก GR) = ระบบทำ ไม่ต้อง permission ผู้ใช้.

## 7. Validations
- ยกเลิก = comment บังคับ.
- รับบางส่วน = เสนอ PR ใหม่ส่วนที่ขาด แต่ **สร้างเมื่อ user ยืนยัน** เท่านั้น.
- GR ที่อ้าง PR ต้องเป็นวัตถุดิบเดียวกัน.

## 8. Pagination / Search
- PR list: 20/หน้า (G1) · filter สถานะ · ค้นเลข PR / วัตถุดิบ / ช่วงวันที่ (G2).

## 9. Formulas
- จำนวนที่ขอ (auto) = `required − Available` ณ เวลายืนยัน PO/SO (ส่วนที่ขาด).
- partial ที่เหลือ = `PR qty − GR received qty` → เสนอ PR ใหม่.

## 10. Cross-links
- auto จาก → `po.md` §5, `so.md` (produce-to-stock). GR→สถานะ → `goods-receipt.md`. noti C15/C17 → continuity.

## 11. Module changelog
- **Absorbed:** functional-spec `purchase-request.html` US-PR-01..03 (9 AC) verbatim ในความหมาย.
- **คงเดิม:** สร้างใบใหม่ทุกครั้ง (ไม่รวมใบเดิม) · partial→เสนอ PR ใหม่รอ review · ยกเลิก comment บังคับ · void ไม่ delete.
