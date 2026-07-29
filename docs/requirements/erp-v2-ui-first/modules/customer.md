# Module — Customer (ลูกค้า)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29
Mockups: `mockups/customers.html` · `mockups/customer-detail.html` · `mockups/customer-create.html` · `mockups/contact-create.html`
กฎอ้างอิง: entity-status-map §1.1 (**status enum r2 = 5 สถานะ + follow-up flag แยก** — ★ DECIDED ปอนด์ยืนยัน 2026-07-29: ถอด "Follow-up") · deletion-policy §2.1/§2.6 · README §3 (G1–G5) · README §2.2 (credit term) · `invoice.md` (financial roll-up) · **`po.md` §5.2 (PO edit → raise follow-up)** · **`production.md` §7.6 (edit-PO from production)**

## สรุปภาษาไทย
โมดูลลูกค้า: เพิ่ม **TYPE = OEM และ/หรือ Own-Brand** (เป็นได้ทั้งคู่) · **Credit term ระดับลูกค้า 30/60/90 default 60** (override รายใบได้). **★ 3 เรื่องใหม่ (ปอนด์ 2026-07-29):** (1) หน้า detail โชว์ **สรุปการเงินลูกค้า** = ยอดซื้อรวม / จ่ายมาแล้ว / ยังไม่จ่าย(ค้างชำระ) — คำนวณจากใบแจ้งหนี้+การรับชำระ, THB, read-only. (2) **"ต้องติดตาม (needs follow-up)" แยกเป็น flag อิสระ** (boolean + เหตุผล + ใคร/เมื่อ) **ควบคู่ได้กับทุกสถานะ** — **★ DECIDED (ปอนด์ยืนยัน 2026-07-29 · ตัวเลือก A): ถอด "Follow-up" ออกจาก status enum** เหลือ Lead/Active/Inactive/Disabled/Blacklist. **★ flag ถูก raise จาก cross-module cascade ได้ รวม "PO ถูกแก้ไข (รวมจากบริบทการผลิต — under-production)" ให้ Sale เห็น (po.md §5.2 / production.md §7.6).** (3) **Disabled/Blacklist = บล็อกการเปิดงานขายทั้งหมด (QT/PO/SO) แบบ HARD block**. **★ 1 เรื่องใหม่ (Customer add-on):** **หน้า EDIT ลูกค้าต้องแก้ได้ครบทุกฟิลด์ = ชุดเดียวกับตอน Create**; financial summary ยัง read-only; ทุกการแก้ลง audit. หน้า detail โชว์ **QT history + PO history**.

---

## 1. Purpose
จัดการ master ลูกค้า (ข้อมูล + ผู้ติดต่อ + credit + **สรุปการเงิน**) และเป็นจุดเริ่ม/อ้างอิงของทุก order (OEM Quotation/PO, Own-Brand SO). รองรับ lifecycle **5 สถานะ + flag "ต้องติดตาม" แยกอิสระ**, การมอบหมาย Sale, ประวัติการค้าเต็มรูป (QT/PO), และ **การบล็อกงานขายเมื่อ Disabled/Blacklist** เพื่อ traceability + การควบคุมความเสี่ยงเครดิต.

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `customers.html` (list) | รายชื่อลูกค้า + filter (สถานะ, **TYPE**, Sale ที่ดูแล, **⚑ ต้องติดตาม**) + search |
| `customer-detail.html` | ข้อมูลลูกค้า + ผู้ติดต่อ + **สรุปการเงิน (financial summary)** + **⚑ flag ต้องติดตาม (แยกจาก status badge)** + **management-history (section เดียว)** + **QT history** + **PO history** |
| `customer-create.html` (add/edit) | เพิ่ม/แก้ลูกค้า — **★ Edit = ครบทุกฟิลด์เท่ากับ Create** (§2b) |
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
- **ข้อยกเว้น (read-only):** **financial summary (§7)** = computed อย่างเดียว · **รหัสลูกค้า `CUS-…`** = computed.
- **Audit:** **ทุกการแก้ฟิลด์ลง field-audit + แสดงใน management-history** (ใคร/เมื่อ/เดิม→ใหม่) — §5 / traceability.md §4.
- **สิทธิ์:** แก้ฟิลด์ทั่วไป = Customer.**Update (U)**; เปลี่ยนสถานะ Disabled/Blacklist + reassign Sale = Customer.**Approve (A)** (§8).

