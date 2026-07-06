import { useState } from "react";
import { Card, DataTable, Button, Modal, Form, TextField, NumberField, SelectField, SubmitButton, StatusTag, Notify } from "../ui";
import { useQcBatches, useInspectBatch, useInspectLot } from "../hooks/useQc";
import { ApiError } from "../lib/apiClient";

export function QcPage() {
  const { data: batches, isLoading } = useQcBatches();
  const inspect = useInspectBatch();
  const inspectLot = useInspectLot();
  const [target, setTarget] = useState<number | null>(null);

  async function handleInspect(values: Record<string, unknown>) {
    if (target === null) return;
    try {
      await inspect.mutateAsync({ batchId: target, result: values.result as "Approved" | "Rejected", remarks: String(values.remarks ?? "") });
      Notify.success("บันทึกผลตรวจสอบสำเร็จ");
      setTarget(null);
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  async function handleInspectLot(values: Record<string, unknown>) {
    try {
      await inspectLot.mutateAsync({ lotId: Number(values.lotId), result: values.result as "Passed" | "Failed" });
      Notify.success("บันทึกผลตรวจสอบวัตถุดิบขาเข้าสำเร็จ");
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  return (
    <div>
      <Card title="ตรวจสอบวัตถุดิบขาเข้า (Incoming QC, ECP-017)">
        <Form onSubmit={handleInspectLot}>
          <NumberField name="lotId" label="Lot ID" required min={1} />
          <SelectField
            name="result"
            label="ผลตรวจ"
            required
            options={[
              { value: "Passed", label: "ผ่าน (Passed)" },
              { value: "Failed", label: "ไม่ผ่าน (Failed)" }
            ]}
          />
          <SubmitButton loading={inspectLot.isPending}>บันทึกผลตรวจ</SubmitButton>
        </Form>
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
          <Form onSubmit={handleInspect} initialValues={{ result: "Approved" }}>
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
