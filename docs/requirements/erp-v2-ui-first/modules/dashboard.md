# Module — Dashboard รายแผนก (×7) · ★ LANDING หลัง login

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 (**+ Shipping tiles → Route/DN r11 2026-07-30 · + Home removed → Dashboard = landing + per-department Read-scoped day-to-day + contextual date-range r14 2026-07-30**) · **AUTHORITATIVE SPEC** (absorbs functional-spec `dashboard.html` US-DSH-01..04 + 7 dept stories, 29 tiles)
Mockups: `mockups/dashboard.html`
กฎอ้างอิง: po-spec-depth-audit §2.2 (นิยาม tile) · status-journeys §12 · stock-reservation (Available/valuation) · RUCDAA Read scope · README §3 (G1–G3) · **`delivery-note.md` §7 (DN 6 สถานะ) · `po.md` §4b (PO/SO สะท้อน DN)** · **`platform.md` (login → เข้า Dashboard เป็น landing; noti bell = source เดียว)**

## สรุปภาษาไทย
**★ Dashboard = หน้าแรกหลัง login (landing page)** — โมดูล Home ถูกตัดทิ้ง (2026-07-30); ไม่มี task-inbox แยกอีกต่อไป งานประจำวันดูจาก Dashboard นี้. Dashboard 7 แผนก: **Sale(5) · Stock(4) · Production(4) · QC(4) · Shipping(4) · Finance(4) · Admin(4) = 29 tile**. **★ วัตถุประสงค์:** **แต่ละ "แผนก" (department) ที่มีสิทธิ์ Read ของ module นั้น เห็นงานประจำวัน (day-to-day work) ของตนเอง** — **visibility = permission Read ต่อแผนก ล้วน ๆ (ไม่เกี่ยวชื่อ role)**; user ที่มี Read หลายแผนกสลับดูด้วย tab/selector. แต่ละ tile ระบุชนิด **event (ในช่วง)** = นับเหตุการณ์ตาม date-filter หรือ **state (ตอนนี้)** = snapshot ไม่ขึ้นกับช่วง. **★ date-range search รายแผนก (contextual):** แต่ละ view แผนกมีตัวกรองช่วงวันที่ที่มีความหมายกับข้อมูลแผนกนั้น (default = เดือนนี้; presets วันนี้/สัปดาห์นี้/เดือนนี้/กำหนดเอง) **+ dropdown "ชนิดวัน (date-type)" ที่ที่ข้อมูลแผนกมีหลายแกนวัน** (เช่น Shipping = วันสร้าง Route/วันออกส่ง · Finance = วันออกใบ/วันครบกำหนด · Sale = วันสร้าง PO). auto-refresh 15s (default, คง view/drill/filter). ทุก tile drill-down → list + pagination + deep link พร้อม context. **"ใกล้หมด" เทียบ Available (on_hand−Reserved) เฉพาะที่ตั้ง threshold** · **มูลค่าสต็อก = Σ(on_hand ต่อ lot × ราคาซื้อล่าสุดของ lot) ไม่หัก Reserved** (COGS นอก scope). **★ r11: Shipping tiles ใช้ DN 6 สถานะใหม่ + Route (`RT-…`, ไม่มี SHP).** ตัวเลขต้องตรงกับ **notification badge** ของ user คนเดียวกัน (source เดียว).

---

## 1. Purpose
**เป็นหน้าแรกหลัง login (landing)** และเป็นที่ที่ **แต่ละแผนกเห็นงานประจำวันของแผนกตน** เป็น tile + KPI พร้อม drill ลงไปทำงานต่อได้ทันที — **การมองเห็นยึดสิทธิ์ Read ต่อ module/แผนก ล้วน ๆ** (ไม่ผูกชื่อ role) ตามกฎ "dashboard visibility = Read permission". ตัวเลขเป็นความจริงเดียวกับ notification (`platform.md`). *(โมดูล Home / task-inbox เดิมถูกตัดทิ้ง — Dashboard รายแผนกทำหน้าที่แสดงงานประจำวันแทน; แจ้งงานข้ามแผนกยังผ่าน Notification bell.)*

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `dashboard.html` | **หน้าแรกหลัง login (landing)** · 7 แผนก (สลับตาม Read) · **date-range รายแผนก (presets + custom + date-type ตามบริบทแผนก)** · tile drill-down + pagination · refresh/auto-15s toggle + เวลารีเฟรชล่าสุด |

