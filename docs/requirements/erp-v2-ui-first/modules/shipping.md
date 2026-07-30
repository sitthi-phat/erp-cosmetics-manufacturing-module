# Module — Shipping / Route (การจัดส่ง: รอบจัดส่ง = Route + DN)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-30 · **AUTHORITATIVE SPEC** (absorbs functional-spec `shipping.html` US-SHP-01..03 · **★ Module B rewrite: Shipment→Route (RT-) + new lifecycle**)
Mockups: `mockups/shipping.html` · `mockups/delivery-note.html`
กฎอ้างอิง: entity-status-map §1.9 (Route/รอบ) / §1.10 (DN) · `po.md` §4/§4b (พร้อมจัดส่ง→ตัด FG/dispatch · PO สะท้อนสถานะ DN) · `so.md` §4/§5 · `invoice.md` (ส่งสำเร็จ→เริ่มนับเครดิต) · stock (FG FIFO ตอน dispatch, D16) · README §3 (**G6/G8**) · **`comment-convention.md`** · **`numbering-on-save.md` (G8 — เลข Route + DN ออกตอนสร้างรอบ, NS7)** · **`delivery-note.md` (Module C — DN detail/search/status/print)** · **`customer.md` §3/§9b (ที่อยู่จัดส่ง + ผู้รับสินค้า)**

## สรุปภาษาไทย
จัดส่งเป็น **2 ชั้น**: **รอบจัดส่ง = "Route" (Route Information, รหัส `RT-…`)** รวมหลาย DN + คนขับ/เบอร์/route/ประเภทรถ/ทะเบียน · **DN = 1 ใบต่อ 1 PO/SO เสมอ** (Module C = `delivery-note.md`). **★ RT = ตัวระบุรอบ (round identifier) — reconcile กับเลขรอบเดิม `SHP-…`: PO เสนอ "RT แทน SHP (rename)" เป็นค่าแนะนำ, `RT-{YYYYMMDD}-{NNNN}` gapless ต่อวัน — ★ รอปอนด์ยืนยัน (Q1, §12).** **Route LIST:** ค้นด้วย **ชื่อคนขับ / username คนขับ / route id** + **ช่วงวันที่ พร้อม dropdown ชนิดวันที่ (วันที่สร้าง route / วันที่ route ออกไปส่ง)** · คอลัมน์ **RouteID · วันที่สร้าง · วันที่ออกไปส่ง · จำนวน PO/SO · Status** · ปุ่ม **"สร้าง Route"** มุมขวาบน · row มี **edit action** (เปลี่ยนสถานะ/comment/เพิ่ม-แก้ SO/PO). **Route STATUS:** **เตรียมจัดของ** (ตอนสร้าง) → **กำลังออกไปส่ง** (action หลังจัดของ) → **เสร็จสิ้น** (action หลังส่ง — **บังคับอัปเดตสถานะ DN แต่ละใบ + comment ต่อ DN (G6)**) · **ยกเลิก** (ได้ทุกเมื่อ). **หน้าสร้าง/แก้ Route:** คนขับ (ค้นชื่อ/username, คนขับ = system user) · **เบอร์ติดต่อคนขับ \*** · Route/เส้นทาง · **ประเภทรถ \*** (รถกระบะ/รถเก๋ง/มอเตอร์ไซด์/10 ล้อ/6 ล้อ) · ทะเบียนรถ · วัน-เวลาออกรอบ. **เพิ่ม PO/SO/DN:** modal ค้นด้วย code/ชื่อลูกค้า/ชื่อผู้ติดต่อ/เบอร์ผู้ติดต่อ, list เรียงตามวันที่ต้องการรับ (เร็ว→ช้า), ค้นทุกสถานะแต่ **เลือกได้เฉพาะ "พร้อมจัดส่ง"**, filter สถานะ default = พร้อมจัดส่ง. **บันทึกสร้างรอบ → Route = เตรียมจัดของ + G8 popup แสดงเลข Route + สรุป + เลข DN ที่ gen (PO/SO ใบไหนได้ DN ใด)**. คลิก PO/SO/DN → modal แสดง **ชื่อลูกค้า / ที่อยู่จัดส่ง / เบอร์ผู้รับ**. **★ Route มีช่องหมายเหตุ (comment) แก้ในที่ + เก็บประวัติครบ (G6).**

