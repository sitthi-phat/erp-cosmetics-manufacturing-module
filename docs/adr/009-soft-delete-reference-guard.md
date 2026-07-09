# ADR-009: Soft-Delete + Reference-Guard (no hard delete)

- **Status**: Accepted
- **Date**: 2026-07-09
- **Deciders**: Tech-Lead (design), Pond (soft-delete policy, `deletion-policy.md`)
- **Scope**: All master/reference entities in `erp-v2-ui-first`

## สรุป (สำหรับผู้อ่านที่ไม่ใช่ engineer)
ระบบ **ไม่มีการลบข้อมูลถาวร** เลย. "ลบ" = ติดธง "ถูกลบ" (soft delete) — ยัง **ค้นหา/ดูย้อนหลังได้**
(อ่านอย่างเดียว มี badge "ถูกลบ") แต่ **จะหายจากตัวเลือกของงานใหม่** (สร้างเอกสาร/สูตร/ผูกใหม่ไม่ได้)
ส่วน **ของเดิมที่ผูกไว้แล้ววิ่งต่อจนจบได้** เพื่อไม่ให้ประวัติเสีย. ทุกการลบต้องมีเหตุผล (บังคับ
comment) และเก็บ audit. เอกสารการค้า (PO/Invoice/DN/GR/PR/Shipment) **ไม่มีปุ่มลบ** ใช้ "ยกเลิก
(void)" แทน เพื่อคงเลขให้ต่อเนื่องตามสรรพากร. การกู้คืน (undelete) ทำได้เฉพาะสิทธิ์ Admin.

## Context

Pond's `deletion-policy.md`: no permanent delete; "delete" = a `deleted` flag; deleted records
stay searchable (read-only) but must **not** be referenceable by new work and disappear from
new-work dropdowns; existing references keep working; every delete is audited with a **mandatory
reason**; delete = RUCDAA `D` bit, undelete = `Admin` bit; commercial documents have **no
delete**, only void (gapless per ADR-008); blocked deletes must offer an alternative (e.g. use
Disabled/Blacklist, reassign, migrate users first). Covers the 7 entity rules + 5 policy
questions in that file.

## Decision

- Master entities carry `deleted_at`, `deleted_by`, `delete_reason` (soft-delete columns). No row
  is ever physically removed.
- A **soft-delete base repository** applies a default `WHERE deleted_at IS NULL` to all normal
  reads and dropdown/reference queries, so deleted records **auto-disappear from new work**.
  Trace/search endpoints pass an explicit `includeDeleted` flag to still find them (read-only,
  with a "ถูกลบ" badge).
- A **reference-guard**: creating/linking a new document validates that every referenced master
  (customer, material, BOM, supplier, contact, role) is not soft-deleted; otherwise
  `409 REFERENCE_DELETED` with a Thai message and the suggested alternative.
- **Existing references keep working**: already-linked documents (PO snapshotting a BOM, a Lot of
  a deleted material, etc.) run to completion — the guard only blocks *new* links.
- **Commercial documents** (PO, Invoice, DN, GR, PR, Shipment, PRD, Batch): **no delete path** —
  a `void/cancel` status only (ADR-008 keeps the number). PRD/Batch are GMP evidence and are only
  cancelled by cascade from a cancelled PO (with trace), never deleted.
- **Undelete/restore** requires the `Admin` bit; it clears the soft-delete columns and is audited.
- Entity-specific guards from `deletion-policy.md` are enforced at the service layer: customer
  with active PO (existing PO runs, no new PO); user delete requires reassign first; material
  keeps existing Lots usable but blocks new stock/BOM use; role delete blocked while users are
  attached; single primary contact must be replaced first.

## Alternatives considered

- **Hard delete + ON DELETE cascade**: rejected — destroys audit/GMP history and tax records;
  directly against Pond's policy.
- **Archive-to-separate-table on delete**: rejected — complicates search "still find it" and
  cross-entity references; a flag on the same row is simpler and keeps FKs valid.
- **Delete allowed for PR/GR** (policy Q4): default is void-not-delete for gapless consistency;
  kept as a business toggle pending Pond's answer, but the schema (void status) supports either.

## Consequences

- Nothing is ever lost; history, trace, and tax numbering stay intact.
- One base repository + one guard implement the policy for all entities (no per-table work),
  mirroring the generic-audit approach (ADR-003) — mitigates the "field-level everywhere" risk.
- Lists/dropdowns are clean by default; trace still surfaces deleted rows on demand.
- The 7 entity rules and the commercial-doc "void only" rule are all representable; the 5 open
  policy questions change only service-level thresholds, not the schema.
