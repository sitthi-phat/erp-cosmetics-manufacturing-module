# Module — Settings (RUCDAA + Users + VAT + Company + Audit)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE SPEC** (absorbs functional-spec `settings.html` US-SET-01..05 + rbac-deletion + 3 new modules in RUCDAA · **★ Settings module review 2026-07-29: role search/filter/user-list/remove-user/disable+soft-delete · user search + password modes + Google link · Admin-only VAT/Company/Audit**)
Mockups: `mockups/settings.html` · `mockups/login.html` (login basic-vs-Google choice)
กฎอ้างอิง: **D14** (RUCDAA generic) · rbac-deletion (soft-delete + bulk reassign) · `permission-matrix.md` (capability→action) · `platform.md` (login local+Google + session) · `invoice.md` (VAT/ข้อมูลบริษัท) · `non-functional.md` (auth/audit) · `deletion-policy.md` §Role · `traceability.md` (audit source เดียว) · README §3

## สรุปภาษาไทย
Settings 5 หน้าจอ: **1) Role & สิทธิ์** (RUCDAA 6 ระดับต่อ module: Read/Update/Create/Delete/Approve/**Admin bit** = force override; role ไม่จำกัดจำนวน) — **★ ค้นหา role · กรองสถานะ Active/Disabled/Deleted · ดูรายชื่อผู้ใช้ในแต่ละ role + ถอด user ออกจาก role ได้ · ปิดใช้งาน role (Disable = พักชั่วคราว) และลบ role (Soft-delete = เก็บกู้คืนได้) — ทั้งสองแบบ member เสีย permission ของ role นั้น**. **2) ผู้ใช้** (สร้าง/ผูก Google/เปิด-ปิด/เปลี่ยน role/**ลบ→บังคับ bulk reassign ลูกค้าก่อน**) — **★ ค้นหาผู้ใช้จากชื่อ-สกุลหรือ username · ตั้งรหัสผ่าน 2 โหมด (ต้องเปลี่ยนเมื่อเข้าครั้งแรก / ตั้งถาวร) · กรอกรหัส 2 ครั้ง (ยืนยัน) + ปุ่มดู/ซ่อนรหัส · หน้าแก้ไขไม่โชว์รหัสเดิม (ตั้งใหม่เท่านั้น) · ผูก Google account → ตอน login ผู้ใช้เลือก basic auth หรือ Google**. **3) Config VAT** **4) ข้อมูลบริษัท** **5) Audit log** — **★ ทั้งสามแท็บนี้เข้าถึงได้เฉพาะสิทธิ์ Admin (Admin bit) เท่านั้น**. ลบ Sale ต้อง reassign ลูกค้าทั้งหมดก่อน. **★ ลบ/ปิด role ไม่ต้องย้าย user ออกก่อนแล้ว** (member เสีย permission อัตโนมัติ — supersede กฎเดิม "block until users moved"). auth: local + Google · session 24 ชม. + reset 06:00. **RUCDAA matrix ต้องมีแถว module ใหม่: Quotation, SO, Supply Planning**. **การเปลี่ยนแปลงทุกอย่างใน Settings ถูก audit + โผล่ trace**.

---

## 1. Purpose
ศูนย์กลาง config การเข้าถึง (RBAC generic) + จัดการผู้ใช้/รหัสผ่าน/Google link/ลบอย่างปลอดภัย (ไม่มีงาน/ลูกค้าตกค้างไม่มีเจ้าภาพ) + ตั้ง VAT/ข้อมูลบริษัทสำหรับเอกสารภาษี (Admin only) + audit log ทั้งระบบ (Admin only).

## 2. Screens (5 แท็บ)
| แท็บ | บทบาท | สิทธิ์เข้าถึง |
|---|---|---|
| Role & สิทธิ์ | สร้าง role + matrix RUCDAA 6 ช่องต่อทุก module (รวม Admin bit) · **★ ค้นหา role · filter Active/Disabled/Deleted · รายชื่อ user ใน role + ถอด user · Disable / Soft-delete / Restore role** | ดู = Settings.R · จัดการ = Settings.Admin |
| ผู้ใช้ | สร้าง/ผูก Google/เปิด-ปิด/เปลี่ยน role/ลบ→bulk reassign · **★ ค้นหาชื่อ-สกุล/username · password mode + confirm-twice + show/hide · edit ไม่โชว์รหัสเดิม** | ดู = Settings.R · จัดการ = Settings.Admin |
| Config VAT | อัตรา + effective date + ประวัติ | **★ Admin only** |
| ข้อมูลบริษัท | ชื่อ/เลขภาษี 13 หลัก/ที่อยู่/เบอร์/อีเมล/logo | **★ Admin only** |
| Audit log | field-level (filter/search/sort/pagination) — source เดียวกับ Traceability | **★ Admin only** |

## 3. Fields
| ฟิลด์ | ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| role + matrix RUCDAA | grid {module × R/U/C/D/A/Admin} | editable | Admin bit = force override |
| **role สถานะ** | enum {Active / Disabled / Deleted} | editable (via action) | **★ Active = grant · Disabled = พักชั่วคราว (reversible) · Deleted = soft-delete (recoverable)** — Disabled/Deleted = member เสีย permission ของ role นี้ |
| **role → รายชื่อ user (membership)** | list | computed + action | **★ ดูสมาชิกของ role + ปุ่มถอด user ออกจาก role** |
| user {**ชื่อ-สกุล**, **username**, อีเมล, role, Google link, สถานะ} | record | editable | **★ username = ใช้ local login · ชื่อ-สกุล = แสดง/ค้นหา** · Active/ปิดใช้งาน |
| **user password** | set-only | editable (write-only) | **★ กรอก 2 ครั้ง (ยืนยัน) + toggle ดู/ซ่อน · edit-user ไม่แสดงรหัสเดิม (ตั้งใหม่เท่านั้น)** |
| **password mode** | radio {must-change-first-login / permanent} | editable | **★ "ต้องเปลี่ยนเมื่อเข้าครั้งแรก" หรือ "ตั้งแบบถาวร"** |
| **Google account link** | {linked email / ยังไม่ผูก} | editable (action) | **★ ผูก/ยกเลิกผูก → ตอน login เลือก basic หรือ Google** (platform.md) |
| VAT {อัตรา%, effective date, ผู้ตั้ง} | list | editable | ยึด invoice date · ไม่ทับซ้อน · **Admin only** |
| ข้อมูลบริษัท | {ชื่อ, เลขภาษี 13 หลัก, ที่อยู่, เบอร์, อีเมล, logo} | editable | เลขภาษี = ตัวเลข 13 หลัก · **Admin only** |
| audit row | {เวลา, ผู้ทำ, module, entity, field, จาก→เป็น, เหตุผล} | computed | **Admin only** |

## 4. RUCDAA bits (D14)
R Read · U Update · C Create · D Delete(soft/void) · A Approve · **Admin** (config/force override/undelete + **★ gate VAT/Company/Audit**). **Module ในระบบ (รวมใหม่):** Customer · **Quotation** · PO · **SO** · **Supply Planning** · BOM · Warehouse/Stock · Production · QC · Shipping · Invoice · PR · Supplier · Settings/User-Role. (ดู `permission-matrix.md`).

## 4b. ★ Role lifecycle & semantics (Settings review 2026-07-29)
- **โมเดล:** 1 role → many users (คงเดิม). ผู้ใช้ถือ role เพื่อรับ permission ของ role นั้น. Effective permission ของผู้ใช้ = grant จาก role ที่ **Active** เท่านั้น.
- **สถานะ role มี 3 แบบ + filter ได้:**
  - **Active** — role grant permission ให้สมาชิกตามปกติ.
  - **Disabled (ปิดใช้งานชั่วคราว)** — **สมาชิกทุกคนเสีย permission ของ role นี้ทันที** (reversible). ใช้ตอนต้องพักสิทธิ์ชั่วคราว → กด **Enable** กลับได้.
  - **Deleted (soft-delete)** — **สมาชิกเสีย permission เช่นกัน**; role **ไม่ถูกลบจริง** (retained, กู้คืนได้ผ่าน **Restore/undelete**). ใช้ตอนเลิกใช้ role นั้น (archive) แต่ยังต้องการ audit/recovery.
  - > Disabled กับ Deleted **strip permission เหมือนกัน**; ต่างกันที่ **เจตนา lifecycle** — Disabled = พักชั่วคราว (คาดว่าจะเปิดใหม่), Deleted = ปลดระวาง/เก็บถาวร (กู้คืนได้แต่ไม่ใช้ตามปกติ).
- **★ Membership คงอยู่** เมื่อ Disable/Delete: user ยังผูกกับ role (เพื่อให้ Enable/Restore แล้วสิทธิ์กลับมา) — แค่ role ไม่ grant ระหว่าง Disabled/Deleted.
- **★ ไม่ต้องย้าย user ออกก่อน Disable/Delete** — member เสีย permission โดยกลไกเอง. **supersede กฎเดิม** "ลบ role บล็อกจนย้าย user ออกหมด (no force-migrate)" (rbac-deletion). Admin **อาจ** ถอด user ทีละคนจาก role's user list ได้ (optional) — ถอดแล้ว user นั้นไม่มี role → ไม่มีสิทธิ์จนกว่าจะกำหนด role ใหม่.
- **★ ค้นหา role + filter สถานะ** (Active/Disabled/Deleted) บนหน้า role list.
- **สิทธิ์:** Disable/Enable · Restore · Remove-user-from-role · สร้าง/แก้ matrix = **Settings.Admin** · Soft-delete role = **Settings.D** · Restore = **Settings.Admin**. ทุก action audit + trace.

## 5. User Stories (absorbed + ★ delta) + AC สรุป
- **US-SET-01 (Must) — Role & สิทธิ์ + ★ search/filter/user-list/disable/soft-delete:** สร้าง role "หัวหน้าคลัง" (Stock=R,U,C; Production=R; อื่นว่าง) → บันทึก matrix 6 ช่องต่อทุก module; ผู้ใช้ role นี้เห็น Stock+Production, สร้าง/แก้ Stock ได้ แต่ลบ/approve ไม่ได้.
  - **★ Search/Filter:** ค้น role ตามชื่อ + filter สถานะ **Active / Disabled / Deleted**.
  - **★ User list ของ role:** เปิด role → เห็น **รายชื่อ user ที่อยู่ใน role นี้** (20/หน้า) → กด **"ถอดออกจาก role"** ราย user → user นั้นไม่ผูก role นี้อีก (เสีย permission ของ role นี้) + audit.
  - **★ Disable role:** กด "ปิดใช้งาน" → role = **Disabled** → สมาชิกทุกคน**เสีย permission ของ role นี้ทันที** (reversible) → กด "เปิดใช้งาน" คืนสิทธิ์.
  - **★ Soft-delete role:** กด "ลบ" → role = **Deleted (soft)** + เหตุผลบังคับ → สมาชิกเสีย permission; role **ยังอยู่ (กู้คืนได้)** → **Restore** = Admin คืนสถานะ Active/สิทธิ์.
  - **Edge:** Admin bit ของ PO → ผู้ใช้เห็น "เปลี่ยนสถานะข้ามลำดับ (force override)" (po US-PO-06); ไม่มี Admin bit = ไม่เห็น. **★ role Disabled/Deleted → member ที่มี role เดียวนี้ login ได้แต่ไม่เห็น module/ปุ่มใด ๆ (403 ทุกจุด) จนกว่าจะ Enable/Restore/ย้าย role.**
  - **★ ไม่มี block "ต้องย้าย user ออกก่อน"** อีกต่อไป (supersede) — Disable/Soft-delete ทำได้ทันทีแม้ role มีสมาชิก.
- **US-SET-02 (Must) — จัดการผู้ใช้ + ★ search/password-modes/Google-link + ลบ→bulk reassign:** สร้าง user + กรอก **ชื่อ-สกุล + username** + เลือก role + Active → ล็อกอินได้; เปลี่ยน role/สลับ Active จากแถว.
  - **★ Search user:** ค้นจาก **ชื่อ-สกุล หรือ username**.
  - **★ Password setup:** เลือก **โหมด** — (a) "ต้องเปลี่ยนเมื่อเข้าครั้งแรก (must change on first login)" หรือ (b) "ตั้งแบบถาวร (permanent)" · กรอกรหัส **2 ครั้ง (ยืนยันตรงกัน)** + **toggle ดู/ซ่อนรหัส**. โหมด (a): หลัง local login ครั้งแรก ระบบ**บังคับตั้งรหัสใหม่**ก่อนใช้งาน (flow ที่ login — platform.md).
  - **★ Edit user:** **ไม่แสดงรหัสผ่านเดิม** (masked/blank) — ตั้งรหัสใหม่เท่านั้น (2 ครั้ง + toggle); ไม่กรอก = ไม่เปลี่ยนรหัส.
  - **★ Google link:** ผูก user กับ Google account (อีเมล) → ตอน **login** user เลือก **basic auth (username/password) หรือ Google** (platform.md). ยกเลิกผูกได้ → เหลือ basic เท่านั้น.
  - **Edge:** ลบ Sale ที่ดูแลลูกค้า 12 ราย → เปิดหน้า **bulk reassign** บังคับเลือก Sale ปลายทางรับช่วงครบ 12 ก่อนจึง mark ลบได้; PO เดิมเดินต่อ ห้ามสร้าง PO ใหม่ในนามผู้ถูกลบ.
  - **Error:** รหัส 2 ครั้งไม่ตรง → "รหัสผ่านยืนยันไม่ตรงกัน"; username ซ้ำ → "username นี้ถูกใช้แล้ว"; ยืนยันลบก่อน reassign ครบ / ไม่มีสิทธิ์ Admin → ไม่ลบ + error.
- **US-SET-03 (Must) — Config VAT + effective + ประวัติ (★ Admin only):** เพิ่ม VAT 7% effective 01/01/2569 → บันทึก + ประวัติ (อัตรา/วันมีผล/ผู้ตั้ง); ใบกำกับยึด invoice date. **Edge:** หลายรายการตามช่วง → ออกใบปี 2568 ใช้อัตราที่ครอบวันนั้น; เปลี่ยน VAT ใหม่ไม่กระทบใบเก่า. **Error:** effective date ว่าง/ทับซ้อน → error "ต้องระบุวันที่มีผลที่ไม่ทับซ้อน" · **ไม่มี Admin bit → ไม่เห็นแท็บ / 403**.
- **US-SET-04 (Should) — ข้อมูลบริษัท (★ Admin only):** กรอกชื่อ/เลขภาษี 13 หลัก/ที่อยู่/เบอร์/อีเมล + upload logo → ปรากฏบน invoice-print. **Edge:** ไม่มี logo → placeholder (ตัว "E") — ยังพิมพ์ได้. **Error:** เลขภาษีไม่ครบ 13 หลัก/มีตัวอักษร → error "เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก" · **ไม่มี Admin bit → ไม่เห็นแท็บ / 403**.
- **US-SET-05 (Should) — Audit log (★ Admin only):** กรอง ผู้ใช้/module/ช่วงวันที่ + คำค้น → ตารางคอลัมน์ (เวลา/ผู้ทำ/module/entity/field/จาก→เป็น/เหตุผล) + pagination + sort เวลา. **Edge:** เป็นมุมมองรวมของ field-audit เดียวกับ Traceability; คลิกแถว → deep link ไป trace; retention 1 ปี, purge/archive=Super User. **Error:** **ไม่มี Admin bit → 403 / ไม่เห็นแท็บ** (เปลี่ยนจากเดิม Read → **Admin only**, ข้อมูลไวต่อความปลอดภัย).

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ดูแท็บ Role/User (list/detail) · ค้น role/user | Settings.**Read (R)** |
| สร้าง role/มัดสิทธิ์ · Disable/Enable role · Restore role · **ถอด user ออกจาก role** · จัดการ user · **ตั้ง/รีเซ็ตรหัสผ่าน + password mode** · **ผูก/ยกเลิก Google link** · bulk reassign · undelete | Settings.**Admin** |
| Soft-delete role · ลบ user | Settings.**Delete (D)** (+ เงื่อนไข: user ลบ = reassign ลูกค้าก่อน) |
| **★ ดู/แก้ VAT** | Settings.**Admin only** (เปลี่ยนจาก U) |
| **★ ดู/แก้ ข้อมูลบริษัท** | Settings.**Admin only** (เปลี่ยนจาก U) |
| **★ ดู Audit log** | Settings.**Admin only** (เปลี่ยนจาก R) |

## 7. Validations
- **★ ลบ/ปิด role: ทำได้แม้มีสมาชิก** — member เสีย permission ของ role นั้นโดยกลไก (supersede กฎเดิม "block until users moved"). ถอด user ราย ๆ ได้จาก role's user list (optional).
- ลบ Sale: บังคับ bulk reassign ลูกค้าทั้งหมดก่อน; PO เดิมเดินต่อ, ห้ามสร้างใหม่ในนามผู้ถูกลบ.
- **★ Password: กรอก 2 ครั้งต้องตรงกัน** · **username unique** · edit-user ไม่แสดง/ส่งรหัสเดิม (write-only, ตั้งใหม่เท่านั้น) · โหมด must-change-first-login → บังคับตั้งใหม่ตอน login ครั้งแรก.
- **★ Google link:** 1 Google account ผูกได้ 1 user (unique) · ยกเลิกผูกแล้ว login ได้เฉพาะ basic.
- VAT: effective date ไม่ว่าง + ไม่ทับซ้อน; ยึด invoice date; เปลี่ยนใหม่ไม่กระทบใบเก่า. **(Admin only)**
- เลขภาษี = ตัวเลข 13 หลัก. **(Admin only)**
- **★ Audit = Admin only** (เดิม Read Settings) — ข้อมูลไวต่อความปลอดภัย.

## 8. Pagination / Search
- **★ role list:** ค้นหาชื่อ role + filter สถานะ (Active/Disabled/Deleted) · role's user list 20/หน้า (G1).
- **★ user list:** ค้นหา **ชื่อ-สกุล / username** · 20/หน้า (G1).
- audit log: 20/หน้า (G1) · filter (ผู้ใช้/module/ช่วงวัน) + search + sort เวลา (G2).

## 9. Formulas / rules
- VAT lookup = อัตราที่ effective ครอบ invoice date.
- audit = field-audit table เดียวกับ Traceability (source เดียว) · **★ ทุกการเปลี่ยน Settings ถูก audit + โผล่ trace:** role create/disable/enable/soft-delete/restore/permission-matrix edit/remove-user-from-role · user create/edit/**password set/reset**/สลับ Active/เปลี่ยน role/**Google link-unlink**/ลบ+reassign · VAT edit · company edit (ใคร/เมื่อ/เดิม→ใหม่ ตามที่เก็บได้; รหัสผ่านเก็บ event ไม่เก็บค่า).
- **★ Effective permission = union ของ grant จาก role ที่ Active เท่านั้น** — role Disabled/Deleted ไม่ contribute.
- auth (NFR): local + Google · session 24 ชม. + reset 06:00 (+ warning ก่อนตัด — ดู `platform.md`) · **★ password mode + first-login-change + Google link provisioning — ดู `platform.md` §login, `non-functional.md` §2**.

## 10. Cross-links
- สิทธิ์ Read → เห็น module + dashboard แผนก + noti (`dashboard.md`/`platform.md`). **★ login basic-vs-Google choice + first-login password change + session → `platform.md` §2/§4**. VAT/ข้อมูลบริษัท → `invoice.md`. Audit ↔ `traceability.md` (source เดียว). **★ role soft-delete/disable + supersede move-users → `deletion-policy.md` §2 (Role row)**. capability→action → `permission-matrix.md`. **★ password modes / Google link / Settings audit → `non-functional.md` §2/§3**.

## 11. Module changelog
- **Absorbed:** functional-spec `settings.html` US-SET-01..05 (15 AC) + rbac-deletion กติกา verbatim ในความหมาย.
- **เพิ่ม (delta):** RUCDAA matrix เพิ่มแถว module ใหม่ **Quotation / SO / Supply Planning**.
- **★ DECIDED (2026-07-29 — Settings module review, ปอนด์):**
  1. **Role:** ค้นหา role · filter Active/Disabled/Deleted · ดู role's user list + **ถอด user ออกจาก role** · **Disable (พักชั่วคราว, reversible)** + **Soft-delete (recoverable)** — ทั้งสองแบบ member เสีย permission ของ role นั้น (§4b/§5 US-SET-01).
  2. **★ Supersede กฎเดิม "ลบ role บล็อกจนย้าย user ออกหมด"** → Disable/Soft-delete ทำได้ทันทีแม้มีสมาชิก (member เสีย permission โดยกลไก); ถอด user ราย ๆ = optional. sync `deletion-policy.md` Role row.
  3. **User:** ค้นหาชื่อ-สกุล/username · **password mode (must-change-first-login / permanent)** · กรอก 2 ครั้ง + show/hide · **edit ไม่โชว์รหัสเดิม** · **Google account link** (→ login เลือก basic/Google). sync `platform.md`.
  4. **★ Admin-only gating:** **VAT / ข้อมูลบริษัท / Audit-log = Admin bit เท่านั้น** (VAT/Company เดิม U→Admin; Audit เดิม R→Admin) (§2/§6/§7).
  5. **★ Audit ทุกการเปลี่ยน Settings** (role/user/password/Google-link/VAT/company) → field-audit + trace (§9). sync `non-functional.md` AU1.
- **คงเดิม:** Admin bit=force override · ลบ Sale→bulk reassign · VAT effective/invoice date · เลขภาษี 13 หลัก · audit source เดียว · auth local+Google + session 24h/06:00.
