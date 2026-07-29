# Non-Functional Requirements (NFR) — ESSENCE Hub System

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE NFR SPEC** (consolidates + updates ทุก NFR ที่ล็อกแล้ว, adapt สู่ scope OEM/Own-Brand/Supply-Planning/Quotation)
ที่มา (locked, ไม่ประดิษฐ์ตัวเลข): `brief.md` §5/§8 · ADR-000..009 · `scheduled-jobs.html` (J1–J7) · architecture `index.html`/`db-schema.html` · `entity-status-map.md` §1.6 (negative stock) · `stock-reservation.md` (Option A) · `deletion-policy.md` · scope D1–D18 · README §2/§3 · **`supply-planning.md` §5.1 (Low alerting — J8)**

## สรุปภาษาไทย
รวม **ข้อกำหนดที่ไม่ใช่ฟังก์ชัน (NFR)** ทั้งหมดของ ESSENCE Hub ไว้ที่เดียว และอัปเดตให้ครอบ scope ใหม่ (OEM Quotation / Own-Brand SO / Supply Planning / FG). ครอบ: **Performance** (หน้า <2s max 3s, 50 concurrent, >200 PO/วัน + GR>50/วัน + เพิ่ม QT/SO/Supply-Planning เข้า load profile), **Auth/Session** (local+Google, 24h + เตะออก 06:00 ทุกวัน ไม่มีกะดึก, RBAC generic RUCDAA+Admin bit — D14), **Audit** (field-level, retention 1 ปี แล้ว manual purge; ทุก stock movement มี reason+source — D15; **ทุก action ของ QT ก็ถูก audit เต็ม**), **Backup/Infra** (GCP Cloud Run + Cloud SQL MySQL, backup รายวัน, storage abstraction GCS-ready), **Data/Format** (Asia/Bangkok, พ.ศ. display / UTC store, gapless numbering ต่อปี/เดือนทุกชนิดเอกสารรวม QT-/SO-/PRD/Batch/DN/INV, THB, VAT ตาม invoice date), **Scheduled Jobs J1–J8** (เพิ่ม **J8 = Supply Planning low-stock daily digest ~06:00**), **Notification outbox+read-bit** (รวม event ใหม่ **FG→Low** เชิงรุก), **global search**, **responsive**, **soft-delete + reference-guard**, **reliability/integrity**. ทุกข้อ derive จากคำตอบที่ปอนด์ล็อกแล้ว — ไม่มีการเดา.

---

## 1. Performance & Capacity
| # | NFR | ค่า (locked) | หมายเหตุ scope ใหม่ |
|---|---|---|---|
| P1 | เวลาตอบสนองต่อหน้า | **< 2s (hard cap 3s)** | ครอบทุกหน้ารวม quotation/so/supply-planning/dashboard drill |
| P2 | ผู้ใช้พร้อมกัน | **50 concurrent users** | brief §5.1 / platform NFR |
| P3 | ปริมาณงานต่อวัน | **> 200 PO/วัน · GR > 50/วัน** | **เพิ่ม load profile:** QT (OEM), SO (Own-Brand), Supply-Planning recompute (on-read) + Low-alert events — ใช้เพดานเดิมเป็น baseline |
| P4 | Dashboard aggregate | < 2s (hard 3s) | 7 แผนก/29 tile + drill + pagination (dashboard.md) |
| P5 | Client polling | dashboard refresh 15s · noti bell 15s | ฝั่งเบราว์เซอร์ (ไม่ใช่ server job) |

> **ไม่มีตัวเลขใหม่จากปอนด์สำหรับ QT/SO/Supply-Planning โดยเฉพาะ** — ใช้เพดานเดิม (P1/P2/P3) เป็น baseline; capacity planning จริงเป็นของ DevOps (Stage 4).

