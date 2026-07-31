# Module — Settings (RBAC cumulative levels + Users + VAT + Company + Audit)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 (**+ Audit-log review r12 2026-07-30 · ★★★★★★ + CUMULATIVE-level role editor r16 2026-07-31 · ★★★★★★★ + user email = reset address + Admin re-enable self-disabled account r17 2026-07-31**) · **AUTHORITATIVE SPEC** (absorbs functional-spec `settings.html` US-SET-01..05 + rbac-deletion + 3 new modules · **★ Settings module review 2026-07-29: role search/filter/user-list/remove-user/disable+soft-delete · user search + password modes + Google link · Admin-only VAT/Company/Audit** · **★ Sale delete → customers unassigned/blank (ปอนด์ 2026-07-29, resolve US-SET-02)** · **★★★★★★ Role-permission editor = per-module SINGLE LEVEL selector (cumulative R<C<U<D<A<Admin) — ปอนด์ 2026-07-31**)
Mockups: `mockups/settings.html` · `mockups/login.html` (login basic-vs-Google choice · **★ +"ลืมรหัสผ่าน"**) · `mockups/reset-password.html` (**★ ใหม่ — reset ใช้ email field นี้**)
กฎอ้างอิง: **D14** (RBAC cumulative) · rbac-deletion (soft-delete baseline) · `permission-matrix.md` §1a (cumulative level model) + §3/§3.1 (capability→action→level) · `platform.md` (login local+Google + session + **★★★★★★★ reset password A12 + self-disable A11**) · `invoice.md` (VAT/ข้อมูลบริษัท) · `non-functional.md` (auth/audit — **A3 cumulative + AU1 non-read + login · ★★★★★★★ A9 password policy/A10 storage/A11 self-disable/A12 reset**) · `deletion-policy.md` §2.14 (Role) · **`deletion-policy.md` §2.15 (Sale delete → ลูกค้า unassigned)** · `customer.md` §3/§5 (Sale ที่ดูแล = nullable) · `traceability.md` (audit source เดียว — **§3 entity Auth/login + §5b sample**) · README §3

