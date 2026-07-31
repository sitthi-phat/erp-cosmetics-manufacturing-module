# Module — Supply Planning (Demand & Production Cover)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 (**★★★★★★★★★ + Notification: FG→Low real-time ตัด → สรุป Low+Overstock รายวัน (J8 ~06:00) r19 2026-07-31 · ★ + Gate-1 B5: pin deep-link param `?filter=low-overstock` r20 2026-07-31**)
Mockups: `mockups/supply-planning.html`
กฎอ้างอิง: **D4** (FG on-hand read-only, in-production นับจาก Batch) · **D5** (badge thresholds) · **D6** (suggested + batch rounding) · **D7** (rate conversion) · **D8 v2** (ปุ่มสั่งผลิต → prefill SO produce-to-stock; **★ รอบนี้ = ระบุจำนวน batch เอง**) · **D9/D10** (BOM total cost + snapshot) · **D16** (config on FG master) · **`bom.md` §3/§4/§5c (ราคาขาย = revenue source · ต้นทุนรวม/หน่วย = cost source · Inactive ถูกกันออก)** · README §2.1/§3 · `non-functional.md` §6 (J8) + §7 (noti)

## สรุปภาษาไทย
เครื่องมือวางแผน demand/cover ของ FG (Own-Brand). อ่าน FG on-hand (read-only) + in-production (นับจาก Batch), คำนวณ cover/safety/reorder/target/suggested. **★ ปรับโครงหน้าใหม่ (2026-07-29): จากการ์ดต่อ FG → "รายการ (list) FG" ที่สแกนง่าย** — **ค้น FG ได้ทั้ง (1) ชื่อ · (2) รหัส · (3) วัตถุดิบ (RM) ที่สูตรใช้ (reverse lookup)** · **filter สถานะ Low/OK/Overstock** (คงไว้). **แต่ละแถวโชว์ ชื่อ/รหัส/สถานะ + "การคำนวณว่าทำไมได้สถานะนั้น" (why-calc inline)** · **กดขยายแถว → breakdown วัตถุดิบ (RM) + สต็อกคงเหลือปัจจุบันต่อ RM**. **★ คลิก FG → MODAL รายละเอียดเต็ม** ที่มี: **(A) "สั่งผลิต" โดยระบุจำนวน batch เอง** → modal คำนวณ **ต้นทุน/รายได้/กำไร** (batch × batch size). **(B) แก้ค่าพารามิเตอร์การวางแผนใน modal เพื่อ "จำลองใหม่ (re-simulate) โดยไม่บันทึกกลับ BOM"** + ปุ่มแยก **"บันทึกกลับ BOM master"** (audited). **★ FG/BOM Inactive ถูกกันออกจากการวางแผน**. **★★★★★★★★★ แจ้งเตือน (r19 — DAILY summary):** **ตัด FG→Low real-time** — สต็อกแจ้งผ่าน **สรุปรายวัน ~06:00 (J8)** = **จำนวน+รายการ FG Low และ จำนวน+รายการ FG Overstock** (แจ้งใบเดียว) + deep-link ไป **หน้า Supply Planning เดิม `?filter=low-overstock`** (★ r20 B5 pin param). หน้า SP ยังคง **Low bell/indicator ของตัวเอง** (page feature). **§6 = สรุปสูตรทั้งหมด**.

---

## 1. Purpose
มองเห็นว่า FG ตัวไหนกำลังจะขาด (Low), เข้าใจ **ว่าทำไมถึงได้สถานะนั้น (why-calc)**, ดู **breakdown วัตถุดิบ + สต็อกคงเหลือ** ต่อ FG, แนะนำจำนวนที่ควรผลิตเติม (ปัดเป็นทวีคูณ Batch), **จำลอง (what-if) ต้นทุน/รายได้/กำไร ก่อนตัดสินใจสั่งผลิตตามจำนวน batch ที่เลือก**, แจ้งเตือนสรุปสต็อก Low+Overstock รายวัน, และเปิดทางสั่งผลิตเก็บสต็อกจากที่นี่ — เฉพาะ FG ที่ยัง **Active**.

