# Design System — ERP v2 (UI-First Rebuild)

Slug: `erp-v2-ui-first` · Owner: UX/UI · Status: `WAITING_HUMAN_GATE` (Gate 1 = Pond approves look)
Stack constraint: React + Ant Design **behind wrapper `src/frontend/ui/`** (ADR-008 / ADR-000).
All values below are implemented as **antd `ConfigProvider` theme tokens** — not a custom kit.

## สรุปภาษาไทย

เอกสารนี้คือ "ธีมกลาง" ของระบบ ERP v2 ทั้งหมด กำหนดค่าจริง (สี hex, ขนาด px, น้ำหนักฟอนต์)
สำหรับตั้งใน antd ConfigProvider ครั้งเดียวใช้ทุกหน้า: ใช้ฟอนต์ **IBM Plex Sans Thai** อ่านไทยสบายตา,
โทนหลัก "Clean Clinical" (เขียว-teal สื่อความสะอาด/มาตรฐาน GMP), ปุ่ม/ช่องกรอกสูง 40px กดง่ายบน
แท็บเล็ต, ทุกหน้ามี layout เดียวกัน (เมนูซ้ายตาม role + หัวข้อ + breadcrumb + ปุ่มกลับ). มีตารางแปลง
**สถานะอังกฤษดิบ → ป้ายไทย** ทุกตัว (เช่น QCApproved → "QC ผ่าน") ห้ามโชว์ enum ดิบเด็ดขาด และมี
กติกาการพิมพ์ใบกำกับภาษีไทยแบบ A4. ปอนด์เลือก/ปรับธีมได้ที่ Gate 1 (มี 3 ทางเลือกใน index.html).

---

## 1. Theme direction (เลือกที่ Gate 1)

3 ทางเลือกใน `mockups/index.html`. **ตัวแนะนำ = "Clean Clinical"** (ใช้กับ mockup ทั้งชุดแล้ว):

| Theme | Primary | โทน | เหตุผล |
|---|---|---|---|
| **Clean Clinical** ✅ แนะนำ | `#0E7C7B` teal | สะอาด เย็น มืออาชีพ | เครื่องสำอาง = GMP/ความสะอาด/ความแม่นยำ; teal ดูเป็นแล็บ/คุณภาพ ไม่จืดเหมือน blue ทั่วไป และคอนทราสต์ดีสำหรับใช้ทั้งวัน |
| Warm Cosmetic | `#B0546E` rose | อบอุ่น บิวตี้ | ใกล้ภาพลักษณ์แบรนด์ความงาม แต่เสี่ยงดู "ไม่เป็นระบบโรงงาน" และคอนทราสต์ตัวหนังสือต่ำกว่า |
| Corporate Blue | `#1F5EDB` blue | ปลอดภัย องค์กร | คุ้นเคย ปลอดภัยสุด แต่ generic ไม่มีเอกลักษณ์ |

ทั้ง 3 ใช้ token ชุดเดียวกัน ต่างแค่ `colorPrimary` + สี accent → เปลี่ยนได้ที่ ConfigProvider จุดเดียว.

---

## 2. Color tokens (Clean Clinical — ค่าที่ใช้จริง)

### Brand / semantic (antd `token`)
| Token | Value | ใช้ที่ |
|---|---|---|
| `colorPrimary` | `#0E7C7B` | ปุ่มหลัก, ลิงก์, active menu, focus ring |
| `colorPrimaryHover` | `#12938C` | hover ปุ่ม/ลิงก์ |
| `colorPrimaryActive` | `#0B6360` | pressed |
| `colorPrimaryBg` | `#E6F4F3` | พื้น tag/selection อ่อน |
| `colorSuccess` | `#2E9E5B` | สถานะสำเร็จ (QC ผ่าน, ชำระครบ) |
| `colorWarning` | `#E0912F` | เตือน (stock ต่ำ, ชำระบางส่วน) |
| `colorError` | `#D64545` | ผิดพลาด/ไม่ผ่าน/ยกเลิก |
| `colorInfo` | `#2C7BE5` | ข้อมูล/กำลังดำเนินการ |

### Neutral (text / surface / border)
| Purpose | Value |
|---|---|
| `colorTextBase` / heading | `#1F2933` |
| `colorText` (body) | `#26323F` |
| `colorTextSecondary` | `#52606D` |
| `colorTextTertiary` / placeholder | `#7B8794` |
| `colorTextDisabled` | `#9AA5B1` |
| `colorBorder` | `#D7DDE3` |
| `colorBorderSecondary` (table lines) | `#E4E7EB` |
| `colorBgLayout` (app background) | `#F4F6F8` |
| `colorBgContainer` (cards/tables) | `#FFFFFF` |
| `colorBgElevated` (dropdown/modal) | `#FFFFFF` |
| Sidebar bg | `#10322F` (deep teal-charcoal) |
| Sidebar text | `#CFE0DE` / active `#FFFFFF` on `#0E7C7B` |

