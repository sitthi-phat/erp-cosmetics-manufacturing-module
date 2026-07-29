# Module — Purchase Order (PO, OEM)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29
Mockups: `mockups/po-list.html` · `mockups/po-create.html` · `mockups/po-detail.html`
กฎอ้างอิง: entity-status-map §1.2/§1.3 (2 ราง) · stock-reservation (จอง→ตัดจริง Option A) · D3 · D13 · D18 · README §3 (**G8**) · **`customer.md` §4.1/§4.2 (follow-up flag reuse + hard block Disabled/Blacklist)** · **`bom.md` §5c (inactive-BOM block)** · **`quotation.md` §6 (Convert-to-PO → QT=Confirmed, prefill 2 ทาง)** · **`production.md` §5c/§7.6 (edit-PO from production, under-production)** · **`comment-convention.md` (comment + change-history)** · **`numbering-on-save.md` (G8 — เลขออกตอนบันทึก)**

## สรุปภาษาไทย
ใบสั่งซื้อ OEM (รับจ้างผลิต, made-to-order). Create ("เปิดใบสั่งซื้อใหม่") เพิ่ม **customer search dropdown** (โชว์สถานะ+credit term, ดู detail แบบ modal แล้วกลับไม่เสีย state). **★ ลูกค้าสถานะ Disabled/Blacklist = เปิด/ยืนยัน PO ไม่ได้ (HARD block)**. **★ BOM/FG ที่ถูกตั้ง Inactive = เปิด PO ไม่ได้ (HARD block, `bom.md` §5c)**. line = BOM/วัตถุดิบตรง (RM-direct ยังผ่านขั้นผลิต D3). ยืนยัน PO = จองวัตถุดิบ (Reserve); ขาด → เตือน + auto PR (ไม่บล็อก). **★ เลข PO ไม่โชว์ล่วงหน้าบนหน้า create (แสดง "(ระบบออกให้เมื่อบันทึก)") → ออกเลข gapless ตอนบันทึกสำเร็จ + popup ยืนยันแสดงเลข PO + สรุป (G8 · `numbering-on-save.md`)** (รวมกรณี prefill จาก QT). รองรับ **origin ref "created from QT-…"** — มาจาก QT ที่ **ยืนยัน (Confirmed)** แล้ว, prefill ได้ **2 ทาง**; **loose reference → ไม่มี cascade** สองทาง. ผลิตเกิน → surplus เข้า FG ตอน "พร้อมส่ง" (D13). **★ การแก้ PO (ทุกที่ รวมจากบริบทการผลิต — under-production ที่ลดจำนวนสั่งให้ = ผลิตจริง) → raise ⚑ "ต้องติดตาม" ที่ลูกค้า (reuse Customer follow-up flag) ให้ Sale เห็น + audit ละเอียดระดับ field (ใคร/เมื่อ/เดิม→ใหม่) ทุกฟิลด์ที่แก้.** 2 ราง: fulfilment + billing (credit term 30/60/90 default 60). **★ มีช่องหมายเหตุ (comment) แก้ในที่ + เก็บประวัติการแก้ครบ (comment-convention.md).**

---

## 1. Purpose
เปิด/จัดการคำสั่งผลิต OEM ต่อ 1 ลูกค้า, ขับ lifecycle การผลิต+จัดส่ง (fulfilment) และการวางบิล+ชำระ (billing) แบบ 2 ราง.

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `po-list.html` | list PO + filter สถานะ + **search เลข PO / ช่วงวันที่สร้าง** (G2) + 20/หน้า (G1) + คอลัมน์ "🔗 จาก QT-…" ถ้ามี |
| `po-create.html` | เปิด PO ใหม่ (customer dropdown, line BOM/RM, material check + reserve, origin QT optional, **ช่อง comment**) · **★ ช่องเลข PO = "(ระบบออกให้เมื่อบันทึก)" (G8)** |
| `po-detail.html` | 2 ราง (fulfilment/billing) + PRD ต่อ line + เปลี่ยนสถานะ + surplus/actual qty (ผ่าน production) + **edit PO (→follow-up+audit §5.2)** + **comment ปัจจุบัน + "ประวัติการแก้ไข comment"** |

