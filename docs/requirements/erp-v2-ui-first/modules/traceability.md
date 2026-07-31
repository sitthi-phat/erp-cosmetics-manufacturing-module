# Module — Traceability + Field-level Audit

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 (**+ Route/DN r11 2026-07-30** · **+ Trace-surface + Audit-log review r12 2026-07-30** · **+ Return source RT→RET 2026-07-31**) · **AUTHORITATIVE SPEC** (absorbs functional-spec `traceability.html` US-TRC-01..03)
Mockups: `mockups/trace.html`
กฎอ้างอิง: GMP (Lot→Batch→FG) · `settings.md` US-SET-05 · stock ledger (reason/source, D15) · Glossary · README §3 · **`quotation.md` §10** · **`comment-convention.md`** · **`stock.md` §3b/§6** · **`bom.md` §5c/§9** · **`supplier.md` §10** · **`production.md` §5/§7 + `po.md` §5.2** · **`supply-planning.md` §5b/§5c** · **`goods-receipt.md` §4/§9 + `qc.md` §4.1** · **★ `shipping.md` (Route) + `delivery-note.md` (DN) + `po.md` §4b (PO/SO delivery status = สะท้อน DN)** · **`return.md` (Return `RET-…`)** · **`non-functional.md` §3 (AU1–AU5 audit NFR)**

## สรุปภาษาไทย
สืบย้อน GMP + audit ระดับ field: **entity selector** + **date range + time** · **genealogy Lot→Batch→line→PO→ลูกค้า→DN/INV** · **ตาราง field-audit** · **archive text file (Super User)**. retention online 1 ปี. เป็นแหล่ง audit เดียวกับ Settings Audit-log. **★ ทุก stock movement มี reason/source + Lot/FIFO ref (D15).** **★★ r10 GR/QC: GR object lifecycle + credit on QC pass.** **★ Production/PO edit/comment ทุก object audit.** **★★★ r11 Route/DN: Route (`RT-…`, ★ เดิม SHP) + DN (6 สถานะ) มี lifecycle + comment audit; ★ แก้สถานะ DN โดยตรง (สิทธิ์ A) audit; ★ PO/SO delivery status = สะท้อน DN (trace ผ่าน DN ต้นทาง).** **★★★★ r12 (2026-07-30 — ปอนด์ trace-surface review):** **(1) trace ครอบ "ทุก object/ธุรกรรม" ชัดเจน** (transactional + master + comment/field edit — §3 ระบุครบ, **เพิ่ม Return เป็น entity**). **(2) Entity/topic SELECTOR** (dropdown/tab เลือก topic: QT/PO/SO/PRD/Batch/DN/Route/Invoice/PR/GR/Return/Lot/RM/Customer/Supplier/BOM-FG…). **(3) ค้นด้วย id/key ของงานนั้น** (เลข QT/PO/Lot/Batch/RT/DN/INV/เลขใบคืน RET/ลูกค้า/รหัส RM…) **+ ช่วงวันที่ + dropdown ชนิดวัน (date-type)** ตาม pattern G2 ทั้งระบบ. **(4) Sample case ต่อ object** — trace ต้อง "โชว์ตัวอย่างจริง forward+backward" ต่อชนิด object (ให้ reviewer/QA เห็นว่าแต่ละ object สืบได้จริง). **(5) audit ครอบ "ทุกกิจกรรมที่ไม่ใช่การอ่าน" รวม login/logout** (ดู `settings.md` US-SET-05 + `non-functional.md` AU1). **★ ใบคืนใช้เลข `RET-…` (คนละ prefix กับ Route `RT-…`, reconcile 2026-07-31).**

---

## 1. Purpose
ตอบคำถาม GMP/ตรวจสอบได้ทุกกรณี: "ของชิ้นนี้มาจาก Lot ไหน ผลิต Batch ไหน ขายใคร ส่งด้วย Route/DN ใด" และ "ใครแก้ค่าอะไร เมื่อไหร่ เพราะอะไร" — ครบทุก entity + ทุก field + **ทุกกิจกรรมที่ไม่ใช่การอ่าน (รวม login/logout)**.

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `trace.html` | **entity/topic selector (dropdown/tab)** + field · **ค้นด้วย id/key ของงาน + ช่วงวันที่ + dropdown ชนิดวัน (date-type)** · date-range+time · genealogy (node คลิกได้) · **worked SAMPLE case ต่อ object (forward+backward)** · ตาราง field-audit (filter/sort/pagination) · archive |

