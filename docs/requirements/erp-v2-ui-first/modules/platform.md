# Module — Platform / Identity / Notification / Global Search

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE SPEC** (absorbs functional-spec `platform.html` US-PLT-01..05 · **★ Settings review 2026-07-29: login basic-vs-Google choice + first-login password change**)
Mockups: `mockups/login.html` · `mockups/home.html` · `mockups/responsive.html` (+ shell ทุกหน้า)
กฎอ้างอิง: RUCDAA Read scope (noti fan-out + search + guard) · Notification matrix (continuity) · `home.md`/`dashboard.md` (source เดียว) · `settings.md` (auth/session/Google-link/password-mode provisioning) · `supply-planning.md` §5.1 + `non-functional.md` §6/§7 (FG→Low event) · Glossary · README §3

## สรุปภาษาไทย
ชั้น platform ร่วมทุกหน้า: **login — ผู้ใช้เลือก basic auth (username + password) หรือ Google login** (ปุ่ม Google ใช้ได้เฉพาะ user ที่ผูก Google account ไว้แล้ว; **★ first-login: ถ้า user โหมด "ต้องเปลี่ยนเมื่อเข้าครั้งแรก" → บังคับตั้งรหัสใหม่ก่อนใช้งาน**) · identity "ESSENCE Hub System" + logo/icon + browser title ทุกหน้า · shell/นำทาง · **global header search** (ค้น PO/QT/SO/ลูกค้า/วัตถุดิบ-Lot/PR-GR/DN-Invoice ตามสิทธิ์ Read, ≥2 ตัวอักษร, ผลคลิก=deep link) · **Notification bell** (panel + badge cap "9+" + deep link + acknowledge ราย user; ผู้รับ = ผู้มีสิทธิ์ Read ของ module ปลายทาง) · **session 24 ชม. + reset 06:00 ทุกวัน (เตือนล่วงหน้าก่อนตัด)** · **responsive ทุกหน้า** + RBAC guard (เมนู/ปุ่ม/URL). notification เป็น **outbox + read-bit ราย user** (mark all read, ดูทั้งหมด, empty state) — **รวม event เชิงรุก FG→Low (Supply Planning, real-time + J8 digest, แนบ Suggested)**.

---

## 1. Purpose
เป็นเปลือกระบบ (identity + auth + navigation + noti + search + guard) ที่ทุก module พึ่งพา — ให้ผู้ใช้เข้าถึงงานได้เร็ว ปลอดภัย และไม่พลาดงานข้ามแผนก.

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `login.html` | เข้าสู่ระบบ — **★ ผู้ใช้เลือก basic auth (username + password) หรือ Google login** (ปุ่ม "เข้าสู่ระบบด้วย Google" ใช้ได้เฉพาะ user ที่ Admin ผูก Google account ไว้แล้ว — provisioning ที่ `settings.md`) · **★ first-login password change** (ถ้า user โหมด "ต้องเปลี่ยนเมื่อเข้าครั้งแรก") |
| shell ทุกหน้า | header: identity + global search + bell (panel/badge/deep link/ack) |
| `responsive.html` | layout mobile/tablet/desktop (hamburger/tab-bar) |

## 3. Fields / Data elements
| องค์ประกอบ | ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| identity | "ESSENCE Hub System" + logo + title | static | ทุกหน้า |
| **login method** | choice {basic (username+password) / Google} | editable | **★ Google เปิดใช้ได้เฉพาะ user ที่ผูก Google (settings.md) · basic เสมอ** |
| **first-login change** | flag (จาก user password mode) | computed | **★ โหมด must-change-first-login → บังคับตั้งรหัสใหม่หลัง login local ครั้งแรก** |
| notification | outbox {event, module ปลายทาง, deep link, payload, created_at} + read-bit ราย user | computed | ผู้รับ = Read ของ module ปลายทาง · payload เช่น FG→Low แนบ Suggested |
| badge | number cap "9+" | computed | ราย user (unread) |
| global search box | text (≥2 ตัวอักษร) | editable | ผลจัดกลุ่มตามชนิด |
| session | 24 ชม. + reset 06:00 | computed | warning ก่อนตัด |

