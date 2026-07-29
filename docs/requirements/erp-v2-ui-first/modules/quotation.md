# Module — Quotation (ใบเสนอราคา OEM)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29
Mockups: `mockups/quotation-list.html` · `mockups/quotation-create.html` · `mockups/quotation-detail.html`
กฎอ้างอิง: **D18** (OEM Quotation) · D3 (RM-direct ผ่านขั้นผลิต) · README §3 (G1–G5) · §4 (Convert-to-PO resolution) · `deletion-policy.md` §2.9 (cancel-anytime) · **`customer.md` §4.2 (hard block Disabled/Blacklist)** · **`traceability.md` §3/§4 (QT = head-of-chain, activity/field-audit)** · **`non-functional.md` §3 (AU1 audit)**

## สรุปภาษาไทย
ใบเสนอราคา **เฉพาะสาย OEM** (Own-Brand SO ไม่มี Quotation). เลข `QT-{YYYYMM}-{NNNNNN}`. สถานะ: **ร่าง (Draft) / ส่งแล้ว (Sent) / ยืนยัน (Confirmed) / ปฏิเสธ (Rejected) + ยกเลิก (Cancelled)** · **แก้ทุกครั้ง = เวอร์ชันใหม่เสมอ (immutable)** · ไม่มีวันหมดอายุ. Create + Edit: **customer search dropdown**, มี **"เช็ควัตถุดิบตามสูตร (เหมือน PO · แต่ไม่สร้าง/ส่ง PR)"** ทั้งหน้า create และ edit. **★ ลูกค้าสถานะ Disabled/Blacklist = เปิด/ยืนยัน QT ไม่ได้ (HARD block)**. ปุ่มหลัก = **"บันทึก"** แล้วโชว์ **print-ready view**. **★ เพิ่มฟิลด์ "วันที่ส่งลูกค้า (sent-date)"** — ตั้งค่าเมื่อกด "ส่งลูกค้า" · list ค้นได้ **2 แกนวันที่: ช่วงวันที่สร้าง + ช่วงวันที่ส่งลูกค้า** และ filter/badge ครบทุกสถานะ **รวม "ส่งแล้ว (Sent)"**. **★ Convert to PO (2026-07-29 — DECIDED):** กด "Convert to PO (ออก PO เลขใหม่)" → **popup ยืนยัน "สถานะจะเปลี่ยนเป็น ยืนยัน (Confirmed)"** → ตั้ง QT = **ยืนยัน (Confirmed) ทันที** (immutable) ไม่ว่าจะไปสร้าง PO ต่อหรือไม่ → ให้ผู้ใช้ **เลือก "ไปสร้าง PO เดี๋ยวนี้ (prefill)" หรือ "ไว้ทีหลัง"**. ถ้า QT = Confirmed แต่ **ยังไม่มี PO** → detail โชว์ banner ถาวร *"ใบเสนอราคานี้ได้รับการยืนยันแล้ว"* + ปุ่ม **"ไปสร้าง PO ด้วยข้อมูลนี้"** (ไม่ใช่ครั้งเดียว). PO อ้าง QT แบบ **loose reference → ไม่มี cascade**. **★ ยกเลิกได้ทุกสถานะ** (เหตุผลบังคับ). **★ ทุก action (create/send/edit→version/convert→Confirmed/cancel) เขียน activity-log + โผล่หน้า traceability** (QT = หัวสาย OEM: QT→PO→PRD→Batch→…).

---

