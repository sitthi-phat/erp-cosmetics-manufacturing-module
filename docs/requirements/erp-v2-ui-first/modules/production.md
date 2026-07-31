# Module — Production (การผลิต · คิวงานผลิต · PRD/Batch)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 (**★ + Gate-1 reconciliation r20 2026-07-31: (C2) SO(ข) roll-up label = "ผลิตเข้าคลังแล้ว" (ไม่ใช่ "พร้อมจัดส่ง") · (C4) OEM surplus → OEM FG sellable bucket (OEM identity)**)
Mockups: `mockups/production.html` · `mockups/qc.html`
กฎอ้างอิง: entity-status-map §1.4/§1.5 (PRD/Batch) · stock-reservation (ตัดจริง Option A) · **D3** (RM-direct) · **D8 v2** (produce-to-stock PRD ไม่ผูกลูกค้า) · **D13** (actual qty + surplus @ พร้อมส่ง · **★ C4: OEM surplus = OEM identity, sellable**) · **D15** (loss + ledger) · README §3 (G1–G3, **G8**) · **`comment-convention.md` (comment + change-history)** · **`numbering-on-save.md` (G8 — เลข PRD/Batch แสดงใน confirm popup ของ action, NS1 N/A)** · **`customer.md` §4.1 (follow-up flag reuse)** · **`po.md` §5.2 (edit-PO audit)** · **`qc.md` §4b/§9 (QC gate + deep-link target)** · **`stock.md` §4/§5/§6 (loss + FIFO consume · ★ C4 OEM FG bucket)** · **`so.md` §4 (SO(ข) terminal "ผลิตเข้าคลังแล้ว")**

## สรุปภาษาไทย
คิวงานผลิต + PRD/Batch แบ่งเป็น **2 แท็บ**: **(1) "รอรับงาน"** (งานที่ PO/SO ยืนยันแล้ว รอฝ่ายผลิตกดรับ) และ **(2) "คิวงานที่รับแล้ว"** (งานที่รับแล้ว → กำลังผลิต → QC → พร้อมส่งมอบ). ทั้งสองแท็บ **ค้นด้วยเลข PO และ SO (ทุกสถานะ) · ชื่อลูกค้า · ข้อมูลผู้ติดต่อ · ช่วงวันที่สร้าง (PO/SO) · ช่วงวันที่ต้องการรับของ**; แท็บ "รับแล้ว" ค้น **เลข PRD** ได้เพิ่ม. filter ตามสถานะ PO/SO, 20/หน้า (G1), **ดูรายละเอียด PO/SO แบบ modal + ลิงก์ไปหน้าเต็ม**. **คิว "รับแล้ว" จัดกลุ่มตาม PO/SO** โดย **PRD ซ้อนอยู่ใต้ PO/SO** (1 order line = 1 PRD). **หน้าจัดการ (management page):** ฝ่ายผลิตกรอก **จำนวนผลิตจริง (actual qty ≥ จำนวนสั่ง เสมอ)**; ผลิตน้อยกว่าสั่งต้อง **แก้ PO ให้จำนวนสั่ง = ผลิตจริงก่อน** (→ raise ⚑ follow-up ลูกค้า + audit ละเอียด); กด **"✓ พร้อมส่ง (ส่ง XX · เข้าคลัง XX)"** ได้ **ต่อเมื่อ QC ผ่าน** → PRD = พร้อมส่ง (Ready to Ship) + ส่วนเกิน → FG stock; **ทุก PRD ของ PO/SO = พร้อมส่ง → PO/SO = พร้อมส่ง (จบ)**. **★ (C2 r20): สำหรับ SO produce-to-stock (โหมด ข, ไม่ผูกลูกค้า) — roll-up ปลายทาง = "ผลิตเข้าคลังแล้ว (Completed/stocked)" ไม่ใช่ "พร้อมจัดส่ง" (ไม่เข้าคิว Route) — `so.md` §4.** **★ (C4 r20): OEM surplus (ผลิตเกิน) → FG stock พร้อม OEM identity = sellable bucket (ขายซ้ำผ่าน OEM PO ได้, `stock.md` §4 / `po.md` §5.4).** **เลือก Lot ตัดวัตถุดิบเฉพาะ lot ที่มี stock; หลาย lot → FIFO**. **ปุ่มบันทึก Loss มีบนหน้านี้ (confirm popup, เหตุผลบังคับ, ตัด stock ตาม D15)**. **ปุ่ม "ไปหน้า QC ›" เปิดได้เฉพาะสถานะ ส่งตรวจคุณภาพ (QC)** → deep-link ไป qc "ตรวจแบตช์". **ทุกการเปลี่ยนสถานะมี confirm popup**. **★ เลข PRD ออกตอน "รับงาน" · เลข Batch ออกตอน "เริ่มผลิต" — แสดงเลขที่ออกใน confirm popup (G8/NS3)**. **ทั้ง PRD และ Batch มีช่องหมายเหตุ (comment) แก้ในที่ + เก็บประวัติการแก้ครบ (comment-convention.md).**