### Status badge palette (ใช้กับ Thai status map §7)
| Semantic | Text | Bg | Border |
|---|---|---|---|
| neutral (ร่าง/รอ) | `#52606D` | `#EEF1F4` | `#D7DDE3` |
| processing (กำลังทำ) | `#1F5EDB` | `#E8F0FE` | `#BBD1F8` |
| success (สำเร็จ/ผ่าน) | `#1E7A44` | `#E6F5EC` | `#B7E0C6` |
| warning (เตือน/บางส่วน) | `#9A5B12` | `#FBF0DE` | `#F1D6A6` |
| error (ไม่ผ่าน/ยกเลิก) | `#B02A2A` | `#FCEAEA` | `#F2C2C2` |

---

## 3. Typography

- **Font family**: `"IBM Plex Sans Thai", "Noto Sans Thai", "Sarabun", -apple-system, "Segoe UI", sans-serif`
  - IBM Plex Sans Thai = อ่านไทยชัด + ตัวเลข/อังกฤษสวย, มี weight ครบ, โหลดจาก self-host (ไม่พึ่ง CDN ตอน prod).
  - ตัวเลขในตาราง/ใบกำกับภาษีใช้ `font-variant-numeric: tabular-nums` เพื่อให้หลักตรงกัน.
- **Base**: `fontSize` = **14px**, `lineHeight` = 1.55, weight 400.

| Role | Size | Weight | Line-height |
|---|---|---|---|
| Display / page title (H1) | 24px | 600 | 1.3 |
| Section title (H2) | 20px | 600 | 1.35 |
| Card/table title (H3) | 16px | 600 | 1.4 |
| Body / control | 14px | 400 | 1.55 |
| Body strong | 14px | 600 | 1.55 |
| Caption / helper | 12px | 400 | 1.5 |
| Table numeric | 14px | 500 tabular | 1.5 |

antd tokens: `fontSizeHeading1: 24, fontSizeHeading2: 20, fontSizeHeading3: 16, fontSize: 14, fontSizeSM: 12, fontSizeLG: 16, fontWeightStrong: 600`.

---

## 4. Spacing, radius, density

- **Spacing scale (4px base)**: 4 / 8 / 12 / 16 / 24 / 32 / 48. Use `sizeUnit: 4, sizeStep: 4`.
  - Card padding 24, form item vertical gap 16, table cell padding 12×16, page gutter 24.
- **Radius**: `borderRadius: 8` (base), `borderRadiusSM: 6`, `borderRadiusLG: 12`. Tags/badges 6, buttons/inputs 8, cards 12.
- **Density (touch-friendly for tablet)**: `controlHeight: 40` (default), `controlHeightSM: 32`, `controlHeightLG: 48`.
  Tables use `size="middle"` (row ~48px). This is deliberately roomier than antd defaults — factory staff use tablets.
- **Elevation**: card shadow `0 1px 2px rgba(16,25,40,.06), 0 1px 3px rgba(16,25,40,.10)`;
  dropdown/modal `0 6px 16px rgba(16,25,40,.12)`.

---

## 5. Layout grid & breakpoints

- **App shell**: fixed left **Sider 240px** (collapsed 64), fixed **Header 64px**, scrollable content.
  Content padding 24; forms constrained to **max-width 960px**, document/print pages to A4.
- **Grid**: antd 24-col, gutter `[24,24]`. Form 2-column on ≥992px, 1-column below.
- **Breakpoints (antd)**: `xs <576 · sm ≥576 · md ≥768 · lg ≥992 · xl ≥1200 · xxl ≥1600`.
  - **Targets this round**: Desktop **1440×900** and Tablet **768×1024 (portrait) / 1024×768 (landscape)**.
  - Tablet portrait (`<992`): Sider collapses to overlay drawer (hamburger in header); forms 1-col; tables allow horizontal scroll with sticky first column + primary action always visible.
  - Phone (`<576`): out of scope this round → backlog.

---

## 6. Component usage rules

### Tables
- Every list uses a **toolbar row**: title + count on left, search + filters + primary action (right).
- Columns: humanized headers (Thai), status as **badge** (§7), numeric right-aligned tabular, dates `dd/mm/yyyy` Buddhist-era optional.
- Row actions in a trailing column (ดู / แก้ไข / ...) — icon+label on desktop, icon-only w/ tooltip when cramped.
- **Never render raw ids/enums** as the primary cell. Internal id may appear only as muted secondary text.
- Pagination bottom-right, default 20/page; sticky header on scroll.

### Forms
- Label **on top** (not inline) for Thai readability; required marked with red `*` and helper text under field.
- Group related fields in titled `Card` sections (e.g. "ข้อมูลติดต่อ", "ข้อมูลใบกำกับภาษี").
- Validation inline under field, Thai message; submit disabled until valid or shows summary on submit.
- Every form has a **sticky footer bar**: `[ยกเลิก]` (secondary, goes back) + `[บันทึก]` (primary). Never trap the user.
- Dropdowns/Selects **always show a human label** + optional secondary code, never bare enum. Placeholder "เลือก…".

