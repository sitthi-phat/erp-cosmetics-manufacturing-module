# Module — Shipping / Route (การจัดส่ง: รอบจัดส่ง = Route + DN)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-30 · **AUTHORITATIVE SPEC** (absorbs functional-spec `shipping.html` US-SHP-01..03 · **★ Module B rewrite: Shipment→Route (RT-) + new lifecycle · Q1=A LOCKED · ★ + Gate-1 reconciliation r20 2026-07-31: (A2) Route ส่งสำเร็จ noti ยิงตอน "เสร็จสิ้น" (Read Shipping/Route + owning Sale) · Route-cancel = single RT notification (ตัด derived N×DN-void noti) · (A4) purge stale C-codes**)
Mockups: `mockups/shipping.html` · `mockups/delivery-note.html`
กฎอ้างอิง: entity-status-map §1.9 (Route/รอบ) / §1.10 (DN) · `po.md` §4/§4b/§4d (พร้อมจัดส่ง→ตัด FG/dispatch · PO สะท้อนสถานะ DN · cancel blocked while active DN) · `so.md` §4/§5/§8 · `invoice.md` (ส่งสำเร็จ→เริ่มนับเครดิต) · stock (FG FIFO ตอน dispatch, D16) · README §3 (**G6/G8**) · **`comment-convention.md`** · **`numbering-on-save.md` (G8 — เลข Route + DN ออกตอนสร้างรอบ, NS7)** · **`delivery-note.md` (Module C — DN detail/search/status/print)** · **`customer.md` §3/§9b (ที่อยู่จัดส่ง + ผู้รับสินค้า)** · **`platform.md` §7 / `non-functional.md` §7 (Route "เสร็จสิ้น" = noti Route ส่งสำเร็จ; Route-cancel = single RT noti · Read Shipping/Route + owning Sale)**

