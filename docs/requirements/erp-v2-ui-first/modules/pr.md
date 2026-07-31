# Module — Purchase Request (PR — คำขอสั่งซื้อ)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE SPEC** (absorbs functional-spec `purchase-request.html` US-PR-01..03 · **★ + Gate-1 A4: purge stale C-codes (C15/C17) → r19 event name / queue-discovered r20 2026-07-31**)
Mockups: `mockups/purchase-request.html` · `mockups/pr-create.html`
กฎอ้างอิง: `po.md`/`so.md` (auto-open PR ส่วนขาด) · `goods-receipt.md` (GR→PR auto status) · deletion-policy (เอกสารการค้า void) · README §3 (**G8**) · **`comment-convention.md` (comment + change-history)** · **`numbering-on-save.md` (G8 — เลขออกตอนบันทึก, pr-create ตรง)** · **`non-functional.md` §7 / `platform.md` §7 (noti: PR auto-created = event r19 หมวด 1; PR fulfilled/partial จาก GR = queue-discovered)**

## สรุปภาษาไทย
คำขอสั่งซื้อวัตถุดิบ เกิด 2 ทาง: **auto จาก PO/SO-produce-to-stock ที่วัตถุดิบขาด (เฉพาะส่วนที่ขาด)** หรือ **ฝ่ายคลังสร้างตรง**. สถานะ: เปิดคำขอ → รับทราบ (manual) → รับบางส่วน (auto GR) → ของเข้าครบ (auto GR) → ปิดคำขอ (manual) · ยกเลิก (comment บังคับ). **แต่ละครั้งที่ขาดสร้าง PR ใบใหม่แยก ไม่รวมกับใบเดิม**. รับบางส่วนจาก GR → **เสนอสร้าง PR ใหม่ส่วนที่ขาด (รอ user review)**. เลข `PR-{NNNNNN}`. **★ pr-create ตรง: เลข PR ไม่โชว์ล่วงหน้า → ออก gapless ตอนบันทึกสำเร็จ + popup ยืนยัน (G8); ★ PR ที่ระบบ auto-สร้างจาก PO/SO = ออกเลขเองตอน generate (ไม่มี popup).** ลบไม่ได้ — void เท่านั้น. **★ มีช่องหมายเหตุ (comment) แก้ในที่ + เก็บประวัติการแก้ครบ (comment-convention.md) — วางไว้ในส่วน "ปรับสถานะ".** **★ แจ้งเตือน (r19): "PR auto-created" = noti หมวด 1 (Read Procurement/Stock); การเปลี่ยนสถานะ PR จาก GR (รับบางส่วน/ของเข้าครบ) = auto status = queue-discovered (ไม่ยิง noti แยก).**

---

## 1. Purpose
เป็นคำขอจัดซื้อวัตถุดิบเพื่อให้ฝ่ายคลัง/จัดซื้อดำเนินการทัน โดย PO ไม่ถูกบล็อกเมื่อวัตถุดิบขาด (warning-not-block) และให้สถานะสะท้อนของจริงจากการรับเข้า (GR).

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `purchase-request.html` | รายการ PR + filter สถานะ + search + เปลี่ยนสถานะ (รับทราบ/ปิด/ยกเลิก) + **comment ต่อ PR (+ "ประวัติการแก้ไข comment") — วางในส่วน "ปรับสถานะ"** |
| `pr-create.html` | สร้าง PR ตรง (วัตถุดิบ + จำนวน) + **ช่อง comment** · **★ ช่องเลข PR = "(ระบบออกให้เมื่อบันทึก)" (G8)** |