## 3. Fields
| ฟิลด์ | หน่วย/ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| เลข `PO-{YYYYMM}-{NNNNNN}` | string | computed (gapless) | **★ ไม่โชว์บน create (แสดง "(ระบบออกให้เมื่อบันทึก)") → ออกตอนบันทึกสำเร็จ + popup (G8)** · reopen คงเลขเดิม |
| ลูกค้า | ref customer | editable (dropdown G4) | โชว์สถานะ + credit term · **Disabled/Blacklist เลือกไม่ได้ (§7)** |
| origin `created from QT-…` | ref QT (optional, loose) | editable/computed | ว่างได้ (สร้างตรง D18-3); auto-fill เมื่อ Convert-to-PO / จาก banner ของ QT ที่ Confirmed · **loose ref: ยกเลิก QT ไม่กระทบ PO** |
| line items | list {item(BOM/RM), qty, ราคา/หน่วย} | editable | RM-direct ยังผ่านขั้นผลิต (D3) · **BOM/FG ต้อง Active (§7)** · **★ แก้ qty (เช่นลดจำนวนสั่งลงให้ = ผลิตจริง, under-production production.md §5c) → follow-up + audit (§5.2)** |
| วันที่ต้องการรับของ | date | editable | กรอกตอน create (รวมกรณี prefill จาก QT) · ใช้เป็นแกนค้น "ช่วงวันที่ต้องการรับของ" ในคิวผลิต (production.md §6) |
| credit term (rางบิล) | enum {30,60,90} วัน default 60 | editable | default จากลูกค้า, override รายใบแจ้งหนี้ได้ |
| สถานะ fulfilment | enum (§4) | mostly auto | Draft→Confirmed→In Production→Ready to Ship→In Delivery→Delivered→Cancelled |
| สถานะ billing | enum | Finance/auto | Not Invoiced→Invoiced→Paid→Overdue |
| ยอดรวม + VAT | THB | computed | |
| **★ หมายเหตุ (comment)** | free-text (ช่องเดียว) | **editable (แก้ในที่/overwrite)** | **แก้ทุกครั้งเก็บประวัติ ใคร/เมื่อ/เดิม→ใหม่ + โผล่ trace — `comment-convention.md` (CC1–CC7)** |

## 4. Statuses / lifecycle (entity-status-map §1.2/§1.3)
- **Fulfilment:** ร่าง (Draft) → **ยืนยันแล้ว (Confirmed)** [→ line เข้าคิว "รอรับงาน" + **จองวัตถุดิบ** (reserve, Option A)] → กำลังผลิต (In Production) → **พร้อมส่ง/พร้อมจัดส่ง (Ready to Ship)** → กำลังจัดส่ง (In Delivery) → ส่งถึงแล้ว (Delivered) · ยกเลิก (Cancelled)→reopen (คงเลข).
- **★ PO → พร้อมส่ง (Ready to Ship) = roll-up:** เกิดเมื่อ **ทุก PRD ของ PO กด "พร้อมส่ง" ครบ** (production.md §4/§5b) — จำนวนสั่งส่งลูกค้า, ส่วนเกิน→FG.
- **Billing:** ยังไม่วางบิล → วางบิลแล้ว (ออก invoice ได้ตั้งแต่ Confirmed) → ชำระแล้ว · เกินกำหนด (Overdue).
- **จอง/ตัดจริง:** Confirmed = จอง; **เริ่มผลิต = ตัดจริง (Consume, เลือก lot มี stock; หลาย lot = FIFO — production.md §5d, Option A)**. Cancel = release ที่ยังไม่ consume.
- **Surplus (D13):** ฝ่ายผลิตกรอก actual produced qty (≥ ordered); ตอน "พร้อมส่ง" ส่วนเกิน → FG stock (remark, ไม่ approve).
> **หมายเหตุ vs QT:** "PO Confirmed" (fulfilment ราง) ≠ "QT Confirmed (ยืนยัน)". เมื่อสร้าง PO จริง PO เริ่มที่ **Draft**.

