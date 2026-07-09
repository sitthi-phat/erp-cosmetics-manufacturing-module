# PO Review — Stage 2 Package (Gate 2) · ESSENCE Hub System

slug: `erp-v2-ui-first` · ตรวจโดย PO · 2026-07-09 · **รอบ 1 = PASS · รอบ 2 (depth-fix + tri-layer) = PASS + 1 จุดต้อง reconcile** · เปิด Gate 2
ขอบเขตตรวจ: BA `functional-spec/` (24 ไฟล์ · 69 stories/207 AC) + TL `architecture/` (index + db-schema + 17 api) + `docs/adr/001–009`

## สรุปภาษาไทย
ตรวจงาน BA และ Tech-Lead ครบทั้งสองฝั่งโดยเปิดไฟล์จริง — **ทุก journey จบทุก case**: entity ทุกตัว/ทุกสถานะ + cascade C1–C19 + 8 use case + 30 exception มี story+AC และมีตาราง DB/endpoint รองรับครบ · AC เขียนแบบ Given/When/Then วัดผลได้ อ้าง element จริงใน mockup และตรงกับกติกาล่าสุดทุกข้อ (PRD กดรับงานเอง, stock ติดลบ+FIFO retro-link, deletion 7 กติกา, VAT ตามวันออกใบ, เครดิตระดับลูกค้า, เลข gapless, session 06:00) · ฝั่ง TL มี endpoint ต่อทุก transition + schema รองรับทุก AC + 9 ADR + coverage ครบ · **รอบ 2:** BA แก้ depth ครบ (Home, Dashboard 29 tiles, Settings 5 จอ, Platform, list-conventions) + TL delta 8 ไฟล์ — tri-layer (spec↔API↔DB) ตรงกันเกือบทั้งหมด · **เจอ 1 misalignment ต้อง reconcile: สูตรมูลค่าสต็อก (BA per-lot 625 vs TL/DB latest-lot 675)** — ต้องเลือกสูตรเดียวก่อน build

---

## 1. ผลตรวจตามเกณฑ์ (รอบ 1)

### เกณฑ์ 1 — ทุก journey จบทุก case ✅
- **Entity + สถานะ (entity-status-map §1):** ครบทุก entity — Customer(6), PO 2 ราง, PRD(รอรับงาน→รับงาน→กำลังผลิต→รอ QC→พร้อมส่งมอบ/Rework/Hold), Batch, Lot, PR, GR, Shipment, DN, Invoice · แต่ละตัวมี module + story + ตาราง DB
- **Cascade C1–C19:** `continuity.html` มีครบ 17 แถว + 2 แถวเสริม (reassign, return) + Notification matrix 14 แถวพร้อม deep link ปลายทางถูกต้อง · ตรงกับ TL `architecture/index §7` (endpoint ต่อแถว) และ db-schema (outbox/notification/ack)
- **8 Use Case + เส้นวัตถุดิบ:** `walkthrough.html` เดินครบ UC1–UC8 + materials line ทุกขั้นผูก story (PO-191 draft, PO-188 Hold→Follow-up, PO-176 QC pass, PO-181 rework ราย line, PO-170 rework ครบวง, SHP-0044/45/46) — ตรง dataset กลาง
- **30 exception:** `rtm.html` §exception ผูกทุกกลุ่มกับ story จริง (วัตถุดิบขาด, ราคา 0, QC ไม่ผ่าน, Hold, reject/postpone, PR ค้าง, supplier inactive, BOM block, negative stock, void/gapless, soft-delete ฯลฯ)

### เกณฑ์ 2 — คุณภาพ AC (สุ่มลึก 5 module: PO/Production/Invoice/Stock/Customer) ✅
- ทุก story มี **Given/When/Then ครบ happy/edge/error** (≥3 AC/story) · อ้าง element จริง (ปุ่ม "ยืนยัน PO", การ์ด "เปลี่ยนสถานะ PO", คิว "รอรับงาน", badge "ติดลบ (รอรับเข้า)", ปุ่ม "รับงาน/เริ่มผลิต/ส่งตรวจ QC/ผลิตซ้ำ")
- **ตรงกติกาล่าสุดทุกข้อ:** PRD เกิดตอน "รับงาน" (ไม่ auto, US-PRD-01) · negative stock + FIFO retro-link (US-STK-03 edge) · VAT ยึด invoice date (US-INV-02) · เครดิตระดับลูกค้า + นับ overdue หลังส่งของ (US-INV-03) · void ไม่ลบ/gapless (US-INV-04) · deletion 7 กติกา + COGS out of scope (rbac-deletion) · Follow-up comment บังคับ (US-CUS-03)
- **ไม่พบ AC คลุมเครือ/วัดไม่ได้** ในกลุ่มที่สุ่ม