## สรุปภาษาไทย
จัดส่งเป็น **2 ชั้น**: **รอบจัดส่ง = "Route" (Route Information, รหัส `RT-…`)** รวมหลาย DN + คนขับ/เบอร์/route/ประเภทรถ/ทะเบียน · **DN = 1 ใบต่อ 1 PO/SO เสมอ** (Module C = `delivery-note.md`). **★ รอบจัดส่ง = "Route" รหัส `RT-{YYYYMMDD}-{NNNN}` (gapless ต่อวัน) — DECIDED (Q1=A): RT แทน SHP ทั้งหมด.** **Route LIST:** ค้นด้วย **ชื่อคนขับ / username คนขับ / route id** + **ช่วงวันที่ พร้อม dropdown ชนิดวันที่** · คอลัมน์ **RouteID · วันที่สร้าง · วันที่ออกไปส่ง · จำนวน PO/SO · Status** · ปุ่ม **"สร้าง Route"** · row มี **edit action**. **Route STATUS:** **เตรียมจัดของ** → **กำลังออกไปส่ง** → **เสร็จสิ้น** (บังคับอัปเดตสถานะ DN แต่ละใบ + comment ต่อ DN) · **ยกเลิก** (ได้ทุกเมื่อ). **★ (A2 r20): Route → "เสร็จสิ้น" = ยิง notification "Route ส่งสำเร็จ" 1 ใบ (generic, ผู้รับ = Read Shipping/Route + owning Sale, เห็นทั้งรอบ/ทุก DN) — ไม่อิงผล DN รายใบ. Route → "ยกเลิก" = ยิง notification "RT ถูกยกเลิก" ใบเดียว (ตัดการยิง N×DN-void แยกใบ).** **หน้าสร้าง/แก้ Route:** คนขับ (ค้นชื่อ/username, คนขับ = system user) · **เบอร์ติดต่อคนขับ \*** · Route/เส้นทาง · **ประเภทรถ \*** · ทะเบียนรถ · วัน-เวลาออกรอบ. **เพิ่ม PO/SO/DN:** modal ค้นด้วย code/ชื่อลูกค้า/ชื่อผู้ติดต่อ/เบอร์ผู้ติดต่อ, list เรียงตามวันที่ต้องการรับ, **เลือกได้เฉพาะ "พร้อมจัดส่ง"** (★ SO(ข) "ผลิตเข้าคลังแล้ว" ไม่เข้าข่าย, `so.md` §4). **บันทึกสร้างรอบ → Route = เตรียมจัดของ + G8 popup แสดงเลข Route + สรุป + เลข DN ที่ gen**. คลิก PO/SO/DN → modal แสดง **ชื่อลูกค้า / ที่อยู่จัดส่ง / เบอร์ผู้รับ**. **★ Route มีช่องหมายเหตุ (comment) แก้ในที่ + เก็บประวัติครบ (G6).**

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
| **RouteID `RT-{YYYYMMDD}-{NNNN}`** | string | computed | **★ ออกตอน "สร้าง Route" สำเร็จ + popup (G8/NS2, NS7)** · **RT แทน SHP (renamed, Q1=A DECIDED 2026-07-30)** |
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
| สถานะ Route | เกิดตอน / action | ผลต่อ DN + notification |
|---|---|---|
| **เตรียมจัดของ (Preparing)** | **auto เมื่อสร้าง Route สำเร็จ** | DN ทุกใบ = **อยู่ระหว่างการเตรียม** |
| **กำลังออกไปส่ง (Out for delivery)** | **action** (หลังจัดของ PO/SO เสร็จ) → ตั้งวันที่ route ออกไปส่ง | DN ทุกใบ = **อยู่ระหว่างจัดส่ง** |
| **เสร็จสิ้น (Completed)** | **action** (หลังส่ง) — **บังคับอัปเดตสถานะ DN แต่ละใบ (§4b)** | DN แต่ละใบ = ส่งสำเร็จ / ลูกค้าเลื่อนส่ง / ลูกค้ายกเลิก(การจัดส่ง) / ลูกค้ายังไม่กำหนดวันรับใหม่ · **★ A2: ยิง noti "Route ส่งสำเร็จ" 1 ใบ (generic) → Read Shipping/Route + owning Sale** |
| **ยกเลิก (Cancelled)** | **action — กดได้ทุกเมื่อ** (บังคับเหตุผล) | DN ในรอบ = void (order กลับสู่คิว "พร้อมจัดส่ง" ถ้ายังไม่ dispatch — §4d) · **★ A2: ยิง noti "RT ถูกยกเลิก" ใบเดียว (ตัด N×DN-void noti)** |

> **หมายเหตุ vs โมเดลเดิม:** เดิมมีสถานะ "จบรอบ (Closed) auto/ส่งบางส่วน (Partially)". **ตอนนี้ปิดรอบด้วย action "เสร็จสิ้น" ที่ผู้ใช้กด** แทน auto-close. "ส่งบางส่วน" = **ป้าย reconcile/สรุป** (breakdown ราย DN) ไม่ใช่ lifecycle status.

