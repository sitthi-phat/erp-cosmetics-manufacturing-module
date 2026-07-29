# Non-Functional Requirements (NFR) — ESSENCE Hub System

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE NFR SPEC** (consolidates + updates ทุก NFR ที่ล็อกแล้ว, adapt สู่ scope OEM/Own-Brand/Supply-Planning/Quotation)
ที่มา (locked, ไม่ประดิษฐ์ตัวเลข): `brief.md` §5/§8 · ADR-000..009 · `scheduled-jobs.html` (J1–J7) · architecture `index.html`/`db-schema.html` · `entity-status-map.md` §1.6/**§1.8 (negative stock · GR QC-gated stock-in)** · `stock-reservation.md` (Option A) · `deletion-policy.md` · scope D1–D18 · README §2/§3 · **`supply-planning.md` §5.1/§5c** · **`comment-convention.md`** · **`numbering-on-save.md` (G8 — เลขออกตอนบันทึก)** · **`stock.md` §2b/§3b/§6 (GR (RM) tab + add-RM + loss/adjust + Lot/FIFO)** · **`bom.md` §5/§5c** · **`supplier.md` §10** · **`settings.md` §4b/§5/§6** · **`production.md` §5/§7 + `po.md` §5.2** · **`goods-receipt.md` §4/§9 + `qc.md` §4.1 (GR object lifecycle · credit on QC pass)**

## สรุปภาษาไทย
รวม **ข้อกำหนดที่ไม่ใช่ฟังก์ชัน (NFR)** ทั้งหมดของ ESSENCE Hub ไว้ที่เดียว. ครอบ: **Performance** (หน้า <2s max 3s, 50 concurrent, >200 PO/วัน + GR>50/วัน + QT/SO/Supply-Planning), **Auth/Session** (local+Google, 24h + เตะออก 06:00, RBAC generic RUCDAA+Admin bit — D14), **Audit** (field-level, retention 1 ปี; **ทุก stock movement — รวมเพิ่มวัตถุดิบใหม่/loss(−)/adjust(+, อ้าง Lot/FIFO)/`GR (+)` — มี reason+source + audit + trace (D15)**; **★★ r10 GR object lifecycle (QC ตรวจสอบ/ผ่าน/ไม่ผ่าน/ยกเลิก + ส่งกลับ QC/ยกเลิก) ถูก audit; ★ `GR (+)` credit + FIFO retro-link เกิดตอน QC ตรวจรับ "ผ่าน" (audit ที่จุดนั้น); QC ไม่ผ่าน = ไม่มี credit**; **★ ทุก production action + การแก้ PO ถูก audit**; **★ save-back planning param ถูก audit; simulate ไม่ audit**; **★ ช่อง `comment` ทุก object ถูก audit**), **Backup/Infra** (GCP Cloud Run + Cloud SQL MySQL), **Data/Format** (Asia/Bangkok, พ.ศ./UTC, **gapless + ★ เลขออกตอนบันทึกสำเร็จ (number-on-save G8)**; RM/BOM/FG code = user-entered + unique + lock, THB, VAT ตาม invoice date), **Scheduled Jobs J1–J8**, **Notification outbox+read-bit** (FG→Low), **global search**, **responsive**, **soft-delete + reference-guard**, **reliability/integrity** (★ negative stock ชดเชย + FIFO retro-link ตอน GR **QC ผ่าน**). ทุกข้อ derive จากค่าที่ล็อก — ไม่มีการเดา.

---

## 1. Performance & Capacity
| # | NFR | ค่า (locked) | หมายเหตุ scope ใหม่ |
|---|---|---|---|
| P1 | เวลาตอบสนองต่อหน้า | **< 2s (hard cap 3s)** | ครอบทุกหน้ารวม quotation/so/supply-planning/production queue/dashboard drill/**qc (ตรวจรับ+ตรวจแบตช์)/stock GR tab** |
| P2 | ผู้ใช้พร้อมกัน | **50 concurrent users** | brief §5.1 · **★ number-on-save (G8) ต้อง atomic ต่อชนิด+ปี/เดือน กันเลขชนภายใต้ concurrency** |
| P3 | ปริมาณงานต่อวัน | **> 200 PO/วัน · GR > 50/วัน** | **★ r10: GR>50/วัน แต่ละใบผ่าน QC-gate ก่อน credit → เพิ่ม QC decision events + GR list/GR (RM) tab load** |
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
| AU1 | Field-level audit | ทุก action ทุก module เก็บ เวลา/ผู้ทำ/entity/field/จาก→เป็น/เหตุผล (traceability.md) · **★ Quotation:** create / edit→version / Convert-to-PO→Confirmed / cancel · **★ BOM/Supplier:** create/edit/ราคา/inactivate/reactivate · price-matrix · **★ BOM planning-param save-back (Supply Planning)** = field-level audit — **simulate/what-if ที่ไม่ save = ไม่ audit** — supply-planning.md §5c · **★ Settings:** role/user/VAT/company · **★ Production (2026-07-29):** รับงาน / เริ่มผลิต (consume lot FIFO) / ส่ง QC / พร้อมส่ง (surplus→FG) / Hold / rework / `actual_produced_qty` / loss · **★ PO edit (2026-07-29):** field-level old→new + raise ⚑ follow-up · **★ number-on-save (G8, 2026-07-29):** การออกเลขเอกสารครั้งแรก (QT/SO/PO/PR/GR+Lot/SHP+DN/INV/PRD; Batch derived) = **entity-create event บันทึก ใคร/เมื่อ/เลขที่ออก** (`numbering-on-save.md` §3) · **★★ r10 GR/QC (2026-07-29):** **GR object lifecycle** (บันทึกรับ→gen Lot รอตรวจ ยังไม่ credit / **QC ตรวจรับ "ผ่าน" → `GR (+)` credit + FIFO retro-link + Lot พร้อมใช้ + GR=ผ่าน** / QC "ไม่ผ่าน" → Lot ระงับ + GR=ไม่ผ่าน / **ส่งกลับ QC (re-submit)** / **ยกเลิก GR**) + **Batch QC ผ่าน/ไม่ผ่าน + feedback "QC ไม่ผ่าน"→Rework** = audit ครบ (goods-receipt.md §4/§9, qc.md §4.1/§4.2) · **★ comment ทุก object ธุรกรรม:** แก้ทับแต่เก็บประวัติครบ + trace (comment-convention.md CC3/CC6) |
| AU2 | Retention | **online 1 ปี** แล้ว **Super User manual purge/archive** — ไม่มี auto-purge · ประวัติ comment ลบไม่ได้ · **★ Audit-log viewer = Admin bit (A8)** |
| AU3 | Stock ledger + movement audit | ทุก movement = **append-only ledger + reason + source ref บังคับ** (D15) · **★ audit + trace ทุก movement:** **เพิ่มวัตถุดิบใหม่** · **loss (−)** (RM: อ้าง Lot — เลือก lot/"FIFO") · **adjust (+)** (RM: **★ อ้าง Lot — เลือก lot/"FIFO"** · FG ราย Batch) · **`GR (+)` (★★ r10: เกิดตอน QC ตรวจรับ "ผ่าน" เท่านั้น — ชดเชยติดลบ + FIFO retro-link ที่จุดนี้; QC ไม่ผ่าน = ไม่มี movement)** · FG-in (+) · surplus (+) · **return (−) (★ source ผูก Lot + RM + Supplier + RT — เลือก RM ในล็อต, 1 lot หลาย RM, `return.md`)** · **CONSUME (−)** (เลือก lot มี stock; หลาย lot = FIFO — production.md §5d) — entity=RM/Lot หรือ FG/Batch, ใคร/เมื่อ/จำนวน/reason/source/Lot ref (`stock.md` §2b/§3b/§6). **RM/BOM/FG code = user-defined unique + ★ create-only-lock** |
| AU4 | GMP chain | Lot→Batch→line→PO(หรือ SO)→ลูกค้า→DN/INV · QT = head-of-chain สาย OEM, FG per-Batch · **★★ r10: Lot ผูก GR object ต้นทาง; Lot เข้าสาย genealogy จริงเมื่อ QC ตรวจรับ "ผ่าน" (credit)** · **★ Supply Planning "สั่งผลิต" = SO produce-to-stock → PRD/Batch → FG-in** |
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
| D-F2 | Gapless numbering **+ ★ number-on-save (G8)** | **ต่อปี/เดือน** — PO/**QT-**/**SO-**/PR/GR/PRD/Batch/DN/INV/SHP (ADR-008) · void/**ยกเลิก GR** ไม่ทำให้เลขหาย · **★ เลขออก "ตอนบันทึกสำเร็จ" ไม่โชว์ล่วงหน้าบนหน้า create (แสดง "(ระบบออกให้เมื่อบันทึก)")** — ร่างที่ไม่บันทึก **ไม่กินเลข** (ป้องกัน gap) · บันทึก → ออกเลข atomic + **popup ยืนยัน "เลข + summary (+ ลิงก์ดู/พิมพ์)"** · **หลายเลขต่อการบันทึก (GR+Lot · SHP+DN) → popup แสดงครบ (NS7)** · แก้/เวอร์ชันใหม่/void = เลขเดิม · **PRD/Batch = ออกเลขตอน action (รับงาน/เริ่มผลิต) → แสดงเลขใน confirm popup (NS1 N/A; Batch เลข derived ไม่ gapless-per-เดือน)** · **PR auto จาก PO/SO = ออกเลขเอง ไม่มี popup** · **QC record + master code = นอกขอบเขต G8**. รายละเอียด `numbering-on-save.md` |
| D-F3 | Currency/VAT | **THB** · VAT ตาม **invoice date** · ตัวหนังสือไทย · **★ margin simulation ใน Supply Planning = ก่อน VAT (decision-support ไม่ใช่เอกสารภาษี)** |
| D-F4 | สถานะ/UI | ป้ายสถานะ**ภาษาไทย**เสมอ · **dropdown search: RM/FG ค้นชื่อ+รหัส, Lot ค้น dropdown (Loss+Adjust+option "FIFO") · BOM component RM · Supplier price-matrix RM · customer dropdown (G4) · Supply Planning ค้น FG ชื่อ/รหัส/วัตถุดิบ · ★ Return ค้น RM ในล็อต (ชื่อ+รหัส, G7)** · Settings ค้น role/user · Production queue search · **★ r10: stock "Good Receipt (RM)" tab ค้น GR/Lot/Supplier/ชื่อ RM/รหัส + ช่วงวันที่รับ + filter สถานะ (ผ่าน/ไม่ผ่าน/QC ตรวจสอบ/ยกเลิก) · qc ตรวจรับ/ตรวจแบตช์ (sub-tab OEM/Own-Brand)** |
| D-F5 | เลขเอกสาร / รหัส master | `PO-…` · `QT-…` · `SO-…` · `INV-…` · `GR-…` · `SHP-…` · `DN-…` · Batch `B-{PO}-{line}-{run}` · **★ ทั้งหมดออกตอนบันทึก (G8/D-F2)** · **★ RM code = user-entered + unique + create-only-lock** · **★ FG/BOM code = user-entered (shared, 1:1) + unique + create-only-lock** |

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

**Not a job (on-read / event / client):** BOM cost badge · Supply-Planning cover/suggested/margin simulation (client) · Shipment รอบปิด · Inactive→Active · ปิด PR · dashboard/bell 15s · **gapless numbering = event ตอนบันทึกสำเร็จ (number-on-save G8, atomic ในทรานแซกชันเดียวกับการบันทึก — ไม่ใช่ job)** · stock movement (add-RM/loss/adjust/consume) = event + ledger write · **★★ r10: `GR (+)` credit = event ตอน QC ตรวจรับ "ผ่าน" (ไม่ใช่ job, ไม่ใช่ตอนบันทึก GR); GR ส่งกลับ QC/ยกเลิก = event + audit** · BOM inactivate · BOM planning-param save-back = event + audit (simulate = client scratch) · production action + PO edit = event + audit · role disable/enable/soft-delete/restore = event + audit.

### 6.1 ★ Supply Planning proactive alerting (DECIDED 2026-07-29)
- **Trigger:** FG (Active) พลิกเข้า **Low** — แนบ Suggested. **FG Inactive ไม่เข้าข่าย**.
- **(a) Real-time:** event ที่ทำให้ FG พลิก non-Low→Low → ยิงทันที (outbox J5).
- **(b) Daily digest:** **J8** ~06:00.
- **Recipient:** มีสิทธิ์ Read Supply Planning (fan-out). Deep-link → supply-planning / SO produce-to-stock.

## 7. Notification (NFR)
- **Transactional outbox + read-bit ราย user** (J5/ADR-005): ผู้รับ = Read ของ module ปลายทาง · deep link + ack/read + mark all + "ดูทั้งหมด" (20/หน้า) + badge "9+".
- **Events รวม:** PO Confirmed→Production, **★ r10 QC ตรวจรับ Lot ผ่าน/ไม่ผ่าน (→Stock)**, QC pass/fail (Batch), DN Delivered/Rejected/Postponed, PR auto, Overdue, Inactivity **+ ★ FG→Low (real-time + J8)**.
> **หมายเหตุ:** การแก้ `comment`, stock movement (loss/adjust/add-RM/consume/return), **★ GR ส่งกลับ QC/ยกเลิก**, production action + PO edit, BOM/supplier changes (รวม save-back), Settings changes, **★ การออกเลขเอกสาร (G8)** = audit event **แต่ไม่ยิง notification** (ยกเว้น movement ที่ทำให้ FG พลิก Low, QC ตรวจรับ Lot ผ่าน/ไม่ผ่าน ที่แจ้ง Stock, และ PO edit → raise ⚑ follow-up) เว้นแต่ปอนด์ระบุเพิ่ม.

## 8. Global Search (NFR)
- ค้นข้าม entity จาก header · จำกัดตามสิทธิ์ Read · ≥ 2 ตัวอักษร · deep link.

## 9. Responsive / Usability (NFR — first-class)
- **Responsive ทุกหน้า (Must)** · minimize clicks · smart defaults · dropdown search ทุกจุด · ไม่มี enum ดิบ · **★ ทุกการเปลี่ยนสถานะในสายผลิต = confirm popup (production.md §7.7)** · **★ number-on-save = confirm popup แสดงเลข + summary หลังบันทึก (G8/NS3)** · **★ r10: ยกเลิก GR = confirm + เหตุผลบังคับ**.

## 10. Soft-Delete + Reference-Guard (NFR baseline)
- **ไม่มี hard delete** · master = soft-delete · **BOM = inactivate** · **★ Role = Disable / Soft-delete** · เอกสารการค้า = void/cancel (**gapless — เลขที่ออกแล้วคงอยู่ ไม่นำกลับมาใช้ซ้ำ, G8/NS5**; **★ r10: ยกเลิก GR = void แบบ gapless, เฉพาะก่อน credit**) · reference-guard · audit + comment บังคับ · undelete = Admin.

## 11. Reliability / Integrity
| # | NFR | รายละเอียด (locked) |
|---|---|---|
| R1 | Append-only ledger | stock ledger เป็นความจริง — recompute ได้ (ADR-001) |
| R2 | Nightly integrity | J6 เทียบ 2 cache |
| R3 | Negative-stock policy | on_hand/Available ติดลบได้; **★★ r10: GR ชดเชย + FIFO retro-link เกิดตอน QC ตรวจรับ "ผ่าน"** (QC ไม่ผ่าน = ไม่ชดเชย, ติดลบคงอยู่จนกว่า GR/Lot ที่ผ่านมาชดเชย) |
| R4 | Reservation | ยืนยัน = จอง; เริ่มผลิต/dispatch = ตัดจริง (เลือก lot มี stock; หลาย lot = FIFO, Option A) |
| R5 | Transactional outbox | noti event (รวม FG→Low, **★ r10 QC ตรวจรับ Lot ผ่าน→`GR (+)`**) เขียนใน tx เดียวกับ ledger · **★ number-on-save (G8) ออกเลข atomic ใน tx เดียวกับการบันทึกเอกสาร** |

## 12. Open question (NFR)
**ไม่มี open question ค้าง.** (★ number-on-save G8 = ใช้กลไก gapless/field-audit/confirm-popup เดิม — ไม่มี NFR ใหม่ที่ต้องถาม; atomicity/concurrency = implementation Tech-Lead. ★★ r10 GR QC-gated stock-in + GR object lifecycle audit + credit on QC pass = ใช้กลไก field-audit/ledger/RBAC/outbox เดิม. production/PO edit/adjust Lot-FIFO/confirm popup/BOM save-back/margin sim = คงเดิม.)

## 13. Cross-links
- Auth/session/RBAC → `settings.md`/`platform.md` · Audit → `traceability.md` · ledger + add-RM/loss/adjust(Lot-FIFO)/consume/return/**`GR (+)` on QC pass** → `stock.md` §2b/§3b/§6 · **★ number-on-save (G8) → `numbering-on-save.md`** · **★ r10 GR object + QC-gated stock-in → `goods-receipt.md` §4/§9 · `qc.md` §4.1 · entity-status-map §1.8** · **production action/actual-qty/loss + PO edit audit → `production.md` §5/§7 + `po.md` §5.2** · BOM → `bom.md` · supplier → `supplier.md` · negative stock → entity-status-map §1.6/§1.8 · reservation → stock-reservation · soft-delete/role → `deletion-policy.md` · Low alerting + save-back + margin sim → `supply-planning.md` · QT audit → `quotation.md` §10 · comment → `comment-convention.md`.

## 14. Module changelog
- **Consolidated + updated:** NFR ทั้งหมด → NFR module เดียว.
- **★ DECIDED (2026-07-29):** Supply Planning proactive Low alerting + J8.
- **★ เพิ่ม (2026-07-29 — Quotation review):** QT action audit · **REVERTED:** ถอด Sent/sent-date.
- **★ เพิ่ม (2026-07-29 — comment cross-cutting):** comment audited.
- **★ เพิ่ม (2026-07-29 — Stock review):** stock movement + RM code + dropdown.
- **★ CHANGED (2026-07-29 — BOM + Supplier review):** code lock · BOM/Supplier audit.
- **★ เพิ่ม/CHANGED (2026-07-29 — Settings review):** A1/A6/A7/A8 · A3/A4 · AU1/AU2 Settings audit · §10 Role disable/soft-delete.
- **★ เพิ่ม (2026-07-29 — Production module review, ปอนด์):** AU1 production action + PO edit audit · AU3 adjust Lot/FIFO + CONSUME lot · D-F4 production queue search · §9 confirm popup.
- **★ เพิ่ม (2026-07-29 — Supply Planning module review, ปอนด์):** AU1 save-back planning param audit (simulate ไม่ audit) · AU4 "สั่งผลิต" traceable · D-F3 margin sim ก่อน VAT · D-F4 FG search.
- **★ เพิ่ม (2026-07-29 — number-on-save G8, ปอนด์ cross-cutting):** **D-F2/D-F5** — เลขเอกสารออก **ตอนบันทึกสำเร็จ** (ไม่โชว์ล่วงหน้า, ร่างที่ไม่บันทึกไม่กินเลข, popup เลข+summary, NS7 หลายเลข/บันทึก) · **AU1** ออกเลข = entity-create audit · **§6 "Not a job"** gapless = event ตอนบันทึก · **§9** confirm popup แสดงเลข · **§10/NS5** void = เลขคงอยู่ · **R5** ออกเลข atomic ใน tx · **D-F4** Return RM search (G7) + `return (−)` source ผูก RM · **AU3** return source Lot+RM+Supplier+RT. ยึด `numbering-on-save.md`.
- **★★ เพิ่ม (2026-07-29 — QC + GR/Stock flow review, ปอนด์):**
  1. **AU1/AU3:** **GR object lifecycle audit** (QC ตรวจสอบ/ผ่าน/ไม่ผ่าน/ยกเลิก + ส่งกลับ QC) · **`GR (+)` credit + FIFO retro-link เกิดตอน QC ตรวจรับ "ผ่าน"** (ไม่ใช่ตอนบันทึก GR) — ref `goods-receipt.md` §4/§9 · `qc.md` §4.1.
  2. **AU4/R3/R5:** GMP chain + negative-stock ชดเชย + outbox → ผูกจุด QC pass (Lot เข้าสายเมื่อ credit) · QC ไม่ผ่าน = ไม่ credit.
  3. **D-F4/§9/§10:** stock "Good Receipt (RM)" tab search/filter · qc ตรวจรับ + ตรวจแบตช์ sub-tab OEM/Own-Brand · ยกเลิก GR = confirm+เหตุผล+gapless (เฉพาะก่อน credit) · **§6 "Not a job" sync** (GR credit = event on QC pass).
  4. **P3:** GR>50/วัน ผ่าน QC-gate → QC decision events + GR (RM) tab load.
- **ไม่มีตัวเลขประดิษฐ์.**