## 2. ★ Screen layout — LIST-first (restructure 2026-07-29)
> **เปลี่ยนจากการ์ดต่อ FG → รายการ (list) ที่สแกนง่าย + ขยายแถว + คลิกเข้า modal.**

- **Header:** "SUPPLY PLANNING / Demand & Production Cover".
- **3 stat tiles (คงไว้):** (1) **ITEMS BELOW TARGET** "X of N" · (2) **SUGGESTED PRODUCTION** = Σ suggested · (3) **SHORTEST COVER** = min(cover) วัน.
- **แถบค้นหา + filter:** ช่องค้น (ชื่อ/รหัส/RM — §4) + filter สถานะ Low/OK/Overstock (§4).
- **★ รายการ FG (list) — แต่ละแถว (row):**
  - **ชื่อ FG · รหัส FG · badge สถานะ (Low/OK/Overstock)**.
  - **★ why-calc inline** — เหตุผลย่อว่าทำไมได้สถานะนั้น (§4b, §6).
  - **ปุ่มขยาย (expand ▸/▾):** กด → เปิด **breakdown วัตถุดิบ (RM) + สต็อกคงเหลือปัจจุบัน (on_hand/available) ต่อ RM** (§4b).
  - **คลิกที่แถว → เปิด MODAL รายละเอียดเต็ม** (§5a).
- **20/หน้า (G1) + pagination**.
- **(UX/UI follow-up — list only):** bell/badge "Low" บนหัวหน้า supply-planning + รายการใน notification panel (§5.2).

## 3. Fields (D4)
| ฟิลด์ | หน่วย | ชนิด |
|---|---|---|
| FG On Hand | units | **read-only จาก FG stock (D4)** |
| In Production | units | computed = นับจาก Batch ของ FG (D4) |
| Sales Rate | /day·/week·/month | editable → normalize per-day (D7) · **แก้ใน modal = simulate; save back BOM = persist (§5c)** |
| Lead Time / Safety Cover / Target Cover | days | editable · **simulate vs save-back (§5c)** |
| Batch Size | units | (จาก BOM master, D16) · **แก้ใน modal = simulate; save back = persist (§5c)** |
| **★ ต้นทุนรวม/หน่วย (BOM total cost)** | THB/unit | **read-only จาก BOM (`bom.md` §4, D9)** — cost source ของ margin sim (§5b) |
| **★ ราคาขาย FG (sell price)** | THB/unit | **read-only จาก BOM/FG master (`bom.md` §3, mandatory)** — revenue source ของ margin sim (§5b) |
| **★ RM breakdown (components)** | list {RM, qty, สต็อกคงเหลือ} | read-only จาก BOM สูตร + FG stock — โชว์ตอนขยายแถว (§4b) |

## 4. ★ Search + Filter + Scope (UPDATED 2026-07-29)
- **★ ค้น FG ได้ 3 แกน (any-match):**
  1. **ชื่อ FG**.
  2. **รหัส FG** (= รหัส BOM, shared — `bom.md` §5).
  3. **★ วัตถุดิบ (RM) — reverse lookup:** พิมพ์ **ชื่อหรือรหัส RM** → คืน **FG ทุกตัวที่ BOM (สูตร) มี RM นั้นเป็น component**.
  > UI: ช่องค้นเดียว match ทั้ง 3 แกน หรือ toggle "ค้นด้วยวัตถุดิบ" — งาน UX/UI.
