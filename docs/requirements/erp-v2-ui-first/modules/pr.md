# Module — Purchase Request (PR — คำขอสั่งซื้อ)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE SPEC** (absorbs functional-spec `purchase-request.html` US-PR-01..03)
Mockups: `mockups/purchase-request.html` · `mockups/pr-create.html`
กฎอ้างอิง: `po.md`/`so.md` (auto-open PR ส่วนขาด) · `goods-receipt.md` (GR→PR auto status) · deletion-policy (เอกสารการค้า void) · README §3 (**G8**) · **`comment-convention.md` (comment + change-history)** · **`numbering-on-save.md` (G8 — เลขออกตอนบันทึก, pr-create ตรง)**

## สรุปภาษาไทย
คำขอสั่งซื้อวัตถุดิบ เกิด 2 ทาง: **auto จาก PO/SO-produce-to-stock ที่วัตถุดิบขาด (เฉพาะส่วนที่ขาด)** หรือ **ฝ่ายคลังสร้างตรง**. สถานะ: เปิดคำขอ → รับทราบ (manual) → รับบางส่วน (auto GR) → ของเข้าครบ (auto GR) → ปิดคำขอ (manual) · ยกเลิก (comment บังคับ). **แต่ละครั้งที่ขาดสร้าง PR ใบใหม่แยก ไม่รวมกับใบเดิม** (คำตอบปอนด์). รับบางส่วนจาก GR → **เสนอสร้าง PR ใหม่ส่วนที่ขาด (รอ user review)**. เลข `PR-{NNNNNN}`. **★ pr-create ตรง: เลข PR ไม่โชว์ล่วงหน้า (แสดง "(ระบบออกให้เมื่อบันทึก)") → ออก gapless ตอนบันทึกสำเร็จ + popup ยืนยันแสดงเลข PR + สรุป (G8 · `numbering-on-save.md`); ★ PR ที่ระบบ auto-สร้างจาก PO/SO = ออกเลขเองตอน generate (ไม่มี popup — ไม่มี user action).** ลบไม่ได้ — void เท่านั้น. **★ มีช่องหมายเหตุ (comment) แก้ในที่ + เก็บประวัติการแก้ครบ (comment-convention.md) — วางไว้ในส่วน "ปรับสถานะ" ของ purchase-request (per Pond).**

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
| **★ หมายเหตุ (comment)** | free-text (ช่องเดียว) | **editable (แก้ในที่/overwrite)** | **แก้ทุกครั้งเก็บประวัติ ใคร/เมื่อ/เดิม→ใหม่ + โผล่ trace — `comment-convention.md` (CC1–CC7)** · **คนละฟิลด์กับ "comment (ยกเลิก)"** ข้างบน · **UI วางในส่วน "ปรับสถานะ" (§4b)** |

## 4. Statuses / lifecycle
เปิดคำขอ → **รับทราบ (manual)** → **รับบางส่วน (auto GR) / ของเข้าครบ (auto GR)** → **ปิดคำขอ (manual)** · **ยกเลิก (comment บังคับ)**. ปิด/ยกเลิก = final. เอกสารการค้า → void เท่านั้น (ไม่ hard delete, เลข gapless คงอยู่ — G8/NS5).
> **★ comment (หมายเหตุทั่วไป) แก้ได้ทุกสถานะ** รวม ปิด/ยกเลิก (metadata — comment-convention.md §3).

## 4b. ★ Comment + change-history (ยึด `comment-convention.md`)
- **1 ช่อง comment free-text ต่อ PR** · แก้ในที่ (overwrite) จาก pr-create (ตั้งค่าแรก) และ purchase-request (แก้).
- **★ UI placement (per Pond):** comment control บน purchase-request วางไว้ **ในส่วน "ปรับสถานะ" (status-change section)** ของหน้า — ยังเป็น **คนละฟิลด์กับ "comment (ยกเลิก)"** ที่บังคับเหตุผลตอนยกเลิก; audit/trace ครบตามเดิม (UX/UI สร้าง UI นี้แล้ว — สะท้อนใน spec).
- ทุกครั้งที่แก้ → เก็บ **ใคร/เมื่อ/ค่าเดิม→ค่าใหม่** ผ่าน field-audit เดิม; หน้า PR แสดง **ค่าปัจจุบัน + affordance "ประวัติการแก้ไข comment"**.
- การแก้ = activity-log event + **โผล่บน trace** (entity=PR, field=`comment`). กติกาเต็ม = `comment-convention.md` (CC1–CC7) · **คนละฟิลด์** กับ "comment (ยกเลิก)" ที่บังคับเหตุผลตอนยกเลิก.