## 1. Purpose
เป็นก้าวหน้าเริ่มต้นของสาย OEM: เสนอราคาให้ลูกค้า, ต่อรอง (เวอร์ชันใหม่), เมื่อลูกค้าตกลงกด **"Convert to PO"** → QT = **ยืนยัน (Confirmed)** + แปลงเป็น PO เข้าสายผลิตเดิม. **optional** — สร้าง PO ตรงโดยไม่มี Quotation ก็ได้ (D18-3).

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `quotation-list.html` | list QT + **filter สถานะครบชุด: ร่าง / ส่งแล้ว / ยืนยัน / ปฏิเสธ / ยกเลิก** (badge ครบทุกสถานะ) + **search เลข QT / ช่วงวันที่สร้าง / ★ ช่วงวันที่ส่งลูกค้า** (G2 ขยาย 2 แกนวันที่) + 20/หน้า (G1) |
| `quotation-create.html` | สร้าง QT ใหม่ (customer dropdown, line, **material check เหมือน Page PO — ไม่สร้าง/ส่ง PR**) |
| `quotation-detail.html` | ดูรายละเอียด + ประวัติเวอร์ชัน + **activity-log (แสดงในหน้า)** + ปุ่ม **Convert to PO** (popup → Confirmed) + **banner "ยืนยันแล้ว · ไปสร้าง PO ด้วยข้อมูลนี้" (ถาวร เมื่อ Confirmed-แต่ยังไม่มี PO)** + **ปุ่มยกเลิก** + **print-ready view** |
| edit = สร้างเวอร์ชันใหม่จาก detail (immutable) | **มี material check เหมือนหน้า create** (ไม่สร้าง/ส่ง PR) |

## 3. Fields
| ฟิลด์ | หน่วย/ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| เลข `QT-{YYYYMM}-{NNNNNN}` | string | computed (auto, gapless ต่อเดือน) | ออกตอนบันทึกครั้งแรก · ยกเลิกแล้วเลขคงอยู่ (gapless) |
| เวอร์ชัน | int | computed | แก้ = +1, เก็บเวอร์ชันเก่า (immutable) |
| ลูกค้า | ref customer | editable (via dropdown G4) | แสดง สถานะ + credit term เมื่อเลือก · **Disabled/Blacklist เลือกไม่ได้ (§8)** |
| สถานะ | enum {ร่าง (Draft), ส่งแล้ว (Sent), **ยืนยัน (Confirmed)**, ปฏิเสธ (Rejected), **ยกเลิก (Cancelled)**} | editable | ไม่มี Expired (D18-4) · ยกเลิกได้ทุกสถานะ · **"ยืนยัน" = ผลของ Convert to PO (แทน "ตกลง/Agreed" เดิม — ดู §6/§11)** |
| **★ วันที่ส่งลูกค้า (sent-date)** | date | **computed (ตั้งเมื่อกด "ส่งลูกค้า" → Sent)** | บันทึก activity-log ตอนส่ง · ใช้เป็นแกนค้นหาใน list (§9) · ว่างได้ถ้ายังไม่ส่ง (เช่น Draft→Confirmed ตรง) |
| วันที่สร้าง (created-date) | date | computed | ออกตอนบันทึกครั้งแรก · แกนค้นหาที่ 2 |
| line items | list {item(BOM/RM), qty, ราคา/หน่วย} | editable | mirror PO line · RM-direct = เตือน "ผ่านขั้นผลิตเมื่อเป็น PO" (D3) |
| ยอดรวม + VAT | THB | computed | THB เท่านั้น |
| ลิงก์ PO (ถ้าสร้าง PO แล้ว) | ref PO (loose) | computed | เก็บ QT↔PO (D18-1) · **loose reference: ยกเลิก QT ไม่กระทบ PO** · **ว่างได้แม้ QT=Confirmed** (Confirmed ตั้งทันทีตอน Convert, PO อาจยังไม่ถูกสร้าง — ดู §6) |
| เหตุผลยกเลิก | text | editable | บันทึกใน activity-log ตอนยกเลิก |

