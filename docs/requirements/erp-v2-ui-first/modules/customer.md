# Module — Customer (ลูกค้า)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29
Mockups: `mockups/customers.html` · `mockups/customer-detail.html` · `mockups/customer-create.html` · `mockups/contact-create.html`
กฎอ้างอิง: entity-status-map §1.1 (**status enum r2 = 5 สถานะ + follow-up flag แยก** — pending ปอนด์ยืนยัน) · deletion-policy §2.1/§2.6 · README §3 (G1–G5) · README §2.2 (credit term) · `invoice.md` (financial roll-up)

## สรุปภาษาไทย
โมดูลลูกค้า: เพิ่ม **TYPE = OEM และ/หรือ Own-Brand** (เป็นได้ทั้งคู่) · **Credit term ระดับลูกค้า 30/60/90 default 60** (override รายใบได้). **★ 3 เรื่องใหม่ (ปอนด์ 2026-07-29):** (1) หน้า detail โชว์ **สรุปการเงินลูกค้า** = ยอดซื้อรวม / จ่ายมาแล้ว / ยังไม่จ่าย(ค้างชำระ) — คำนวณจากใบแจ้งหนี้+การรับชำระ, THB, read-only. (2) **"ต้องติดตาม (needs follow-up)" แยกเป็น flag อิสระ** (boolean + เหตุผล + ใคร/เมื่อ) **ควบคู่ได้กับทุกสถานะ** (Blacklist ที่ติดเงินก็ต้องติดตามได้, Active ที่ PO มีปัญหาก็ได้) — **default: ถอด "Follow-up" ออกจาก status enum** เหลือ Lead/Active/Inactive/Disabled/Blacklist (★ รอปอนด์ยืนยันการถอด — ดู §12). (3) **Disabled/Blacklist = บล็อกการเปิดงานขายทั้งหมด (QT/PO/SO) แบบ HARD block** (ต่างจาก TYPE mismatch ที่เตือนไม่บล็อก). **★ 1 เรื่องใหม่ (ปอนด์ 2026-07-29, Customer add-on):** **หน้า EDIT ลูกค้าต้องแก้ได้ครบทุกฟิลด์ = ชุดเดียวกับตอน Create** (ข้อมูลบริษัท/ธุรกิจ, TYPE OEM/Own-Brand, credit term, ภาษี/ที่อยู่, สถานะ 5-status, ⚑ flag ต้องติดตาม, ผู้ติดต่อ) — **ไม่ใช่แค่ข้อมูลผู้ติดต่อ**; financial summary ยัง read-only; ทุกการแก้ลง audit (management-history). รวม "เปลี่ยนสถานะ/มอบหมาย + ประวัติการจัดการ + Sale reassign" เป็น **section เดียว (management-history)** · หน้า detail โชว์ **QT history + PO history** (ค้นเลข/ช่วงวันที่, 20/หน้า, drill-back ไม่เสีย state).

---

## 1. Purpose
จัดการ master ลูกค้า (ข้อมูล + ผู้ติดต่อ + credit + **สรุปการเงิน**) และเป็นจุดเริ่ม/อ้างอิงของทุก order (OEM Quotation/PO, Own-Brand SO). รองรับ lifecycle **5 สถานะ + flag "ต้องติดตาม" แยกอิสระ**, การมอบหมาย Sale, ประวัติการค้าเต็มรูป (QT/PO), และ **การบล็อกงานขายเมื่อ Disabled/Blacklist** เพื่อ traceability + การควบคุมความเสี่ยงเครดิต.

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `customers.html` (list) | รายชื่อลูกค้า + filter (สถานะ, **TYPE**, Sale ที่ดูแล, **⚑ ต้องติดตาม**) + search |
| `customer-detail.html` | ข้อมูลลูกค้า + ผู้ติดต่อ + **สรุปการเงิน (financial summary)** + **⚑ flag ต้องติดตาม (แยกจาก status badge)** + **management-history (section เดียว)** + **QT history** + **PO history** |
| `customer-create.html` (add/edit) | เพิ่ม/แก้ลูกค้า — **★ Edit = ครบทุกฟิลด์เท่ากับ Create** (§2b): ข้อมูลบริษัท/ธุรกิจ, TYPE, credit term, ภาษี/ที่อยู่, สถานะ, ⚑ flag, ผู้ติดต่อ |
| `contact-create.html` | เพิ่ม/แก้ผู้ติดต่อของลูกค้า |
| **modal detail** (ใช้จากหน้า order) | ดูข้อมูลลูกค้าแบบ modal จาก quotation/po/so-create — กลับได้ไม่เสีย state (G3/G4) |