## 5. User Stories (absorbed) + AC สรุป
- **US-PR-01 (Must) — PR auto จาก PO วัตถุดิบขาด:** PO-185 ขาดกลีเซอรีน 6 กก. → ยืนยัน PO → gen PR-000031 (6 กก. = ส่วนที่ขาด) ผูก PO-185; โผล่ Stock+Production dashboard; ยิง noti (C15). **★ auto-create = ระบบออกเลข PR เอง (ไม่มี popup ออกเลข — G8/§3).** **Edge:** มี PR ค้างของวัตถุดิบเดิม → PO ใหม่ขาดอีก → **สร้าง PR ใบใหม่แยก** (ไม่รวมใบเดิม). **Error:** วัตถุดิบพอ → ไม่สร้าง PR.
- **US-PR-02 (Should) — สร้าง PR ตรง + รับทราบ/ปิด manual:** สร้าง PR-000028 (แอลกอฮอล์ 250 ล.) = เปิดคำขอ → "รับทราบ". **★ pr-create ตรง: กดบันทึก → ออกเลข PR gapless + popup ยืนยัน (เลข + วัตถุดิบ/จำนวน) (G8/NS2–NS3).** **Edge:** ยกเลิก PR ที่ยังไม่รับของ + comment → ยกเลิก + trace. **Error:** ยกเลิกไม่ใส่ comment → error "ต้องระบุเหตุผล".
- **US-PR-03 (Must) — Fulfilled/Partially auto จาก GR:** PR-000031 (6 กก.) GR รับครบ → "ของเข้าครบ" auto + ระบุ lot (C17). **Edge:** PR-000028 (250 ล.) รับ 200 → "รับบางส่วน" + เสนอสร้าง PR-000032 (50 ล.) **รอ user review**. **Error:** GR line วัตถุดิบไม่ตรง PR ที่อ้าง → error "วัตถุดิบไม่ตรงกับคำขอ" — ไม่ปิด PR.

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ดู PR / list + **ดูประวัติ comment** | PR (Warehouse).**Read (R)** |
| สร้าง PR ตรง | PR.**Create (C)** |
| รับทราบ / ปิดคำขอ | PR.**Update (U)** |
| **แก้ไข comment (แก้ในที่)** | PR.**Update (U)** (เก็บประวัติ auto — comment-convention.md) |
| ยกเลิก PR | PR.**Delete (D)** / **Update** + comment |
> auto-create (จาก PO/SO) + auto-status (จาก GR) = ระบบทำ ไม่ต้อง permission ผู้ใช้.

## 7. Validations
- ยกเลิก = comment บังคับ.
- รับบางส่วน = เสนอ PR ใหม่ส่วนที่ขาด แต่ **สร้างเมื่อ user ยืนยัน** เท่านั้น.
- GR ที่อ้าง PR ต้องเป็นวัตถุดิบเดียวกัน.
- **★ pr-create ตรง: เลข PR ออกตอนบันทึกสำเร็จ (G8/NS2) — ร่างที่ไม่บันทึกไม่กินเลข (NS4).**
- **★ comment (หมายเหตุทั่วไป) = ไม่บังคับ** · แก้ได้ทุกสถานะ · ทุกการแก้ถูก audit (comment-convention.md CC2/CC3) · คนละฟิลด์กับ comment ยกเลิก.

## 8. Pagination / Search
- PR list: 20/หน้า (G1) · filter สถานะ · ค้นเลข PR / วัตถุดิบ / ช่วงวันที่ (G2).

## 9. Formulas
- จำนวนที่ขอ (auto) = `required − Available` ณ เวลายืนยัน PO/SO (ส่วนที่ขาด).
- partial ที่เหลือ = `PR qty − GR received qty` → เสนอ PR ใหม่.

## 10. Cross-links
- auto จาก → `po.md` §5, `so.md` (produce-to-stock). GR→สถานะ → `goods-receipt.md`. noti C15/C17 → continuity.
- **★ เลขออกตอนบันทึก (pr-create ตรง) (G8) → `numbering-on-save.md` · gapless → `non-functional.md` §5 (D-F2).**
- **Comment + change-history → `comment-convention.md` · field-audit → `traceability.md` §4.**

## 11. Module changelog
- **Absorbed:** functional-spec `purchase-request.html` US-PR-01..03 (9 AC) verbatim ในความหมาย.
- **★ เพิ่ม (2026-07-29 — number-on-save G8, ปอนด์ cross-cutting):** **pr-create ตรง** — เลข PR ไม่โชว์บน create → ออก gapless ตอนบันทึกสำเร็จ + popup ยืนยัน (เลข + วัตถุดิบ/จำนวน) — §2/§3/§5/§7/§10, ยึด `numbering-on-save.md`. **PR auto จาก PO/SO = ออกเลขเองตอน generate (ไม่มี popup — ไม่มี user action).**
- **★ เพิ่ม (2026-07-29 — comment cross-cutting feedback, PO module 3 review):** ช่อง **หมายเหตุ (comment)** แบบแก้ในที่ + **เก็บประวัติการแก้ครบ** ต่อ PR — ยึด `comment-convention.md` (§3 field, §4b, §6 permission). คนละฟิลด์กับ "comment (ยกเลิก)".
- **★ บันทึก (2026-07-29 — UI placement, per Pond):** comment control บน purchase-request วางไว้ **ในส่วน "ปรับสถานะ" (status-change section)** — ยังเป็นคนละฟิลด์กับ cancel-reason ที่บังคับ; audit/trace ครบ (UX/UI สร้างแล้ว — reflect ใน spec §2/§3/§4b).
- **คงเดิม:** สร้างใบใหม่ทุกครั้ง (ไม่รวมใบเดิม) · partial→เสนอ PR ใหม่รอ review · ยกเลิก comment บังคับ · void ไม่ delete.