---

## 1. Purpose
รับงานจากคิว → สร้าง PRD (1/line) → เริ่มผลิต (gen Batch + ตัด RM FIFO) → ส่ง QC → พร้อมส่ง (Ready to Ship, capture surplus D13); รองรับทั้ง OEM (ผูก PO/ลูกค้า) และ Own-Brand produce-to-stock (ไม่ผูกลูกค้า). เป็น "หน้าจัดการงานผลิต" ที่ฝ่ายผลิตทำงานจริง: รับงาน, กรอกจำนวนผลิตจริง, ตัด lot, บันทึก loss, ส่ง QC, พร้อมส่ง.

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `production.html` แท็บ **① รอรับงาน (Awaiting Acceptance)** | งานที่ PO/SO ยืนยันแล้ว รอฝ่ายผลิต **กด "รับงาน"** — search/filter §6.1 · ดู PO/SO detail (modal) · ปุ่ม "รับงาน" (gen PRD, **★ ออกเลข PRD + แสดงใน confirm popup — G8/NS3**) |
| `production.html` แท็บ **② คิวงานที่รับแล้ว (Accepted queue)** | งานที่รับแล้ว **จัดกลุ่มตาม PO/SO → PRD ซ้อนใต้** — search/filter §6.2 · เข้า **หน้าจัดการ (§7)** ต่อ PRD/Batch |
| `production.html` **หน้าจัดการ (management page)** ต่อ PRD/Batch | actual qty (≥ ordered) · เลือก lot (มี stock, FIFO) · loss (+popup) · **เริ่มผลิต (gen Batch, ★ ออกเลข Batch + แสดงใน confirm popup — G8/NS3)** · ส่ง QC · **"ไปหน้า QC ›"** (gate) · **"✓ พร้อมส่ง"** (QC-gated) · edit-PO (→follow-up+audit) · **comment ต่อ PRD และ Batch** · confirm popup ทุก status change |
| `qc.html` | ตรวจ Batch (ผ่าน/ไม่ผ่าน+feedback) — รวม Batch produce-to-stock ไม่ผูกลูกค้า (U1); เป็นปลายทาง deep-link "ไปหน้า QC" (§7.4) |