- **filter สถานะ Low / OK / Overstock** (D5) — **คงไว้** · **★★★★★★★★★ r19: ใช้ซ้ำเป็น deep-link target ของแจ้งเตือนสรุปรายวัน (★ r20 B5: deep-link = `?filter=low-overstock` — เปิด filter Low+Overstock, §5.1)**.
- **★ ขอบเขต (scope): แสดง/คำนวณเฉพาะ FG ที่ BOM/FG = Active** — **FG Inactive ถูกกันออก** (ไม่โผล่ใน list/tiles, ไม่คำนวณ Suggested, ไม่มีปุ่มสั่งผลิต, ไม่ยิงแจ้งเตือน Low). สอดคล้อง `bom.md` §5c, `so.md` §6.
- 20/หน้า (G1) + pagination.

## 4b. ★ FG list row — why-calc inline + expand RM breakdown (NEW 2026-07-29)
- **★ Inline why-calc ต่อแถว:** แสดงตัวเลขที่ทำให้ได้ badge — **Cover today** เทียบ **Target Cover** (+ Safety/Lead) และ **Suggested production** (ถ้า Low). สูตร = §6.
  - ตัวอย่าง (Low): *"เหลือ cover 14.3 วัน < Target 30 วัน (Safety 5 / Lead 7) — ควรผลิต 1,500 ชิ้น"*.
  - ตัวอย่าง (Overstock): *"cover 96.7 วัน > 2×Target (60) — ไม่ต้องผลิต"*.
- **★ Expand แถว → RM breakdown (open/close inline):** โชว์ **รายการวัตถุดิบ (RM) ของสูตร BOM + สต็อกคงเหลือปัจจุบันต่อ RM** (on_hand / available).
  - แต่ละ RM row: **รหัส RM · ชื่อ RM · qty ต่อหน่วยสินค้า · สต็อกคงเหลือ**.
  - เป็น **read-only**.
- **หมายเหตุ:** expand = ดูเร็ว; modal (§5a) = รายละเอียดเต็ม + action.

## 5. ★ ปุ่ม/action "สั่งผลิต" (D8 v2 — UPDATED: ระบุจำนวน batch เอง)
- **ที่อยู่:** อยู่ใน **modal รายละเอียด FG** (§5a).
- **★ ผู้ใช้ระบุ "จำนวน batch (batch count)" เอง** (default = จำนวน batch ที่ทำให้ถึง Suggested, §6.2) → **จำนวนผลิต (qty) = batch count × Batch Size**.
- กด **"สั่งผลิต"** →
  - **พาไปหน้า "สร้างใบสั่งขาย (Own-Brand) → (ข) ผลิตเก็บสต็อก" แบบ PRE-FILL** (FG + **จำนวน = batch count × Batch Size**).
  - ผู้ใช้ทวน/ยืนยัน → เข้าสาย production ปกติ → **FG เข้าคลัง** → **★ SO(ข) terminal = "ผลิตเข้าคลังแล้ว" (`so.md` §4)**. ดู `so.md` §6.
- **★ ปุ่มสั่งผลิตโผล่เฉพาะ FG Active**.

## 5a. ★ Click FG → MODAL รายละเอียดเต็ม (NEW 2026-07-29)
คลิกแถว FG → **modal dialog** (ปิดแล้วกลับ list ไม่เสีย state — G3) แสดง:
1. **หัว:** ชื่อ/รหัส FG + badge สถานะ + narrative (§6.5).
2. **ตัวเลขวางแผนเต็ม:** On Hand / In Production / Available / Cover today / Safety / Reorder / Target / Suggested / Cover after / runs-out / cover-through (§6) + coverage bar (4 markers).
3. **RM breakdown + สต็อกคงเหลือต่อ RM** (read-only).
4. **★ "สั่งผลิต" + batch count + cost/revenue/margin simulation** (§5b).
5. **★ แก้พารามิเตอร์การวางแผน (simulate) + "บันทึกกลับ BOM master"** (§5c).
- **ลิงก์:** "เปิดหน้า BOM/FG เต็ม" · "เปิดหน้า SO produce-to-stock".

