import { useState } from "react";
import { Card, DataTable, Button, Modal, Form, SelectField, NumberField, SubmitButton, Notify } from "../ui";
import { useProductionQueue, useAssignedProductionOrders, useAssignProduction, useProduceBatch } from "../hooks/useProduction";
import { useUsers } from "../hooks/useAdmin";
import { useMaterials } from "../hooks/useProducts";
import { ApiError } from "../lib/apiClient";

export function ProductionPage() {
  const { data: queue, isLoading } = useProductionQueue();
  const { data: assignedOrders, isLoading: assignedLoading } = useAssignedProductionOrders();
  const { data: users } = useUsers();
  const { data: materials } = useMaterials();
  const assign = useAssignProduction();
  const produce = useProduceBatch();

  const [assignTarget, setAssignTarget] = useState<number | null>(null);
  const [produceTarget, setProduceTarget] = useState<number | null>(null);
  const [lotSelections, setLotSelections] = useState<Array<{ materialId: number; lotId: number; qtyUsed: number }>>([]);
  const [lastBatchNumber, setLastBatchNumber] = useState<string | null>(null);

  async function handleAssign(values: Record<string, unknown>) {
    if (assignTarget === null) return;
    try {
      await assign.mutateAsync({ poLineId: assignTarget, assignedTo: Number(values.assignedTo) });
      Notify.success("มอบหมายงานผลิตสำเร็จ");
      setAssignTarget(null);
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  function addLotSelection(values: Record<string, unknown>) {
    setLotSelections((prev) => [
      ...prev,
      { materialId: Number(values.materialId), lotId: Number(values.lotId), qtyUsed: Number(values.qtyUsed) }
    ]);
  }

  async function handleProduce(values: Record<string, unknown>) {
    if (produceTarget === null) return;
    if (lotSelections.length === 0) {
      Notify.error("กรุณาระบุ Lot วัตถุดิบที่ใช้ในการผลิตอย่างน้อย 1 Lot ต่อวัตถุดิบแต่ละชนิดตามสูตร");
      return;
    }
    try {
      const result: any = await produce.mutateAsync({
        productionOrderId: produceTarget,
        producedQty: Number(values.producedQty),
        lotSelections
      });
      Notify.success("บันทึกผลิตสำเร็จ - สร้าง Batch แล้ว");
      setLastBatchNumber(result?.data?.batchNumber ?? null);
      setProduceTarget(null);
      setLotSelections([]);
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  return (
    <div>
      {lastBatchNumber && (
        <p>
          สร้าง Batch สำเร็จ: <strong data-testid="batch-number">{lastBatchNumber}</strong>
        </p>
      )}
      <Card title="คิวงานผลิตที่รอ assign (PO Confirmed, เรียงตามวันที่ต้องการส่งมอบ)">
        <DataTable
          loading={isLoading}
          rows={queue ?? []}
          rowKey={(p: any) => p.id}
          emptyText="ไม่มีงานผลิตที่รอดำเนินการในขณะนี้"
          getRowTestId={(p: any) => `queue-row-${p.poNumber}`}
          columns={[
            { key: "poNumber", title: "เลขที่ PO", dataIndex: "poNumber" },
            { key: "customer", title: "ลูกค้า", render: (p: any) => p.customer?.name },
            {
              key: "requestedDeliveryDate",
              title: "วันที่ต้องการส่งมอบ",
              render: (p: any) => new Date(p.requestedDeliveryDate).toLocaleDateString("th-TH")
            },
            {
              key: "actions",
              title: "",
              render: (p: any) => (
                <Button onClick={() => setAssignTarget(p.lines?.[0]?.id)} testId="assign-button">
                  มอบหมายงาน
                </Button>
              )
            }
          ]}
        />
      </Card>

      <Card title="งานที่ assign แล้ว รอบันทึกผลิต (Batch)">
        <DataTable
          loading={assignedLoading}
          rows={assignedOrders ?? []}
          rowKey={(o: any) => o.id}
          emptyText="ยังไม่มีงานที่ assign ให้ผลิต"
          columns={[
            { key: "poNumber", title: "เลขที่ PO", render: (o: any) => o.po?.poNumber },
            { key: "product", title: "สินค้า", render: (o: any) => o.poLine?.product?.name },
            { key: "assignee", title: "ผู้รับผิดชอบ", render: (o: any) => o.assignee?.fullName },
            {
              key: "actions",
              title: "",
              render: (o: any) => (
                <Button onClick={() => setProduceTarget(o.id)} testId="produce-button">
                  บันทึกผลิต
                </Button>
              )
            }
          ]}
        />
      </Card>

      <Modal open={assignTarget !== null} title="มอบหมายงานผลิต" onCancel={() => setAssignTarget(null)}>
        <Form onSubmit={handleAssign}>
          <SelectField
            name="assignedTo"
            label="ผู้ปฏิบัติงาน"
            required
            testId="assign-worker-select"
            options={(users ?? []).map((u: any) => ({ value: u.id, label: u.fullName }))}
          />
          <SubmitButton loading={assign.isPending} testId="assign-confirm">
            มอบหมาย
          </SubmitButton>
        </Form>
      </Modal>

      <Modal
        open={produceTarget !== null}
        title="บันทึกผลการผลิต (สร้าง Batch)"
        onCancel={() => {
          setProduceTarget(null);
          setLotSelections([]);
        }}
      >
        <Card title="เลือก Lot วัตถุดิบที่ใช้">
          <Form onSubmit={addLotSelection}>
            <SelectField
              name="materialId"
              label="วัตถุดิบ"
              required
              testId="produce-lot-select-0"
              options={(materials ?? []).map((m: any) => ({ value: m.id, label: m.name }))}
            />
            <NumberField name="lotId" label="Lot ID" required min={1} />
            <NumberField name="qtyUsed" label="จำนวนที่ใช้" required min={0.001} testId="produce-lot-qty-0" />
            <SubmitButton>+ เพิ่ม Lot</SubmitButton>
          </Form>
          <ul>
            {lotSelections.map((l, i) => (
              <li key={i}>
                material #{l.materialId} - lot #{l.lotId} x {l.qtyUsed}
              </li>
            ))}
          </ul>
        </Card>
        <Form onSubmit={handleProduce}>
          <NumberField name="producedQty" label="จำนวนสินค้าสำเร็จรูปที่ได้" required min={0.001} testId="produce-output-qty" />
          <SubmitButton loading={produce.isPending} testId="produce-submit">
            บันทึกผลิตเสร็จสิ้น
          </SubmitButton>
        </Form>
      </Modal>
    </div>
  );
}