## 3. โครง tile (29) + ชนิด + สูตร + drill
### 3.1 Sale (5) · Read Sale
| tile | สูตร/เงื่อนไข | ชนิด | drill → ปลายทาง |
|---|---|---|---|
| ลูกค้าประจำ | count(customer.status=ลูกค้าประจำ AND มี order ในช่วง) | event | ชื่อ/สถานะ → customer-detail |
| ห่างหาย | count(customer→ห่างหาย ในช่วง โดย scheduler; เกณฑ์ inactive_after_months default 3, ชุด {1,3,6,8}) | event | ชื่อ/เหตุ → customer-detail |
| PO | count(po.created_date ในช่วง) | event | PO/ลูกค้า/สถานะ → po-detail |
| รอชำระ | count(invoice.status=รอชำระ AND ยังไม่เกินกำหนด AND issued ในช่วง) | event | INV/ลูกค้า/ครบกำหนด → invoice-detail |
| ต้องติดตาม | count(customer.status=ต้องติดตาม ที่ยังค้าง) | **state** | ชื่อ/เหตุผล(comment) → customer-detail |
> **date-type (Sale):** ค่าเริ่ม = วันที่สร้าง PO/ออร์เดอร์ (แกนหลักของแผนกขาย).

### 3.2 Stock (4) · Read Stock
| tile | สูตร/เงื่อนไข | ชนิด | drill |
|---|---|---|---|
| ใกล้หมด | count(วัตถุดิบที่ **Available (on_hand−Reserved) ≤ low_stock_threshold**; เฉพาะที่ตั้ง threshold — null=ไม่นับ) | **state** | วัตถุดิบ/ใช้ได้ → stock |
| ล็อตรอ QC | count(lot.qc_status=รอตรวจรับ) | **state** | lot/วัตถุดิบ → qc |
| คำขอ PR ค้าง | count(PR.status ∈ {เปิดคำขอ, รับทราบ, รับบางส่วน}) | **state** | PR/วัตถุดิบ/สถานะ → pr |
| มูลค่าสต็อก | Σ(**on_hand** ต่อ lot × ราคาซื้อล่าสุดของ lot) · **ไม่หัก Reserved** · lot on_hand ติดลบหักลบยอด | **state** | วัตถุดิบมูลค่าสูงสุด → stock |
> **date-type (Stock):** ส่วนใหญ่เป็น state (snapshot) ไม่ผูกช่วง; event ใด ๆ (เช่น GR ในช่วง) ใช้แกน วันที่รับเข้า (GR).

### 3.3 Production (4) · Read Production
| tile | สูตร | ชนิด | drill |
|---|---|---|---|
| คิวงานผลิต | count(รอรับงาน) + count(PRD ∈ {รับงาน,กำลังผลิต,รอ QC,Rework}) — caption "รอรับงาน X + ในสายผลิต Y" | **state** | รายการ/สถานะ → production |
| เสี่ยงล่าช้า | count(PRD potential_delay=true; เกณฑ์ 2 วันผลิต + 1 วันส่ง เทียบวันต้องการรับ) | **state** | PRD/เหลือกี่วัน → production |
| พักงาน (Hold) | count(PRD.status=พักงาน) | **state** | PRD/เหตุ Hold → production |
| ผลิตเสร็จ | count(Batch ผ่าน QC หรือ PRD→พร้อมส่งมอบ ในช่วง) | event | PRD/สถานะ → production |
> **date-type (Production):** event "ผลิตเสร็จ" ใช้แกน วันที่ QC ผ่าน/พร้อมส่งมอบ.

### 3.4 QC (4) · Read QC
| tile | สูตร | ชนิด | drill |
|---|---|---|---|
| ล็อตรอตรวจรับ | count(lot.qc_status=รอตรวจรับ) | **state** | lot → qc |
| แบตช์รอ QC | count(batch.status=รอ QC) | **state** | batch → qc |
| ผ่าน QC | count(qc_record.result=ผ่าน ในช่วง; รวม lot+batch) | event | รายการ/ชนิด → qc |
| รอทำใบคืน | count(lot.qc_status=ระงับ AND ยังไม่มี return_doc) | **state** | lot เสีย → return |
> **date-type (QC):** event "ผ่าน QC" ใช้แกน วันที่ตัดสิน QC.