---

## 1. Purpose
จัดรอบส่งของ (Route) และออกใบส่งของ (DN) ราย order ให้ลูกค้าเซ็น, ติดตามผลการส่งราย DN, และ reconcile รอบ — เป็นจุดที่ FG ถูกตัดจริง (FIFO ราย Batch) และเป็นตัวจุด billing (DN ส่งสำเร็จ → เริ่มนับเครดิต). **DN detail/search/status/print = Module C (`delivery-note.md`).**

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `shipping.html` (Route LIST) | รายการ Route · ค้นชื่อคนขับ/username/route id + ช่วงวันที่ (dropdown ชนิดวัน) · คอลัมน์ RouteID/วันที่สร้าง/วันที่ออกไปส่ง/จำนวน PO/SO/Status · **ปุ่ม "สร้าง Route (C)" มุมขวาบน** · row edit action |
| `shipping.html` (Create/Update Route) | ฟอร์มคนขับ/เบอร์/route/ประเภทรถ/ทะเบียน/วัน-เวลาออกรอบ + **modal เพิ่ม PO/SO/DN** + **comment ต่อ Route + "ประวัติการแก้ไข comment"** · **★ ช่องเลข Route/DN = "(ระบบออกให้เมื่อบันทึก)" → ออกตอนสร้างรอบ + popup (G8/NS7)** · status actions (จัดของ→ออกไปส่ง→เสร็จสิ้น/ยกเลิก) |
| `delivery-note.html` (Module C) | DN ราย order · search/filter/print DN + Invoice · สถานะราย DN · comment ต่อ DN · แก้สถานะ DN โดยตรง (A) — ดู `delivery-note.md` |

## 3. Fields (Route)
| ฟิลด์ | ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| **RouteID `RT-{YYYYMMDD}-{NNNN}`** | string | computed | **★ ออกตอน "สร้าง Route" สำเร็จ + popup (G8/NS2, NS7)** · **★ reconcile SHP: PO เสนอ RT แทน SHP — Q1 §12** |
| **คนขับ (driver)** | ref user (search ชื่อ/username) | editable | **คนขับ = system user** · ค้นด้วยชื่อ **หรือ** username |
| **เบอร์ติดต่อคนขับ \*** | phone | editable | **บังคับ (required)** |
| **Route / เส้นทาง** | text | editable | ชื่อ/คำอธิบายเส้นทาง |
| **ประเภทรถ \*** | enum | editable | **บังคับ** · {รถกระบะ · รถเก๋ง · รถมอเตอร์ไซด์ · รถ 10 ล้อ · รถ 6 ล้อ} |
| **ทะเบียนรถ** | text | editable | optional |
| **วันที่/เวลา ออกรอบ** | datetime | editable | วันเวลาที่รอบออกไปส่ง |
| วันที่สร้าง route | datetime | computed | ใช้เป็นแกนค้นชนิด "วันที่สร้าง" |
| วันที่ route ออกไปส่ง | datetime | computed/derived | ตั้งเมื่อ Route → "กำลังออกไปส่ง" · แกนค้นชนิด "วันที่ออกไปส่ง" |
| จำนวน PO/SO (order count) | int | computed | จำนวน order ในรอบ (= จำนวน DN) |
| สถานะ Route | enum {เตรียมจัดของ, กำลังออกไปส่ง, เสร็จสิ้น, ยกเลิก} | editable (action) | §4 |
| **★ หมายเหตุ Route (comment)** | free-text (ช่องเดียว/รอบ), editable (แก้ในที่/overwrite) | **แก้ทุกครั้งเก็บประวัติ ใคร/เมื่อ/เดิม→ใหม่ + โผล่ trace — `comment-convention.md` (CC1–CC7)** |
| DN ในรอบ | list ref DN | computed | 1 DN = 1 PO/SO · gen ตอนสร้างรอบ (Module C) |