### Empty states
- Center card: icon + one-line Thai explanation + **primary CTA to the fixing action**
  (e.g. "ยังไม่มีสูตรการผลิต (BOM) สำหรับสินค้านี้" → ปุ่ม "สร้างสูตร"). Never a blank table.

### Loading
- Skeletons for first load (table rows / card blocks), not full-page spinners.
- Inline button spinner on submit; table `loading` overlay on refetch. Optimistic add for PO lines.

### Error / notification patterns
- **Field/validation** → inline under field.
- **Action result** → `message` toast (success 3s, error persists w/ ปิด).
- **Blocking problem** (insufficient stock, no BOM) → inline `Alert` (warning/error) at top of the relevant section with the exact Thai reason + the corrective action link.
- **Destructive** (delete PO line, cancel PO) → `Popconfirm`/`Modal` with Thai confirm, ยืนยัน/ยกเลิก.
- Global: role-based menu means users only see what they can do → fewer permission errors.

### Navigation / self-navigation (Pond: users never used ERP)
- Persistent left menu grouped by function, **filtered by role**; active item highlighted.
- Header: breadcrumb (คลิกกลับได้ทุกชั้น) + page title + primary page action on the right.
- Every detail/create page has an explicit **back** affordance; browser-back never loses context silently.
- Home = onboarding: role greeting + "สิ่งที่คุณทำได้" task cards → deep-link into the flow.

---

## 7. Thai status-label map (บังคับใช้ — ห้ามโชว์ enum ดิบ)

Implement as a single `statusLabel(entity, code)` lookup in the wrapper layer; components render the label + badge color.

### PurchaseOrder.status
| enum | ป้ายไทย | badge |
|---|---|---|
| Draft | ร่าง | neutral |
| Confirmed | ยืนยันแล้ว | processing |
| InProduction | กำลังผลิต | processing |
| Shipped | จัดส่งแล้ว | processing |
| Invoiced | วางบิลแล้ว | warning |
| Closed | ปิดงาน | success |
| Cancelled | ยกเลิก | error |

### ProductionOrder.status
| Pending | รอดำเนินการ | neutral |
| Assigned | มอบหมายแล้ว | processing |
| InProgress | กำลังผลิต | processing |
| Completed | ผลิตเสร็จ | success |
| Cancelled | ยกเลิก | error |

### Batch.status
| InProgress | กำลังผลิต | processing |
| Completed | ผลิตเสร็จ | processing |
| QCPending | รอตรวจ QC | warning |
| QCApproved | QC ผ่าน | success |
| QCRejected | QC ไม่ผ่าน | error |
| ReadyToShip | พร้อมจัดส่ง | processing |
| Shipped | จัดส่งแล้ว | success |

### Lot.incoming_qc_status
| Pending | รอตรวจสอบ | warning |
| Passed | ผ่าน · พร้อมใช้ผลิต | success |
| Failed | ไม่ผ่าน | error |

### QCInspection.result
| Approved | ผ่าน | success |
| Rejected | ไม่ผ่าน | error |

### Shipment.status
| Draft | ร่าง | neutral |
| Shipped | จัดส่งแล้ว | processing |
| Delivered | ส่งถึงแล้ว | success |

### Invoice.status
| Issued | รอชำระ | warning |
| PartiallyPaid | ชำระบางส่วน | warning |
| Paid | ชำระครบแล้ว | success |
| Superseded | ถูกแทนที่ (ยกเลิกใช้) | neutral |

### Customer.status / User.status
| Active | ใช้งาน | success |
| Inactive | ปิดใช้งาน | neutral |

### Concept labels (Pond asked "Batch เอาไว้ทำอะไร")
- **Lot** = "ล็อตวัตถุดิบ (ต้นทาง)" — วัตถุดิบที่รับเข้าคลังแต่ละครั้ง มีเลข Lot จากผู้ขาย.
- **Batch** = "แบตช์การผลิต (ปลายทาง)" — สินค้าสำเร็จรูป 1 รอบการผลิต ผูกว่ามาจาก Lot ใดบ้าง.
- แสดง legend นี้ในหน้า trace เสมอ.

### Number/ID formats (แสดงคู่กับ label เสมอ — ไม่ใช่ id ดิบ)
`CUS-NNNNNNNN` ลูกค้า · `USR-NNNNNNNN` ผู้ใช้ · `PO-YYYYMM-NNNNNN` · `B-YYYYMMDD-NNNNN` แบตช์ ·
`SH-YYYYMMDD-NNNNN` จัดส่ง · `INV-YYYY-NNNNNN` (คงที่ทั้ง chain, +version) · Lot = free text จากผู้ขาย.

---

## 8. Iconography

- Library: **@ant-design/icons** only (no external icon fonts → stays inside antd).
- Menu icons (1 ต่อ 1 module): Home `HomeOutlined`, Customers `TeamOutlined`, PO `FileTextOutlined`,
  Stock `DatabaseOutlined`, BOM `ApartmentOutlined`, Production `ToolOutlined`, QC `SafetyCertificateOutlined`,
  Shipping `CarOutlined`, Invoice `AccountBookOutlined`, Trace `NodeIndexOutlined`, Admin `SettingOutlined`,
  Dashboard `DashboardOutlined`.