## 5b. ★ สั่งผลิต — batch count + cost / revenue / margin simulation (NEW 2026-07-29)
> **decision-support ระหว่างวางแผน — ไม่ใช่รายงาน COGS/บัญชี.** ใช้ค่า **live** จาก BOM/FG master. **ไม่กระทบ D10 cost snapshot**.

- **input:** **จำนวน batch (batch count)** (integer ≥ 1) → `qty = batch count × Batch Size`.
- **สูตร:**
  | Output | สูตร | แหล่งข้อมูล |
  |---|---|---|
  | **qty (จำนวนผลิต)** | `batch count × Batch Size` | Batch Size จาก BOM (D16) |
  | **cost (ต้นทุน)** | `ต้นทุนรวม/หน่วย (BOM) × qty` | `bom.md` §4, D9 |
  | **revenue (รายได้)** | `ราคาขาย FG × qty` | **ราคาขาย = mandatory บน BOM/FG master (`bom.md` §3)** |
  | **margin (กำไร)** | `revenue − cost` | — |
  | **margin %** | `margin ÷ revenue × 100` (revenue > 0) | — |
- **★ แหล่ง revenue = ราคาขาย FG (BOM/FG master)** — มีนิยามอยู่แล้ว (`bom.md` §3). (ค่าก่อน VAT ทั้งคู่.)
- **UI:** เปลี่ยน batch count → cost/revenue/margin/margin% **อัปเดตทันที**.
- **หมายเหตุ:** ถ้าไม่มีราคาขาย/ต้นทุน → hint "ข้อมูลราคา/ต้นทุนไม่ครบใน BOM" + ปิด margin (สั่งผลิตยังทำได้).

## 5c. ★ แก้พารามิเตอร์: จำลอง (ไม่บันทึก) vs บันทึกกลับ BOM master (NEW 2026-07-29)
- **(1) Edit-for-simulation (scratch / what-if — NOT persisted):**
  - แก้ Sales Rate / Lead Time / Safety Cover / Target Cover / Batch Size → recompute ทันที (จำลอง).
  - **ไม่เขียนกลับ BOM master** — ปิด modal / เปลี่ยน FG = ทิ้งค่าจำลอง. ไม่มี audit.
  - affordance "กำลังจำลอง (unsaved)" + ปุ่ม **"รีเซ็ตกลับค่าจริง"**.
- **(2) Save-back-to-BOM (persisted + audited):**
  - ปุ่มแยก **"บันทึกกลับ BOM master"** → เขียนค่ากลับที่ **1-BOM=1-FG master** (D16).
  - **audited (field-level)** — ต้องสิทธิ์ **Supply Planning.Update (= BOM.Update ผ่าน planning)**.
- **แยกจากกันชัด:** "สั่งผลิต" (§5b) ไม่ต้อง save param ก่อน.

## 5.1 ★★★★★★★★★ Notification — DAILY Low + Overstock summary (r19 — ปอนด์ Gate-1 2026-07-31 · ★ r20 B5 pin param)
- **Trigger:** rollup รายวัน **J8 ~06:00 (★ r20: หลัง J1, หน้าต่าง 06:00–06:15 · `non-functional.md` §6)** — สรุปสุขภาพสต็อกของวัน: **จำนวน + รายการ FG (Active) ที่ Low** และ **จำนวน + รายการ FG ที่ Overstock** เป็น **แจ้งเตือนสรุปรวมใบเดียว** (ไม่ใช่ราย item, ไม่ใช่ real-time). Low/Overstock ตาม badge threshold (§6.3).
- **★ r19: ตัด real-time FG→Low** — Low/Overstock แจ้งผ่าน **สรุปรายวันเท่านั้น**. **FG→Low reservation/planning math คงเดิม** (§6).
- **★ ไม่เข้าข่ายสำหรับ FG Inactive** (§4).
- **Delivery:** ผ่าน **notification outbox + per-user read-bit** · **ผู้รับ = ผู้มีสิทธิ์ Read Supply Planning** · จัดกลุ่ม UI = หมวด "ความเสี่ยงสต็อก/การผลิต" (`non-functional.md` §7).
- **★ Deep-link (r20 B5 — pin param):** → **หน้า Supply Planning เดิม พร้อม query `?filter=low-overstock`** = เปิด filter Low+Overstock — **reuse หน้า SP** (§2/§4 filter Low/OK/Overstock มีอยู่แล้ว; **ไม่สร้างหน้าใหม่**). *(param ตายตัว `?filter=low-overstock` — mockup/route hard-code ค่านี้; UX/UI ยึดตาม.)*
- **กันสแปม (idempotent):** J8 = snapshot รายวัน (1 สรุป/วัน/ผู้รับ).
- **★ หน้า SP คง Low bell/indicator ของตัวเอง** (page feature, §5.2) แยกจาก notification event.