## 2. Auth / Session / Access Control
| # | NFR | รายละเอียด (locked) |
|---|---|---|
| A1 | Login | **local + Google Login** (ADR-007) |
| A2 | Session | **หมดอายุ 24 ชม.** + **บังคับ login ใหม่ทุกวัน 06:00** (J1, session_epoch) · **ไม่มีกะกลางคืน** (ปอนด์เคาะ) · มี **warning ก่อนหมด/ก่อนเตะออก** |
| A3 | RBAC | **generic RUCDAA ต่อ module** (R/U/C/D/A/**Admin bit**) — D14 · ไม่ hardcode role · role ไม่จำกัด · Admin bit = force override/undelete |
| A4 | Guard | เมนู/ปุ่ม/URL/API ทุกจุดตาม RUCDAA (platform.md US-PLT-05) |
| A5 | Scope ใหม่ | เพิ่ม module เข้า RBAC matrix: **Quotation / SO / Supply Planning** (settings.md §4) |

## 3. Audit & Traceability (NFR ระดับระบบ)
| # | NFR | รายละเอียด (locked) |
|---|---|---|
| AU1 | Field-level audit | ทุก action ทุก module เก็บ เวลา/ผู้ทำ/entity/field/จาก→เป็น/เหตุผล (traceability.md) · **★ รวมทุก action ของ Quotation: create / send (ตั้ง sent-date) / edit→เวอร์ชันใหม่ / Convert-to-PO→ยืนยัน (Confirmed) / cancel (ทุกสถานะ, เหตุผลบังคับ)** — บันทึกครบ + แสดงบน trace (quotation.md §10, traceability.md §4) |
| AU2 | Retention | **online 1 ปี** แล้ว **Super User manual purge/archive** — **ไม่มี auto-purge** (ADR-003) |
| AU3 | Stock ledger | ทุก movement เป็น **append-only ledger + reason + source ref บังคับ** (D15) |
| AU4 | GMP chain | Lot→Batch→line→PO(หรือ SO)→ลูกค้า→DN/INV · Batch `B-{PO}-{line}-{run}` · QT = head-of-chain สาย OEM, FG per-Batch (traceability.md) |
| AU5 | Archive | text file · Super User เท่านั้น · ยืนยันก่อน export |

## 4. Backup / Infrastructure
| # | NFR | รายละเอียด (locked) |
|---|---|---|
| I1 | Runtime | **GCP Cloud Run** (Phase 3) · Phase 2 = local PC |
| I2 | Database | **Cloud SQL (MySQL)** (ADR-000) |
| I3 | Backup | **รายวัน** — Phase 2: DevOps cron dump DB + `STORAGE_ROOT` · Phase 3: Cloud SQL automated backup (J7) — งาน DevOps (Stage 4) |
| I4 | Storage abstraction | ไฟล์แนบผ่าน **storage abstraction (GCS-ready)** (ADR-006) |

## 5. Data / Format / Localization
| # | NFR | รายละเอียด (locked) |
|---|---|---|
| D-F1 | Timezone | **Asia/Bangkok** · แสดง **พ.ศ.** / เก็บ **UTC** |
| D-F2 | Gapless numbering | **ต่อปี/เดือน ทุกชนิดเอกสาร** — PO/**QT-**/**SO-**/PR/GR/PRD/Batch/DN/INV/SHP (ADR-008) · void ไม่ทำให้เลขหาย |
| D-F3 | Currency/VAT | **THB** · VAT ตาม **effective date ยึด invoice date** · ตัวหนังสือไทย |
| D-F4 | สถานะ/UI | ป้ายสถานะ**ภาษาไทย**เสมอ · ไม่มี enum ดิบ · dropdown search ได้ทุกจุด |
| D-F5 | เลขเอกสาร | `PO-{YYYYMM}-{NNNNNN}` · `QT-{YYYYMM}-{NNNNNN}` · `SO-{YYYYMM}-{NNNNNN}` · `INV-{YYYY}-{NNNNNN}` · `GR-{YYYYMMDD}-{NNN}` · `SHP-{YYYYMMDD}-{NNNN}` · `DN-{YYYYMMDD}-{NNNNN}` · Batch `B-{PO}-{line}-{run}` |

## 6. Scheduled / Background Jobs (J1–J8) — locked + scope update
| Job | ความถี่ | ทำอะไร | แจ้งเตือน | idempotent |
|---|---|---|---|---|
| **J1** Session reset | ทุกวัน 06:00 | เลื่อน session_epoch → บังคับ login ใหม่ (24h expiry ด้วย) | — | ✓ |
| **J2** Customer inactivity sweep | ทุกวัน (เช้ามืด) | Active→Inactive เมื่อไม่มี order เกิน `inactive_after_months` (default 3) | ✓ Sale | ✓ |
| **J3** Invoice overdue sweep | ทุกวัน (เช้ามืด) | ส่งของแล้ว + เลยเครดิต + ยังไม่จ่าย → Overdue + นับวันค้าง | ✓ Finance+Sale | ✓ |
| **J4** Potential-delay | ทุกวัน (หรือทุกชั่วโมง) | PRD ใกล้ไม่ทันส่ง (2 วันผลิต+1 วันส่ง) → badge เสี่ยงล่าช้า | ✓ Sale+Stock | ✓ |
| **J5** Notification outbox dispatcher | ต่อเนื่อง ~1s | ส่ง event ใน outbox → noti ให้ผู้มี Read ของ module ปลายทาง | ✓ (ตัวส่งเอง) | ✓ |
| **J6** Stock ledger integrity (nightly) | ทุกคืน | เทียบ stock_balance vs Σmovement + reserved_balance vs Σreservation active → recompute | — (เตือน Admin ถ้าไม่ตรง) | ✓ |
| **J7** Database backup | ทุกวัน (DevOps) | Phase2 cron dump / Phase3 Cloud SQL backup | — | ✓ |
| **★ J8** Supply Planning low-stock daily digest | **ทุกวัน ~06:00 (จัดคู่ J1)** | ประเมิน FG ทุกตัว → ลิสต์ **FG ที่ Low (cover < Target) ทั้งหมด + Suggested production (ceil-to-batch)** → ยิง **1 แจ้งเตือนสรุป** ผ่าน outbox ให้ผู้มี Read Supply Planning; deep-link มา supply-planning | ✓ ผู้มี Read Supply Planning | ✓ (snapshot รายวัน; ประเมินใหม่จากสถานะปัจจุบัน — พลาดรอบ=ช้าไปวันเดียว) |

**Scheduler tracking:** ตาราง `scheduled_job_run` (job_name J1..J8 / scheduled_for / started_at / finished_at / status / affected_count / error_text) + lock กันรันซ้อน + **catch-up** ตอน service เริ่ม. Admin ดูที่ `GET /api/admin/scheduled-jobs`.

**Not a job (on-read / event / client):** BOM cost badge ล้าสมัย = on-read · Supply-Planning cover/suggested/badge (ตอนเปิดหน้า) = on-read · Shipment รอบปิด = event · Inactive→Active = event · ปิด PR ของเข้าครบ = event · dashboard/bell refresh 15s = client polling · gapless numbering = in-transaction.

### 6.1 ★ Supply Planning proactive alerting (DECIDED 2026-07-29 — แก้จาก on-read-only)
> **เดิม (parked):** "Supply-Planning เป็น on-read ไม่มี job/แจ้งเตือนเชิงรุก". **ปอนด์ตัดสินแล้ว → แจ้งเตือนเชิงรุกทั้ง real-time + daily digest** (ปิดคำถามที่เคยค้าง).
- **Trigger:** FG พลิกเข้า **Low (cover < Target)** — ทุกแจ้งเตือน **แนบ Suggested production** (ceil-to-batch) เสมอ.
- **(a) Real-time:** stock/production event (ขาย/ส่ง/loss/จอง) ที่ทำให้ FG พลิก non-Low → Low → ยิงทันที (ยิงตอน transition, ไม่ยิงซ้ำระหว่างคง Low) ผ่าน outbox (J5).
- **(b) Daily digest:** **J8** ~06:00 — สรุป FG Low ทั้งหมด + Suggested (idempotent).
- **Delivery/Recipient:** notification outbox + per-user read-bit; ผู้รับ = **มีสิทธิ์ Read Supply Planning** (fan-out ตาม Read, **ไม่ hardcode role**). Deep-link → supply-planning / SO produce-to-stock (prefill).
- รายละเอียด business = `supply-planning.md` §5.1; event ในระบบ noti = `platform.md` §7/§9 (FG→Low).

## 7. Notification (NFR)
- **Transactional outbox + read-bit ราย user** (J5/ADR-005): ผู้รับ = ผู้มี **Read ของ module ปลายทาง** (fan-out) · deep link + ack/read ราย user + mark all read + "ดูทั้งหมด" (list 20/หน้า) + empty state + badge cap "9+" (platform.md).
- **Notification events รวม (ตัวอย่างหลัก):** cross-module status changes (PO Confirmed→Production, QC pass/fail, DN Delivered/Rejected/Postponed, PR auto, Overdue, Inactivity) **+ ★ FG→Low (Supply Planning, real-time + J8 digest, แนบ Suggested)** — event ใหม่ที่เพิ่มรอบนี้.
- ตัวเลข noti = source เดียวกับ Home task inbox + Dashboard badge ของ user เดียวกัน.

## 8. Global Search (NFR)
- ค้นข้าม entity (PO/QT/SO/ลูกค้า/วัตถุดิบ-Lot/PR-GR/DN-Invoice) จาก header · **จำกัดตามสิทธิ์ Read** · **≥ 2 ตัวอักษร** · ผลจัดกลุ่ม + คลิก = deep link (platform.md US-PLT-04).

## 9. Responsive / Usability (NFR — first-class)
- **Responsive ทุกหน้า (Must)** — desktop/tablet/mobile · minimize clicks (PO ≤10, invoice ≤6), smart defaults, จบในหน้าเดียวถ้าได้, dropdown search ทุกจุด, ไม่มี enum ดิบ (brief §2.1/§5).

## 10. Soft-Delete + Reference-Guard (NFR baseline)
- **ไม่มี hard delete ทั้งระบบ** · master = soft-delete (flag, default filter ซ่อน แต่ search เจอ) · เอกสารการค้า = **void/cancel** (gapless) · **reference-guard** · audit + comment บังคับ · undelete = Admin. รายละเอียด + entity ใหม่ = **`deletion-policy.md`**.

## 11. Reliability / Integrity
| # | NFR | รายละเอียด (locked) |
|---|---|---|
| R1 | Append-only ledger | stock ledger เป็นความจริง (on_hand/reserved เป็น cache) — recompute ได้เสมอ (ADR-001) |
| R2 | Nightly integrity | J6 เทียบ 2 cache (stock_balance + reserved_balance) กับแหล่งจริง |
| R3 | Negative-stock policy | on_hand/Available ติดลบได้ (เตือนไม่บล็อก); GR ชดเชย + FIFO retro-link — entity-status-map §1.6 |
| R4 | Reservation | ยืนยัน PO/SO = จอง; เริ่มผลิต/dispatch = ตัดจริง (Option A) — stock-reservation.md |
| R5 | Transactional outbox | noti event (รวม FG→Low) เขียนใน tx เดียวกับการเปลี่ยนสถานะ/ledger (กันหลุด) — J5/ADR-005 |

## 12. Open question (NFR)
**ไม่มี open question ค้าง.** คำถามเดิมเรื่อง Supply Planning proactive alert = **ปิดแล้ว (ปอนด์ตัดสิน real-time + J8 digest — §6.1)**. NFR อื่นทั้งหมด derive จากค่าที่ล็อกแล้ว.

## 13. Cross-links
- Auth/session/RBAC → `settings.md`/`platform.md` · Audit → `traceability.md` · ledger reason/source → `stock.md` §6 · negative stock/retro → `goods-receipt.md`/entity-status-map §1.6 · reservation → `so.md`/`po.md`/stock-reservation · soft-delete/void → `deletion-policy.md` · **Low alerting → `supply-planning.md` §5.1 + `platform.md` §7/§9** · **QT activity/audit → `quotation.md` §10 + `traceability.md` §4** · jobs → architecture scheduled-jobs (TL).

## 14. Module changelog
- **Consolidated + updated:** NFR ทั้งหมดจาก brief/ADR/scheduled-jobs/entity-status-map/stock-reservation/deletion-policy → NFR module เดียว, adapt สู่ scope OEM/Own-Brand/Supply-Planning/Quotation.
- **★ DECIDED (2026-07-29):** Supply Planning **proactive Low alerting** — real-time (transition non-Low→Low) + **J8 daily digest ~06:00** (แนบ Suggested, fan-out by Read Supply Planning). เพิ่ม J8 เข้า J-table (§6) + event FG→Low เข้า notification (§7) + reconcile §6.1 (จาก "on-read no job") + ปิด open question (§12).
- **★ เพิ่ม (2026-07-29 — Quotation module review):** AU1 ระบุชัดว่า **ทุก action ของ Quotation (create/send+sent-date/edit→version/convert→Confirmed/cancel) ถูก audit + แสดง trace** (§3, cross-ref quotation.md §10 / traceability.md §4).
- **ไม่มีตัวเลขประดิษฐ์:** ค่าทั้งหมดอ้างแหล่ง locked.
