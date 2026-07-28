# Non-Functional Requirements (NFR) — ESSENCE Hub System

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE NFR SPEC** (consolidates + updates ทุก NFR ที่ล็อกแล้ว, adapt สู่ scope OEM/Own-Brand/Supply-Planning/Quotation)
ที่มา (locked, ไม่ประดิษฐ์ตัวเลข): `brief.md` §5/§8 · ADR-000..009 · `scheduled-jobs.html` (J1–J7) · architecture `index.html`/`db-schema.html` · `entity-status-map.md` §1.6 (negative stock) · `stock-reservation.md` (Option A) · `deletion-policy.md`/`modules/deletion-policy.md` · scope D1–D18 · README §2/§3

## สรุปภาษาไทย
รวม **ข้อกำหนดที่ไม่ใช่ฟังก์ชัน (NFR)** ทั้งหมดของ ESSENCE Hub ไว้ที่เดียว และอัปเดตให้ครอบ scope ใหม่ (OEM Quotation / Own-Brand SO / Supply Planning / FG). ครอบ: **Performance** (หน้า <2s max 3s, 50 concurrent, >200 PO/วัน + GR>50/วัน + เพิ่ม QT/SO/Supply-Planning เข้า load profile), **Auth/Session** (local+Google, 24h + เตะออก 06:00 ทุกวัน ไม่มีกะดึก, RBAC generic RUCDAA+Admin bit — D14), **Audit** (field-level, retention 1 ปี แล้ว manual purge; ทุก stock movement มี reason+source — D15), **Backup/Infra** (GCP Cloud Run + Cloud SQL MySQL, backup รายวัน, storage abstraction GCS-ready), **Data/Format** (Asia/Bangkok, พ.ศ. display / UTC store, gapless numbering ต่อปี/เดือนทุกชนิดเอกสารรวม QT-/SO-/PRD/Batch/DN/INV, THB, VAT ตาม invoice date), **Scheduled Jobs J1–J7** (+ ตรวจ scope ใหม่: Supply-Planning เป็น on-read ไม่ต้องมี job ใหม่ — มี 1 คำถามเสริมเรื่อง proactive alert), **Notification outbox+read-bit**, **global search**, **responsive**, **soft-delete + reference-guard**, **reliability/integrity** (append-only ledger, nightly dual-cache integrity, negative-stock policy). ทุกข้อ derive จากคำตอบที่ปอนด์ล็อกแล้ว — ไม่มีการเดา.

---

## 1. Performance & Capacity
| # | NFR | ค่า (locked) | หมายเหตุ scope ใหม่ |
|---|---|---|---|
| P1 | เวลาตอบสนองต่อหน้า | **< 2s (hard cap 3s)** | ครอบทุกหน้ารวม quotation/so/supply-planning/dashboard drill |
| P2 | ผู้ใช้พร้อมกัน | **50 concurrent users** | brief §5.1 / platform NFR |
| P3 | ปริมาณงานต่อวัน | **> 200 PO/วัน · GR > 50/วัน** | **เพิ่ม load profile:** QT (OEM), SO (Own-Brand), Supply-Planning recompute (on-read) — order lifecycle 2 สาย (OEM+Own-Brand) เพิ่มปริมาณ query แต่ไม่เปลี่ยนเพดาน P1/P2 (ปอนด์ยังไม่ให้ตัวเลขใหม่ → ใช้เกณฑ์เดิมเป็น baseline) |
| P4 | Dashboard aggregate | < 2s (hard 3s) | 7 แผนก/29 tile + drill + pagination (dashboard.md) |
| P5 | Client polling | dashboard refresh 15s · noti bell 15s | ฝั่งเบราว์เซอร์ (ไม่ใช่ server job) |

> **ไม่มีตัวเลขใหม่จากปอนด์สำหรับ QT/SO/Supply-Planning โดยเฉพาะ** — ใช้เพดานเดิม (P1/P2/P3) เป็น baseline; ถ้าปริมาณจริงสูงกว่านี้เป็นเรื่อง capacity planning ของ DevOps (Stage 4).

