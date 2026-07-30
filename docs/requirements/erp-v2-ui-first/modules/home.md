# Module — Home / หน้าหลัก (Task Inbox) — ★ REMOVED (ตัดทิ้ง 2026-07-30)

slug: `erp-v2-ui-first` · PO · 2026-07-30 · **REMOVED MODULE — ปอนด์สั่งตัดทิ้ง ("ตัดทิ้ง ไม่มี module นี้")**
> ไฟล์นี้เก็บไว้เป็น **tombstone เพื่อ trace ประวัติเท่านั้น** — ไม่ใช่ spec, ไม่มี HTML review view, ไม่ถูกลิงก์ในหน้า index. *(ควร `git rm` ทั้ง `modules/home.md` และ `functional-spec/modules/home.html` เมื่อสะดวก — คงไว้เป็น tombstone เพราะเครื่องมือปัจจุบันลบไฟล์ตรงไม่ได้.)*

## สรุปภาษาไทย
**โมดูล Home (หน้าหลัก / Task Inbox) ถูกตัดทิ้งทั้งระบบ** ตามคำสั่งปอนด์ (2026-07-30). **หน้าแรกหลัง login เปลี่ยนเป็น Dashboard** (`dashboard.md`). แนวคิด **task-inbox รวมงานค้างต่อ user ถูกตัดทิ้ง (ไม่ย้ายไป Dashboard)** — งานประจำวัน **รายแผนก** ดูจาก **Dashboard tile ตามสิทธิ์ Read ของแผนก** แทน; การแจ้งเตือนงานข้ามแผนกยังทำผ่าน **Notification bell** (`platform.md`). เมนูซ้ายตัดรายการ "หน้าหลัก (Home)" ออก (งาน UX/UI sweep).

---

## สถานะ: REMOVED — สิ่งที่แทนที่ / สิ่งที่ตัดทิ้ง
| เดิม (Home) | ผลหลังตัดทิ้ง |
|---|---|
| หน้าแรกหลัง login = Home task inbox | **หน้าแรก = Dashboard** (`dashboard.md`) |
| การ์ด task inbox (รวมงานค้างต่อ user ตามสิทธิ์ Read) | **ตัดทิ้ง** — งานประจำวัน = Dashboard tile รายแผนก (visibility = Read permission ต่อแผนก) |
| quick actions (ทางลัดงานที่ทำบ่อย) | **ตัดทิ้ง** — เข้าถึงงานผ่านเมนูซ้าย + Dashboard drill + global search (`platform.md`) |
| onboarding 💡 + "ต้องรู้ก่อนเริ่ม" (Lot vs Batch glossary) | **ตัดทิ้งจากหน้าแรก** — glossary Lot/Batch ยังอยู่ใน Reference / Glossary |
| noti badge (source เดียวกับ dashboard/noti) | คงเดิมที่ **Notification bell** (`platform.md`) |
| เมนูซ้าย "หน้าหลัก (Home)" | **ตัด** — Dashboard เป็น landing หลัก (งาน UX/UI sweep ทุก mockup) |

> ไม่มีฟีเจอร์ unique ของ Home ที่ต้องย้ายไป Dashboard — task-inbox aggregate เดิม reuse สถานะ/นับเดียวกับ Dashboard + notification อยู่แล้ว จึงตัดได้โดยไม่เสีย capability. Dashboard (per-department Read-scoped) + Notification bell ครอบคลุมงานประจำวันครบ.
