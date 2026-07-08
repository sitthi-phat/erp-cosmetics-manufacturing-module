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

**Backlog (polish / not this round):** full phone (<576) layouts; dark mode; per-user theme; animated transitions; CSV/print of every list; advanced dashboard charting; RTL. Tagged "polish" in page specs.
