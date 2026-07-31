# Module — Purchase Order (PO, OEM)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 (**+ DN→PO status link 2026-07-30 · + Invoice one-active link 2026-07-30 · + PO document print 2026-07-31 · ★ + Gate-1 reconciliation r20 2026-07-31: (C3) cancel blocked while active DN · (C4 ⭐ CRITICAL) OEM sell-from-stock — PO fulfilled by selecting existing OEM FG from stock**)
Mockups: `mockups/po-list.html` · `mockups/po-create.html` (**★ C4: +option "เลือก OEM FG จากสต็อก"**) · `mockups/po-detail.html`
กฎอ้างอิง: entity-status-map §1.2/§1.3 (2 ราง) · stock-reservation (จอง→ตัดจริง Option A) · D3 · **D13 (surplus → FG stock; ★ C4: OEM surplus FG = OEM identity, sellable bucket)** · D18 · README §3 (**G8**) · **`customer.md` §4.1/§4.2 (follow-up flag reuse + hard block Disabled/Blacklist)** · **`bom.md` §5c (inactive-BOM block)** · **`quotation.md` §6 (Convert-to-PO → QT=Confirmed, prefill 2 ทาง)** · **`production.md` §5c/§7.6 (edit-PO from production, under-production)** · **`comment-convention.md` (comment + change-history)** · **`numbering-on-save.md` (G8 — เลขออกตอนบันทึก)** · **★ `delivery-note.md` §8 / `shipping.md` §4b (PO delivery status = สะท้อนจาก DN · cancel blocked while active DN §4d)** · **★ `invoice.md` §4b (billing rail = สะท้อนใบ active; 1 PO หลายใบ active ทีละใบ)** · **★ C4: `stock.md` §4 / `production.md` §5b (OEM FG bucket = OEM identity, sellable) · `oem-flow.md` (sell-from-stock variant)**

## สรุปภาษาไทย
ใบสั่งซื้อ OEM (รับจ้างผลิต). **★ 2 เส้นทาง fulfilment (C4 ⭐ CRITICAL — ปอนด์ 2026-07-31):** **(1) made-to-order (เดิม)** = เปิด PO → ผลิตตามสั่ง; **(2) ★ sell-from-stock (ใหม่)** = OEM PO บางส่วน/ทั้งหมด **fulfil ได้ด้วยการ "เลือก OEM FG ที่มีอยู่แล้วในสต็อก" (existing OEM FG)** — ขนานกับ Own-Brand โหมด ก (ขายจากสต็อก) ไม่ใช่ผลิตต่อออร์เดอร์เท่านั้น. OEM FG ในสต็อกเกิดจาก **OEM overproduction (surplus, D13)** และ **OEM ที่ถูกฝาก/ลูกค้ายกเลิกการจัดส่ง** → เก็บเข้า **FG stock พร้อม OEM identity** (คลัง FG เดียวกับ Own-Brand FG); ขายซ้ำผ่าน OEM PO ใหม่ได้ (`stock.md` §4 · `production.md` §5b · `delivery-note.md`). Create ("เปิดใบสั่งซื้อใหม่") เพิ่ม **customer search dropdown** (โชว์สถานะ+credit term, ดู detail แบบ modal แล้วกลับไม่เสีย state). **★ ลูกค้าสถานะ Disabled/Blacklist = เปิด/ยืนยัน PO ไม่ได้ (HARD block)**. **★ BOM/FG ที่ถูกตั้ง Inactive = เปิด PO ไม่ได้ (HARD block, `bom.md` §5c)**. line = BOM/วัตถุดิบตรง (RM-direct ยังผ่านขั้นผลิต D3) **หรือ ★ เลือก OEM FG จากสต็อก (C4)**. ยืนยัน PO = จองวัตถุดิบ (Reserve; ★ ถ้า fulfil จากสต็อก = จอง OEM FG per-Batch); ขาด → เตือน + auto PR (ไม่บล็อก). **★ เลข PO ไม่โชว์ล่วงหน้าบนหน้า create (แสดง "(ระบบออกให้เมื่อบันทึก)") → ออกเลข gapless ตอนบันทึกสำเร็จ + popup ยืนยันแสดงเลข PO + สรุป (G8 · `numbering-on-save.md`)** (รวมกรณี prefill จาก QT). **★ พิมพ์เอกสาร PO: หลัง "บันทึก" (ออกเลข PO ตอนบันทึก — G8) ผู้ใช้เปิด print-ready view เพื่อ พิมพ์/ส่ง (print/share) เอกสาร PO ได้ — มิเรอร์ QT; พิมพ์ได้เฉพาะหลังบันทึกเท่านั้น · สิทธิ์ = PO.Read (R).** รองรับ **origin ref "created from QT-…"** — มาจาก QT ที่ **ยืนยัน (Confirmed)** แล้ว, prefill ได้ **2 ทาง**; **loose reference → ไม่มี cascade** สองทาง. ผลิตเกิน → surplus เข้า FG ตอน "พร้อมส่ง" (D13, **OEM identity**). **★ การแก้ PO (ทุกที่ รวมจากบริบทการผลิต — under-production) → raise ⚑ "ต้องติดตาม" ที่ลูกค้า + audit ละเอียดระดับ field.** 2 ราง: fulfilment + billing (credit term 30/60/90 default 60). **★★ สถานะจัดส่งของ PO = LINKED จากสถานะ DN** (§4b). **★ (C3 r20): ยกเลิก PO โดยตรง = BLOCKED ขณะมี DN (non-void) active (อยู่ระหว่างการเตรียม/อยู่ระหว่างจัดส่ง) — ต้องจัดการผ่าน Route/DN (void DN ก่อน) — §4d/§7.** **★★ 1 PO ออกใบแจ้งหนี้ได้หลายใบ แต่ "active" ทีละ 1 ใบ** (§4c). **★ มีช่องหมายเหตุ (comment) แก้ในที่ + เก็บประวัติการแก้ครบ (comment-convention.md).**

