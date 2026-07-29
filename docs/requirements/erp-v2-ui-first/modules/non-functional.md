# Non-Functional Requirements (NFR) — ESSENCE Hub System

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE NFR SPEC** (consolidates + updates ทุก NFR ที่ล็อกแล้ว, adapt สู่ scope OEM/Own-Brand/Supply-Planning/Quotation)
ที่มา (locked, ไม่ประดิษฐ์ตัวเลข): `brief.md` §5/§8 · ADR-000..009 · `scheduled-jobs.html` (J1–J7) · architecture `index.html`/`db-schema.html` · `entity-status-map.md` §1.6 (negative stock) · `stock-reservation.md` (Option A) · `deletion-policy.md` · scope D1–D18 · README §2/§3 · **`supply-planning.md` §5.1 (Low alerting — J8) + §5c (save-back planning param audited)** · **`comment-convention.md` (comment field = audited)** · **`stock.md` §3b/§6 (add-RM + loss/adjust movements + Lot/FIFO)** · **`bom.md` §5/§5c (code user-entered-locked + BOM changes/inactivate)** · **`supplier.md` §10 (supplier + price-matrix audit)** · **`settings.md` §4b/§5/§6 (password modes + Google link + role disable/soft-delete + Admin-only VAT/Company/Audit)** · **`production.md` §5/§7 (accept/actual-qty/status-change/loss/lot-consume) + `po.md` §5.2 (PO edit audit)**

## สรุปภาษาไทย
รวม **ข้อกำหนดที่ไม่ใช่ฟังก์ชัน (NFR)** ทั้งหมดของ ESSENCE Hub ไว้ที่เดียว. ครอบ: **Performance** (หน้า <2s max 3s, 50 concurrent, >200 PO/วัน + GR>50/วัน + QT/SO/Supply-Planning), **Auth/Session** (local+Google, 24h + เตะออก 06:00, RBAC generic RUCDAA+Admin bit — D14; **★ login basic vs Google · password mode · Google link · VAT/Company/Audit = Admin bit**), **Audit** (field-level, retention 1 ปี แล้ว manual purge; **ทุก stock movement — รวมเพิ่มวัตถุดิบใหม่/loss(−)/adjust(+, อ้าง Lot/FIFO) — มี reason+source + audit + trace (D15)**; **★ ทุก production action (รับงาน/เปลี่ยนสถานะ/จำนวนผลิตจริง/loss/consume lot) + การแก้ PO (field-level, รวมจากการผลิต) ถูก audit เต็ม**; **★ "บันทึกกลับ BOM master" (save-back planning param จาก Supply Planning) ถูก audit; การ simulate/what-if ที่ไม่ persist = ไม่ audit**; **ทุก action ของ QT/BOM/Supplier/Settings ก็ถูก audit**; **★ ช่อง `comment` ทุก object ธุรกรรมก็เป็น field ที่ถูก audit**), **Backup/Infra** (GCP Cloud Run + Cloud SQL MySQL), **Data/Format** (Asia/Bangkok, พ.ศ./UTC, gapless; **★ RM/BOM/FG code = user-entered + unique + lock**, THB, VAT ตาม invoice date), **Scheduled Jobs J1–J8** (J8 = Supply Planning low-stock digest), **Notification outbox+read-bit** (FG→Low), **global search**, **responsive**, **soft-delete + reference-guard** (BOM inactivate, **Role disable/soft-delete**), **reliability/integrity**. ทุกข้อ derive จากค่าที่ล็อก — ไม่มีการเดา.

---

## 1. Performance & Capacity
| # | NFR | ค่า (locked) | หมายเหตุ scope ใหม่ |
|---|---|---|---|
| P1 | เวลาตอบสนองต่อหน้า | **< 2s (hard cap 3s)** | ครอบทุกหน้ารวม quotation/so/supply-planning/production queue/dashboard drill |
| P2 | ผู้ใช้พร้อมกัน | **50 concurrent users** | brief §5.1 |
| P3 | ปริมาณงานต่อวัน | **> 200 PO/วัน · GR > 50/วัน** | **เพิ่ม load profile:** QT, SO, Supply-Planning recompute + Low-alert events |
| P4 | Dashboard aggregate | < 2s (hard 3s) | 7 แผนก/29 tile + drill |
| P5 | Client polling | dashboard 15s · noti bell 15s | ฝั่งเบราว์เซอร์ |