## สรุปภาษาไทย
Settings 5 หน้าจอ: **1) Role & สิทธิ์** — **★★★★★★ ใหม่ (ปอนด์ 2026-07-31): โมเดลสิทธิ์เป็น "ลำดับชั้นสะสม" (cumulative). แต่ละ role เลือก "ระดับเดียวต่อ module" (radio/dropdown: R / C / U / D / A / Admin) ไม่ใช่ติ๊ก checkbox แยกราย action อีกต่อไป**. ลำดับ **R < C < U < D < A < Admin** และแต่ละระดับ**รวมทุก action ที่ต่ำกว่าอัตโนมัติ**. มี **explainer อธิบายว่าแต่ละระดับให้สิทธิ์อะไรบ้าง (สะสม)** ข้างตัวเลือก; role ไม่จำกัดจำนวน — **★ ค้นหา role · กรองสถานะ Active/Disabled/Deleted · ดูรายชื่อผู้ใช้ในแต่ละ role + ถอด user · ปิดใช้งาน role (Disable) และลบ role (Soft-delete)**. **2) ผู้ใช้** (สร้าง/ผูก Google/เปิด-ปิด/เปลี่ยน role/**ลบ→ลูกค้าที่ดูแลกลายเป็นไม่มีผู้ดูแล (Sale ว่าง) อัตโนมัติ**) — **★ ค้นหาผู้ใช้จากชื่อ-สกุลหรือ username · ตั้งรหัสผ่าน 2 โหมด (ตามเกณฑ์รหัส A9) · กรอกรหัส 2 ครั้ง + ดู/ซ่อน · edit ไม่โชว์รหัสเดิม · ผูก Google account · ★★★★★★★ กรอกอีเมล (บังคับ) = ที่อยู่รับลิงก์รีเซ็ตรหัสผ่าน · ★★★★★★★ Admin เปิดคืนบัญชีที่ผู้ใช้ปิดเอง (re-enable self-disabled)**. **3) Config VAT** **4) ข้อมูลบริษัท** **5) Audit log** — **★ ทั้งสามแท็บนี้เข้าถึงได้เฉพาะสิทธิ์ Admin เท่านั้น**. **★ ลบ Sale → ลูกค้าที่ดูแลกลายเป็น Sale ว่างอัตโนมัติ**. auth: local + Google · session 24 ชม. + reset 06:00 + เตือน 5 นาที. **matrix ต้องมีแถว module ใหม่: Quotation, SO, Supply Planning**. **การเปลี่ยนแปลงทุกอย่างใน Settings ถูก audit + โผล่ trace**. **★★★★ r12: Audit log = "ทุกกิจกรรมที่ไม่ใช่การอ่าน" ในทุก module รวม login/logout + ★★★★★★★ self-disable/re-enable + password-reset** · ค้น user id/username + ช่วงวันที่ + filter module · retention 1 ปี · Admin only.

---

## 1. Purpose
ศูนย์กลาง config การเข้าถึง (RBAC cumulative per-module level) + จัดการผู้ใช้/รหัสผ่าน/**★★★★★★★ อีเมล (reset address)**/Google link/ลบอย่างปลอดภัย (ลบ Sale → ลูกค้าที่ดูแลกลายเป็นไม่มีผู้ดูแล/Sale ว่าง อัตโนมัติ) + **★★★★★★★ Admin เปิดคืนบัญชีที่ผู้ใช้ปิดเอง** + ตั้ง VAT/ข้อมูลบริษัทสำหรับเอกสารภาษี (Admin only) + audit log ทั้งระบบ (Admin only — **ทุกกิจกรรม non-read + login/self-disable/reset**).

## 2. Screens (5 แท็บ)
| แท็บ | บทบาท | สิทธิ์เข้าถึง |
|---|---|---|
| Role & สิทธิ์ | สร้าง role + **★★★★★★ เลือกระดับสิทธิ์เดียวต่อ module (R/C/U/D/A/Admin, cumulative)** + explainer · **★ ค้นหา role · filter Active/Disabled/Deleted · รายชื่อ user ใน role + ถอด user · Disable / Soft-delete / Restore role** | ดู = Settings.R · จัดการ = Settings.Admin |
| ผู้ใช้ | สร้าง/ผูก Google/เปิด-ปิด/เปลี่ยน role/**ลบ→ลูกค้าที่ดูแลกลายเป็น Sale ว่าง (unassigned)** · **★ ค้นหาชื่อ-สกุล/username · password mode + confirm-twice + show/hide (เกณฑ์ A9) · edit ไม่โชว์รหัสเดิม** · **★★★★★★★ กรอกอีเมล (บังคับ) = ที่อยู่รับลิงก์รีเซ็ต · ★★★★★★★ ปุ่ม "เปิดคืนบัญชี" สำหรับบัญชีที่ผู้ใช้ปิดเอง (self-disabled)** | ดู = Settings.R · จัดการ = Settings.Admin |
| Config VAT | อัตรา + effective date + ประวัติ | **★ Admin only** |
| ข้อมูลบริษัท | ชื่อ/เลขภาษี 13 หลัก/ที่อยู่/เบอร์/อีเมล/logo | **★ Admin only** |
| Audit log | **ทุกกิจกรรม non-read ทุก module + login/logout + ★★★★★★★ self-disable/re-enable/password-reset** · **ค้น user id/username + ช่วงวันที่กิจกรรม + filter module** · คอลัมน์ เวลา/ผู้ใช้/module/action(event)/object ref/old→new/เหตุผล · sort/pagination — source เดียวกับ Traceability | **★ Admin only** |

## 3. Fields
| ฟิลด์ | ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| **role → ระดับสิทธิ์ต่อ module** | **{module → SINGLE level enum: R / C / U / D / A / Admin (หรือ "ไม่มีสิทธิ์")}** | editable | **★★★★★★ r16: เลือกได้ 1 ระดับต่อ module (radio/dropdown), ไม่ใช่ติ๊กหลาย checkbox. ระดับสะสม (cumulative) ตาม §4 — ว่าง = ไม่มีสิทธิ์บน module นั้น** |
| **role สถานะ** | enum {Active / Disabled / Deleted} | editable (via action) | **★ Active = grant · Disabled = พักชั่วคราว (reversible) · Deleted = soft-delete (recoverable)** — Disabled/Deleted = member เสีย permission ของ role นี้ |
| **role → รายชื่อ user (membership)** | list | computed + action | **★ ดูสมาชิกของ role + ปุ่มถอด user ออกจาก role** |
| user {**ชื่อ-สกุล**, **username**, **★★★★★★★ อีเมล (บังคับ)**, role, Google link, สถานะ} | record | editable | **★ username = ใช้ local login · ชื่อ-สกุล = แสดง/ค้นหา** · Active/ปิดใช้งาน |
| **★★★★★★★ user email** | text (บังคับ, รูปแบบอีเมล, unique-ต่อ-active-user แนะนำ) | editable | **★ = ที่อยู่รับ "ลิงก์รีเซ็ตรหัสผ่าน" (single-use, 3 วัน — platform.md A12)** · เป็นข้อมูลจำเป็นของ user record (ไม่ว่าง) · แก้ได้โดย Admin |
| **user password** | set-only | editable (write-only) | **★ กรอก 2 ครั้ง (ยืนยัน) + toggle ดู/ซ่อน · edit-user ไม่แสดงรหัสเดิม · ★★★★★★★ ต้องผ่านเกณฑ์ A9 (≥8 lower+upper+digit) · เก็บ encrypt+hash (A10)** |
| **password mode** | radio {must-change-first-login / permanent} | editable | **★ "ต้องเปลี่ยนเมื่อเข้าครั้งแรก" หรือ "ตั้งแบบถาวร"** |
| **★★★★★★★ account state (self-disable)** | flag {Active / Self-disabled / Soft-deleted} | computed + Admin-action | **★ ผู้ใช้ปิดเอง (self-disable, platform.md A11) → login ถูกบล็อก · Admin กด "เปิดคืนบัญชี" → Active** |
| **Google account link** | {linked email / ยังไม่ผูก} | editable (action) | **★ ผูก/ยกเลิกผูก → ตอน login เลือก basic หรือ Google** (platform.md) |
| VAT {อัตรา%, effective date, ผู้ตั้ง} | list | editable | ยึด invoice date · ไม่ทับซ้อน · **Admin only** |
| ข้อมูลบริษัท | {ชื่อ, เลขภาษี 13 หลัก, ที่อยู่, เบอร์, อีเมล, logo} | editable | เลขภาษี = ตัวเลข 13 หลัก · **Admin only** |
| **audit row** | {เวลา, ผู้ใช้ (id/username), module, **action(event)**, object ref (entity+id), field, จาก→เป็น, เหตุผล} | computed | **Admin only** · **★ r12: action/event = create/update/delete-void-cancel/approve/status-change/config/password-reset/role-user-change/stock-movement/comment-edit/`login`/`logout`/first-login-change · ★★★★★★★ account self-disable / re-enable / password-reset-request-complete** · login/logout/self-disable ไม่มี object ref/field/old→new |

## 4. ★★★★★★ RBAC model — CUMULATIVE per-module level (D14 · ปอนด์ 2026-07-31, r16)
> **โมเดลสิทธิ์ = ลำดับชั้นสะสม.** แต่ละ role เลือก **1 ระดับต่อ module**; ระดับนั้น **รวมทุก action ที่ต่ำกว่า**. authoritative = `permission-matrix.md` §1a.

**ลำดับ (ต่ำ→สูง): `R < C < U < D < A < Admin`** — ⚠️ **Create (C) อยู่ต่ำกว่า Update (U)** (ต่างจากตัวอักษร "RUCDAA").

| ระดับ | ให้สิทธิ์ (สะสมลงล่าง) |
|---|---|
| **R** Read | ดู/ค้น/รายงาน · พิมพ์/แชร์ PDF |
| **C** Create | **R** + สร้างเอกสาร/record/master ใหม่ |
| **U** Update | **R+C** + แก้ค่า/เปลี่ยนสถานะปกติ · แก้ sub-record · comment |
| **D** Delete | **R+C+U** + soft-delete / void / cancel / inactivate |
| **A** Approve | **R+C+U+D** + อนุมัติ / สิทธิ์ระดับสูง (Blacklist/reassign/reopen/แก้สถานะ DN ตรง) |
| **Admin** | **R+C+U+D+A** + admin-only: force-override/undelete/restore/config · **gate VAT/Company/Audit-log** · **★★★★★★★ re-enable บัญชีที่ self-disabled (A11)** |

- **role editor (แท็บ Role & สิทธิ์):** ต่อ module = **ตัวเลือกระดับเดียว** (radio/dropdown) + ตัวเลือก "ไม่มีสิทธิ์" · แสดง **explainer สะสม** + สรุป **effective actions ของระดับที่เลือก**.
- **การ gate ปุ่ม:** ปุ่มที่ต้องรหัส **X** (ตาม `permission-matrix.md` §3 Suffix) = ผู้ใช้ต้องมีระดับ **≥ X** บน module นั้น.
- **Admin-only areas (VAT / ข้อมูลบริษัท / Audit-log · ★★★★★★★ re-enable self-disabled) = ต้องระดับ Admin เป๊ะ.**
- **Module ในระบบ (รวมใหม่):** Customer · **Quotation** · PO · **SO** · **Supply Planning** · BOM · Warehouse/Stock · Production · QC · Shipping · Invoice · PR · Supplier · Settings/User-Role. (ดู `permission-matrix.md`).

## 4b. ★ Role lifecycle & semantics (Settings review 2026-07-29)
- **โมเดล:** 1 role → many users. **★★★★★★ Effective level ของผู้ใช้ต่อ module = ระดับ "สูงสุด (max)" จาก role ที่ Active ทั้งหมด** (union → max level).
- **สถานะ role มี 3 แบบ + filter ได้:**
  - **Active** — role grant ระดับให้สมาชิกตามปกติ.
  - **Disabled (ปิดใช้งานชั่วคราว)** — **สมาชิกทุกคนเสีย permission ของ role นี้ทันที** (reversible) → กด **Enable** กลับได้.
  - **Deleted (soft-delete)** — **สมาชิกเสีย permission เช่นกัน**; role **ไม่ถูกลบจริง** (retained, กู้คืนได้ผ่าน **Restore/undelete**).
  - > Disabled กับ Deleted **strip permission เหมือนกัน**; ต่างกันที่ **เจตนา lifecycle**.
- **★ Membership คงอยู่** เมื่อ Disable/Delete: user ยังผูกกับ role — แค่ role ไม่ grant.
- **★ ไม่ต้องย้าย user ออกก่อน Disable/Delete** — member เสีย permission โดยกลไกเอง. **supersede** "ลบ role บล็อกจนย้าย user ออกหมด" (rbac-deletion). Admin **อาจ** ถอด user ทีละคนได้ (optional).
- **★ ค้นหา role + filter สถานะ** (Active/Disabled/Deleted) บนหน้า role list.
- **สิทธิ์:** Disable/Enable · Restore · Remove-user-from-role · สร้าง/แก้ **ระดับต่อ module** = **Settings.Admin** · Soft-delete role = **Settings.D** · Restore = **Settings.Admin**. ทุก action audit + trace.

## 4c. ★ Delete Sale/User → customers become unassigned (blank) (ปอนด์ 2026-07-29 — resolve US-SET-02)
- **การลบผู้ใช้ = soft-delete** (deletion-policy §1) + ปิด login — ผู้ใช้ยังปรากฏใน trace/ประวัติเดิม (read-only), กู้คืน = Admin.
- **★ ผลต่อลูกค้าที่ Sale คนนั้นดูแล:** เมื่อลบ Sale → **ฟิลด์ "Sale ที่ดูแล" ของลูกค้าทุกรายถูกล้างเป็น BLANK (unassigned) อัตโนมัติ**.
- **★ ไม่ต้อง bulk-reassign — SUPERSEDE:** ลบได้ทันที ไม่มีหน้า/สเต็ป bulk-reassign. ตอนกดลบ แสดง confirm popup เช่น **"ลูกค้า N ราย จะไม่มีผู้ดูแล (Sale ว่าง) — มอบหมายภายหลังได้"**.
- **Sale ว่าง = state ที่ valid** · reassign ภายหลังด้วยมือ (customer.md §2b/§5, Customer.Approve).
- **audit:** การลบ Sale + การล้าง assigned-Sale ของลูกค้าแต่ละราย ถูก audit-log + management-history.
- **สิทธิ์:** ลบ Sale/User = **Settings.D** · reassign ภายหลัง = **Customer.Approve**.
- authoritative cross-ref = `deletion-policy.md` §2.15 · `customer.md` §3/§5.

## 4d. ★★★★ Audit-log coverage — every NON-READ activity + login (r12, ปอนด์ 2026-07-30 · ★★★★★★★ +r17)
- **ขอบเขต:** **ทุกกิจกรรมที่ "ไม่ใช่การอ่าน" ในทุก module ต้องถูกบันทึก audit** — ครอบ:
  - **create** (เปิดเอกสาร/record/master ใหม่ + การออกเลข G8)
  - **update** (แก้ค่า field ใด ๆ + comment edit)
  - **delete / void / cancel** (soft-delete, void เอกสาร, ยกเลิก)
  - **approve** (อนุมัติ / สิทธิ์ระดับสูง เช่น Blacklist, reopen, reassign, **แก้สถานะ DN โดยตรง**)
  - **status change** (ทุกการเปลี่ยนสถานะ: PO/SO/PRD/Batch/QC/Route/DN/Invoice/PR/GR)
  - **config change** (VAT, ข้อมูลบริษัท, **★★★★★★ role level-per-module edit**)
  - **password reset / set** (event เท่านั้น — ไม่เก็บค่า) · **★★★★★★★ password-reset-request + reset-complete (A12)**
  - **role / user change** (role lifecycle · user create/edit/สลับ Active/เปลี่ยน role/Google link-unlink/**★★★★★★★ อีเมล**/ลบ user)
  - **★★★★★★★ account self-disable (โดยเจ้าของ) + re-enable (โดย Admin)** (A11)
  - **stock movement** (GR(+)/consume(−)/loss/adjust/FG-in/surplus/return(−) — append-only ledger + reason + source, D15)
  - **★ login / logout** (login สำเร็จ + **login ล้มเหลว** + logout + first-login password change) — **PO reasonable decision:** บันทึกทั้งสำเร็จและล้มเหลว; **no auto-lockout** (A11).