## 4. Statuses / lifecycle (D18-4 reseated + cancel-anytime)
```
ร่าง (Draft) ── กด "ส่งลูกค้า" (ตั้ง sent-date) ──► ส่งแล้ว (Sent)
   │                                                   │
   │  แก้ → เวอร์ชันใหม่เสมอ                            ├── ลูกค้าตกลง → กด "Convert to PO" (popup) ──► ยืนยัน (Confirmed)
   │  (immutable, เก็บประวัติ)                          │        └─ (ตั้งทันที ไม่ว่าจะไปสร้าง PO ต่อหรือไม่ · immutable)
   │                                                   │        └─ เลือก: "ไปสร้าง PO เดี๋ยวนี้ (prefill)" หรือ "ไว้ทีหลัง"
   │                                                   └── ลูกค้าปฏิเสธ ─► ปฏิเสธ (Rejected) (จบสาย, เก็บประวัติ, ไม่เกิด PO)

 ★ ยกเลิก (Cancelled): กดได้จากทุกสถานะข้างบน (Draft/Sent/Confirmed/Rejected)
   → QT=ยกเลิก + activity-log (ใคร/เมื่อ/เหตุผล) + เลข gapless คงอยู่ (ไม่ hard-delete)
   → ถ้าเคยสร้าง PO แล้ว: PO อ้าง QT แบบ loose reference → ★ ไม่มี cascade, PO ไม่กระทบ
```
- **"Convert to PO" กดได้เมื่อ QT ∈ {ร่าง, ส่งแล้ว}** (ยังไม่ถูก Reject/Cancel/Confirm) → ตั้ง **ยืนยัน (Confirmed) ทันที**.
- **แก้ = เวอร์ชันใหม่เสมอ** (เมื่อ QT ออกไปแล้ว immutable). QT = Confirmed → immutable.
- **ไม่มีวันหมดอายุ** (ไม่มีสถานะ Expired).
- **★ ยกเลิกได้ทุกสถานะ** — ดูรายละเอียดกติกา `deletion-policy.md` §2.9.

## 5. ★ Create flow (delta)
1. เปิด `quotation-create` → **เลือกลูกค้าผ่าน customer search dropdown (G4)** (ค้นเบอร์/บริษัท/ผู้ติดต่อ/เบอร์ผู้ติดต่อ; โชว์สถานะ+credit term; ดู detail แบบ modal แล้วกลับไม่เสีย state).
   - **★ Hard block ลูกค้า Disabled/Blacklist (customer.md §4.2):** ลูกค้าสถานะ Disabled/Blacklist **ค้นเจอ+เห็นสถานะ แต่เลือกไม่ได้** (disabled option); ถ้าหลุดเข้ามาต้อง **บล็อกตอนบันทึก** พร้อมข้อความ *"ลูกค้าสถานะ {Disabled/Blacklist} — เปิดใบเสนอราคาไม่ได้"*. เป็น **HARD block** (ต่างจาก TYPE mismatch = เตือน).
2. เพิ่ม line items (BOM/RM + qty + ราคา/หน่วย). RM-direct line → แสดง hint D3 ("ผ่านขั้นผลิตเมื่อเป็น PO").
3. **"เช็ควัตถุดิบตามสูตร"** — เช็ค RM ตาม BOM เหมือน PO **แต่:** อนุญาตสร้าง Quotation ได้เสมอ (ไม่บล็อกแม้ RM ขาด) · **ไม่ auto-สร้าง/ส่ง PR ไปคลัง** (Quotation ยังไม่ผูกพันการผลิต/จัดซื้อ).
4. กด **"บันทึก"** → บันทึก QT (Draft) + **เขียน activity-log "สร้าง QT"** → **แสดง print-ready view ทันที**.
> การเปลี่ยนสถานะเป็น "ส่งแล้ว (Sent)" ทำจาก detail (ปุ่ม "ส่งลูกค้า") → **ตั้ง sent-date + เขียน activity-log "ส่งให้ลูกค้า"**. primary action ตอนสร้าง = "บันทึก".

## 5b. ★ Edit flow (delta — NEW confirm 2026-07-29)
- แก้ QT ที่ออกไปแล้ว = **สร้างเวอร์ชันใหม่เสมอ** (immutable, เก็บประวัติ) → เขียน activity-log "แก้ไข → เวอร์ชันใหม่ v{n}".
- **★ หน้า edit ต้องมี "เช็ควัตถุดิบตามสูตร (เหมือน PO · แต่ไม่สร้าง/ส่ง PR)" เช่นเดียวกับหน้า create** (§5.3) — เช็ค RM ตาม BOM, เตือนเท่านั้น, ไม่บล็อก, **ไม่ auto-PR**.
- ลูกค้า/line/ราคา แก้ได้ในเวอร์ชันใหม่ · hard block Disabled/Blacklist ยังบังคับ (§8).