## 3. Entity ที่ค้นได้ + field (จาก US-TRC-01) — **ครอบทุก object/ธุรกรรม (r12: ครบ + explicit)**
> **ครอบ "ทุก object ทั้งธุรกรรม + master + comment/field edit"** ตามที่ปอนด์สั่ง (r12). รายการนี้ = **entity/topic selector** ของ `trace.html` (เลือก topic แล้วค้นด้วย id/key ของ topic นั้น).

| Entity | field ที่ค้นได้ |
|---|---|
| ลูกค้า (Customer) | รหัส CUS / ชื่อ / เบอร์ / สถานะ / **follow_up_flag** · **★ r11: ที่อยู่ลูกค้า/ที่อยู่จัดส่ง · ผู้ติดต่อ (flag ผู้รับสินค้า)** |
| **Quotation (QT)** ★ | เลข QT / ลูกค้า / สถานะ (ร่าง/ยืนยัน/ปฏิเสธ/ยกเลิก) / วันที่สร้าง — **head-of-chain สาย OEM** |
| PO | เลข PO / ลูกค้า / สถานะ fulfilment/billing · **★ field-audit การแก้ PO** · **★★ r11: สถานะจัดส่ง = สะท้อนจาก DN (po.md §4b)** |
| **SO (Own-Brand)** ★ | เลข SO / ลูกค้า(ถ้ามี) / ชนิด / สถานะ · **★★ r11: (ก) สถานะจัดส่งสะท้อน DN** · produce-to-stock จาก Supply Planning ตามได้ |
| PRD / Batch | เลข PRD / เลข Batch / สถานะ · event: รับงาน/เริ่มผลิต/ส่ง QC/พร้อมส่ง/Hold/rework · `actual_produced_qty` · consume lot (FIFO) · comment · QC ผ่าน/ไม่ผ่าน |
| **วัตถุดิบ (RM) / Lot** | รหัส RM (ล็อกหลังสร้าง) / ชื่อ / เลข Lot / supplier / qc_status · loss/adjust movement (Lot/FIFO ref) |
| **★ GR (ใบรับเข้า — object)** ★ r10 | เลข GR / supplier / Lot(s) / RM / สถานะ GR (QC ตรวจสอบ/ผ่าน/ไม่ผ่าน/ยกเลิก) · event lifecycle · comment |
| **★ Return (ใบคืนวัตถุดิบ)** ★ r12 | **เลขใบคืน `RET-…` / Lot / RM / supplier / จำนวนคืน / เหตุผล · movement `return (−)` (source ผูก Lot+RM+Supplier+RET) · comment** — trace ย้อน Lot→Supplier |
| **FG (สินค้าสำเร็จรูป, per-Batch)** ★ | รหัส FG / ชื่อ / เลข Batch / ยอดราย Batch · FG-in/surplus/loss/adjust movement |
| **BOM (สูตร/FG master)** ★ | รหัส BOM/FG / ชื่อ / TYPE / สถานะ (Active/Inactive) · event create/แก้/inactivate/reactivate/save-back |
| PR | เลข PR / วัตถุดิบ / สถานะ (r10: คิดจากปริมาณ QC "ผ่าน") |
| **Supplier** ★ | รหัส SUP / ชื่อ / สถานะ · event create/แก้/active↔inactive/price-matrix |
| **★★★ Route (รอบจัดส่ง)** ★ r11 | **เลข `RT-{YYYYMMDD}-{NNNN}` (★ เดิม `SHP-…` — Q1=A) / คนขับ (system user) / เบอร์คนขับ / route / ประเภทรถ / ทะเบียน / สถานะ (เตรียมจัดของ/กำลังออกไปส่ง/เสร็จสิ้น/ยกเลิก)** · **event: สร้างรอบ (gen RT+DN) / จัดของ→ออกไปส่ง / เสร็จสิ้น (สรุปผลราย DN) / ยกเลิก / comment** (`shipping.md`) |
| **★★★ DN (ใบจัดส่ง)** ★ r11 | **เลข `DN-{YYYYMMDD}-{NNNNN}` / Route ต้นทาง (RT) / PO-SO / ลูกค้า / สถานะ (6: อยู่ระหว่างการเตรียม/อยู่ระหว่างจัดส่ง/ส่งสำเร็จ/ลูกค้าเลื่อนส่ง/ลูกค้ายกเลิก/ลูกค้ายังไม่กำหนดวันรับใหม่) / next delivery date** · **event: gen (จาก Route) / เปลี่ยนสถานะ (ผ่าน Route "เสร็จสิ้น" หรือ ★ แก้ตรง สิทธิ์ A) + comment บังคับ** (`delivery-note.md`) |
| Invoice | เลข INV / ลูกค้า / สถานะ (ชำระ/ค้าง/Overdue) · event ออก/รับชำระ |
| **★ Auth / Session (login)** ★ r12 | **ผู้ใช้ / เวลา / ชนิด event (login สำเร็จ / login ล้มเหลว / logout / first-login password change) / ช่องทาง (basic/Google)** — ดู `settings.md` US-SET-05 + `non-functional.md` AU1 (event ไม่มี genealogy — โผล่เฉพาะตาราง audit) |
> **★ field `comment`:** ทุก object ธุรกรรม (QT/PO/SO/PRD/Batch/DN/**Route**/Invoice/GR/PR/Return/QC) มี field `comment` ที่ **audit ได้**. ดู `comment-convention.md`.
> **★★★★ r12 — ครบทุก object:** entity/topic selector ครอบทั้ง **transactional** (QT · PO · SO · PRD · Batch · GR · Return · DN · Route · Invoice · PR · QC) + **stock/inventory** (RM/Lot · FG/Batch movement) + **master** (Customer · Supplier · BOM/FG) + **system** (Auth/login · Settings config/role/user) + **comment/field edit** (ทุก object). ผลลัพธ์จำกัดตามสิทธิ์ Read ของ module ต้นทาง (§6).