> **หมายเหตุ split:** ถ้า add/edit ใหญ่เกิน สามารถแยก `customer-add.md` / `customer-edit.md` ภายหลัง — รอบนี้รวมใน customer.md.

## 2b. ★ Edit = ALL fields (เท่ากับ Create — Customer add-on 2026-07-29)
**หน้าแก้ไขลูกค้าต้องเปิดให้แก้ได้ครบทุกฟิลด์ = ชุดเดียวกับตอนสร้าง (Create)** — **ไม่ใช่แก้ได้เฉพาะข้อมูลผู้ติดต่อ**:
- **ข้อมูลบริษัท/ธุรกิจ** (ชื่อบริษัท, เบอร์บริษัท, ประเภทธุรกิจ/รายละเอียด).
- **TYPE = OEM และ/หรือ Own-Brand** (แก้ได้, multi-select).
- **Credit term** ระดับลูกค้า (30/60/90).
- **ภาษี/ที่อยู่** (เลขภาษี, ที่อยู่ออกเอกสาร).
- **สถานะ (5-status)** — Lead/Active/Inactive/Disabled/Blacklist (บาง transition บังคับ comment / ต้องสิทธิ์ Approve ตาม §8).
- **⚑ flag "ต้องติดตาม"** (ตั้ง/เคลียร์ + เหตุผลบังคับ) — §4.1.
- **ผู้ติดต่อ (contacts)** — เพิ่ม/แก้/ลบ (คงกฎผู้ติดต่อหลัก 1 คน §9).
- **ข้อยกเว้น (read-only):** **financial summary (§7)** = computed อย่างเดียว **ไม่มีปุ่มแก้บนหน้าลูกค้า** (แก้ผ่านเอกสารต้นทาง invoice/payment เท่านั้น) · **รหัสลูกค้า `CUS-…`** = computed (แก้ไม่ได้).
- **Audit:** **ทุกการแก้ฟิลด์ลง field-audit + แสดงใน management-history** (ใคร/เมื่อ/เดิม→ใหม่) — §5 / traceability.md §4. การเปลี่ยนที่บังคับ comment (สถานะ Disabled/Blacklist/soft-delete, ตั้ง/เคลียร์ flag) ยังบังคับเหตุผลตามเดิม (§9).
- **สิทธิ์:** แก้ฟิลด์ทั่วไป = Customer.**Update (U)**; เปลี่ยนสถานะ Disabled/Blacklist + reassign Sale = Customer.**Approve (A)** (§8) — การ "แก้ได้ทุกฟิลด์" ไม่ลดเพดานสิทธิ์ของ action ที่คุมด้วย Approve.