## 3. Entities / Fields
| ฟิลด์ | ชนิด | หมายเหตุ |
|---|---|---|
| PRD `PRD-{YYYYMM}-{NNNNNN}` | computed | **1/line** · **★ ออกตอน "รับงาน" (gapless) → แสดงเลขใน confirm popup (G8/NS3; NS1 N/A)** · ผูก PO(OEM) **หรือ** SO produce-to-stock (ไม่ผูกลูกค้า) |
| Batch `B-{PO}-{line}-{run}` | computed | **★ ออกตอน "เริ่มผลิต" → แสดงเลขใน confirm popup (G8/NS3)**, +run เมื่อ rework · **เลข derived → NS2 gapless ไม่บังคับ** |
| **จำนวนสั่ง (ordered qty)** | units, จาก PO/SO line | read-only ที่หน้าผลิต · แก้ได้เฉพาะผ่าน edit-PO (§5c) |
| **จำนวนผลิตจริง (actual produced qty)** | units, editable | D13 · **ต้อง ≥ จำนวนสั่งเสมอ (validation §8)** · อาจเกิน (over-production → surplus) |
| ส่วนเกิน (surplus) | units, computed | = actual − ordered → FG stock ตอน "พร้อมส่ง" (D13) · **★ C4: OEM surplus = OEM identity → OEM FG sellable bucket** |
| loss | units + เหตุผล(บังคับ) | ตัด on_hand, ไม่อนุมัติ (D15) · **ปุ่ม + confirm popup บนหน้าจัดการ (§7.5)** |
| Lot ที่ตัด (consume) | ref Lot | **เลือกเฉพาะ lot ที่มี stock; หลาย lot → FIFO (§5d)** |
| แหล่งงาน | enum {PO(OEM), Own-Brand produce-to-stock} | ใช้ filter |
| **★ หมายเหตุ PRD (comment)** | free-text (ช่องเดียว/PRD), editable | **แก้ในที่ + เก็บประวัติ + โผล่ trace — `comment-convention.md`** |
| **★ หมายเหตุ Batch (comment)** | free-text (ช่องเดียว/Batch run), editable | **แก้ในที่ + เก็บประวัติ + โผล่ trace — `comment-convention.md`** · คนละฟิลด์กับ QC feedback / loss reason / surplus remark / Hold comment |

## 4. Statuses / lifecycle (entity-status-map §1.4/§1.5)
รอรับงาน → **รับงาน** (gen PRD, ★ ออกเลข PRD + confirm popup G8) → **กำลังผลิต** (gen Batch + **ตัดจริง FIFO**, ★ ออกเลข Batch + confirm popup G8, ติดลบได้ — Option A) → **ส่งตรวจคุณภาพ / รอ QC** → (QC ผ่าน) **พร้อมส่งมอบ (eligible)** → **[กด "✓ พร้อมส่ง"]** → **พร้อมส่ง (Ready to Ship)** / (QC ไม่ผ่าน+feedback) **Rework** (gen Batch run+1) · **Hold** (บังคับ comment).
- **★ QC = precondition ของ "พร้อมส่ง" (ไม่ใช่ trigger อัตโนมัติ):** Batch QC ผ่าน → PRD line **มีสิทธิ์ (eligible)** ให้กด "พร้อมส่ง"; **ปุ่ม "✓ พร้อมส่ง" เปิดได้เฉพาะเมื่อ QC ผ่าน** (ไม่ผ่าน = disabled + popup, §7.3). การกด "พร้อมส่ง" (confirm popup) = **capture surplus (D13) + ตั้ง PRD = พร้อมส่ง (Ready to Ship)**.
- **★ Roll-up (แยกตามแหล่งงาน — ★ C2 r20):**
  - **OEM PO / Own-Brand SO โหมด (ก) (มีลูกค้า/ต้องส่ง):** เมื่อ **ทุก PRD = พร้อมส่ง (Ready to Ship)** → **PO/SO = พร้อมส่ง/พร้อมจัดส่ง (Ready to Ship, done)** → โผล่คิวจัดส่ง (Route candidate).
  - **★ Own-Brand SO โหมด (ข) produce-to-stock (ไม่ผูกลูกค้า):** เมื่อ **ทุก PRD = พร้อมส่ง (FG เข้าคลังครบ)** → **SO(ข) = "ผลิตเข้าคลังแล้ว (Completed / stocked)"** — **ไม่ใช่ "พร้อมจัดส่ง (Ready to Ship)" และไม่เข้าคิว Route** (ไม่มีลูกค้า/DN). label roll-up ต้องแยกให้ชัด เพื่อไม่ให้ SO(ข) อ่านเป็น ready-to-ship. authoritative terminal = `so.md` §4 · sync entity-status-map.