## 5.2 UI touchpoints (UX/UI follow-up — list only)
1. **★★★★★★★★★ r19:** รายการแจ้งเตือน **"สรุปสต็อกวันนี้: Low {X} รายการ · Overstock {Y} รายการ"** ใน **notification panel** → deep-link มา **หน้า supply-planning `?filter=low-overstock`** (★ r20 B5).
2. **Low badge/bell** บนหัวหน้า supply-planning (นับ FG ที่ Low ตอนนี้) — **page feature, คงไว้**.
3. **★★★★★★★★★ r19:** สรุปเช้า (J8) = **1 entry รวม "Low {X} · Overstock {Y}"** → เปิดหน้า SP `?filter=low-overstock`.

## 6. ★★ FORMULA SUMMARY (สำหรับปอนด์รีวิว — ครบทุกสูตร รวม why-calc + cost/revenue/margin)
> `r` = Sales Rate **per-day** (แปลงตาม D7). ตรวจกับ FG-101 (On Hand 1200, In Production 13, r=85/day, Lead 7, Safety 5, Target 30, Batch 500) = ✓.

### 6.1 การแปลง Sales Rate → per-day (D7)
| input period | สูตร → r (per-day) |
|---|---|
| ต่อวัน | r = rate |
| ต่อสัปดาห์ | r = rate ÷ 7 |
| ต่อเดือน | r = rate ÷ 30 |

### 6.2 สูตรหลัก (why-calc ในแถว/ modal ใช้ชุดนี้)
| Output | สูตร | ตรวจ FG-101 |
|---|---|---|
| **Available** | `FG On Hand + In Production` | 1200+13 = **1213** |
| **Cover today (วัน)** | `Available ÷ r` | 1213/85 = **14.3** |
| **Safety stock** | `Safety Cover × r` | 5×85 = **425** |
| **Reorder point** | `(Lead Time + Safety Cover) × r` | (7+5)×85 = **1020** |
| **Target stock** | `Target Cover × r` | 30×85 = **2550** |
| **Risk line (วัน)** | `Lead Time + Safety Cover` | 7+5 = **12** |
| **Suggested production** | `ceil( max(0, Target stock − Available) ÷ Batch Size ) × Batch Size` **(D6)** | ceil((2550−1213)/500)×500 = 3×500 = **1500** |
| **Suggested batch count** | `ceil( max(0, Target stock − Available) ÷ Batch Size )` | **3** |
| **Cover after production (วัน)** | `(Available + Suggested) ÷ r` | (1213+1500)/85 = **31.9** |
| **Runs-out date** | `today + Cover today` | 10 Aug |
| **Cover-through date** | `today + Cover after` | 27 Aug |

