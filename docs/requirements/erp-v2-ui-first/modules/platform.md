# Module — Platform / Identity / Notification / Global Search

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 (**+ login lands on Dashboard / Home removed r14 2026-07-30 · ★★★★★★★ + Notification 4-type/snackbar + Forget-reset password + Account self-disable r17 2026-07-31 · ★★★★★★★★ + Notification READ-DRIVEN model (read replaces dismiss) r18 2026-07-31**) · **AUTHORITATIVE SPEC** (absorbs functional-spec `platform.html` US-PLT-01..05 · **★ Settings review 2026-07-29: login basic-vs-Google choice + first-login password change**)
Mockups: `mockups/login.html` (**★ +"ลืมรหัสผ่าน" link**) · **★ `mockups/reset-password.html` (ใหม่ — request + set-new)** · `mockups/responsive.html` (+ shell ทุกหน้า) · **landing หลัง login = `mockups/dashboard.html`** *(mockups/home.html ถูกตัดทิ้ง — Home removed 2026-07-30)*
กฎอ้างอิง: RUCDAA Read scope (noti fan-out + search + guard) · **★★★★★★★ Notification 4-type taxonomy (`non-functional.md` §7)** · **`dashboard.md` (landing หลัง login · source เดียวของ badge/นับ)** · `settings.md` (auth/session/Google-link/password-mode/**★ email field**/provisioning) · `supply-planning.md` §5.1 + `non-functional.md` §6/§7 (FG→Low event) · **`non-functional.md` §2 A2/A9/A10/A11/A12 (session/password/self-disable/reset)** · Glossary · README §3

## สรุปภาษาไทย
ชั้น platform ร่วมทุกหน้า: **login — ผู้ใช้เลือก basic auth (username + password) หรือ Google login** (ปุ่ม Google ใช้ได้เฉพาะ user ที่ผูก Google account; **★ first-login: ถ้า user โหมด "ต้องเปลี่ยนเมื่อเข้าครั้งแรก" → บังคับตั้งรหัสใหม่ก่อนใช้งาน — ★★★★★★★ ถ้าปิด/ออกก่อนตั้งเสร็จ flag ยังอยู่ ครั้งหน้าบังคับอีก**) · **★★★★★★★ login มีลิงก์ "ลืมรหัสผ่าน" → ขอรีเซ็ต → ระบบส่งลิงก์ single-use อายุ 3 วัน ไปอีเมลบนเรคคอร์ด → หน้าตั้งรหัสใหม่ 2 ครั้ง + show/hide** (email = ช่องทางเดียวที่ระบบส่งอีเมล; ไม่มี email notification อื่น) · **★ login สำเร็จ → เข้าหน้า Dashboard เป็นหน้าแรก (landing)** — โมดูล Home ถูกตัดทิ้ง · identity "ESSENCE Hub System" + logo/icon + browser title ทุกหน้า · shell/นำทาง · **global header search** (ตามสิทธิ์ Read, ≥2 ตัวอักษร, ผลคลิก=deep link) · **★★★★★★★ Notification bell = bell-only, event-driven, 4 ประเภท** (งานส่งต่อ · ความเสี่ยงสต็อก/ผลิต · การเงิน · วงจรลูกค้า); ผู้รับ = ผู้มีสิทธิ์ Read ของ module ปลายทาง; **★★★★★★★★ r18 READ-DRIVEN (read แทน dismiss)** — คลิกแจ้งเตือน (ใน bell หรือหน้า "ดูทั้งหมด") = ไป deep-link ของรายการนั้น **และ mark READ ราย user** (A อ่านไม่กระทบ B); รายการที่อ่านแล้ว **หลุดจาก bell ตอน refresh/poll ถัดไป** (ไม่ต้อง real-time; ยอมรับ poll delay; ไม่มี websocket/batch ซับซ้อน); ปุ่ม **"อ่านแล้วทั้งหมด (mark all read)"** = เคลียร์ bell; badge = จำนวน **ยังไม่อ่าน (unread)** cap "9+"; หน้า **"ดูทั้งหมด"** = ประวัติ (อ่าน/ยังไม่อ่าน) 20/หน้า จัดกลุ่ม 4 ประเภท; **ยกเลิก ✕ dismiss ราย item + "ปิดทั้งหมด" เดิม — read แทน dismiss**; **event ใหม่ = snackbar/toast + bell สั่น (shake)**; deep-link · **★★★★★★★ ผู้ใช้ปิดบัญชีตนเองได้ (self-disable) → session ถูกตัด + ถูกบล็อก; re-enable = Admin เท่านั้น; ไม่มี auto-lockout** · **session 24 ชม. + reset 06:00 + เตือนล่วงหน้า 5 นาที + mid-action expiry redirect** · **responsive ทุกหน้า** + RBAC guard (เมนู/ปุ่ม/URL). notification เป็น **outbox + read-bit ราย user** — **รวม event เชิงรุก FG→Low (Supply Planning, real-time + J8 digest, แนบ Suggested)**.