- **★ การอ่าน / ดู / ค้น / เปิดหน้า / print-view = ไม่ audit**.
- **retention:** online **1 ปี** แล้ว Super User manual purge/archive (AU2).
- **การเข้าถึงหน้า Audit log:** **ระดับ Admin เท่านั้น** (A8).
- authoritative NFR = `non-functional.md` AU1/AU2 · source เดียวกับ `traceability.md`.

## 5. User Stories (absorbed + ★ delta) + AC สรุป
- **US-SET-01 (Must) — Role & สิทธิ์ + ★★★★★★ per-module LEVEL selector + ★ search/filter/user-list/disable/soft-delete:** สร้าง role "หัวหน้าคลัง" → **เลือกระดับต่อ module: Stock = U (→ ทำ R+C+U ได้), Production = R, อื่น = ไม่มีสิทธิ์** → บันทึก; ผู้ใช้ role นี้ **สร้าง/แก้ Stock ได้ แต่ลบ (D)/approve (A) ไม่ได้** (U < D). **★★★★★★ เลือกได้ระดับเดียวต่อ module; explainer + สรุป effective actions.**
  - **★ Cumulative AC:** Stock = **A** → ทำได้ R,C,U,D,approve. Stock = **C** → ทำได้แค่ R,C.
  - **★ Search/Filter:** ค้น role + filter **Active / Disabled / Deleted**.
  - **★ User list:** เปิด role → รายชื่อ user (20/หน้า) → "ถอดออกจาก role" → เสีย permission + audit.
  - **★ Disable / Soft-delete role:** ตามกฎ §4b (member เสีย permission ทันที; Restore = Admin).
  - **Edge:** เลือก Admin บน PO → เห็น force override (po US-PO-06); ต่ำกว่า Admin = ไม่เห็น. **★ role Disabled/Deleted → member login ได้แต่ 403 ทุกจุด.**