### 4b. ★ "เสร็จสิ้น" process — บังคับอัปเดตสถานะ DN ทุกใบ + comment (G6) · ★ A2 single Route-delivered notification
เมื่อกด **"เสร็จสิ้น (Completed)"** ระบบบังคับให้ **สรุปผลราย DN ทุกใบในรอบ** — ต่อ DN เลือก 1 ใน:
| ผล DN | เงื่อนไข/ข้อมูลเพิ่ม | ผลต่อ PO/SO (สะท้อนจาก DN — po.md §4b) |
|---|---|---|
| **ส่งสำเร็จ (Delivered)** | — | PO/SO = ส่งสำเร็จ · **ตัด FG FIFO ราย Batch (dispatch)** · เริ่มนับ overdue · **Finance เห็นผ่าน queue (invoice/overdue) — queue-discovered, ไม่ยิง noti Finance แยก** |
| **ลูกค้าเลื่อนส่ง (Postponed)** | **บังคับกรอก "วันที่นัดส่งครั้งถัดไป (next delivery date)"** | PO/SO สะท้อน "ลูกค้าเลื่อนส่ง" + order ค้างคิว รอ re-route ในวันนัด |
| **ลูกค้ายังไม่กำหนดวันรับใหม่ (ฝากที่เราไว้ก่อน) (Awaiting-new-date)** | — | PO/SO สะท้อน "ลูกค้ายังไม่กำหนดวันรับใหม่" · ของฝากไว้ที่เรา · **★ C4: OEM → นับเป็น OEM FG stock (OEM identity, sellable, `stock.md` §4)** |
| **ลูกค้ายกเลิก (ยกเลิกการจัดส่ง) (Delivery-Cancelled)** | — | **★ A2: ยกเลิก *การจัดส่ง* ไม่ใช่ยกเลิก order — PO/SO ไม่เปลี่ยนเป็น "ยกเลิก"; ไม่ยิง noti "เอกสารถูกยกเลิก/ปฏิเสธ"** · จัดการของคืน/สต็อกตามนโยบาย (**★ C4: OEM → กลับเข้า FG stock, OEM identity, sellable**) |
- **★ ทุก DN ที่อัปเดต = บังคับ comment ต่อ DN (G6)** (`comment-convention.md` · `delivery-note.md` §6).
- ปิดรอบ "เสร็จสิ้น" ได้เมื่อ **ทุก DN ถูกให้ผลครบ**.
- **★ A2 notification (r20):** เมื่อ Route เข้า **"เสร็จสิ้น"** → ยิง **notification "Route ส่งสำเร็จ" 1 ใบต่อรอบ (generic wording, ไม่แยกผล DN รายใบ)** · **ผู้รับ = Read Shipping/Route + owning Sale (เจ้าของงาน/ลูกค้าต้นทางของ Route นั้น; เฟสนี้ Sale เห็นทั้งรอบ/ทุก DN — ยอมรับ)** · deep-link = Route (RT) และ/หรือ DN. (`platform.md` §7 หมวด 1 · `non-functional.md` §7.)
- **DN ที่ผลไม่ใช่ "ส่งสำเร็จ"** (เลื่อน/ยกเลิกการจัดส่ง/ยังไม่กำหนดวัน) → order re-route ในรอบใหม่ = **gen DN ใบใหม่** (DN เดิมคงสถานะสุดท้ายเป็นประวัติ; PO สะท้อน DN ล่าสุด non-void — po.md §4b).
- **ทางเลือกที่ 2:** ผู้มีสิทธิ์ **A (Approve)** แก้สถานะ DN ได้โดยตรงจากหน้า DN (Module C `delivery-note.md` §6).

## 4c. ★ Comment + change-history (Route — ยึด `comment-convention.md`)
- **Route (รอบ) มีช่อง comment เดียว** · แก้ในที่ (overwrite) · ทุกครั้งเก็บ **ใคร/เมื่อ/เดิม→ใหม่** ผ่าน field-audit เดิม; หน้า shipping แสดง **ค่าปัจจุบัน + "ประวัติการแก้ไข comment"**.
- การแก้ = activity-log event + **โผล่บน trace** (entity=Route, field=`comment`). **DN comment = แยกช่อง (Module C).**

