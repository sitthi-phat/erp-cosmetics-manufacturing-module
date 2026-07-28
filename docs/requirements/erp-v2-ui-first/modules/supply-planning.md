# Module — Supply Planning (Demand & Production Cover)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29
Mockups: `mockups/supply-planning.html`
กฎอ้างอิง: **D4** (FG on-hand read-only, in-production นับจาก Batch) · **D5** (badge thresholds) · **D6** (suggested + batch rounding) · **D7** (rate conversion) · **D8 v2** (ปุ่มสั่งผลิต → prefill SO produce-to-stock) · **D16** (config on FG master) · README §2.1/§3

## สรุปภาษาไทย
เครื่องมือวางแผน demand/cover ของ FG (Own-Brand). อ่าน FG on-hand (read-only) + in-production (นับจาก Batch), คำนวณ cover/safety/reorder/target/suggested production. **ค้น FG ตามชื่อ + filter สถานะ Low/OK/Overstock**. ผู้ใช้ **แก้ Sales Rate/Lead Time/Safety Cover/Target Cover ได้ที่นี่แล้ว save กลับ BOM master**. ปุ่ม **"สั่งผลิต" (D8 v2)** → พาไปหน้า **สร้าง SO ผลิตเก็บสต็อก (ไม่เลือกลูกค้า) แบบ prefill** จำนวน = Suggested → ผลิต → FG เข้าคลัง. **§6 = สรุปสูตรทั้งหมดให้ปอนด์รีวิว**.

---

## 1. Purpose
มองเห็นว่า FG ตัวไหนกำลังจะขาด (Low), แนะนำจำนวนที่ควรผลิตเติม (ปัดเป็นทวีคูณ Batch), และเปิดทางสั่งผลิตเก็บสต็อกจากที่นี่.

## 2. Screen layout (scope §3.1)
- Header: "SUPPLY PLANNING / Demand & Production Cover".
- 3 stat tiles: (1) ITEMS BELOW TARGET "X of N" · (2) SUGGESTED PRODUCTION = Σ suggested · (3) SHORTEST COVER = min(cover) วัน.
- การ์ดต่อ FG: badge (D5) + 7 ช่อง + coverage bar (4 markers) + narrative + footer chips + ปุ่ม "สั่งผลิต".

## 3. Fields (D4)
| ฟิลด์ | หน่วย | ชนิด |
|---|---|---|
| FG On Hand | units | **read-only จาก FG stock (D4)** |
| In Production | units | computed = นับจาก Batch ของ FG (D4) |
| Sales Rate | /day·/week·/month | editable → normalize per-day (D7) · **save back to BOM** |
| Lead Time / Safety Cover / Target Cover | days | editable · **save back to BOM** |
| Batch Size | units | (จาก BOM master, D16) |

## 4. ★ Search + Filter (delta)
- **ค้น FG ตามชื่อ**.
- **filter สถานะ Low / OK / Overstock** (D5).
- 20/หน้า (G1) ถ้าเป็น list/มีจำนวนมาก.

## 5. ★ ปุ่ม "สั่งผลิต" (D8 v2 — UPDATED)
- เมื่อสถานะ **Low** (cover < Target) การ์ดเสนอผลิต → กด **"สั่งผลิต"**:
  - **พาไปหน้า "สร้างใบสั่งขาย (Own-Brand) → (ข) ผลิตเก็บสต็อก (ไม่เลือกลูกค้า)" แบบ PRE-FILL** (FG ตัวนั้น + จำนวน = Suggested).
  - ผู้ใช้ทวน/ยืนยัน → เข้าสาย production ปกติ (BOM check → PRD ไม่ผูกลูกค้า → RM ขาด auto-PR → ผลิต → QC ผ่าน → **FG เข้าคลัง**).
- **เปลี่ยนจาก D8 v1** (เดิมสร้าง PRD ทันทีเงียบ ๆ) — ตอนนี้ prefill หน้า SO produce-to-stock (ที่มา produce-to-stock = เดียว). ดู `so.md` §6, README §2.1.

## 6. ★★ FORMULA SUMMARY (สำหรับปอนด์รีวิว — ครบทุกสูตร)
> `r` = Sales Rate **per-day** (แปลงตาม D7). ตรวจกับ FG-101 (On Hand 1200, In Production 13, r=85/day, Lead 7, Safety 5, Target 30, Batch 500) = ✓.

### 6.1 การแปลง Sales Rate → per-day (D7)
| input period | สูตร → r (per-day) |
|---|---|
| ต่อวัน | r = rate |
| ต่อสัปดาห์ | r = rate ÷ 7 |
| ต่อเดือน | r = rate ÷ 30 |