- **US-SET-02 (Must) — จัดการผู้ใช้ + ★ search/password-modes/Google-link/★★★★★★★ email + re-enable + ลบ→ลูกค้าไม่มีผู้ดูแล:** สร้าง user + **ชื่อ-สกุล + username + ★★★★★★★ อีเมล (บังคับ)** + เลือก role + Active → ล็อกอินได้; เปลี่ยน role/สลับ Active จากแถว.
  - **★ Search user:** ค้นจาก **ชื่อ-สกุล หรือ username**.
  - **★ Password setup:** เลือก **โหมด** (must-change-first-login / permanent) · กรอกรหัส **2 ครั้ง (ตรงกัน)** + **toggle ดู/ซ่อน** · **★★★★★★★ ต้องผ่านเกณฑ์ A9** (≥8, lower+upper+digit); ผิด → error ระบุเงื่อนไข.
  - **★★★★★★★ Email (บังคับ):** กรอกอีเมลของผู้ใช้ = **ที่อยู่รับลิงก์รีเซ็ตรหัสผ่าน** (platform.md A12/US-PLT-06). อีเมลว่าง/รูปแบบผิด → error. แก้อีเมลได้โดย Admin (audit).
  - **★ Edit user:** **ไม่แสดงรหัสผ่านเดิม**; ไม่กรอก = ไม่เปลี่ยน.
  - **★ Google link:** ผูก/ยกเลิก → ตอน login เลือก basic หรือ Google.
  - **★★★★★★★ Re-enable self-disabled account:** ผู้ใช้ที่กด "ปิดบัญชีของฉัน" (platform.md A11) จะขึ้นสถานะ **Self-disabled** ในรายการผู้ใช้ → Admin กด **"เปิดคืนบัญชี"** → Active → ผู้ใช้ login ได้อีกครั้ง (audit). **Re-enable = Admin เท่านั้น** (ผู้ใช้เปิดเองไม่ได้).
  - **★ Edge (RESOLVED 2026-07-29) — ลบ Sale:** ลบ Sale ที่ดูแลลูกค้า 12 ราย → กดลบได้ทันที → ลูกค้าทั้ง 12 ราย assigned-Sale = ว่าง อัตโนมัติ (§4c).
  - **Error:** รหัส 2 ครั้งไม่ตรง → "รหัสผ่านยืนยันไม่ตรงกัน"; รหัสไม่ผ่านเกณฑ์ → ระบุเงื่อนไข; username ซ้ำ → "username นี้ถูกใช้แล้ว"; **อีเมลว่าง/ผิดรูปแบบ → error**; ไม่มีระดับ Admin/Delete → ไม่ทำ + error.