- Semantic: success `CheckCircleFilled`, warning `WarningFilled`, error `CloseCircleFilled`, info `InfoCircleFilled`.
- Size 16px inline / 20px in headers / 40px in empty states. Always paired with a Thai text label (never icon-only navigation).

---

## 9. Print stylesheet — Thai Tax Invoice (ใบแจ้งหนี้/ใบกำกับภาษี)

Rendered from `InvoiceDocument` component; `@media print` rules:
- **Page**: A4 portrait, margin 12mm; hide app shell (Sider/Header/menu) — print only the document.
- **Typography**: body 12px, table 12px tabular-nums, title 16px bold; black on white; no background colors except thin table borders `#000` 0.5pt.
- **Structure (ตามตัวอย่างปอนด์)**:
  1. Header band: doc title "ใบแจ้งหนี้ / ใบกำกับภาษี (Invoice / Tax Invoice)" + LOGO box (from CompanyProfile) + "ต้นฉบับ/สำเนา".
  2. ผู้ออก (CompanyProfile): ชื่อบริษัท, ที่อยู่เต็ม, เลขผู้เสียภาษี 13 หลัก, โทร.
  3. ลูกค้า (snapshot): ชื่อ, ที่อยู่จดทะเบียน, เลขผู้เสียภาษี, โทร.
  4. Meta: เลขที่เอกสาร (`INV-YYYY-NNNNNN` + version), วันที่ dd/mm/yyyy, เงื่อนไขชำระ/เครดิต (เช่น 30 วัน).
  5. Line table: ลำดับ | รายการ | จำนวน | หน่วยละ | จำนวนเงิน (numeric right, tabular).
  6. Totals block (right): รวมเป็นเงิน → หักส่วนลด → หลังหักส่วนลด → ภาษีมูลค่าเพิ่ม 7% → **จำนวนเงินทั้งสิ้น** (bold).
  7. **จำนวนเงินเป็นตัวอักษร** (Thai baht text) full-width bordered row.
  8. Footer: หมายเหตุ/เงื่อนไข + 2 signature boxes ("ผู้รับใบแจ้งหนี้" / "ผู้ออกใบแจ้งหนี้") with (........) name line + วันที่ + ตรายาง area.
- **`Superseded` version** → watermark "ยกเลิก / ถูกแทนที่" diagonal grey; still printable for audit.
- Page-break: `table { break-inside: auto }`, totals block `break-inside: avoid`, signatures `break-inside: avoid`.

---

## 10. Wrapper components to add (spec for Engineer, stays inside antd)

Only if not already present in `src/frontend/ui/`:
- `<StatusTag entity code />` — maps enum→Thai label+badge color (§7). Single source of truth.
- `<PageHeader title breadcrumb actions onBack />` — standard page top (title + breadcrumb + right actions).
- `<FormFooterBar onCancel onSubmit submitting />` — sticky ยกเลิก/บันทึก bar.
- `<EmptyState icon title description cta />` — standard empty pattern with corrective CTA.
- `<MoneyText value />` — tabular-nums, 2-decimal, `฿`/บาท, thousand separators.
- `<SearchToolbar />` — list toolbar (title+count / search / filters / primary action).
These wrap antd `Tag/Breadcrumb/Button/Empty/Statistic/Input.Search` — no new UI library.

---

## 11. Scope this round vs backlog

**This round (maps to ECP stories):** all core pages restyled to this system (ECP-043 consistency, ECP-044 responsive desktop+tablet); Thai status labels everywhere (ECP-004/006/etc.); readable PO lines (ECP-004); BOM UI (ECP-039); production auto-calc layout (ECP-013); QC incoming (ECP-017); customer tax fields (ECP-001); invoice detail (ECP-040) + Thai tax-invoice print (ECP-041/042); trace single-search + Lot/Batch legend (ECP-014); stock search + goods receipt (ECP-007/008); dashboards per role (ECP-027–033); onboarding home (ECP-034/035).

**Backlog (polish / not this round):** dark mode; per-user theme; animated transitions; CSV/print of every list; advanced dashboard charting; RTL. Tagged "polish" in page specs.

---

# ADDENDUM — Round 2 (Gate 1 rework, 2026-07-08)

Theme A (Clean Clinical teal) approved. This addendum extends the system for the Gate-1-round-2
requirements in `pond-gate1-feedback.md` + `status-journeys.md` + `brief.md §2.1`. Nothing above is rewritten.

## R2.1 Product identity — ESSENCE Hub System

- **System name** "ESSENCE Hub System" appears on: login, app header brand, and `<title>` of every page.
- **Logo / app mark (placeholder, inline SVG — no external file):** teal rounded-square (gradient `#10322F→#0E7C7B`),
  white essence droplet + wordmark "ESSENCE / Hub System" beside it. Mark alone = favicon/app icon.
  - Favicon delivered as inline SVG data-URI `<link rel="icon">` (Engineer: ship `public/favicon.svg` + PNG fallbacks 32/180).
  - SVG source of truth: any mockup `<head>` + sidebar `.brand`.