## 4. Statuses / lifecycle (Route — entity-status-map §1.9)
**Route (รอบจัดส่ง) 4 สถานะ:**
| สถานะ Route | เกิดตอน / action | ผลต่อ DN |
|---|---|---|
| **เตรียมจัดของ (Preparing)** | **auto เมื่อสร้าง Route สำเร็จ** | DN ทุกใบ = **อยู่ระหว่างการเตรียม** |
| **กำลังออกไปส่ง (Out for delivery)** | **action** (หลังจัดของ PO/SO เสร็จ) → ตั้งวันที่ route ออกไปส่ง | DN ทุกใบ = **อยู่ระหว่างจัดส่ง** |
| **เสร็จสิ้น (Completed)** | **action** (หลังส่ง) — **บังคับอัปเดตสถานะ DN แต่ละใบ (§4b)** | DN แต่ละใบ = ส่งสำเร็จ / ลูกค้าเลื่อนส่ง / ลูกค้ายกเลิก / ลูกค้ายังไม่กำหนดวันรับใหม่ |
| **ยกเลิก (Cancelled)** | **action — กดได้ทุกเมื่อ** (บังคับเหตุผล) | DN ในรอบ = ยกเลิกรอบ (order กลับสู่คิว "พร้อมจัดส่ง" ถ้ายังไม่ dispatch) |

> **หมายเหตุ vs โมเดลเดิม:** เดิมมีสถานะ "จบรอบ (Closed) auto/ส่งบางส่วน (Partially)". **ตอนนี้ปิดรอบด้วย action "เสร็จสิ้น" ที่ผู้ใช้กด (พร้อมสรุปผลราย DN)** แทน auto-close. มุมมอง "ส่งบางส่วน" ยังคงเป็น **ป้าย reconcile/สรุป** (breakdown ราย DN ในรอบ) ไม่ใช่ lifecycle status.

### 4b. ★ "เสร็จสิ้น" process — บังคับอัปเดตสถานะ DN ทุกใบ + comment (G6)
เมื่อกด **"เสร็จสิ้น (Completed)"** ระบบบังคับให้ **สรุปผลราย DN ทุกใบในรอบ** — ต่อ DN เลือก 1 ใน:
| ผล DN | เงื่อนไข/ข้อมูลเพิ่ม | ผลต่อ PO/SO (สะท้อนจาก DN — po.md §4b) |
|---|---|---|
| **ส่งสำเร็จ (Delivered)** | — | PO/SO = ส่งสำเร็จ · **ตัด FG FIFO ราย Batch (dispatch)** · เริ่มนับ overdue · noti Finance+Sale (C10) |
| **ลูกค้าเลื่อนส่ง (Postponed)** | **บังคับกรอก "วันที่นัดส่งครั้งถัดไป (next delivery date)"** | PO/SO สะท้อน "ลูกค้าเลื่อนส่ง" + order ค้างคิว รอ re-route ในวันนัด (C12) |
| **ลูกค้ายังไม่กำหนดวันรับใหม่ (ฝากที่เราไว้ก่อน) (Awaiting-new-date)** | — | PO/SO สะท้อน "ลูกค้ายังไม่กำหนดวันรับใหม่" · ของฝากไว้ที่เรา รอลูกค้ากำหนดวัน |
| **ลูกค้ายกเลิก (Cancelled)** | — | PO/SO สะท้อน "ลูกค้ายกเลิก(การส่ง)" · การส่งถูกยกเลิก (จัดการของคืน/สต็อกตามนโยบาย) |
- **★ ทุก DN ที่อัปเดต = บังคับ comment ต่อ DN (G6)** (`comment-convention.md` · `delivery-note.md` §6).
- ปิดรอบ "เสร็จสิ้น" ได้เมื่อ **ทุก DN ถูกให้ผลครบ** (ไม่มี DN ที่ยังไม่สรุป).
- **DN ที่ผลไม่ใช่ "ส่งสำเร็จ"** (เลื่อน/ยกเลิก/ยังไม่กำหนดวัน) → order re-route ในรอบใหม่ = **gen DN ใบใหม่** (DN เดิมคงสถานะสุดท้ายเป็นประวัติ; PO สะท้อน DN ล่าสุด — po.md §4b).
- **ทางเลือกที่ 2:** ผู้มีสิทธิ์ **A (Approve)** แก้สถานะ DN ได้โดยตรงจากหน้า DN (Module C `delivery-note.md` §6) — คนละทางเข้ากับ "เสร็จสิ้น" process แต่ผลเดียวกัน.

