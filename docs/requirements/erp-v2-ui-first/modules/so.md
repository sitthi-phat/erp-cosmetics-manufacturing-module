# Module — Sales Order (SO, Own-Brand)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29
กฎอ้างอิง: **D1** (เอกสาร/เลขแยก) · **D2** (2 sub-case) · **D8 v2** (prefill จาก Supply Planning · **★ พก batch count ที่เลือก**) · D12/D16 (FG จอง/ตัด FIFO per-Batch) · D18-2 (ไม่มี Quotation) · README §3/§4 (**G8**) · **`customer.md` §4.2 (hard block Disabled/Blacklist — เฉพาะโหมด ก ที่มีลูกค้า)** · **`bom.md` §5c (inactive-BOM/FG block — ทั้ง 2 โหมด)** · **`comment-convention.md` (comment + change-history)** · **`numbering-on-save.md` (G8 — เลขออกตอนบันทึก)** · **`supply-planning.md` §5/§5b (ที่มา prefill produce-to-stock + batch count)**
> โมดูลใหญ่ — sub-files แนะนำ: `so-sell-from-stock.md` (ก) · `so-produce-to-stock.md` (ข). รอบนี้รวมใน so.md.

## สรุปภาษาไทย
ใบสั่งขาย **Own-Brand** เอกสาร/เลขแยกจาก PO `SO-{YYYYMM}-{NNNNNN}` (คนละโมดูล, ไม่มี Quotation). 2 แบบ: **(ก) ขายจากสต็อก** = เลือกลูกค้า (customer dropdown), กด **"ยืนยันใบสั่งขาย (จอง FG)"** → ของมีในสต็อก → **จอง FG per-Batch + SO = พร้อมส่ง (Ready to Ship)** → รอในโมดูล **การจัดส่ง** → ตัด FG FIFO ตอน dispatch → DN/Invoice. **★ โหมด (ก): ลูกค้าสถานะ Disabled/Blacklist = เปิด/ยืนยัน SO ไม่ได้ (HARD block)** — เลือกไม่ได้ใน dropdown + บล็อกตอนยืนยัน. **(ข) ผลิตเก็บสต็อก** = **ไม่เลือกลูกค้า** (hard block ลูกค้าไม่เกี่ยว), ทำตัวเหมือนเปิด PO: BOM RM stock check → production; RM ขาด → สร้าง production order ได้ + **AUTO-open PR**; QC ผ่าน → FG เข้าคลัง → ขายภายหลังผ่าน (ก). **★ ถ้าโหมด (ข) มาจากปุ่ม "สั่งผลิต" ใน Supply Planning (D8 v2) → หน้าถูก PRE-FILL FG + จำนวนผลิต = จำนวน batch ที่ผู้ใช้เลือกใน modal × Batch Size** (batches × batch size = qty — `supply-planning.md` §5/§5b). **★ ทั้ง 2 โหมด: FG/BOM ที่ถูกตั้ง Inactive = เปิด SO ไม่ได้ (HARD block, คนละแหล่งกับลูกค้า — `bom.md` §5c)**. **★ เลข SO ไม่โชว์ล่วงหน้าบนหน้า create (แสดง "(ระบบออกให้เมื่อบันทึก)") → ออก gapless ตอนบันทึกสำเร็จ + popup ยืนยันแสดงเลข SO + สรุป (G8 · `numbering-on-save.md`)**. List ค้นด้วยเลข/ช่วงวันที่. **★ มีช่องหมายเหตุ (comment) แก้ในที่ + เก็บประวัติการแก้ครบ (comment-convention.md).**

---

## 1. Purpose
เปิด/จัดการคำสั่งขายแบรนด์ตัวเอง 2 โหมด: ขายของที่มีในสต็อก (a) และผลิตเพื่อเติมสต็อก (b, ไม่ผูกลูกค้า). แยกโมดูลจาก PO เพื่อไม่กระทบสาย OEM (D1/D17).

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `so-list.html` | list SO + filter (สถานะ, โหมด ก/ข) + **search เลข SO / ช่วงวันที่สร้าง** (G2) + 20/หน้า (G1) |
| `so-create.html` | สร้าง SO — สลับโหมด (ก) เลือกลูกค้า+FG / (ข) ไม่เลือกลูกค้า+ผลิต + **ช่อง comment** · **★ ช่องเลข SO = "(ระบบออกให้เมื่อบันทึก)" (G8)** |
| `so-detail.html` | รายละเอียด + lifecycle ตามโหมด + **comment ปัจจุบัน + "ประวัติการแก้ไข comment"** |