### 6.2 สูตรหลัก
| Output | สูตร | ตรวจ FG-101 |
|---|---|---|
| **Available** | `FG On Hand + In Production` | 1200+13 = **1213** |
| **Cover today (วัน)** | `Available ÷ r` | 1213/85 = **14.3** |
| **Safety stock** | `Safety Cover × r` | 5×85 = **425** |
| **Reorder point** | `(Lead Time + Safety Cover) × r` | (7+5)×85 = **1020** |
| **Target stock** | `Target Cover × r` | 30×85 = **2550** |
| **Risk line (วัน)** | `Lead Time + Safety Cover` | 7+5 = **12** |
| **Suggested production** | `ceil( max(0, Target stock − Available) ÷ Batch Size ) × Batch Size` **(D6)** | ceil((2550−1213)/500)×500 = ceil(2.674)×500 = 3×500 = **1500** |
| **Cover after production (วัน)** | `(Available + Suggested) ÷ r` | (1213+1500)/85 = 2713/85 = **31.9** |
| **Runs-out date** | `today + Cover today (วัน ปฏิทิน — D7)` | 10 Aug |
| **Cover-through date** | `today + Cover after (วัน ปฏิทิน)` | 27 Aug |

### 6.3 Badge thresholds (D5)
| badge | เงื่อนไข (cover เทียบ Target Cover) |
|---|---|
| **Low** (แดง) | cover < Target |
| **OK** (เหลือง/เขียว) | Target ≤ cover ≤ 2×Target |
| **Overstock** (ฟ้า/เทา) | cover > 2×Target |
> ตรวจ FG-204 (Overstock): cover 96.7 > 2×30=60 → Overstock; Suggested = ceil(max(0, Target−Available)/Batch)×Batch, ถ้า Available ≥ Target → **0** ✓.

### 6.4 Coverage bar markers (4)
Cover today · Cover after production · Risk line (Lead+Safety) · Target.

### 6.5 Narrative template (scope §3.5)
```
"{Available} units available at {r}/day covers {CoverToday} days — runs out {RunsOutDate}.
 Produce {Suggested} units to hold {Available+Suggested} and cover {CoverAfter} days through {CoverThroughDate}."
```
Overstock (Suggested=0): คงประโยค "...Produce 0 units...".

### 6.6 3 stat tiles
- ITEMS BELOW TARGET = count(FG ที่ cover < Target) "X of N".
- SUGGESTED PRODUCTION = Σ Suggested production ทุก FG.
- SHORTEST COVER = min(Cover today) วัน.

> **จุดที่ปอนด์ควรเคาะ (ถ้าไม่เห็นด้วย):** (a) In Production นับจาก Batch สถานะใด (กำลังผลิต+รอ QC? รวม QC ผ่านที่ยังไม่เข้าคลัง?) — ปัจจุบันยึด "Batch ของ FG นั้นที่ยังไม่เข้าคลัง" (D4). (b) ปัดขึ้นเป็นทวีคูณ Batch เสมอ (D6). ทั้งคู่ตรง D4/D6 ที่ล็อกแล้ว — ไม่ถือเป็นคำถามค้าง.

## 7. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ดู/ค้น/filter Supply Planning | Supply Planning.**Read (R)** |
| แก้ Sales Rate/Lead/Safety/Target แล้ว save → BOM | Supply Planning.**Update (U)** (= BOM.Update ผ่าน planning) |
| ปุ่ม "สั่งผลิต" (→ prefill SO produce-to-stock) | Supply Planning.**Create (C)** (create produce-to-stock; ปลายทางสร้าง PRD = SO/Production.Create) |

## 8. Validations
- Sales Rate/Batch Size > 0 เพื่อคำนวณ; ถ้าขาด → การ์ดเตือน (FG type ต้องมี config — bom.md §7).
- suggested = 0 เมื่อ Available ≥ Target.

## 9. Cross-links
- config source/save-back → `bom.md` §5 · ปุ่มสั่งผลิต → `so.md` §6 (produce-to-stock) · In Production/FG on-hand → `stock.md`/`production.md` · D8 delta → README §2.1.

## 10. Module changelog
- **เพิ่ม:** search FG by name + filter Low/OK/Overstock · edit rates + save back to BOM · **formula summary (§6) สำหรับปอนด์รีวิว**.
- **แก้:** D8 ปุ่มสั่งผลิต → prefill SO produce-to-stock (D8 v2) แทนสร้าง PRD ทันที.