---

## 1. Purpose
เปิด/จัดการคำสั่งผลิต OEM ต่อ 1 ลูกค้า, ขับ lifecycle การผลิต+จัดส่ง (fulfilment) และการวางบิล+ชำระ (billing) แบบ 2 ราง. **★ C4: fulfilment มี 2 เส้นทาง — made-to-order (ผลิตตามสั่ง) และ sell-from-stock (เลือก OEM FG จากสต็อก) — ดู §5.4.**

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `po-list.html` | list PO + filter สถานะ (**รวมสถานะจัดส่งที่สะท้อนจาก DN — §4b**) + **search เลข PO / ช่วงวันที่สร้าง** (G2) + 20/หน้า (G1) + คอลัมน์ "🔗 จาก QT-…" ถ้ามี |
| `po-create.html` | เปิด PO ใหม่ (customer dropdown, line BOM/RM, **★ C4: option "เลือก OEM FG จากสต็อก" — §5.4**, material check + reserve, origin QT optional, **ช่อง comment**) · **★ ช่องเลข PO = "(ระบบออกให้เมื่อบันทึก)" (G8)** |
| `po-detail.html` | 2 ราง (fulfilment/billing) + PRD ต่อ line + เปลี่ยนสถานะ + surplus/actual qty (ผ่าน production) + **edit PO (→follow-up+audit §5.2)** + **สถานะจัดส่งสะท้อนจาก DN (§4b)** + **ราง billing = ใบ active (§4c)** + **★ print-ready view (พิมพ์/ส่งเอกสาร PO — เฉพาะหลังบันทึก/ออกเลข §5.3)** + **comment ปัจจุบัน + "ประวัติการแก้ไข comment"** |

## 3. Fields
| ฟิลด์ | หน่วย/ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| เลข `PO-{YYYYMM}-{NNNNNN}` | string | computed (gapless) | **★ ไม่โชว์บน create (แสดง "(ระบบออกให้เมื่อบันทึก)") → ออกตอนบันทึกสำเร็จ + popup (G8)** · reopen คงเลขเดิม · **★ เลขนี้ปรากฏบนเอกสาร print-ready (พิมพ์ได้เฉพาะหลังออกเลข §5.3)** |
| ลูกค้า | ref customer | editable (dropdown G4) | โชว์สถานะ + credit term · **Disabled/Blacklist เลือกไม่ได้ (§7)** |
| origin `created from QT-…` | ref QT (optional, loose) | editable/computed | ว่างได้ (สร้างตรง D18-3); auto-fill เมื่อ Convert-to-PO / จาก banner ของ QT ที่ Confirmed · **loose ref: ยกเลิก QT ไม่กระทบ PO** |
| line items | list {item(BOM/RM / **★ C4: OEM FG จากสต็อก**), qty, ราคา/หน่วย, **★ fulfil source (produce / from-stock)**} | editable | RM-direct ยังผ่านขั้นผลิต (D3) · **BOM/FG ต้อง Active (§7)** · **★ line ที่ fulfil จากสต็อก = อ้าง OEM FG + Batch ที่มี (§5.4)** · **★ แก้ qty (under-production production.md §5c) → follow-up + audit (§5.2)** |
| **★ fulfil source (ต่อ line)** | enum {produce (made-to-order), from-stock (OEM FG)} | editable (create) | **C4:** produce = เข้าสายผลิตปกติ · from-stock = จอง OEM FG ที่มีในคลัง แล้วเข้าคิวจัดส่งตรง (§5.4) |
| วันที่ต้องการรับของ | date | editable | กรอกตอน create · ใช้เป็นแกนค้น "ช่วงวันที่ต้องการรับของ" ในคิวผลิต (production.md §6) · **★ ใช้จัดเรียง candidate ในหน้า Route (shipping.md §5)** |
| credit term (rางบิล) | enum {30,60,90} วัน default 60 | editable | default จากลูกค้า, override รายใบแจ้งหนี้ได้ |
| **สถานะ fulfilment** | enum (§4/§4b) | mostly auto | Draft→Confirmed→In Production→**พร้อมจัดส่ง**→**[สะท้อน DN]**→Cancelled · **★ line from-stock: Confirmed → จอง OEM FG → พร้อมจัดส่ง (ข้ามขั้นผลิต §5.4)** |
| สถานะ billing | enum | Finance/auto | Not Invoiced→Invoiced→Paid→Overdue · **★ สะท้อนใบ active (§4c)** |
| ยอดรวม + VAT | THB | computed | |
| **★ หมายเหตุ (comment)** | free-text (ช่องเดียว) | **editable (แก้ในที่/overwrite)** | **แก้ทุกครั้งเก็บประวัติ ใคร/เมื่อ/เดิม→ใหม่ + โผล่ trace — `comment-convention.md` (CC1–CC7)** |