### เกณฑ์ 3 — ฝั่ง Tech-Lead ✅
- **API ครบทุก transition:** `api-production` = accept/start/submit-qc/rework/hold/resume (QC pass/fail อยู่ module QC ถูกต้อง) · index §7 coverage แสดง endpoint ต่อ cascade ครบ 1–19
- **DB รองรับทุก AC:** `production_queue_item`(รอรับงาน ไม่มีเลข)→`production_order`(PRD)→`batch`(run_no) · `stock_movement` append-only (lot_id null ช่วงติดลบ + reason retro_alloc) + `batch_material_consumption` เติม lot ย้อน FIFO · `sequence`(gapless) · `audit_log`(field-level) · `outbox/notification/notification_ack`(Read-bit + ack ราย user) · `vat_config`(effective date) · soft-delete columns ทุก master · `shipment` 1:N `delivery_note`(po 1:1) · `invoice_version`
- **NFR ครบ 9 ข้อ:** perf <2s เพดาน 3s, 50 users, >200 PO/วัน, audit 1 ปี+manual purge, Cloud SQL backup, UTC+พ.ศ., local+Google+session 06:00, gapless — map ไว้ใน §6
- **จุด TL ขอ confirm:** (ก) noti 14 เหตุการณ์ deep link ปลายทางถูก — ตรวจแล้วตรง continuity matrix · (ข) dashboard tile ใช้ list endpoint เดียวกับ drill (api-dashboard) — วางไว้ใน design แล้ว · (ค) QC ขาเข้า fail → Return — db-schema §qc/§return เชื่อม `qc_record(target=lot)`→`return_doc` (auto-raise) รองรับ

### เกณฑ์ 4 — ลิงก์ (สุ่มคลิก) ✅
เดิน index → module (po/production/stock) → mockup → api → db → กลับ — path ทั้งหมดถูก (`../architecture/api-*.html`, `../functional-spec/*.html`, `../../../requirements/…`, `../../../adr/…`) · ไม่พบเส้นตายในชุดที่สุ่ม

### เกณฑ์ 5 — ไม่ประดิษฐ์กติกาใหม่ ✅ (มี 1 จุดควรยืนยัน — ดู §2)
ทุกกติกาหลักอ้าง entity-status-map / deletion-policy / คำตอบปอนด์ที่บันทึกไว้ · ไม่มีกติกาที่ขัดกับที่ปอนด์ตอบ

---

## 2. ข้อ "ควรยืนยัน" ตอน review (ไม่บล็อก — polish/confirm)
1. **รอบ Active→Inactive = ชุด {1, 3, 6, 8} เดือน (default 3):** BA (US-CUS-02) + TL (db-schema customer) กำหนดชุดค่านี้ — ปอนด์เคยยืนยันแค่ "default 3 เดือน ปรับได้" · **ควรเคาะ**ว่าจำกัดชุดนี้ หรือให้กรอกอิสระ (จุดเดียว แก้ได้ทันทีถ้าต่าง)
2. **ตัวเลขสรุป stories/AC ไม่ตรงกัน:** index = ~47 stories/~141 AC, rtm = ~50/~150 — เป็นตัวเลขพาดหัว (coverage เท่ากัน) · ให้ BA sync ตัวเลขให้ตรง (cosmetic)
3. **ลิงก์ anchor เล็กน้อย:** US-PRD-06 (Potential Delay) อ้าง `continuity.html#c16` (ซึ่งเป็น stock-ติดลบ) — ควรชี้แถว noti ของ Potential Delay โดยตรง (cosmetic)

> ทั้ง 3 ข้อไม่กระทบความครบของ requirement — เป็นการ confirm ค่า 1 จุด + จัดหน้าตา 2 จุด · ไม่ต้องวนกลับก่อนเปิด Gate 2

---

## 5. รอบ 2 — Depth-fix + Tri-layer Alignment (spec ↔ API ↔ DB)

