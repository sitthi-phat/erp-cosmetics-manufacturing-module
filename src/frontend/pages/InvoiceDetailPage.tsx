import { useParams, useNavigate } from "react-router-dom";
import { Card, DataTable, StatusTag, Button, EmptyState } from "../ui";
import { useInvoiceDetail } from "../hooks/useInvoices";

/**
 * ECP-040 (Gate 2 rework, E30 - root cause fix for "เรียกดูข้อมูลต่างๆ ขึ้นมาไม่ได้"): a
 * dedicated detail page for one invoice - customer, every line item, subtotal/discount/vat/total,
 * status, and payment history, all in one screen. A missing/invalid id shows a clear message
 * instead of a blank page (AC3); RBAC denial shows the standard access-denied message (AC4).
 */
export function InvoiceDetailPage() {
  const { id } = useParams();
  const invoiceId = id ? Number(id) : null;
  const navigate = useNavigate();
  const { data: invoice, isLoading, isError } = useInvoiceDetail(invoiceId);

  if (isLoading) return <Card title="กำลังโหลด...">{null}</Card>;
  if (isError || !invoice) {
    return (
      <Card title="รายละเอียด Invoice" testId="invoice-detail-card">
        <EmptyState description="ไม่พบ invoice นี้ในระบบ" testId="invoice-detail-not-found" />
        <Button onClick={() => navigate("/invoices")}>กลับไปหน้ารายการ invoice</Button>
      </Card>
    );
  }

  return (
    <Card
      title={`Invoice ${invoice.invoiceNo} (v${invoice.version})`}
      testId="invoice-detail-card"
      extra={
        <Button onClick={() => navigate("/invoices")} testId="invoice-detail-back">
          กลับ
        </Button>
      }
    >
      <p data-testid="invoice-detail-customer">ลูกค้า: {invoice.customer?.name ?? "-"}</p>
      <StatusTag status={invoice.status} testId="invoice-detail-status-badge" />

      <table style={{ width: "100%", margin: "16px 0" }} data-testid="invoice-detail-lines-table">
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>รายการ</th>
            <th style={{ textAlign: "right" }}>จำนวน</th>
            <th style={{ textAlign: "right" }}>ราคา/หน่วย</th>
            <th style={{ textAlign: "right" }}>ยอดรวม</th>
          </tr>
        </thead>
        <tbody>
          {(invoice.lines ?? []).map((l: any, i: number) => (
            <tr key={i}>
              <td>{l.description}</td>
              <td style={{ textAlign: "right" }}>{l.quantity}</td>
              <td style={{ textAlign: "right" }}>{Number(l.unitPrice).toFixed(2)}</td>
              <td style={{ textAlign: "right" }}>{Number(l.lineTotal).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>Subtotal: {Number(invoice.subtotal).toFixed(2)} บาท</p>
      <p data-testid="invoice-detail-discount">หักส่วนลด: {Number(invoice.discountAmount ?? 0).toFixed(2)} บาท</p>
      <p data-testid="invoice-detail-vat">VAT {Number(invoice.vatRateApplied)}%: {Number(invoice.vatAmount).toFixed(2)} บาท</p>
      <p data-testid="invoice-detail-total">
        <strong>รวมทั้งสิ้น: {Number(invoice.totalAmount).toFixed(2)} บาท</strong>
      </p>

      <Card title="ประวัติการชำระเงิน">
        <DataTable
          rows={invoice.payments ?? []}
          rowKey={(p: any) => p.id}
          emptyText="ยังไม่มีการชำระเงินสำหรับ invoice นี้"
          columns={[
            { key: "amount", title: "จำนวนเงิน", render: (p: any) => Number(p.amount).toFixed(2) },
            { key: "paymentDate", title: "วันที่ชำระ", render: (p: any) => new Date(p.paymentDate).toLocaleDateString("th-TH") },
            { key: "method", title: "ช่องทาง", dataIndex: "method" }
          ]}
        />
      </Card>

      <Button variant="primary" onClick={() => navigate(`/invoices/${invoice.id}/print`)} testId="invoice-detail-print-link">
        พิมพ์/ดาวน์โหลดใบแจ้งหนี้-ใบกำกับภาษี
      </Button>
    </Card>
  );
}