- **US-SET-03 (Must) — Config VAT + effective + ประวัติ (★ Admin only):** เพิ่ม VAT 7% effective 01/01/2569 → บันทึก + ประวัติ; ใบกำกับยึด invoice date. **Error:** effective date ว่าง/ทับซ้อน → error · **ไม่มีระดับ Admin → 403**.
- **US-SET-04 (Should) — ข้อมูลบริษัท (★ Admin only):** กรอกชื่อ/เลขภาษี 13 หลัก/... + logo → ปรากฏบน invoice-print. **Error:** เลขภาษีไม่ครบ 13 หลัก → error · **ไม่มีระดับ Admin → 403**.
- **US-SET-05 (Must — ★★★★ r12 upgraded) — Audit log (★ Admin only): ทุกกิจกรรม non-read + login + ★★★★★★★ self-disable/re-enable/reset, ค้น user/username + ช่วงวัน + filter module.**
  - **ขอบเขตข้อมูล:** ทุกกิจกรรมที่ไม่ใช่การอ่าน ในทุก module + login/logout + **★★★★★★★ account self-disable/re-enable + password-reset-request/complete** (§4d) — การอ่าน/ดู/ค้น ไม่บันทึก.
  - **★ Search:** ค้นด้วย **user id / username** + **ช่วงวันที่** + **filter ตาม module**.
  - **★ Columns:** เวลา · ผู้ใช้ · module · action/event · object ref · field · จาก→เป็น · เหตุผล + pagination (20/หน้า) + sort เวลา.
  - **AC ตัวอย่าง:** filter module=Shipping + user="somsak" → "แก้สถานะ DN-…-119: อยู่ระหว่างจัดส่ง→ส่งสำเร็จ (A)"; **★★★★★★ filter module=Settings → "แก้ระดับสิทธิ์ role 'หัวหน้าคลัง' Stock: U→A"** + **★★★★★★★ "ผู้ใช้ 'nid' ปิดบัญชีตนเอง" / "Admin เปิดคืนบัญชี 'nid'"**; action=login → "login สำเร็จ (Google)" / "login ล้มเหลว (basic)".
  - **Edge:** มุมมองรวมเดียวกับ Traceability; login/logout/self-disable row ไม่มี old→new/deep-link; retention 1 ปี.
  - **Error:** **ไม่มีระดับ Admin → 403 / ไม่เห็นแท็บ**.