### 5.1 ผลตรวจ depth-fix (Pond Gate-2 feedback) — ผ่านทุก module ตาม Depth Standard §1 ของ po-spec-depth-audit
| module | ก่อน | หลัง (ตรวจแล้ว) |
|---|---|---|
| **Dashboard** | 2 story | **US-DSH-01..04 (behavior) + 7 story รายแผนก (SALE/STK/PRD/QC/SHP/FIN/ADM)** ครบ 29 tile — ทุก tile มีตารางสูตรนับ/เงื่อนไข/ชนิด event-state/drill columns→ปลายทาง/สิทธิ์ Read + date-filter behavior + refresh คง view + multi-role ✅ |
| **Home** | ไม่มี | **US-HOME-01..03** task-inbox ราย role (scope=Read) + quick actions + onboarding (Lot vs Batch) + empty/error · นับ source เดียวกับ dashboard/noti ✅ |
| **Settings** | 2 story | **US-SET-01..05** ครบ 5 จอ (Role+Admin bit / User+Google+เปิดปิด+**bulk-reassign ก่อนลบ Sale** / VAT+ประวัติ / บริษัท / Audit-log screen) ✅ |
| **Platform** | 3 story | **US-PLT-01..05** — session warning ก่อน 06:00 · noti routing Read-bit · **noti panel** (grouping/mark-all/badge "9+"/empty/ดูทั้งหมด) · **global search** · responsive+RBAC ✅ |
| **PO** | 6 story | +**US-PO-07 suggest/material-calc** (ราคา default ต่อชนิด, ΣBOM×qty vs on_hand, shortBy, เตือนไม่บล็อก) ✅ |
| **Stock** | 4 story | +**US-STK-05 มูลค่าสต็อก** ✅ (ดู 5.3 — สูตรต้อง reconcile) |
| **cross-cutting** | — | +**list-conventions US-LST-01** (search/filter/sort/page-size/empty ต่อ 10 หน้า list) ✅ |

### 5.2 Tri-layer alignment (AC ใหม่ ↔ API ↔ DB) — สุ่มลึก
| AC group | API (TL) | DB (TL) | ผล |
|---|---|---|---|
| Dashboard 29 tiles | `api-dashboard` — ต่อ tile มี tileKey + summary + list(drill) endpoint + drill columns→deepLink; date filter `?range=`; **สิทธิ์ = Read module (ไม่ใช่ role)** | per-tile source ครบใน db-schema | ✅ ตรงเป๊ะ (tileKey ↔ ตาราง BA) |
| Home task-inbox | `/api/home` = aggregator ของ `/api/notifications` + `/api/dashboard/departments` (ไม่มี endpoint ใหม่) | reuse | ✅ ตรง Home spec "นับ source เดียว" |
| Global search US-PLT-04 | `/api/search?q=` ครอบ customer/po/invoice/material/lot/batch/prd/supplier/bom/dn จัดกลุ่มตาม type + deepLink + **กรองตาม Read** + ซ่อน soft-deleted | index prefix/like บนเลขเอกสาร/ชื่อ | ✅ |
| Settings 5 จอ + bulk-reassign | `DELETE /api/users/{id}` ต้องมี `reassignToUserId` → ย้ายลูกค้า/งานทั้งหมด **ทรานแซกชันเดียว + audit ต่อรายการ** + `reassignable-load` | user/role_permission/audit | ✅ ตรง deletion §2.2 |
| US-PO-07 suggest | `POST /api/po/suggest` → ราคา default (BOM.sell_price / material.default_sell_price), ΣΒΟΜ×qty, required vs on_hand, shortBy, เตือนไม่บล็อก+PR | bom_line, stock_balance | ✅ |
| US-STK-05 มูลค่าสต็อก | `GET /api/stock/value` (on_hand, latest lot buy_price, value) | **lot.buy_price + received_at + IDX (material_id, received_at desc)** เพิ่มแล้ว | ⚠ **สูตรไม่ตรง BA — ดู 5.3** |
| list-conventions | `api-list-conventions` | — | ✅ |
| session warning | `GET /api/auth/session` (expiresAt + nextForcedResetAt) | app_config.session_epoch | ✅ |

### 5.3 ตัดสิน 2 จุดที่ TL ขอ confirm
- **(ก) Admin เห็นทุกแผนก? → ยืนยันปิด (Read-bit ล้วน).** ทั้ง `dashboard US-DSH-04` และ `api-dashboard §perm` implement "ยึด Read ของ module ไม่เกี่ยว role" ตรงคำตอบปอนด์แล้ว · หมายเหตุ: `api-dashboard §admin` ยังมี note "[ยังต้องยืนยัน PO/ปอนด์]" ค้าง → **PO ยืนยันแล้ว = Read-bit ล้วน; ให้ TL ลบ flag นั้น** (โค้ด/ดีไซน์ถูกแล้ว ไม่ต้องแก้ logic)
- **(ข) มูลค่าสต็อก — ⚠ MISALIGNMENT (M1) ต้อง reconcile:** สองชั้นตีความคำปอนด์ "ราคาซื้อล่าสุดของ Lot" ต่างกัน:
  - **BA** (`US-STK-05` + `US-DSH-STK`): **per-lot** = Σ ทุก lot (lot.on_hand × buy_price ของ lot นั้น) · ตัวอย่าง glycerin (10@40)+(5@45) = **625**
  - **TL/DB** (`db-schema lot`, `api-stock/value`, `api-dashboard stock_value`): **latest-lot** = total on_hand × buy_price ของ lot ที่รับล่าสุด · = 15×45 = **675**
  - **PO ตัดสิน/แนะนำ:** ใช้ **per-lot (625)** — แม่นกว่า (แต่ละ lot ตามที่จ่ายจริง), ตรงกับโครง `stock_balance` ราย (material,lot) + `lot.buy_price`, รองรับ lot ติดลบตรงไปตรงมา, และยัง "ไม่ใช่เฉลี่ยถ่วงน้ำหนัก" ตามที่ปอนด์สั่ง · **ถ้าปอนด์ยืนยัน per-lot → TL แก้ wording db-schema/api-stock/api-dashboard เป็น "Σ per lot (lot.on_hand × lot.buy_price)"** (1 บรรทัดต่อไฟล์) · ถ้าปอนด์ต้องการ latest-lot จริง → BA แก้ตัวอย่าง 625→675 + Data rules · **ไม่ block Gate 2 (tile "Should") แต่ต้องเลือกก่อน Stage 3**