## R2.2 Minimize-clicks rules (brief §2.1 / BKV-1)

- **Click budget:** open PO ≤ 10 clicks, issue invoice ≤ 6 clicks [DEFAULT — awaiting Pond number].
- Single-page forms (no forced wizard); **inline status change + comment** (Popover from the status badge, never a new page).
- **Smart defaults filled, user only reviews:** price from BOM sell-price, lot FIFO, supplier from lot, VAT from VATConfig, low-stock threshold suggested.
- Global command/search in header (jump to PO/customer/lot/invoice) — reduces navigation hops.

## R2.3 Responsive — Must, every page (3 tiers)

| Range | Layout |
|---|---|
| **Desktop ≥992** | Sider 240 visible; multi-column grids; tables full. |
| **Tablet 576–991** | Sider → hamburger drawer; `grid2/grid3/split → 1–2 col stacked`; tables scroll inside `.tblwrap`; sticky primary action. |
| **Mobile <576** | Everything 1 col; stat grid 1 col; **top hamburger + bottom tab-bar** for the 4 primary role actions; tables wrap in horizontal-scroll or collapse to stacked "record cards"; page title truncates; footerbar buttons full-width stacked. |

- Implement with antd `Grid`/`useBreakpoint` + CSS media queries in the wrapper layout. Mockups use real CSS media queries; `responsive.html` shows a side-by-side device demo.

## R2.4 New status-label maps (Thai — extend §7, humanized, never raw enum)

### Customer lifecycle
| enum | ป้ายไทย | badge |
|---|---|---|
| Lead | ผู้สนใจ (ข้อมูลยังไม่ครบ) | neutral |
| Active | ลูกค้าประจำ | success |
| Inactive | ห่างหาย | warning |
| Disabled | ปิดใช้งาน | neutral |
| Blacklist | บัญชีดำ | error |

*Active/Inactive computed by scheduler from per-customer "regular" window (1/3/6/8 เดือน, default 3) — badge tooltip explains why.*

### PO — Fulfilment track
| Draft | ร่าง | neutral |
| AwaitingMaterials | รอวัตถุดิบ | warning |
| Confirmed | ยืนยันแล้ว | processing |
| InProduction | กำลังผลิต | processing |
| ReadyToDeliver | พร้อมจัดส่ง | processing |
| InDelivery | กำลังจัดส่ง | processing |
| Delivered | ส่งถึงแล้ว | success |
| Cancelled | ยกเลิก | error |

### PO — Billing track (shown alongside fulfilment)
| NotInvoiced | ยังไม่วางบิล | neutral |
| Invoiced | วางบิลแล้ว | processing |
| Paid | ชำระแล้ว | success |
| Overdue | เกินกำหนดชำระ (+N วัน) | error |

### Production
| Received | รับงานแล้ว | neutral |
| InProgress | กำลังผลิต | processing |
| Hold | พักงาน | warning |
| ReadyToDelivery | พร้อมส่งมอบ | processing |
| Delivered | ส่งมอบแล้ว | success |
| *(overlay)* PotentialDelay | เสี่ยงล่าช้า | error (badge overlay, not a state) |

### Delivery Note / Shipping
| Received | รับจากฝ่ายผลิต | neutral |
| InRoute | กำลังนำส่ง | processing |
| Delivered | ส่งถึงแล้ว | success |
| Rejected | ถูกปฏิเสธ | error |
| Postponed | เลื่อนส่ง | warning |
| PartiallyDelivered | ส่งบางส่วน | warning |

### Purchase Request
| Open | เปิดคำขอ | warning |
| Acknowledged | รับทราบแล้ว | processing |
| Fulfilled | ของเข้าครบ | success |
| Closed | ปิดคำขอ | neutral |
| Cancelled | ยกเลิก | error |

### Return
| Draft | ร่าง | neutral |
| Returned | คืนแล้ว (ตัดสต็อก) | processing |
| Closed | ปิดรายการ | success |

## R2.5 New wrapper components (spec for Engineer — all wrap antd)

- `<StatusFlowBar steps current />` — horizontal lifecycle bar (done/current/upcoming), wraps antd `Steps`. On PO/Production/Shipping/PR detail. Mobile → vertical.
- `<TraceTimeline entries />` — vertical audit log: actor · from→to · timestamp · reason/comment. wraps `Timeline`. Every status change appends one; read-only, always on detail pages.
- `<StatusChanger badge options onChange requireComment notifyTargets />` — inline change: click badge → Popover with next-status options + comment box (mandatory where flagged) + optional cross-notify target. wraps `Popover+Select+Input`. Core of minimize-clicks.
- `<CrossNotifyBadge to reason />` — "แจ้ง Sale/Stock" chip with arrow; wraps `Tag`.
- `<ContactList value onAdd />` — repeatable customer-contact rows (name/role/phone/email, primary flag), unlimited. wraps `List+Form.List`.
- `<NoteTimeline entries onAdd />` — customer note/comment feed with author+time. wraps `Timeline+Input`.
- `<RucdaMatrix modules value />` — Settings grid: menu-module rows × R/U/C/D/A checkbox columns + capability-flags section. wraps `Table+Checkbox`.
- `<FileUploadRow />` — supplier receipt/document upload. wraps `Upload`.
- `<OverdueBadge days />` — red pill "เกินกำหนด +N วัน". wraps `Tag`.
- `<DeptDashboardSwitcher roles active />` — chips to switch department dashboard for multi-role users. wraps `Segmented`.