## 4d. ★ Route ยกเลิก (Cancel) — ผลต่อ DN + order (settled) · ★ A2 single RT notification
- กด **"ยกเลิก Route"** ได้ **ทุกเมื่อ** (จากสถานะ เตรียมจัดของ **หรือ** กำลังออกไปส่ง) — **บังคับเหตุผล (comment)** · สิทธิ์ Shipping.**Update (U)** (§6).
- **DN ทุกใบในรอบ = ยกเลิก (void)** — คงเลข DN ไว้เป็นประวัติ (G8/NS5) · ไม่ถือเป็นสถานะจัดส่งของลูกค้า (ต่างจาก "ลูกค้ายกเลิก (ยกเลิกการจัดส่ง)" ที่เป็นผลการส่ง §4b).
- **★ A2 notification (r20): Route cancel = ยิง notification "RT-… ถูกยกเลิก" ใบเดียว (single RT event)** → **ตัด/ระงับการยิง notification ราย DN-void แยกใบ (ไม่ยิง N×DN-void)** — กัน notification storm. ผู้รับ = Read Shipping/Route (+ owning Sale ตาม fan-out เดียวกับ Route event). event ประเภท = "เอกสารถูกยกเลิก/ปฏิเสธ" (RT ถูกยกเลิกจริง) — `platform.md` §7 หมวด 1.
- **order (PO/SO) ที่ยังไม่ dispatch** → **ปล่อยกลับสู่คิว "พร้อมจัดส่ง"** = เลือกเข้ารอบใหม่ได้อีก. **PO/SO delivery status = กลับไปแสดง "พร้อมจัดส่ง"** (ไม่มี DN active — po.md §4b).
- **order ที่ dispatch แล้ว** (มี DN "ส่งสำเร็จ") → **ไม่กลับคิว**; การยกเลิกรอบ **ไม่ย้อน FG ที่ตัดไปแล้ว** — การเอาของคืน = ผ่าน Return.
- **★ (C3 r20) precedence:** การยกเลิก order (PO/SO) โดยตรงถูกบล็อกขณะมี DN active (`po.md` §4d / `so.md` §8) → **การยกเลิกรอบ Route/void DN ที่นี่คือทางจัดการ** (void DN ก่อน → order กลับคิว → แล้วจึงยกเลิก order ต้นทางได้).
- ยกเลิก Route = **void gapless** (`non-functional.md` §10) · audit ครบ (`traceability.md` §4).

## 5. ★ Create/Update Route flow (delta)
1. กด **"สร้าง Route (C)"** (มุมขวาบน list) → หน้า create.
2. กรอกหัวรอบ: **คนขับ** (search-in-dropdown ค้น **ชื่อ หรือ username**) · **เบอร์ติดต่อคนขับ \*** · **Route/เส้นทาง** · **ประเภทรถ \*** · **ทะเบียนรถ** · **วัน-เวลาออกรอบ**. **★ ช่องเลข Route/DN = read-only "(ระบบออกให้เมื่อบันทึก)" (G8/NS1).**
3. **เพิ่ม PO/SO/DN เข้ารอบ (modal):**
   - **candidate list เรียงตาม "วันที่ต้องการรับของ" เร็ว→ช้า**.
   - **modal ค้นด้วย code (PO/SO/DN) · ชื่อลูกค้า · ชื่อผู้ติดต่อ · เบอร์ผู้ติดต่อ** — **ค้นได้ทุกสถานะ** แต่ **เลือกได้เฉพาะ PO/SO ที่สถานะ = "พร้อมจัดส่ง (Ready to Ship)"** (**★ C2: SO(ข) "ผลิตเข้าคลังแล้ว" ไม่ใช่ "พร้อมจัดส่ง" → ไม่อยู่ใน candidate**, `so.md` §4).
   - **filter สถานะ** (default = **พร้อมจัดส่ง**).
   - เลือกได้หลาย order เข้ารอบเดียว → **1 DN ต่อ 1 PO/SO**.
4. **บันทึก (สร้างรอบ)** →
   - Route = **เตรียมจัดของ**.
   - **★ gen DN ราย order + ออกเลข Route + ทุก DN แบบ gapless ตอนบันทึกสำเร็จ (G8/NS2, NS7)**.
   - **★ popup ยืนยันแสดง: (ก) เลข Route + (ข) สรุปรอบ + (ค) เลข DN ทุกใบ พร้อมระบุ "PO/SO ใบไหนได้ DN เลขใด" + (ง) ลิงก์ดู/พิมพ์ DN** (NS7).
   - **★ ทันทีที่ DN เกิด: PO/SO ที่ผูกเปลี่ยน delivery status เป็น "อยู่ระหว่างการเตรียม"** (สะท้อนจาก DN — po.md §4b / so.md §4).