## 3. Fields
| ฟิลด์ | หน่วย/ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| เลข `SO-{YYYYMM}-{NNNNNN}` | string | computed (gapless ต่อเดือน) | แยกจาก PO (D1) · **★ ไม่โชว์บน create (แสดง "(ระบบออกให้เมื่อบันทึก)") → ออกตอนบันทึกสำเร็จ + popup (G8)** |
| โหมด | enum {ขายจากสต็อก(ก), ผลิตเก็บสต็อก(ข)} | editable | (ก) มีลูกค้า / (ข) ไม่มี (D2) |
| ลูกค้า | ref customer | editable (dropdown G4) | **(ก) บังคับ · (ข) ว่าง** · (ก) **Disabled/Blacklist เลือกไม่ได้ (§8)** |
| line items | (ก) FG + qty · (ข) FG(BOM) + qty ผลิต | editable | (ก) โชว์ FG Available ราย Batch (D16) · **(ข) prefill จาก Supply Planning = FG + qty = batch count × Batch Size (§6)** · **FG/BOM ต้อง Active — Inactive เลือกไม่ได้/บล็อก ทั้ง 2 โหมด (§8, `bom.md` §5c)** |
| FG Available (ราย Batch) | units | computed (read-only) | (ก) เท่านั้น — จาก FG stock |
| สถานะ | enum (§4) | mostly auto | ต่างกันตามโหมด |
| ราคา/ยอดรวม/VAT | THB | (ก) computed | (ข) ไม่มีลูกค้า/ราคาตอนนี้ |
| **★ หมายเหตุ (comment)** | free-text (ช่องเดียว) | **editable (แก้ในที่/overwrite)** | **แก้ทุกครั้งเก็บประวัติ ใคร/เมื่อ/เดิม→ใหม่ + โผล่ trace — `comment-convention.md` (CC1–CC7)** · ใช้ได้ทั้งโหมด ก/ข |

## 4. Statuses / lifecycle
### (ก) Sell-from-stock
```
ร่าง → ยืนยันใบสั่งขาย (จอง FG) ──► พร้อมส่ง (Ready to Ship) [จอง FG per-Batch]
     → [โมดูลการจัดส่ง] ตัด FG FIFO ราย Batch ตอน dispatch ──► ส่งถึงแล้ว
     → Invoice (อ้าง SO) → ชำระ · ยกเลิก SO = คืนจอง FG
```
### (ข) Produce-to-stock
```
ร่าง (ไม่เลือกลูกค้า) → ยืนยัน → BOM RM stock check → PRD ไม่ผูกลูกค้า
     → (RM ขาด) auto-open PR → ผลิต → QC ผ่าน → FG เข้าคลัง (per-Batch, D12)
     → ขายภายหลังผ่าน (ก)
```

## 5. ★ (ก) Sell-from-stock — RESOLVED flow (README §4)
1. `so-create` โหมด (ก) → **เลือกลูกค้าผ่าน customer search dropdown (G4)** (ค้นเบอร์/บริษัท/ผู้ติดต่อ/เบอร์ผู้ติดต่อ; โชว์สถานะ+credit term; ดู detail modal แล้วกลับไม่เสีย state). **★ ช่องเลข SO บนหน้านี้ = read-only "(ระบบออกให้เมื่อบันทึก)" (G8/NS1).**
   - **★ Hard block ลูกค้า Disabled/Blacklist (customer.md §4.2):** ลูกค้าสถานะ Disabled/Blacklist **ค้นเจอ+เห็นสถานะ แต่เลือกไม่ได้** (disabled option); ถ้าหลุดเข้ามาต้อง **บล็อกตอนยืนยันใบสั่งขาย** พร้อมข้อความ *"ลูกค้าสถานะ {Disabled/Blacklist} — เปิดใบสั่งขายไม่ได้"*. เป็น **HARD block** (ต่างจาก TYPE mismatch/FG ไม่พอ = เตือน).