- **produce-to-stock PRD (ไม่ผูกลูกค้า):** QC ผ่าน → กด "พร้อมส่ง" → **FG เข้าคลัง per-Batch เต็มจำนวนผลิตจริง** (D12 — ไม่มีลูกค้าให้ส่ง; ส่ง 0 · เข้าคลัง = actual) → **SO(ข) roll-up = "ผลิตเข้าคลังแล้ว" (C2)**.
- **RM-direct (D3):** line วัตถุดิบตรงยังเดินผ่าน production flow.
> **หมายเหตุ:** "Hold (บังคับ comment)" = เหตุผลของการเปลี่ยนสถานะ (คนละฟิลด์กับ comment หมายเหตุทั่วไป §3/§5e). **Rework** = "กลับกำลังผลิต" → ในแท็บ "รับแล้ว" ถือเป็นส่วนของกลุ่ม **กำลังผลิต** (§6.2).

## 5. ★ Actual qty + Surplus + Under/Over production (D13)

### 5a. 1 PO/SO : หลาย PRD — CONFIRMED (grouping)
- **ยืนยันตาม locked model:** **1 order line = 1 PRD** → **PO/SO ที่มีหลาย line = หลาย PRD**. (settled โดยกฎที่ล็อกแล้ว.)
- ผลต่อ UI: **แท็บ "คิวงานที่รับแล้ว" จัดกลุ่มตาม PO/SO** (header = PO/SO + ลูกค้า) → **PRD (ต่อ line) ซ้อนอยู่ใต้**. status ของ PO/SO = roll-up จาก PRD ใต้กลุ่ม (§4).

### 5b. Over-production (reinforce D13) — ★ C4 OEM surplus → OEM FG sellable bucket
- ผลิตตามปกติ → ฝ่ายผลิต **แก้ "จำนวนผลิตจริง"** เป็นจำนวนที่มากกว่าจำนวนสั่งได้ → กด **"✓ พร้อมส่ง (ส่ง XX · เข้าคลัง XX)"** (confirm popup) → **PRD = พร้อมส่ง (Ready to Ship)**; **ส่งลูกค้า = จำนวนสั่ง · ส่วนเกิน (actual − ordered) → เพิ่ม FG stock อัตโนมัติ** (per-Batch) + **remark** ("สต็อกเพิ่มจากการผลิตเกิน") — **ไม่ใช่ approval gate**.
- **★ C4 (⭐ CRITICAL — ปอนด์ 2026-07-31): OEM overproduction (surplus) → FG stock พร้อม "OEM identity"** (คง Batch identity ผูก OEM Batch/PRD/PO) → เป็น **sellable bucket** ที่ **ขายซ้ำผ่าน OEM PO ใหม่ได้** (sell-from-stock, ขนาน Own-Brand FG) — `stock.md` §4 (movement `surplus (+)`, OEM identity) · `po.md` §5.4 (OEM PO fulfil จากสต็อก). ไม่ใช่แค่ "ของค้างในคลัง" แต่เป็น stock ที่ขายได้จริง.
- ทุก PRD ของ PO/SO = พร้อมส่ง → PO/SO roll-up (§4; SO(ข) = "ผลิตเข้าคลังแล้ว").

### 5c. ★ Under-production — จำนวนผลิตจริงต้อง ≥ จำนวนสั่งเสมอ
- **กติกา:** **จำนวนผลิตจริง (actual) ต้อง ≥ จำนวนสั่ง (PO/SO ordered qty) เสมอ** — ระบบ **ห้ามตั้ง actual < ordered** (validation §8, บล็อกจริง).
- **จะส่งน้อยกว่าที่สั่งต้องแก้ PO ก่อน:** ถ้าผลิตได้จริงน้อยกว่าที่สั่ง → ฝ่ายผลิตต้อง **แก้ PO/SO ให้จำนวนสั่ง = จำนวนผลิตจริง (ลดจำนวนสั่งลงมา)** ก่อน แล้วจึงกด "พร้อมส่ง".
- **การแก้ PO ในบริบทการผลิต (§7.6) → ผลลัพธ์บังคับ:** **(1) raise ⚑ "ต้องติดตาม (follow-up)" ที่ลูกค้า** (reuse Customer follow-up flag — `customer.md` §4.1; ★ r20: manual/standalone cascade → ยิง noti Follow-up ไม่โดน de-dup) · **(2) audit ละเอียดระดับ field** (`po.md` §5.2 · `traceability.md` §4).
- loss ที่ทำให้ได้ของไม่ครบตามสั่ง → **ไม่ auto re-produce** (คนกด "ผลิตซ้ำ" เอง, D15).

