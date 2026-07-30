# Module — Dashboard รายแผนก (×7)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 (**+ Shipping tiles → Route/DN r11 2026-07-30**) · **AUTHORITATIVE SPEC** (absorbs functional-spec `dashboard.html` US-DSH-01..04 + 7 dept stories, 29 tiles)
Mockups: `mockups/dashboard.html`
กฎอ้างอิง: po-spec-depth-audit §2.2 (นิยาม tile) · status-journeys §12 · stock-reservation (Available/valuation) · RUCDAA Read scope · README §3 (G1–G3) · **`delivery-note.md` §7 (DN 6 สถานะ) · `po.md` §4b (PO/SO สะท้อน DN)**

## สรุปภาษาไทย
Dashboard 7 แผนก: **Sale(5) · Stock(4) · Production(4) · QC(4) · Shipping(4) · Finance(4) · Admin(4) = 29 tile**. เห็นแผนกใด = **ยึด permission Read ของ module นั้นล้วน ๆ** (ไม่เกี่ยวชื่อ role); มีหลายแผนกสลับด้วย tab/selector. แต่ละ tile ระบุชนิด **event (ในช่วง)** = นับเหตุการณ์ตาม date-filter หรือ **state (ตอนนี้)** = snapshot ไม่ขึ้นกับช่วง. filter default = เดือนนี้ (วันนี้/สัปดาห์นี้/เดือนนี้/กำหนดเอง). auto-refresh 15s (default, คง view/drill/filter). ทุก tile drill-down → list + pagination + deep link พร้อม context. **"ใกล้หมด" เทียบ Available (on_hand−Reserved) เฉพาะที่ตั้ง threshold** · **มูลค่าสต็อก = Σ(on_hand ต่อ lot × ราคาซื้อล่าสุดของ lot) ไม่หัก Reserved** (COGS นอก scope). **★ r11: Shipping tiles ใช้ DN 6 สถานะใหม่ + Route (`RT-…`, ไม่มี SHP).** ตัวเลขต้องตรงกับ Home task inbox + noti ของ user คนเดียวกัน.

---

## 1. Purpose
ให้ผู้ใช้แต่ละแผนกเห็นสถานะ/KPI งานของแผนกตนเป็น tile พร้อม drill ลงไปทำงานต่อได้ทันที — ตัวเลขเป็นความจริงเดียวกับ Home + notification.

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `dashboard.html` | 7 แผนก (สลับตาม Read) · date-filter presets + custom range · tile drill-down + pagination · refresh/auto-15s toggle + เวลารีเฟรชล่าสุด |

## 3. โครง tile (29) + ชนิด + สูตร + drill
### 3.1 Sale (5) · Read Sale
| tile | สูตร/เงื่อนไข | ชนิด | drill → ปลายทาง |
|---|---|---|---|
| ลูกค้าประจำ | count(customer.status=ลูกค้าประจำ AND มี order ในช่วง) | event | ชื่อ/สถานะ → customer-detail |
| ห่างหาย | count(customer→ห่างหาย ในช่วง โดย scheduler; เกณฑ์ inactive_after_months default 3, ชุด {1,3,6,8}) | event | ชื่อ/เหตุ → customer-detail |
| PO | count(po.created_date ในช่วง) | event | PO/ลูกค้า/สถานะ → po-detail |
| รอชำระ | count(invoice.status=รอชำระ AND ยังไม่เกินกำหนด AND issued ในช่วง) | event | INV/ลูกค้า/ครบกำหนด → invoice-detail |
| ต้องติดตาม | count(customer.status=ต้องติดตาม ที่ยังค้าง) | **state** | ชื่อ/เหตุผล(comment) → customer-detail |

### 3.2 Stock (4) · Read Stock
| tile | สูตร/เงื่อนไข | ชนิด | drill |
|---|---|---|---|
| ใกล้หมด | count(วัตถุดิบที่ **Available (on_hand−Reserved) ≤ low_stock_threshold**; เฉพาะที่ตั้ง threshold — null=ไม่นับ) | **state** | วัตถุดิบ/ใช้ได้ → stock |
| ล็อตรอ QC | count(lot.qc_status=รอตรวจรับ) | **state** | lot/วัตถุดิบ → qc |
| คำขอ PR ค้าง | count(PR.status ∈ {เปิดคำขอ, รับทราบ, รับบางส่วน}) | **state** | PR/วัตถุดิบ/สถานะ → pr |
| มูลค่าสต็อก | Σ(**on_hand** ต่อ lot × ราคาซื้อล่าสุดของ lot) · **ไม่หัก Reserved** · lot on_hand ติดลบหักลบยอด | **state** | วัตถุดิบมูลค่าสูงสุด → stock |

