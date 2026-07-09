# ADR-006: Storage Abstraction (uploads + trace archive) — GCS-ready

- **Status**: Accepted
- **Date**: 2026-07-09
- **Deciders**: Tech-Lead
- **Scope**: All binary/file I/O in `erp-v2-ui-first`

## สรุป (สำหรับผู้อ่านที่ไม่ใช่ engineer)
ระบบมีการเก็บ "ไฟล์" อยู่ 2 จุด: (1) เอกสารใบรับจาก supplier ที่ upload ตอนรับของ และ
(2) ไฟล์ text ที่ Super User กด archive ประวัติ trace. เราจะ **ไม่ผูกโค้ดกับฮาร์ดดิสก์ของเครื่อง
โดยตรง** แต่เขียนผ่าน "ตัวกลางเก็บไฟล์" ตัวเดียว — ตอนรันบน PC (เฟส 2) เก็บลงโฟลเดอร์ในเครื่อง,
ตอนย้ายขึ้น GCP (เฟส 3) เปลี่ยนไปเก็บบน Google Cloud Storage ได้โดย **ไม่ต้องแก้โค้ดส่วนงาน**
เลย. นี่คือเงื่อนไขที่ทำให้เส้นทาง "เริ่มที่ PC แล้วค่อยขึ้น cloud" ไม่ถูกปิด.

## Context

Two file needs exist: supplier receipt-document uploads (`goods-receipt.html`) and Super-User
trace archive text files (ADR-003). The charter mandates Phase 2 on a local PC, Phase 3 on GCP —
no design may close off that path. Binaries must **not** live in MySQL, and code must not bind to
`fs`/local paths directly.

## Decision

- Define a single `StorageService` interface: `put(key, bytes, meta)`, `get(key)`,
  `getSignedUrl(key, ttl)`, `delete(key)` (soft — see below), `list(prefix)`.
- **Phase 2 driver**: `LocalDiskStorage` writes under a configured `STORAGE_ROOT` on the PC.
- **Phase 3 driver**: `GcsStorage` writes to a GCS bucket. Selected by env (`STORAGE_DRIVER`); no
  business code changes.
- DB stores only **metadata** (`file_asset`: id, `key`, `filename`, `mime`, `size`, `sha256`,
  `uploaded_by`, `at`, `entity_ref`). Downloads go through short-lived signed URLs (local driver
  serves via an authenticated route).
- Trace archive export (ADR-003) writes a text file via the same interface and records a
  `file_asset` row; the archive action is audited.
- Files are **never hard-deleted** while referenced; deletion follows the soft-delete policy
  (ADR-009) at the metadata level.

## Alternatives considered

- **BLOBs in MySQL**: rejected — bloats DB/backups, slow, poor for large PDFs/images.
- **Direct `fs` calls in services**: rejected — binds to local disk, breaks the GCP path.
- **S3 SDK targeting a local MinIO**: viable but adds an extra service to run locally; a plain
  disk driver is simpler for Phase 2 and the interface still lifts to GCS.

## Consequences

- Phase 2 → Phase 3 migration for files = swap driver + copy bucket; zero business-code change.
- Backups: Phase 2 must include `STORAGE_ROOT` in the backup job; Phase 3 uses GCS durability +
  Cloud SQL backup (Pond NFR).
- Signed-URL downloads keep RBAC intact (no public file URLs).