### 5.4 HTTP :3000 (กติกาบังคับ) — PO ทำเองไม่ได้ในรอบนี้
เครื่องมือ PO รอบนี้มีแค่ไฟล์ (Read/Write/Grep/Glob) **ไม่มี shell/browser** → ตรวจ content/alignment ครบด้วยการเปิดไฟล์จริงแล้ว (spec เป็น static self-contained HTML no-build) แต่ **curl/เปิด render จริงบน :3000 ต้องให้ agent ที่มี browser (ux-ui) หรือ dispatcher ยืนยันก่อนเชิญปอนด์** — flag ไว้เป็น pre-invite check (คาดว่าผ่านเพราะ no-build HTML แต่ควร render ยืนยัน)

---

## 3. คู่มือ review Gate 2 สำหรับปอนด์ (~15 นาที · อัปเดตชี้ของใหม่)

**เริ่มที่:** `functional-spec/index.html` (สารบัญ BA · เปิดผ่าน http://localhost:3000/…) + `architecture/index.html` (TL)

| ลำดับ | เปิดหน้า | ดูอะไร (นาที) |
|---|---|---|
| 1 | functional-spec/**walkthrough** | เดิน 8 use case — เห็นภาพรวมทั้งระบบใน 1 หน้า (~3) |
| 2 | functional-spec/**dashboard** ★ใหม่ | **7 แผนก × 29 tile** — กด US-DSH-STK/SALE ดูตารางสูตร+ชนิด event/state + date-filter behavior (ที่ปอนด์ทักว่าตื้น — แก้แล้ว) (~3) |
| 3 | functional-spec/**home** ★ใหม่ | "งานที่รอคุณอยู่" task-inbox ตาม role + onboarding (~1.5) |
| 4 | functional-spec/**platform** ★ใหม่ | global search + noti panel (grouping/mark-all/9+) + session warning (~1.5) |
| 5 | functional-spec/**settings** ★ขยาย | 5 หน้าจอครบ (User + bulk-reassign, Audit-log screen) (~1) |
| 6 | functional-spec/**production** + **stock** US-STK-03 | รอรับงาน→รับงาน+negative stock+FIFO retro (~2) |
| 7 | architecture/**index** §1–2 diagram + §7 coverage · (ทางเลือก) **db-schema** §material | system/service diagram + stock ledger ติดลบ (~2) |

**จุดตัดสินใจที่ควรยืนยันตอน review:**
- ✅ requirement + NFR + depth ครบพอเริ่ม dev หรือยัง (Gate 2 = อนุมัติสิ่งนี้)
- ❓ **สูตรมูลค่าสต็อก (M1):** per-lot 625 (PO แนะนำ) หรือ latest-lot 675 — เคาะ 1 คำ (§5.3ข)
- ❓ รอบ Active→Inactive: ชุด {1,3,6,8} หรือกรอกอิสระ (§2 ข้อ 1)
- ✅ ยืนยัน COGS/valuation อยู่นอก scope (BA/TL ตั้งตามคำตอบปอนด์)
- ✅ ถ้าอนุมัติ → Stage 3 (Engineer ∥ QA ∥ BA); อยากปรับ UI → วน Stage 1 incremental

---

## 4. สถานะ handoff
- **รอบ 1 = PASS · รอบ 2 (depth+tri-layer) = PASS** (depth-fix ครบ, spec↔API↔DB ตรง) → เปิด **Gate 2**
- **ต้อง reconcile ก่อน Stage 3:** M1 สูตรมูลค่าสต็อก (per-lot vs latest-lot) — เคาะที่ review
- **ให้ TL:** ลบ flag "[ยังต้องยืนยัน]" ใน api-dashboard §admin (PO ยืนยัน Read-bit ล้วนแล้ว) + แก้ wording สูตรมูลค่าสต็อกตามที่ปอนด์เคาะ
- **ให้ dispatcher/ux-ui:** render check :3000 ก่อนเชิญปอนด์ (PO ไม่มี browser tool)
- **cosmetic (§2):** BA sync ตัวเลข story/AC + anchor US-PRD-06