### 6.2b ★ Cost / Revenue / Margin (สั่งผลิต simulation — §5b) — NEW
> ใช้ค่า live จาก BOM/FG master. **planning decision-support, ไม่ใช่ COGS.** ค่าก่อน VAT ทั้งคู่.
| Output | สูตร | ตัวอย่าง (batch count 3, Batch 500 → qty 1500; ต้นทุน 42, ราคาขาย 70) |
|---|---|---|
| **qty** | `batch count × Batch Size` | 3×500 = **1500** |
| **cost** | `ต้นทุนรวม/หน่วย × qty` | 42×1500 = **63,000** |
| **revenue** | `ราคาขาย FG × qty` | 70×1500 = **105,000** |
| **margin** | `revenue − cost` | **42,000** |
| **margin %** | `margin ÷ revenue × 100` | **40%** |

### 6.3 Badge thresholds (D5)
| badge | เงื่อนไข (cover เทียบ Target Cover) |
|---|---|
| **Low** (แดง) | cover < Target → **★★★★★★★★★ r19: นับเข้าสรุป Low รายวัน (§5.1)** + why-calc โชว์ Suggested |
| **OK** (เหลือง/เขียว) | Target ≤ cover ≤ 2×Target |
| **Overstock** (ฟ้า/เทา) | cover > 2×Target → **★★★★★★★★★ r19: นับเข้าสรุป Overstock รายวัน (§5.1)** |
> ตรวจ FG-204 (Overstock): cover 96.7 > 60 → Overstock; Available ≥ Target → Suggested **0** ✓.

### 6.4 Coverage bar markers (4)
Cover today · Cover after production · Risk line (Lead+Safety) · Target.

### 6.5 Narrative template (scope §3.5)
```
"{Available} units available at {r}/day covers {CoverToday} days — runs out {RunsOutDate}.
 Produce {Suggested} units to hold {Available+Suggested} and cover {CoverAfter} days through {CoverThroughDate}."
```
Overstock (Suggested=0): คงประโยค "...Produce 0 units...".

### 6.6 3 stat tiles
- ITEMS BELOW TARGET = count(FG Active ที่ cover < Target) "X of N".
- SUGGESTED PRODUCTION = Σ Suggested production ทุก FG (Active).
- SHORTEST COVER = min(Cover today) วัน.

> **จุดที่ปอนด์ควรเคาะ:** (a) In Production นับจาก Batch สถานะใด — ยึด "Batch ของ FG ที่ยังไม่เข้าคลัง" (D4). (b) ปัดขึ้นเป็นทวีคูณ Batch เสมอ (D6). (c) **revenue ใช้ "ราคาขาย" บน BOM/FG master (ก่อน VAT)**.

## 7. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ดู/ค้น (ชื่อ/รหัส/RM)/filter/expand RM/เปิด modal | Supply Planning.**Read (R)** |
| รับแจ้งเตือนสรุป Low+Overstock รายวัน (J8 ~06:00) | Supply Planning.**Read (R)** (fan-out ตาม Read-bit) |
| **แก้ param เพื่อจำลอง (simulate, ไม่ persist)** | Supply Planning.**Read (R)** (what-if ฝั่ง client/scratch) |
| **บันทึกกลับ BOM master (persist param)** | Supply Planning.**Update (U)** (= BOM.Update ผ่าน planning) + **audit** |
| ปุ่ม "สั่งผลิต" (→ prefill SO produce-to-stock, batch count) | Supply Planning.**Create (C)** (ปลายทางสร้าง PRD = SO/Production.Create) |
| ดู cost/revenue/margin simulation | Supply Planning.**Read (R)** |