2. เลือก FG ที่มีสต็อก → ระบบโชว์ **FG Available ราย Batch (FIFO, D16)**.
   - **★ Hard block FG Inactive (`bom.md` §5c):** FG ที่ถูกตั้ง **Inactive (ปิดใช้งาน)** **หายจาก dropdown เลือก FG**; ถ้าหลุดเข้ามา → **บล็อกตอนยืนยัน** ข้อความ *"สินค้านี้ปิดใช้งาน (Inactive) — เปิดใบสั่งขายไม่ได้"*. คนละแหล่งกับ block ลูกค้า. (FG stock เดิมที่มีอยู่ยัง trace/ดูได้ แต่เปิด SO ใหม่ขายไม่ได้.)
3. กด **"ยืนยันใบสั่งขาย (จอง FG)"** — **ความหมายที่ยืนยัน:** ของ **มี/พร้อมในสต็อก** →
   - **★ ออกเลข SO gapless ตอนบันทึก/ยืนยันสำเร็จ + popup ยืนยัน "เลข SO + สรุป (ลูกค้า/FG/จำนวน)" + ลิงก์ so-detail (G8/NS2–NS3).**
   - **จอง FG per-Batch** (มิเรอร์ RM reservation; reserved+, available−).
   - SO เปลี่ยนเป็น **พร้อมส่ง (Ready to Ship)**.
   - SO **รอในโมดูล "การจัดส่ง (การจัดส่ง/Delivery)"** เพื่อจัดรอบส่ง.
4. โมดูลการจัดส่งหยิบ SO เข้ารอบ → **ตัด FG FIFO ราย Batch** ตอน dispatch → ออก **DN อ้าง SO** → ส่งถึง.
5. ออก **Invoice อ้าง SO** (+ cost snapshot ที่ line, D10) → รับชำระ.
6. **ยกเลิก SO** ก่อน dispatch = **คืนจอง FG** (release).

## 5b. ★ Comment + change-history (ยึด `comment-convention.md`)
- **1 ช่อง comment free-text ต่อ SO** (ทั้งโหมด ก/ข) · แก้ได้จาก so-create (ตั้งค่าแรก) และ so-detail (แก้ทับ/overwrite).
- ทุกครั้งที่แก้ → เก็บ **ใคร/เมื่อ/ค่าเดิม→ค่าใหม่** ผ่าน field-audit เดิม; so-detail แสดง **ค่าปัจจุบัน + affordance "ประวัติการแก้ไข comment"** (popover/timeline).
- การแก้ comment = activity-log event ของ SO และ **โผล่บน trace** (entity=SO, field=`comment`). กติกาเต็ม = `comment-convention.md` (CC1–CC7) · คนละฟิลด์กับ "comment ตอนยกเลิก" (§8).

## 6. ★ (ข) Produce-to-stock — RESOLVED flow (README §4)
> **ทำตัวเหมือนเปิด PO** (แต่ไม่มีลูกค้า → **hard block Disabled/Blacklist ไม่เกี่ยวกับโหมดนี้** แต่ **hard block FG/BOM Inactive ยังบังคับ**):
1. `so-create` โหมด (ข) → **ไม่เลือกลูกค้า** → เลือก FG(BOM) + จำนวนที่จะผลิต. **★ ช่องเลข SO = "(ระบบออกให้เมื่อบันทึก)" (G8/NS1).**
   - **★ ที่มาการ prefill (จาก Supply Planning "สั่งผลิต", D8 v2):** ถ้ามาจากปุ่ม "สั่งผลิต" ใน modal ของ Supply Planning → หน้านี้ถูก **prefill** FG + **จำนวนผลิต = จำนวน batch (batch count) ที่ผู้ใช้ระบุใน modal × Batch Size** (batches × batch size = qty). ผู้ใช้ทวน/ยืนยัน. *(เดิม prefill = Suggested คงที่; ตอนนี้พก **batch count ที่เลือก** — `supply-planning.md` §5/§5b. FG ที่ Inactive จะไม่โผล่ใน Supply Planning ตั้งแต่แรก — `supply-planning.md` §4.)*
   - **★ Hard block FG/BOM Inactive (`bom.md` §5c):** เลือกได้เฉพาะ FG(BOM) ที่ **Active**; Inactive **หายจาก dropdown**/บล็อกตอนยืนยัน ข้อความ *"สูตร/สินค้าปิดใช้งาน (Inactive) — สั่งผลิตเก็บสต็อกไม่ได้"*.