### 5d. ★ Lot selection (consume RM) — เฉพาะ lot ที่มี stock + FIFO
- ตอนตัดวัตถุดิบ → **เลือกได้เฉพาะ lot ที่ยังมี stock (on_hand > 0)** ผ่าน search dropdown (`stock.md` §10).
- **ถ้ามีหลาย lot ที่มี stock → ระบบตัดแบบ FIFO (lot เก่าสุดก่อน)** — Option A + GMP genealogy.
- คง negative-stock rule: ถ้ารวมทุก lot ยังไม่พอ → ตัดติดลบได้ (เตือนไม่บล็อก) แล้ว GR ชดเชย + FIFO retro-link ภายหลัง (entity-status-map §1.6).

### 5e. ★ Comment + change-history (PRD & Batch — ยึด `comment-convention.md`)
- **PRD มีช่อง comment เดียว** และ **Batch (แต่ละ run) มีช่อง comment เดียว** — แยกช่องกัน · แก้ในที่ (overwrite).
- ทุกครั้งที่แก้ → เก็บ **ใคร/เมื่อ/ค่าเดิม→ค่าใหม่** ผ่าน field-audit; หน้า production/detail แสดง **ค่าปัจจุบัน + "ประวัติการแก้ไข comment"**.
- การแก้ = activity-log event + **โผล่บน trace** (entity=PRD หรือ Batch, field=`comment`). กติกาเต็ม = `comment-convention.md` (CC1–CC7).
- **แยกจากฟิลด์เดิม:** QC feedback, loss reason, surplus remark, Hold comment.

## 6. ★ Production Queue — 2 tabs (search / filter / default / ordering + PO/SO detail modal)

### 6.1 แท็บ ① "รอรับงาน (Awaiting Acceptance)"
- **Search (ครอบทุกสถานะ):** เลข **PO** และ เลข **SO** · **ชื่อลูกค้า** · **ข้อมูลผู้ติดต่อ** · **ช่วงวันที่สร้าง PO/SO** · **ช่วงวันที่ต้องการรับของ**.
- **Filter:** ตาม **สถานะ PO และ SO** · **default filter = "พร้อมรับงาน (ready to accept)"**.
- **Action:** ปุ่ม **"รับงาน"** ต่อ line → gen PRD (§4) — **★ confirm popup + แสดงเลข PRD (G8/NS3, §7.7)**.
- **ดู PO/SO detail:** คลิกได้ → **modal dialog** + **ลิงก์ "เปิดหน้า PO/SO เต็ม"**. กลับมาไม่เสีย state (G3).
- 20/หน้า (G1).

### 6.2 แท็บ ② "คิวงานที่รับแล้ว (Accepted queue)"
- **Search (ครอบทุกสถานะ):** เลข **PO**, **SO**, **และ PRD** · **ชื่อลูกค้า** · **ข้อมูลผู้ติดต่อ** · **ช่วงวันที่สร้าง** · **ช่วงวันที่ต้องการรับของ**.
- **Filter:** ตามสถานะ PO/SO · **default filter = รับงานแล้ว · Hold · กำลังผลิต · QC (ส่งตรวจคุณภาพ) · พร้อมส่งมอบ**.
- **★ Ordering ของผลลัพธ์:** **รับงานแล้ว → กำลังผลิต → QC → พร้อมส่งมอบ → Hold** (Rework ในกลุ่ม "กำลังผลิต" — §4).
- **Grouping:** จัดกลุ่มตาม **PO/SO → PRD ซ้อนใต้** (§5a).
- **เข้าหน้าจัดการ (§7):** คลิก PRD/Batch → หน้าจัดการงานผลิต.
- 20/หน้า (G1).