## R2.6 Cross-module continuity in UI (status-journeys §8 — 14 rows)

Every status change affecting another module is **visible on both ends** + leaves a trace entry:
origin page shows a `CrossNotifyBadge`/alert; destination page shows the incoming item with a back-link; both share the trace ref id.
Mockups covering the 14 rows: `po-create` (C3 PR), `purchase-request` (C3/C4), `po-detail` (C5 tracks), `production` (C6 Hold notify, C7 delay, C8 ready→shipping), `delivery-note` (C9/C10 reconcile), `invoices`/`invoice-detail` (C11 overdue), `qc`/`supplier` (C12 receipt→lot), `return` (C13 stock adjust), `customer-detail` (C1/C2/C14 lifecycle+reassign).

## R2.7 New roles / permission model

- New roles: **Sale Manager** (reassign customer, team dashboard, unblock Disabled), **Super User** (archive trace, all-module trace) + 7 seed roles.
- Settings uses **RUCDA per left-menu module** (Read/Update/Create/Delete/Approve) + **capability layer** for cross-RUCDA powers. Unlimited roles; users nested under a role.

## R2.8 Scope split — Round 2

**This round (all mocked):** identity/logo/favicon; responsive desktop+tablet+mobile every page; Home dedupe;
7 department dashboards + switcher; customer 5-status + contacts + notes + sale assignment + PO history/search;
PO summary+create(suggest/material-check/PR/sell-raw/editable-price)+2-track detail; stock add-material/UOM/threshold/dual-price/receipt;
BOM builder; production sort/search/delay/5-status/cross-notify/trace; QC+Supplier+Return; shipping+multi-PO delivery note;
invoice overdue+PO-stage+Thai tax print; trace all-module+archive; settings RUCDA+roles+company profile; Purchase Request.

**Backlog (polish):** dark mode, dashboard charting library, offline, i18n beyond Thai, drag-drop BOM ordering, bulk CSV. Tagged "polish".

---

# ADDENDUM — Round 3 (Gate 1 r2 rework + PO review, 2026-07-08)

Incremental only — design system/theme locked. Adds flows from `pond-gate1-r2-feedback.md` (13 หมวด),
`po-mockup-review.md` (P0/P1/P2), and Pond's 5 answers. New/changed component specs for Engineer:

## R3.1 Notification / Inbox (new wrapper `<NotificationBell items />`)
- Header bell with unread **badge count**; click → dropdown panel (`.noti-panel`) listing items:
  icon + deep-link title + relative time + per-item **acknowledge** (✓) + "อ่านแล้วทั้งหมด" + footer "ดูกิจกรรมทั้งหมด".
- Recipients = users with **Read** on the destination module. Each item deep-links to the work page
  (production/PR/shipping/invoice/customer detail). Present on every page via the shell. wraps antd `Dropdown+Badge+List`.

## R3.2 Dashboard (all departments)
- `<RefreshBar/>`: manual **รีเฟรช** button + last-updated timestamp + **auto-refresh 15s (default on)** toggle.
  Auto-refresh **preserves current view** (selected department + open drill panel never reset). wraps antd `Switch+Button`.
- **Every KPI tile is a `<DrillTile/>`** (clickable, shows "ดูรายการ ›"): click → drill-down **list + pagination**;
  each row deep-links into its module with context. One real path mocked per department; Sale has 5th tile **"ต้องติดตาม"**.

## R3.3 Status-flow changes (StatusFlowBar / StatusChanger)
- **Production** flow = รับงาน → กำลังผลิต → **QC** → พร้อมส่งมอบ (จบที่นี่; "ส่งมอบแล้ว/ส่งถึง" = shipping only).
  Changer adds: **QC**, **QC ไม่ผ่าน → กลับกำลังผลิต + feedback (mandatory)**, **Hold → raise Sale + ปุ่ม "แก้ไข PO"**.