## 4. Statuses / lifecycle (entity-status-map §1.2/§1.3)
- **Fulfilment (ช่วงของ PO เอง):** ร่าง (Draft) → **ยืนยันแล้ว (Confirmed)** [→ line เข้าคิว "รอรับงาน" + **จองวัตถุดิบ** (reserve, Option A); **★ C4 line from-stock = จอง OEM FG per-Batch (ไม่เข้าคิวผลิต)**] → กำลังผลิต (In Production) → **พร้อมส่ง/พร้อมจัดส่ง (Ready to Ship)** · ยกเลิก (Cancelled)→reopen (คงเลข).
- **★ PO → พร้อมส่ง (Ready to Ship) = roll-up:** เกิดเมื่อ **ทุก PRD ของ PO กด "พร้อมส่ง" ครบ** (production.md §4/§5b) — จำนวนสั่งส่งลูกค้า, ส่วนเกิน→FG (OEM identity). **★ C4: line ที่ fulfil from-stock = พร้อมจัดส่งทันทีหลังจอง OEM FG (ไม่ต้องรอผลิต); PO พร้อมจัดส่งเมื่อทุก line (ผลิต + from-stock) พร้อมครบ.**
- **★★ หลัง "พร้อมจัดส่ง" = สะท้อนสถานะ DN (§4b)** — ไม่ใช่ enum แยกของ PO อีกต่อไป.
- **Billing:** ยังไม่วางบิล → วางบิลแล้ว (**ออก invoice ได้ในเฟสนี้โดยไม่ล็อกสถานะ — `invoice.md` §7**) → ชำระแล้ว · เกินกำหนด (Overdue เมื่อ **DN ส่งสำเร็จ** + เลยเครดิต + ยังไม่จ่าย). **★ ราง billing = สะท้อนใบ active (§4c).**
- **จอง/ตัดจริง:** Confirmed = จอง; **เริ่มผลิต = ตัดจริง (Consume RM, เลือก lot มี stock; หลาย lot = FIFO — production.md §5d, Option A)** · **★ C4 from-stock: OEM FG ถูกจองตอน Confirmed → ตัดจริง (FIFO per-Batch) ตอน DN "ส่งสำเร็จ" (เหมือน Own-Brand ก)**. Cancel = release ที่ยังไม่ consume.
- **Surplus (D13):** ฝ่ายผลิตกรอก actual produced qty (≥ ordered); ตอน "พร้อมส่ง" ส่วนเกิน → FG stock (remark, ไม่ approve) · **★ C4: ส่วนเกิน OEM = คง OEM identity → เข้า OEM FG bucket (sellable) — `stock.md` §4 / `production.md` §5b.**
> **หมายเหตุ vs QT:** "PO Confirmed" (fulfilment ราง) ≠ "QT Confirmed (ยืนยัน)". เมื่อสร้าง PO จริง PO เริ่มที่ **Draft**.

## 4b. ★★ PO delivery status = LINKED จาก DN status (rule กลาง — ปอนด์ 2026-07-30)
> **PO แสดงสถานะของตัวเองจนถึง "พร้อมจัดส่ง" แล้วสะท้อน (reflect) สถานะของ DN ที่ผูกอยู่** — **สถานะจัดส่งไม่ใช่ enum อิสระของ PO**.

**ชุดสถานะที่ PO แสดง (combined logic):**
1. **ช่วงของ PO เอง (ถึงพร้อมจัดส่ง):** `ร่าง · ยืนยันแล้ว-รอรับงาน · กำลังผลิต · …(สถานะ PO อื่น)… · พร้อมจัดส่ง`.
2. **ช่วงสะท้อนจาก DN (หลังพร้อมจัดส่ง — จาก `delivery-note.md` §7):** `อยู่ระหว่างการเตรียม · อยู่ระหว่างจัดส่ง · ส่งสำเร็จ · ลูกค้าเลื่อนส่ง · ลูกค้ายกเลิก(การส่ง) · ลูกค้ายังไม่กำหนดวันรับใหม่`.

**การ map DN → PO delivery status:**
| DN status (delivery-note.md §7) | PO delivery status ที่สะท้อน | หมายเหตุ |
|---|---|---|
| DN อยู่ระหว่างการเตรียม | อยู่ระหว่างการเตรียม | order เข้ารอบแล้ว รอ Route ออกไปส่ง |
| DN อยู่ระหว่างจัดส่ง | อยู่ระหว่างจัดส่ง | Route ออกไปส่ง |
| DN ส่งสำเร็จ | ส่งสำเร็จ | ตัด FG + เริ่มนับเครดิต (billing) |
| DN ลูกค้าเลื่อนส่ง | ลูกค้าเลื่อนส่ง | รอ re-route ในวันนัดถัดไป |
| DN ลูกค้ายกเลิก (ยกเลิกการจัดส่ง) | ลูกค้ายกเลิก(การส่ง) | **★ r20: ยกเลิก *การส่ง* ไม่ใช่ยกเลิก PO — order (PO) ไม่เปลี่ยนสถานะเป็นยกเลิก; ของฝาก/คืนตามนโยบาย (OEM → OEM FG bucket, C4)** |
| DN ลูกค้ายังไม่กำหนดวันรับใหม่ | ลูกค้ายังไม่กำหนดวันรับใหม่ | ฝากของไว้ที่เรา |