## 7. ★ Management page — actions (หน้าจัดการงานผลิต)

### 7.1 กรอกจำนวนผลิตจริง (actual qty)
- ฟิลด์ **"จำนวนผลิตจริง"** editable · **validation actual ≥ ordered** (§8) · แสดง preview "ส่ง XX · เข้าคลัง XX" (surplus = actual − ordered).

### 7.2 เลือก Lot ตัดวัตถุดิบ (FIFO)
- เลือกเฉพาะ lot ที่มี stock · หลาย lot → FIFO (§5d).

### 7.3 "✓ พร้อมส่ง (ส่ง XX · เข้าคลัง XX)" — QC-gated
- **เปิดได้เฉพาะเมื่อ Batch/PRD ผ่าน QC แล้ว** · **ถ้ายังไม่ผ่าน QC → ปุ่ม disabled + popup "QC ต้องผ่านก่อน"**.
- เมื่อกด (QC ผ่าน) → **confirm popup** ยืนยัน "ส่ง XX · เข้าคลัง XX" → ตั้ง PRD = พร้อมส่ง (Ready to Ship) + capture surplus → FG (D13, §5b; **★ C4 OEM surplus = OEM identity**). Roll-up PO/SO (§4; SO(ข) = "ผลิตเข้าคลังแล้ว").

### 7.4 "ไปหน้า QC ›" — deep-link (gate)
- **เปิดได้เฉพาะเมื่อสถานะ = ส่งตรวจคุณภาพ (QC / รอ QC)** · สถานะอื่น = disabled.
- คลิก → **navigate ตรงไปหน้า qc → แท็บ "ตรวจแบตช์" → Batch นั้นโดยตรง** (`qc.md` §9). ไม่ให้ตัดสิน QC ที่หน้าผลิต.

### 7.5 บันทึก Loss — ปุ่มต้องมีบนหน้านี้
- **ปุ่ม "บันทึก Loss" มีอยู่บนหน้าจัดการ**.
- **confirm popup ทุกครั้ง** · **เหตุผลบังคับ** · **ตัด on_hand อย่างเดียว, ไม่อนุมัติ** · ledger movement (reason+source=Batch/PRD) ตาม D15 (`stock.md` §5/§6). loss → ไม่ auto re-produce (§5c).

### 7.6 แก้ PO ในบริบทการผลิต (edit-PO) → follow-up + audit
- ฝ่ายผลิตแก้ PO (เช่น ลดจำนวนสั่งลงเพื่อ under-production §5c) จากบริบทการผลิต → **บันทึกผ่าน PO module** (`po.md` §5.2):
  - **raise ⚑ "ต้องติดตาม" ที่ลูกค้า** (reuse Customer follow-up flag, `customer.md` §4.1) — Sale เห็นว่า PO ถูกแก้ (★ r20: ยิง noti Follow-up).
  - **audit ละเอียดระดับ field** (`traceability.md` §4 · `non-functional.md` AU1). **★ แก้ PO ไม่ออกเลข PO ใหม่ (G8/NS6).**
- confirm popup (§7.7).

### 7.7 ★ Confirm popup ทุกการเปลี่ยนสถานะ
- **ทุก action ที่เปลี่ยนสถานะ** (รับงาน, เริ่มผลิต, ส่งตรวจ QC, พร้อมส่ง, Hold, ผลิตซ้ำ/rework, loss, edit-PO) → **มี confirm popup ก่อนดำเนินการเสมอ**. Hold/loss/edit-PO/ยกเลิก = บังคับเหตุผล.
- **★ number-on-save (G8/NS3):** action ที่ **ออกเลขใหม่** — **"รับงาน" (ออกเลข PRD)** และ **"เริ่มผลิต" (ออกเลข Batch)** — **แสดงเลขที่ออกให้ใน confirm popup ของ action นั้น**. PRD/Batch **ไม่มีฟอร์ม create → NS1 N/A**; Batch เลข derived → NS2 ไม่บังคับ.