## 3. Fields
| ฟิลด์ | หน่วย/ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| รหัสลูกค้า `CUS-{NNNNNN}` | string | computed (auto) | gapless · **แก้ไม่ได้** |
| ชื่อบริษัท | text | editable (create + **edit**) | ใช้ค้นใน customer dropdown (G4) + **ค้นในคิวผลิต (production.md §6)** |
| **TYPE** | multi-select {OEM, Own-Brand} | editable (create + **edit**) | **เลือกได้ทั้งคู่** · **mismatch = เตือนไม่บล็อก** |
| สถานะ | enum **5 สถานะ** | editable (create + **edit**; บาง state auto/ต้อง Approve) | **Lead/Active/Inactive/Disabled/Blacklist** (entity-status-map §1.1 r2) · **★ DECIDED: ถอด "Follow-up" ออกจาก enum → flag แยก (§12)** |
| **⚑ ต้องติดตาม (follow-up flag)** | boolean | editable (create + **edit**) | **แยกอิสระจาก status — co-exist กับทุกสถานะ** · เปิด flag = **บังคับกรอกเหตุผล** · เก็บ ใคร/เมื่อ (audit) · **★ raise ได้จาก cross-module (เช่น PO ถูกแก้ไข — §4.1)** |
| เหตุผลต้องติดตาม (follow-up reason) | text | editable (เมื่อ flag=true) | เช่น "ติดเงิน/ค้างชำระ", "PO-xxx ถูกแก้ไข" · แสดงบน badge/tooltip |
| **Credit term (ระดับลูกค้า)** | enum {30, 60, 90} วัน | editable (create + **edit**) | **DEFAULT = 60** · override รายใบแจ้งหนี้ยังได้ |
| Sale ที่ดูแล (owner) | ref user | editable (reassign, Approve) | reassign = Sale Manager/Admin (§5) |
| ผู้ติดต่อ (contacts) | list {ชื่อ, เบอร์, อีเมล, หลัก?} | editable (create + **edit**) | ต้องมีผู้ติดต่อหลัก 1 คน · **ชื่อ/เบอร์ผู้ติดต่อใช้ค้นในคิวผลิต (production.md §6)** |
| เบอร์โทรบริษัท | phone | editable (create + **edit**) | ใช้ค้นใน customer dropdown (G4) |
| ที่อยู่/เลขภาษี | text | editable (create + **edit**) | ใช้ออกเอกสาร |
| **ยอดซื้อรวม (total purchased)** | THB | **computed (read-only)** | Σ grand total ใบแจ้งหนี้ (ไม่รวม void) — §7 |
| **จ่ายมาแล้ว (total paid)** | THB | **computed (read-only)** | Σ การรับชำระ — §7 |
| **ยังไม่จ่าย / ค้างชำระ (outstanding)** | THB | **computed (read-only)** | = ยอดซื้อรวม − จ่ายมาแล้ว — §7 |

## 4. Statuses / lifecycle (r2 — 5 สถานะ + follow-up flag แยก)
**สถานะหลัก 5 สถานะ (source: entity-status-map §1.1 r2):** **ผู้สนใจ (Lead)** → **ลูกค้าประจำ (Active)** (auto เมื่อยืนยัน order ใบแรก) → **ห่างหาย (Inactive)** (auto scheduler) · **ปิดใช้งาน (Disabled)/บัญชีดำ (Blacklist)** (Sale Manager/Admin, บังคับ comment).
- **★ "Follow-up" ไม่เป็นสถานะอีกต่อไป (DECIDED · §12)** → แทนด้วย **flag "ต้องติดตาม"** ที่ **ควบคู่ได้กับทุกสถานะ** (§4.1).
- **Soft-delete** ได้เสมอ (deletion-policy §2.1) — PO เดิมเดินต่อ, **ห้ามเปิด order ใหม่**, หายจาก dropdown.

### 4.1 ★ Follow-up flag (attribute แยกจาก status)
- **เป็น boolean อิสระ** — ตั้ง/เคลียร์ได้โดยไม่แตะสถานะหลัก. ตัวอย่าง: **Blacklist + ⚑ ต้องติดตาม** (ติดเงิน) · **Active + ⚑ ต้องติดตาม** (PO ที่เปิดมีปัญหา/ถูกแก้).
- ตั้ง flag = **บังคับเหตุผล** (follow-up reason) + เก็บ **ใคร/เมื่อ** (audit) → ลง management-history.
- **สัญญาณบน UI = แยก badge จาก status badge** เสมอ (chip ⚑ "ต้องติดตาม" สีเตือน + tooltip เหตุผล).
- **แหล่งที่มา flag:** **(a) manual** (Sale/Sale Manager) · **(b) auto จาก cross-module cascade** — เช่น **PRD Hold เหตุลูกค้า**, **invoice Overdue**, **★ PO ถูกแก้ไข (รวมจากบริบทการผลิต — under-production ที่ลดจำนวนสั่งให้ = ผลิตจริง, `po.md` §5.2 / `production.md` §7.6)** — cross-module ตั้ง flag + เหตุผลอ้างเอกสาร. ทุกครั้งลง audit.
- **flag ไม่บล็อกงานขาย** — เป็นแค่ป้ายเตือน/ตัวกรอง.