## 3. Fields
| ฟิลด์ | หน่วย/ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| รหัสลูกค้า `CUS-{NNNNNN}` | string | computed (auto) | gapless · **แก้ไม่ได้** |
| ชื่อบริษัท | text | editable (create + **edit**) | ใช้ค้นใน customer dropdown (G4) |
| **TYPE** | multi-select {OEM, Own-Brand} | editable (create + **edit**) | **เลือกได้ทั้งคู่** · ใช้ report + filter/เตือนตอนเปิด order · **mismatch = เตือนไม่บล็อก** |
| สถานะ | enum **5 สถานะ** | editable (create + **edit**; บาง state auto/ต้อง Approve) | **Lead/Active/Inactive/Disabled/Blacklist** (entity-status-map §1.1 r2) · **★ ถอด "Follow-up" ออกจาก enum → เป็น flag แยก (รอปอนด์ยืนยัน §12)** |
| **⚑ ต้องติดตาม (follow-up flag)** | boolean | editable (create + **edit**) | **แยกอิสระจาก status — co-exist กับทุกสถานะ** · เปิด flag = **บังคับกรอกเหตุผล** · เก็บ ใคร/เมื่อ (audit) · ปิด flag = บังคับ comment เหตุผลที่เคลียร์ |
| เหตุผลต้องติดตาม (follow-up reason) | text | editable (เมื่อ flag=true) | เช่น "ติดเงิน/ค้างชำระ", "PO-xxx มีปัญหา" · แสดงบน badge/tooltip |
| **Credit term (ระดับลูกค้า)** | enum {30, 60, 90} วัน | editable (create + **edit**) | **DEFAULT = 60** · override รายใบแจ้งหนี้ยังได้ (README §2.2) |
| Sale ที่ดูแล (owner) | ref user | editable (reassign, Approve) | reassign = Sale Manager/Admin (ดู §5) |
| ผู้ติดต่อ (contacts) | list {ชื่อ, เบอร์, อีเมล, หลัก?} | editable (create + **edit**) | ต้องมีผู้ติดต่อหลัก 1 คน (deletion-policy §2.6) |
| เบอร์โทรบริษัท | phone | editable (create + **edit**) | ใช้ค้นใน customer dropdown (G4) |
| ที่อยู่/เลขภาษี | text | editable (create + **edit**) | ใช้ออกเอกสาร |
| **ยอดซื้อรวม (total purchased)** | THB | **computed (read-only)** | Σ grand total ใบแจ้งหนี้ของลูกค้า (ไม่รวม void) — ดู §7 |
| **จ่ายมาแล้ว (total paid)** | THB | **computed (read-only)** | Σ การรับชำระที่บันทึกกับใบแจ้งหนี้ของลูกค้า — ดู §7 |
| **ยังไม่จ่าย / ค้างชำระ (outstanding)** | THB | **computed (read-only)** | = ยอดซื้อรวม − จ่ายมาแล้ว (= Σ ยอดค้างของใบ open+overdue) — ดู §7 |

## 4. Statuses / lifecycle (r2 — 5 สถานะ + follow-up flag แยก)
**สถานะหลัก 5 สถานะ (source: entity-status-map §1.1 r2):** **ผู้สนใจ (Lead)** → **ลูกค้าประจำ (Active)** (auto เมื่อยืนยัน order ใบแรก) → **ห่างหาย (Inactive)** (auto scheduler ไม่มี order เกินรอบ default 3 ด.) · **ปิดใช้งาน (Disabled)/บัญชีดำ (Blacklist)** (Sale Manager/Admin, บังคับ comment).
- **★ "Follow-up" ไม่เป็นสถานะอีกต่อไป** (default นี้ รอปอนด์ยืนยัน §12) → แทนด้วย **flag "ต้องติดตาม"** ที่ **ควบคู่ได้กับทุกสถานะ** (§4.1).
- **Soft-delete** ได้เสมอ (deletion-policy §2.1) — PO เดิมเดินต่อ, **ห้ามเปิด order ใหม่**, หายจาก dropdown.

### 4.1 ★ Follow-up flag (attribute แยกจาก status)
- **เป็น boolean อิสระ** — ตั้ง/เคลียร์ได้โดยไม่แตะสถานะหลัก. ตัวอย่าง: **Blacklist + ⚑ ต้องติดตาม** (ติดเงิน) · **Active + ⚑ ต้องติดตาม** (PO ที่เปิดมีปัญหา).
- ตั้ง flag = **บังคับเหตุผล** (follow-up reason) + เก็บ **ใคร/เมื่อ** (audit) → ลง management-history.
- **สัญญาณบน UI = แยก badge จาก status badge** เสมอ (เช่น chip ⚑ "ต้องติดตาม" สีเตือน + tooltip เหตุผล) — ห้ามรวมกับ badge สถานะ.
- **แหล่งที่มา flag:** manual (Sale/Sale Manager) หรือ auto จาก cascade (เช่น PRD Hold เหตุลูกค้า, invoice Overdue — cross-module ตั้ง flag + เหตุผล). ทุกครั้งลง audit.