## 8. Validations
- **★ actual qty ≥ ordered qty เสมอ** — ตั้ง actual < ordered = **บล็อก** (ต้องแก้ PO ลงก่อน §5c). actual ≥ 0.
- **★ "✓ พร้อมส่ง" ต้อง QC ผ่านก่อน** — ไม่ผ่าน = disabled + popup "QC ต้องผ่านก่อน" (§7.3).
- **★ "ไปหน้า QC" เปิดเฉพาะสถานะ ส่งตรวจคุณภาพ (QC)** (§7.4).
- **★ Lot consume: เลือกได้เฉพาะ lot ที่มี stock; หลาย lot = FIFO** (§5d).
- **★ ทุกการเปลี่ยนสถานะ = confirm popup** (§7.7) · **action ที่ออกเลข (รับงาน→PRD, เริ่มผลิต→Batch) แสดงเลขใน popup (G8/NS3)**.
- **★ (C2 r20): SO produce-to-stock (โหมด ข) roll-up ปลายทาง = "ผลิตเข้าคลังแล้ว (Completed/stocked)" — ห้าม label เป็น "พร้อมจัดส่ง/Ready to Ship" และไม่ผลักเข้าคิว Route** (`so.md` §4).
- **★ (C4 r20): OEM surplus (over-production) → FG stock พร้อม OEM identity (sellable bucket)** — `stock.md` §4/§6.
- loss = เหตุผลบังคับ + confirm popup (§7.5).
- QC ไม่ผ่าน = feedback บังคับ (ที่หน้า QC).
- production ไม่มีปุ่มตัดสิน QC (เห็นผลเท่านั้น; ตัดสินที่หน้า QC).
- **★ comment PRD/Batch (หมายเหตุทั่วไป) = ไม่บังคับ** · แก้ได้ทุกสถานะ · ทุกการแก้ถูก audit (comment-convention.md CC2/CC3).

## 9. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ดูคิว 2 แท็บ/PRD/Batch + **ดูประวัติ comment** + ดู PO/SO modal | Production.**Read (R)** (+ Customer.R สำหรับ modal ลูกค้า) |
| รับงาน (gen PRD, ★ ออกเลข PRD + popup) | Production.**Update (U)** (หรือ Create @ PRD) |
| เริ่มผลิต (gen Batch + ตัด RM FIFO, ★ ออกเลข Batch + popup) | Production.**Update (U)** |
| กรอก actual qty / เลือก lot / กด "✓ พร้อมส่ง" | Production.**Update (U)** |
| บันทึก Loss (บนหน้าจัดการ) | Production.**Update (U)** + เหตุผล |
| **แก้ PO ในบริบทการผลิต (edit-PO)** | **PO.Update (U)** (+ raise follow-up + audit — `po.md` §5.2) |
| **แก้ไข comment PRD/Batch (แก้ในที่)** | Production.**Update (U)** (เก็บประวัติ auto) |
| ผลิตซ้ำ (rework) / Hold | Production.**Update (U)** (Hold + comment) |
| **"ไปหน้า QC ›" (navigate)** | Production.**Read (R)** · ตัดสิน = **QC.Update/Approve** ที่หน้า QC |
> surplus = auto (ไม่มี permission แยก; **★ C4: OEM surplus → OEM FG bucket**).

## 10. Pagination / Search
- ทั้ง 2 แท็บ: 20/หน้า (G1).
- **แท็บ รอรับงาน:** search PO/SO/ลูกค้า/ผู้ติดต่อ/ช่วงวันที่สร้าง/ช่วงวันที่ต้องการรับของ · filter สถานะ PO/SO (default "พร้อมรับงาน").
- **แท็บ รับแล้ว:** search **+ PRD** · filter สถานะ (default รับงานแล้ว/Hold/กำลังผลิต/QC/พร้อมส่งมอบ) · ordering · grouping PO/SO.