- **Customer** = **6 real statuses**: Lead/Active/Inactive/**Follow-up "ต้องติดตาม"**/Disabled/Blacklist (Follow-up มี comment บังคับ; tile บน Sale Dashboard).
- **PO**: **Cancel any stage** (mandatory comment) + **Cancelled→Draft reopen keeping same PO number** + **แก้ไข PO** (Hold: Sale edits qty/product/price/date, every field traced). No "รอวัตถุดิบ" state (material shortage = warning only).
- **Shipping/Delivery Note**: **1 DN = 1 order** (print per order for signature) grouped under a **Shipment "รอบจัดส่ง" (`SHP-YYYYMMDD-NNNN`)** that bundles many DNs; status reconciles at both shipment and DN level; Reject→order back to พร้อมจัดส่ง + raise Sale; Postpone→flag(+date) stays in queue.
- **Purchase Request**: create directly from PR page OR auto from PO; **Fulfilled auto from Goods Receipt** (ref PR → auto-close, records lot). Acknowledge/Close manual.
- **BOM cost** = **max buy-price among ACTIVE suppliers**, **snapshotted at save**; `<StaleCostBadge/>` "ราคาทุนอาจล้าสมัย" when live max differs.

## R3.4 New page + Settings
- **`goods-receipt.html`** (new, full screen): supplier→auto Lot, qty, buy-price (0 allowed), supplier receipt no, file upload, **PR reference search → auto-close PR** (C4/C12).
- **Supplier**: no receipt form (moved to Goods Receipt); **Active/Inactive** toggle + **price matrix** (buy price per supplier×material) + material search to link.
- **Settings = 5 real tab screens** (JS-switched): Role&perm (RUCDAA 6-col + create role) / Users (+create user) / VAT + **effective date** + rate history / Company profile / Audit log. All lists have pagination.

## R3.5 Trace
- Add **entity selector** (customer/PO/material-Lot/PR/supplier/BOM/production/shipping), **date-range + time** filter, and a **field-level audit table** (time · actor · entity · field · from→to) + pagination — alongside Lot→Batch genealogy.

## R3.6 Common
- All list pages carry `<Pager/>` (wraps antd `Pagination`); empty/loading/error states per §6. Prices accept **0**.
- `<Switch/>` styling for toggles (auto-refresh, supplier active). All interactive mockups verified via Playwright (notification open, dashboard drill-down, tab switches).

---

# ADDENDUM — Round 4 (Gate 1 r3 rework + PO §8 + Pond Batch/rework answers, 2026-07-08)

Incremental only — theme/design system locked. Adds the r3 feedback items, PO `po-mockup-review.md §8`,
and Pond's finalized answers (Batch format, rework loop, GR partial, BOM block). New/changed specs for Engineer:

## R4.1 Label de-duplication (every page)
- **Rule:** each page shows **breadcrumb (navigation trail) + exactly ONE prominent heading (`h1` in content)**.
  The old app-shell **header `.title`** (a second heading duplicating the crumb terminal + `h1`) is **removed on all pages**
  — this is what caused Pond's "Dashboard appears 3×". The breadcrumb terminal (small, gray) is nav, not a heading, and may repeat the page name.
- Engineer: `<PageHeader>` renders breadcrumb + page `h1` only; do not render a separate sticky-header title label.