## 3.1 ★★★★ r12 — Entity/topic SELECTOR + ค้นด้วย id/key + ช่วงวัน (date-type)
- **(1) Entity/topic selector:** ผู้ใช้ **เลือก topic ที่จะสืบ** ผ่าน **dropdown/tab** — ค่าใน selector = ทุกแถวใน §3 (QT · PO · SO · PRD · Batch · DN · Route · Invoice · PR · GR · Return · Lot/RM · FG · Customer · Supplier · BOM/FG · Auth/login). selector ถูกจำกัดตามสิทธิ์ Read (topic ที่ไม่มีสิทธิ์ = ไม่แสดง).
- **(2) ค้นด้วย id/key ของงานนั้น:** เมื่อเลือก topic → ช่องค้น **id/key ของ topic** เช่น เลข QT · เลข PO · เลข SO · เลข PRD/Batch · **Lot code** · **RT-…** · **DN-…** · เลข INV · **เลขใบคืน RET-… (Return)** · รหัส/ชื่อลูกค้า · รหัส/ชื่อ RM · รหัส supplier · รหัส/ชื่อ BOM-FG · username (Auth). ค้นด้วย **search-in-dropdown (ชื่อ+รหัส)** ที่ topic เป็น master (G7).
- **(3) ช่วงวันที่ + dropdown ชนิดวัน (date-type)** — ตาม pattern **G2** ทั้งระบบ: ค้นช่วงวันได้ พร้อม **dropdown เลือก "ชนิดวัน" ที่เหมาะกับ topic** เช่น QT = วันที่สร้าง · PO/SO = วันที่เอกสาร/วันต้องการรับ · Route = วันสร้างรอบ/วันออกไปส่ง · DN = วันสร้าง/วันลูกค้าต้องการรับ/next date · GR = วันที่รับ · Invoice = วันที่ออก/ครบกำหนด · **audit/Auth = เวลา event**. (ถ้า topic มีวันเดียวที่มีความหมาย = ไม่ต้องมี dropdown ชนิดวัน.)
- **(4)** ค้น id/key **หรือ** ช่วงวัน (อย่างใดอย่างหนึ่งหรือทั้งคู่) → ได้ผลลัพธ์ → คลิกเข้า genealogy + ตาราง field-audit ของงานนั้น.