5. **คลิก PO/SO/DN ในรอบ → modal รายละเอียด** แสดง: **ชื่อลูกค้า · ที่อยู่จัดส่ง · เบอร์ผู้รับสินค้า** (จาก `customer.md` §3/§9b) + code + วันที่ต้องการรับ. กลับได้ไม่เสีย state (G3).
6. **Update Route (row edit action):** เปิด Route เดิม → **เปลี่ยนสถานะ · แก้ comment · เพิ่ม/แก้ SO/PO ในรอบ** (เพิ่ม order = gen DN ใหม่; เอา order ออกได้ก่อน dispatch → order กลับคิว "พร้อมจัดส่ง", DN "อยู่ระหว่างการเตรียม" ถูก void).

### 5.1 ★ Own-Brand SO ผ่าน Route (เหมือน PO ทุกประการ)
- **SO โหมด (ก) ที่สถานะ "พร้อมส่ง (Ready to Ship)"** เข้ารอบได้เหมือน PO.
- gen **DN อ้าง SO** (1 DN = 1 SO), lifecycle DN + สถานะจัดส่ง SO = สะท้อน DN เหมือน PO (`so.md` §4).
- ตัด **FG FIFO ราย Batch** ตอน DN "ส่งสำเร็จ" (D16). **★ SO โหมด (ข) = "ผลิตเข้าคลังแล้ว" (ไม่เข้ารอบ — ไม่มีขั้นจัดส่ง/DN, `so.md` §4).**
- **★ C4: OEM PO ที่ fulfil จาก OEM FG stock (`po.md` §5.4) เข้ารอบเหมือน PO ผลิตปกติ** — line from-stock = "พร้อมจัดส่ง" → เข้า candidate.

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required | Suffix (G9) |
|---|---|---|
| ดู list/รอบ/DN + **ดูประวัติ comment** | Shipping.**Read (R)** | (R) |
| **สร้าง Route + gen DN (อ้าง PO หรือ SO, ★ ออกเลข RT+DN)** | Shipping.**Create (C)** | **(C)** |
| **แก้ Route (สถานะ/comment/เพิ่ม-แก้ SO/PO)** | Shipping.**Update (U)** | **(U)** |
| Route → กำลังออกไปส่ง / เสร็จสิ้น (+ อัปเดต DN · ★ ยิง noti Route ส่งสำเร็จ) | Shipping.**Update (U)** | **(U)** |
| ยกเลิก Route (+ เหตุผล · ★ ยิง noti RT ถูกยกเลิก ใบเดียว) | Shipping.**Update (U)** | **(U)** |
| **แก้ไข comment รอบ (แก้ในที่)** | Shipping.**Update (U)** | **(U)** |
| **★ แก้สถานะ DN โดยตรง (จากหน้า DN)** | Shipping.**Approve (A)** — **ดู `delivery-note.md` §6** | **(A)** |
| print DN / print Invoice | Shipping.**Read (R)** / Invoice.**Read (R)** | (R) |