## 6. ★ Convert to PO (RESOLVED — README §4 · reseat D18-4 "Agreed" → "Confirmed")
**เงื่อนไข:** ปุ่ม "Convert to PO (ออก PO เลขใหม่)" เปิดเมื่อ QT ∈ {ร่าง, ส่งแล้ว} (ลูกค้าไม่ใช่ Disabled/Blacklist). **การกระทำ:**
1. กด **"Convert to PO (ออก PO เลขใหม่)"** → **popup ยืนยัน:** *"สถานะจะเปลี่ยนเป็น ยืนยัน (Confirmed)"* พร้อม 2 ทางเลือก:
   - **(ก) ยืนยัน + ไปสร้าง PO เดี๋ยวนี้ (prefill)** — ตั้ง QT = Confirmed แล้วเปิด `po-create` ที่ PRE-FILL.
   - **(ข) ยืนยันเฉย ๆ (ไว้สร้าง PO ทีหลัง)** — ตั้ง QT = Confirmed แล้วกลับหน้า detail (ยังไม่มี PO).
2. **ระบบตั้ง QT = ยืนยัน (Confirmed) ทันทีทั้ง 2 ทาง** → QT **immutable** → **เขียน activity-log "Convert to PO → Confirmed (ใคร/เมื่อ)"**. (การไปสร้าง PO จริงหรือไม่ = อิสระจากการเปลี่ยนสถานะ.)
3. ถ้าเลือก (ก): เปิดหน้า **`po-create` ที่ PRE-FILL** line items + qty + ราคา/หน่วย จาก QT + สร้าง **ลิงก์ QT↔PO แบบ loose reference** ("created from QT-…"; D18-1/§8.1). ผู้ใช้กรอกฟิลด์ที่เหลือ (วันที่ต้องการรับของ, remark) → บันทึก → ออก **PO เลขใหม่** → เข้า OEM flow เดิม.
4. **★ QT = Confirmed แต่ยังไม่มี PO (persistent affordance):** ถ้าเลือก (ข) หรือปิดหน้า po-create ก่อนบันทึก → `quotation-detail` แสดง **banner ถาวร:** *"ใบเสนอราคานี้ได้รับการยืนยันแล้ว"* + ปุ่ม **"ไปสร้าง PO ด้วยข้อมูลนี้"** (prefill เหมือนข้อ 3) — **โชว์ทุกครั้งจนกว่าจะมี PO ผูก** (ไม่ใช่ครั้งเดียว). เมื่อ PO ถูกสร้าง → banner เปลี่ยนเป็นลิงก์ "🔗 PO-…".
> **ลูกค้าไม่ตกลง** → ตั้ง QT = ปฏิเสธ (Rejected) จาก detail → จบสาย ไม่เกิด PO.
> **หมายเหตุ:** ถ้าลูกค้ากลายเป็น Disabled/Blacklist หลังออก QT → Convert to PO / สร้าง PO จาก banner **ถูกบล็อก** (customer.md §4.2) เช่นเดียวกับการเปิด PO ตรง.
> **หมายเหตุ reseat:** สถานะ **"ยืนยัน (Confirmed)"** แทนที่ **"ตกลง (Agreed)"** ของ D18-4 — การกด Convert to PO คือการยืนยันว่าลูกค้าตกลง (รวมสองสเต็ปเดิม "mark Agreed แล้วค่อย Convert" เป็นสเต็ปเดียว). loose ref + no cascade + cancel-anytime คงเดิม. ดู §11.