## R4.2 Batch identity + rework loop (production / QC / PO / trace)
- **Batch number format (Pond, final): `B-{PO}-{line}-{run}`** e.g. `B-PO-202607-000181-2-1` (PO, line #2, production run #1).
  Rework = next run → `…-2-2`. Use this exact format in ALL test data & UI (production, QC, po-detail, trace).
- **Batch created when** production presses "เริ่มผลิต" (Received→InProgress); **1 line item = 1 Batch (per run)**; binds PO + line + material Lots (FIFO).
- **QC decides per line/Batch only (on QC page).** Production status changer options = **เริ่มผลิต / ส่งตรวจ QC / พักงาน** — **no "QC ไม่ผ่าน"**.
- **Rework visibility (must be unambiguous):**
  - Production list/detail: rejected line shows a **`Rework` badge** (`b-error` badge, `#FFF7F7` row tint) + new run Batch no. + **QC feedback inline next to that line**; other lines proceed normally. "ผลิตซ้ำ" gen next run.
  - QC queue: rework Batch returns with **previous-run history** ("run 1 (…-2-1) ไม่ผ่าน: <reason>").
  - PO detail: **per-line table → latest Batch + QC status**, with reconcile line "PO พร้อมจัดส่ง เมื่อทุก line ผ่าน QC — ตอนนี้ผ่าน x/N".
- New wrapper: `<ReworkBadge run reason />` (wraps `Tag`); `<BatchChip no />` (wraps `Tag` pill, ellipsizes as `B-…-{line}-{run}`).

## R4.3 Searchable dropdowns (everywhere) — mockup pattern
- All "select" pickers are **searchable** (antd `Select showSearch` / `AutoComplete`). Applies to: supplier, material, customer, PO, Sale, driver, route, PR.
- **Mockup representation** = a `.searchbox` (left 🔍 icon) wrapping an input with the chosen value + placeholder "ค้น/เลือก…". Engineer implements as antd `Select showSearch optionFilterProp="label"`.

## R4.4 Goods Receipt — multi-line (header + lines)
- **Header (1 supplier / 1 receipt):** supplier (searchable) · supplier-receipt-no · date · file upload. Supplier drives Lot prefix for all lines.
- **Lines table (repeatable rows):** material (searchable) × qty+unit × buy-price (0 ok) × **Lot auto-gen per line** (pill) × **PR ref per line** (searchable) × remove. "+ เพิ่มรายการวัตถุดิบ".
- **1 GR → many PR** (lines reference different PRs); **1 PR ← many GR** (partial accumulation). On full receipt → PR "ของเข้าครบ" auto.
- **Partial receipt (Pond):** if received < PR qty → PR "รับบางส่วน" **and open a confirm dialog "สร้าง PR ใหม่สำหรับของที่ขาด?"** for user review (never silent). New wrapper `<GRLineTable/>` (wraps `Form.List + Table`).

## R4.5 Dashboard date filter + per-tile caption
- **Preset chips on top:** วันนี้ / สัปดาห์นี้ / **เดือนนี้ (default)** / กำหนดเอง (date-range, free month/year/range). Affects **all tiles**; view + open drill preserved on refresh.
- **Every tile carries a caption** (`.stat .cap`, 11px, dashed top border) stating what the number means for the range, tagged:
  - `<span class="evtag">ในช่วง</span>` = **event/flow** counted within range (PO created, invoices due, became Inactive, Follow-up set, QC passed, delivered).
  - `<span class="nowtag">ตอนนี้</span>` = **state/snapshot** now, range-independent (queues, low-stock, open PR, users/roles).
  - Activity-state (ลูกค้าประจำ = has order in range) uses `ในช่วง`.
- New wrapper `<RangeFilter presets default="month" onChange />` (wraps `Segmented + RangePicker`); `<TileCaption text kind="event|now" />`.

## R4.6 Shipment round — 2-way create + round fields
- **Two creation paths (both real):** ① select "พร้อมจัดส่ง" PO(s) from queue then create round; ② create empty round then **search-add PO** later. Toggle chips switch the guidance; PO search by PO id or customer data.
- **Round (Shipment) fields:** **คนขับ (searchable) · เบอร์คนขับ · Route (searchable) · ประเภทรถ (Select: รถกระบะ / รถเก๋ง / Motorcycle / รถ 10 ล้อ — configurable)** · ทะเบียนรถ · วันเวลาออกรอบ. System issues DN 1-per-PO on create.
- **Vehicle-type list** is a config table (Settings). Status labels unchanged (§R2.4 Shipping).

## R4.7 Supplier — full-width edit layout (retire right panel)
- Replaces the cramped 340px right panel with a **full-width stacked page**: list card (top) → **full-width edit/create card** with two titled sections: **ข้อมูลทั่วไป** (grid) + **price matrix** (full-width table: material · buy-price · unit · last-GR price · updated-at · remove).
- **Create vs edit are distinct modes:** "➕ เพิ่ม Supplier" opens an **empty create** (title/sub/save-label all switch, price table empty-state); row "แก้ไข" opens edit. New wrapper `<SupplierForm mode="create|edit" />`.

## R4.8 PO status-change UI (po-detail)
- Dedicated **"เปลี่ยนสถานะ PO"** card: `Select` (ยกเลิก PO / เปิดใหม่ Cancelled→ร่าง คงเลขเดิม / force override statuses) + **mandatory reason** + save→notify+trace.
- Note that fulfilment track is mostly **auto-driven**; manual force = **Admin bit (RUCDAA)** only. Reuses `<StatusChanger>` (§R2.5) in card form + `<TraceTimeline>`.

## R4.9 BOM create (real, full-screen)
- "➕ สร้างสูตรใหม่" → **empty create page** (product info + ingredient table + cost/sell). Ingredient rows show max-active-supplier buy-price + snapshot cost + mandatory sell-price.
- **Pond rule:** component with **no active supplier → BLOCK save until a manual cost is entered** for that row (row tinted `#FFF7F7`, inline override price input, `b-error` "ไม่มี supplier active" badge, blocking `alert-err`). (Supersedes the earlier "0 + badge" default.)

## R4.10 New Thai status/label additions
- **Vehicle type** (`Shipment.vehicle_type`): รถกระบะ / รถเก๋ง / Motorcycle / รถ 10 ล้อ (config; humanized, never raw enum).
- **PurchaseRequest.status** add: `PartiallyReceived` → **"รับบางส่วน"** (warning badge).
- **Batch/QC per-line badges:** `Rework` → "Rework" (error). Reconcile helper text "ผ่าน x/N line".

## R4.11 Scope split — Round 4
**This round (all mocked + Playwright-verified desktop/tablet/mobile):** label de-dup all pages; batch format + rework loop (production/QC/po-detail); QC per-line decision; GR multi-line + partial-PR dialog; dashboard date-filter + captions; shipment 2-way create + round fields; supplier full-width layout + real add; PO status-change UI; real create pages (customer/contact/supplier/PR/BOM/round); searchable dropdowns everywhere; realistic linked test data.
**Backlog (polish):** phone-width 5-tile dashboard density (tile caption/drill-affordance overlap when 5 Sale tiles are forced at tablet width — collapse to 2–3 cols); config UIs for vehicle-type & route master lists; dark mode; charting. Tagged "polish".