### 4.2 ★ Hard block: Disabled / Blacklist ห้ามเปิดงานขาย
เมื่อสถานะลูกค้า = **Disabled** หรือ **Blacklist** → **บล็อกการเปิดงานขายทุกชนิดของลูกค้ารายนั้นแบบ HARD block**: **Quotation (QT), Purchase Order (PO), Sales Order (SO/Own-Brand OEM)**.
- เป็น **HARD block (ไม่ใช่เตือน)** — ระบบต้อง **ป้องกันไม่ให้เลือก/ยืนยัน** ลูกค้ารายนี้ในหน้า create ของ QT/PO/SO.
- **จุดบังคับใน customer search dropdown (G4):** ลูกค้า Disabled/Blacklist **ยังค้นเจอ + แสดงสถานะ** (เพื่อโปร่งใส) แต่ **เลือกไม่ได้ (disabled option) หรือถ้าเลือกได้ต้องบล็อกตอนยืนยัน** พร้อมข้อความชัดเจน เช่น *"ลูกค้าสถานะ {Disabled/Blacklist} — เปิดใบสั่ง/ใบเสนอราคาไม่ได้"*.
- **ต่างจาก TYPE mismatch:** TYPE ไม่ตรง (OEM/Own-Brand) = **เตือนไม่บล็อก (warn)** ตามหลัก warning-not-block; แต่ Disabled/Blacklist = **บล็อกจริง (hard)**. สองกฎนี้ทำงานแยกกัน.
- **flag "ต้องติดตาม" ไม่บล็อก** — เป็นแค่ป้ายเตือน/ตัวกรอง ไม่ห้ามเปิดงานขาย.
- ราย order module: `quotation.md` §5/§8, `po.md` §5/§7, `so.md` §5/§8.

## 5. ★ Management-history (section เดียว — consolidated)
รวม 3 อย่างที่เคยแยกให้เป็น **section เดียว** บน customer-detail:
1. **เปลี่ยนสถานะ / มอบหมาย + ตั้ง/เคลียร์ flag ต้องติดตาม** — เปลี่ยน 5 สถานะ (บังคับ comment ตาม state), **ตั้ง/เคลียร์ ⚑ ต้องติดตาม (บังคับเหตุผล)**, มอบหมายงานติดตาม.
2. **บันทึก / ประวัติการจัดการ** — timeline การกระทำ (comment, การติดต่อ, การเปลี่ยนสถานะ, การตั้ง/เคลียร์ flag, **★ การแก้ฟิลด์ใด ๆ ของลูกค้า — §2b**) เรียงเวลา.
3. **Sale ที่ดูแล (reassign)** — เปลี่ยนผู้ดูแล (Sale Manager/Admin) + เหตุผล; รองรับ bulk reassign ตอนลบ Sale (deletion-policy §2.2).
> ทุก entry เก็บ ใคร/เมื่อไหร่/เหตุผล (audit). paginate 20/หน้า (G1). **การแก้ทุกฟิลด์ (edit = all fields) = field-audit event → โผล่ใน timeline นี้.**

## 6. ★ QT history + PO history (บน customer-detail)
- **ประวัติใบเสนอราคา (Quotation history):** list QT ของลูกค้ารายนี้ · **ค้นด้วยเลข QT หรือช่วงวันที่สร้าง** (G2) · **20/หน้า** (G1) · คลิกเข้า `quotation-detail` แล้ว **กลับมาไม่เสีย state** (G3).
- **ประวัติ PO:** list PO ของลูกค้า · ค้นด้วยเลข PO หรือช่วงวันที่สร้าง (G2) · 20/หน้า (G1) · คลิกเข้า `po-detail` แล้วกลับไม่เสีย state (G3).
- (Own-Brand) ลูกค้าที่มี SO — แสดง SO history ในรูปแบบเดียวกัน (optional tab).

## 7. ★ Financial summary (บน customer-detail — computed roll-up)
สรุปยอดการเงินของลูกค้ารายนี้ (read-only, THB) — วางบน customer-detail (เช่นการ์ดหัวหน้า):
| ฟิลด์ | นิยาม / ที่มา (derivation) | หน่วย |
|---|---|---|
| **ยอดซื้อรวม (Total purchased)** | **Σ grand total (รวม VAT) ของใบแจ้งหนี้ทั้งหมดของลูกค้า** (OEM PO-based + Own-Brand SO-based) **ไม่รวมใบ void** | THB |
| **จ่ายมาแล้ว (Total paid)** | **Σ ยอดรับชำระ** ที่บันทึกกับใบแจ้งหนี้ของลูกค้า (invoice.md §6 "บันทึกรับชำระ") | THB |
| **ยังไม่จ่าย / ค้างชำระ (Outstanding unpaid)** | **= ยอดซื้อรวม − จ่ายมาแล้ว** (เท่ากับ **Σ ยอดค้าง** ของใบสถานะ รอชำระ(open) + เกินกำหนด(overdue)) | THB |

