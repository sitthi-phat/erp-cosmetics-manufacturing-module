# BA Content-Accuracy Review — User Journeys (ผังภาพ, 6 สาย)

slug: `erp-v2-ui-first` · reviewer: BA · 2026-07-14
file under review: `docs/design/erp-v2-ui-first/functional-spec/user-journeys.html` (UX/UI rewrite → flow diagram cards)
locked sources verified against: `status-journeys.md`, `entity-status-map.md`, `stock-reservation.md`, `mock-data-journeys.md`, `deletion-policy.md`, functional-spec module pages (story-ID cross-refs) + mockups (badge-color truth)

## สรุปภาษาไทย
ตรวจข้อเท็จจริงของผังภาพ 6 สาย (ลูกค้า/PO/ผลิต/QC/จัดส่ง/บิล) เทียบเอกสารความจริงหลักทุกฉบับ. โครงเรื่อง สถานะ ผู้ทำ เลขเอกสาร ทางแยก และ story-ID **ถูกต้องแทบทั้งหมด**. แก้เอง 4 จุด (ระดับข้อความ/สี ไม่แตะดีไซน์): (1) สี PRD "พร้อมส่งมอบ" ฟ้า→เขียว ให้ตรง mockup, (2) สี PR "เปิดคำขอ" เทา→เหลือง ให้ตรง mockup, (3) แก้เลข cascade ผิดของขั้นลูกค้า "ห่างหาย", (4) เติมสถานะรอบ "รับเข้ารอบ" ที่ถูกย่อหายในสายจัดส่ง. ยืนยัน open item: Overdue สีแดงถูกต้อง, "รับงาน" ฟ้า—mockup ไม่ได้กำหนดสี ปล่อยฟ้า. เหลือ 2 เรื่องส่งให้ PO/ปอนด์เคาะ: สถานะ Shipment "ส่งบางส่วน (Partially)" ไม่มีใน entity-status-map และสี badge "Rework" ต่างจาก mockup.

---

## 1. Checklist results (pass/fail per journey)

Legend: P = pass · P* = pass with note/fix applied · Q = open question to PO/Pond

| # Verify item | J1 Customer | J2 PO/Sales | J3 Production | J4 QC | J5 Shipping | J6 Billing |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| 1. Status chips = real status, right entity tag, right sequence | P* | P | P* | P* | Q | P |
| 2. Actor badge = real performer; auto = real auto-transition | P | P* | P | P | P | P |
| 3. Doc-number formats + mock-data examples | P | P | P | P | P | P |
| 4. Branch forks exist in sources; no locked branch missing | P | P | P | P | P | P |
| 5. Step↔story-ID tables point at real story IDs | P | P | P | P | P | P |
| 6. Mockup deep-links point at files that exist | P | P | P | P | P | P |