## 3. Fields
| ฟิลด์ | หน่วย/ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| เลข `PR-{NNNNNN}` | string | computed | gapless · **★ pr-create ตรง: ไม่โชว์บน create → ออกตอนบันทึกสำเร็จ + popup (G8); auto จาก PO/SO = ออกเลขเองตอน generate (ไม่มี popup)** |
| วัตถุดิบ | ref RM | editable | 1 PR = 1 วัตถุดิบ (ส่วนที่ขาด) |
| จำนวนที่ขอ | number + UOM | editable | auto = ส่วนที่ขาด (จาก PO/SO) |
| ที่มา | enum {auto จาก PO/SO, สร้างตรง} | computed | auto ผูก PO/SO ต้นทาง |
| ผูก PO/SO | ref (optional) | computed | เมื่อ auto |
| สถานะ | enum (§4) | mixed (auto/manual) | |
| comment (ยกเลิก) | text | editable | บังคับเมื่อยกเลิก |
| **★ หมายเหตุ (comment)** | free-text (ช่องเดียว) | **editable (แก้ในที่/overwrite)** | **แก้ทุกครั้งเก็บประวัติ + โผล่ trace — `comment-convention.md` (CC1–CC7)** · **คนละฟิลด์กับ "comment (ยกเลิก)"** · **UI วางในส่วน "ปรับสถานะ" (§4b)** |

## 4. Statuses / lifecycle
เปิดคำขอ → **รับทราบ (manual)** → **รับบางส่วน (auto GR) / ของเข้าครบ (auto GR)** → **ปิดคำขอ (manual)** · **ยกเลิก (comment บังคับ)**. ปิด/ยกเลิก = final. เอกสารการค้า → void เท่านั้น (เลข gapless คงอยู่ — G8/NS5).
> **★ comment (หมายเหตุทั่วไป) แก้ได้ทุกสถานะ** รวม ปิด/ยกเลิก (comment-convention.md §3).

## 4b. ★ Comment + change-history (ยึด `comment-convention.md`)
- **1 ช่อง comment free-text ต่อ PR** · แก้ในที่ (overwrite).
- **★ UI placement (per Pond):** comment control บน purchase-request วางไว้ **ในส่วน "ปรับสถานะ" (status-change section)** — **คนละฟิลด์กับ "comment (ยกเลิก)"**.
- ทุกครั้งที่แก้ → เก็บ **ใคร/เมื่อ/ค่าเดิม→ค่าใหม่** ผ่าน field-audit; หน้า PR แสดง **ค่าปัจจุบัน + "ประวัติการแก้ไข comment"**.
- การแก้ = activity-log event + **โผล่บน trace** (entity=PR, field=`comment`). `comment-convention.md`.

## 5. User Stories (absorbed) + AC สรุป
- **US-PR-01 (Must) — PR auto จาก PO วัตถุดิบขาด:** PO-185 ขาดกลีเซอรีน 6 กก. → ยืนยัน PO → gen PR-000031 (6 กก.) ผูก PO-185; โผล่ Stock+Production dashboard; **★ ยิง noti "PR auto-created" (r19 หมวด 1 → Read Procurement/Stock)**. **★ auto-create = ระบบออกเลข PR เอง (ไม่มี popup — G8/§3).** **Edge:** มี PR ค้างของวัตถุดิบเดิม → PO ใหม่ขาดอีก → **สร้าง PR ใบใหม่แยก**. **Error:** วัตถุดิบพอ → ไม่สร้าง PR.
- **US-PR-02 (Should) — สร้าง PR ตรง + รับทราบ/ปิด manual:** สร้าง PR-000028 (แอลกอฮอล์ 250 ล.) → "รับทราบ". **★ pr-create ตรง: กดบันทึก → ออกเลข PR gapless + popup ยืนยัน (G8/NS2–NS3).** **Edge:** ยกเลิก PR ที่ยังไม่รับของ + comment → ยกเลิก + trace. **Error:** ยกเลิกไม่ใส่ comment → error "ต้องระบุเหตุผล".
- **US-PR-03 (Must) — Fulfilled/Partially auto จาก GR:** PR-000031 (6 กก.) GR รับครบ → **"ของเข้าครบ" auto + ระบุ lot** (**★ auto status จาก GR = queue-discovered — Procurement/Stock เห็นบน list/dashboard, ไม่ยิง noti แยก**). **Edge:** PR-000028 (250 ล.) รับ 200 → "รับบางส่วน" + เสนอสร้าง PR-000032 (50 ล.) **รอ user review**. **Error:** GR line วัตถุดิบไม่ตรง PR → error "วัตถุดิบไม่ตรงกับคำขอ".

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ดู PR / list + **ดูประวัติ comment** | PR (Warehouse).**Read (R)** |
| สร้าง PR ตรง | PR.**Create (C)** |
| รับทราบ / ปิดคำขอ | PR.**Update (U)** |
| **แก้ไข comment (แก้ในที่)** | PR.**Update (U)** (เก็บประวัติ auto) |
| ยกเลิก PR (★ r20: min-level D; A/Admin ก็ได้ — `permission-matrix.md` §3) | PR.**Delete (D)** + comment |
> auto-create (จาก PO/SO) + auto-status (จาก GR) = ระบบทำ ไม่ต้อง permission ผู้ใช้.

