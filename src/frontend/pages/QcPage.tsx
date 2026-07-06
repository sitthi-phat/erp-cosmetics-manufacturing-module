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
        columns={[
          { key: "batchNumber", title: "เลข Batch", dataIndex: "batchNumber" },
          { key: "status", title: "สถานะ", render: (b: any) => <StatusTag status={b.status} /> },
          {
            key: "actions",
            title: "",
            render: (b: any) =>
              b.status === "QCPending" ? <Button onClick={() => setTarget(b.id)}>บันทึกผลตรวจ</Button> : null
          }
        ]}
      />
      <Modal open={target !== null} title="บันทึกผลตรวจสอบคุณภาพ" onCancel={() => setTarget(null)}>
        <Form onSubmit={handleInspect}>
          <SelectField
            name="result"
            label="ผลตรวจ"
            required
            options={[
              { value: "Approved", label: "ผ่าน (Approved)" },
              { value: "Rejected", label: "ไม่ผ่าน (Rejected)" }
            ]}
          />
          <TextField name="remarks" label="หมายเหตุ" />
          <SubmitButton loading={inspect.isPending}>บันทึก</SubmitButton>
        </Form>
      </Modal>
      </Card>
    </div>
  );
}