## 6. Actions & Permissions (D14 · cumulative — min level, `permission-matrix.md` §1a/§3)
| ปุ่ม/action | Permission required (min level) |
|---|---|
| ดูแท็บ Role/User (list/detail) · ค้น role/user | Settings.**Read (R)** |
| สร้าง role · **★★★★★★ เลือก/แก้ระดับสิทธิ์ต่อ module** · Disable/Enable role · Restore role · **ถอด user ออกจาก role** · จัดการ user · **ตั้ง/รีเซ็ตรหัสผ่าน + password mode** · **★★★★★★★ แก้อีเมล user** · **ผูก/ยกเลิก Google link** · **★★★★★★★ เปิดคืนบัญชีที่ self-disabled (re-enable)** · undelete | Settings.**Admin** |
| Soft-delete role · **ลบ user (→ ลูกค้าที่ดูแลกลายเป็น Sale ว่าง อัตโนมัติ)** | Settings.**Delete (D)** |
| reassign ลูกค้าที่กลายเป็น Sale ว่าง (ภายหลัง) | **Customer.Approve (A)** (customer.md §8) |
| **★ ดู/แก้ VAT** | Settings.**Admin** |
| **★ ดู/แก้ ข้อมูลบริษัท** | Settings.**Admin** |
| **★ ดู Audit log (ทุกกิจกรรม non-read + login + self-disable/reset)** | Settings.**Admin** |