## 4. Statuses / lifecycle
- **★ Login (auth choice):** หน้า login แสดง **สองทางเลือก** — (a) กรอก **username + password** (basic), หรือ (b) กด **"เข้าสู่ระบบด้วย Google"** (เฉพาะ user ที่มี Google account ผูกไว้; ถ้าอีเมล Google ไม่ match user ใด → error "บัญชี Google นี้ยังไม่ได้ผูกกับผู้ใช้ในระบบ"). ทั้งสองทางนำเข้า session เดียวกัน.
- **★ First-login password change:** ถ้า user มี password mode = **must-change-on-first-login** → หลัง login (basic) ครั้งแรก ระบบพาไปหน้า **ตั้งรหัสใหม่ (2 ครั้ง + show/hide)** ก่อนเข้าใช้งาน; ตั้งเสร็จ flag เคลียร์. mode = **permanent** → เข้าใช้งานได้เลย.
- **Notification (ราย user):** unread → read (ack รายรายการ หรือ mark all read). ack/read เป็น **ราย user** (A ack ไม่กระทบ B).
- **Notification events (ผ่าน outbox J5):** cross-module status changes (PO Confirmed→Production, QC pass/fail, DN Delivered/Rejected/Postponed, PR auto, Overdue, Customer Inactivity) **+ ★ FG→Low (Supply Planning)** — ยิง **real-time** เมื่อ FG พลิก non-Low→Low (แนบ Suggested) + **สรุปรายวัน J8 ~06:00**; ผู้รับ = Read Supply Planning; deep-link → supply-planning / SO produce-to-stock (ดู `supply-planning.md` §5.1, `non-functional.md` §6.1/§7).
- **Session:** active → (24 ชม. หมด หรือ 06:00 daily reset) → ต้อง login ใหม่; มี warning ก่อนตัด.

## 5. User Stories (absorbed) + AC สรุป
- **US-PLT-01 (Must) — login (basic/Google choice) + first-login change + identity + session warning:** **★ หน้า login เสนอ 2 ทาง — basic (username+password) หรือ Google** → login สำเร็จ → **★ ถ้าโหมด must-change-first-login → บังคับตั้งรหัสใหม่ก่อน** → ทุกหน้าแสดง "ESSENCE Hub System" + logo + browser title; เห็นเมนู/ค้นหา/dashboard ตาม Read. **Edge:** Google account ไม่ผูก user → error; ใกล้ reset 06:00 (หรือใกล้ครบ 24 ชม.) → แถบเตือน "ระบบจะออกจากระบบเวลา 06:00 กรุณาบันทึกงาน" ล่วงหน้า; ถึงเวลา → login ใหม่. **Error:** รหัสผิด → "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" (ไม่บอกช่องไหนผิด) · **★ ตั้งรหัสใหม่ 2 ครั้งไม่ตรง → "รหัสผ่านยืนยันไม่ตรงกัน"**.
- **US-PLT-02 (Must) — Notification routing ตาม Read-bit + deep link + ack ราย user:** 5 แจ้งเตือน → กด bell → กด "PO-181 เข้าคิวผลิต" → deep link production + ack → badge เหลือ 4 (ราย user). **Edge:** เหตุการณ์เข้า Production → เฉพาะผู้มี Read Production ได้รับ; **FG→Low → เฉพาะผู้มี Read Supply Planning** (ตัวอย่าง event เชิงรุกใหม่, deep-link ไป supply-planning + แสดง Suggested). **Error:** A ack → B เปิด bell ยังเห็น (ack ราย user).
- **US-PLT-03 (Must) — Notification panel: grouping/mark all read/empty/badge cap/ดูทั้งหมด:** 8 แจ้งเตือน → panel เรียงใหม่→เก่า, กลุ่ม "ยังไม่อ่าน" ก่อน, แสดงสูงสุด N + "ดูทั้งหมด" (list+pagination). **Edge:** unread 12 (badge "9+") → "ทำเป็นอ่านทั้งหมด" → ทุกรายการของ user นี้ read, badge→0 (ไม่กระทบผู้อื่น); >9 แสดง "9+". **Empty:** ไม่มีแจ้งเตือน → empty state "ไม่มีการแจ้งเตือน".
- **US-PLT-04 (Should) — Global header search:** พิมพ์ "181"/"กลอรี่" → ผลจัดกลุ่มตามชนิด (PO/QT/SO/ลูกค้า/วัตถุดิบ-Lot/PR-GR/DN-Invoice); คลิก = deep link. **Edge:** ผลนอกสิทธิ์ Read ไม่ปรากฏ; ไม่พบ → "ไม่พบผลการค้นหา". **Error:** <2 ตัวอักษร → ไม่ยิงค้น + "พิมพ์อย่างน้อย 2 ตัวอักษร".
- **US-PLT-05 (Must) — Responsive + RBAC guard ทุกหน้า:** mobile/tablet/desktop → responsive (hamburger/tab-bar); สถานะเป็นป้ายไทย ไม่มี enum ดิบ. **Edge:** ไม่มี Read module X → ไม่เห็นเมนู X + URL ตรง 403. **Error:** มี Read แต่ไม่มี Create → ปุ่มสร้างซ่อน/disable; เรียก API ตรง → 403. **★ user ที่ role ถูก Disabled/Deleted (settings.md §4b) → login ได้แต่ไม่มีสิทธิ์ใด ๆ → ไม่เห็นเมนู/403 ทุกจุด.**

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| login / logout (**basic หรือ Google**) | ทุก user ที่มี account (Active); Google = ต้องผูก Google ไว้ |
| **first-login password change** | เจ้าของบัญชี (บังคับตามโหมด) |
| รับ notification (รวม FG→Low) | **Read (R)** ของ module ปลายทาง (fan-out ตาม Read-bit; FG→Low = Read Supply Planning) |
| ack / mark all read | เจ้าของ noti (ราย user) |
| global search | **Read (R)** ต่อชนิดผลลัพธ์ (นอกสิทธิ์=ไม่แสดง) |
| เข้าถึง module/action | ตาม RUCDAA (guard เมนู/ปุ่ม/URL/API) |