---

## 1. Purpose
เป็นเปลือกระบบ (identity + auth + navigation + noti + search + guard) ที่ทุก module พึ่งพา — ให้ผู้ใช้เข้าถึงงานได้เร็ว ปลอดภัย และไม่พลาดงานข้ามแผนก. **หน้าแรกหลัง login = Dashboard** (`dashboard.md`).

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `login.html` | เข้าสู่ระบบ — **★ ผู้ใช้เลือก basic auth (username + password) หรือ Google login** (ปุ่ม "เข้าสู่ระบบด้วย Google" ใช้ได้เฉพาะ user ที่ Admin ผูก Google account ไว้ — provisioning ที่ `settings.md`) · **★★★★★★★ ลิงก์ "ลืมรหัสผ่าน"** (→ reset-password flow) · **★ first-login password change** (ถ้า user โหมด "ต้องเปลี่ยนเมื่อเข้าครั้งแรก") · **★ login สำเร็จ → redirect ไป Dashboard (landing)** |
| **★★★★★★★ `reset-password.html` (ใหม่)** | **(a) request:** กรอกอีเมล → "ถ้าอีเมลนี้ตรงกับบัญชีในระบบ เราได้ส่งลิงก์ตั้งรหัสใหม่ให้แล้ว" (ข้อความทั่วไป, no enumeration) · **(b) set-new:** เปิดจากลิงก์ single-use ในอีเมล (อายุ 3 วัน) → ตั้งรหัสใหม่ 2 ครั้ง + toggle show/hide → บันทึก → กลับหน้า login. **Edge:** ลิงก์หมดอายุ/ถูกใช้แล้ว → หน้าแจ้ง "ลิงก์หมดอายุ / ถูกใช้แล้ว" + ปุ่มขอใหม่ |
| shell ทุกหน้า | header: identity + global search + bell (panel/badge/deep link/**★★★★★★★★ r18 "อ่านแล้วทั้งหมด (mark all read)" + "ดูทั้งหมด"**) · **เมนูซ้ายไม่มี "หน้าหลัก (Home)"** · **★ user menu มีปุ่ม "ปิดบัญชีของฉัน" (self-disable)** |
| **★★★★★★★ "ดูทั้งหมด" (read-all notification history)** | รายการแจ้งเตือนทั้งหมดของ user (20/หน้า, G1) — ประวัติ แสดงสถานะ **อ่าน/ยังไม่อ่าน**, จัดกลุ่ม 4 ประเภท, แต่ละแถว deep-link (**คลิก = navigate + mark read**); ไม่ใช่ active bell list |
| landing = `dashboard.html` | **หน้าแรกหลัง login** (แทน Home) — งานประจำวันรายแผนกตามสิทธิ์ Read (`dashboard.md`) |
| `responsive.html` | layout mobile/tablet/desktop (hamburger/tab-bar) |

## 3. Fields / Data elements
| องค์ประกอบ | ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| identity | "ESSENCE Hub System" + logo + title | static | ทุกหน้า |
| **login method** | choice {basic (username+password) / Google} | editable | **★ Google เปิดใช้ได้เฉพาะ user ที่ผูก Google (settings.md) · basic เสมอ** |
| **first-login change** | flag (จาก user password mode) | computed | **★ โหมด must-change-first-login → บังคับตั้งรหัสใหม่หลัง login local ครั้งแรก · ★★★★★★★ ปิดก่อนตั้งเสร็จ = flag คงอยู่ (A6)** |
| **★★★★★★★ reset-token** | {token single-use, user, expires_at = created+3วัน, used?} | computed | ส่งไปอีเมลบนเรคคอร์ด (settings.md §3) · ใช้ได้ครั้งเดียว · หมดอายุ 3 วัน |
| **★★★★★★★ account self-disabled** | flag (บัญชี) | editable (self-action) → reversible by Admin | user ปิดเอง → session ตัด + login ถูกบล็อก; re-enable = Admin (A11) |
| **landing route** | = Dashboard | computed | **★ login สำเร็จ → Dashboard (ไม่มี Home)** |
| **notification** | outbox {event, **type (1–4)**, module ปลายทาง, deep link, payload, created_at} + **read-bit ราย user** | computed | ผู้รับ = Read ของ module ปลายทาง · **★★★★★★★★ r18 read-bit ราย user (แทน dismiss-bit เดิม); คลิก = navigate + mark read** · payload เช่น FG→Low แนบ Suggested |
| **badge** | number cap "9+" | computed | ราย user = จำนวน **ยังไม่อ่าน (unread)** |
| global search box | text (≥2 ตัวอักษร) | editable | ผลจัดกลุ่มตามชนิด |
| session | 24 ชม. + reset 06:00 | computed | **★★★★★★★ warning ล่วงหน้า 5 นาที ก่อนตัด (A2)** |

## 4. Statuses / lifecycle
- **★ Login (auth choice):** หน้า login แสดง **สองทางเลือก** — (a) กรอก **username + password** (basic), หรือ (b) กด **"เข้าสู่ระบบด้วย Google"** (เฉพาะ user ที่มี Google account ผูกไว้; ถ้าอีเมล Google ไม่ match user ใด → error "บัญชี Google นี้ยังไม่ได้ผูกกับผู้ใช้ในระบบ"). ทั้งสองทางนำเข้า session เดียวกัน. **★ login สำเร็จ → เข้าหน้า Dashboard (landing)** — เห็นเฉพาะแผนกที่มี Read (`dashboard.md`).
- **★ First-login password change:** ถ้า user มี password mode = **must-change-on-first-login** → หลัง login (basic) ครั้งแรก ระบบพาไปหน้า **ตั้งรหัสใหม่ (2 ครั้ง + show/hide)** ก่อนเข้าใช้งาน (ตามเกณฑ์รหัส `non-functional.md` A9); ตั้งเสร็จ flag เคลียร์ → เข้า Dashboard. mode = **permanent** → เข้า Dashboard ได้เลย. **★★★★★★★ Abandonment:** ปิด/ออกก่อนตั้งเสร็จ → flag must-change **ยังอยู่**, login ครั้งถัดไปถูกบังคับตั้งใหม่อีก (A6).
- **★★★★★★★ Forget / Reset password (A12):** หน้า login มีลิงก์ **"ลืมรหัสผ่าน"** → หน้า request กรอกอีเมล → ระบบสร้าง **reset-token single-use อายุ 3 วัน** ส่งไป **อีเมลบนเรคคอร์ดผู้ใช้** → user เปิดลิงก์ → หน้า set-new ตั้งรหัส 2 ครั้ง + show/hide (ตามเกณฑ์ A9) → บันทึก → login ใหม่. **Edge/Error:** ลิงก์ >3 วัน → "ลิงก์หมดอายุ"; ลิงก์ single-use ถูกใช้แล้วกดซ้ำ → "ลิงก์นี้ถูกใช้แล้ว" (invalidated); อีเมลไม่ตรง active user (หรือบัญชี self-disabled/soft-deleted) → **ข้อความทั่วไปเสมอ ไม่เปิดเผยว่ามี/ไม่มีบัญชี (no account enumeration)** และไม่ปลดบล็อกบัญชีที่ถูกปิด. request/complete = **audit event** (ไม่เก็บค่ารหัส).
- **★★★★★★★ Account self-disable (A11):** ในเมนูผู้ใช้ มีปุ่ม **"ปิดบัญชีของฉัน"** → **confirm popup** (§9.1 NFR) → ยืนยัน → บัญชี = self-disabled + **audit event** → **session ปัจจุบันถูกตัดทันที** (request ถัดไป redirect login) → พยายาม login = **ถูกบล็อก** ("บัญชีถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ"). **Re-enable = Admin เท่านั้น** (restore ผ่าน Settings). **Edge only-Admin:** ถ้าเป็น Admin คนเดียวในระบบ → **บล็อกการ self-disable + เตือน "ต้องมี Admin อย่างน้อย 1 คน — มอบสิทธิ์ Admin ให้ผู้อื่นก่อน"**. **ไม่มี auto-lockout** ที่ใดในระบบ.
- **★★★★★★★ Notification (bell-only, 4-type, ราย user) · ★★★★★★★★ r18 READ-DRIVEN:** event ใหม่ → เขียน outbox (J5) → fan-out ไปทุก user ที่มี **Read** ของ module ปลายทาง → ผู้รับเห็น **snackbar/toast ชั่วคราว + bell สั่น (shake)** + badge +1. **read-driven (read แทน dismiss):** **คลิกแจ้งเตือน** (ใน bell หรือหน้า "ดูทั้งหมด") = **navigate ไป deep-link ของรายการนั้น + mark READ (ราย user)** — การอ่านเป็นกลไกเดียวที่เคลียร์รายการ (A อ่านไม่กระทบ B) · รายการที่อ่านแล้ว **หลุดจาก bell ตอน refresh/poll ถัดไป** (near-real-time ไม่จำเป็น; ยอมรับ delay ของ poll — ไม่มี websocket/batch ซับซ้อน) · badge = จำนวน **ยังไม่อ่าน (unread)** · ปุ่ม **"อ่านแล้วทั้งหมด (mark all read)"** = mark ทุกแจ้งเตือนของ user เป็นอ่าน → bell เคลียร์ (ไม่กระทบผู้อื่น) · หน้า **"ดูทั้งหมด"** = ประวัติทั้งหมด (20/หน้า, จัดกลุ่ม 4 ประเภท) แสดง **อ่าน/ยังไม่อ่าน** ไม่ถูกลบเมื่ออ่าน · **ยกเลิก ✕ dismiss ราย item + "ปิดทั้งหมด" เดิมทั้งหมด — read แทน dismiss.**
- **★★★★★★★ Notification 4 ประเภท (taxonomy — authoritative `non-functional.md` §7):**
  1. **งานส่งต่อข้ามแผนก (Workflow hand-off):** trigger = PO Confirmed→Production · QC ตรวจรับ RM ผ่าน/ไม่ผ่าน (→Stock) · QC Batch ผ่าน/ไม่ผ่าน · DN ส่งสำเร็จ/ลูกค้ายกเลิก/เลื่อน · PR auto-created. **ผู้รับ** = Read ของ module ปลายทาง (Production/Stock/QC/Finance/Sale/Shipping/Procurement ตาม event). **deep-link** = เอกสารปลายทางใน그 module (เช่น PO-181 → หน้า production). **read** = per-user (คลิก = navigate + mark read).
  2. **ความเสี่ยงสต็อก/การผลิต (Stock & Production risk):** trigger = **FG→Low** (real-time transition non-Low→Low + **J8 digest ~06:00** แนบ Suggested) · potential-delay (J4 PRD ใกล้ไม่ทันส่ง). **ผู้รับ** = Read Supply Planning (FG→Low) / Read Production+Sale+Stock (delay). **deep-link** = supply-planning / SO produce-to-stock / PRD. **read** = per-user.
  3. **การเงิน/เครดิต (Finance):** trigger = Invoice **Overdue** (J3 — ส่งสำเร็จ + เลยเครดิต + ยังไม่จ่าย). **ผู้รับ** = Read Invoice (Finance+Sale). **deep-link** = invoice detail. **read** = per-user.
  4. **วงจรลูกค้า (Customer lifecycle):** trigger = Customer **Inactivity** (J2 Active→Inactive). **ผู้รับ** = Read Customer (Sale ที่ดูแล). **deep-link** = customer detail. **read** = per-user.
  - **★ ไม่มี email notification (bell-only)** · **session warning ≠ notification** (เป็น banner, ข้อล่าง).
- **Session:** active → (24 ชม. หมด หรือ 06:00 daily reset) → ต้อง login ใหม่; **★★★★★★★ เตือนล่วงหน้า 5 นาที (banner) + mid-action expiry → redirect login; งานที่ยังไม่บันทึก = ไม่ถูกบันทึก (zero mutation, ไม่กินเลข G8)** (A2).

## 5. User Stories (absorbed) + AC สรุป
- **US-PLT-01 (Must) — login (basic/Google choice) + first-login change + landing Dashboard + identity + session warning:** **★ หน้า login เสนอ 2 ทาง — basic (username+password) หรือ Google** → login สำเร็จ → **★ ถ้าโหมด must-change-first-login → บังคับตั้งรหัสใหม่ก่อน** → **★ เข้าหน้า Dashboard เป็นหน้าแรก (landing · ไม่มี Home)**; ทุกหน้าแสดง "ESSENCE Hub System" + logo + browser title. **Edge:** Google account ไม่ผูก user → error; **★★★★★★★ ใกล้ reset 06:00 (หรือใกล้ครบ 24 ชม.) → banner เตือนล่วงหน้า 5 นาที "ระบบจะออกจากระบบเวลา … กรุณาบันทึกงาน"**; ถึงเวลา/หมดกลางคัน → redirect login (งานที่ยังไม่บันทึก = ไม่ถูกบันทึก). **Error:** รหัสผิด → "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" (ไม่บอกช่องไหนผิด) · **★ ตั้งรหัสใหม่ 2 ครั้งไม่ตรง → "รหัสผ่านยืนยันไม่ตรงกัน"** · **★★★★★★★ รหัสไม่ผ่านเกณฑ์ (A9) → error ระบุเงื่อนไขที่ยังไม่ผ่าน** · **abandonment: ปิดก่อนตั้งเสร็จ → ครั้งหน้าบังคับตั้งใหม่อีก**.
- **★★★★★★★ US-PLT-06 (Must — ใหม่) — Forget / Reset password:** ผู้ใช้กด **"ลืมรหัสผ่าน"** → กรอกอีเมล → เห็นข้อความทั่วไป "ถ้าอีเมลตรงกับบัญชี เราได้ส่งลิงก์ให้แล้ว" → เปิดลิงก์ในอีเมล (single-use, 3 วัน) → ตั้งรหัสใหม่ 2 ครั้ง + show/hide (ผ่านเกณฑ์ A9) → บันทึก → login ด้วยรหัสใหม่. **Edge:** ลิงก์ >3 วัน → "ลิงก์หมดอายุ" + ปุ่มขอใหม่; ลิงก์ถูกใช้แล้วกดซ้ำ → "ลิงก์นี้ถูกใช้แล้ว"; อีเมลไม่ตรง active user / บัญชีถูกปิด → **ข้อความทั่วไปเดียวกัน (no enumeration), ไม่ส่งลิงก์จริง / ไม่ปลดบล็อก**. **Error:** รหัสใหม่ 2 ครั้งไม่ตรง → "รหัสผ่านยืนยันไม่ตรงกัน". audit: request + complete (ไม่เก็บค่า).
- **★★★★★★★ US-PLT-07 (Must — ใหม่) — Account self-disable + Admin re-enable:** ผู้ใช้เปิดเมนูผู้ใช้ → กด **"ปิดบัญชีของฉัน"** → **confirm popup** → ยืนยัน → **session ถูกตัดทันที + audit event** → พยายาม login → **บล็อก "บัญชีถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ"**. Admin เปิดคืนใน Settings → ผู้ใช้ login ได้อีกครั้ง. **Edge:** Admin คนเดียวในระบบกด self-disable → **บล็อก + เตือนต้องมี Admin ≥ 1**; **ไม่มี auto-lockout** (บัญชีถูกปิดได้เฉพาะ self-disable + Admin).
- **US-PLT-02 (Must) — Notification routing (4-type) ตาม Read-bit + deep link + ★★★★★★★★ r18 read-driven (read แทน dismiss) ราย user + snackbar/shake:** event ใหม่ → ผู้มี Read module ปลายทางได้รับ → **snackbar โผล่ชั่วคราว + bell สั่น** → กด bell → **กด "PO-181 เข้าคิวผลิต" (noti type 1) → navigate deep link production + mark READ → รายการหลุดจาก bell (ตอน refresh/poll ถัดไป) → badge ลด 1**. **Edge:** เหตุการณ์เข้า Production → เฉพาะผู้มี Read Production ได้รับ; **FG→Low (type 2) → เฉพาะ Read Supply Planning** (deep-link supply-planning + Suggested); **Overdue (type 3) → Read Invoice**; **Inactivity (type 4) → Read Customer**. **Error:** A อ่าน → B เปิด bell ยังเห็น (read ราย user) · **★★★★★★★ deep-link หลัง Read ถูกถอน → 403 (M-6)**.
- **US-PLT-03 (Must) — Notification panel: grouping / ★★★★★★★★ r18 mark-all-read / "ดูทั้งหมด" / empty / badge cap:** หลาย แจ้งเตือน → panel เรียงใหม่→เก่า, แสดง **ยังไม่อ่าน** ก่อน, แสดงสูงสุด N + **"ดูทั้งหมด" (read-all history + อ่าน/ยังไม่อ่าน + จัดกลุ่ม 4 ประเภท + pagination 20/หน้า)**. **Edge:** unread 12 (badge "9+") → **"อ่านแล้วทั้งหมด (mark all read)"** → ทุกแจ้งเตือนของ user นี้ = อ่าน, badge→0 (ไม่กระทบผู้อื่น; **ประวัติใน "ดูทั้งหมด" ยังอยู่ แสดงเป็น "อ่านแล้ว"**); >9 แสดง "9+". **Empty:** ไม่มีแจ้งเตือน unread → empty state "ไม่มีการแจ้งเตือน". **★★★★★★★★ r18 ย้ำ: การอ่าน (คลิก navigate หรือ mark-all-read) คือกลไกเดียวที่เคลียร์ bell — ยกเลิก ✕ dismiss ราย item + "ปิดทั้งหมด" เดิม; read = per-user (A อ่านไม่กระทบ B).**
- **US-PLT-04 (Should) — Global header search:** พิมพ์ "181"/"กลอรี่" → ผลจัดกลุ่มตามชนิด (PO/QT/SO/ลูกค้า/วัตถุดิบ-Lot/PR-GR/DN-Invoice); คลิก = deep link. **Edge:** ผลนอกสิทธิ์ Read ไม่ปรากฏ; ไม่พบ → "ไม่พบผลการค้นหา". **Error:** <2 ตัวอักษร → ไม่ยิงค้น + "พิมพ์อย่างน้อย 2 ตัวอักษร".
- **US-PLT-05 (Must) — Responsive + RBAC guard ทุกหน้า:** mobile/tablet/desktop → responsive (hamburger/tab-bar); สถานะเป็นป้ายไทย ไม่มี enum ดิบ. **Edge:** ไม่มี Read module X → ไม่เห็นเมนู X + URL ตรง 403. **Error:** มี Read แต่ระดับ < Create → ปุ่มสร้างซ่อน/disable; เรียก API ตรง → 403. **★ user ที่ role ถูก Disabled/Deleted (settings.md §4b) หรือ ★★★★★★★ บัญชี self-disabled/soft-deleted → login ถูกบล็อก/ไม่มีสิทธิ์ใด ๆ → 403 ทุกจุด.**

## 6. Actions & Permissions (D14 · cumulative min-level)
| ปุ่ม/action | Permission required |
|---|---|
| login / logout (**basic หรือ Google**) → เข้า Dashboard | ทุก user ที่มี account (Active, ไม่ถูก self-disable/soft-delete); Google = ต้องผูก Google ไว้ |
| **first-login password change** | เจ้าของบัญชี (บังคับตามโหมด) |
| **★★★★★★★ ขอ/ตั้งรหัสใหม่ผ่าน "ลืมรหัสผ่าน"** | เจ้าของบัญชี (ผ่านลิงก์ single-use ในอีเมล; ไม่ต้อง login) |
| **★★★★★★★ self-disable บัญชีตนเอง** | เจ้าของบัญชี (confirm popup + audit; guard only-Admin) |
| **★★★★★★★ re-enable บัญชีที่ self-disabled** | **Settings.Admin** (`settings.md` §6) |
| รับ notification (4-type รวม FG→Low) | **Read (R)** ของ module ปลายทาง (fan-out ตาม Read-bit) |
| **★★★★★★★★ r18 อ่านแจ้งเตือน (คลิก = navigate + mark read) / "อ่านแล้วทั้งหมด"** | เจ้าของ noti (ราย user) — read-bit ราย user |
| global search | **Read (R)** ต่อชนิดผลลัพธ์ (นอกสิทธิ์=ไม่แสดง) |
| เข้าถึง module/action | ตาม cumulative level (guard เมนู/ปุ่ม/URL/API; `permission-matrix.md` §1a) |

## 7. Validations
- **★ login: basic ต้องกรอก username+password; Google ต้องมี link ที่ตรงกับ user (ไม่ตรง → error).**
- **★ first-login change: ตั้งรหัสใหม่ 2 ครั้งต้องตรงกัน + ผ่านเกณฑ์ A9 ก่อนเข้าใช้งาน (โหมด must-change); ปิดก่อนเสร็จ = flag ยังอยู่.**
- **★★★★★★★ reset password: token single-use + หมดอายุ 3 วัน; รหัสใหม่ 2 ครั้งตรงกัน + ผ่านเกณฑ์ A9; อีเมลไม่ตรง/บัญชีถูกปิด → ข้อความทั่วไป (no enumeration).**
- **★★★★★★★ self-disable: confirm popup; guard "ต้องมี Admin ≥ 1"; session ตัดทันที; re-enable = Admin.**
- **★ login สำเร็จ → landing = Dashboard (ไม่มี route ไป Home).**
- global search ≥2 ตัวอักษร จึงยิงค้น.
- badge > 9 แสดง "9+"; **★★★★★★★★ r18 badge = จำนวนยังไม่อ่าน (unread); read-bit ราย user (คลิก = navigate + mark read; ไม่มี dismiss).**
- guard: ไม่มี Read = ไม่เห็นเมนู + URL ตรง 403; ระดับ < Create = ปุ่มซ่อน/disable + API 403.
- login error ไม่ระบุช่องที่ผิด (security).
- **FG→Low real-time ยิงตอน transition non-Low→Low เท่านั้น** (ไม่ยิงซ้ำระหว่างคง Low); J8 เป็น snapshot รายวัน (idempotent).

## 8. Pagination / Search
- หน้ารวมแจ้งเตือน ("ดูทั้งหมด"): 20/หน้า (G1). global search: ≥2 ตัวอักษร, ผลจัดกลุ่มตามชนิด.

## 9. Formulas / NFR
- notification fan-out = ผู้ใช้ทุกคนที่มี Read ของ module ปลายทาง (per-user **read-bit**) — **ไม่ hardcode role**.
- **★★★★★★★ notification = bell-only, event-driven, 4-type taxonomy + ★★★★★★★★ r18 read-driven (read แทน dismiss) + snackbar/shake** — authoritative `non-functional.md` §7. **ไม่มี email notification** (email = reset password เท่านั้น, A12).
- **event FG→Low (Supply Planning):** trigger = FG cover < Target; real-time (transition) + J8 daily digest ~06:00; payload แนบ **Suggested production** (ceil-to-batch); ผู้รับ = Read Supply Planning; deep-link → supply-planning / SO produce-to-stock (`non-functional.md` §6.1/§7, `supply-planning.md` §5.1).
- **session:** 24 ชม. + daily reset 06:00 + **pre-expiry warning 5 นาที (A2)** + mid-action expiry redirect.
- **★ landing:** login สำเร็จ → Dashboard (`dashboard.md`) — ไม่มี Home/task-inbox.
- **★ auth methods:** basic (username+password) + Google (per-user link, provisioning `settings.md`) · **password mode** (must-change-first-login / permanent) · **★★★★★★★ password policy A9 + storage encrypt+hash A10 + reset A12 + self-disable A11** · ดู `non-functional.md` §2.
- **NFR perf:** read AVG ≤200ms/MAX ≤1s · write AVG ≤1s/MAX ≤3s · rate-limit ~30 concurrent/module (`non-functional.md` §1). responsive ทุกหน้า (Must) · local + Google.

## 10. Cross-links
- ทุกการส่งงานข้าม module → noti (4-type) → โผล่ใน `dashboard.md` (นับ tile) + notification badge (**source เดียว · ไม่มี Home task inbox**). **FG→Low → `supply-planning.md` §5.1 + `non-functional.md` §6 (J8)/§7.** global search ↔ ทุก module detail. **★ landing หลัง login = `dashboard.md`.** **★ auth/session/Google-link/password-mode/★★★★★★★ email field/self-disable/reset provisioning → `settings.md` §3/§4b/§6 · `non-functional.md` §2 (A2/A6/A9/A10/A11/A12)/§7 (noti).** Glossary (สถานะไทย).

## 11. Module changelog
- **Absorbed:** functional-spec `platform.html` US-PLT-01..05 (15 AC) verbatim ในความหมาย.
- **★ เพิ่ม (DECIDED 2026-07-29):** notification event **FG→Low (Supply Planning)** — real-time + J8 daily digest, แนบ Suggested, fan-out by Read Supply Planning, deep-link ไป supply-planning/SO prefill.
- **★ เพิ่ม (2026-07-29 — Settings module review, ปอนด์):** หน้า login เสนอ **basic auth vs Google login** + **first-login password change** + guard role Disabled/Deleted. sync `settings.md`/`non-functional.md`.
- **★★ เพิ่ม (2026-07-30 — Home removed → Dashboard landing, ปอนด์ r14):** login สำเร็จ → Dashboard landing; เมนูซ้ายตัด Home; ตัด mockup `home.html`.
- **★★★★★★★ เพิ่ม (2026-07-31 — Platform/NFR decisions r17, ปอนด์; ปิด gap H-B1/H-B2/H-B3):**
  - **Notification rewrite (H-B3):** จาก outbox+read-bit/ack=read/open-ended ~8 event → **bell-only, event-driven, 4-type taxonomy** (งานส่งต่อ · ความเสี่ยงสต็อก/ผลิต · การเงิน · วงจรลูกค้า) แต่ละ type ระบุ trigger→ผู้รับ(Read)→deep-link→dismiss · **dismiss ≠ read** (per-user dismiss-bit, "ดูทั้งหมด" history 20/หน้า, dismiss-all = bulk-dismiss, ยกเลิก ack=read) · **snackbar/toast + bell shake** บน event ใหม่ · **ไม่มี email notification**. §2/§3/§4/§5 US-PLT-02/03/§6/§7/§9/§10, authoritative `non-functional.md` §7. *(→ superseded by r18 read-driven — see below.)*
  - **Forget/Reset password (H-B1) ใหม่:** ลิงก์ "ลืมรหัสผ่าน" บน login + หน้า `reset-password.html` (request + set-new) · single-use link, 3-day expiry, email delivery · no-enumeration + expired/reused edge · **US-PLT-06 ใหม่**. email field = `settings.md` §3.
  - **Account self-disable (H-B2) ใหม่:** ปุ่ม "ปิดบัญชีของฉัน" + confirm + session-kill + login-block · re-enable = Admin · only-Admin guard · no auto-lockout · **US-PLT-07 ใหม่**.
  - **Session:** warning lead-time 5 นาที + mid-action expiry redirect (A2). **Password:** policy A9 + storage A10 + first-login abandonment (A6).
- **★★★★★★★★ เพิ่ม (2026-07-31 — Notification READ-DRIVEN reversal r18, ปอนด์ Gate-1):** กลับโมเดลแจ้งเตือนจาก **dismiss≠read (r17)** → **read-driven**: per-user **read-bit** (แทน dismiss-bit) · **badge = ยังไม่อ่าน (unread)** cap "9+" · **คลิกแจ้งเตือน (bell หรือ "ดูทั้งหมด") = navigate deep-link + mark READ (ราย user)** · รายการที่อ่านแล้วหลุดจาก bell ตอน refresh/poll ถัดไป (**ไม่ต้อง real-time, ไม่มี websocket/batch**) · ปุ่ม **"อ่านแล้วทั้งหมด (mark all read)"** เคลียร์ bell · **ยกเลิก ✕ dismiss ราย item + "ปิดทั้งหมด" (dismiss-all)** · "ดูทั้งหมด" = history แสดง **อ่าน/ยังไม่อ่าน**, จัดกลุ่ม 4 ประเภท, 20/หน้า, deep-link (คลิก = navigate + mark read). **คงเดิม:** bell-only/ไม่มี email · 4-type taxonomy · snackbar+shake · fan-out by Read · FG→Low real-time + J8 · deep-links per type. อัปเดต: header/§summary/§2/§3/§4/US-PLT-02/03/§6/§7/§9 + authoritative `non-functional.md` §7. **มี HTML view (`platform.html` render จาก .md) + ลิงก์ใน modules/index — no view ใหม่.**
- **คงเดิม:** identity ทุกหน้า · noti outbox + fan-out by Read · global search ≥2 ตัวอักษร ตามสิทธิ์ · session 24h/06:00 · responsive + RBAC guard · Dashboard landing.