## 5. ★ Create flow (delta)
1. เปิด `po-create` → **customer search dropdown (G4)** (ค้นเบอร์/บริษัท/ผู้ติดต่อ/เบอร์ผู้ติดต่อ; โชว์สถานะ+credit term; ดู detail แบบ modal แล้วกลับ **ไม่เสีย state ฟอร์ม**). **★ ช่องเลข PO บนหน้านี้ = read-only "(ระบบออกให้เมื่อบันทึก)" (G8/NS1).**
   - **★ Hard block ลูกค้า Disabled/Blacklist (customer.md §4.2):** เลือกไม่ได้ + บล็อกตอนบันทึก/ยืนยัน. **HARD block**.
2. (optional) field **"สร้างจากใบเสนอราคา"** = QT ต้นทาง (ว่าง = สร้างตรง; auto-fill เมื่อมาจาก Convert-to-PO พร้อม prefill line/qty/ราคา).
   - **★ Prefill มาได้ 2 ทาง (quotation.md §6):** (ก) กด "Convert to PO" บน QT → popup · (ข) ปุ่ม **"ไปสร้าง PO ด้วยข้อมูลนี้"** จาก banner บน QT ที่ Confirmed แต่ยังไม่มี PO. ทั้งสอง prefill line/qty/ราคา + ตั้ง origin `created from QT-…`.
   - **★ loose reference → ยกเลิก QT ไม่กระทบ PO และในทางกลับกัน.**
3. เพิ่ม line (BOM/RM). RM-direct → alert D3.
   - **★ Hard block BOM/FG Inactive (`bom.md` §5c):** หายจาก dropdown; หลุดเข้ามา → บล็อกตอนบันทึก/ยืนยัน. คนละแหล่งกับ block ลูกค้า.
4. material check เทียบ **Available (on_hand − reserved)** → ขาด = เตือน (ไม่บล็อก) + **auto-สร้าง PR ส่วนขาด**.
5. (optional) กรอก **หมายเหตุ (comment)** — ดู §5.1.
6. บันทึก (Draft) → **★ ระบบออกเลข PO gapless ตอนบันทึกสำเร็จ (G8/NS2) + popup ยืนยันแสดง "เลข PO + สรุป (ลูกค้า/จำนวน line/ยอดรวม + origin QT ถ้ามี)" + ลิงก์ดู po-detail (G8/NS3)** → ยืนยัน (Confirmed) = จองวัตถุดิบ.
> **★ ร่าง PO ที่ไม่ได้บันทึก = ไม่กินเลข (G8/NS4).** prefill จาก QT ก็ออกเลขตอนบันทึกเช่นเดียวกัน.

## 5.1 ★ Comment + change-history (ยึด `comment-convention.md`)
- **1 ช่อง comment free-text ต่อ PO** · แก้ได้จาก po-create (ตั้งค่าแรก) และ po-detail (แก้ทับ/overwrite).
- ทุกครั้งที่แก้ → เก็บ **ใคร/เมื่อ/ค่าเดิม→ค่าใหม่** ผ่าน field-audit เดิม; po-detail แสดง **ค่าปัจจุบัน + affordance "ประวัติการแก้ไข comment"**.
- การแก้ comment = activity-log event ของ PO และ **โผล่บน trace** (entity=PO, field=`comment`). กติกาเต็ม = `comment-convention.md`.
- comment นี้เป็น **คนละฟิลด์** กับ "comment ตอนยกเลิก/reopen" (บังคับเหตุผล §7) และ **คนละฟิลด์กับ audit การแก้ PO (§5.2)**.