### 3.5 Shipping (4) · Read Shipping · **★ r11 Route/DN**
| tile | สูตร | ชนิด | drill |
|---|---|---|---|
| รอจัดส่ง | count(PO/SO delivery-status=พร้อมจัดส่ง — ยังไม่มี DN active; **รวม order ที่ DN=ลูกค้าเลื่อนส่ง/ลูกค้ายังไม่กำหนดวันรับใหม่ รอ re-route**) | **state** | PO/SO/ลูกค้า/เหตุ → shipping |
| กำลังจัดส่ง | count(DN.status ∈ {อยู่ระหว่างการเตรียม, อยู่ระหว่างจัดส่ง}) | **state** | Route/DN → delivery-note |
| ส่งสำเร็จ | count(DN→ส่งสำเร็จ ในช่วง) | event | DN → delivery-note |
| เลื่อน/ยกเลิก | count(DN→ลูกค้าเลื่อนส่ง หรือ ลูกค้ายกเลิก หรือ ลูกค้ายังไม่กำหนดวันรับใหม่ ในช่วง) | event | PO/SO/เหตุ → delivery-note |
> **date-type (Shipping):** dropdown {วันที่สร้าง Route · วันที่ Route ออกไปส่ง} — สอดคล้อง `delivery-note.md` §11 (ค้น DN ตามชนิดวัน).

### 3.6 Finance (4) · Read Finance/Invoice
| tile | สูตร | ชนิด | drill |
|---|---|---|---|
| รอวางบิล | count(PO.billing=ยังไม่วางบิล AND fulfil ≥ ยืนยันแล้ว) | **state** | PO → invoices |
| ค้างชำระ | count(invoice ครบกำหนดในช่วง AND ยังไม่จ่าย) | event | INV/ลูกค้า/+วัน → invoice-detail |
| รับชำระ | Σ(ยอดรับชำระในช่วง) — **เป็นยอดเงิน ไม่ใช่ count** | event | รายการรับชำระ → invoice-detail |
| เกินกำหนด | count(invoice.status=เกินกำหนด ที่ยังค้าง) | **state** | INV/+วัน → invoice-detail |
> **date-type (Finance):** dropdown {วันที่ออกใบแจ้งหนี้ · วันที่ครบกำหนดชำระ · วันที่รับชำระ} — เลือกแกนตาม tile (ค้างชำระ=ครบกำหนด · รับชำระ=วันรับชำระ). สอดคล้อง `invoice.md` (VAT ตาม invoice date · overdue นับจาก DN ส่งสำเร็จ).

### 3.7 Admin (4) · Read Admin/Settings
| tile | สูตร | ชนิด | drill |
|---|---|---|---|
| ผู้ใช้ทั้งหมด | count(user ที่ไม่ถูก soft-delete) | **state** | user/role/สถานะ → settings |
| Role | count(role) | **state** | role/จำนวนสิทธิ์ → settings |
| เข้าใช้ | count(login events ในช่วง) | event | user/เวลา → trace |
| เหตุการณ์ trace | count(audit_log ในช่วง) | event | audit ล่าสุด → trace |
> **date-type (Admin):** event ใช้แกน เวลาเกิดเหตุการณ์ (login/audit timestamp).