> **★★★★★★★ หมายเหตุ:** การ **self-disable บัญชีตนเอง** ไม่ต้องใช้สิทธิ์ Settings — เป็น action ของเจ้าของบัญชี (platform.md A11); แต่ **re-enable = Settings.Admin เท่านั้น**.

## 7. Validations
- **★★★★★★ role editor: เลือกได้ 1 ระดับต่อ module** (radio/dropdown). ว่าง = ไม่มีสิทธิ์. ระดับสะสม (§4).
- **★ ลบ/ปิด role: ทำได้แม้มีสมาชิก** — member เสีย permission โดยกลไก (supersede).
- **★ ลบ Sale: ทำได้ทันที ไม่ต้อง reassign ก่อน** — ลูกค้ากลายเป็น Sale ว่าง (§4c).
- **★ Password:** กรอก 2 ครั้งต้องตรงกัน · **★★★★★★★ ผ่านเกณฑ์ A9 (≥8, lower+upper+digit)** · **username unique** · edit-user ไม่แสดง/ส่งรหัสเดิม · โหมด must-change-first-login → บังคับตั้งใหม่ตอน login ครั้งแรก (abandonment: flag คงอยู่ถ้าปิดก่อนเสร็จ).
- **★★★★★★★ Email:** บังคับ (ไม่ว่าง) + รูปแบบอีเมลถูกต้อง = ที่อยู่รับลิงก์รีเซ็ต (A12).
- **★ Google link:** 1 Google account ผูกได้ 1 user (unique) · ยกเลิกผูกแล้ว login ได้เฉพาะ basic.
- **★★★★★★★ Re-enable self-disabled = Admin เท่านั้น** (ผู้ใช้เปิดเองไม่ได้).
- VAT: effective date ไม่ว่าง + ไม่ทับซ้อน; ยึด invoice date. **(Admin only)**
- เลขภาษี = ตัวเลข 13 หลัก. **(Admin only)**
- **★ Audit = Admin only** · **★★★★ r12: บันทึกเฉพาะกิจกรรม non-read + login/logout + ★★★★★★★ self-disable/re-enable/reset**.

## 8. Pagination / Search
- **★ role list:** ค้นชื่อ role + filter สถานะ · role's user list 20/หน้า (G1).
- **★ user list:** ค้น **ชื่อ-สกุล / username** · 20/หน้า (G1).
- **★★★★ audit log:** 20/หน้า (G1) · **ค้น user id/username + ช่วงวันที่ + filter module** + sort เวลา (G2).