## 2. Auth / Session / Access Control
| # | NFR | รายละเอียด (locked) |
|---|---|---|
| A1 | Login | **local + Google Login** (ADR-007) |
| A2 | Session | **หมดอายุ 24 ชม.** + **บังคับ login ใหม่ทุกวัน 06:00** (J1, session_epoch) · **ไม่มีกะกลางคืน** (ปอนด์เคาะ) · มี **warning ก่อนหมด/ก่อนเตะออก** ให้เซฟงาน |
| A3 | RBAC | **generic RUCDAA ต่อ module** (Read/Update/Create/Delete/Approve/**Admin bit**) — D14 · ไม่ hardcode role · role ไม่จำกัด · Admin bit = force override/undelete |
| A4 | Guard | เมนู/ปุ่ม/URL/API ทุกจุดตาม RUCDAA · ไม่มี Read=ไม่เห็นเมนู+URL 403 · ไม่มี Create=ปุ่มซ่อน/disable+API 403 (platform.md US-PLT-05) |
| A5 | Scope ใหม่ | เพิ่ม module ใหม่เข้า RBAC matrix: **Quotation / SO / Supply Planning** (settings.md §4) — บังคับสิทธิ์ที่ระดับ module เดียวกับของเดิม |

## 3. Audit & Traceability (NFR ระดับระบบ)
| # | NFR | รายละเอียด (locked) |
|---|---|---|
| AU1 | Field-level audit | ทุก action ทุก module เก็บ เวลา/ผู้ทำ/entity/field/จาก→เป็น/เหตุผล (traceability.md) |
| AU2 | Retention | **online 1 ปี** แล้ว **Super User manual purge/archive** — **ไม่มี auto-purge** (ADR-003) |
| AU3 | Stock ledger | ทุก movement (reserve/consume/GR/FG-in/surplus/loss/return/adjust) เป็น **append-only ledger + reason + source ref บังคับ** (D15) |
| AU4 | GMP chain | Lot→Batch→line→PO(หรือ SO)→ลูกค้า→DN/INV · Batch `B-{PO}-{line}-{run}` เป็นหลักฐาน GMP ห้ามหาย · **scope ใหม่:** QT = head-of-chain สาย OEM, FG per-Batch ผูก Own-Brand Batch/PRD (traceability.md) |
| AU5 | Archive | text file · Super User เท่านั้น · ยืนยันก่อน export |

## 4. Backup / Infrastructure
| # | NFR | รายละเอียด (locked) |
|---|---|---|
| I1 | Runtime | **GCP Cloud Run** (Phase 3) · Phase 2 = local PC (dev/test env) |
| I2 | Database | **Cloud SQL (MySQL)** (ADR-000 stack: React + Node.js + MySQL) |
| I3 | Backup | **รายวัน** — Phase 2: DevOps cron dump DB + ไฟล์แนบ (`STORAGE_ROOT`) · Phase 3: Cloud SQL automated backup (J7, ปอนด์ยืนยัน NFR) — งานของ DevOps (Stage 4) |
| I4 | Storage abstraction | ไฟล์แนบผ่าน **storage abstraction (GCS-ready)** — Phase 2 local `STORAGE_ROOT`, Phase 3 GCS (ADR-006) |

## 5. Data / Format / Localization
| # | NFR | รายละเอียด (locked) |
|---|---|---|
| D-F1 | Timezone | **Asia/Bangkok** · แสดง **พ.ศ.** / เก็บ **UTC** (db timestamps UTC) |
| D-F2 | Gapless numbering | **ต่อปี/เดือน ทุกชนิดเอกสาร** — PO/**QT-**/**SO-**/PR/GR/PRD/Batch/DN/INV/SHP · gapless ตามสรรพากร ห้ามข้าม (ADR-008) · void ไม่ทำให้เลขหาย |
| D-F3 | Currency/VAT | **THB** · VAT ตาม **effective date ยึด invoice date** · ตัวหนังสือไทยบนใบกำกับ |
| D-F4 | สถานะ/UI | ป้ายสถานะ**ภาษาไทย**เสมอ · ไม่มี enum/รหัสดิบโผล่ · dropdown search ได้ทุกจุด |
| D-F5 | เลขเอกสารรูปแบบ | `PO-{YYYYMM}-{NNNNNN}` · `QT-{YYYYMM}-{NNNNNN}` · `SO-{YYYYMM}-{NNNNNN}` · `INV-{YYYY}-{NNNNNN}` · `GR-{YYYYMMDD}-{NNN}` · `SHP-{YYYYMMDD}-{NNNN}` · `DN-{YYYYMMDD}-{NNNNN}` · Batch `B-{PO}-{line}-{run}` (glossary/brief §5) |

## 6. Scheduled / Background Jobs (J1–J7) — locked + scope check
| Job | ความถี่ | ทำอะไร | แจ้งเตือน | idempotent |
|---|---|---|---|---|
| **J1** Session reset | ทุกวัน 06:00 | เลื่อน session_epoch → บังคับ login ใหม่ (24h expiry ด้วย) | — | ✓ |
| **J2** Customer inactivity sweep | ทุกวัน (เช้ามืด) | Active→Inactive เมื่อไม่มี order เกิน `inactive_after_months` (default 3, ชุด {1,3,6,8}) | ✓ Sale | ✓ |
| **J3** Invoice overdue sweep | ทุกวัน (เช้ามืด) | ส่งของแล้ว + เลยเครดิต + ยังไม่จ่าย → Overdue + นับวันค้าง | ✓ Finance+Sale | ✓ |
| **J4** Potential-delay | ทุกวัน (หรือทุกชั่วโมง) | PRD ใกล้ไม่ทันส่ง (2 วันผลิต+1 วันส่ง) → badge เสี่ยงล่าช้า | ✓ Sale+Stock | ✓ |
| **J5** Notification outbox dispatcher | ต่อเนื่อง ~1s | ส่ง event ใน outbox → noti ให้ผู้มี Read ของ module ปลายทาง (transactional outbox) | ✓ (ตัวส่งเอง) | ✓ |
| **J6** Stock ledger integrity (nightly) | ทุกคืน | เทียบ 2 cache: stock_balance vs Σmovement + reserved_balance vs Σreservation active → recompute ถ้าไม่ตรง | — (เตือน Admin ถ้าไม่ตรง) | ✓ |
| **J7** Database backup | ทุกวัน (DevOps) | Phase2 cron dump / Phase3 Cloud SQL backup | — | ✓ |

**Scheduler tracking:** ตาราง `scheduled_job_run` (job_name/scheduled_for/started_at/finished_at/status/affected_count/error_text) + lock กันรันซ้อน + **catch-up** ตอน service เริ่ม (ถ้ารายวันของวันนี้ยังไม่รัน+เลยเวลา → รันทันที). Admin ดูที่ `GET /api/admin/scheduled-jobs`.

**Not a job (on-read / event / client):** BOM cost badge ล้าสมัย = **on-read** · Supply-Planning cover/suggested/badge = **on-read** (เหมือน BOM badge) · Shipment รอบปิด = event cascade · Inactive→Active = event · ปิด PR ของเข้าครบ = event (GR) · dashboard/bell refresh 15s = client polling · gapless numbering = in-transaction.

### 6.1 ★ Scope check — งานตั้งเวลาใหม่จาก scope ใหม่?
- **Supply Planning recompute:** เป็น **on-read** (คำนวณ Available/cover/suggested ตอนเปิดหน้า/dashboard) — สอดคล้อง pattern "BOM cost badge = on-read". **ไม่ต้องเพิ่ม scheduled job** เพื่อคำนวณ.
- **สิ่งที่ยัง "ไม่มี" ในระบบปัจจุบัน:** ไม่มี job push **แจ้งเตือนเชิงรุก (proactive alert)** เมื่อ FG cover/สต็อกต่ำกว่า safety — ปัจจุบัน "ใกล้หมด"/Low เป็น **state tile (on-read)** ไม่ยิง noti เอง. → **นี่คือคำถามเสริม (non-blocking) ให้ปอนด์** (ดู §12) ว่าต้องการ job แจ้งเตือนเชิงรุกหรือไม่ — **ไม่เดา**, คงพฤติกรรม on-read เดิมเป็น default.

## 7. Notification (NFR)
- **Transactional outbox + read-bit ราย user** (J5/ADR-005): ผู้รับ = ผู้มีสิทธิ์ **Read ของ module ปลายทาง** (fan-out) · deep link + ack/read ราย user + mark all read + "ดูทั้งหมด" (list 20/หน้า) + empty state + badge cap "9+" (platform.md).
- ตัวเลข noti = source เดียวกับ Home task inbox + Dashboard badge ของ user เดียวกัน.

## 8. Global Search (NFR)
- ค้นข้าม entity (PO/QT/SO/ลูกค้า/วัตถุดิบ-Lot/PR-GR/DN-Invoice) จาก header · **จำกัดตามสิทธิ์ Read** · **≥ 2 ตัวอักษร** · ผลจัดกลุ่มตามชนิด + คลิก = deep link (platform.md US-PLT-04).

## 9. Responsive / Usability (NFR — first-class)
- **Responsive ทุกหน้า (Must)** — desktop/tablet/mobile (hamburger/tab-bar) · target user = ไม่เคยใช้ ERP → **minimize clicks** (เปิด PO ≤10 คลิก, invoice ≤6 คลิก — เพดานวัด UAT), smart defaults, จบในหน้าเดียวถ้าได้, dropdown search ได้ทุกจุด, ไม่มี enum ดิบ (brief §2.1/§5).

## 10. Soft-Delete + Reference-Guard (NFR baseline)
- **ไม่มี hard delete ทั้งระบบ** · master = soft-delete (flag `deleted_at/deleted_by/delete_reason`, default filter ซ่อน แต่ search เจอ read-only) · เอกสารการค้า = **void เท่านั้น** (gapless) · **reference-guard** = record ที่ถูกลบห้ามเป็น reference ของของใหม่ (หายจาก dropdown) แต่ของเดิมวิ่งต่อได้ · ทุกการลบ audit + comment บังคับ · undelete = Admin. รายละเอียดเต็ม + ต่อ entity (รวม entity ใหม่) = **`deletion-policy.md`**.

## 11. Reliability / Integrity
| # | NFR | รายละเอียด (locked) |
|---|---|---|
| R1 | Append-only ledger | stock ledger เป็นความจริง (on_hand/reserved เป็น cache) — recompute ได้เสมอ (ADR-001) |
| R2 | Nightly integrity | J6 เทียบ 2 cache (stock_balance + reserved_balance) กับแหล่งจริง (dual-cache check) |
| R3 | Negative-stock policy | on_hand ติดลบได้ (ผลิตล่วงหน้า) + Available ติดลบได้ (จองเกิน) — **เตือนไม่บล็อก**; GR ชดเชย + FIFO retro-link (Batch↔Lot GMP) — entity-status-map §1.6 |
| R4 | Reservation | ยืนยัน PO/SO = จอง; เริ่มผลิต/ dispatch = ตัดจริง (Option A) — stock-reservation.md |
| R5 | Transactional outbox | noti event เขียนใน tx เดียวกับการเปลี่ยนสถานะ (กันหลุด) — J5/ADR-005 |

## 12. Open question (NFR) — เสริม, non-blocking
มี **1 คำถามเสริม** (ไม่บล็อก) ให้ปอนด์เรื่อง scheduled job ของ scope ใหม่ (Supply Planning proactive alert) — ดูรายละเอียด+ตัวเลือกใน status/README. Default ปัจจุบัน = **คงพฤติกรรม on-read เดิม (ไม่มี job ใหม่)**. NFR อื่นทั้งหมด derive จากค่าที่ล็อกแล้ว — ไม่มี gap.

## 13. Cross-links
- Auth/session/RBAC → `settings.md`/`platform.md` · Audit → `traceability.md` (source เดียว) · ledger reason/source → `stock.md` §6 · negative stock/retro → `goods-receipt.md`/entity-status-map §1.6 · reservation → `so.md`/`po.md`/stock-reservation · soft-delete/void → `deletion-policy.md` · จำนวน/format → glossary · jobs → architecture scheduled-jobs (TL).

## 14. Module changelog
- **Consolidated + updated:** NFR ทั้งหมดจาก brief §5/§8, ADR-000..009, scheduled-jobs J1–J7, entity-status-map §1.6, stock-reservation, deletion-policy → รวมเป็น NFR module เดียว, adapt สู่ scope OEM/Own-Brand/Supply-Planning/Quotation (load profile + QT-/SO- gapless + RBAC 3 module ใหม่ + FG/QT ใน GMP chain).
- **ตรวจ scope ใหม่:** Supply-Planning = on-read (ไม่มี job ใหม่); ยกคำถามเสริม proactive alert (non-blocking) แทนการเดา.
- **ไม่มีตัวเลขประดิษฐ์:** ค่าทั้งหมดอ้างแหล่ง locked; QT/SO ใช้เพดาน perf เดิมเป็น baseline.