**★ Rollup (1 PO หลาย DN สถานะต่างกัน) — PO reasonable decision (settled, ปอนด์ override ได้):**
- ในโมเดลนี้ **1 DN = 1 PO เต็มใบ** → 1 PO มี **DN ที่ active ได้ทีละ 1 ใบ**; DN ก่อนหน้าที่ถูก re-route = **ประวัติ (superseded/void)**.
- **★ กติกา (r20 pin — B7a): สถานะจัดส่งของ PO = สถานะของ "DN ล่าสุด (active/current)" = DN (non-void) ที่มี timestamp การเปลี่ยนสถานะล่าสุด (most-recent status-change timestamp) ในบรรดา DN ที่ "ไม่ถูก void" ของ PO นั้น**. DN เก่าที่ถูกแทนด้วยรอบใหม่/ถูก void ไม่ขับสถานะ PO (คงเป็นประวัติบน trace).
- *(ถ้าอนาคตอนุญาตแตก PO เป็นหลาย DN พร้อมกัน — จะนิยาม rollup แบบ aggregate เพิ่ม; ปัจจุบันไม่มีเคสนั้น.)*

**★ บังคับใช้ทุกจอที่โชว์สถานะ PO:** **po-list · po-detail · dashboard · คิวงานผลิต (production queue)** — ทุกที่ต้องแสดงสถานะจัดส่งด้วย combined logic นี้. sync `entity-status-map.md` §1.2 · `delivery-note.md` §8 · `so.md` §4.

## 4c. ★★ PO billing rail = สะท้อน "ใบแจ้งหนี้ active" (Invoice review — ปอนด์ 2026-07-30)
> **1 PO ออกใบแจ้งหนี้ได้หลายใบตลอดอายุ แต่มี "active" ทีละ 1 ใบ** (`invoice.md` §4b).
- **ราง billing ของ PO (Not Invoiced/Invoiced/Paid/Overdue) = สะท้อนสถานะของใบ active ปัจจุบัน**. ใบที่ **void/ยกเลิก = ประวัติ** — ไม่ขับ billing และไม่นับยอด.
- **ยังไม่มีใบ active** → billing = **Not Invoiced** → ออกใบใหม่ได้ (`invoice.md` §4b · po-detail มีปุ่ม/ลิงก์ "ออก/ดูใบแจ้งหนี้").
- **Overdue** = ใบ active + **DN ส่งสำเร็จ** + เลยเครดิต + ยังไม่จ่าย (J3).
- po-detail แสดง **ใบ active + ลิงก์ประวัติใบที่ void** (trace). authoritative model = `invoice.md` §4b.

## 4d. ★ (C3 r20) Cancel PO vs active DN — precedence (ปอนด์ 2026-07-31)
- **ยกเลิก PO โดยตรง = BLOCKED ขณะมี DN (non-void) ที่ active** (สถานะ **อยู่ระหว่างการเตรียม** หรือ **อยู่ระหว่างจัดส่ง**) — ไม่อนุญาตกดยกเลิก PO บน po-detail จนกว่าจะจัดการ DN ก่อน (ข้อความ *"PO นี้มีใบจัดส่ง (DN) ที่กำลังดำเนินการ — จัดการผ่านหน้า Route/DN ก่อน (void ใบจัดส่ง)"*).
- **วิธีจัดการที่ถูกต้อง:** void DN / ยกเลิกรอบ Route (`shipping.md` §4d) → DN = void, **order (PO) ที่ยังไม่ dispatch กลับคิว "พร้อมจัดส่ง"** → แล้วจึงยกเลิก PO ได้ (ถ้าต้องการ).
- **DN "ส่งสำเร็จ" แล้ว** = สายจัดส่งปิด → ยกเลิก PO ไม่ได้ (การเอาของคืน = ผ่าน Return; OEM → OEM FG bucket, C4).
- **ก่อนเข้ารอบ (ยังไม่มี DN):** ยกเลิก PO ได้ตามปกติ (release reservation ที่ยังไม่ consume · §7). ref `delivery-note.md` §4/§7 · `non-functional.md` §10.

## 5. ★ Create flow (delta)
1. เปิด `po-create` → **customer search dropdown (G4)** (ค้นเบอร์/บริษัท/ผู้ติดต่อ/เบอร์ผู้ติดต่อ; โชว์สถานะ+credit term; ดู detail แบบ modal แล้วกลับ **ไม่เสีย state ฟอร์ม**). **★ ช่องเลข PO บนหน้านี้ = read-only "(ระบบออกให้เมื่อบันทึก)" (G8/NS1).**
   - **★ Hard block ลูกค้า Disabled/Blacklist (customer.md §4.2):** เลือกไม่ได้ + บล็อกตอนบันทึก/ยืนยัน. **HARD block**.
2. (optional) field **"สร้างจากใบเสนอราคา"** = QT ต้นทาง (ว่าง = สร้างตรง; auto-fill เมื่อมาจาก Convert-to-PO พร้อม prefill line/qty/ราคา).
   - **★ Prefill มาได้ 2 ทาง (quotation.md §6):** (ก) กด "Convert to PO" บน QT → popup · (ข) ปุ่ม **"ไปสร้าง PO ด้วยข้อมูลนี้"** จาก banner บน QT ที่ Confirmed แต่ยังไม่มี PO. ทั้งสอง prefill line/qty/ราคา + ตั้ง origin `created from QT-…`.
   - **★ loose reference → ยกเลิก QT ไม่กระทบ PO และในทางกลับกัน.**