## 4c. ★ Comment + change-history (Route — ยึด `comment-convention.md`)
- **Route (รอบ) มีช่อง comment เดียว** · แก้ในที่ (overwrite) · ทุกครั้งเก็บ **ใคร/เมื่อ/เดิม→ใหม่** ผ่าน field-audit เดิม; หน้า shipping แสดง **ค่าปัจจุบัน + "ประวัติการแก้ไข comment"**.
- การแก้ = activity-log event + **โผล่บน trace** (entity=Route, field=`comment`). **DN comment = แยกช่อง (Module C).**

## 5. ★ Create/Update Route flow (delta)
1. กด **"สร้าง Route (C)"** (มุมขวาบน list) → หน้า create.
2. กรอกหัวรอบ: **คนขับ** (search-in-dropdown ค้น **ชื่อ หรือ username**; คนขับเป็น system user) · **เบอร์ติดต่อคนขับ \*** · **Route/เส้นทาง** · **ประเภทรถ \*** (5 ตัวเลือก) · **ทะเบียนรถ** · **วัน-เวลาออกรอบ**. **★ ช่องเลข Route/DN = read-only "(ระบบออกให้เมื่อบันทึก)" (G8/NS1).**
3. **เพิ่ม PO/SO/DN เข้ารอบ (modal):**
   - **candidate list เรียงตาม "วันที่ต้องการรับของ" เร็ว→ช้า (soonest→latest)** (ให้จัดคิวส่งของที่ใกล้ถึงกำหนดก่อน).
   - **modal ค้นด้วย code (PO/SO/DN) · ชื่อลูกค้า · ชื่อผู้ติดต่อ · เบอร์ผู้ติดต่อ** — **ค้นได้ทุกสถานะ** แต่ **เลือกได้เฉพาะ PO/SO ที่สถานะ = "พร้อมจัดส่ง (Ready to Ship)"**.
   - **filter สถานะ** (default = **พร้อมจัดส่ง**).
   - เลือกได้หลาย order เข้ารอบเดียว → **1 DN ต่อ 1 PO/SO**.
4. **บันทึก (สร้างรอบ)** →
   - Route = **เตรียมจัดของ**.
   - **★ gen DN ราย order + ออกเลข Route + ทุก DN แบบ gapless ตอนบันทึกสำเร็จ (G8/NS2, NS7)**.
   - **★ popup ยืนยันแสดง: (ก) เลข Route (เด่นชัด) + (ข) สรุปรอบ (คนขับ/route/ประเภทรถ/จำนวน order) + (ค) เลข DN ทุกใบที่ gen พร้อมระบุ "PO/SO ใบไหนได้ DN เลขใด" + (ง) ลิงก์ดู/พิมพ์ DN** (NS7 — หลายเลข/บันทึกเดียว).
