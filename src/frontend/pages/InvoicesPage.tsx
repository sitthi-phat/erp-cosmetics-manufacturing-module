import { useState } from "react";
import { Card, DataTable, Button, Modal, Form, NumberField, DateField, TextField, SubmitButton, StatusTag, Notify } from "../ui";
import { useInvoices, useInvoiceVersions, useRecordPayment, useReviseInvoice } from "../hooks/useInvoices";
import { useProducts } from "../hooks/useProducts";
import { ApiError } from "../lib/apiClient";

export function InvoicesPage() {
  const { data: invoices, isLoading } = useInvoices();
  const { data: products } = useProducts();
  const recordPayment = useRecordPayment();
  const reviseInvoice = useReviseInvoice();
  const [payTarget, setPayTarget] = useState<{ id: number; invoiceNo: string } | null>(null);
  const [versionsTarget, setVersionsTarget] = useState<number | null>(null);
  const [reviseTarget, setReviseTarget] = useState<number | null>(null);
  const [reviseLines, setReviseLines] = useState<Array<{ productId: number; description: string; quantity: number; unitPrice: number }>>([]);
  const { data: versions } = useInvoiceVersions(versionsTarget);

  async function handlePay(values: Record<string, unknown>) {
    if (!payTarget) return;
    try {
      const result: any = await recordPayment.mutateAsync({
        invoiceId: payTarget.id,
        amount: Number(values.amount),
        paymentDate: String(values.paymentDate),
        method: String(values.method)
      });
      Notify.success(`บันทึกรับชำระสำเร็จ - สถานะ ${result.data.status}, คงค้าง ${result.data.outstanding}`);
      setPayTarget(null);
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  function addReviseLine(values: Record<string, unknown>) {
    setReviseLines((prev) => [
      ...prev,
      {
        productId: Number(values.productId),
        description: String(values.description),
        quantity: Number(values.quantity),
        unitPrice: Number(values.unitPrice)
      }
    ]);
  }

  async function submitRevise() {
    if (reviseTarget === null) return;
    try {
      const result = await reviseInvoice.mutateAsync({ invoiceId: reviseTarget, lines: reviseLines });
      result.warnings.forEach((w) => Notify.warning(w));
      Notify.success("แก้ไข invoice สำเร็จ (สร้าง version ใหม่)");
      setReviseTarget(null);
      setReviseLines([]);
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  return (
    <Card title="Invoice / การเรียกเก็บเงิน">
      <DataTable
        loading={isLoading}
        rows={invoices ?? []}
        rowKey={(i: any) => i.id}
        columns={[
          { key: "invoiceNo", title: "เลขที่ invoice", render: (i: any) => `${i.invoiceNo} (v${i.version})` },
          { key: "total", title: "ยอดรวม (บาท)", render: (i: any) => Number(i.totalAmount).toFixed(2) },
          { key: "status", title: "สถานะ", render: (i: any) => <StatusTag status={i.status} /> },
          {
            key: "actions",
            title: "",
            render: (i: any) => (
              <>
                <Button onClick={() => setPayTarget({ id: i.id, invoiceNo: i.invoiceNo })}>รับชำระเงิน</Button>{" "}
                <Button onClick={() => setVersionsTarget(i.poId)}>ดู versions</Button>{" "}
                <Button onClick={() => setReviseTarget(i.id)}>แก้ไข (revise)</Button>
              </>
            )
          }
        ]}
      />

      <Modal open={payTarget !== null} title={`รับชำระเงิน - ${payTarget?.invoiceNo}`} onCancel={() => setPayTarget(null)}>
        <Form onSubmit={handlePay}>
          <NumberField name="amount" label="จำนวนเงิน" required min={0.01} />
          <DateField name="paymentDate" label="วันที่รับเงิน" required />
          <TextField name="method" label="ช่องทางชำระเงิน" required placeholder="bank_transfer / cash" />
          <SubmitButton loading={recordPayment.isPending}>บันทึก</SubmitButton>
        </Form>
      </Modal>

      <Modal open={versionsTarget !== null} title="ประวัติ version ของ invoice" onCancel={() => setVersionsTarget(null)}>
        <ul>
          {(versions ?? []).map((v: any) => (
            <li key={v.id}>
              v{v.version} - {Number(v.totalAmount).toFixed(2)} บาท - {v.status}
              {v.supersededLabel ? ` (${v.supersededLabel})` : ""}
            </li>
          ))}
        </ul>
      </Modal>

      <Modal
        open={reviseTarget !== null}
        title="แก้ไข invoice (สร้าง version ใหม่)"
        onCancel={() => {
          setReviseTarget(null);
          setReviseLines([]);
        }}
        onOk={submitRevise}
        confirmLoading={reviseInvoice.isPending}
      >
        <Form onSubmit={addReviseLine}>
          <select name="productId" style={{ marginBottom: 8, width: "100%" }} onChange={() => undefined}>
            {(products ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <TextField name="description" label="รายละเอียด" required />
          <NumberField name="quantity" label="จำนวน" required min={0.001} />
          <NumberField name="unitPrice" label="ราคาต่อหน่วย" required min={0} />
          <SubmitButton>+ เพิ่มรายการ</SubmitButton>
        </Form>
        <ul>
          {reviseLines.map((l, i) => (
            <li key={i}>
              {l.description} x {l.quantity} @ {l.unitPrice}
            </li>
          ))}
        </ul>
      </Modal>
    </Card>
  );
}