3. เพิ่ม line: **(a) BOM/RM (made-to-order)** RM-direct → alert D3 · **(b) ★ C4: เลือก OEM FG จากสต็อก (sell-from-stock) — §5.4**.
   - **★ Hard block BOM/FG Inactive (`bom.md` §5c):** หายจาก dropdown; หลุดเข้ามา → บล็อกตอนบันทึก/ยืนยัน.
4. material check เทียบ **Available (on_hand − reserved)** → ขาด = เตือน (ไม่บล็อก) + **auto-สร้าง PR ส่วนขาด** (เฉพาะ line made-to-order; line from-stock = จอง OEM FG แทน).
5. (optional) กรอก **หมายเหตุ (comment)** — ดู §5.1.
6. บันทึก (Draft) → **★ ระบบออกเลข PO gapless ตอนบันทึกสำเร็จ (G8/NS2) + popup ยืนยันแสดง "เลข PO + สรุป (ลูกค้า/จำนวน line/ยอดรวม + origin QT ถ้ามี)" + ลิงก์ดู po-detail / print-ready (G8/NS3)** → ยืนยัน (Confirmed) = จองวัตถุดิบ / **★ จอง OEM FG (line from-stock)**.
> **★ ร่าง PO ที่ไม่ได้บันทึก = ไม่กินเลข (G8/NS4).** prefill จาก QT ก็ออกเลขตอนบันทึกเช่นเดียวกัน.

## 5.4 ★⭐ OEM sell-from-stock — fulfil PO by selecting existing OEM FG (C4 CRITICAL — ปอนด์ 2026-07-31)
> **⭐ ปอนด์: "เรื่องนี้ต้องไม่หลุด สำคัญมาก".** OEM ไม่ได้ผลิตต่อออร์เดอร์อย่างเดียว — **OEM FG ที่มีอยู่แล้วในสต็อกขายซ้ำผ่าน OEM PO ใหม่ได้** (ขนานกับ Own-Brand โหมด ก).

- **★ ที่มาของ OEM FG ในสต็อก (sellable bucket, OEM identity):**
  1. **OEM overproduction / surplus (D13):** ผลิตเกินจำนวนสั่ง → ส่วนเกินเข้า **FG stock พร้อม OEM identity** (คง Batch/PRD/PO ต้นทาง) — `production.md` §5b · `stock.md` §4.
  2. **OEM held / customer-cancelled-delivery:** ของ OEM ที่ **ลูกค้ายกเลิกการจัดส่ง / ฝากไว้ที่เรา (ยังไม่กำหนดวันรับใหม่)** → กลับเข้า **FG stock พร้อม OEM identity** (`delivery-note.md` §7 · `shipping.md` §4b).
  - เก็บใน **คลัง FG เดียวกับ Own-Brand FG** แต่ **มี OEM identity** (trace ผูก OEM Batch/PRD/PO ต้นทาง) → เป็น **stock bucket ที่ขายได้ (sellable)**.
- **★ การ fulfil OEM PO ด้วย OEM FG จากสต็อก:**
  - ตอนสร้าง/ทำ OEM PO → **Sale เลือก line แบบ "จากสต็อก (from-stock)"** → **เลือก OEM FG ที่มีในคลัง** (search dropdown ค้นชื่อ/รหัส FG + แสดง Batch/จำนวนคงเหลือ OEM identity, FIFO per-Batch D16).
  - ยืนยัน PO → **จอง OEM FG per-Batch** (ไม่เข้าสายผลิต) → line = **พร้อมจัดส่งทันที** → เข้าคิว Route → **ตัด OEM FG FIFO ตอน DN "ส่งสำเร็จ"** → DN/Invoice (เหมือน Own-Brand ก).
  - **1 PO ผสม line ได้:** บาง line = produce (made-to-order), บาง line = from-stock — PO พร้อมจัดส่งเมื่อทุก line พร้อมครบ (§4).
- **★ Trace/audit:** OEM FG bucket + การจอง/ตัด = ledger + trace ผูก OEM Batch/PO ต้นทาง → ปลายทาง OEM PO ใหม่ + DN (GMP chain ครบ, `non-functional.md` AU4).
- **★ UX/UI note (flag ให้ Stage 1 — สำคัญ):** **`po-create.html` ต้องมี option ให้ Sale "เลือก OEM FG จากสต็อก" ต่อ line (fulfil source = from-stock)** — คู่ขนานกับ so-create โหมด ก. ปัจจุบัน mockup po-create ยังไม่มี option นี้.

## 5.3 ★ Print PO document (พิมพ์เอกสาร PO — มิเรอร์ QT · Gate-1 completeness fix 2026-07-31)
- **หลังบันทึกสำเร็จ (เลข PO ออกแล้ว — G8/`numbering-on-save.md`)** ระบบแสดง/ให้เข้าถึง **print-ready view** ของเอกสาร PO → ผู้ใช้กด **"พิมพ์/ส่งเอกสาร PO" (print/share)** เพื่อพิมพ์หรือส่งไฟล์ให้ผู้เกี่ยวข้อง.
- **★ พิมพ์ได้เฉพาะหลังบันทึก/ออกเลขเท่านั้น** — ก่อนบันทึก **ยังไม่มีเลข PO และยังไม่มีเอกสารให้พิมพ์** (กติกาชัดของปอนด์). เข้าถึง print-ready ได้จาก **popup หลังบันทึก** และจาก **po-detail** ทุกเมื่อหลังจากนั้น.
- **การพิมพ์/ส่ง = action เชิงเอกสาร ไม่เปลี่ยนสถานะ PO** (fulfilment/billing คงเดิม) — เหมือน QT (`quotation.md` §5/§7).
- **สิทธิ์ = PO.Read (R)** (มิเรอร์ QT print = Read; สอดคล้อง G9 print=R · §6).