2. ยืนยัน → **★ ออกเลข SO gapless ตอนบันทึกสำเร็จ + popup ยืนยัน "เลข SO + สรุป (FG/จำนวนผลิต)" (G8/NS2–NS3)** → แสดง **BOM raw-material stock check** (เทียบ Available).
3. ส่งงานเข้า **production** → สร้าง **PRD ไม่ผูกลูกค้า** (customerless).
4. **ถ้า RM ขาด** → ยังสร้าง production order ได้ (ไม่บล็อก) + **AUTO-open PR ไปคลัง** (ต่างจาก Quotation ที่ไม่ auto-PR; เหมือน PO).
5. ผลิต → QC ผ่าน → **FG เข้าคลัง per-Batch (D12)**.
6. FG พร้อมขายภายหลังผ่านโหมด (ก).
> **ที่มา produce-to-stock = เดียว** (หน้า SO produce-to-stock นี้). Supply Planning เป็นแค่ prefill (**พก batch count ที่เลือก**) — แก้ปัญหา PRD สองที่มา — README §5, ปิด U4.

## 7. Actions & Permissions (D14)
| ปุ่ม/action | Permission required (SO module) |
|---|---|
| ดู list/detail + **ดูประวัติ comment** | SO.**Read (R)** |
| สร้าง/แก้ SO (ก/ข) | SO.**Create/Update (C/U)** |
| **แก้ไข comment (แก้ในที่)** | SO.**Update (U)** (เก็บประวัติ auto — comment-convention.md) |
| **ยืนยันใบสั่งขาย (จอง FG)** [ก] | SO.**Update (U)** |
| ยืนยันผลิตเก็บสต็อก (→ PRD) [ข] | SO.**Create (C)** (สร้าง produce-to-stock PRD) |
| ยกเลิก SO (คืนจอง) | SO.**Delete/Approve (D/A)** + comment |
| ออก DN (อ้าง SO) | Shipping.**Create (C)** |
| ออก Invoice (อ้าง SO) | Invoice.**Create (C)** (Finance) |
| เปิด modal ลูกค้า [ก] | Customer.**Read (R)** |

## 8. Validations
- (ก) บังคับเลือกลูกค้า + FG มี Available พอ (ขาด = เตือน/บล็อกตามนโยบาย FG reserve; มิเรอร์ RM warning-not-block).
- **★ (ก) Hard block ลูกค้า Disabled/Blacklist (customer.md §4.2):** ห้ามเลือก/ยืนยันใบสั่งขายให้ลูกค้าสถานะ Disabled/Blacklist — **บล็อกจริง** + ข้อความชัด (แยกจาก FG-availability warning).
- **★ Hard block FG/BOM Inactive (bom.md §5c) — ทั้ง 2 โหมด:** ห้ามเลือก/ยืนยัน SO ที่ line อ้าง FG/BOM **Inactive (ปิดใช้งาน)** — **บล็อกจริง** + ข้อความ *"สูตร/สินค้าปิดใช้งาน"*. คนละแหล่งกับ block ลูกค้า. ไม่กระทบ SO เดิม/FG stock เดิม (เดินต่อ/trace ได้ — deletion-policy §2.4).
- (ข) ห้ามมีลูกค้า; ต้องมี FG(BOM) + จำนวนผลิต — **hard block Disabled/Blacklist ไม่เกี่ยว** (ไม่มีลูกค้า) · **hard block Inactive ยังบังคับ** · **★ ถ้า prefill มาจาก Supply Planning จำนวน = batch count × Batch Size (แก้ต่อได้ก่อนยืนยัน)**.
- **★ เลข SO ออกตอนบันทึก/ยืนยันสำเร็จเท่านั้น (G8/NS2) — ร่างที่ไม่บันทึกไม่กินเลข (NS4).**
- ยกเลิก = บังคับ comment.
- **★ comment (หมายเหตุทั่วไป) = ไม่บังคับ** · แก้ได้ทุกสถานะ · ทุกการแก้ถูก audit (comment-convention.md CC2/CC3) · คนละฟิลด์กับ comment ยกเลิก.

