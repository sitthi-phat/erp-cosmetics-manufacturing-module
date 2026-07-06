import { useState } from "react";
import { Card, DataTable, Button, Modal, Form, TextField, SelectField, SubmitButton, StatusTag, Notify, normalizeSelectValues } from "../ui";
import { useQcBatches, useInspectBatch, useInspectLot, useIncomingLots } from "../hooks/useQc";
import { ApiError } from "../lib/apiClient";

export function QcPage() {
  const { data: batches, isLoading } = useQcBatches();
  const { data: incomingLots, isLoading: incomingLoading } = useIncomingLots();
  const inspect = useInspectBatch();
  const inspectLot = useInspectLot();
  const [target, setTarget] = useState<number | null>(null);
  const [incomingTarget, setIncomingTarget] = useState<number | null>(null);

  async function handleInspect(rawValues: Record<string, unknown>) {
    const values = normalizeSelectValues(rawValues);
    if (target === null) return;
    try {
      await inspect.mutateAsync({ batchId: target, result: values.result as "Approved" | "Rejected", remarks: String(values.remarks ?? "") });
      Notify.success("บันทึกผลตรวจสอบสำเร็จ");
      setTarget(null);
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  // ECP-017 AC1 (E29, root cause: form used to be a raw "Lot ID" NumberField with zero context) -
  // the lot to inspect is now chosen from a real list the system already knows (qty/lot number/
  // supplier all pre-filled), not typed/guessed.
  async function handleInspectLot(rawValues: Record<string, unknown>) {
    const values = normalizeSelectValues(rawValues);
    if (incomingTarget === null) return;
    try {
      await inspectLot.mutateAsync({ lotId: incomingTarget, result: values.result as "Passed" | "Failed" });
      Notify.success("บันทึกผลตรวจสอบวัตถุดิบขาเข้าสำเร็จ");
      setIncomingTarget(null);
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  const incomingLotTarget = (incomingLots ?? []).find((l) => l.id === incomingTarget);

  return (
    <div>
      <Card title="ตรวจสอบวัตถุดิบขาเข้า (Incoming QC, ECP-017)" testId="incoming-qc-card">
        <DataTable
          loading={incomingLoading}
          rows={incomingLots ?? []}
          rowKey={(l: any) => l.id}
          emptyText="ไม่มี Lot ที่รอตรวจสอบขาเข้าในขณะนี้"
          getRowTestId={(l: any) => `incoming-lot-row-${l.lotNumber}`}
          columns={[
            { key: "lotNumber", title: "เลข Lot", dataIndex: "lotNumber" },
            { key: "materialName", title: "วัตถุดิบ", dataIndex: "materialName" },
            { key: "receivedQty", title: "จำนวนที่รับเข้า", render: (l: any) => `${l.receivedQty} ${l.uom}` },
            { key: "supplierName", title: "ผู้จำหน่าย", dataIndex: "supplierName" },
            {
              key: "actions",
              title: "",
              render: (l: any) => (
                <Button onClick={() => setIncomingTarget(l.id)} testId="incoming-inspect-button">
                  บันทึกผลตรวจ
                </Button>
              )
            }
          ]}
        />
        <Modal
          open={incomingTarget !== null}
          title={`บันทึกผลตรวจสอบวัตถุดิบขาเข้า - Lot ${incomingLotTarget?.lotNumber ?? ""}`}
          onCancel={() => setIncomingTarget(null)}
          testId="incoming-inspect-modal"
        >
          {incomingLotTarget && (
            <p>
              วัตถุดิบ: {incomingLotTarget.materialName} · จำนวน: {incomingLotTarget.receivedQty} {incomingLotTarget.uom} · ผู้จำหน่าย:{" "}
              {incomingLotTarget.supplierName}
            </p>
          )}
          <Form onSubmit={handleInspectLot}>
            <SelectField
              name="result"
              label="ผลตรวจ"
              required
              testId="incoming-result-select"
              options={[
                { value: "Passed", label: "ผ่าน (Passed)" },
                { value: "Failed", label: "ไม่ผ่าน (Failed)" }
              ]}
            />
            <SubmitButton loading={inspectLot.isPending} testId="incoming-inspect-submit">
              บันทึกผลตรวจ
            </SubmitButton>
          </Form>
        </Modal>
      </Card>
      <Card title="ตรวจสอบคุณภาพ (QC) - รายการ Batch">
        <DataTable
          loading={isLoading}
          rows={batches ?? []}
          rowKey={(b: any) => b.id}
          emptyText="ไม่มีงานตรวจสอบที่ค้างอยู่ในขณะนี้"
          getRowTestId={(b: any) => `batch-row-${b.batchNumber}`}
          columns={[
            { key: "batchNumber", title: "เลข Batch", dataIndex: "batchNumber" },
            { key: "status", title: "สถานะ", render: (b: any) => <StatusTag status={b.status} testId="status-badge" /> },
            {
              key: "actions",
              title: "",
              render: (b: any) =>
                b.status === "QCPending" ? (
                  <Button onClick={() => setTarget(b.id)} testId="inspect-button">
                    บันทึกผลตรวจ
                  </Button>
                ) : null
            }
          ]}
        />
        <Modal open={target !== null} title="บันทึกผลตรวจสอบคุณภาพ" onCancel={() => setTarget(null)}>
          <Form onSubmit={handleInspect} initialValues={{ result: { value: "Approved", label: "ผ่าน (Approved)" } }}>
            {/*
              QA DEF-03 note: demoFlow.spec.ts assumes two separate radio-style controls
              (`qc-result-approved`/`qc-result-rejected`) it can `.check()`; this is a single
              dropdown instead. `data-testid="qc-result-approved"` is still attached to the
              control itself so a selector update (select-by-value vs check()) should reconcile
              without any UI change on our side.
            */}
            <SelectField
              name="result"
              label="ผลตรวจ"
              required
              testId="qc-result-approved"
              options={[
                { value: "Approved", label: "ผ่าน (Approved)" },
                { value: "Rejected", label: "ไม่ผ่าน (Rejected)" }
              ]}
            />
            <TextField name="remarks" label="หมายเหตุ" testId="qc-remarks" />
            <SubmitButton loading={inspect.isPending} testId="qc-submit">
              บันทึก
            </SubmitButton>
          </Form>
        </Modal>
      </Card>
    </div>
  );
}