## 7. Validations
- เข้ารอบได้เฉพาะ order สถานะ **"พร้อมจัดส่ง"** (ค้นเจอทุกสถานะ แต่เลือกไม่ได้ถ้าไม่ใช่พร้อมจัดส่ง + แจ้งเหตุผล; **★ SO(ข) "ผลิตเข้าคลังแล้ว" ไม่เข้าข่าย**).
- 1 DN = 1 PO/SO.
- **★ เบอร์ติดต่อคนขับ + ประเภทรถ = บังคับ (required)** ตอนสร้าง/แก้ Route.
- **★ เลข Route + ทุก DN ในรอบ ออกตอน "สร้างรอบ" สำเร็จเท่านั้น (G8/NS2, NS7) — สร้างรอบไม่สำเร็จ = ไม่ออกเลข (NS4).**
- **★ "เสร็จสิ้น" = ต้องอัปเดตสถานะ DN ทุกใบให้ครบ + comment ต่อ DN (G6)** · **ลูกค้าเลื่อนส่ง → บังคับกรอกวันนัดถัดไป** · **★ A2: ยิง noti "Route ส่งสำเร็จ" 1 ใบ (Read Shipping/Route + owning Sale)**.
- **★ ยกเลิก Route = บังคับเหตุผล; DN ในรอบ void; order ที่ยังไม่ dispatch กลับคิวพร้อมจัดส่ง (§4d); ★ A2: ยิง noti "RT ถูกยกเลิก" ใบเดียว (ไม่ยิง N×DN-void).**
- **★ (A2): DN "ลูกค้ายกเลิก (ยกเลิกการจัดส่ง)" = delivery status — order ไม่เปลี่ยน + ไม่ยิง noti doc-cancel (`delivery-note.md` §7).**
- print DN/Invoice ต้องมี DN แล้ว (DN สร้างผ่านรอบเท่านั้น).
- **★ comment รอบ (หมายเหตุทั่วไป) = ไม่บังคับ** · แก้ได้ทุกสถานะ · ทุกการแก้ถูก audit (CC2/CC3).

## 8. Pagination / Search (Route list)
- Route list: 20/หน้า (G1).
- **ค้นด้วย: ชื่อคนขับ / username คนขับ / route id** + **ช่วงวันที่ พร้อม dropdown ชนิดวันที่ {วันที่สร้าง route · วันที่ route ออกไปส่ง}** (G2).
- **คอลัมน์: RouteID · วันที่สร้าง · วันที่ออกไปส่ง · จำนวน PO/SO · Status** · filter สถานะ Route.

## 9. Formulas
- Route "เสร็จสิ้น" = ผู้ใช้กด action + ให้ผลราย DN ครบทุกใบ (ไม่ใช่ auto-close) · **★ A2: ยิง noti "Route ส่งสำเร็จ" 1 ใบ (generic)**.
- Route "ยกเลิก" = **★ A2: ยิง noti "RT ถูกยกเลิก" ใบเดียว (ตัด derived N×DN-void noti)**.
- FG ตัดตอน dispatch (DN "ส่งสำเร็จ") = FIFO ราย Batch (D16).
- จำนวน PO/SO ในรอบ = จำนวน DN ในรอบ (1:1).

## 10. Cross-links
- order พร้อมจัดส่ง → `po.md` §4/§4b · `so.md` §4/§5/§8 (**★ SO(ข) "ผลิตเข้าคลังแล้ว" ไม่เข้ารอบ**). DN ส่งสำเร็จ→เริ่มนับเครดิต → `invoice.md` (Finance = queue-discovered ผ่าน invoice/overdue). เลื่อน/ยกเลิกการจัดส่ง/ยังไม่กำหนดวัน → `delivery-note.md` §7.
- **★ (A2) Route "เสร็จสิ้น" = noti Route ส่งสำเร็จ (Read Shipping/Route + owning Sale) · Route cancel = single RT noti · DN "ยกเลิกการจัดส่ง" ≠ doc-cancel → `platform.md` §7 · `non-functional.md` §7 · `delivery-note.md` §7.**
- **★ (C3) order cancel blocked while active DN → `po.md` §4d · `so.md` §8.**
- **★ (C4) customer-cancelled/held OEM → FG stock (OEM identity, sellable) → `stock.md` §4 · `po.md` §5.4.**
- **★ DN detail/search/status/print/comment/แก้สถานะ(A) → `delivery-note.md` (Module C).**
- **★ ที่อยู่จัดส่ง + ผู้รับสินค้า (modal) → `customer.md` §3/§9b.**
- **★ เลข RT+DN ออกตอนสร้างรอบ (G8/NS7) → `numbering-on-save.md` · gapless → `non-functional.md` §5 (D-F5).**
- **Comment + change-history → `comment-convention.md` · field-audit → `traceability.md` §4.**
- FG dispatch FIFO → `stock.md`.