## 4. Data model / rules
| รายการ | กติกา |
|---|---|
| genealogy | Lot→Batch→line→PO(หรือ SO)→ลูกค้า→**DN (ผูก Route RT)**→INV · node คลิก = deep link · **QT = head** สาย OEM · **★ Supply Planning "สั่งผลิต" = SO produce-to-stock → PRD/Batch → FG-in** · **★ r10: Lot ↔ GR object; เข้าสายเมื่อ QC ผ่าน** · **★ r12: Return = แขนงย้อน Lot→Supplier** · **★★★ r11: DN ผูก Route ต้นทาง; FG ตัด (FIFO per-Batch) ตอน DN "ส่งสำเร็จ"** |
| audit | ระดับ field: เวลา/ผู้ทำ/entity/field/จาก→เป็น/เหตุผล · **ทุก action ทุก module** · **★ r12: ครอบทุกกิจกรรมที่ไม่ใช่การอ่าน + login/logout** (settings US-SET-05 / NFR AU1) · รวม stock ledger (reason/source, D15) |
| **★ stock movement audit (D15)** | ทุก movement audit + trace + reason + source: เพิ่ม RM · loss (−) · adjust (+) (RM: Lot/FIFO) · **`GR (+)` (r10: ตอน QC "ผ่าน")** · FG-in · surplus · **return (−) (r12: source ผูก Lot+RM+Supplier+RET)** · **CONSUME (−)** (FIFO). ดู `stock.md` §6 |
| **★ r10 GR object + QC-gated stock-in audit** | GR lifecycle event + trace: บันทึกรับ / QC "ผ่าน" (credit `GR (+)` + FIFO retro-link) / QC "ไม่ผ่าน" / ส่งกลับ QC / ยกเลิก / comment. `goods-receipt.md` §4/§9 · `qc.md` §4.1 |
| **★ Production action audit** | รับงาน/เริ่มผลิต(consume FIFO)/ส่ง QC/พร้อมส่ง(surplus→FG)/Hold/rework/`actual_produced_qty`/loss/comment · QC ตัดสิน Batch. `production.md` §5/§7 |
| **★ PO edit audit** | การแก้ PO ทุกครั้ง (รวมจากการผลิต) = field-level audit + raise ⚑ follow-up. `po.md` §5.2 |
| **★★★ r11 Route/DN audit** | **Route lifecycle** (สร้างรอบ→gen RT+DN / จัดของ→ออกไปส่ง / เสร็จสิ้น สรุปผลราย DN / ยกเลิก / comment) · **DN status change** (ผ่าน Route "เสร็จสิ้น" process **หรือ ★ แก้ตรง สิทธิ์ Shipping.Approve (A)**) + **comment DN บังคับตอน status-update** + next delivery date. entity=Route/DN, ใคร/เมื่อ/เดิม→ใหม่/เหตุผล. **★ PO/SO delivery status = สะท้อน DN → trace ผ่าน DN ต้นทาง.** `shipping.md` · `delivery-note.md` · `po.md` §4b |
| **★ BOM/Supplier/save-back audit** | สร้าง/แก้/inactivate/reactivate/price-matrix/save-back planning param (simulate ไม่ audit). `bom.md`/`supplier.md`/`supply-planning.md` §5c |
| **★ QT activity** | สร้าง/แก้→version/Convert→Confirmed/reject/cancel · การส่ง = print/share (ไม่มี sent-date). `quotation.md` §10 |
| **★★★★ r12 non-read + auth audit** | **audit ครอบ "ทุกกิจกรรมที่ไม่ใช่การอ่าน" ในทุก module** — create/update/delete-void-cancel/approve/status-change/config-change/password-reset/role-user-change/stock-movement/comment-edit + **login/logout/first-login-password-change** (login สำเร็จ+ล้มเหลว). **การอ่าน/ดู/ค้น = ไม่ audit.** ดู `settings.md` US-SET-05 · `non-functional.md` AU1. |
| **★ comment edit** | entity=object / field=`comment` / old→new / เวลา / ผู้แก้ · แก้ทับแต่ประวัติครบ · ลบไม่ได้ (AU2). `comment-convention.md` |
| retention | online 1 ปี · หลังจากนั้น Super User manual purge/archive |
| archive | text file · **Super User เท่านั้น** · ยืนยันก่อน export |
| เอกสารการค้า | void/cancel ไม่ลบ — trace ครบ (gapless) |