### 3.3 Production (4) · Read Production
| tile | สูตร | ชนิด | drill |
|---|---|---|---|
| คิวงานผลิต | count(รอรับงาน) + count(PRD ∈ {รับงาน,กำลังผลิต,รอ QC,Rework}) — caption "รอรับงาน X + ในสายผลิต Y" | **state** | รายการ/สถานะ → production |
| เสี่ยงล่าช้า | count(PRD potential_delay=true; เกณฑ์ 2 วันผลิต + 1 วันส่ง เทียบวันต้องการรับ) | **state** | PRD/เหลือกี่วัน → production |
| พักงาน (Hold) | count(PRD.status=พักงาน) | **state** | PRD/เหตุ Hold → production |
| ผลิตเสร็จ | count(Batch ผ่าน QC หรือ PRD→พร้อมส่งมอบ ในช่วง) | event | PRD/สถานะ → production |

### 3.4 QC (4) · Read QC
| tile | สูตร | ชนิด | drill |
|---|---|---|---|
| ล็อตรอตรวจรับ | count(lot.qc_status=รอตรวจรับ) | **state** | lot → qc |
| แบตช์รอ QC | count(batch.status=รอ QC) | **state** | batch → qc |
| ผ่าน QC | count(qc_record.result=ผ่าน ในช่วง; รวม lot+batch) | event | รายการ/ชนิด → qc |
| รอทำใบคืน | count(lot.qc_status=ระงับ AND ยังไม่มี return_doc) | **state** | lot เสีย → return |

### 3.5 Shipping (4) · Read Shipping · **★ r11 Route/DN**
| tile | สูตร | ชนิด | drill |
|---|---|---|---|
| รอจัดส่ง | count(PO/SO delivery-status=พร้อมจัดส่ง — ยังไม่มี DN active; **รวม order ที่ DN=ลูกค้าเลื่อนส่ง/ลูกค้ายังไม่กำหนดวันรับใหม่ รอ re-route**) | **state** | PO/SO/ลูกค้า/เหตุ → shipping |
| กำลังจัดส่ง | count(DN.status ∈ {อยู่ระหว่างการเตรียม, อยู่ระหว่างจัดส่ง}) | **state** | Route/DN → delivery-note |
| ส่งสำเร็จ | count(DN→ส่งสำเร็จ ในช่วง) | event | DN → delivery-note |
| เลื่อน/ยกเลิก | count(DN→ลูกค้าเลื่อนส่ง หรือ ลูกค้ายกเลิก หรือ ลูกค้ายังไม่กำหนดวันรับใหม่ ในช่วง) | event | PO/SO/เหตุ → delivery-note |

### 3.6 Finance (4) · Read Finance/Invoice
| tile | สูตร | ชนิด | drill |
|---|---|---|---|
| รอวางบิล | count(PO.billing=ยังไม่วางบิล AND fulfil ≥ ยืนยันแล้ว) | **state** | PO → invoices |
| ค้างชำระ | count(invoice ครบกำหนดในช่วง AND ยังไม่จ่าย) | event | INV/ลูกค้า/+วัน → invoice-detail |
| รับชำระ | Σ(ยอดรับชำระในช่วง) — **เป็นยอดเงิน ไม่ใช่ count** | event | รายการรับชำระ → invoice-detail |
| เกินกำหนด | count(invoice.status=เกินกำหนด ที่ยังค้าง) | **state** | INV/+วัน → invoice-detail |

### 3.7 Admin (4) · Read Admin/Settings
| tile | สูตร | ชนิด | drill |
|---|---|---|---|
| ผู้ใช้ทั้งหมด | count(user ที่ไม่ถูก soft-delete) | **state** | user/role/สถานะ → settings |
| Role | count(role) | **state** | role/จำนวนสิทธิ์ → settings |
| เข้าใช้ | count(login events ในช่วง) | event | user/เวลา → trace |
| เหตุการณ์ trace | count(audit_log ในช่วง) | event | audit ล่าสุด → trace |

