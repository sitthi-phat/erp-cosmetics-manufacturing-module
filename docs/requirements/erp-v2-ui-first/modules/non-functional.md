# Non-Functional Requirements (NFR) — ESSENCE Hub System

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE NFR SPEC** (consolidates + updates ทุก NFR ที่ล็อกแล้ว, adapt สู่ scope OEM/Own-Brand/Supply-Planning/Quotation)
ที่มา (locked, ไม่ประดิษฐ์ตัวเลข): `brief.md` §5/§8 · ADR-000..009 · `scheduled-jobs.html` (J1–J7) · architecture `index.html`/`db-schema.html` · `entity-status-map.md` §1.6 (negative stock) · `stock-reservation.md` (Option A) · `deletion-policy.md` · scope D1–D18 · README §2/§3 · **`supply-planning.md` §5.1 (Low alerting — J8)** · **`comment-convention.md` (comment field = audited)** · **`stock.md` §3b/§6 (add-RM + loss/adjust movements)** · **`bom.md` §5/§5c (code user-entered-locked + BOM changes/inactivate)** · **`supplier.md` §10 (supplier + price-matrix audit)** · **`settings.md` §4b/§5/§6 (password modes + Google link + role disable/soft-delete + Admin-only VAT/Company/Audit)**

## สรุปภาษาไทย
รวม **ข้อกำหนดที่ไม่ใช่ฟังก์ชัน (NFR)** ทั้งหมดของ ESSENCE Hub ไว้ที่เดียว และอัปเดตให้ครอบ scope ใหม่ (OEM Quotation / Own-Brand SO / Supply Planning / FG). ครอบ: **Performance** (หน้า <2s max 3s, 50 concurrent, >200 PO/วัน + GR>50/วัน + เพิ่ม QT/SO/Supply-Planning เข้า load profile), **Auth/Session** (local+Google, 24h + เตะออก 06:00 ทุกวัน ไม่มีกะดึก, RBAC generic RUCDAA+Admin bit — D14; **★ login เลือก basic vs Google · password mode "ต้องเปลี่ยนเมื่อเข้าครั้งแรก"/"ถาวร" · Google account link ราย user · VAT/Company/Audit = Admin bit เท่านั้น**), **Audit** (field-level, retention 1 ปี แล้ว manual purge; **ทุก stock movement — รวมเพิ่มวัตถุดิบใหม่/loss(−)/adjust(+) — มี reason+source + audit + trace (D15)**; **ทุก action ของ QT ก็ถูก audit เต็ม**; **★ ทุกการเปลี่ยน BOM/Supplier ก็ถูก audit เต็ม**; **★ ทุกการเปลี่ยน Settings (role disable/soft-delete/permission edits · user create/edit/password set-reset/role membership/Google link · VAT/company) ก็ถูก audit + trace**; **★ ช่อง `comment` ทุก object ธุรกรรมก็เป็น field ที่ถูก audit เต็ม**), **Backup/Infra** (GCP Cloud Run + Cloud SQL MySQL, backup รายวัน, storage abstraction GCS-ready), **Data/Format** (Asia/Bangkok, พ.ศ. display / UTC store, gapless numbering; **★ RM code + BOM/FG code = ผู้ใช้ตั้งเองตอนสร้าง + unique + ล็อก**, THB, VAT ตาม invoice date), **Scheduled Jobs J1–J8** (เพิ่ม **J8 = Supply Planning low-stock daily digest ~06:00**), **Notification outbox+read-bit** (รวม event ใหม่ **FG→Low**), **global search**, **responsive**, **soft-delete + reference-guard** (รวม **BOM = inactivate**, **★ Role = disable/soft-delete**), **reliability/integrity**. ทุกข้อ derive จากคำตอบที่ปอนด์ล็อกแล้ว — ไม่มีการเดา.

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
| A1 | Login | **local (basic: username + password) + Google Login** (ADR-007) · **★ หน้า login เสนอทางเลือก basic vs Google; Google ใช้ได้เฉพาะ user ที่ผูก Google account (provisioning ที่ settings.md)** (platform.md §2/§4) |
| A2 | Session | **หมดอายุ 24 ชม.** + **บังคับ login ใหม่ทุกวัน 06:00** (J1, session_epoch) · **ไม่มีกะกลางคืน** (ปอนด์เคาะ) · มี **warning ก่อนหมด/ก่อนเตะออก** |
| A3 | RBAC | **generic RUCDAA ต่อ module** (R/U/C/D/A/**Admin bit**) — D14 · ไม่ hardcode role · role ไม่จำกัด · Admin bit = force override/undelete · **★ effective permission = union ของ role ที่ Active เท่านั้น (role Disabled/Deleted ไม่ grant — settings.md §4b)** |
| A4 | Guard | เมนู/ปุ่ม/URL/API ทุกจุดตาม RUCDAA (platform.md US-PLT-05) · **★ user ที่ role ถูก Disabled/Deleted → ไม่มีสิทธิ์ใด ๆ (403 ทุกจุด)** |
| A5 | Scope ใหม่ | เพิ่ม module เข้า RBAC matrix: **Quotation / SO / Supply Planning** (settings.md §4) |
| **★ A6** | **Password provisioning** | **โหมดตั้งรหัส 2 แบบ (settings.md §5 US-SET-02):** (a) **must-change-on-first-login** → หลัง login local ครั้งแรก บังคับตั้งรหัสใหม่ก่อนใช้งาน (flow ที่ platform.md §4), (b) **permanent** · ตั้งรหัส **กรอก 2 ครั้ง (ยืนยัน) + toggle show/hide** · **edit-user ไม่แสดง/ไม่ส่งรหัสเดิม (write-only, ตั้งใหม่เท่านั้น)** |
| **★ A7** | **Google account link** | Admin ผูก user ↔ Google account (1:1, unique) ที่ settings.md → login เลือก Google ได้; ยกเลิกผูก → basic เท่านั้น |
| **★ A8** | **Admin-only sensitive areas** | **VAT settings · ข้อมูลบริษัท · Audit-log = เข้าถึงได้เฉพาะ Admin bit เท่านั้น** (เดิม VAT/Company=U, Audit=R → เปลี่ยนเป็น Admin only; settings.md §6, permission-matrix §3) |

## 3. Audit & Traceability (NFR ระดับระบบ)
| # | NFR | รายละเอียด (locked) |
|---|---|---|
| AU1 | Field-level audit | ทุก action ทุก module เก็บ เวลา/ผู้ทำ/entity/field/จาก→เป็น/เหตุผล (traceability.md) · **★ รวมทุก action ของ Quotation: create / edit→เวอร์ชันใหม่ / Convert-to-PO→ยืนยัน (Confirmed) / cancel (ทุกสถานะ, เหตุผลบังคับ)** (quotation.md §10) · **★ การส่งใบเสนอราคา = print/share ไม่เปลี่ยนสถานะ/ไม่มี sent-date (revert 2026-07-29)** · **★ รวมทุกการเปลี่ยน BOM (สร้าง / แก้สูตร-ต้นทุน-ราคาซื้อ / inactivate / reactivate) และ Supplier (สร้าง / แก้ / active↔inactive / แก้ price-matrix)** (bom.md §5c/§9, supplier.md §10) · **★ รวมทุกการเปลี่ยน Settings: role (create / edit permission-matrix / disable / enable / soft-delete / restore / remove-user-from-role) · user (create / edit / password set-reset / สลับ Active / เปลี่ยน role / Google link-unlink / ลบ+reassign) · VAT edit · company edit** — field-audit + trace (settings.md §9). **หมายเหตุ:** เหตุการณ์รหัสผ่านเก็บเป็น **event (ใคร/เมื่อ/action)** — **ไม่เก็บค่า plaintext ของรหัส** · **★ รวมการแก้ช่อง `comment` ของทุก object ธุรกรรม: แก้ทับ (overwrite) แต่เก็บประวัติครบ ใคร/เมื่อ/เดิม→ใหม่ + โผล่ trace — เหตุผลไม่บังคับ** (comment-convention.md CC3/CC6, traceability.md §4) |
| AU2 | Retention | **online 1 ปี** แล้ว **Super User manual purge/archive** — **ไม่มี auto-purge** (ADR-003) · **ประวัติ comment ลบไม่ได้** (อยู่ใน audit เดียวกัน — CC7) · **★ Audit-log viewer = Admin bit เท่านั้น (A8)** |
| AU3 | Stock ledger + movement audit | ทุก movement เป็น **append-only ledger + reason + source ref บังคับ** (D15) · **★ ทุก stock movement ถูก audit + โผล่บน trace:** **เพิ่มวัตถุดิบใหม่ (create RM master)** · **loss (−)** (RM: Lot optional/FIFO) · **adjust (+)** (RM/FG บังคับเลือก, warehouse-adjust) · GR (+) · FG-in (+) · surplus (+) · return (−) · reserve/consume — entity=RM/Lot หรือ FG/Batch, ใคร/เมื่อ/จำนวน/reason/source (`stock.md` §3b/§6, traceability.md §4). **RM code = user-defined unique + ★ create-only-lock (แก้ไม่ได้หลังสร้าง)** (validate ก่อนบันทึก) |
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
| D-F4 | สถานะ/UI | ป้ายสถานะ**ภาษาไทย**เสมอ · ไม่มี enum ดิบ · **dropdown search ได้ทุกจุด: RM ค้นชื่อ+รหัส, FG ค้นชื่อ+รหัส, Lot ค้น dropdown (stock.md §10) · BOM component RM ค้นชื่อ+รหัส (bom.md §3) · Supplier price-matrix RM ค้นชื่อ+รหัส (supplier.md §3) · customer dropdown (G4)** · **★ Settings: ค้นหา role, ค้นหา user (ชื่อ-สกุล/username) — settings.md §8** |
| D-F5 | เลขเอกสาร / รหัส master | `PO-{YYYYMM}-{NNNNNN}` · `QT-{YYYYMM}-{NNNNNN}` · `SO-{YYYYMM}-{NNNNNN}` · `INV-{YYYY}-{NNNNNN}` · `GR-{YYYYMMDD}-{NNN}` · `SHP-{YYYYMMDD}-{NNNN}` · `DN-{YYYYMMDD}-{NNNNN}` · Batch `B-{PO}-{line}-{run}` (auto จาก PO/line/run) · **★ RM code = ผู้ใช้ตั้งเองตอนสร้าง + unique + create-only-lock (free-form)** · **★ FG/BOM code = ผู้ใช้ตั้งเองตอนสร้าง (shared, 1:1 — D11 v2) + unique + create-only-lock** (เปลี่ยนจากถ้อยคำเดิม "auto") |

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
| **★ J8** Supply Planning low-stock daily digest | **ทุกวัน ~06:00 (จัดคู่ J1)** | ประเมิน FG **ที่ Active** ทุกตัว → ลิสต์ **FG ที่ Low (cover < Target) ทั้งหมด + Suggested production (ceil-to-batch)** → ยิง **1 แจ้งเตือนสรุป** ผ่าน outbox ให้ผู้มี Read Supply Planning; deep-link มา supply-planning | ✓ ผู้มี Read Supply Planning | ✓ (snapshot รายวัน; ประเมินใหม่จากสถานะปัจจุบัน — พลาดรอบ=ช้าไปวันเดียว) |

**Scheduler tracking:** ตาราง `scheduled_job_run` (job_name J1..J8 / scheduled_for / started_at / finished_at / status / affected_count / error_text) + lock กันรันซ้อน + **catch-up** ตอน service เริ่ม. Admin ดูที่ `GET /api/admin/scheduled-jobs`.

**Not a job (on-read / event / client):** BOM cost badge ล้าสมัย = on-read · Supply-Planning cover/suggested/badge (ตอนเปิดหน้า) = on-read · Shipment รอบปิด = event · Inactive→Active = event · ปิด PR ของเข้าครบ = event · dashboard/bell refresh 15s = client polling · gapless numbering = in-transaction · stock movement (add-RM/loss/adjust) = event + ledger write · BOM inactivate/reactivate = event + audit · **★ role disable/enable/soft-delete/restore, remove-user-from-role = event + audit (settings.md).**

### 6.1 ★ Supply Planning proactive alerting (DECIDED 2026-07-29 — แก้จาก on-read-only)
> **เดิม (parked):** "Supply-Planning เป็น on-read ไม่มี job/แจ้งเตือนเชิงรุก". **ปอนด์ตัดสินแล้ว → แจ้งเตือนเชิงรุกทั้ง real-time + daily digest** (ปิดคำถามที่เคยค้าง).
- **Trigger:** FG (Active) พลิกเข้า **Low (cover < Target)** — ทุกแจ้งเตือน **แนบ Suggested production** (ceil-to-batch) เสมอ. **FG Inactive ไม่เข้าข่าย** (bom.md §5c, supply-planning.md §4).
- **(a) Real-time:** stock/production event (ขาย/ส่ง/loss/จอง) ที่ทำให้ FG พลิก non-Low → Low → ยิงทันที (ยิงตอน transition, ไม่ยิงซ้ำระหว่างคง Low) ผ่าน outbox (J5).
- **(b) Daily digest:** **J8** ~06:00 — สรุป FG Low ทั้งหมด + Suggested (idempotent).
- **Delivery/Recipient:** notification outbox + per-user read-bit; ผู้รับ = **มีสิทธิ์ Read Supply Planning** (fan-out ตาม Read, **ไม่ hardcode role**). Deep-link → supply-planning / SO produce-to-stock (prefill).
- รายละเอียด business = `supply-planning.md` §5.1; event ในระบบ noti = `platform.md` §7/§9 (FG→Low).

## 7. Notification (NFR)
- **Transactional outbox + read-bit ราย user** (J5/ADR-005): ผู้รับ = ผู้มี **Read ของ module ปลายทาง** (fan-out) · deep link + ack/read ราย user + mark all read + "ดูทั้งหมด" (list 20/หน้า) + empty state + badge cap "9+" (platform.md).
- **Notification events รวม (ตัวอย่างหลัก):** cross-module status changes (PO Confirmed→Production, QC pass/fail, DN Delivered/Rejected/Postponed, PR auto, Overdue, Inactivity) **+ ★ FG→Low (Supply Planning, real-time + J8 digest, แนบ Suggested)** — event ใหม่ที่เพิ่มรอบนี้.
- ตัวเลข noti = source เดียวกับ Home task inbox + Dashboard badge ของ user เดียวกัน.
> **หมายเหตุ:** การแก้ `comment`, stock movement (loss/adjust/add-RM), BOM inactivate/edit, supplier price-matrix, **★ การเปลี่ยน Settings (role/user/password/Google-link/VAT/company)** = audit event (AU1/AU3) แต่ **ไม่ยิง notification** (เป็นการบันทึกภายใน; ยกเว้น movement ที่ทำให้ FG พลิกเข้า Low → ยิงตาม §6.1) เว้นแต่ปอนด์ระบุเพิ่ม.

## 8. Global Search (NFR)
- ค้นข้าม entity (PO/QT/SO/ลูกค้า/วัตถุดิบ-Lot/PR-GR/DN-Invoice) จาก header · **จำกัดตามสิทธิ์ Read** · **≥ 2 ตัวอักษร** · ผลจัดกลุ่ม + คลิก = deep link (platform.md US-PLT-04).

## 9. Responsive / Usability (NFR — first-class)
- **Responsive ทุกหน้า (Must)** — desktop/tablet/mobile · minimize clicks (PO ≤10, invoice ≤6), smart defaults, จบในหน้าเดียวถ้าได้, dropdown search ทุกจุด, ไม่มี enum ดิบ (brief §2.1/§5).

## 10. Soft-Delete + Reference-Guard (NFR baseline)
- **ไม่มี hard delete ทั้งระบบ** · master = soft-delete (flag, default filter ซ่อน แต่ search เจอ) · **BOM = inactivate (Active/Inactive) แทน delete — Inactive บล็อกเปิด QT/PO/SO ใหม่ + กันออกจาก Supply Planning** (deletion-policy §2.4) · **★ Role = Disable (พักชั่วคราว) / Soft-delete (Deleted, recoverable) — ทั้งสองแบบ member เสีย permission; ไม่ต้องย้าย user ก่อน (supersede)** (deletion-policy §2.14) · เอกสารการค้า = **void/cancel** (gapless) · **reference-guard** · audit + comment บังคับ · undelete/restore = Admin. รายละเอียด + entity ใหม่ = **`deletion-policy.md`**.

## 11. Reliability / Integrity
| # | NFR | รายละเอียด (locked) |
|---|---|---|
| R1 | Append-only ledger | stock ledger เป็นความจริง (on_hand/reserved เป็น cache) — recompute ได้เสมอ (ADR-001) |
| R2 | Nightly integrity | J6 เทียบ 2 cache (stock_balance + reserved_balance) กับแหล่งจริง |
| R3 | Negative-stock policy | on_hand/Available ติดลบได้ (เตือนไม่บล็อก); GR ชดเชย + FIFO retro-link — entity-status-map §1.6 |
| R4 | Reservation | ยืนยัน PO/SO = จอง; เริ่มผลิต/dispatch = ตัดจริง (Option A) — stock-reservation.md |
| R5 | Transactional outbox | noti event (รวม FG→Low) เขียนใน tx เดียวกับการเปลี่ยนสถานะ/ledger (กันหลุด) — J5/ADR-005 |

## 12. Open question (NFR)
**ไม่มี open question ค้าง.** คำถามเดิมเรื่อง Supply Planning proactive alert = **ปิดแล้ว (§6.1)**. NFR อื่นทั้งหมด derive จากค่าที่ล็อกแล้ว. (comment field audit + stock movement audit + BOM/Supplier change audit + **★ Settings change audit + password modes + Google link + Admin-only VAT/Company/Audit** = ใช้กลไก field-audit/RBAC เดิม — ไม่มี NFR ใหม่ที่ต้องถาม.)

## 13. Cross-links
- Auth/session/RBAC/**password-mode/Google-link/Admin-gating** → `settings.md`/`platform.md` · Audit → `traceability.md` · ledger reason/source + add-RM/loss/adjust → `stock.md` §3b/§6 · **BOM code/inactivate + audit → `bom.md` §5/§5c** · **supplier + price-matrix audit → `supplier.md` §10** · negative stock/retro → `goods-receipt.md`/entity-status-map §1.6 · reservation → `so.md`/`po.md`/stock-reservation · soft-delete/void/inactivate/**role disable-soft-delete** → `deletion-policy.md` · **Low alerting → `supply-planning.md` §5.1 + `platform.md` §7/§9** · **QT activity/audit → `quotation.md` §10 + `traceability.md` §4** · **comment field audit → `comment-convention.md` + `traceability.md` §4** · jobs → architecture scheduled-jobs (TL).

## 14. Module changelog
- **Consolidated + updated:** NFR ทั้งหมดจาก brief/ADR/scheduled-jobs/entity-status-map/stock-reservation/deletion-policy → NFR module เดียว, adapt สู่ scope OEM/Own-Brand/Supply-Planning/Quotation.
- **★ DECIDED (2026-07-29):** Supply Planning **proactive Low alerting** — real-time + **J8 daily digest ~06:00**. เพิ่ม J8 (§6) + event FG→Low (§7) + §6.1 + ปิด open question (§12).
- **★ เพิ่ม (2026-07-29 — Quotation module review):** AU1 ระบุ **ทุก action ของ Quotation ถูก audit + trace** (§3).
- **★ REVERTED (2026-07-29 — Pond):** ถอด **"send (Sent) + sent-date"** ออกจาก AU1 QT action list.
- **★ เพิ่ม (2026-07-29 — comment cross-cutting):** AU1/AU2 ระบุ **comment ของทุก object ธุรกรรมถูก field-audit เต็ม**.
- **★ เพิ่ม (2026-07-29 — Stock module 4 review):** AU3 stock movement + D-F5 RM code + D-F4 dropdown search.
- **★ CHANGED/เพิ่ม (2026-07-29 — BOM + Supplier module review):** D-F5 code user-entered+lock · AU1 BOM/Supplier changes · §10 BOM inactivate · D-F4/§6/§6.1/J8 FG Active only.
- **★ เพิ่ม/CHANGED (2026-07-29 — Settings module review, ปอนด์):**
  1. **A1:** login เสนอทางเลือก **basic vs Google** (Google = per-user link).
  2. **★ A6 (ใหม่):** password modes (**must-change-on-first-login / permanent**) + กรอก 2 ครั้ง + show/hide + edit-user write-only (ไม่โชว์รหัสเดิม).
  3. **★ A7 (ใหม่):** **Google account link** ราย user (1:1 unique) — provisioning ที่ settings.md.
  4. **★ A8 (ใหม่):** **VAT / Company / Audit-log = Admin bit เท่านั้น** (VAT/Company เดิม U→Admin; Audit เดิม R→Admin).
  5. **A3/A4:** effective permission = union ของ role **Active** เท่านั้น; role Disabled/Deleted → member ไม่มีสิทธิ์ (403).
  6. **AU1/AU2:** เพิ่ม **ทุกการเปลี่ยน Settings (role disable/soft-delete/permission edits · user create/edit/password set-reset/role membership/Google link · VAT/company) = field-audit + trace** (รหัสผ่านเก็บ event ไม่เก็บค่า); Audit viewer = Admin only.
  7. **§10:** เพิ่ม **Role = disable/soft-delete (ไม่ต้องย้าย user ก่อน — supersede)** เข้า soft-delete baseline (deletion-policy §2.14).
- **ไม่มีตัวเลขประดิษฐ์:** ค่าทั้งหมดอ้างแหล่ง locked.
