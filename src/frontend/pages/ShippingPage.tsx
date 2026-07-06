import { useState } from "react";
import { Card, DataTable, Button, Modal, Form, DateField, SubmitButton, StatusTag, Notify } from "../ui";
import { useShipments, useEligibleBatches, useCreateShipment, useUpdateShipmentStatus } from "../hooks/useShipping";
import { ApiError } from "../lib/apiClient";

export function ShippingPage() {
  const { data: shipments, isLoading } = useShipments();
  const { data: eligible } = useEligibleBatches();
  const createShipment = useCreateShipment();
  const updateStatus = useUpdateShipmentStatus();
  const [createTarget, setCreateTarget] = useState<number | null>(null);
  const [deliverTarget, setDeliverTarget] = useState<number | null>(null);

  async function handleCreate(values: Record<string, unknown>) {
    if (createTarget === null) return;
    try {
      await createShipment.mutateAsync({ batchId: createTarget, shippedDate: String(values.shippedDate) });
      Notify.success("สร้างบันทึกการจัดส่งสำเร็จ");
      setCreateTarget(null);
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  async function handleDeliver(values: Record<string, unknown>) {
    if (deliverTarget === null) return;
    try {
      await updateStatus.mutateAsync({ id: deliverTarget, deliveredDate: String(values.deliveredDate) });
      Notify.success("อัปเดตสถานะเป็น Delivered สำเร็จ");
      setDeliverTarget(null);
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  return (
    <Card title="การจัดส่งสินค้า">
      <Card title="Batch ที่พร้อมจัดส่ง (ผ่าน QC แล้ว)">
        <DataTable
          rows={eligible ?? []}
          rowKey={(b: any) => b.id}
          emptyText="ไม่มี Batch ที่พร้อมจัดส่งในขณะนี้"
          getRowTestId={(b: any) => `selectable-batch-${b.batchNumber}`}
          columns={[
            { key: "batchNumber", title: "เลข Batch", dataIndex: "batchNumber" },
            { key: "product", title: "สินค้า", render: (b: any) => b.product?.name },
            {
              key: "actions",
              title: "",
              render: (b: any) => (
                <Button onClick={() => setCreateTarget(b.id)} testId="nav-shipping-create-row">
                  สร้างบันทึกจัดส่ง
                </Button>
              )
            }
          ]}
        />
      </Card>
      <DataTable
        loading={isLoading}
        rows={shipments ?? []}
        rowKey={(s: any) => s.id}
        columns={[
          { key: "shipmentNumber", title: "เลขที่จัดส่ง", dataIndex: "shipmentNumber" },
          { key: "status", title: "สถานะ", render: (s: any) => <StatusTag status={s.status} testId="shipment-status-badge" /> },
          {
            key: "actions",
            title: "",
            render: (s: any) =>
              s.status === "Shipped" ? (
                <Button onClick={() => setDeliverTarget(s.id)}>บันทึกส่งถึงลูกค้า</Button>
              ) : null
          }
        ]}
      />
      <Modal open={createTarget !== null} title="สร้างบันทึกการจัดส่ง" onCancel={() => setCreateTarget(null)}>
        <Form onSubmit={handleCreate}>
          <DateField name="shippedDate" label="วันที่จัดส่ง" required testId="shipment-date" />
          <SubmitButton loading={createShipment.isPending} testId="shipment-submit">
            บันทึก
          </SubmitButton>
        </Form>
      </Modal>
      <Modal open={deliverTarget !== null} title="บันทึกวันที่ส่งถึงลูกค้า" onCancel={() => setDeliverTarget(null)}>
        <Form onSubmit={handleDeliver}>
          <DateField name="deliveredDate" label="วันที่ส่งถึง" required />
          <SubmitButton loading={updateStatus.isPending}>บันทึก</SubmitButton>
        </Form>
      </Modal>
    </Card>
  );
}