### 4.2 ★ Hard block: Disabled / Blacklist ห้ามเปิดงานขาย
เมื่อสถานะลูกค้า = **Disabled** หรือ **Blacklist** → **บล็อกการเปิดงานขายทุกชนิด (QT, PO, SO) แบบ HARD block**:
- เป็น **HARD block (ไม่ใช่เตือน)** — ป้องกันไม่ให้เลือก/ยืนยันลูกค้ารายนี้ในหน้า create ของ QT/PO/SO.
- **customer search dropdown (G4):** ลูกค้า Disabled/Blacklist **ยังค้นเจอ + แสดงสถานะ** แต่ **เลือกไม่ได้** พร้อมข้อความชัด.
- **ต่างจาก TYPE mismatch:** TYPE ไม่ตรง = **เตือนไม่บล็อก**; Disabled/Blacklist = **บล็อกจริง**.
- **flag "ต้องติดตาม" ไม่บล็อก**.
- ราย order module: `quotation.md` §5/§8, `po.md` §5/§7, `so.md` §5/§8.

## 5. ★ Management-history (section เดียว — consolidated)
รวม 3 อย่างเป็น **section เดียว** บน customer-detail:
1. **เปลี่ยนสถานะ / มอบหมาย + ตั้ง/เคลียร์ flag ต้องติดตาม** — เปลี่ยน 5 สถานะ (บังคับ comment ตาม state), ตั้ง/เคลียร์ ⚑ (บังคับเหตุผล), มอบหมายงานติดตาม.
2. **บันทึก / ประวัติการจัดการ** — timeline (comment, การติดต่อ, การเปลี่ยนสถานะ, ตั้ง/เคลียร์ flag **รวมที่ raise จาก cross-module cascade เช่น PO ถูกแก้**, **★ การแก้ฟิลด์ใด ๆ ของลูกค้า — §2b**) เรียงเวลา.
3. **Sale ที่ดูแล (reassign)** — เปลี่ยนผู้ดูแล (Sale Manager/Admin) + เหตุผล; bulk reassign ตอนลบ Sale (deletion-policy §2.2).
> ทุก entry เก็บ ใคร/เมื่อไหร่/เหตุผล (audit). paginate 20/หน้า (G1).

## 6. ★ QT history + PO history (บน customer-detail)
- **ประวัติใบเสนอราคา (Quotation history):** list QT ของลูกค้า · **ค้นเลข QT หรือช่วงวันที่สร้าง** (G2) · 20/หน้า (G1) · drill-back ไม่เสีย state (G3).
- **ประวัติ PO:** list PO ของลูกค้า · ค้นเลข PO หรือช่วงวันที่สร้าง (G2) · 20/หน้า · drill-back ไม่เสีย state.
- (Own-Brand) SO history ในรูปแบบเดียวกัน (optional tab).

## 7. ★ Financial summary (บน customer-detail — computed roll-up)
| ฟิลด์ | นิยาม / ที่มา | หน่วย |
|---|---|---|
| **ยอดซื้อรวม (Total purchased)** | Σ grand total (รวม VAT) ของใบแจ้งหนี้ทั้งหมดของลูกค้า (ไม่รวม void) | THB |
| **จ่ายมาแล้ว (Total paid)** | Σ ยอดรับชำระ (invoice.md §6) | THB |
| **ยังไม่จ่าย / ค้างชำระ (Outstanding)** | = ยอดซื้อรวม − จ่ายมาแล้ว | THB |

- **read-only/computed ล้วน** (รวมในโหมด edit ก็ยัง read-only — §2b).
- **ขอบเขต:** ยึด **ใบแจ้งหนี้ (Invoice)** เป็นฐาน.
- **Cross-link:** `invoice.md` (§4/§6/§9).