## 5.1 ★ Comment + change-history (ยึด `comment-convention.md`)
- **1 ช่อง comment free-text ต่อ PO** · แก้ได้จาก po-create (ตั้งค่าแรก) และ po-detail (แก้ทับ/overwrite).
- ทุกครั้งที่แก้ → เก็บ **ใคร/เมื่อ/ค่าเดิม→ค่าใหม่** ผ่าน field-audit เดิม; po-detail แสดง **ค่าปัจจุบัน + affordance "ประวัติการแก้ไข comment"**.
- การแก้ comment = activity-log event ของ PO และ **โผล่บน trace** (entity=PO, field=`comment`). กติกาเต็ม = `comment-convention.md`.
- comment นี้เป็น **คนละฟิลด์** กับ "comment ตอนยกเลิก/reopen" (บังคับเหตุผล §7) และ **คนละฟิลด์กับ audit การแก้ PO (§5.2)**.

## 5.2 ★ Edit PO → follow-up flag + field-level audit (รวมการแก้จากบริบทการผลิต) — ปอนด์สั่ง 2026-07-29
เมื่อ **PO ถูกแก้ไข** (แก้ line/qty/ราคา/ลูกค้า/วันที่/รายละเอียด) **ไม่ว่าจะแก้จากหน้า po-detail หรือจากบริบทการผลิต** (production management page — โดยเฉพาะ **under-production: ลดจำนวนสั่งลงให้ = จำนวนผลิตจริง**, production.md §5c/§7.6):
- **(1) ★ raise ⚑ "ต้องติดตาม (follow-up)" ที่ลูกค้าของ PO นั้น** — **reuse Customer follow-up flag** (`customer.md` §4.1) พร้อมเหตุผลอ้าง PO (เช่น "PO-… ถูกแก้ไข (ลดจำนวนสั่งจากการผลิตจริง)") + ใคร/เมื่อ → ให้ **Sale เห็นว่า PO ถูกแก้** (flag = ป้ายเตือน ไม่บล็อก). **★ r20: การ raise flag นี้ = manual/standalone cascade → ยิง noti Follow-up (ไม่โดน de-dup เพราะ PO edit ไม่มี noti ของตัวเอง — `customer.md` §4.1).**
- **(2) ★ audit ละเอียดระดับ field** — ทุกฟิลด์ที่แก้บันทึก **entity=PO / field / ค่าเดิม (old) → ค่าใหม่ (new) / ใคร / เมื่อ / เหตุผล** ผ่าน field-audit เดิม (`traceability.md` §4 · `non-functional.md` AU1) → ค้น/แสดงบน trace ได้ (แยกจากการแก้ `comment`). **★ การแก้ไม่ออกเลข PO ใหม่ — ใช้เลขเดิม (G8/NS6).**
- **(3) reservation/stock:** แก้จำนวน line → ปรับ reservation (delta) ตาม entity-status-map §1.6 (Hold/แก้ PO → adjust reservation).
- confirm popup ตอนบันทึกการแก้ (production.md §7.7 สำหรับการแก้จากหน้าผลิต).
- **สิทธิ์:** แก้ PO = **PO.Update (U)** ไม่ว่าจะทำจากหน้าใด (การแก้จากบริบทการผลิตยังเช็คสิทธิ์ PO.Update).

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required (PO module) |
|---|---|
| ดู list/detail + **ดูประวัติ comment / audit การแก้** | PO.**Read (R)** |
| **พิมพ์/ส่งเอกสาร PO (print-ready view · เฉพาะหลังบันทึก/ออกเลข, ไม่เปลี่ยนสถานะ §5.3)** | PO.**Read (R)** |
| เปิด PO ใหม่ / **แก้ PO (po-detail หรือจากบริบทการผลิต) → follow-up + audit (§5.2)** · **★ C4: เลือก OEM FG จากสต็อก (§5.4)** | PO.**Create/Update (C/U)** |
| ยืนยัน PO (→ จองวัตถุดิบ / ★ จอง OEM FG line from-stock) | PO.**Update (U)** |
| **แก้ไข comment (แก้ในที่)** | PO.**Update (U)** (เก็บประวัติ auto) |
| ยกเลิก/reopen PO — **★ C3: ยกเลิกบล็อกถ้ามี DN active (§4d)** | PO.**Delete/Approve (D/A)** + comment |
| force override สถานะ (ข้ามลำดับ) | PO.**Admin** + เหตุผล |
| **ออก invoice (billing · อ้าง PO · ใบ active) / ยกเลิก(void) ใบ** | Invoice.**Create (C)** / Invoice.**Delete (D)** (Finance · `invoice.md` §6) |
| เปิด modal ลูกค้า | Customer.**Read (R)** |
> surplus (D13) = auto ตอนพร้อมส่ง ไม่มี permission แยก (แจ้ง remark; **★ C4: OEM surplus → OEM FG bucket**). **สถานะจัดส่งของ PO = สะท้อนจาก DN (§4b) — ไม่มีปุ่มเปลี่ยนสถานะจัดส่งบน PO โดยตรง; ควบคุมผ่าน Route/DN.** **ราง billing = สะท้อนใบ active (§4c) — ควบคุมผ่านโมดูล Invoice.**