## 7. Validations
- **★ login: basic ต้องกรอก username+password; Google ต้องมี link ที่ตรงกับ user (ไม่ตรง → error).**
- **★ first-login change: ตั้งรหัสใหม่ 2 ครั้งต้องตรงกัน ก่อนเข้าใช้งาน (โหมด must-change).**
- global search ≥2 ตัวอักษร จึงยิงค้น.
- badge > 9 แสดง "9+"; ack/read เป็นราย user.
- guard: ไม่มี Read = ไม่เห็นเมนู + URL ตรง 403; ไม่มี Create = ปุ่มซ่อน/disable + API 403.
- login error ไม่ระบุช่องที่ผิด (security).
- **FG→Low real-time ยิงตอน transition non-Low→Low เท่านั้น** (ไม่ยิงซ้ำระหว่างคง Low); J8 เป็น snapshot รายวัน (idempotent).

## 8. Pagination / Search
- หน้ารวมแจ้งเตือน ("ดูทั้งหมด"): 20/หน้า (G1). global search: ≥2 ตัวอักษร, ผลจัดกลุ่มตามชนิด.

## 9. Formulas / NFR
- notification fan-out = ผู้ใช้ทุกคนที่มี Read ของ module ปลายทาง (per-user read-bit) — **ไม่ hardcode role**.
- **event FG→Low (Supply Planning):** trigger = FG cover < Target; real-time (transition) + J8 daily digest ~06:00; payload แนบ **Suggested production** (ceil-to-batch); ผู้รับ = Read Supply Planning; deep-link → supply-planning / SO produce-to-stock (ดู `non-functional.md` §6.1/§7, `supply-planning.md` §5.1).
- session: 24 ชม. + daily reset 06:00 + pre-expiry warning.
- **★ auth methods:** basic (username+password) + Google (per-user link, provisioning ที่ `settings.md`) · **password mode** (must-change-first-login / permanent) บังคับ flow first-login-change ที่ platform · ดู `non-functional.md` §2.
- NFR: responsive ทุกหน้า (Must) · local + Google · 50 concurrent · < 2s (hard 3s).

## 10. Cross-links
- ทุกการส่งงานข้าม module → noti (continuity Noti matrix) → โผล่ใน `home.md` task inbox + `dashboard.md` badge (source เดียว). **FG→Low → `supply-planning.md` §5.1 + `non-functional.md` §6 (J8)/§7.** global search ↔ ทุก module detail. **★ auth/session/Google-link/password-mode provisioning → `settings.md` §5 US-SET-02/§4b.** Glossary (สถานะไทย).

## 11. Module changelog
- **Absorbed:** functional-spec `platform.html` US-PLT-01..05 (15 AC) verbatim ในความหมาย.
- **★ เพิ่ม (DECIDED 2026-07-29):** notification event **FG→Low (Supply Planning)** — real-time + J8 daily digest, แนบ Suggested, fan-out by Read Supply Planning, deep-link ไป supply-planning/SO prefill (§3/§4/§6/§7/§9).
- **★ เพิ่ม (2026-07-29 — Settings module review, ปอนด์):** หน้า login เสนอ **ทางเลือก basic auth (username+password) vs Google login** (Google ใช้ได้เฉพาะ user ที่ผูก Google — provisioning ที่ settings.md) · **first-login password change** (โหมด must-change-first-login → บังคับตั้งรหัสใหม่ก่อนใช้งาน) · guard: user ที่ role ถูก Disabled/Deleted → ไม่มีสิทธิ์ (§2/§4/§5 US-PLT-01/US-PLT-05/§7/§9). sync `settings.md`/`non-functional.md`.
- **คงเดิม:** identity ทุกหน้า · noti outbox + read-bit ราย user · global search ≥2 ตัวอักษร ตามสิทธิ์ · session 24h/06:00 + warning · responsive + RBAC guard.