## 5.2 ★ Edit PO → follow-up flag + field-level audit (รวมการแก้จากบริบทการผลิต) — ปอนด์สั่ง 2026-07-29
เมื่อ **PO ถูกแก้ไข** (แก้ line/qty/ราคา/ลูกค้า/วันที่/รายละเอียด) **ไม่ว่าจะแก้จากหน้า po-detail หรือจากบริบทการผลิต** (production management page — โดยเฉพาะ **under-production: ลดจำนวนสั่งลงให้ = จำนวนผลิตจริง**, production.md §5c/§7.6):
- **(1) ★ raise ⚑ "ต้องติดตาม (follow-up)" ที่ลูกค้าของ PO นั้น** — **reuse Customer follow-up flag** (`customer.md` §4.1) พร้อมเหตุผลอ้าง PO (เช่น "PO-… ถูกแก้ไข (ลดจำนวนสั่งจากการผลิตจริง)") + ใคร/เมื่อ → ให้ **Sale เห็นว่า PO ถูกแก้** (flag = ป้ายเตือน ไม่บล็อก).
- **(2) ★ audit ละเอียดระดับ field** — ทุกฟิลด์ที่แก้บันทึก **entity=PO / field / ค่าเดิม (old) → ค่าใหม่ (new) / ใคร / เมื่อ / เหตุผล** ผ่าน field-audit เดิม (`traceability.md` §4 · `non-functional.md` AU1) → ค้น/แสดงบน trace ได้ (แยกจากการแก้ `comment`). **★ การแก้ไม่ออกเลข PO ใหม่ — ใช้เลขเดิม (G8/NS6).**
- **(3) reservation/stock:** แก้จำนวน line → ปรับ reservation (delta) ตาม entity-status-map §1.6 (Hold/แก้ PO → adjust reservation).
- confirm popup ตอนบันทึกการแก้ (production.md §7.7 สำหรับการแก้จากหน้าผลิต).
- **สิทธิ์:** แก้ PO = **PO.Update (U)** ไม่ว่าจะทำจากหน้าใด (การแก้จากบริบทการผลิตยังเช็คสิทธิ์ PO.Update).

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required (PO module) |
|---|---|
| ดู list/detail + **ดูประวัติ comment / audit การแก้** | PO.**Read (R)** |
| เปิด PO ใหม่ / **แก้ PO (po-detail หรือจากบริบทการผลิต) → follow-up + audit (§5.2)** | PO.**Create/Update (C/U)** |
| ยืนยัน PO (→ จองวัตถุดิบ) | PO.**Update (U)** |
| **แก้ไข comment (แก้ในที่)** | PO.**Update (U)** (เก็บประวัติ auto) |
| ยกเลิก/reopen PO | PO.**Delete/Approve (D/A)** + comment |
| force override สถานะ (ข้ามลำดับ) | PO.**Admin** + เหตุผล |
| ออก invoice (billing) | Invoice.**Create (C)** (Finance) |
| เปิด modal ลูกค้า | Customer.**Read (R)** |
> surplus (D13) = auto ตอนพร้อมส่ง ไม่มี permission แยก (แจ้ง remark).