## 11. Cross-links
- FG-in/surplus/loss/lot-FIFO → `stock.md` §4/§5/§6 (**★ C4 OEM FG bucket**) · produce-to-stock ที่มา → `so.md` §6 + `supply-planning.md` (D8 v2) · reservation/consume → stock-reservation · **QC gate + deep-link "ตรวจแบตช์" → `qc.md` §4b/§9**.
- **★ (C2) SO(ข) terminal "ผลิตเข้าคลังแล้ว" (roll-up ไม่ใช่ "พร้อมจัดส่ง", exclude จาก Route) → `so.md` §4 · entity-status-map.**
- **★⭐ (C4) OEM surplus → OEM FG sellable bucket (OEM identity) → `stock.md` §4 · `po.md` §5.4 (sell-from-stock) · `oem-flow.md`.**
- **edit-PO (จากการผลิต) → follow-up + field audit → `po.md` §5.2 · follow-up flag → `customer.md` §4.1.**
- **★ เลข PRD/Batch แสดงใน confirm popup ตอน action (G8/NS3, NS1 N/A) → `numbering-on-save.md`.**
- **Comment + change-history → `comment-convention.md` · field-audit/genealogy → `traceability.md` §4 · `non-functional.md` AU1.**

## 12. Module changelog
- **★ เพิ่ม (2026-07-29 — number-on-save G8, ปอนด์ cross-cutting):** **เลข PRD ออกตอน "รับงาน" · เลข Batch ออกตอน "เริ่มผลิต" → แสดงเลขที่ออกใน confirm popup** — §2/§3/§4/§7.7/§8/§9/§11.
- **★ เพิ่ม (2026-07-29 — Production module review, ปอนด์):** คิวผลิต 2 แท็บ · CONFIRMED 1 PO/SO : หลาย PRD · actual qty ≥ ordered · over-production surplus→FG · under-production แก้ PO ลงก่อน · lot consume FIFO · "✓ พร้อมส่ง" QC-gated · Loss บนหน้า · "ไปหน้า QC" deep-link · confirm popup ทุก status change · edit-PO → follow-up + audit.
- **★ Reconcile lifecycle:** QC pass = **precondition** ของ "พร้อมส่ง"; ทุก PRD พร้อมส่ง → PO/SO พร้อมส่ง (§4) — sync entity-status-map §1.4.
- **★ เพิ่ม (2026-07-31 — Gate-1 review reconciliation r20, ปอนด์):**
  - **(C2 — BA M1):** **§4 roll-up แยกตามแหล่งงาน** — **SO produce-to-stock (โหมด ข) roll-up ปลายทาง = "ผลิตเข้าคลังแล้ว (Completed/stocked)" ไม่ใช่ "พร้อมจัดส่ง"** และ **ไม่เข้าคิว Route** (ไม่มีลูกค้า/DN) — แก้ปัญหา SO(ข) อ่านเป็น ready-to-ship. sync `so.md` §4 + entity-status-map. summary/§4/§7.3/§8/§11.
  - **(C4 ⭐ CRITICAL):** **§5b — OEM overproduction (surplus) → FG stock พร้อม OEM identity = sellable bucket** ที่ขายซ้ำผ่าน OEM PO ใหม่ได้ (sell-from-stock) — ไม่ใช่แค่ของค้างคลัง. ref `stock.md` §4 (surplus OEM identity) · `po.md` §5.4. summary/§3/§5b/§7.3/§8/§9/§11.
  - **ใช้ view เดิม (`production.html` render จาก .md).**
- **คงเดิม:** actual qty/surplus (D13), PRD ไม่ผูกลูกค้า (D8 v2), loss (D15), comment PRD/Batch, QC-gated พร้อมส่ง.
