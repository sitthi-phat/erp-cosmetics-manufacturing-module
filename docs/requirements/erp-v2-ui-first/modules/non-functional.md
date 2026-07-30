# Non-Functional Requirements (NFR) — ESSENCE Hub System

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 (**+ Route/DN r11 2026-07-30**) · **AUTHORITATIVE NFR SPEC**
ที่มา (locked): `brief.md` §5/§8 · ADR-000..009 · `scheduled-jobs.html` (J1–J7) · architecture · `entity-status-map.md` §1.6/§1.8/**§1.9/§1.10 (Route/DN r11)** · `stock-reservation.md` (Option A) · `deletion-policy.md` · scope D1–D18 · README §2/§3 · **`supply-planning.md` §5.1/§5c** · **`comment-convention.md`** · **`numbering-on-save.md` (G8)** · **`stock.md` §2b/§3b/§6** · **`bom.md` §5/§5c** · **`supplier.md` §10** · **`settings.md` §4b/§5/§6** · **`production.md` §5/§7 + `po.md` §5.2/§4b** · **`goods-receipt.md` §4/§9 + `qc.md` §4.1** · **★ `shipping.md` + `delivery-note.md` (Route/DN)**

## สรุปภาษาไทย
รวม **ข้อกำหนดที่ไม่ใช่ฟังก์ชัน (NFR)** ทั้งหมดของ ESSENCE Hub ไว้ที่เดียว. ครอบ: **Performance** (หน้า <2s max 3s, 50 concurrent, >200 PO/วัน + GR>50/วัน + QT/SO/Supply-Planning), **Auth/Session** (local+Google, 24h + เตะออก 06:00, RBAC generic RUCDAA+Admin bit — D14), **Audit** (field-level, retention 1 ปี; ทุก stock movement มี reason+source; GR object lifecycle + credit on QC pass; production action; PO edit; comment ทุก object; **★ Route/DN lifecycle + DN status-edit(A)**), **Backup/Infra** (GCP Cloud Run + Cloud SQL MySQL), **Data/Format** (Asia/Bangkok, พ.ศ./UTC, **gapless + number-on-save G8**; RM/BOM/FG code user-entered+lock, THB, VAT ตาม invoice date; **★ รอบจัดส่ง `RT-…` แทน `SHP-…` — Q1 รอปอนด์**), **Scheduled Jobs J1–J8**, **Notification outbox+read-bit** (FG→Low), **global search**, **responsive**, **soft-delete + reference-guard**, **reliability/integrity**. ทุกข้อ derive จากค่าที่ล็อก — ไม่มีการเดา.

---

## 1. Performance & Capacity
| # | NFR | ค่า (locked) | หมายเหตุ scope ใหม่ |
|---|---|---|---|
| P1 | เวลาตอบสนองต่อหน้า | **< 2s (hard cap 3s)** | ครอบทุกหน้ารวม quotation/so/supply-planning/production queue/dashboard drill/qc/stock GR tab/**Route+DN list** |
| P2 | ผู้ใช้พร้อมกัน | **50 concurrent users** | brief §5.1 · **★ number-on-save (G8) ต้อง atomic ต่อชนิด+ปี/เดือน กันเลขชนภายใต้ concurrency (รวม RT+DN หลายเลข/รอบ)** |
| P3 | ปริมาณงานต่อวัน | **> 200 PO/วัน · GR > 50/วัน** | **★ r10: GR>50/วัน ผ่าน QC-gate ก่อน credit** |
| P4 | Dashboard aggregate | < 2s (hard 3s) | 7 แผนก/29 tile + drill |
| P5 | Client polling | dashboard 15s · noti bell 15s | ฝั่งเบราว์เซอร์ |

> ใช้เพดานเดิม (P1/P2/P3) เป็น baseline; capacity planning = DevOps (Stage 4).

## 2. Auth / Session / Access Control
| # | NFR | รายละเอียด (locked) |
|---|---|---|
| A1 | Login | **local (basic) + Google Login** (ADR-007) · **★ หน้า login เสนอทางเลือก basic vs Google** (platform.md §2/§4) |
| A2 | Session | **หมดอายุ 24 ชม.** + **บังคับ login ใหม่ทุกวัน 06:00** (J1) · **ไม่มีกะกลางคืน** · warning ก่อนหมด |
| A3 | RBAC | **generic RUCDAA ต่อ module** (R/U/C/D/A/**Admin bit**) — D14 · **★ effective permission = union ของ role ที่ Active เท่านั้น** |
| A4 | Guard | เมนู/ปุ่ม/URL/API ทุกจุด · **★ user ที่ role ถูก Disabled/Deleted → 403 ทุกจุด** · **★ r11: แก้สถานะ DN โดยตรง = ต้อง Shipping.Approve (A)** |
| A5 | Scope ใหม่ | เพิ่ม module: **Quotation / SO / Supply Planning** · **★ r11: DN = Module เอกสารแยก (delivery-note)** |
| **★ A6** | **Password provisioning** | **โหมด 2 แบบ:** must-change-on-first-login / permanent · กรอก 2 ครั้ง + toggle show/hide · edit-user write-only |
| **★ A7** | **Google account link** | Admin ผูก user ↔ Google (1:1) · ยกเลิกผูก → basic · **★ คนขับ (driver) ใน Route = system user** |
| **★ A8** | **Admin-only sensitive areas** | **VAT · ข้อมูลบริษัท · Audit-log = Admin bit เท่านั้น** |

## 3. Audit & Traceability (NFR ระดับระบบ)
| # | NFR | รายละเอียด (locked) |
|---|---|---|
| AU1 | Field-level audit | ทุก action ทุก module เก็บ เวลา/ผู้ทำ/entity/field/จาก→เป็น/เหตุผล (traceability.md) · **★ Quotation:** create / edit→version / Convert-to-PO→Confirmed / cancel · **★ BOM/Supplier:** create/edit/ราคา/inactivate/reactivate · price-matrix · **★ BOM planning-param save-back** (simulate ไม่ save = ไม่ audit) · **★ Settings:** role/user/VAT/company · **★ Production:** รับงาน/เริ่มผลิต(consume lot FIFO)/ส่ง QC/พร้อมส่ง(surplus→FG)/Hold/rework/`actual_produced_qty`/loss · **★ PO edit:** field-level old→new + raise ⚑ follow-up · **★ number-on-save (G8):** การออกเลขครั้งแรก (QT/SO/PO/PR/GR+Lot/**RT+DN**/INV/PRD; Batch derived) = entity-create event บันทึก ใคร/เมื่อ/เลขที่ออก · **★★ r10 GR/QC:** GR object lifecycle + `GR (+)` credit + FIFO retro-link เกิดตอน QC ตรวจรับ "ผ่าน" · **★★★ r11 Route/DN:** **Route lifecycle** (สร้างรอบ→gen RT+DN / เตรียมจัดของ→กำลังออกไปส่ง→เสร็จสิ้น/ยกเลิก) + **DN status change** (ทั้ง Route "เสร็จสิ้น" process และ **แก้ตรง สิทธิ์ A**) + **comment DN บังคับตอน status-update** = audit ครบ (shipping.md/delivery-note.md) · **★ comment ทุก object ธุรกรรม** (comment-convention.md CC3/CC6) |
| AU2 | Retention | **online 1 ปี** แล้ว **Super User manual purge/archive** · ประวัติ comment ลบไม่ได้ · **★ Audit-log viewer = Admin bit (A8)** |
| AU3 | Stock ledger + movement audit | ทุก movement = **append-only ledger + reason + source ref บังคับ** (D15) · **★ audit + trace ทุก movement:** เพิ่มวัตถุดิบใหม่ · loss (−) · adjust (+) · **`GR (+)` (r10: ตอน QC "ผ่าน")** · FG-in (+) · surplus (+) · **return (−) (source ผูก Lot+RM+Supplier+RT)** · **CONSUME (−)** (lot มี stock; หลาย lot = FIFO) — entity=RM/Lot หรือ FG/Batch. **RM/BOM/FG code = user-defined unique + create-only-lock** |
| AU4 | GMP chain | Lot→Batch→line→PO(หรือ SO)→ลูกค้า→DN/INV · QT = head-of-chain สาย OEM, FG per-Batch · **★★ r10: Lot ผูก GR object; เข้าสาย genealogy เมื่อ QC "ผ่าน"** · **★ Supply Planning "สั่งผลิต" = SO produce-to-stock → PRD/Batch → FG-in** · **★ r11: DN ผูก Route (RT) ต้นทาง; ตัด FG (FIFO per-Batch) ตอน DN "ส่งสำเร็จ"** |
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
| D-F2 | Gapless numbering **+ ★ number-on-save (G8)** | **ต่อปี/เดือน (RT/DN = ต่อวัน)** — PO/**QT-**/**SO-**/PR/GR/PRD/Batch/DN/INV/**RT (★ เดิม SHP — Q1)** (ADR-008) · void/**ยกเลิก GR** ไม่ทำให้เลขหาย · **★ เลขออก "ตอนบันทึกสำเร็จ" ไม่โชว์ล่วงหน้าบนหน้า create (แสดง "(ระบบออกให้เมื่อบันทึก)")** — ร่างที่ไม่บันทึก **ไม่กินเลข** · บันทึก → ออกเลข atomic + **popup ยืนยัน "เลข + summary (+ ลิงก์ดู/พิมพ์)"** · **หลายเลขต่อการบันทึก (GR+Lot · ★ RT+DN) → popup แสดงครบ (NS7)** · แก้/เวอร์ชันใหม่/void = เลขเดิม · **PRD/Batch = ออกเลขตอน action** · **PR auto = ไม่มี popup** · **QC record + master code = นอกขอบเขต G8**. รายละเอียด `numbering-on-save.md` |
| D-F3 | Currency/VAT | **THB** · VAT ตาม **invoice date** · ตัวหนังสือไทย · **★ margin simulation ใน Supply Planning = ก่อน VAT** |
| D-F4 | สถานะ/UI | ป้ายสถานะ**ภาษาไทย**เสมอ · **dropdown search: RM/FG ชื่อ+รหัส, Lot dropdown (+FIFO) · BOM component · Supplier price-matrix · customer dropdown (G4) · Supply Planning FG · Return RM ในล็อต (G7)** · Settings role/user · Production queue · **★ r10: stock "Good Receipt (RM)" tab ค้น GR/Lot/Supplier/ชื่อ+รหัส RM + วันที่รับ + filter สถานะ · qc ตรวจรับ/ตรวจแบตช์ (sub-tab OEM/Own-Brand)** · **★★★ r11: Route list ค้นคนขับ/username/route-id + ช่วงวันชนิดวัน (สร้าง/ออกไปส่ง) · DN list ค้น คนขับ/username/route-id/PO-SO/วันลูกค้าต้องการรับ + filter สถานะ DN (6)** |
| D-F5 | เลขเอกสาร / รหัส master | `PO-…` · `QT-…` · `SO-…` · `INV-…` · `GR-…` · **`RT-{YYYYMMDD}-{NNNN}` (★ เดิม `SHP-…` — Q1 vs SHP: PO เสนอ RT แทน SHP)** · `DN-{YYYYMMDD}-{NNNNN}` · Batch `B-{PO}-{line}-{run}` · **★ ทั้งหมดออกตอนบันทึก (G8/D-F2)** · **★ RM code = user-entered + unique + create-only-lock** · **★ FG/BOM code = user-entered (shared, 1:1) + unique + create-only-lock** |

## 6. Scheduled / Background Jobs (J1–J8) — locked + scope update
| Job | ความถี่ | ทำอะไร | แจ้งเตือน | idempotent |
|---|---|---|---|---|
| **J1** Session reset | ทุกวัน 06:00 | เลื่อน session_epoch | — | ✓ |
| **J2** Customer inactivity sweep | ทุกวัน | Active→Inactive (default 3 ด.) | ✓ Sale | ✓ |
| **J3** Invoice overdue sweep | ทุกวัน | **ส่งสำเร็จ (DN)** +เลยเครดิต+ยังไม่จ่าย → Overdue | ✓ Finance+Sale | ✓ |
| **J4** Potential-delay | ทุกวัน/ชั่วโมง | PRD ใกล้ไม่ทันส่ง → badge | ✓ Sale+Stock | ✓ |
| **J5** Notification outbox dispatcher | ต่อเนื่อง ~1s | ส่ง event ใน outbox | ✓ | ✓ |
| **J6** Stock ledger integrity | ทุกคืน | เทียบ balance vs Σmovement | — (เตือน Admin) | ✓ |
| **J7** Database backup | ทุกวัน | Phase2 dump / Phase3 backup | — | ✓ |
| **★ J8** Supply Planning low-stock digest | **ทุกวัน ~06:00** | FG (Active) Low ทั้งหมด + Suggested → 1 แจ้งเตือนสรุป | ✓ Read Supply Planning | ✓ |

**Not a job (on-read / event / client):** BOM cost badge · Supply-Planning cover/suggested/margin simulation (client) · **★ r11 Route "เสร็จสิ้น" (action, ไม่ auto-close)** · Inactive→Active · ปิด PR · dashboard/bell 15s · **gapless numbering = event ตอนบันทึกสำเร็จ (G8, atomic — รวม RT+DN หลายเลข/รอบ)** · stock movement = event + ledger write · **★★ r10: `GR (+)` credit = event ตอน QC "ผ่าน"** · **★★★ r11: Route/DN status change + DN status-edit(A) = event + audit** · BOM inactivate · save-back · production action + PO edit · role lifecycle = event + audit.

### 6.1 ★ Supply Planning proactive alerting (DECIDED 2026-07-29)
- **Trigger:** FG (Active) พลิกเข้า **Low** — แนบ Suggested. **FG Inactive ไม่เข้าข่าย**.
- **(a) Real-time:** event ที่ทำให้ FG พลิก non-Low→Low → ยิงทันที (outbox J5).
- **(b) Daily digest:** **J8** ~06:00.
- **Recipient:** มีสิทธิ์ Read Supply Planning (fan-out). Deep-link → supply-planning / SO produce-to-stock.

## 7. Notification (NFR)
- **Transactional outbox + read-bit ราย user** (J5/ADR-005): ผู้รับ = Read ของ module ปลายทาง · deep link + ack/read + mark all + "ดูทั้งหมด" (20/หน้า) + badge "9+".
- **Events รวม:** PO Confirmed→Production, **★ r10 QC ตรวจรับ Lot ผ่าน/ไม่ผ่าน (→Stock)**, QC pass/fail (Batch), **★ r11 DN ส่งสำเร็จ (→Finance+Sale) / ลูกค้ายกเลิก/ยังไม่กำหนดวัน (→Sale) / ลูกค้าเลื่อนส่ง (→Shipping)**, PR auto, Overdue, Inactivity **+ ★ FG→Low (real-time + J8)**.
> **หมายเหตุ:** การแก้ `comment`, stock movement, **★ GR ส่งกลับ QC/ยกเลิก**, production action + PO edit, BOM/supplier changes, Settings changes, **★ การออกเลขเอกสาร (G8)**, **★ r11 Route status change (เตรียม/ออกไปส่ง)** = audit event **แต่ไม่ยิง notification** (ยกเว้น movement ที่ทำให้ FG พลิก Low, QC ตรวจรับ Lot ผ่าน/ไม่ผ่าน, PO edit → ⚑ follow-up, และ **DN สถานะสุดท้ายตามด้านบน**) เว้นแต่ปอนด์ระบุเพิ่ม.

## 8. Global Search (NFR)
- ค้นข้าม entity จาก header · จำกัดตามสิทธิ์ Read · ≥ 2 ตัวอักษร · deep link.

## 9. Responsive / Usability (NFR — first-class)
- **Responsive ทุกหน้า (Must)** · minimize clicks · smart defaults · dropdown search ทุกจุด · ไม่มี enum ดิบ · **★ ทุกการเปลี่ยนสถานะในสายผลิต = confirm popup (production.md §7.7)** · **★ number-on-save = confirm popup แสดงเลข + summary หลังบันทึก (G8/NS3)** · **★ r10: ยกเลิก GR = confirm + เหตุผลบังคับ** · **★★★ r11: สร้าง Route → popup แสดงเลข RT + ทุก DN (PO/SO ใบไหนได้ DN ใด); "เสร็จสิ้น" = บังคับสรุปผลราย DN + comment; ลูกค้าเลื่อนส่ง = บังคับ next date**.

## 10. Soft-Delete + Reference-Guard (NFR baseline)
- **ไม่มี hard delete** · master = soft-delete · **BOM = inactivate** · **★ Role = Disable / Soft-delete** · เอกสารการค้า = void/cancel (**gapless — เลขที่ออกแล้วคงอยู่, G8/NS5**; **★ r10: ยกเลิก GR = void gapless เฉพาะก่อน credit**; **★ r11: ยกเลิก Route = void; DN คงเป็นประวัติ**) · reference-guard · audit + comment บังคับ · undelete = Admin.

## 11. Reliability / Integrity
| # | NFR | รายละเอียด (locked) |
|---|---|---|
| R1 | Append-only ledger | stock ledger เป็นความจริง — recompute ได้ (ADR-001) |
| R2 | Nightly integrity | J6 เทียบ 2 cache |
| R3 | Negative-stock policy | on_hand/Available ติดลบได้; **★★ r10: GR ชดเชย + FIFO retro-link เกิดตอน QC "ผ่าน"** |
| R4 | Reservation | ยืนยัน = จอง; เริ่มผลิต/dispatch = ตัดจริง (lot มี stock; หลาย lot = FIFO, Option A) · **★ r11: dispatch = ตอน DN "ส่งสำเร็จ"** |
| R5 | Transactional outbox | noti event (รวม FG→Low, QC ตรวจรับ Lot ผ่าน, **★ r11 DN ส่งสำเร็จ**) เขียนใน tx เดียวกับ ledger · **★ number-on-save (G8) ออกเลข atomic (รวม RT+DN) ใน tx เดียวกับการบันทึก** |

## 12. Open question (NFR)
- **★ Q1 (r11) — RT vs SHP numbering:** ดู `shipping.md` §12 / entity-status-map §5. เอกสารเขียนด้วยสมมติฐาน "RT แทน SHP"; รอปอนด์ยืนยัน. (ไม่กระทบกลไก gapless/atomic — เป็นการตั้งชื่อ prefix.)
- อื่น ๆ: **ไม่มี open question ค้าง** (G8/r10/production/PO edit/adjust Lot-FIFO/BOM save-back/margin sim = คงเดิม).

## 13. Cross-links
- Auth/session/RBAC → `settings.md`/`platform.md` · Audit → `traceability.md` · ledger → `stock.md` §2b/§3b/§6 · **★ number-on-save (G8) → `numbering-on-save.md`** · **★ r10 GR object → `goods-receipt.md`/`qc.md`/entity-status-map §1.8** · production/PO edit → `production.md`/`po.md` · **★★★ r11 Route/DN → `shipping.md`/`delivery-note.md`/entity-status-map §1.9/§1.10/`po.md` §4b** · BOM → `bom.md` · supplier → `supplier.md` · negative stock → entity-status-map §1.6/§1.8 · reservation → stock-reservation · soft-delete/role → `deletion-policy.md` · Low alerting → `supply-planning.md` · comment → `comment-convention.md`.

## 14. Module changelog
- **Consolidated + updated:** NFR ทั้งหมด → NFR module เดียว.
- **★ DECIDED (2026-07-29):** Supply Planning proactive Low alerting + J8.
- **★ เพิ่ม (2026-07-29 — Quotation/comment/Stock/BOM/Supplier/Settings/Production/Supply Planning/number-on-save/QC+GR reviews):** (คงตามรอบก่อน — commit history)
- **★★★ เพิ่ม (2026-07-30 — Route/DN r11, ปอนด์ Module B/C):** **D-F2/D-F5** รอบจัดส่ง `SHP-…` → **`RT-…`** (Q1 รอปอนด์) · RT/DN = gapless ต่อวัน; RT+DN popup NS7 · **AU1/AU3/AU4** Route/DN lifecycle + DN status-edit(A) + comment DN บังคับ + ตัด FG ตอน DN "ส่งสำเร็จ" audit · **A4/A5/A7** DN status-edit = Shipping.A, DN = module แยก, คนขับ = system user · **§6/§7/§9/§10/R4/R5** Route "เสร็จสิ้น" = action (ไม่ auto-close) · DN noti events (ส่งสำเร็จ/เลื่อน/ยกเลิก/ยังไม่กำหนดวัน) แทน Delivered/Rejected/Postponed · dispatch = DN ส่งสำเร็จ · **J3** overdue trigger = DN ส่งสำเร็จ · **D-F4** Route/DN list search · **§12** Q1 open. ยึด `shipping.md`/`delivery-note.md`/entity-status-map §1.9/§1.10.
- **ไม่มีตัวเลขประดิษฐ์.**