## 9. Pagination / Search
- so-list: 20/หน้า (G1) · search เลข SO **หรือ** ช่วงวันที่สร้าง (G2) · filter สถานะ + โหมด ก/ข.

## 10. Cross-links
- **D8 v2 prefill (FG + จำนวน = batch count × Batch Size) → `supply-planning.md` §5/§5b** · FG stock/FIFO → `stock.md` · DN/Invoice อ้าง SO → delivery-note/invoice (scope §10.1) · flow → `flows/ownbrand-flow.md`.
- **Hard block Disabled/Blacklist (โหมด ก) → `customer.md` §4.2.**
- **Inactive FG/BOM block (ทั้ง 2 โหมด) → `bom.md` §5c · `deletion-policy.md` §2.4.**
- **★ เลขออกตอนบันทึก (G8) → `numbering-on-save.md` · gapless → `non-functional.md` §5 (D-F2).**
- **Comment + change-history → `comment-convention.md` · field-audit → `traceability.md` §4.**

## 11. Module changelog
- **เพิ่ม:** date-range search (list) · customer dropdown (ก) · resolved (ก) Ready-to-Ship→Delivery flow · resolved (ข) auto-PR flow · prefill จาก Supply Planning (D8 v2).
- **★ เพิ่ม (2026-07-29 — number-on-save G8, ปอนด์ cross-cutting):** เลข SO **ไม่โชว์บน create → ออก gapless ตอนบันทึก/ยืนยันสำเร็จ + popup ยืนยัน (เลข + summary + ลิงก์ so-detail)** ทั้งโหมด ก/ข — §2/§3/§5/§6/§8/§10, ยึด `numbering-on-save.md` (G8/NS1–NS4).
- **★ เพิ่ม (2026-07-29 — customer feedback):** **hard block เปิด/ยืนยัน SO โหมด (ก) เมื่อลูกค้า Disabled/Blacklist** (§5/§8, ref customer.md §4.2) · โหมด (ข) ไม่เกี่ยว (ไม่มีลูกค้า).
- **★ เพิ่ม (2026-07-29 — comment cross-cutting feedback, PO module 3 review):** ช่อง **หมายเหตุ (comment)** แบบแก้ในที่ + **เก็บประวัติการแก้ครบ** บน so-create/so-detail (ทั้งโหมด ก/ข) — ยึด `comment-convention.md` (§3 field, §5b, §7 permission).
- **★ เพิ่ม (2026-07-29 — BOM module review, ปอนด์):** **hard block เปิด/ยืนยัน SO เมื่อ FG/BOM ที่อ้างถูกตั้ง Inactive — ทั้งโหมด ก และ ข** (§3/§5/§6/§8, ref `bom.md` §5c) — คนละแหล่งกับ block ลูกค้า; SO/FG stock เดิมเดินต่อ. FG Inactive ยังถูกกันออกจาก Supply Planning (ไม่โผล่ prefill โหมด ข).
- **★ เพิ่ม (2026-07-29 — Supply Planning module review, ปอนด์):** ระบุชัดว่า produce-to-stock SO ที่สร้างจากปุ่ม **"สั่งผลิต" ใน Supply Planning (D8 v2)** ตอนนี้ **พกจำนวน batch (batch count) ที่ผู้ใช้เลือกใน modal → จำนวนผลิต = batch count × Batch Size** (batches × batch size = qty) — §3/§6/§8/§10, ref `supply-planning.md` §5/§5b. เดิม prefill = Suggested คงที่; ตอนนี้พก batch count ที่เลือก (ผู้ใช้ยังทวน/แก้ได้ก่อนยืนยัน).