5. **คลิก PO/SO/DN ในรอบ → modal รายละเอียด** แสดง key info: **ชื่อลูกค้า · ที่อยู่จัดส่ง (shipping address) · เบอร์ผู้รับสินค้า (receiver phone)** (จาก `customer.md` §3/§9b) + code + วันที่ต้องการรับ. กลับได้ไม่เสีย state (G3).
6. **Update Route (row edit action):** เปิด Route เดิม → **เปลี่ยนสถานะ (จัดของ→ออกไปส่ง→เสร็จสิ้น/ยกเลิก) · แก้ comment · เพิ่ม/แก้ SO/PO ในรอบ** (เพิ่ม order = gen DN ใหม่ในรอบ; เอา order ออกได้ก่อน dispatch).

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required | Suffix (G9) |
|---|---|---|
| ดู list/รอบ/DN + **ดูประวัติ comment** | Shipping.**Read (R)** | (R) |
| **สร้าง Route + gen DN (อ้าง PO หรือ SO, ★ ออกเลข RT+DN)** | Shipping.**Create (C)** | **(C)** |
| **แก้ Route (สถานะ/comment/เพิ่ม-แก้ SO/PO)** | Shipping.**Update (U)** | **(U)** |
| Route → กำลังออกไปส่ง / เสร็จสิ้น (+ อัปเดต DN) | Shipping.**Update (U)** | **(U)** |
| ยกเลิก Route (+ เหตุผล) | Shipping.**Update (U)** (หรือ D ตามนโยบาย void) | **(U)** |
| **แก้ไข comment รอบ (แก้ในที่)** | Shipping.**Update (U)** (เก็บประวัติ auto) | **(U)** |
| **★ แก้สถานะ DN โดยตรง (จากหน้า DN)** | Shipping.**Approve (A)** — **ดู `delivery-note.md` §6** | **(A)** |
| print DN / print Invoice | Shipping.**Read (R)** / Invoice.**Read (R)** | (R) |

## 7. Validations
- เข้ารอบได้เฉพาะ order สถานะ **"พร้อมจัดส่ง"** (ค้นเจอทุกสถานะ แต่เลือกไม่ได้ถ้าไม่ใช่พร้อมจัดส่ง + แจ้งเหตุผล).
- 1 DN = 1 PO/SO (ห้ามรวมหลาย order ใน DN เดียว).
- **★ เบอร์ติดต่อคนขับ + ประเภทรถ = บังคับ (required)** ตอนสร้าง/แก้ Route.
- **★ เลข Route + ทุก DN ในรอบ ออกตอน "สร้างรอบ" สำเร็จเท่านั้น (G8/NS2, NS7) — สร้างรอบไม่สำเร็จ = ไม่ออกเลข (NS4).**
- **★ "เสร็จสิ้น" = ต้องอัปเดตสถานะ DN ทุกใบให้ครบ + comment ต่อ DN (G6)** · **ลูกค้าเลื่อนส่ง → บังคับกรอกวันนัดถัดไป**.
- print DN/Invoice ต้องมี DN แล้ว (DN สร้างผ่านรอบเท่านั้น — ห้ามสร้าง DN ตรง, delivery-note.md §4).
- **★ comment รอบ (หมายเหตุทั่วไป) = ไม่บังคับ** · แก้ได้ทุกสถานะ · ทุกการแก้ถูก audit (CC2/CC3).

## 8. Pagination / Search (Route list)
- Route list: 20/หน้า (G1).
- **ค้นด้วย: ชื่อคนขับ / username คนขับ / route id** + **ช่วงวันที่ พร้อม dropdown ชนิดวันที่ {วันที่สร้าง route · วันที่ route ออกไปส่ง}** (G2).
- **คอลัมน์: RouteID · วันที่สร้าง · วันที่ออกไปส่ง · จำนวน PO/SO · Status** · filter สถานะ Route.

## 9. Formulas
- Route "เสร็จสิ้น" = ผู้ใช้กด action + ให้ผลราย DN ครบทุกใบ (ไม่ใช่ auto-close).
- FG ตัดตอน dispatch (DN "ส่งสำเร็จ") = FIFO ราย Batch (D16).
- จำนวน PO/SO ในรอบ = จำนวน DN ในรอบ (1:1).

## 10. Cross-links
- order พร้อมจัดส่ง (C9) → `po.md` §4/§4b · `so.md` §4/§5. DN ส่งสำเร็จ→เริ่มนับเครดิต (C10) → `invoice.md`. เลื่อน/ยกเลิก/ยังไม่กำหนดวัน → `delivery-note.md` §4.
- **★ DN detail/search/status/print/comment/แก้สถานะ(A) → `delivery-note.md` (Module C).**
- **★ ที่อยู่จัดส่ง + ผู้รับสินค้า (modal) → `customer.md` §3/§9b.**
- **★ เลข RT+DN ออกตอนสร้างรอบ (G8/NS7) → `numbering-on-save.md` · gapless → `non-functional.md` §5 (D-F5).**
- **Comment + change-history → `comment-convention.md` · field-audit → `traceability.md` §4.**
- FG dispatch FIFO → `stock.md`.