## 7. Actions & Permissions (D14)
| ปุ่ม/action | Permission required (Quotation module) |
|---|---|
| ดู list/detail/print-ready/activity-log | Quotation.**Read (R)** |
| สร้าง QT / แก้ (เวอร์ชันใหม่) | Quotation.**Create/Update (C/U)** |
| เช็ควัตถุดิบตามสูตร (create + edit) | Quotation.**Read (R)** |
| **ส่งลูกค้า (→ Sent, ตั้ง sent-date)** | Quotation.**Update (U)** |
| ตั้งสถานะ ปฏิเสธ (Rejected) | Quotation.**Update (U)** |
| **Convert to PO (→ Confirmed)** | Quotation.**Update (U)** **+ PO.Create (C)** (การสร้าง PO จริงต้องมี PO.Create) |
| **ยกเลิก QT (ทุกสถานะ)** | Quotation.**Delete (D)** / Approve + **เหตุผลบังคับ** (บันทึก activity-log; ไม่กระทบ PO) |
| เปิด modal ลูกค้า | Customer.**Read (R)** |

## 8. Validations
- ต้องเลือกลูกค้า + อย่างน้อย 1 line + ราคา/หน่วย (THB).
- **★ Hard block ลูกค้า Disabled/Blacklist (customer.md §4.2):** ห้ามเลือก/บันทึก QT ให้ลูกค้าสถานะ Disabled/Blacklist — **บล็อกจริง** + ข้อความชัด. Convert to PO / สร้าง PO จาก banner ก็บล็อกถ้าลูกค้าเป็น Disabled/Blacklist.
- แก้ QT ที่ Sent/Confirmed → บังคับสร้างเวอร์ชันใหม่ (ห้ามแก้ทับ); Confirmed = immutable.
- Convert to PO ทำได้เมื่อ QT ∈ {ร่าง, ส่งแล้ว} (ไม่ใช่ Confirmed/Rejected/Cancelled) **และลูกค้าไม่ใช่ Disabled/Blacklist**.
- material check = เตือนเท่านั้น (ไม่บล็อก, ไม่ auto-PR) — **คนละกฎกับ hard block ข้างบน** — มีทั้งหน้า create และ edit.
- **★ ยกเลิก QT:** ทำได้ทุกสถานะ · **เหตุผลบังคับ** (comment) → บันทึก activity-log · เลข QT คงอยู่ gapless (ไม่ hard-delete) · **ไม่ทำอะไรกับ PO ที่ผูก** (loose ref, no cascade).

## 9. Pagination / Search (G1/G2 ขยาย)
- quotation-list: 20/หน้า (G1).
- **★ 2 แกนค้นหาวันที่:** ค้นได้ด้วย **เลข QT** และ/หรือ **ช่วงวันที่สร้าง (created-date range)** และ/หรือ **ช่วงวันที่ส่งลูกค้า (sent-date range)** — ระบุแยกกันได้ทั้งสองแกน (G2 ขยาย).
- **★ filter สถานะครบชุด:** ร่าง / **ส่งแล้ว (Sent)** / ยืนยัน (Confirmed) / ปฏิเสธ / ยกเลิก — badge แสดงครบทุกสถานะในรายการ.
- QT history ยังโผล่บน customer-detail (customer.md §6).

## 10. ★ Activity log & Traceability (NEW explicit — 2026-07-29)
**ทุก action ของ QT ต้องเขียน activity/field-audit (AU1) และโผล่บนหน้า traceability (สืบย้อนกลับ):**
| action | บันทึก activity-log | ปรากฏบน trace |
|---|---|---|
| สร้าง QT (Draft) | ✓ ใคร/เมื่อ + เลข QT | ✓ QT = head-of-chain |
| **ส่งลูกค้า (→ Sent)** | ✓ + **ตั้ง sent-date** | ✓ |
| แก้ไข → เวอร์ชันใหม่ | ✓ v{n-1}→v{n} + diff field | ✓ (ประวัติเวอร์ชัน) |
| **Convert to PO (→ Confirmed)** | ✓ + ผูก loose ref QT↔PO (เมื่อสร้าง PO) | ✓ QT→PO→PRD→Batch→… |
| ปฏิเสธ (Rejected) | ✓ + เหตุผล | ✓ (จบสาย, เก็บประวัติ) |
| **ยกเลิก (Cancelled) — ทุกสถานะ** | ✓ + **เหตุผลบังคับ** ใคร/เมื่อ | ✓ (gapless, read-only) |
- **QT = head-of-chain สาย OEM** (traceability.md §3/§4): trace `QT → PO → PRD/Batch → DN → Invoice`.
- activity-log **แสดงบน `quotation-detail`** (มุมมองรายเอกสาร) และเป็น subset ของ field-audit เดียวกันใน `traceability.md`/Settings Audit-log (source เดียว, ไม่ซ้ำซ้อน — AU1).