## 8. Validations
- Sales Rate/Batch Size > 0 เพื่อคำนวณ; ขาด → แถว/ modal เตือน (`bom.md` §7).
- **★ FG/BOM ต้อง Active จึงจะโผล่/คำนวณ/แจ้งเตือน** (Inactive ถูกกันออก — §4).
- suggested = 0 เมื่อ Available ≥ Target.
- **★ batch count (สั่งผลิต) = integer ≥ 1**; qty = batch count × Batch Size.
- **★ margin sim:** ต้องมี **ราคาขาย** + **ต้นทุนรวม/หน่วย** จึงคำนวณ margin; ขาด → ปิด margin + hint.
- **★ simulate ≠ persist:** ต้องกด **"บันทึกกลับ BOM master"** เท่านั้นจึง persist (audited) — §5c.
- **★★★★★★★★★ r19/★ r20: ตัด real-time — แจ้งเตือน Low/Overstock ส่งผ่านสรุปรายวัน J8 (~06:00, หลัง J1) เท่านั้น** (Low+Overstock ในสรุปเดียว, **deep-link `?filter=low-overstock`**); หน้า SP คง Low indicator ของตัวเอง (§5.2).

## 9. Cross-links
- config source/save-back → `bom.md` §5 · **revenue = ราคาขาย · cost = ต้นทุนรวม/หน่วย → `bom.md` §3/§4 · D9/D10** · **Inactive exclusion → `bom.md` §5c · `deletion-policy.md` §2.4** · ปุ่มสั่งผลิต (batch count) → `so.md` §6 (produce-to-stock, terminal "ผลิตเข้าคลังแล้ว" §4) · In Production/FG on-hand/RM stock → `stock.md`/`production.md` · **save-back param audit → `traceability.md` §3/§4 · `non-functional.md` AU1** · **★★★★★★★★★ r19/★ r20 alerting (Low+Overstock daily, deep-link `?filter=low-overstock`) → `non-functional.md` §6 (J8, หลัง J1)/§6.1 + §7 (noti) · `platform.md` §7 (หมวด 2)** · D8 delta → README §2.1.

## 10. Module changelog
- **เพิ่ม (รอบก่อน):** search FG by name + filter Low/OK/Overstock · edit rates + save back to BOM · formula summary (§6) · **proactive Low alerting (§5.1) — real-time + J8 (DECIDED 2026-07-29)**. *(→ r19: real-time ตัด, J8 = Low+Overstock daily summary.)*
- **แก้ (รอบก่อน):** D8 ปุ่มสั่งผลิต → prefill SO produce-to-stock (D8 v2) · on-read-only → proactive alerting.
- **★ เพิ่ม (2026-07-29 — BOM module review):** FG/BOM Inactive ถูกกันออกจากการวางแผน.
- **★★ CHANGED (2026-07-29 — Supply Planning module review, ปอนด์):** Layout list-first · Search 3 แกน · Click FG → MODAL · สั่งผลิต batch count · Cost/Revenue/Margin simulation · simulate vs save-back.
- **★★★★★★★★★ CHANGED (2026-07-31 — Notification: FG→Low real-time → Low+Overstock DAILY summary, r19 ปอนด์ Gate-1):** **§5.1 rewrite** — ตัด real-time FG→Low; แจ้งผ่าน **สรุปรายวัน J8 ~06:00** · deep-link → หน้า SP เดิม (filter Low+Overstock, reuse) · §5.2/§6.3/§7/§8/§4. **★ FG→Low reservation/planning math (§6) คงเดิม.** authoritative = `platform.md` §7 · `non-functional.md` §6.1/§7.
- **★ เพิ่ม (2026-07-31 — Gate-1 review reconciliation r20 · B5, ปอนด์):** **pin deep-link param = `?filter=low-overstock`** (§4/§5.1/§5.2/§8/§9 + summary) — mockup/route hard-code ค่านี้เพื่อเปิด filter Low+Overstock ตายตัว · เพิ่ม note J8 รันหลัง J1 (หน้าต่าง 06:00–06:15, `non-functional.md` §6) · sync SO(ข) terminal "ผลิตเข้าคลังแล้ว" (§5/§9). **ใช้ view เดิม (`supply-planning.html` render จาก .md).**
- **คงเดิม:** list-first layout, search 3 แกน, modal, margin sim, simulate/save-back, J8 daily summary.
