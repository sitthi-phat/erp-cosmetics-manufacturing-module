# Module — Home / หน้าหลัก (Task Inbox)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE SPEC** (absorbs functional-spec `home.html` US-HOME-01..03 + delta)
Mockups: `mockups/home.html` · `mockups/login.html` (identity ร่วม — ดู `platform.md`)
กฎอ้างอิง: RUCDAA/Read scope (`permission-matrix.md`, rbac-deletion) · Notification matrix (continuity) · Glossary (Lot vs Batch) · README §3 (G1–G5)

## สรุปภาษาไทย
หน้าแรกหลัง login = **งานที่รอ (Task Inbox) ตามสิทธิ์ Read ของ user** + ทางลัดงานที่ทำบ่อย (quick actions ตามสิทธิ์) + กล่อง onboarding (💡 + "ต้องรู้ก่อนเริ่ม" อธิบาย Lot vs Batch). ทุกงานกด "เปิด" = deep link ไปหน้างานจริงพร้อม context. **จำนวนงานค้างต้องตรงกับ dashboard tile และ notification badge ของ user คนเดียวกัน (source เดียว ไม่คำนวณซ้ำ)**. เมนู/quick action แสดงเฉพาะ module ที่ role มีสิทธิ์ Read. รองรับ empty state ("ไม่มีงานค้าง 🎉") + error state (โหลดไม่สำเร็จ + ปุ่มลองใหม่).

---

## 1. Purpose
เป็นจุดเริ่มงานประจำวันของทุก role: รวมงานค้างที่ผู้ใช้ต้องทำต่อไว้ที่เดียว, พาไปทำงานต่อได้ในคลิกเดียว (ลดเวลาไล่หา), และช่วยผู้ใช้ใหม่เข้าใจระบบ (onboarding). **ไม่มี entity/ตารางใหม่** — เป็น aggregate view จากสถานะ PO/PRD/DN/Invoice/Customer ที่เกี่ยวข้องกับ user + notification.

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `home.html` | greeting + role · การ์ด "งานที่รอคุณอยู่" (task inbox + deep link "เปิด") · "งานที่ทำบ่อย" (quick actions) · onboarding 💡 + "ต้องรู้ก่อนเริ่ม" · noti bell badge |

## 3. Fields / Data elements
| องค์ประกอบ | ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| greeting "สวัสดี คุณ<ชื่อ> 👋" + role | text | computed | จาก session/identity |
| การ์ด task inbox | list {งาน, badge สถานะไทย, ปุ่ม "เปิด"} | computed | scope = สิทธิ์ Read ของ user · จำนวน = source เดียวกับ dashboard/noti |
| quick actions | list {ป้าย, ปลายทาง} | computed | แสดงเฉพาะทางลัดที่ role มีสิทธิ์ Read/Create |
| onboarding | ข้อความคงที่ + Lot/Batch glossary | static | ไม่มี enum/รหัสดิบ |
| noti badge | number (cap "9+") | computed | ราย user (ดู `platform.md` US-PLT-03) |

## 4. Statuses / lifecycle
ไม่มี state machine ของ Home เอง — สะท้อนสถานะจริงของ entity ปลายทาง (PO/PRD/DN/Invoice/Customer). ป้ายในการ์ดเป็น **ป้ายสถานะภาษาไทย** เสมอ (เช่น "ถูกปฏิเสธ → ต้องติดต่อลูกค้า", "Postpone 10/07", "รอชำระ · ครบ 07/08", "รอรับงาน", "Rework").

## 5. User Stories (absorbed) + AC สรุป
- **US-HOME-01 (Must) — Task inbox ต่อ role + deep link:** การ์ด "งานที่รอคุณอยู่" แสดงเฉพาะงานของ role นั้น (scope = Read); กด "เปิด" = deep link ไปหน้ารายละเอียดจริง (po-detail/production/invoice…). ตัวเลข **ตรงกับ dashboard tile + noti** ของ user คนเดียวกัน. งานที่ user ไม่มีสิทธิ์ Read = **ไม่แสดง**; deep link ตรงไปหน้าที่ไม่มีสิทธิ์ → guard 403.
- **US-HOME-02 (Should) — Onboarding + เมนูตามสิทธิ์:** กล่อง 💡 + การ์ด "ต้องรู้ก่อนเริ่ม" (Lot = ล็อตวัตถุดิบ vs Batch = รอบผลิต · สถานะไทยเสมอ · ทุกการเปลี่ยนสถานะมี trace). เมนูซ้าย + quick action แสดงเฉพาะ module ที่มีสิทธิ์ Read. ไม่แสดง enum/รหัสดิบ.
- **US-HOME-03 (Should) — Quick actions + empty state:** quick actions (เช่น เปิด PO→po-create, ลูกค้าของฉัน→customers, ติดตาม PO→po-list) คลิก = ไปทันที. ไม่มีงานค้าง → empty state "ไม่มีงานค้าง 🎉" (ไม่ error) + ยังเห็น quick actions/onboarding. โหลดล้มเหลว → "โหลดงานที่รอไม่สำเร็จ ลองใหม่" + ปุ่มลองใหม่.

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| เห็นงานในการ์ด task inbox | **Read (R)** ของ module ที่งานสังกัด (ต่องาน) |
| กด "เปิด" (deep link) | **Read (R)** ของ module ปลายทาง (ไม่มี = 403 ที่ปลายทาง) |
| เห็น quick action / เมนู | **Read/Create** ของ module นั้น |
> Home ไม่มี write action ของตัวเอง — ทุกการกระทำเกิดที่หน้า module ปลายทาง.

## 7. Validations / Rules
- Task inbox scope = สิทธิ์ Read ราย module (ไม่ leak งานข้าม module).
- ตัวเลข task inbox = dashboard aggregate = noti badge (ห้ามคำนวณคนละทาง).
- สถานะทุกตัว = ป้ายภาษาไทย (ไม่มี enum ดิบ).

## 8. Pagination / Search
- การ์ด task inbox แสดงงานเด่นก่อน + ลิงก์ไปหน้ารวม/หน้า module (list มี G1 20/หน้าที่ปลายทาง). Home เองไม่ใช่ list เต็ม.

## 9. Formulas
- task inbox = union ของงานค้างที่ user เป็นเจ้าภาพ/ผู้รับ noti (จากสถานะ PO/PRD/DN/Invoice/Customer) **filtered ด้วย Read scope** — reuse dashboard aggregate/noti inbox (ไม่มีสูตรใหม่).

## 10. Cross-links
- นับตรงกับ `dashboard.md` (tile) + `platform.md` (noti badge, source เดียว). ทุกเหตุการณ์ noti (continuity Noti matrix) → โผล่ใน task inbox ของ role ปลายทาง. onboarding glossary → Glossary (Lot/Batch).

## 11. Module changelog
- **Absorbed:** functional-spec `home.html` US-HOME-01..03 (9 AC) verbatim ในความหมาย.
- **คงเดิม:** task inbox scope ตาม Read · single-source count (home=dashboard=noti) · onboarding Lot/Batch · empty/error state.