## 4. User Stories (absorbed) + AC สรุป
- **US-DSH-00 (Must) — Dashboard = landing หลัง login:** login สำเร็จ (`platform.md` US-PLT-01) → เข้า **Dashboard** เป็นหน้าแรก (ไม่มีหน้า Home อีกต่อไป). ผู้ใช้เห็นเฉพาะแผนกที่มี Read; ไม่มีแผนกใดมี Read → เห็นหน้าว่างพร้อมข้อความ "ยังไม่มีสิทธิ์ดูแดชบอร์ดของแผนกใด" (ไม่ error).
- **US-DSH-01 (Must) — auto-refresh 15s คง view/drill:** ครบ 15s หรือกด refresh → ตัวเลขอัปเดตแต่คง drill+filter เดิม + "อัปเดตล่าสุด HH:MM:SS". ปิด toggle = ไม่รีเฟรชเอง. โหลด aggregate ล้มเหลว → คงค่าเดิม + แถบเตือน (ไม่ล้างเป็นค่าว่าง).
- **US-DSH-02 (Must) — drill-down → list + pagination + deep link พร้อม context:** กด tile → list เบื้องหลัง + คอลัมน์ที่กำหนด + pagination; คลิกแถว → module ปลายทางพร้อม context. tile=0 → empty state "ไม่มีรายการ". drill รายการที่ไม่มีสิทธิ์ Read ปลายทาง → 403.
- **US-DSH-03 (Must) — date filter รายแผนก (presets + custom + date-type) + event/state:** default เดือนนี้ · presets วันนี้/สัปดาห์นี้/เดือนนี้/กำหนดเอง (เดือน-ปี หรือ range) · **★ dropdown "ชนิดวัน (date-type)" ต่อ view แผนกที่ข้อมูลมีหลายแกนวัน (§3 หมายเหตุ date-type)**. เปลี่ยนช่วง/แกนวัน → tile **event** รีคำนวณพร้อมกัน, tile **state** คงค่า snapshot. custom + คง drill ที่เปิดอยู่ (ไม่เด้งปิด). เริ่ม>สิ้นสุด = error "ช่วงวันที่ไม่ถูกต้อง" + **ไม่ยิง query**.
- **US-DSH-04 (Must) — เห็นแผนกตาม Read + สลับ (visibility = Read permission ต่อแผนก):** ตัวสลับแสดงเฉพาะแผนกที่มี Read (ยึด permission ล้วน ๆ ไม่ผูกชื่อ role). 1 แผนก = ไม่มีตัวสลับ; มีครบ = 7 แผนก. URL แผนกที่ไม่มีสิทธิ์ = 403. **แต่ละแผนกเห็น "งานประจำวันของแผนกตน" (day-to-day) ผ่าน tile ของแผนกนั้น.**
- **7 dept stories (SALE/STK/PRD/QC/SHP/FIN/ADM):** ตาราง §3 = นิยาม/สูตร/ชนิด/drill/date-type ครบทุก tile + AC happy/edge/error ต่อแผนก (เช่น มูลค่าสต็อก on_hand ไม่หักจอง; ใกล้หมด=Available เฉพาะ threshold; คิวงานแยกรอรับงาน/ในสายผลิต; รับชำระ=ยอดเงิน; ผู้ใช้ไม่นับ soft-delete; **★ r11 Shipping = DN 6 สถานะ/Route**).

## 5. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| เห็นแผนก X + tile | **Read (R)** ของ module ที่ map กับแผนก X |
| drill → module ปลายทาง | **Read (R)** ของ module ปลายทาง (ไม่มี = 403) |
| เปลี่ยน filter (ช่วง/date-type) / toggle refresh | Read (view-level, ไม่มี write) |
> Dashboard เป็น read-only (ไม่มี write action). **visibility = Read permission ต่อแผนก ล้วน ๆ (ไม่เกี่ยวชื่อ role).**

## 6. Data rules
- **★ Dashboard = landing หลัง login** (ไม่มี Home). งานประจำวันรายแผนก = tile ของแผนกที่ user มี Read.
- 7 แผนก / 29 tile · แสดงตาม Read ราย module · สลับได้ถ้ามีหลายแผนก · **visibility = Read permission ต่อแผนก (ไม่ผูก role)**.
- ชนิด tile: event = นับในช่วง filter · state = snapshot ปัจจุบัน · caption ระบุ "ในช่วง"/"ตอนนี้".
- **★ date-range รายแผนก (contextual):** filter default เดือนนี้ · presets + custom · **+ date-type dropdown ที่ข้อมูลแผนกมีหลายแกนวัน (§3)** · มีผลกับทุก tile event พร้อมกัน · เริ่ม>สิ้นสุด = error ไม่ยิง query.
- refresh auto 15s (default) คง filter+view+drill · ปิดได้ · แสดงเวลารีเฟรชล่าสุด.
- drill → list + pagination + deep link · tile=0 → empty state.
- **ใกล้หมด = Available (on_hand−Reserved) ≤ threshold, เฉพาะที่ตั้ง (null=ไม่นับ)**.
- **มูลค่าสต็อก = Σ(on_hand ต่อ lot × ราคาซื้อล่าสุดของ lot), ไม่หัก Reserved, COGS นอก scope**.
- **★ r11 Shipping tiles = ยึด DN 6 สถานะ (delivery-note.md §7) + PO/SO delivery status สะท้อน DN (po.md §4b)** · Route = `RT-…` (ไม่มี SHP).
- สิทธิ์ = Read bit ของ module (ไม่เกี่ยวชื่อ role) · ไม่มี = ไม่อยู่ในตัวสลับ + URL ตรง 403.