## 9. Formulas / rules
- VAT lookup = อัตราที่ effective ครอบ invoice date.
- audit = field-audit table เดียวกับ Traceability (source เดียว) · **★ ทุกการเปลี่ยน Settings ถูก audit + โผล่ trace:** role create/disable/enable/soft-delete/restore/**★★★★★★ level-per-module edit**/remove-user-from-role · user create/edit/**password set/reset**/**★★★★★★★ email edit**/สลับ Active/เปลี่ยน role/**Google link-unlink**/**ลบ** · **★★★★★★★ account self-disable/re-enable** · VAT edit · company edit.
- **★★★★ r12 — audit ทั้งระบบ = ทุกกิจกรรม non-read ทุก module + login/logout + ★★★★★★★ self-disable/reset** (§4d).
- **★★★★★★ Effective level = ต่อ module เอา "ระดับสูงสุด (max)" จาก role ที่ Active เท่านั้น** (`permission-matrix.md` §1a ข้อ 7).
- auth (NFR): local + Google · session 24 ชม. + reset 06:00 + **★★★★★★★ warning 5 นาที** · **★ password mode + first-login-change + ★★★★★★★ password policy A9 + storage A10 + reset A12 (email) + self-disable A11 + Google link — ดู `platform.md`, `non-functional.md` §2**.

## 10. Cross-links
- สิทธิ์ Read → เห็น module + dashboard แผนก + noti (`dashboard.md`/`platform.md`). **★ login basic-vs-Google + session + ★★★★★★★ reset/self-disable → `platform.md` §2/§4/§5 (US-PLT-06/07)**. VAT/ข้อมูลบริษัท → `invoice.md`. Audit ↔ `traceability.md` (source เดียว). **★ role soft-delete/disable → `deletion-policy.md` §2.14**. **★ ลบ Sale → ลูกค้า unassigned → `deletion-policy.md` §2.15 · `customer.md` §3/§5**. **★★★★★★ capability→action→level (cumulative) → `permission-matrix.md` §1a/§3/§3.1**. **★ password modes / policy A9 / storage A10 / reset A12 / self-disable A11 / Google link / non-read+login audit → `non-functional.md` §2/§3**.

## 11. Module changelog
- **Absorbed:** functional-spec `settings.html` US-SET-01..05 (15 AC) + rbac-deletion.
- **เพิ่ม (delta):** matrix เพิ่มแถว module ใหม่ **Quotation / SO / Supply Planning**.
- **★ DECIDED (2026-07-29 — Settings module review, ปอนด์):** Role search/filter/user-list/remove-user/Disable+Soft-delete; supersede block; user search/password mode/Google link; Admin-only VAT/Company/Audit; audit ทุกการเปลี่ยน Settings.
- **★ DECIDED (2026-07-29 — resolve US-SET-02):** ลบ Sale ไม่บังคับ bulk-reassign → ลูกค้ากลายเป็น Sale ว่างอัตโนมัติ.
- **★★★★ DECIDED (2026-07-30 — Audit-log review r12, ปอนด์):** Audit = non-read + login/logout (§4d); ค้น user/username + ช่วงวัน + filter module; columns + Admin-only.
- **★★★★★★ DECIDED (2026-07-31 — CUMULATIVE-level role editor r16, ปอนด์):** โมเดลสิทธิ์ = ลำดับชั้นสะสม; role editor = ตัวเลือกระดับเดียวต่อ module + explainer + effective actions. §1(title)/§2/§3/§4(rewrite)/§4b/§5/§6/§7/§9/§11.
- **★★★★★★★ DECIDED (2026-07-31 — Platform/NFR decisions r17, ปอนด์; ปิด gap H-B1/H-B2 ฝั่ง Settings):**
  - **User email = required + reset address (H-B1):** เพิ่มฟิลด์ **อีเมล (บังคับ)** บนเรคคอร์ด user = ที่อยู่รับลิงก์รีเซ็ต (platform.md A12); validation รูปแบบอีเมล; แก้ได้โดย Admin (audit). §2/§3/§5 US-SET-02/§6/§7/§9/§10.
  - **Admin re-enable self-disabled account (H-B2):** สถานะบัญชี Self-disabled → Admin กด "เปิดคืนบัญชี" (Settings.Admin) → Active; ผู้ใช้เปิดเองไม่ได้; audit. §2/§3/§4/§5 US-SET-02/§6/§7/§9.
  - **Password policy (A9) + storage encrypt+hash (A10):** ผูกเข้ากับ password setup (US-SET-02/§7).
  - **Audit coverage (§4d/US-SET-05):** เพิ่ม self-disable/re-enable + password-reset-request/complete.
  - authoritative behavior = `platform.md` (reset/self-disable) · `non-functional.md` §2.
- **คงเดิม:** Admin=force override · VAT effective/invoice date · เลขภาษี 13 หลัก · audit source เดียว · auth local+Google.