## 5. User Stories (absorbed) + AC สรุป
- **US-TRC-01 (Must) — Entity selector + field ต่อ entity:** entity=Batch → ค้น → genealogy. **★ r10:** entity=GR. **★★★ r11:** entity=Route → ค้น "RT-20260730-0044" → พบ + สถานะ + DN ในรอบ + คนขับ; entity=DN → ค้น "DN-…" → พบ + Route ต้นทาง + สถานะ + PO/SO. **★★★★ r12:** entity/topic selector เป็น dropdown/tab ครอบทุกแถว §3; เลือก topic → ค้นด้วย **id/key ของ topic** + **ช่วงวัน + dropdown ชนิดวัน (date-type)** (§3.1); entity=Return → ค้นเลขใบคืน `RET-…` → Lot→Supplier. **Error:** ไม่มีสิทธิ์ Read → 403 (topic ไม่โผล่ใน selector).
- **US-TRC-02 (Must) — Genealogy + คลิก node:** ค้น Batch → Lot → line → PO → ลูกค้า → **DN (ผูก Route) → INV**. **★ r10 Lot ↔ GR.** **★ r12 Lot ↔ Return (ย้อน Supplier).** **★★★ r11:** node DN คลิก → Route ต้นทาง (คนขับ/สถานะ); ตัด FG (FIFO) ตอน DN "ส่งสำเร็จ". **Error:** entity ไม่มีสายผลิต (Supplier/Auth-login) → แสดงเฉพาะ audit/relation ที่มี.
- **US-TRC-03 (Must) — ตาราง field-audit + archive:** **★ comment/stock movement/GR-QC/Production/PO edit/BOM save-back** (คงตามรอบก่อน). **★★★ r11:** entity=Route → "สร้างรอบ (gen RT + DN-…-119=PO-176) / กำลังออกไปส่ง / เสร็จสิ้น (DN-…-119 ส่งสำเร็จ)"; entity=DN → "gen จาก RT-… / ลูกค้าเลื่อนส่ง (next date 2026-08-10, comment '...') — หรือ — ★ แก้ตรง (สิทธิ์ A): ส่งสำเร็จ (comment '...')". **★★★★ r12:** ตาราง audit แสดง row login/logout (entity=Auth, action=login/logout, ไม่มี old→new) + ทุกกิจกรรม non-read. **Error:** ผู้ใช้ทั่วไป archive → 403.

## 5b. ★★★★ r12 — Sample case ต่อ object (forward + backward genealogy)
> ปอนด์สั่ง: `trace.html` ต้อง **โชว์ตัวอย่าง (worked sample) จริงต่อชนิด object** ให้ reviewer/QA เห็นว่า "แต่ละ object สืบได้จริง" — **forward (ต้นทาง→ปลายทาง) + backward (ปลายทาง→ต้นทาง)**. spec นี้กำหนด **แต่ละ sample ต้องแสดงอะไร** (mockup เป็นผู้ render ตัวเลข). ทุก sample = 1 chain ที่ object นั้นอยู่ + audit event ของ object นั้น.