## 7. Pagination / Search
- drill-down list ทุกอัน: 20/หน้า (G1) + pagination · drill คง state ตอนกลับ (G3).

## 8. Formulas (สรุป — เป็นความจริงเดียวกับ module ต้นทาง)
- ใกล้หมด: `Available = on_hand − Reserved`; นับเมื่อ `Available ≤ threshold` และ `threshold ≠ null`.
- มูลค่าสต็อก: `Σ_lot (on_hand_lot × last_buy_price_lot)` (lot ติดลบ = ค่าติดลบ) — ตรงกับ `stock.md` US-STK-05.
- คิวงานผลิต: `count(รอรับงาน) + count(PRD ∈ active-production states)`.
- **★ r11 กำลังจัดส่ง:** `count(DN.status ∈ {อยู่ระหว่างการเตรียม, อยู่ระหว่างจัดส่ง})` · **ส่งสำเร็จ:** `count(DN→ส่งสำเร็จ ในช่วง)` · **เลื่อน/ยกเลิก:** `count(DN→ลูกค้าเลื่อนส่ง/ลูกค้ายกเลิก/ลูกค้ายังไม่กำหนดวันรับใหม่ ในช่วง)`.
- รับชำระ = `Σ ยอดรับชำระในช่วง` (เงิน, ไม่ใช่ count).

## 9. Cross-links
- ตัวเลขตรงกับ `platform.md` (noti badge, source เดียว) — **ไม่มี Home task inbox แล้ว**. ใกล้หมด/มูลค่า ↔ `stock.md` (3 ยอด). tile ↔ module ปลายทางทุกอัน. สิทธิ์ Read ↔ `permission-matrix.md`. **★ Shipping tiles ↔ `delivery-note.md` §7 / `shipping.md` §4 / `po.md` §4b.** date-type Shipping ↔ `delivery-note.md` §11 · Finance ↔ `invoice.md`.

## 10. Module changelog
- **Absorbed:** functional-spec `dashboard.html` US-DSH-01..04 + 7 dept stories (11 stories, 33 AC, 29 tile) verbatim ในความหมาย.
- **★ UPDATED (2026-07-30 — Route/DN r11):** Shipping (4) tiles ใช้ **DN 6 สถานะใหม่** — "กำลังนำส่ง"→**"กำลังจัดส่ง"** (อยู่ระหว่างการเตรียม+อยู่ระหว่างจัดส่ง), "ส่งถึงแล้ว"→**"ส่งสำเร็จ"**, "เลื่อน/ปฏิเสธ"→**"เลื่อน/ยกเลิก"** (ลูกค้าเลื่อนส่ง/ยกเลิก/ยังไม่กำหนดวัน); "รอจัดส่ง" = PO/SO delivery-status พร้อมจัดส่ง + order รอ re-route; **drill = Route/DN → delivery-note (ไม่มี SHP)**. §3.5/§6/§8/§9.
- **★★ UPDATED (2026-07-30 — Home removed → Dashboard landing, ปอนด์ r14):** **(1) Dashboard = หน้าแรกหลัง login (landing)** แทน Home ที่ถูกตัดทิ้ง (US-DSH-00 ใหม่, §1/§2/§6). **(2) วัตถุประสงค์ชัด:** แต่ละ **แผนก** ที่มี Read เห็น **งานประจำวัน (day-to-day) ของตน** — **visibility = Read permission ต่อแผนก ล้วน ๆ (ไม่เกี่ยวชื่อ role)** (§1/§4 US-DSH-04/§5/§6). **(3) date-range รายแผนก (contextual)** + **date-type dropdown** ที่ข้อมูลแผนกมีหลายแกนวัน (Shipping/Finance/Sale/Production/QC/Admin — §3 หมายเหตุ date-type · US-DSH-03 · §6). **(4) ตัด cross-link ไป Home task inbox** — ตัวเลข = source เดียวกับ notification (`platform.md`) (§9). ตรวจ statuses ทั้งหน้าให้ตรงโมเดลล่าสุด (DN 6 สถานะ/Route/PO-status-from-DN/QC-gated) — ไม่มี SHP/ส่งถึงแล้ว/In Delivery ค้าง.
- **คงเดิม:** event/state typing · ใกล้หมด=Available · มูลค่า=on_hand ไม่หักจอง · Read-scope visibility · single-source count.