- **read-only/computed ล้วน** — ไม่มีปุ่มแก้บนหน้าลูกค้า (**รวมในโหมด edit ก็ยัง read-only** — §2b); ค่าเปลี่ยนตามเอกสารต้นทาง (ออกใบ/รับชำระ/void).
- **ขอบเขต:** ยึด **ใบแจ้งหนี้ (Invoice)** เป็นฐาน (ออกได้ตั้งแต่ PO/SO = Confirmed) — จึงสะท้อน "ยอดซื้อที่ยืนยันแล้ว/วางบิลแล้ว". (PO/SO ที่ยังไม่ออกใบ ไม่นับใน 3 ยอดนี้ — เห็นได้ใน QT/PO history §6 แทน.)
- **แนะนำ UX (ไม่บังคับ):** ถ้า outstanding > 0 และเลยเครดิต → เน้นสีเตือน + ลิงก์ไปใบ overdue; อาจ deep-link ไป `invoices.html` (filter = ลูกค้ารายนี้).
- **Cross-link:** `invoice.md` (§4 lifecycle รอชำระ/ชำระแล้ว/เกินกำหนด · §6 รับชำระ · §9 formula).

## 8. Actions & Permissions (per-action, D14/§7.1)
> โมเดล generic RUCDAA ต่อ module = **Customer**. ปุ่ม↔permission:

| ปุ่ม/action | Permission required (Customer module) |
|---|---|
| ดูรายชื่อ/detail/history/**financial summary** | Customer.**Read (R)** |
| สร้างลูกค้าใหม่ | Customer.**Create (C)** |
| **แก้ข้อมูลลูกค้า — ★ ครบทุกฟิลด์ (บริษัท/TYPE/credit term/ภาษี-ที่อยู่/ผู้ติดต่อ)** | Customer.**Update (U)** |
| เปลี่ยนสถานะ Lead/Active | Customer.**Update (U)** (บังคับ comment ตาม state) |
| **ตั้ง/เคลียร์ ⚑ flag ต้องติดตาม (+ เหตุผล)** | Customer.**Update (U)** (บังคับเหตุผล) |
| ตั้ง Disabled / Blacklist | Customer.**Approve (A)** (แนะนำ Sale Manager/Admin) + comment |
| reassign Sale ที่ดูแล | Customer.**Approve (A)** (Sale Manager/Admin) |
| soft-delete ลูกค้า | Customer.**Delete (D)** + comment |
| กู้คืน (undelete) | Customer.**Admin** |
| เปิด modal detail จากหน้า order | Customer.**Read (R)** |
> **★ Edit = all fields (§2b) ไม่ลดเพดานสิทธิ์:** ฟิลด์ที่คุมด้วย Approve (สถานะ Disabled/Blacklist, reassign Sale) ยังต้องมี Approve; ฟิลด์อื่น ๆ ใช้ Update. ฟอร์ม edit จึงเปิดครบทุกฟิลด์ แต่การบันทึกเช็คสิทธิ์ราย action.

## 9. Validations
- TYPE ต้องเลือกอย่างน้อย 1 (OEM หรือ Own-Brand หรือทั้งคู่).
- Credit term บังคับเลือก (default 60 ถ้าไม่แตะ).
- ต้องมีผู้ติดต่อหลัก 1 คนเสมอ (ลบผู้ติดต่อหลักคนเดียวไม่ได้จนตั้งคนใหม่ — deletion-policy §2.6).
- เปลี่ยนเป็น Disabled/Blacklist/soft-delete = **บังคับ comment**.
- **★ ตั้ง/เคลียร์ flag ต้องติดตาม = บังคับเหตุผล** (follow-up reason) + audit.
- **★ Hard block Disabled/Blacklist:** ห้ามเลือก/ยืนยันลูกค้า Disabled/Blacklist ในการเปิด QT/PO/SO — บล็อกจริง + ข้อความชัด (§4.2).
- **mismatch TYPE ตอนเปิด order:** เปิด OEM order ให้ลูกค้าที่ TYPE ไม่มี OEM (หรือ Own-Brand SO ให้ลูกค้าที่ไม่มี Own-Brand) = **เตือน (warning) ไม่บล็อก** — คนละกฎกับ hard block ข้างบน.
- **★ Edit = all fields (§2b):** โหมด edit เปิดครบทุกฟิลด์เท่ากับ create · financial summary + รหัส CUS ยัง read-only · ทุกการแก้ลง audit/management-history.

## 10. Pagination / Search (global)
- ทุก list/history: **20/หน้า** (G1).
- customers list: search ชื่อ/เบอร์/รหัส + filter สถานะ/TYPE/Sale + **filter ⚑ ต้องติดตาม (yes/no)**.
- QT/PO history: search เลข **หรือ** ช่วงวันที่สร้าง (G2).
- **Customer search dropdown (G4)** — component ที่ถูกใช้ซ้ำบน quotation-create/po-create/so-create: ค้นด้วย **เบอร์โทร / ชื่อบริษัท / ชื่อผู้ติดต่อ / เบอร์ผู้ติดต่อ**; เมื่อ match แสดง **สถานะ + credit term (+ ⚑ ถ้าต้องติดตาม)**; **ลูกค้า Disabled/Blacklist = เลือกไม่ได้ (บล็อก §4.2)**; เปิด customer detail (modal) แล้วกลับได้โดยฟอร์ม order ไม่หาย.

## 11. Cross-links
- **Financial summary → `invoice.md` (§4/§6/§9).**
- Credit term → `po.md`/`so.md` (billing/overdue) · README §2.2.
- Customer dropdown + **hard block Disabled/Blacklist** → `quotation.md` §5/§8, `po.md` §5/§7, `so.md` §5/§8.
- **Status enum r2 + follow-up flag → `entity-status-map.md` §1.1** (status source-of-truth reference — บันทึกการเปลี่ยน enum + flag ที่นั่น).
- Deletion → deletion-policy §2.1/§2.6 · RBAC → `permission-matrix.md`.

## 12. ★ Open question ถึงปอนด์ (1 ข้อ — status enum disposition)
**การถอด "Follow-up" ออกจาก status enum:** default ที่ spec นี้ใช้ = **ถอด** ("Follow-up" ไม่เป็นสถานะ, เหลือ 5 สถานะ + flag แยก) เพราะตรงกับ "แยกออกมาจาก status ปกติ". **ต้องให้ปอนด์ยืนยัน** ว่าจะถอดจริง หรือคงคำว่า "Follow-up" ไว้เป็นสถานะด้วย (ดูตัวเลือกใน status.json / คำถาม Thai). เมื่อยืนยันแล้ว → sync `entity-status-map.md` §1.1 + dashboard tile/filter ที่อ้าง 6 สถานะเดิม.
> **หมายเหตุ:** "Edit = all fields" (§2b) **ไม่ใช่ open question** — settled, UX/UI ทำได้ทันที.

## 13. Module changelog
- **★ เพิ่ม (2026-07-29 — ปอนด์ Customer feedback):**
  - **Financial summary** บน customer-detail (ยอดซื้อรวม/จ่ายมาแล้ว/ค้างชำระ · computed read-only · derive จาก invoice+payment · §7).
  - **Follow-up flag** เป็น attribute อิสระ (boolean + reason + who/when) ควบคู่ได้ทุกสถานะ · badge แยกจาก status · list/history filter ได้ (§4.1/§10).
  - **Hard block** เปิดงานขาย (QT/PO/SO) เมื่อ Disabled/Blacklist (§4.2/§9) — คนละกฎกับ TYPE mismatch (warn).
- **★ เพิ่ม (2026-07-29 — Customer add-on, PO module 3 review):** **Edit = ALL fields** — หน้าแก้ไขลูกค้าเปิดให้แก้ได้ครบทุกฟิลด์เท่ากับ Create (บริษัท/ธุรกิจ, TYPE, credit term, ภาษี/ที่อยู่, สถานะ 5-status, ⚑ flag, ผู้ติดต่อ) **ไม่ใช่แค่ผู้ติดต่อ** · financial summary + รหัส CUS ยัง read-only · ทุกการแก้ลง audit/management-history · สิทธิ์ราย action คงเดิม (Update/Approve) (§2b/§3/§8/§9). **settled — ไม่ใช่ open question.**
- **★ แก้:** status enum **6 → 5** (ถอด "Follow-up" · default, รอปอนด์ยืนยัน §12) → sync entity-status-map §1.1.
- **คงเดิม:** TYPE (OEM/Own-Brand, both) · credit term preset 30/60/90 default 60 · management-history รวม section · QT/PO history · customer search dropdown (G4).