| Object (topic) | Sample ต้องแสดง (chain + audited events) |
|---|---|
| **QT** | forward: QT→(Convert)→PO→PRD→Batch→FG/Lot→DN→INV · backward: จาก INV/DN ย้อนถึง QT · events: สร้าง/แก้→version/Convert→Confirmed |
| **PO** | forward: PO→PRD→Batch→FG(FIFO)→DN(Route)→INV · backward: PO←QT · events: เปิด/ยืนยัน/แก้ (⚑ follow-up)/สถานะจัดส่ง=สะท้อน DN |
| **SO (Own-Brand)** | forward: SO(ก จอง FG / ข produce-to-stock)→[PRD→Batch→FG]→DN→INV · events: สร้าง/ยืนยัน/ยกเลิก · สถานะจัดส่งสะท้อน DN |
| **PRD / Batch** | forward: Batch→FG→DN→ลูกค้า · backward: Batch→line→PO/SO + consume Lot (FIFO) → GR → Supplier · events: รับงาน/เริ่มผลิต/QC/พร้อมส่ง/loss |
| **RM / Lot** | forward: Lot→consume→Batch→FG→DN→ลูกค้า · backward: Lot→GR→Supplier (+ Return ถ้ามี) · movement: GR(+)/consume(−)/loss/adjust/return(−) |
| **GR** | backward: GR→Supplier · forward: GR→Lot→(QC ผ่าน credit)→Batch consume · events: รับ/QC ผ่าน-ไม่ผ่าน/ส่งกลับ/ยกเลิก |
| **Return** | backward: Return→Lot→RM→Supplier · movement return(−) + เหตุผล + เลขใบคืน `RET-…` ที่ส่งคืน |
| **FG (per-Batch)** | backward: FG→Batch→PO/SO→ลูกค้า · forward: FG→DN→INV · movement FG-in/surplus/loss/adjust |
| **BOM / FG master** | ใช้ที่ไหน: BOM→Batch ที่ผลิตด้วยสูตรนี้ · events: สร้าง/แก้/inactivate/reactivate/save-back |
| **Route (RT)** | forward: Route→DN ทุกใบในรอบ→PO/SO→ลูกค้า · events: สร้างรอบ (gen RT+DN)/ออกไปส่ง/เสร็จสิ้น (สรุปราย DN)/ยกเลิก |
| **DN** | backward: DN→Route ต้นทาง + DN→PO/SO→ลูกค้า · forward: DN "ส่งสำเร็จ"→ตัด FG(FIFO)→INV/Overdue · events: gen/เปลี่ยนสถานะ (process หรือ แก้ตรง A) + comment |
| **Invoice** | backward: INV→PO/SO→ลูกค้า + INV→DN (ส่งสำเร็จ trigger) · events: ออก/รับชำระ/Overdue |
| **PR** | backward: PR→RM (คิดจาก QC ผ่าน) · events: เปิด (auto/manual)/ยืนยัน/ปิด/ยกเลิก |
| **Customer** | ใช้ที่ไหน: Customer→QT/PO/SO/DN/INV · events: สร้าง/แก้ (ที่อยู่/ผู้ติดต่อ/⚑)/Disabled·Blacklist/reassign Sale |
| **Supplier** | ใช้ที่ไหน: Supplier→GR→Lot→Batch (+ Return) · events: สร้าง/แก้/price-matrix/active↔inactive |
| **Auth / login** | ตาราง audit อย่างเดียว (ไม่มี genealogy): login สำเร็จ/ล้มเหลว/logout/first-login change ต่อ user |

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ค้น entity/field + ดู genealogy | Read ของ module ของ entity นั้น |
| ดูตาราง field-audit | Traceability/Settings.**Read (R)** |
| archive เป็น text file | **Super User** เท่านั้น |
> ผลลัพธ์ค้น/entity selector ถูกจำกัดตามสิทธิ์ Read. **★ Audit-log viewer ใน Settings = Admin bit เท่านั้น** (settings §6, non-functional A8) — trace ผ่าน module เดิมยังใช้ Read ของ module นั้น.

## 7. Validations
- entity/field ที่ค้นได้ตามตาราง §3; นอกสิทธิ์ Read = ไม่แสดง (topic ไม่โผล่ใน selector).
- **★ r12: ค้นด้วย id/key ที่ไม่พบ = "ไม่พบข้อมูล"; ช่วงวัน + ชนิดวันต้องเลือกให้สอดคล้อง topic.**
- archive = Super User + ยืนยันก่อน export.
- ไม่มี auto-purge (retention 1 ปี online).

## 8. Pagination / Search
- **entity/topic selector (dropdown/tab)** + **ค้น id/key ของ topic** + **ช่วงวัน + dropdown ชนิดวัน (date-type, G2)**.
- ตาราง field-audit: 20/หน้า (G1) · filter (ผู้ใช้/entity/field/**module**/ช่วงวัน+เวลา) + sort เวลา (default ใหม่→เก่า) (G2).