## 11. Cross-links
- D18 spine · Convert flow → `po.md` §create-from-QT + `flows/oem-flow.md`.
- Customer dropdown + **hard block Disabled/Blacklist** → `customer.md` §4.2/§10 (G4).
- **Cancel policy → `deletion-policy.md` §2.9 (cancel-anytime, loose ref, no cascade).**
- **Activity/audit → `traceability.md` §3/§4 (QT head-of-chain) + `non-functional.md` §3 (AU1).**
- Trace QT→PO→… → scope §8.1.

## 12. Module changelog
- **เพิ่ม:** customer search dropdown; material check (no auto-PR); print-ready view หลังบันทึก; Convert-to-PO prefill flow (resolved).
- **★ เพิ่ม (2026-07-29 — customer feedback):** **hard block เปิด/convert QT เมื่อลูกค้า Disabled/Blacklist** (§5/§8, ref customer.md §4.2) — คนละกฎกับ TYPE mismatch (warn).
- **★ DECIDED (2026-07-29) — Cancel:** QT ยกเลิกได้ **ทุกสถานะ** (เพิ่มสถานะ "ยกเลิก") · PO เก็บแค่ **loose reference** · ยกเลิก QT = **ไม่ cascade ไป PO** · บันทึก **activity-log** + เลข gapless.
- **★ DECIDED (2026-07-29 — Quotation module review, Pond) — reseat status + sent-date + activity:**
  - **สถานะ "ตกลง (Agreed)" ของ D18-4 → เปลี่ยนชื่อ/นิยามเป็น "ยืนยัน (Confirmed)"** ตั้งโดย **การกด Convert to PO** (รวมสองสเต็ปเดิมเป็นสเต็ปเดียว). enum ใหม่: ร่าง/ส่งแล้ว/**ยืนยัน**/ปฏิเสธ + ยกเลิก. loose ref + no cascade + cancel-anytime **คงเดิม**. (ดู `entity-status-map.md` §1.1b · README §4/§7.)
  - **Convert to PO = popup "สถานะจะเปลี่ยนเป็น ยืนยัน (Confirmed)"** → ตั้ง Confirmed **ทันที** (immutable) ไม่ว่าจะไปสร้าง PO ต่อหรือไม่ + ให้เลือก "สร้าง PO เดี๋ยวนี้ (prefill) / ไว้ทีหลัง" (§6).
  - **Confirmed-แต่ยังไม่มี PO = banner ถาวร** "ยืนยันแล้ว · ไปสร้าง PO ด้วยข้อมูลนี้" บน detail (§6.4).
  - **เพิ่มฟิลด์ "วันที่ส่งลูกค้า (sent-date)"** (ตั้งตอน → Sent) + **list ค้นได้ 2 แกนวันที่ (created + sent)** (§3/§9).
  - **list แสดง/กรอง สถานะ "ส่งแล้ว (Sent)" ครบชุด badge** (§2/§9).
  - **material check เพิ่มบนหน้า edit** เหมือน create (§5b).
  - **activity-log ครบทุก action + โผล่ traceability** (§10, cross-ref traceability.md/non-functional.md).
- **แก้:** primary action "บันทึก+ส่งให้ลูกค้า (Sent)" → **"บันทึก"** (แล้วโชว์ print-ready).