## 11. Module changelog
- **Absorbed:** functional-spec `shipping.html` US-SHP-01..03 (9 AC) verbatim ในความหมาย.
- **★★ REWRITE (2026-07-30 — Module B, ปอนด์):** รอบจัดส่ง **Shipment → "Route" (Route Information, `RT-…`)**; **สถานะใหม่ เตรียมจัดของ → กำลังออกไปส่ง → เสร็จสิ้น / ยกเลิก** (แทน รับเข้ารอบ/กำลังนำส่ง/จบรอบ/ส่งบางส่วน); **"เสร็จสิ้น" = action บังคับสรุปผลราย DN + comment (G6)**; หน้าสร้าง/แก้ Route เพิ่มฟิลด์ **คนขับ(ค้นชื่อ/username) · เบอร์คนขับ\* · Route · ประเภทรถ\*(5) · ทะเบียนรถ · วัน-เวลาออกรอบ**; **modal เพิ่ม PO/SO/DN** (เรียงตามวันที่ต้องการรับ, ค้น code/ลูกค้า/ผู้ติดต่อ/เบอร์, เลือกได้เฉพาะพร้อมจัดส่ง, filter default พร้อมจัดส่ง); **modal รายละเอียด order แสดง ชื่อลูกค้า/ที่อยู่จัดส่ง/เบอร์ผู้รับ**; **Route list** ค้นคนขับ/username/route-id + ช่วงวันที่ (dropdown ชนิดวัน) + คอลัมน์ RouteID/วันสร้าง/วันออกส่ง/จำนวน PO-SO/Status + ปุ่ม "สร้าง Route". **★ เลข RT + ทุก DN ออกตอนสร้างรอบ + popup แสดงเลข DN ต่อ PO/SO (G8/NS7).** อัปเดต §2–§11 · sync `entity-status-map.md` §1.9/§1.10 · `delivery-note.md` (Module C ใหม่) · `po.md` §4b · `so.md` §4 · `customer.md` §3/§9b · `numbering-on-save.md` · `permission-matrix.md` · `traceability.md` §3.
- **★ RT vs SHP numbering = Q1 (§12) — ★ รอปอนด์ยืนยัน** (ค่าแนะนำ: RT แทน SHP).
- **★ เพิ่ม (2026-07-29 — comment cross-cutting):** ช่อง comment แก้ในที่ + เก็บประวัติ (Route) — ยึด `comment-convention.md`.
- **คงเดิม:** 2 ชั้น (รอบ + DN) · 1 DN=1 order · DN รองรับทั้ง PO (OEM) และ SO (Own-Brand) · FG ตัด FIFO ราย Batch ตอน dispatch.

## 12. ★ Open question (Module B)
- **Q1 — RT vs SHP numbering (GENUINE, รอปอนด์):** รอบจัดส่งเดิมมีเลข `SHP-{YYYYMMDD}-{NNNN}` (locked, D-F5). ตอนนี้ปอนด์ให้รอบเป็น "Route" รหัส `RT-…`.
  - **ตัวเลือก A (PO แนะนำ):** **RT แทน SHP ทั้งหมด** — รอบเปลี่ยนชื่อเป็น "Route", เลข `RT-{YYYYMMDD}-{NNNN}` (gapless ต่อวัน แบบเดิม), เลิกใช้ SHP (ระบบยังไม่ deploy → ไม่มีข้อมูลจริงต้อง migrate).
  - **ตัวเลือก B:** **RT อยู่ร่วมกับ SHP** — รอบมี 2 เลข (SHP = เลขเอกสารรอบ + RT = route identifier).
  - **ผลต่อเอกสาร:** numbering-on-save §4 · entity-status-map §1.9 · non-functional D-F5 · glossary. เอกสารชุดนี้เขียนด้วย **สมมติฐานตัวเลือก A** ไว้ก่อน; ถ้าปอนด์เลือก B จะปรับ delta เล็ก.