## 9. Formulas / rules
- genealogy = graph traversal Lot→Batch(run)→line→order→customer→**DN(Route)**→INV · **★ r10: Lot ↔ GR; เข้าสายเมื่อ credit (QC ผ่าน)** · **★ r12: Lot ↔ Return (ย้อน Supplier)** · **★★★ r11: DN ↔ Route; FG ตัดตอน DN "ส่งสำเร็จ"**.
- audit = generic field-level table ทุกตาราง · **รวม field `comment` ทุก object + ทุก stock movement + GR object lifecycle + ทุก production action + PO edit + BOM/Supplier changes + ★★★ Route/DN lifecycle + DN status-edit(A) + ★★★★ r12 ทุกกิจกรรม non-read + login/logout**. simulate/what-if ที่ไม่ persist = ไม่ audit. **การอ่าน/ดู/ค้น = ไม่ audit.**

## 10. Cross-links
- Audit log ใน `settings.md` (US-SET-05) = มุมมองรวม (Admin only). ledger → `stock.md` §3b/§6. **★ r10 GR object → `goods-receipt.md`/`qc.md`/entity-status-map §1.8.** Production/PO edit → `production.md`/`po.md`. BOM/save-back → `bom.md`/`supply-planning.md`. Supplier → `supplier.md`. **★ r12 Return (เลข `RET-…`) → `return.md` · `numbering-on-save.md` §4.** QT → `quotation.md` §10. comment → `comment-convention.md`. **★★★ r11 Route/DN → `shipping.md`/`delivery-note.md`/entity-status-map §1.9/§1.10/`po.md` §4b.** **★★★★ r12 non-read + login audit → `non-functional.md` AU1 + `settings.md` US-SET-05.**

## 11. Module changelog
- **Absorbed:** functional-spec `traceability.html` US-TRC-01..03 (9 AC).
- **เพิ่ม (รอบก่อน):** QT head-of-chain · SO · FG per-Batch · stock ledger reason/source · comment audit · BOM/Supplier · Production action + PO edit · save-back · GR object + QC-gated credit. (คงตามรอบก่อน — commit history)
- **★★★ เพิ่ม (2026-07-30 — Route/DN r11, ปอนด์ Module B/C):** **Route (`RT-…`, ★ เดิม SHP) + DN (6 สถานะ) เป็น entity ใน §3** (แทน "Shipment/DN" เดิม) + สถานะ/event lifecycle · **§4 row Route/DN audit** (Route lifecycle + DN status change ทั้ง Route process และ **★ แก้ตรง สิทธิ์ A** + comment DN บังคับ) · **PO/SO delivery status = สะท้อน DN → trace ผ่าน DN ต้นทาง** · genealogy DN↔Route + ตัด FG ตอน DN "ส่งสำเร็จ" · §5 US-TRC ตัวอย่าง Route/DN · §9/§10. ref `shipping.md`/`delivery-note.md`/`po.md` §4b/entity-status-map §1.9/§1.10.
- **★★★★ เพิ่ม (2026-07-30 — Trace-surface + Audit review r12, ปอนด์):** **(1)** §3 ประกาศ trace ครอบ "ทุก object/ธุรกรรม" ชัดเจน + **เพิ่ม Return + Auth/login เป็น entity** + note ครบทุก object. **(2)** §3.1 ใหม่ = **entity/topic SELECTOR (dropdown/tab)** + **ค้นด้วย id/key ของ topic** + **ช่วงวัน + dropdown ชนิดวัน (date-type, G2)**. **(3)** §5b ใหม่ = **Sample case ต่อ object** (forward+backward, ระบุว่าแต่ละ sample ต้องแสดงอะไร). **(4)** §4/§9 audit ครอบ **ทุกกิจกรรม non-read + login/logout** (reconcile settings US-SET-05 + NFR AU1). **(5)** §2/§8 หน้าจอ + search อัปเดต. ref `return.md`/`settings.md`/`non-functional.md` §3.
- **★★ เพิ่ม (2026-07-31 — reconciliation M1, ปอนด์):** Return topic ในทุกจุด (§3 entity, §3.1 id/key, §4 stock-movement audit, §5/§5b sample) เปลี่ยน source token **"RT" → เลขใบคืน "RET-…"** เพื่อเลิกความกำกวมกับ Route `RT-…`. Route คง `RT-…`. อ้าง `return.md` · `numbering-on-save.md` §4 · `stock.md` §6 · `non-functional.md` D-F5.
- **คงเดิม:** field-level audit · genealogy node คลิกได้ · archive Super User · retention 1 ปี.