## 7. Validations
- ยกเลิก = comment บังคับ.
- รับบางส่วน = เสนอ PR ใหม่ส่วนที่ขาด แต่ **สร้างเมื่อ user ยืนยัน** เท่านั้น.
- GR ที่อ้าง PR ต้องเป็นวัตถุดิบเดียวกัน.
- **★ pr-create ตรง: เลข PR ออกตอนบันทึกสำเร็จ (G8/NS2) — ร่างที่ไม่บันทึกไม่กินเลข (NS4).**
- **★ comment (หมายเหตุทั่วไป) = ไม่บังคับ** · แก้ได้ทุกสถานะ · ทุกการแก้ถูก audit (CC2/CC3).

## 8. Pagination / Search
- PR list: 20/หน้า (G1) · filter สถานะ · ค้นเลข PR / วัตถุดิบ / ช่วงวันที่ (G2).

## 9. Formulas
- จำนวนที่ขอ (auto) = `required − Available` ณ เวลายืนยัน PO/SO (ส่วนที่ขาด).
- partial ที่เหลือ = `PR qty − GR received qty` → เสนอ PR ใหม่.

## 10. Cross-links
- auto จาก → `po.md` §5, `so.md` (produce-to-stock). GR→สถานะ → `goods-receipt.md`. **★ noti: PR auto-created = r19 หมวด 1 (Read Procurement/Stock, `platform.md` §7 · `non-functional.md` §7); PR fulfilled/partial (จาก GR) = auto status = queue-discovered (ไม่ยิง noti แยก).**
- **★ เลขออกตอนบันทึก (pr-create ตรง) (G8) → `numbering-on-save.md` · gapless → `non-functional.md` §5 (D-F2).**
- **Comment + change-history → `comment-convention.md` · field-audit → `traceability.md` §4.**

## 11. Module changelog
- **Absorbed:** functional-spec `purchase-request.html` US-PR-01..03 (9 AC) verbatim ในความหมาย.
- **★ เพิ่ม (2026-07-29 — number-on-save G8, ปอนด์ cross-cutting):** **pr-create ตรง** — เลข PR ไม่โชว์บน create → ออก gapless ตอนบันทึก + popup. **PR auto จาก PO/SO = ออกเลขเองตอน generate (ไม่มี popup).**
- **★ เพิ่ม (2026-07-29 — comment cross-cutting feedback):** ช่อง **หมายเหตุ (comment)** แบบแก้ในที่ + เก็บประวัติ ต่อ PR.
- **★ บันทึก (2026-07-29 — UI placement, per Pond):** comment control วางในส่วน "ปรับสถานะ".
- **★ เพิ่ม (2026-07-31 — Gate-1 review reconciliation r20 · A4, ปอนด์):** **purge stale C-codes** (C15/C17) ใน US-PR-01/03 + cross-links → **PR auto-created = ชื่อ event r19 (noti หมวด 1, Read Procurement/Stock)**; **PR fulfilled/partial (auto จาก GR) = queue-discovered (ไม่ยิง noti แยก)**. §5/§10 + summary/header. ไม่มี C-code เหลือค้าง. **ใช้ view เดิม (`purchase-request.html` render จาก .md).**
- **คงเดิม:** สร้างใบใหม่ทุกครั้ง · partial→เสนอ PR ใหม่รอ review · ยกเลิก comment บังคับ · void ไม่ delete.