## 7. Validations
- ต้องมีลูกค้า + ≥1 line + ราคา/หน่วย.
- **★ Hard block ลูกค้า Disabled/Blacklist (customer.md §4.2):** ห้ามเลือก/บันทึก/ยืนยัน PO ให้ลูกค้าสถานะ Disabled/Blacklist — **บล็อกจริง**.
- **★ Hard block BOM/FG Inactive (bom.md §5c):** ห้ามเลือก/บันทึก/ยืนยัน PO ที่ line อ้าง BOM/FG **Inactive** — **บล็อกจริง**. ไม่กระทบ PO เดิมที่อ้าง BOM ก่อน inactivate.
- material ขาด = เตือน ไม่บล็อก (+ auto PR) — เฉพาะ line made-to-order.
- **★ C4 line from-stock (§5.4):** ต้องเลือก OEM FG + Batch ที่มีคงเหลือ (OEM identity); จอง OEM FG per-Batch; ตัดจริงตอน DN "ส่งสำเร็จ" (FIFO).
- **★ เลข PO ออกตอนบันทึกสำเร็จเท่านั้น (G8/NS2) — ร่างที่ไม่บันทึกไม่กินเลข (NS4); reopen/แก้ = เลขเดิม (NS6).**
- **★ พิมพ์เอกสาร PO ได้เฉพาะหลังบันทึก/ออกเลขแล้วเท่านั้น (§5.3) — การพิมพ์ไม่เปลี่ยนสถานะ · สิทธิ์ = PO.Read (R).**
- ยกเลิก = บังคับ comment; reopen = คงเลข PO เดิม (Draft). **★ (C3): ยกเลิก PO โดยตรง = BLOCKED ขณะมี DN (non-void) active (อยู่ระหว่างการเตรียม/อยู่ระหว่างจัดส่ง) — ต้อง void DN/ยกเลิกรอบผ่าน Route ก่อน (§4d); ก่อนเข้ารอบ (ไม่มี DN) ยกเลิกได้.**
- **★ การแก้ PO (ทุกที่ รวมจากการผลิต) → raise ⚑ follow-up ลูกค้า + audit ละเอียดระดับ field เสมอ (§5.2).** **under-production:** การลดจำนวนสั่งให้ = จำนวนผลิตจริง = การแก้ PO → follow-up + audit (production.md §5c).
- **★ สถานะจัดส่ง = สะท้อน DN (§4b)** — rollup = DN ล่าสุด (non-void, status-change ล่าสุด); ห้าม hardcode enum In Delivery/Delivered เดิม.
- **★ billing = สะท้อนใบ active (§4c)** — 1 PO มีใบ active ทีละ 1 ใบ; ใบ void ไม่นับ (`invoice.md` §4b).
- **★ comment (หมายเหตุทั่วไป) = ไม่บังคับ** · แก้ได้ทุกสถานะ · ทุกการแก้ถูก audit.

## 8. Pagination / Search
- po-list: 20/หน้า (G1) · search เลข PO **หรือ** ช่วงวันที่สร้าง (G2) · filter สถานะ (**รวมสถานะจัดส่งที่สะท้อน DN — §4b**) + (แสดงลิงก์ QT).

