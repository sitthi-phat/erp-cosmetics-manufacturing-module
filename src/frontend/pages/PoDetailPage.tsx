import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, Descriptions, Steps, Button, Modal, Form, TextField, NumberField, SubmitButton, Notify, StatusTag } from "../ui";
import { usePO, usePOTimeline, useConfirmPO, useCancelPO } from "../hooks/usePo";
import { useIssueInvoice } from "../hooks/useInvoices";
import { ApiError } from "../lib/apiClient";

const TIMELINE_STEPS = ["Confirmed", "InProduction", "Shipped", "Invoiced", "Closed"];

export function PoDetailPage() {
  const { id } = useParams();
  const poId = id ? Number(id) : null;
  const { data: po, isLoading } = usePO(poId);
  const { data: timeline } = usePOTimeline(poId);
  const confirmPO = useConfirmPO();
  const cancelPO = useCancelPO();
  const issueInvoice = useIssueInvoice();
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceLines, setInvoiceLines] = useState<Array<{ productId: number; description: string; quantity: number; unitPrice: number }>>([]);

  if (isLoading || !po) return <Card title="กำลังโหลด...">{null}</Card>;

  const currentStepIndex = TIMELINE_STEPS.indexOf(po.status);

  async function handleConfirm() {
    try {
      await confirmPO.mutateAsync(po.id);
      Notify.success("stock เพียงพอ - ยืนยัน PO สำเร็จ");
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  async function handleCancel() {
    try {
      await cancelPO.mutateAsync(po.id);
      Notify.success("ยกเลิก PO สำเร็จ");
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  function addInvoiceLine(values: Record<string, unknown>) {
    setInvoiceLines((prev) => [
      ...prev,
      {
        productId: Number((po.lines?.[0] ?? {}).productId ?? 0),
        description: String(values.description),
        quantity: Number(values.quantity),
        unitPrice: Number(values.unitPrice)
      }
    ]);
  }

  async function handleIssueInvoice() {
    try {
      await issueInvoice.mutateAsync({ poId: po.id, lines: invoiceLines });
      Notify.success("ออก invoice สำเร็จ (version 1)");
      setInvoiceModalOpen(false);
      setInvoiceLines([]);
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  return (
    <Card title={`PO ${po.poNumber}`}>
      <Descriptions
        items={[
          { label: "ลูกค้า", value: po.customer?.name },
          { label: "สถานะ", value: po.derivedStatusLabel ?? <StatusTag status={po.status} /> },
          { label: "วันที่ต้องการส่งมอบ", value: new Date(po.requestedDeliveryDate).toLocaleDateString("th-TH") }
        ]}
      />
      <div style={{ margin: "24px 0" }}>
        <Steps
          current={currentStepIndex < 0 ? 0 : currentStepIndex}
          items={TIMELINE_STEPS.map((s) => ({ title: s }))}
        />
      </div>
      {po.status === "Draft" && <Button variant="primary" onClick={handleConfirm}>ยืนยัน PO</Button>}
      {(po.status === "Draft" || po.status === "Confirmed") && (
        <Button variant="danger" onClick={handleCancel}>ยกเลิก PO</Button>
      )}
      {po.status === "Shipped" && (
        <Button variant="primary" onClick={() => setInvoiceModalOpen(true)}>
          ออก invoice
        </Button>
      )}
      <Card title="Timeline">
        <ul>
          {(timeline ?? []).map((e: any) => (
            <li key={e.id}>
              {e.status} - {new Date(e.createdAt).toLocaleString("th-TH")}
            </li>
          ))}
        </ul>
      </Card>

      <Modal
        open={invoiceModalOpen}
        title="ออก invoice (version 1)"
        onCancel={() => setInvoiceModalOpen(false)}
        onOk={handleIssueInvoice}
        confirmLoading={issueInvoice.isPending}
      >
        <Form onSubmit={addInvoiceLine}>
          <TextField name="description" label="รายละเอียดรายการ" required />
          <NumberField name="quantity" label="จำนวน" required min={0.001} />
          <NumberField name="unitPrice" label="ราคาต่อหน่วย" required min={0} />
          <SubmitButton>+ เพิ่มรายการ</SubmitButton>
        </Form>
        <ul>
          {invoiceLines.map((l, i) => (
            <li key={i}>
              {l.description} x {l.quantity} @ {l.unitPrice}
            </li>
          ))}
        </ul>
      </Modal>
    </Card>
  );
}
