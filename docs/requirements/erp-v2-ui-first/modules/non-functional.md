# Non-Functional Requirements (NFR) — ESSENCE Hub System

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 (**+ Route/DN r11 2026-07-30 · Q1=A LOCKED · + Audit non-read+login r12 2026-07-30 · + Return `RET-…` numbering + Deferred-controls register 2026-07-31 · ★★★★★★ + CUMULATIVE-level RBAC r16 2026-07-31**) · **AUTHORITATIVE NFR SPEC**
ที่มา (locked): `brief.md` §5/§8 · ADR-000..009 · `scheduled-jobs.html` (J1–J7) · architecture · `entity-status-map.md` §1.6/§1.8/**§1.9/§1.10 (Route/DN r11)** · `stock-reservation.md` (Option A) · `deletion-policy.md` · scope D1–D18 · README §2/§3 · **`supply-planning.md` §5.1/§5c** · **`comment-convention.md`** · **`numbering-on-save.md` (G8)** · **`stock.md` §2b/§3b/§6** · **`bom.md` §5/§5c** · **`supplier.md` §10** · **`settings.md` §4/§4b/§4d/§5/§6** · **`production.md` §5/§7 + `po.md` §5.2/§4b** · **`goods-receipt.md` §4/§9 + `qc.md` §4.1** · **★ `shipping.md` + `delivery-note.md` (Route/DN)** · **`traceability.md` §3/§4/§5b (trace-surface + non-read audit)** · **★★★★★★ `permission-matrix.md` §1a (cumulative RBAC)**

## สรุปภาษาไทย
รวม **ข้อกำหนดที่ไม่ใช่ฟังก์ชัน (NFR)** ทั้งหมดของ ESSENCE Hub ไว้ที่เดียว. ครอบ: **Performance** (หน้า <2s max 3s, 50 concurrent, >200 PO/วัน + GR>50/วัน + QT/SO/Supply-Planning), **Auth/Session** (local+Google, 24h + เตะออก 06:00, **★★★★★★ RBAC = CUMULATIVE per-module level (ลำดับชั้นสะสม R < C < U < D < A < Admin) — role ได้ระดับเดียวต่อ module, ระดับสูงรวม action ที่ต่ำกว่า; เดิมอธิบายเป็น "generic RUCDAA + Admin bit อิสระ" → ปอนด์ 2026-07-31 ทำให้เป็น total order — D14**), **Audit** (field-level, retention 1 ปี; **★★★★ r12: audit ครอบ "ทุกกิจกรรมที่ไม่ใช่การอ่าน" ในทุก module + login/logout**; ทุก stock movement มี reason+source; GR object lifecycle + credit on QC pass; production action; PO edit; comment ทุก object; **★ Route/DN lifecycle + DN status-edit(A)**), **Backup/Infra** (GCP Cloud Run + Cloud SQL MySQL), **Data/Format** (Asia/Bangkok, พ.ศ./UTC, **gapless + number-on-save G8**; RM/BOM/FG code user-entered+lock, THB, VAT ตาม invoice date; **★ รอบจัดส่ง `RT-…` แทน `SHP-…` (Q1=A DECIDED 2026-07-30, drop SHP)**; **★ ใบคืน `RET-…` (2026-07-31, คนละ prefix กับ Route)**), **Scheduled Jobs J1–J8**, **Notification outbox+read-bit** (FG→Low), **global search**, **responsive**, **soft-delete + reference-guard**, **reliability/integrity**, **★ Deferred-controls register (§15)**. ทุกข้อ derive จากค่าที่ล็อก — ไม่มีการเดา.

---

## 1. Performance & Capacity
| # | NFR | ค่า (locked) | หมายเหตุ scope ใหม่ |
|---|---|---|---|
| P1 | เวลาตอบสนองต่อหน้า | **< 2s (hard cap 3s)** | ครอบทุกหน้ารวม quotation/so/supply-planning/production queue/dashboard drill/qc/stock GR tab/**Route+DN list + trace/audit-log** |
| P2 | ผู้ใช้พร้อมกัน | **50 concurrent users** | brief §5.1 · **★ number-on-save (G8) ต้อง atomic ต่อชนิด+ปี/เดือน กันเลขชนภายใต้ concurrency (รวม RT+DN หลายเลข/รอบ)** |
| P3 | ปริมาณงานต่อวัน | **> 200 PO/วัน · GR > 50/วัน** | **★ r10: GR>50/วัน ผ่าน QC-gate ก่อน credit** |
| P4 | Dashboard aggregate | < 2s (hard 3s) | 7 แผนก/29 tile + drill |
| P5 | Client polling | dashboard 15s · noti bell 15s | ฝั่งเบราว์เซอร์ |

> ใช้เพดานเดิม (P1/P2/P3) เป็น baseline; capacity planning = DevOps (Stage 4).

## 2. Auth / Session / Access Control
| # | NFR | รายละเอียด (locked) |
|---|---|---|
| A1 | Login | **local (basic) + Google Login** (ADR-007) · **★ หน้า login เสนอทางเลือก basic vs Google** (platform.md §2/§4) · **★★★★ r12: login/logout = audit event (AU1)** |
| A2 | Session | **หมดอายุ 24 ชม.** + **บังคับ login ใหม่ทุกวัน 06:00** (J1) · **ไม่มีกะกลางคืน** · warning ก่อนหมด |
| A3 | RBAC | **★★★★★★ r16: CUMULATIVE per-module level (ลำดับชั้นสะสม)** — role ได้รับ **ระดับเดียวต่อ module** ตามลำดับ **`R < C < U < D < A < Admin`**; ระดับนั้น**รวมทุก action ที่ต่ำกว่าอัตโนมัติ** (เช่น ระดับ U → ทำ R/C/U ได้; ปุ่ม (D) ต้อง ≥ D; (Ad) ต้อง Admin). **⚠️ Create (C) อยู่ต่ำกว่า Update (U)** — total order ไม่ใช่ bit อิสระ. **เดิมเขียนว่า "generic RUCDAA ต่อ module (R/U/C/D/A/Admin bit)" — r16 reconcile ให้เป็น total order สะสม (ไม่ใช่ 6 bit อิสระ), D14 คงเป็นแกน RBAC.** authoritative = `permission-matrix.md` §1a · `settings.md` §4. **★ effective level = ต่อ module เอา "ระดับสูงสุด (max)" จาก role ที่ Active เท่านั้น** |
| A4 | Guard | เมนู/ปุ่ม/URL/API ทุกจุด · **★ user ที่ role ถูก Disabled/Deleted → 403 ทุกจุด** · **★ r11: แก้สถานะ DN โดยตรง = ต้องระดับ ≥ Shipping.Approve (A)** · **★★★★★★ r16: gate = ผู้ใช้ต้องมีระดับ ≥ รหัส (min level) ที่ปุ่มต้องการ** |
| A5 | Scope ใหม่ | เพิ่ม module: **Quotation / SO / Supply Planning** · **★ r11: DN = Module เอกสารแยก (delivery-note)** |
| **★ A6** | **Password provisioning** | **โหมด 2 แบบ:** must-change-on-first-login / permanent · กรอก 2 ครั้ง + toggle show/hide · edit-user write-only · **★★★★ r12: password set/reset + first-login change = audit event (ไม่เก็บค่า)** |
| **★ A7** | **Google account link** | Admin ผูก user ↔ Google (1:1) · ยกเลิกผูก → basic · **★ คนขับ (driver) ใน Route = system user** |
| **★ A8** | **Admin-only sensitive areas** | **VAT · ข้อมูลบริษัท · Audit-log = ระดับ Admin เท่านั้น** · **★★★★★★ r16: force-override / undelete-restore / สร้าง-แก้ role level-matrix / จัดการ user = ระดับ Admin เช่นกัน** |

## 3. Audit & Traceability (NFR ระดับระบบ)
| # | NFR | รายละเอียด (locked) |
|---|---|---|
| AU1 | **Non-read audit (field-level) — ทุกกิจกรรมที่ไม่ใช่การอ่าน ทุก module** | **★★★★ r12: audit ครอบ "ทุกกิจกรรมที่ไม่ใช่การอ่าน" ในทุก module + login/logout** — เก็บ เวลา/ผู้ทำ/module/entity/**action(event)**/field/จาก→เป็น/เหตุผล (traceability.md §3/§4). **การอ่าน/ดู/ค้น = ไม่ audit.** ครอบ: **create · update · delete/void/cancel · approve · status-change · config-change (รวม ★★★★★★ role level-per-module edit) · password-reset · role/user-change · stock-movement · comment-edit · ★ login/logout/first-login-change (login สำเร็จ + ล้มเหลว)**. รายละเอียดตัวอย่าง: **★ Quotation:** create / edit→version / Convert-to-PO→Confirmed / cancel · **★ BOM/Supplier:** create/edit/ราคา/inactivate/reactivate · price-matrix · **★ BOM planning-param save-back** · **★ Settings:** role/user/VAT/company/**role level edit** · **★ Production:** รับงาน/เริ่มผลิต/ส่ง QC/พร้อมส่ง/Hold/rework/`actual_produced_qty`/loss · **★ PO edit:** field-level old→new + raise ⚑ follow-up · **★ number-on-save (G8):** การออกเลขครั้งแรก (QT/SO/PO/PR/GR+Lot/**RT+DN**/INV/PRD/**RET**; Batch derived) = entity-create event · **★★ r10 GR/QC:** GR object lifecycle + `GR (+)` credit + FIFO retro-link ตอน QC "ผ่าน" · **★★★ r11 Route/DN:** **Route lifecycle** + **DN status change** (ทั้ง Route "เสร็จสิ้น" process และ **แก้ตรง สิทธิ์ ≥ A**) + **comment DN บังคับ** · **★ comment ทุก object ธุรกรรม** (CC3/CC6). **แหล่ง viewer = `settings.md` US-SET-05 (Admin only) — ค้น user id/username + ช่วงวัน + filter module.** |
| AU2 | Retention | **online 1 ปี** แล้ว **Super User manual purge/archive** · ประวัติ comment ลบไม่ได้ · **★ Audit-log viewer = ระดับ Admin (A8)** · **★ r12: login/logout อยู่ใน retention เดียวกัน (1 ปี)** |
| AU3 | Stock ledger + movement audit | ทุก movement = **append-only ledger + reason + source ref บังคับ** (D15) · **★ audit + trace ทุก movement:** เพิ่มวัตถุดิบใหม่ · loss (−) · adjust (+) · **`GR (+)` (r10: ตอน QC "ผ่าน")** · FG-in (+) · surplus (+) · **return (−) (source ผูก Lot+RM+Supplier+RET)** · **CONSUME (−)** (lot มี stock; หลาย lot = FIFO) — entity=RM/Lot หรือ FG/Batch. **RM/BOM/FG code = user-defined unique + create-only-lock** |
| AU4 | GMP chain | Lot→Batch→line→PO(หรือ SO)→ลูกค้า→DN/INV · QT = head-of-chain สาย OEM, FG per-Batch · **★★ r10: Lot ผูก GR object; เข้าสาย genealogy เมื่อ QC "ผ่าน"** · **★ r12: Lot ผูก Return (`RET-…`, ย้อน Supplier)** · **★ Supply Planning "สั่งผลิต" = SO produce-to-stock → PRD/Batch → FG-in** · **★ r11: DN ผูก Route (RT) ต้นทาง; ตัด FG (FIFO per-Batch) ตอน DN "ส่งสำเร็จ"** |
| AU5 | Archive | text file · Super User เท่านั้น · ยืนยันก่อน export |
| **★★★★ AU6** | **Trace surface (r12)** | **`trace.html` มี entity/topic SELECTOR (ครอบทุก object §3 traceability) + ค้น id/key ของ topic + ช่วงวัน + dropdown ชนิดวัน (date-type, G2) + worked sample per object (forward+backward)** — ดู `traceability.md` §3.1/§5b. viewer จำกัดตามสิทธิ์ Read module ต้นทาง; audit-log viewer รวม = Settings Admin-only. |

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
| D-F2 | Gapless numbering **+ ★ number-on-save (G8)** | **ต่อปี/เดือน (RT/DN = ต่อวัน)** — PO/**QT-**/**SO-**/PR/GR/PRD/Batch/DN/INV/**RT (RT แทน SHP, Q1=A DECIDED — drop SHP)**/**★ RET (ใบคืน, ต่อปี/เดือน, 2026-07-31)** (ADR-008) · void/**ยกเลิก GR** ไม่ทำให้เลขหาย · **★ เลขออก "ตอนบันทึกสำเร็จ" ไม่โชว์ล่วงหน้าบนหน้า create** · บันทึก → ออกเลข atomic + **popup ยืนยัน** · **หลายเลขต่อการบันทึก (GR+Lot · ★ RT+DN) → popup แสดงครบ (NS7)** · แก้/เวอร์ชันใหม่/void = เลขเดิม · **PRD/Batch = ออกเลขตอน action** · **PR auto = ไม่มี popup** · **QC record + master code = นอกขอบเขต G8**. รายละเอียด `numbering-on-save.md` |
| D-F3 | Currency/VAT | **THB** · VAT ตาม **invoice date** · ตัวหนังสือไทย · **★ margin simulation ใน Supply Planning = ก่อน VAT** |
| D-F4 | สถานะ/UI | ป้ายสถานะ**ภาษาไทย**เสมอ · **dropdown search: RM/FG ชื่อ+รหัส, Lot dropdown (+FIFO) · BOM component · Supplier price-matrix · customer dropdown (G4) · Supply Planning FG · Return RM ในล็อต (G7)** · Settings role/user · Production queue · **★ r10: stock "Good Receipt (RM)" tab ค้น GR/Lot/Supplier/ชื่อ+รหัส RM + วันที่รับ + filter สถานะ · qc ตรวจรับ/ตรวจแบตช์ (sub-tab OEM/Own-Brand)** · **★★★ r11: Route list ค้นคนขับ/username/route-id + ช่วงวันชนิดวัน · DN list ค้น คนขับ/username/route-id/PO-SO/วันลูกค้าต้องการรับ + filter สถานะ DN (6)** · **★★★★ r12: trace entity/topic selector + ค้น id/key + ช่วงวันชนิดวัน · audit-log ค้น user id/username + ช่วงวัน + filter module** |
| D-F5 | เลขเอกสาร / รหัส master | `PO-…` · `QT-…` · `SO-…` · `INV-…` · `GR-…` · **`RT-{YYYYMMDD}-{NNNN}` (Route — RT แทน SHP, Q1=A DECIDED 2026-07-30 — drop SHP)** · `DN-{YYYYMMDD}-{NNNNN}` · **★ `RET-{YYYYMM}-{NNNNNN}` (ใบคืนวัตถุดิบ — gapless ต่อปี/เดือน, void-only; คนละ prefix กับ Route `RT-…`, 2026-07-31)** · Batch `B-{PO}-{line}-{run}` · **★ ทั้งหมดออกตอนบันทึก (G8/D-F2)** · **★ RM code = user-entered + unique + create-only-lock** · **★ FG/BOM code = user-entered (shared, 1:1) + unique + create-only-lock** |

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

**Not a job (on-read / event / client):** BOM cost badge · Supply-Planning cover/suggested/margin simulation (client) · **★ r11 Route "เสร็จสิ้น" (action, ไม่ auto-close)** · Inactive→Active · ปิด PR · dashboard/bell 15s · **gapless numbering = event ตอนบันทึกสำเร็จ (G8, atomic — รวม RT+DN หลายเลข/รอบ)** · stock movement = event + ledger write · **★★ r10: `GR (+)` credit = event ตอน QC "ผ่าน"** · **★★★ r11: Route/DN status change + DN status-edit(A) = event + audit** · BOM inactivate · save-back · production action + PO edit · role lifecycle · **★★★★ r12: login/logout/first-login-change = event + audit (ไม่ใช่ job)** = event + audit.

### 6.1 ★ Supply Planning proactive alerting (DECIDED 2026-07-29)
- **Trigger:** FG (Active) พลิกเข้า **Low** — แนบ Suggested. **FG Inactive ไม่เข้าข่าย**.
- **(a) Real-time:** event ที่ทำให้ FG พลิก non-Low→Low → ยิงทันที (outbox J5).
- **(b) Daily digest:** **J8** ~06:00.
- **Recipient:** มีสิทธิ์ Read Supply Planning (fan-out). Deep-link → supply-planning / SO produce-to-stock.

## 7. Notification (NFR)
- **Transactional outbox + read-bit ราย user** (J5/ADR-005): ผู้รับ = Read ของ module ปลายทาง · deep link + ack/read + mark all + "ดูทั้งหมด" (20/หน้า) + badge "9+".
- **Events รวม:** PO Confirmed→Production, **★ r10 QC ตรวจรับ Lot ผ่าน/ไม่ผ่าน (→Stock)**, QC pass/fail (Batch), **★ r11 DN ส่งสำเร็จ (→Finance+Sale) / ลูกค้ายกเลิก/ยังไม่กำหนดวัน (→Sale) / ลูกค้าเลื่อนส่ง (→Shipping)**, PR auto, Overdue, Inactivity **+ ★ FG→Low (real-time + J8)**.
> **หมายเหตุ:** การแก้ `comment`, stock movement, **★ GR ส่งกลับ QC/ยกเลิก**, production action + PO edit, BOM/supplier changes, Settings changes (**รวม role level edit**), **★ การออกเลขเอกสาร (G8)**, **★ r11 Route status change (เตรียม/ออกไปส่ง)**, **★★★★ r12 login/logout** = audit event **แต่ไม่ยิง notification** (ยกเว้น movement ที่ทำให้ FG พลิก Low, QC ตรวจรับ Lot ผ่าน/ไม่ผ่าน, PO edit → ⚑ follow-up, และ **DN สถานะสุดท้ายตามด้านบน**) เว้นแต่ปอนด์ระบุเพิ่ม.

## 8. Global Search (NFR)
- ค้นข้าม entity จาก header · จำกัดตามสิทธิ์ Read · ≥ 2 ตัวอักษร · deep link.

## 9. Responsive / Usability (NFR — first-class)
- **Responsive ทุกหน้า (Must)** · minimize clicks · smart defaults · dropdown search ทุกจุด · ไม่มี enum ดิบ · **★ ทุกการเปลี่ยนสถานะในสายผลิต = confirm popup (production.md §7.7)** · **★ number-on-save = confirm popup แสดงเลข + summary หลังบันทึก (G8/NS3)** · **★ r10: ยกเลิก GR = confirm + เหตุผลบังคับ** · **★★★ r11: สร้าง Route → popup แสดงเลข RT + ทุก DN; "เสร็จสิ้น" = บังคับสรุปผลราย DN + comment; ลูกค้าเลื่อนส่ง = บังคับ next date** · **★★★★★★ r16: role editor = per-module level selector (radio/dropdown) + explainer สะสม + สรุป effective actions (settings.md §4/US-SET-01)**.

## 10. Soft-Delete + Reference-Guard (NFR baseline)
- **ไม่มี hard delete** · master = soft-delete · **BOM = inactivate** · **★ Role = Disable / Soft-delete** · เอกสารการค้า = void/cancel (**gapless — เลขที่ออกแล้วคงอยู่, G8/NS5**; **★ r10: ยกเลิก GR = void gapless เฉพาะก่อน credit**; **★ r11: ยกเลิก Route = void; DN คงเป็นประวัติ**; **★ ใบคืน `RET-…` = void-only, เลขคงอยู่**) · reference-guard · audit + comment บังคับ · undelete = ระดับ Admin.

## 11. Reliability / Integrity
| # | NFR | รายละเอียด |
|---|---|---|
| R1 | Append-only ledger | stock ledger เป็นความจริง — recompute ได้ (ADR-001) |
| R2 | Nightly integrity | J6 เทียบ 2 cache |
| R3 | Negative-stock policy | on_hand/Available ติดลบได้; **★★ r10: GR ชดเชย + FIFO retro-link เกิดตอน QC "ผ่าน"** |
| R4 | Reservation | ยืนยัน = จอง; เริ่มผลิต/dispatch = ตัดจริง (lot มี stock; หลาย lot = FIFO, Option A) · **★ r11: dispatch = ตอน DN "ส่งสำเร็จ"** |
| R5 | Transactional outbox | noti event (รวม FG→Low, QC ตรวจรับ Lot ผ่าน, **★ r11 DN ส่งสำเร็จ**) เขียนใน tx เดียวกับ ledger · **★ number-on-save (G8) ออกเลข atomic (รวม RT+DN) ใน tx เดียวกับการบันทึก** |

## 12. Open question (NFR)
- **★ Q1 (r11) — RT vs SHP numbering: DECIDED (Q1=A, ปอนด์ 2026-07-30) — RT แทน SHP ทั้งหมด (drop SHP).** ดู `shipping.md` §12.
- **★★★★ r12 — login-failure audit (PO reasonable decision, ไม่ block):** audit บันทึก **ทั้ง login สำเร็จและล้มเหลว + logout**. ปอนด์ override ได้. ไม่มีนโยบาย lockout/rate-limit ระบุ.
- **★★★★★★ r16 — cumulative-RBAC awkward-case (PO flag, NON-BLOCKING):** total order `R<C<U<D<A<Admin` ทำให้ **A รวม D เสมอ** (role "อนุมัติได้แต่ห้ามลบ/void" = เป็นไปไม่ได้) และ **U รวม C เสมอ** (role "แก้ได้แต่ห้ามสร้างใหม่" เช่น Stock.U ↔ Stock.C = เป็นไปไม่ได้). ปอนด์ยืนยัน ladder เข้มแล้ว → implement ตามนี้; ถ้าต้องการ SoD ละเอียดกว่านี้ → exception flag รอบถัดไป. ดู `permission-matrix.md` §1a/§4.
- อื่น ๆ: **ไม่มี open question ค้าง**.

## 13. Cross-links
- Auth/session/RBAC → `settings.md` §4/§4b (cumulative)/`platform.md` · **★★★★★★ RBAC cumulative model (authoritative) → `permission-matrix.md` §1a** · Audit → `traceability.md` (§3/§4/§5b) · ledger → `stock.md` §2b/§3b/§6 · **★ number-on-save (G8) → `numbering-on-save.md`** · **★ r10 GR object → `goods-receipt.md`/`qc.md`/entity-status-map §1.8** · production/PO edit → `production.md`/`po.md` · **★★★ r11 Route/DN → `shipping.md`/`delivery-note.md`/entity-status-map §1.9/§1.10/`po.md` §4b** · **★★★★ r12 non-read+login audit + trace surface → `settings.md` US-SET-05/§4d · `traceability.md` §3.1/§5b** · **★ Return `RET-…` → `return.md`/`numbering-on-save.md` §4** · BOM → `bom.md` · supplier → `supplier.md` · negative stock → entity-status-map §1.6/§1.8 · reservation → stock-reservation · soft-delete/role → `deletion-policy.md` · Low alerting → `supply-planning.md` · comment → `comment-convention.md`.

## 14. Module changelog
- **Consolidated + updated:** NFR ทั้งหมด → NFR module เดียว.
- **★ DECIDED (2026-07-29):** Supply Planning proactive Low alerting + J8.
- **★ เพิ่ม (2026-07-29 — Quotation/comment/Stock/BOM/Supplier/Settings/Production/Supply Planning/number-on-save/QC+GR reviews):** (คงตามรอบก่อน — commit history)
- **★★★ เพิ่ม (2026-07-30 — Route/DN r11, ปอนด์ Module B/C):** **D-F2/D-F5** `SHP-…` → **`RT-…`** (Q1=A) · RT/DN gapless ต่อวัน; RT+DN popup NS7 · **AU1/AU3/AU4** Route/DN lifecycle + DN status-edit(A) + comment DN + ตัด FG ตอน DN "ส่งสำเร็จ" · **A4/A5/A7** DN status-edit = Shipping.A, DN = module แยก · **§6/§7/§9/§10/R4/R5** · **J3** overdue trigger = DN ส่งสำเร็จ · **D-F4** · **§12** Q1=A LOCKED.
- **★★★★ เพิ่ม (2026-07-30 — Audit non-read+login + Trace-surface r12, ปอนด์):** **AU1** rewrite = audit ครอบ "ทุกกิจกรรมที่ไม่ใช่การอ่าน" + login/logout/first-login-change · **AU2** retention 1 ปี ครอบ login · **AU4** Lot↔Return · **AU6 ใหม่** = trace surface · **A1/A6** login + password event = audit · **D-F4** · **§6/§7** login/logout = event ไม่ยิง noti · **§12** login-failure = audit.
- **★★ เพิ่ม (2026-07-31 — reconciliation M1+m4, ปอนด์):** **D-F2/D-F5** เพิ่มเลขใบคืน **`RET-{YYYYMM}-{NNNNNN}`** (แยกจาก Route `RT-…`) · **AU1/AU3/AU4/§10/§13** return ledger source RT→RET · **§15 ใหม่ = Deferred-controls register**.
- **★★★★★★ เพิ่ม (2026-07-31 — CUMULATIVE-level RBAC r16, ปอนด์):** **A3 rewrite** = RBAC generic RUCDAA+Admin bit → **cumulative per-module level (total order `R < C < U < D < A < Admin`)**: role ได้ระดับเดียวต่อ module, ระดับสูงรวม action ที่ต่ำกว่า (C < U), effective level = max ของ role Active · **A4** gate = ต้องระดับ ≥ min level ที่ปุ่มต้องการ · **A8** เพิ่ม force-override/undelete/role-matrix/จัดการ user = Admin · **AU1** config-change รวม role level edit · **§9** role editor = per-module level selector (usability) · **§12** flag awkward-case (A⊇D, U⊇C) non-blocking. authoritative = `permission-matrix.md` §1a · `settings.md` §4. ไม่กระทบ mapping ปุ่ม→รหัส (§3 permission-matrix เดิม) — เปลี่ยน semantics เป็น min level.
- **ไม่มีตัวเลขประดิษฐ์.**

## 15. ★ Deferred-controls register (relaxed-this-phase → re-tighten later) — NEW 2026-07-31
> รายการ **การควบคุมทางธุรกิจที่จงใจผ่อนในเฟสนี้** (มี note ในสเปกอยู่แล้ว แต่รวมไว้ที่เดียวเพื่อให้ปอนด์เห็นชัดทุก Gate และ QA เขียน AC ตามเจตนา — ไม่ใช่ bug/oversight). ปอนด์ยืนยัน/override ได้ที่ Gate.
| # | Deferred control | สถานะเฟสนี้ (relaxed) | เจตนาเมื่อ re-tighten | อ้างอิง |
|---|---|---|---|---|
| **DEF-1** | **Invoice Confirmed-gate** — สร้างใบแจ้งหนี้ได้กับ PO/SO **ทุกสถานะ** (แม้ยังไม่ Confirmed) | **ผ่อน:** ไม่ล็อกสถานะตอนสร้างใบ (create-no-status-lock) | ภายหลังจะกลับมาบังคับให้สร้าง Invoice ได้เฉพาะเมื่อ PO/SO ถึงสถานะที่กำหนด | `invoice.md` §7/§10 · README §2 · permission-matrix §3.1 (r13) |
| **DEF-2** | **RBAC separation-of-duties (SoD)** — total order สะสม `R<C<U<D<A<Admin` ทำให้ **A รวม D** และ **U รวม C** (ไม่แยก approve-without-delete / update-without-create) | **ผ่อน:** ใช้ ladder เข้มตามที่ปอนด์สั่ง (r16) — 1 ระดับ/module | ถ้าธุรกิจต้องการ SoD ละเอียด → เพิ่ม exception flag/action-level override นอก total order | `permission-matrix.md` §1a/§4 · `settings.md` §4 · non-functional §2 A3/§12 |
> วิธีดูแล: ทุกครั้งที่มี "การควบคุมที่จงใจผ่อน" ใหม่ ให้เพิ่มแถวที่นี่ + ชี้ไป module ต้นทาง. เมื่อ re-tighten แล้วให้ mark เป็น "CLOSED (วันที่)" ไม่ลบแถว.