## 4. User Stories (absorbed) + AC สรุป
- **US-DSH-01 (Must) — auto-refresh 15s คง view/drill:** ครบ 15s หรือกด refresh → ตัวเลขอัปเดตแต่คง drill+filter เดิม + "อัปเดตล่าสุด HH:MM:SS". ปิด toggle = ไม่รีเฟรชเอง. โหลด aggregate ล้มเหลว → คงค่าเดิม + แถบเตือน (ไม่ล้างเป็นค่าว่าง).
- **US-DSH-02 (Must) — drill-down → list + pagination + deep link พร้อม context:** กด tile → list เบื้องหลัง + คอลัมน์ที่กำหนด + pagination; คลิกแถว → module ปลายทางพร้อม context. tile=0 → empty state "ไม่มีรายการ". drill รายการที่ไม่มีสิทธิ์ Read ปลายทาง → 403.
- **US-DSH-03 (Must) — date filter presets + custom + event/state:** default เดือนนี้ · presets วันนี้/สัปดาห์นี้/เดือนนี้/กำหนดเอง (เดือน-ปี หรือ range). เปลี่ยนช่วง → tile **event** รีคำนวณพร้อมกัน, tile **state** คงค่า snapshot. custom + คง drill ที่เปิดอยู่ (ไม่เด้งปิด). เริ่ม>สิ้นสุด = error "ช่วงวันที่ไม่ถูกต้อง" + **ไม่ยิง query**.
- **US-DSH-04 (Must) — เห็นแผนกตาม Read + สลับ:** ตัวสลับแสดงเฉพาะแผนกที่มี Read (ยึด permission ล้วน). 1 แผนก = ไม่มีตัวสลับ; มีครบ = 7 แผนก. URL แผนกที่ไม่มีสิทธิ์ = 403.
- **7 dept stories (SALE/STK/PRD/QC/SHP/FIN/ADM):** ตาราง §3 = นิยาม/สูตร/ชนิด/drill ครบทุก tile + AC happy/edge/error ต่อแผนก (เช่น มูลค่าสต็อก on_hand ไม่หักจอง; ใกล้หมด=Available เฉพาะ threshold; คิวงานแยกรอรับงาน/ในสายผลิต; รับชำระ=ยอดเงิน; ผู้ใช้ไม่นับ soft-delete; **★ r11 Shipping = DN 6 สถานะ/Route**).

## 5. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| เห็นแผนก X + tile | **Read (R)** ของ module ที่ map กับแผนก X |
| drill → module ปลายทาง | **Read (R)** ของ module ปลายทาง (ไม่มี = 403) |
| เปลี่ยน filter / toggle refresh | Read (view-level, ไม่มี write) |
> Dashboard เป็น read-only (ไม่มี write action).

## 6. Data rules
- 7 แผนก / 29 tile · แสดงตาม Read ราย module · สลับได้ถ้ามีหลายแผนก.
- ชนิด tile: event = นับในช่วง filter · state = snapshot ปัจจุบัน · caption ระบุ "ในช่วง"/"ตอนนี้".
- filter default เดือนนี้ · presets + custom · มีผลกับทุก tile event พร้อมกัน · เริ่ม>สิ้นสุด = error ไม่ยิง query.
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
- ตัวเลขตรงกับ `home.md` (task inbox) + `platform.md` (noti badge, source เดียว). ใกล้หมด/มูลค่า ↔ `stock.md` (3 ยอด). tile ↔ module ปลายทางทุกอัน. สิทธิ์ Read ↔ `permission-matrix.md`. **★ Shipping tiles ↔ `delivery-note.md` §7 / `shipping.md` §4 / `po.md` §4b.**

## 10. Module changelog
- **Absorbed:** functional-spec `dashboard.html` US-DSH-01..04 + 7 dept stories (11 stories, 33 AC, 29 tile) verbatim ในความหมาย.
- **★ UPDATED (2026-07-30 — Route/DN r11):** Shipping (4) tiles ใช้ **DN 6 สถานะใหม่** — "กำลังนำส่ง"→**"กำลังจัดส่ง"** (อยู่ระหว่างการเตรียม+อยู่ระหว่างจัดส่ง), "ส่งถึงแล้ว"→**"ส่งสำเร็จ"**, "เลื่อน/ปฏิเสธ"→**"เลื่อน/ยกเลิก"** (ลูกค้าเลื่อนส่ง/ยกเลิก/ยังไม่กำหนดวัน); "รอจัดส่ง" = PO/SO delivery-status พร้อมจัดส่ง + order รอ re-route; **drill = Route/DN → delivery-note (ไม่มี SHP)**. §3.5/§6/§8/§9.
- **คงเดิม:** event/state typing · ใกล้หมด=Available · มูลค่า=on_hand ไม่หักจอง · Read-scope visibility · single-source count.