## 9. Cross-links
- QT→PO → `quotation.md` §6 · reservation → stock-reservation · production/surplus/**edit-PO from production/under-production** → `production.md` §5c/§7.6 · flow → `flows/oem-flow.md` (**★ C4 sell-from-stock variant**).
- **Hard block Disabled/Blacklist → `customer.md` §4.2 · follow-up flag reuse → `customer.md` §4.1.**
- **Inactive BOM/FG block → `bom.md` §5c · `deletion-policy.md` §2.4.**
- **★ เลขออกตอนบันทึก (G8) → `numbering-on-save.md` · gapless → `non-functional.md` §5 (D-F2).**
- **★ พิมพ์เอกสาร PO (print-ready หลังออกเลข, สิทธิ์ R) → มิเรอร์ `quotation.md` §5/§7 · G9 print=R (`permission-matrix.md` §3).**
- **★★ PO delivery status = สะท้อน DN → `delivery-note.md` §8 · `shipping.md` §4b · entity-status-map §1.2/§1.10 · `so.md` §4.**
- **★ (C3) cancel blocked while active DN → `shipping.md` §4d · `delivery-note.md` §4/§7 · `non-functional.md` §10.**
- **★⭐ (C4) OEM sell-from-stock → `stock.md` §4 (OEM FG bucket, OEM identity) · `production.md` §5b (surplus → OEM FG) · `delivery-note.md` §7 (held/cancelled OEM → FG) · `oem-flow.md` (variant) · `so.md` §5 (parallel ก).**
- **★★ PO billing = สะท้อนใบ active (1 PO หลายใบ, active ทีละใบ) → `invoice.md` §4b/§7 · ออก/ยกเลิกใบ = `invoice.md` §6.**
- **Comment + change-history → `comment-convention.md` · field-audit (PO edit + comment) → `traceability.md` §4 / `non-functional.md` AU1.**

## 10. Module changelog
- **เพิ่ม:** customer search dropdown (G4) บน po-create · date-range search po-list · origin QT ref.
- **★ เพิ่ม (2026-07-29 — number-on-save G8, ปอนด์ cross-cutting):** เลข PO **ไม่โชว์บน create → ออก gapless ตอนบันทึกสำเร็จ + popup ยืนยัน** — §2/§3/§5/§7/§9, ยึด `numbering-on-save.md` (G8/NS1–NS4/NS6). ครอบกรณี prefill จาก QT ด้วย; reopen/แก้ = เลขเดิม.
- **★ เพิ่ม (2026-07-29 — customer feedback):** **hard block เปิด/ยืนยัน PO เมื่อลูกค้า Disabled/Blacklist** (§5/§7).
- **★ อัปเดต (2026-07-29 — Quotation module review):** origin QT ref มาจาก QT ที่ **ยืนยัน (Confirmed)**; prefill 2 ทาง; loose ref → no cascade.
- **★ เพิ่ม (2026-07-29 — comment cross-cutting feedback):** ช่อง **หมายเหตุ (comment)** แบบแก้ในที่ + เก็บประวัติ.
- **★ เพิ่ม (2026-07-29 — BOM module review):** hard block เปิด/ยืนยัน PO เมื่อ BOM/FG Inactive.
- **★ เพิ่ม (2026-07-29 — Production module review, ปอนด์):** **§5.2 Edit PO → raise ⚑ follow-up ลูกค้า (reuse) + audit ละเอียดระดับ field** — รวมการแก้จากบริบทการผลิต โดยเฉพาะ **under-production**. อัปเดต fulfilment status "พร้อมส่ง (Ready to Ship)" = roll-up. CONSUME = เลือก lot มี stock; หลาย lot = FIFO (§4).
- **★★ เพิ่ม (2026-07-30 — DN→PO status link, ปอนด์ Module C):** **§4b — สถานะจัดส่งของ PO = สะท้อนจากสถานะ DN** + **rollup = DN ล่าสุด (active)** + **บังคับใช้ทุกจอ**. แทน enum เดิม In Delivery/Delivered. §2/§3/§4/§6/§7/§8/§9, ref `delivery-note.md` §8 · `shipping.md` §4b · entity-status-map §1.2.
- **★★ เพิ่ม (2026-07-30 — Invoice module review, ปอนด์):** **§4c — PO billing rail = สะท้อนใบแจ้งหนี้ active** · **ออก invoice เฟสนี้ไม่ล็อกสถานะ** · Overdue = DN ส่งสำเร็จ + เลยเครดิต · §6 เพิ่ม void ใบ = Invoice.D. §2/§3/§4/§6/§7/§9.
- **★ เพิ่ม (2026-07-31 — Gate-1 completeness fix, ปอนด์):** **§5.3 พิมพ์เอกสาร PO (print-ready view)** — สิทธิ์ = PO.Read (R). §2/§3/§5.3/§6/§7/§9.
- **★ เพิ่ม (2026-07-31 — Gate-1 review reconciliation r20, ปอนด์):**
  - **(C3):** **§4d ใหม่ — ยกเลิก PO โดยตรง = BLOCKED ขณะมี DN (non-void) active** (อยู่ระหว่างการเตรียม/อยู่ระหว่างจัดส่ง) → ต้อง void DN/ยกเลิกรอบผ่าน Route ก่อน (order กลับคิว "พร้อมจัดส่ง"); DN "ส่งสำเร็จ" = สายปิด; ก่อนเข้ารอบ = ยกเลิกได้. summary/§4/§4b(map ยกเลิกการจัดส่ง)/§6/§7/§9, ref `shipping.md` §4d · `delivery-note.md` §4/§7.
  - **(C4 ⭐ CRITICAL — "เรื่องนี้ต้องไม่หลุด"):** **§5.4 ใหม่ — OEM sell-from-stock** — OEM PO fulfil ได้ด้วยการ **เลือก OEM FG ที่มีอยู่แล้วในสต็อก** (ขนาน Own-Brand ก, ไม่ใช่ผลิตต่อออร์เดอร์เท่านั้น). OEM FG bucket (OEM identity) มาจาก **overproduction/surplus (D13)** + **held/customer-cancelled-delivery OEM** → เก็บใน FG stock (คลังเดียวกับ Own-Brand FG, มี OEM identity, sellable). line from-stock = จอง OEM FG per-Batch → พร้อมจัดส่งทันที → ตัด FIFO ตอน DN "ส่งสำเร็จ". เพิ่ม fulfil source (produce/from-stock) ต่อ line. summary/§1/§2/§3/§4/§5 step3-6/§5.4/§6/§7/§9, ref `stock.md` §4 · `production.md` §5b · `delivery-note.md` §7 · `oem-flow.md`. **★ UX/UI note: po-create.html ต้องมี option "เลือก OEM FG จากสต็อก" (flag ให้ Stage 1).**
  - **(B7a):** §4b rollup "DN ล่าสุด (active)" = **most-recent status-change timestamp ในบรรดา DN non-void** (นิยามชัด).
  - **ใช้ view เดิม (`po.html` render จาก .md).**
- **คงเดิม:** 2 ราง, reserve/consume (Option A), surplus (D13), RM-direct (D3), print PO, DN-mirror, billing active-invoice.