Notes keyed above:
- **J1 item1 (P\*)** — fixed a wrong cross-ref code on the "ห่างหาย (Inactive)" step (see Fix #3). Customer 6-status colors (Lead=neutral, Active=success, Inactive=warning, Follow-up=processing, Blacklist=error) all match dashboard.html mockup.
- **J2 item2 (P\*)** — the Cancel fork "step b" is labelled ⚙️ ระบบ but is a *mixed* step: the reservation release before production is auto (entity-status-map C19), yet the after-production "คืน/ไม่คืน (write-off) + mandatory reason" is a human (Sale) decision. Left as system because the card frames the system's branching reaction to the Sale-driven cancel in step a; flagged as an observation only (not a clean error). All other ⚙️ auto labels verified against the auto list — see §3 open-item 3.
- **J3 item1 (P\*)** — fixed PRD "พร้อมส่งมอบ" colour (Fix #1). "แอลกอฮอล์ PO-185" negative-stock example **verified correct**: dashboard.html shows `PO-185 line2 สเปรย์แอลกอฮอล์ … จะตัด stock ติดลบ` (PO-185 is multi-line; also carries the glycerin PR-031 shortage per mock-data). The "~30 หน่วย" figure is illustrative (prefixed "~"), not fixed in any source, does not contradict the locked titanium −15 figure.
- **J4 item1 (P\*)** — fixed PRD line1 "พร้อมส่งมอบ" colour (Fix #1). "Rework" badge colour discrepancy raised as open question Q2 (§4).
- **J5 item1 (Q)** — Shipment "ส่งบางส่วน (Partially)" is used by mock-data-journeys UC8 but is **not** a Shipment status in entity-status-map §1.9 (which lists only Received/In-Route/Closed). Source conflict → open question Q1 (§4). Also the round's "รับเข้ารอบ (Received)" state was compressed out of the happy path; I added a small clarifying note to step 1 (Fix #4) rather than restructure.

Cross-checks that passed cleanly:
- Doc formats: `PO-202607-000181`, `PRD-202607-000091`, `B-PO-202607-000181-1-1`, `B-…-181-2-2`, `B-…-170-1-2`, `SHP-20260708-0044`, `DN-20260708-00119`, `INV-2026-000135` all match the locked formats and the mock-data dataset (PO-181 rework 2-1→2-2, PO-170 rework 1-1→1-2, PO-176→SHP-0044→DN-00119→INV-135, SHP-0046 partial with DN-00123 reject / DN-00124 postpone 10/07).
- All locked branches present: QC fail→rework single-line, cancel-before vs after production (auto release vs คืน/ไม่คืน write-off + reason), material shortage warn+PR (not block, vs Available), negative stock→FIFO retro-link on GR, Lot QC-in fail→return, Hold, invoice void/versioning, overdue scheduler, customer inactivity, Lead→Active auto, DN reject/postpone→partial round. (Note: "partial GR→new PR for shortfall" belongs to the material support line, not one of the 6 journey cards — correctly out of scope here.)
- Every US-ID in the collapsible tables (US-CUS-01..04, US-HOME-01, US-PO-01/02/04/05/07, US-PR-01, US-PRD-01..05, US-STK-03/06, US-QC-01..03, US-RET-01, US-SHP-01..03, US-INV-01..04, US-SET-03) exists in its module page in the functional spec.
- All mockup deep-links (`../mockups/*.html`) resolve to existing files.

---

## 2. Fixes made (directly in user-journeys.html — presentation/layout untouched)

| # | Where | Was | Now | Source of truth |
|---|---|---|---|---|
| 1 | J3 step 4 + J4 step 1 — PRD "พร้อมส่งมอบ" | `badge b-processing` (blue) | `badge b-success` (green) | dashboard.html renders PRD "พร้อมส่งมอบ" as `b-success` (drill-production-3). PO "พร้อมจัดส่ง" left blue (dashboard renders it `b-processing`). |
| 2 | J2 shortage fork — PR "เปิดคำขอ (Open)" | `badge b-neutral` (grey) | `badge b-warning` (amber) | dashboard.html + purchase-request.html both render PR "เปิดคำขอ" as `b-warning`. |
| 3 | J1 inactivity fork step a — "ห่างหาย" | `<small>C2</small>` | `<small>auto scheduler · entity-map §1.1</small>` | The page declares its cascade codes follow entity-status-map C1–C20, where **C2 = รอรับงาน→รับงาน (gen PRD)**, not customer-inactive. Active→Inactive has no cascade number (it lives in entity-status-map §1.1). Removed the false code. |
| 4 | J5 step 1 — small caption | `ระบบ gen DN (1 DN = 1 PO) · C9` | `ระบบ gen DN (1 DN = 1 PO) · รอบ: รับเข้ารอบ → กำลังนำส่ง · C9` | entity-status-map §1.9: Shipment starts at "รับเข้ารอบ (Received)" before "กำลังนำส่ง". The happy path compressed create+dispatch into one card; added the elided state as text rather than adding a card. |

All four are text/CSS-class edits on status chips or captions. No card, flow, fork, or layout structure was changed.

---

## 3. Resolution of UX/UI open items 1–4

**Open item 1 — PRD `รับงาน (Received)` and `พร้อมส่งมอบ` given blue by analogy:**
- `พร้อมส่งมอบ` — **DEFINED in mockup**: dashboard.html renders it `b-success` (green). → **Fixed** journey to green (Fix #1) at J3 step4 and J4 step1.
- `รับงาน (Received)` — **genuinely undefined**: no mockup renders a "รับงาน" status badge (production.html shows it only as a completed stepper step; dashboard shows the *pre*-state "รอรับงาน" as neutral/warning, not "รับงาน"). → **Left blue (`b-processing`)** as a reasonable "active/in-hand" analogy; noted for Pond. If a canonical colour is later chosen, this is the one chip to revisit.

**Open item 2 — Invoice `เกินกำหนด (Overdue)` rendered red:**
- **CONFIRMED correct**: dashboard.html renders "เกินกำหนด" as `b-error` (red), in both the Finance tile drill-downs. → No change. (Also confirmed Invoice "รอชำระ" = `b-warning` in invoices.html + dashboard, matching the journey.)

**Open item 3 — steps labelled ⚙️ ระบบ (auto) confirmed against entity-status-map auto-transitions:**
All auto-labelled steps verified:
- J1 s3 Lead→Active = auto (§1.1 Active auto) ✔
- J1 inactivity Active→Inactive = auto scheduler (§1.1 Inactive) ✔
- J2 shortage warn + PR = auto (§1.7 PR Open auto / C15) ✔
- J3 s4 PRD พร้อมส่งมอบ + PO พร้อมจัดส่ง cascade = auto (§1.4/§1.2, C5) ✔
- J4 s3 all-lines-pass → PO พร้อมจัดส่ง = auto (§1.2, C5) ✔
- J5 s3 all-DN-final → Shipment Closed = auto (§1.9) ✔
- J6 overdue = auto scheduler (§1.3, C14) ✔
- **One mixed step (not relabelled):** J2 Cancel fork "step b" — auto reservation-release is correct, but the after-production คืน/ไม่คืน + write-off reason is a human Sale decision. Kept ⚙️ (frames the system's branch on cancel) and noted here for Pond to confirm labelling preference. No other step is a human action mislabelled as auto.

**Open item 4 — thumbnails omitted for deep-links (offline/no-asset):** left as-is per Pond's call. Noted: this is a deliberate presentation decision, not a content issue; deep-links all resolve to existing mockup files.

---

## 4. Could NOT verify — questions for PO/Pond (Thai, with options)

**Q1 — สถานะรอบจัดส่ง "ส่งบางส่วน (Partially)"**
`mock-data-journeys.md` (UC8) ใช้ป้าย **"ส่งบางส่วน (Partially)"** กับหัวรอบ SHP-0046 แต่ `entity-status-map.md` §1.9 กำหนดสถานะ Shipment ไว้แค่ **รับเข้ารอบ / กำลังนำส่ง / จบรอบ** (ไม่มี Partially). ผังภาพจึงยึดตาม mock-data (แสดง badge Partially) ซึ่งขัดกับ source ความจริงหลัก. ผมไม่แก้เอง เพราะเป็นการชนกันของ 2 เอกสารล็อก ไม่ใช่ข้อผิดของผัง.
- ตัวเลือก A: เพิ่ม "ส่งบางส่วน (Partially)" เป็นสถานะรอบจริงใน entity-status-map §1.9 (แก้ source หลักให้ตรง mock-data)
- ตัวเลือก B: ให้ "Partially" เป็นแค่ป้าย reconcile/มุมมอง ไม่ใช่ lifecycle status (รอบยังเป็น "กำลังนำส่ง/ยังไม่จบรอบ") → ผังควรปรับถ้อยคำเป็น reconcile badge
- (BA แนะนำ B — สอดคล้องกับ §1.9 ที่รอบยังไม่ Closed จนกว่าทุก DN ถึงสถานะสุดท้าย)

**Q2 — สี badge "Rework" (PRD ที่ถูกตีกลับ)**
ผังใช้ **สีแดง (`b-error`)** กับ "PRD Rework" (J3 fork, J4 s2) แต่ dashboard.html เรนเดอร์งาน rework เป็น **"กำลังผลิต · Rework" สีฟ้า (`b-processing`)** (เพราะ entity-status-map §1.4 ระบุ Rework = กลับ "กำลังผลิต"). ผมไม่แก้เอง เพราะสีแดงดูเป็นการเน้น "งานตก/ต้องแก้" โดยตั้งใจ และการเปลี่ยนสีอาจเข้าข่ายแตะดีไซน์.
- ตัวเลือก A: คงแดงไว้เพื่อเน้นว่าเป็นงานที่ QC ตีกลับ (ต่างจาก mockup dashboard)
- ตัวเลือก B: เปลี่ยนเป็นฟ้า `b-processing` ให้ตรง mockup ("กำลังผลิต · Rework") — คงคำมั่น legend ว่า "สีตรงระบบจริง"
- (BA แนะนำ B เพื่อให้สีตรง mockup จริง; ป้าย Batch "QC ไม่ผ่าน" ยังคงแดงถูกต้องอยู่แล้ว)

**Q3 (ยืนยันเล็กน้อย) — ป้ายผู้ทำของขั้น Cancel "step b" (J2)**
ขั้นนี้ผสมทั้ง auto (คืนจองก่อนเริ่มผลิต) และคนตัดสิน (dialog คืน/ไม่คืน + เหตุผลบังคับ หลังเริ่มผลิต). ตอนนี้ติดป้าย ⚙️ ระบบ.
- ตัวเลือก A: คง ⚙️ ระบบ (มองเป็น "ระบบแตกทางเลือกให้") 
- ตัวเลือก B: เปลี่ยนเป็น 👤 Sale (เพราะการเลือก write-off เป็นการตัดสินของคน)
- (BA แนะนำ A — auto-release เป็นแกนหลัก, dialog เป็นผลพวง; แต่ขอ Pond เคาะ)

---

## 5. Verdict
เนื้อหาผังภาพ **ถูกต้องตรงกับเอกสารความจริงหลัก** หลังแก้ 4 จุดข้างต้น. ไม่มีสถานะที่ประดิษฐ์ขึ้นเอง (ยกเว้นประเด็น Partially ที่เป็นการชนกันของ source — Q1), ผู้ทำ/เลขเอกสาร/ทางแยก/story-ID/deep-link ครบและตรง. เหลือ **2 เรื่องหลัก (Q1, Q2) + 1 เรื่องยืนยัน (Q3)** ที่ต้องให้ PO/ปอนด์ตัดสิน เพราะแก้เองจะกลายเป็นการประดิษฐ์กติกา/แตะดีไซน์.