## 7. Validations
- ต้องมีลูกค้า + ≥1 line + ราคา/หน่วย.
- **★ Hard block ลูกค้า Disabled/Blacklist (customer.md §4.2):** ห้ามเลือก/บันทึก/ยืนยัน PO ให้ลูกค้าสถานะ Disabled/Blacklist — **บล็อกจริง**.
- **★ Hard block BOM/FG Inactive (bom.md §5c):** ห้ามเลือก/บันทึก/ยืนยัน PO ที่ line อ้าง BOM/FG **Inactive** — **บล็อกจริง**. ไม่กระทบ PO เดิมที่อ้าง BOM ก่อน inactivate.
- material ขาด = เตือน ไม่บล็อก (+ auto PR).
- **★ เลข PO ออกตอนบันทึกสำเร็จเท่านั้น (G8/NS2) — ร่างที่ไม่บันทึกไม่กินเลข (NS4); reopen/แก้ = เลขเดิม (NS6).**
- ยกเลิก = บังคับ comment; reopen = คงเลข PO เดิม (Draft).
- **★ การแก้ PO (ทุกที่ รวมจากการผลิต) → raise ⚑ follow-up ลูกค้า + audit ละเอียดระดับ field เสมอ (§5.2).** **under-production:** การลดจำนวนสั่งให้ = จำนวนผลิตจริง = การแก้ PO → follow-up + audit (production.md §5c).
- **★ comment (หมายเหตุทั่วไป) = ไม่บังคับ** · แก้ได้ทุกสถานะ · ทุกการแก้ถูก audit.

## 8. Pagination / Search
- po-list: 20/หน้า (G1) · search เลข PO **หรือ** ช่วงวันที่สร้าง (G2) · filter สถานะ + (แสดงลิงก์ QT).

## 9. Cross-links
- QT→PO → `quotation.md` §6 · reservation → stock-reservation · production/surplus/**edit-PO from production/under-production** → `production.md` §5c/§7.6 · flow → `flows/oem-flow.md`.
- **Hard block Disabled/Blacklist → `customer.md` §4.2 · follow-up flag reuse → `customer.md` §4.1.**
- **Inactive BOM/FG block → `bom.md` §5c · `deletion-policy.md` §2.4.**
- **★ เลขออกตอนบันทึก (G8) → `numbering-on-save.md` · gapless → `non-functional.md` §5 (D-F2).**
- **Comment + change-history → `comment-convention.md` · field-audit (PO edit + comment) → `traceability.md` §4 / `non-functional.md` AU1.**

## 10. Module changelog
- **เพิ่ม:** customer search dropdown (G4) บน po-create · date-range search po-list · origin QT ref.
- **★ เพิ่ม (2026-07-29 — number-on-save G8, ปอนด์ cross-cutting):** เลข PO **ไม่โชว์บน create → ออก gapless ตอนบันทึกสำเร็จ + popup ยืนยัน (เลข + summary + ลิงก์ po-detail)** — §2/§3/§5/§7/§9, ยึด `numbering-on-save.md` (G8/NS1–NS4/NS6). ครอบกรณี prefill จาก QT ด้วย; reopen/แก้ = เลขเดิม.
- **★ เพิ่ม (2026-07-29 — customer feedback):** **hard block เปิด/ยืนยัน PO เมื่อลูกค้า Disabled/Blacklist** (§5/§7).
- **★ อัปเดต (2026-07-29 — Quotation module review):** origin QT ref มาจาก QT ที่ **ยืนยัน (Confirmed)**; prefill 2 ทาง; loose ref → no cascade.
- **★ เพิ่ม (2026-07-29 — comment cross-cutting feedback):** ช่อง **หมายเหตุ (comment)** แบบแก้ในที่ + เก็บประวัติ.
- **★ เพิ่ม (2026-07-29 — BOM module review):** hard block เปิด/ยืนยัน PO เมื่อ BOM/FG Inactive.
- **★ เพิ่ม (2026-07-29 — Production module review, ปอนด์):** **§5.2 Edit PO → raise ⚑ follow-up ลูกค้า (reuse) + audit ละเอียดระดับ field (who/when/old→new)** — รวมการแก้จากบริบทการผลิต โดยเฉพาะ **under-production (ลดจำนวนสั่งให้ = ผลิตจริง)** (production.md §5c/§7.6). อัปเดต fulfilment status "พร้อมส่ง (Ready to Ship)" = roll-up เมื่อทุก PRD พร้อมส่ง (§4). CONSUME = เลือก lot มี stock; หลาย lot = FIFO (§4).
- **คงเดิม:** 2 ราง, reserve/consume (Option A), surplus (D13), RM-direct (D3).