## 11. Module changelog
- **Absorbed:** functional-spec `shipping.html` US-SHP-01..03 (9 AC) verbatim ในความหมาย.
- **★★ REWRITE (2026-07-30 — Module B, ปอนด์):** รอบจัดส่ง **Shipment → "Route" (`RT-…`)**; สถานะใหม่ เตรียมจัดของ → กำลังออกไปส่ง → เสร็จสิ้น / ยกเลิก; "เสร็จสิ้น" = action บังคับสรุปผลราย DN + comment (G6); หน้าสร้าง/แก้ Route + modal เพิ่ม PO/SO/DN + Route list. **★ เลข RT + ทุก DN ออกตอนสร้างรอบ + popup (G8/NS7).** sync `entity-status-map.md` · `delivery-note.md` · `po.md` §4b · `so.md` §4 · `customer.md` §3/§9b · `numbering-on-save.md` · `permission-matrix.md` · `traceability.md` §3.
- **★ RT vs SHP numbering = DECIDED (Q1=A):** RT แทน SHP ทั้งหมด — §12.
- **★ เพิ่ม (2026-07-30 — Q1=A lock, ปอนด์):** §4d Route ยกเลิก; §5.1 Own-Brand SO ผ่าน Route; §5 step 4.
- **★ เพิ่ม (2026-07-29 — comment cross-cutting):** ช่อง comment แก้ในที่ + เก็บประวัติ (Route).
- **★ เพิ่ม (2026-07-31 — Gate-1 review reconciliation r20, ปอนด์):**
  - **(A2):** §4/§4b Route → **"เสร็จสิ้น" = ยิง noti "Route ส่งสำเร็จ" 1 ใบ (generic, Read Shipping/Route + owning Sale, เห็นทั้งรอบ)** — ไม่อิงผล DN รายใบ · §4d Route → **"ยกเลิก" = ยิง noti "RT ถูกยกเลิก" ใบเดียว → ตัดการยิง N×DN-void แยกใบ** (กัน noti storm) · DN "ลูกค้ายกเลิก" = **"ยกเลิกการจัดส่ง"** (order ไม่เปลี่ยน + ไม่ยิง doc-cancel noti, `delivery-note.md` §7). summary/§4/§4b/§4d/§6/§7/§9/§10.
  - **(A4 — purge stale C-codes):** ลบ/แทน **C9 · C10 · C12** (ที่ยังอ้างในตาราง "เสร็จสิ้น" + cross-links) — Finance = **queue-discovered** (invoice/overdue) ไม่ยิง noti แยก; wording แทนด้วยชื่อ event r19/r20 หรือ note "queue-discovered". §4b/§10.
  - **(C2/C4 refs):** SO(ข) "ผลิตเข้าคลังแล้ว" ไม่เข้า candidate (§5 step3/§5.1/§7); OEM PO from-stock เข้ารอบเหมือน PO (§5.1); customer-cancelled/held OEM → FG stock OEM identity (§4b/§10).
  - **ใช้ view เดิม (`shipping.html` render จาก .md).**
- **คงเดิม:** 2 ชั้น (รอบ + DN) · 1 DN=1 order · FG ตัด FIFO ราย Batch ตอน dispatch.

## 12. ★ DECIDED — Q1=A (RT แทน SHP, ปอนด์ 2026-07-30)
- **Q1 = A (LOCKED):** รอบจัดส่ง = **"Route" รหัส `RT-{YYYYMMDD}-{NNNN}` (gapless ต่อวัน)** — **RT แทน SHP ทั้งหมด, drop SHP.**
- **Historical note เท่านั้น:** SHP → RT (renamed). ไม่มี SHP reference คงเหลือ.
- **ไม่มี open question ค้างในโมดูลนี้.**
