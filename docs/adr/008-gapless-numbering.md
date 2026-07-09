# ADR-008: Gapless Document Numbering (per year / per month)

- **Status**: Accepted
- **Date**: 2026-07-09
- **Deciders**: Tech-Lead (design), Pond (gapless confirmed, NFR 2026-07-08)
- **Scope**: All business document numbers in `erp-v2-ui-first`

## สรุป (สำหรับผู้อ่านที่ไม่ใช่ engineer)
เลขเอกสาร (PO, ใบสั่งผลิต PRD, ใบแจ้งหนี้ ฯลฯ) ต้อง **เรียงต่อเนื่องห้ามข้ามเลข** ตามข้อกำหนด
สรรพากร — เช่น 0001, 0002, 0003 ห้ามกระโดดเป็น 0005. เราออกเลขด้วย "ตัวนับ" ที่ล็อกทีละคนตอน
สร้างเอกสาร เพื่อกันเลขชนกันหรือเลขหายเวลาหลายคนสร้างพร้อมกัน. กรณีพิเศษ: **PO ที่ยกเลิกแล้วเปิดใหม่
ใช้เลขเดิม** ไม่ออกเลขใหม่ (ปอนด์กำหนด). เลข Batch ผูกกับ PO/line/รอบผลิต จึงไม่ต้องใช้ตัวนับกลาง.

## Context

Pond: numbers must be **gapless per year/month** (tax compliance). Formats (from
`entity-status-map.md`): `PO-{YYYYMM}-{NNNNNN}`, `PRD-{YYYYMM}-{NNNNNN}`, `INV-{YYYY}-{NNNNNN}`,
`PR-{NNNNNN}`, `GR-{YYYYMMDD}-{NNN}`, `SHP-{YYYYMMDD}-{NNNN}`, `DN-{YYYYMMDD}-{NNNNN}`, Lot
`{supplierPrefix}{YYMM}`, Batch `B-{PO}-{line}-{run}`. Special cases: **PO reopen keeps the same
number** (no new number on Cancelled→Draft); commercial docs are **voided, never deleted**, so
numbers never disappear (ADR-009). Gapless means issuance must be **serialized** — but load is
light (>200 PO/day, ≤50 users).

## Decision

- A `sequence` table: `(name, period_key, current_value, updated_at)` where `name` = doc type and
  `period_key` = the reset scope (`YYYY` or `YYYYMM` or `YYYYMMDD` per format).
- `SequenceService.next(name, periodKey)` runs `SELECT ... FOR UPDATE` on the row (create at 0 if
  absent), increments, and returns the formatted number — **inside the caller's transaction**, so
  a rollback also rolls back the number (no gap) and a commit guarantees contiguity.
- Number issuance happens at the exact lifecycle point defined by the flow:
  - PO number at **Draft create**; PRD number at **Production "รับงาน"** (accept), not at PO
    confirm; Batch number at **"เริ่มผลิต"** (composed from PO/line/run, no central counter);
    Invoice at issue; GR/PR/DN/Shipment at their create events.
- **PO reopen** (Cancelled→Draft) reuses the existing PO number; the reopen is a lifecycle event
  in audit (ADR-003), not a new sequence draw.
- Voided commercial docs keep their number occupied (gapless preserved); a replacement doc draws
  the next number and references the voided one.

## Alternatives considered

- **DB AUTO_INCREMENT / UUID**: rejected — auto-increment leaves gaps on rollback and can't reset
  per month; UUIDs aren't human/tax-friendly.
- **Application-side counter (in-memory / Redis)**: rejected — not durable/transactional with the
  business write; risks gaps or duplicates on crash.
- **Post-hoc renumbering**: rejected — illegal for issued tax documents.

## Consequences

- Contiguous, period-scoped numbers that satisfy tax rules; number and document commit or roll
  back together.
- The `FOR UPDATE` on the sequence row is the one intentional serialization point — negligible at
  this load, and the only lock left after ADR-001 removed the stock-consume lock.
- Reopen-keeps-number and void-not-delete are both representable without breaking contiguity.