## 8. Actions & Permissions (per-action, D14/§7.1)
| ปุ่ม/action | Permission required (Customer module) |
|---|---|
| ดูรายชื่อ/detail/history/**financial summary** | Customer.**Read (R)** |
| สร้างลูกค้าใหม่ | Customer.**Create (C)** |
| **แก้ข้อมูลลูกค้า — ★ ครบทุกฟิลด์** | Customer.**Update (U)** |
| เปลี่ยนสถานะ Lead/Active | Customer.**Update (U)** (บังคับ comment ตาม state) |
| **ตั้ง/เคลียร์ ⚑ flag ต้องติดตาม (+ เหตุผล)** | Customer.**Update (U)** (บังคับเหตุผล) · **cross-module raise (เช่น PO edit) = ระบบตั้งให้ auto + เหตุผลอ้างเอกสาร** |
| ตั้ง Disabled / Blacklist | Customer.**Approve (A)** + comment |
| reassign Sale ที่ดูแล | Customer.**Approve (A)** |
| soft-delete ลูกค้า | Customer.**Delete (D)** + comment |
| กู้คืน (undelete) | Customer.**Admin** |
| เปิด modal detail จากหน้า order | Customer.**Read (R)** |

## 9. Validations
- TYPE ต้องเลือกอย่างน้อย 1.
- Credit term บังคับเลือก (default 60).
- ต้องมีผู้ติดต่อหลัก 1 คนเสมอ (deletion-policy §2.6).
- เปลี่ยนเป็น Disabled/Blacklist/soft-delete = **บังคับ comment**.
- **★ ตั้ง/เคลียร์ flag ต้องติดตาม = บังคับเหตุผล** + audit (รวม cross-module raise เช่น PO edit — เหตุผล = อ้างเอกสารต้นทาง).
- **★ Hard block Disabled/Blacklist:** ห้ามเลือก/ยืนยันลูกค้า Disabled/Blacklist ใน QT/PO/SO (§4.2).
- **mismatch TYPE** = เตือน ไม่บล็อก.
- **★ Edit = all fields (§2b):** เปิดครบทุกฟิลด์ · financial summary + รหัส CUS read-only.

## 10. Pagination / Search (global)
- ทุก list/history: **20/หน้า** (G1).
- customers list: search ชื่อ/เบอร์/รหัส + filter สถานะ/TYPE/Sale + **filter ⚑ ต้องติดตาม (yes/no)**.
- QT/PO history: search เลข **หรือ** ช่วงวันที่สร้าง (G2).
- **Customer search dropdown (G4)** — ใช้ซ้ำบน quotation/po/so-create: ค้น **เบอร์โทร / ชื่อบริษัท / ชื่อผู้ติดต่อ / เบอร์ผู้ติดต่อ**; แสดง **สถานะ + credit term (+ ⚑)**; **Disabled/Blacklist = เลือกไม่ได้ (§4.2)**.

## 11. Cross-links
- **Financial summary → `invoice.md` (§4/§6/§9).**
- Credit term → `po.md`/`so.md` · README §2.2.
- Customer dropdown + **hard block Disabled/Blacklist** → `quotation.md` §5/§8, `po.md` §5/§7, `so.md` §5/§8.
- **★ Follow-up flag reuse (cross-module raise) → `po.md` §5.2 (PO edit) · `production.md` §7.6 (edit-PO from production).**
- **Status enum r2 + follow-up flag → `entity-status-map.md` §1.1.**
- Deletion → deletion-policy §2.1/§2.6 · RBAC → `permission-matrix.md`.

## 12. ★ Status enum disposition — DECIDED (ปอนด์ยืนยัน 2026-07-29)
**ถอด "Follow-up" ออกจาก status enum → 5 สถานะ (Lead/Active/Inactive/Disabled/Blacklist) + flag ⚑ "ต้องติดตาม" แยกอิสระ**. sync `entity-status-map.md` §1.1 (r6) + dashboard tile/filter.
> **ไม่มี open question ค้างในโมดูลนี้.** "Edit = all fields" (§2b) = settled.

## 13. Module changelog
- **★ เพิ่ม (2026-07-29 — ปอนด์ Customer feedback):** Financial summary · Follow-up flag (attribute อิสระ) · Hard block QT/PO/SO เมื่อ Disabled/Blacklist.
- **★ เพิ่ม (2026-07-29 — Customer add-on):** **Edit = ALL fields** · financial summary + รหัส CUS read-only.
- **★ DECIDED (2026-07-29 — ตัวเลือก A):** status enum **6 → 5** (ถอด "Follow-up" → flag ⚑).
- **★ เพิ่ม (2026-07-29 — Production module review, ปอนด์):** **follow-up flag ถูก raise จาก cross-module cascade เพิ่ม "PO ถูกแก้ไข (รวมจากบริบทการผลิต — under-production)"** ให้ Sale เห็น (§3/§4.1/§5/§8/§9/§11, ref `po.md` §5.2 / `production.md` §7.6). ใช้กลไก flag เดิม (reuse) — ไม่ใช่สถานะ, ไม่บล็อก.
- **คงเดิม:** TYPE (OEM/Own-Brand, both) · credit term preset 30/60/90 default 60 · management-history · QT/PO history · customer search dropdown (G4).