> ใช้เพดานเดิม (P1/P2/P3) เป็น baseline; capacity planning = DevOps (Stage 4).

## 2. Auth / Session / Access Control
| # | NFR | รายละเอียด (locked) |
|---|---|---|
| A1 | Login | **local (basic) + Google Login** (ADR-007) · **★ หน้า login เสนอทางเลือก basic vs Google** (platform.md §2/§4) |
| A2 | Session | **หมดอายุ 24 ชม.** + **บังคับ login ใหม่ทุกวัน 06:00** (J1) · **ไม่มีกะกลางคืน** · warning ก่อนหมด |
| A3 | RBAC | **generic RUCDAA ต่อ module** (R/U/C/D/A/**Admin bit**) — D14 · **★ effective permission = union ของ role ที่ Active เท่านั้น** |
| A4 | Guard | เมนู/ปุ่ม/URL/API ทุกจุด · **★ user ที่ role ถูก Disabled/Deleted → 403 ทุกจุด** |
| A5 | Scope ใหม่ | เพิ่ม module: **Quotation / SO / Supply Planning** |
| **★ A6** | **Password provisioning** | **โหมด 2 แบบ:** must-change-on-first-login / permanent · กรอก 2 ครั้ง + toggle show/hide · edit-user write-only |
| **★ A7** | **Google account link** | Admin ผูก user ↔ Google (1:1) · ยกเลิกผูก → basic |
| **★ A8** | **Admin-only sensitive areas** | **VAT · ข้อมูลบริษัท · Audit-log = Admin bit เท่านั้น** |

## 3. Audit & Traceability (NFR ระดับระบบ)
| # | NFR | รายละเอียด (locked) |
|---|---|---|
| AU1 | Field-level audit | ทุก action ทุก module เก็บ เวลา/ผู้ทำ/entity/field/จาก→เป็น/เหตุผล (traceability.md) · **★ Quotation:** create / edit→version / Convert-to-PO→Confirmed / cancel (การส่ง = print/share ไม่มี sent-date) · **★ BOM/Supplier:** create/edit/ราคา/inactivate/reactivate · price-matrix · **★ BOM planning-param save-back (Supply Planning):** การกด **"บันทึกกลับ BOM master"** (persist Sales Rate/Lead/Safety/Target/Batch กลับ 1-BOM=1-FG master) = field-level audit (old→new, ใคร/เมื่อ) — **การแก้ param เพื่อ "จำลอง (simulate/what-if)" ใน modal ที่ไม่กด save (ไม่ persist) = ไม่ audit** (scratch, ทิ้งเมื่อปิด) — supply-planning.md §5c · **★ Settings:** role (create/edit-perm/disable/enable/soft-delete/restore/remove-user) · user (create/edit/password set-reset/สลับ Active/เปลี่ยน role/Google link/ลบ+reassign) · VAT/company (รหัสผ่านเก็บ event ไม่เก็บค่า) · **★ Production (2026-07-29):** **รับงาน (accept→gen PRD) / เริ่มผลิต (gen Batch + consume lot FIFO) / ส่ง QC / กด "พร้อมส่ง" (surplus→FG) / Hold / rework / field `actual_produced_qty` (จำนวนผลิตจริง old→new) / loss (production)** · **★ PO edit (2026-07-29):** การแก้ PO ทุกครั้ง **รวมจากบริบทการผลิต (under-production)** = field-level old→new ทุกฟิลด์ + raise ⚑ follow-up ที่ลูกค้า (po.md §5.2, customer.md §4.1) · **★ comment ทุก object ธุรกรรม:** แก้ทับแต่เก็บประวัติครบ ใคร/เมื่อ/เดิม→ใหม่ + trace (comment-convention.md CC3/CC6) |
| AU2 | Retention | **online 1 ปี** แล้ว **Super User manual purge/archive** — ไม่มี auto-purge · ประวัติ comment ลบไม่ได้ · **★ Audit-log viewer = Admin bit (A8)** |
| AU3 | Stock ledger + movement audit | ทุก movement = **append-only ledger + reason + source ref บังคับ** (D15) · **★ audit + trace ทุก movement:** **เพิ่มวัตถุดิบใหม่** · **loss (−)** (RM: อ้าง Lot — เลือก lot/"FIFO") · **adjust (+)** (RM: **★ อ้าง Lot — เลือก lot/"FIFO"** · FG ราย Batch) · GR (+) · FG-in (+) · surplus (+) · return (−) · **CONSUME (−)** (เลือก lot มี stock; หลาย lot = FIFO — production.md §5d) — entity=RM/Lot หรือ FG/Batch, ใคร/เมื่อ/จำนวน/reason/source/Lot ref (`stock.md` §3b/§6). **RM/BOM/FG code = user-defined unique + ★ create-only-lock** |
| AU4 | GMP chain | Lot→Batch→line→PO(หรือ SO)→ลูกค้า→DN/INV · QT = head-of-chain สาย OEM, FG per-Batch · **★ Supply Planning "สั่งผลิต" = SO produce-to-stock → PRD/Batch → FG-in (traceable, พก batch count — supply-planning.md §5b)** |
| AU5 | Archive | text file · Super User เท่านั้น · ยืนยันก่อน export |

## 4. Backup / Infrastructure
| # | NFR | รายละเอียด (locked) |
|---|---|---|
| I1 | Runtime | **GCP Cloud Run** (Phase 3) · Phase 2 = local PC |
| I2 | Database | **Cloud SQL (MySQL)** (ADR-000) |
| I3 | Backup | **รายวัน** — Phase 2 cron dump · Phase 3 Cloud SQL backup (J7) |
| I4 | Storage abstraction | ไฟล์แนบผ่าน **storage abstraction (GCS-ready)** (ADR-006) |

## 5. Data / Format / Localization
| # | NFR | รายละเอียด (locked) |
|---|---|---|
| D-F1 | Timezone | **Asia/Bangkok** · แสดง **พ.ศ.** / เก็บ **UTC** |
| D-F2 | Gapless numbering | **ต่อปี/เดือน** — PO/**QT-**/**SO-**/PR/GR/PRD/Batch/DN/INV/SHP (ADR-008) · void ไม่ทำให้เลขหาย |
| D-F3 | Currency/VAT | **THB** · VAT ตาม **invoice date** · ตัวหนังสือไทย · **★ margin simulation ใน Supply Planning = คำนวณจาก cost/ราคาขาย ก่อน VAT (VAT เป็นเรื่องตอน invoice; margin sim เป็น decision-support ไม่ใช่เอกสารภาษี — supply-planning.md §5b)** |
| D-F4 | สถานะ/UI | ป้ายสถานะ**ภาษาไทย**เสมอ · **dropdown search: RM/FG ค้นชื่อ+รหัส, Lot ค้น dropdown (Loss+Adjust+option "FIFO") · BOM component RM ค้นชื่อ+รหัส · Supplier price-matrix RM · customer dropdown (G4) · ★ Supply Planning ค้น FG ชื่อ/รหัส/วัตถุดิบ (RM reverse lookup)** · **★ Settings: ค้นหา role/user** · **★ Production queue: ค้น PO/SO/PRD/ลูกค้า/ผู้ติดต่อ/ช่วงวันที่สร้าง/ช่วงวันที่ต้องการรับของ (production.md §6)** |
| D-F5 | เลขเอกสาร / รหัส master | `PO-…` · `QT-…` · `SO-…` · `INV-…` · `GR-…` · `SHP-…` · `DN-…` · Batch `B-{PO}-{line}-{run}` · **★ RM code = user-entered + unique + create-only-lock** · **★ FG/BOM code = user-entered (shared, 1:1) + unique + create-only-lock** |

## 6. Scheduled / Background Jobs (J1–J8) — locked + scope update
| Job | ความถี่ | ทำอะไร | แจ้งเตือน | idempotent |
|---|---|---|---|---|
| **J1** Session reset | ทุกวัน 06:00 | เลื่อน session_epoch | — | ✓ |
| **J2** Customer inactivity sweep | ทุกวัน | Active→Inactive (default 3 ด.) | ✓ Sale | ✓ |
| **J3** Invoice overdue sweep | ทุกวัน | ส่งแล้ว+เลยเครดิต+ยังไม่จ่าย → Overdue | ✓ Finance+Sale | ✓ |
| **J4** Potential-delay | ทุกวัน/ชั่วโมง | PRD ใกล้ไม่ทันส่ง → badge | ✓ Sale+Stock | ✓ |
| **J5** Notification outbox dispatcher | ต่อเนื่อง ~1s | ส่ง event ใน outbox | ✓ | ✓ |
| **J6** Stock ledger integrity | ทุกคืน | เทียบ balance vs Σmovement | — (เตือน Admin) | ✓ |
| **J7** Database backup | ทุกวัน | Phase2 dump / Phase3 backup | — | ✓ |
| **★ J8** Supply Planning low-stock digest | **ทุกวัน ~06:00** | FG (Active) Low ทั้งหมด + Suggested → 1 แจ้งเตือนสรุป | ✓ Read Supply Planning | ✓ |

**Not a job (on-read / event / client):** BOM cost badge · Supply-Planning cover/suggested/**margin simulation (client recompute)** · Shipment รอบปิด · Inactive→Active · ปิด PR · dashboard/bell 15s · gapless numbering · stock movement (add-RM/loss/adjust/consume) = event + ledger write · BOM inactivate · **★ BOM planning-param save-back (บันทึกกลับ BOM master) = event + audit; simulate/what-if = client scratch, ไม่ persist/ไม่ audit** · **★ production action (รับงาน/เริ่มผลิต/พร้อมส่ง/loss) + PO edit = event + audit** · role disable/enable/soft-delete/restore = event + audit.

### 6.1 ★ Supply Planning proactive alerting (DECIDED 2026-07-29)
- **Trigger:** FG (Active) พลิกเข้า **Low** — แนบ Suggested. **FG Inactive ไม่เข้าข่าย**.
- **(a) Real-time:** event ที่ทำให้ FG พลิก non-Low→Low → ยิงทันที (outbox J5).
- **(b) Daily digest:** **J8** ~06:00.
- **Recipient:** มีสิทธิ์ Read Supply Planning (fan-out, ไม่ hardcode role). Deep-link → supply-planning / SO produce-to-stock.

## 7. Notification (NFR)
- **Transactional outbox + read-bit ราย user** (J5/ADR-005): ผู้รับ = Read ของ module ปลายทาง · deep link + ack/read + mark all + "ดูทั้งหมด" (20/หน้า) + badge "9+".
- **Events รวม:** PO Confirmed→Production, QC pass/fail, DN Delivered/Rejected/Postponed, PR auto, Overdue, Inactivity **+ ★ FG→Low (real-time + J8)**.
> **หมายเหตุ:** การแก้ `comment`, stock movement (loss/adjust/add-RM/consume), **★ production action (รับงาน/พร้อมส่ง/loss/actual-qty) + PO edit**, BOM/supplier changes (รวม **"บันทึกกลับ BOM master"** จาก Supply Planning), Settings changes = audit event **แต่ไม่ยิง notification** (ยกเว้น movement ที่ทำให้ FG พลิก Low, และ **PO edit → raise ⚑ follow-up ที่ลูกค้า** ซึ่งเป็น flag ไม่ใช่ notification) เว้นแต่ปอนด์ระบุเพิ่ม.

## 8. Global Search (NFR)
- ค้นข้าม entity จาก header · จำกัดตามสิทธิ์ Read · ≥ 2 ตัวอักษร · deep link.

## 9. Responsive / Usability (NFR — first-class)
- **Responsive ทุกหน้า (Must)** · minimize clicks · smart defaults · dropdown search ทุกจุด · ไม่มี enum ดิบ · **★ ทุกการเปลี่ยนสถานะในสายผลิต = confirm popup (production.md §7.7)**.

## 10. Soft-Delete + Reference-Guard (NFR baseline)
- **ไม่มี hard delete** · master = soft-delete · **BOM = inactivate** · **★ Role = Disable / Soft-delete (member เสีย permission; ไม่ต้องย้าย user ก่อน)** · เอกสารการค้า = void/cancel (gapless) · reference-guard · audit + comment บังคับ · undelete = Admin.

## 11. Reliability / Integrity
| # | NFR | รายละเอียด (locked) |
|---|---|---|
| R1 | Append-only ledger | stock ledger เป็นความจริง — recompute ได้ (ADR-001) |
| R2 | Nightly integrity | J6 เทียบ 2 cache |
| R3 | Negative-stock policy | on_hand/Available ติดลบได้; GR ชดเชย + FIFO retro-link |
| R4 | Reservation | ยืนยัน = จอง; เริ่มผลิต/dispatch = ตัดจริง (เลือก lot มี stock; หลาย lot = FIFO, Option A) |
| R5 | Transactional outbox | noti event (รวม FG→Low) เขียนใน tx เดียวกับ ledger |

## 12. Open question (NFR)
**ไม่มี open question ค้าง.** (production action audit + PO edit audit + adjust Lot/FIFO + confirm popup + **BOM save-back planning param audit (simulate ไม่ audit) + Supply Planning margin sim ก่อน VAT** = ใช้กลไก field-audit/RBAC/UX เดิม — ไม่มี NFR ใหม่ที่ต้องถาม.)

## 13. Cross-links
- Auth/session/RBAC → `settings.md`/`platform.md` · Audit → `traceability.md` · ledger + add-RM/loss/adjust(Lot-FIFO)/consume → `stock.md` §3b/§6 · **★ production action/actual-qty/loss + PO edit audit → `production.md` §5/§7 + `po.md` §5.2** · BOM → `bom.md` · supplier → `supplier.md` · negative stock → entity-status-map §1.6 · reservation → stock-reservation · soft-delete/role → `deletion-policy.md` · **Low alerting + save-back planning param audit + margin sim → `supply-planning.md` §5.1/§5c/§5b** · QT audit → `quotation.md` §10 · comment → `comment-convention.md`.

## 14. Module changelog
- **Consolidated + updated:** NFR ทั้งหมด → NFR module เดียว.
- **★ DECIDED (2026-07-29):** Supply Planning proactive Low alerting + J8.
- **★ เพิ่ม (2026-07-29 — Quotation review):** QT action audit · **REVERTED:** ถอด Sent/sent-date.
- **★ เพิ่ม (2026-07-29 — comment cross-cutting):** comment audited.
- **★ เพิ่ม (2026-07-29 — Stock review):** stock movement + RM code + dropdown.
- **★ CHANGED (2026-07-29 — BOM + Supplier review):** code lock · BOM/Supplier audit.
- **★ เพิ่ม/CHANGED (2026-07-29 — Settings review):** A1/A6/A7/A8 · A3/A4 · AU1/AU2 Settings audit · §10 Role disable/soft-delete.
- **★ เพิ่ม (2026-07-29 — Production module review, ปอนด์):**
  1. **AU1:** เพิ่ม **ทุก production action (รับงาน/เริ่มผลิต/ส่ง QC/พร้อมส่ง/Hold/rework/`actual_produced_qty`/loss/consume lot FIFO) + PO edit (field-level, รวมจากการผลิต) → field-audit** (ref production.md §5/§7, po.md §5.2).
  2. **AU3:** **adjust (+) RM อ้าง Lot/FIFO** (เดิม RM-only) · CONSUME ระบุ "เลือก lot มี stock; หลาย lot = FIFO".
  3. **D-F4:** production queue search fields · **§9:** confirm popup ทุก status change.
- **★ เพิ่ม (2026-07-29 — Supply Planning module review, ปอนด์):**
  1. **AU1:** ระบุชัด **"บันทึกกลับ BOM master" (save-back planning param จาก Supply Planning) = field-level audit** (old→new) · **การ simulate/what-if ที่ไม่ persist = ไม่ audit** — ref supply-planning.md §5c · §6 "Not a job" list sync.
  2. **AU4:** "สั่งผลิต from Supply Planning" traceable (SO produce-to-stock → PRD/Batch → FG-in, พก batch count).
  3. **D-F3:** margin simulation ก่อน VAT (decision-support, ไม่ใช่เอกสารภาษี) · **D-F4:** Supply Planning FG search ชื่อ/รหัส/RM reverse lookup.
- **ไม่มีตัวเลขประดิษฐ์.**
