import { useParams, useNavigate } from "react-router-dom";
import { Button, Card, EmptyState } from "../../ui";
import { useInvoiceDocument } from "../../hooks/useInvoices";
import { ApiError } from "../../lib/apiClient";

/**
 * ECP-042 (Gate 2 rework, E32, ADR-009): Thai tax-invoice / delivery-note print view. Deliberate
 * plain-CSS layout (not composed from antd `ui/` wrappers beyond Button/Card/EmptyState for the
 * surrounding chrome) so the printed page can match pond's paper example pixel-for-pixel without
 * fighting antd's own spacing - approach is browser print (`window.print()`), no server PDF
 * dependency (ADR-009 decision #1). The `@media print` block below hides the app's own
 * sidebar/header chrome so only the document itself prints.
 */
export function InvoiceDocumentPage() {
  const { id } = useParams();
  const invoiceId = id ? Number(id) : null;
  const navigate = useNavigate();
  const { data: doc, isLoading, error } = useInvoiceDocument(invoiceId);

  if (isLoading) return <Card title="กำลังโหลด...">{null}</Card>;
  if (error || !doc) {
    const message = error instanceof ApiError ? error.message : "ไม่สามารถแสดงเอกสารนี้ได้";
    return (
      <Card title="พิมพ์ใบแจ้งหนี้ / ใบกำกับภาษี" testId="invoice-document-error-card">
        <EmptyState description={message} testId="invoice-document-error" />
        <Button onClick={() => navigate(-1)}>กลับ</Button>
      </Card>
    );
  }

  const dateStr = new Date(doc.issueDate);
  const dd = String(dateStr.getDate()).padStart(2, "0");
  const mm = String(dateStr.getMonth() + 1).padStart(2, "0");
  const yy = String(dateStr.getFullYear() % 100).padStart(2, "0");

  return (
    <div>
      <style>{`
        @media print {
          .ant-layout-sider, .ant-layout-header, .no-print { display: none !important; }
          .ant-layout, .ant-layout-content { padding: 0 !important; margin: 0 !important; background: #fff !important; }
        }
        .tax-invoice-doc { font-family: "Sarabun", "Tahoma", sans-serif; color: #000; max-width: 800px; margin: 0 auto; padding: 24px; background: #fff; position: relative; }
        .tax-invoice-doc table { width: 100%; border-collapse: collapse; }
        .tax-invoice-doc th, .tax-invoice-doc td { border: 1px solid #333; padding: 6px 8px; font-size: 13px; }
        .tax-invoice-doc .header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .tax-invoice-doc .logo-area { width: 120px; height: 60px; border: 1px dashed #999; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #999; }
        .tax-invoice-doc .party-block { border: 1px solid #333; padding: 8px; margin-bottom: 12px; }
        .tax-invoice-doc .signature-row { display: flex; justify-content: space-between; margin-top: 60px; }
        .tax-invoice-doc .signature-box { width: 45%; text-align: center; }
        .tax-invoice-doc .signature-line { border-top: 1px solid #333; margin-top: 48px; padding-top: 4px; }
        .tax-invoice-doc .stamp-area { width: 100px; height: 100px; border: 1px dashed #999; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #999; margin: 8px auto 0; }
        .tax-invoice-doc .watermark { position: absolute; top: 40%; left: 10%; transform: rotate(-20deg); font-size: 32px; color: rgba(200,0,0,0.5); border: 4px solid rgba(200,0,0,0.5); padding: 8px 16px; }
      `}</style>

      <div className="no-print" style={{ marginBottom: 16 }}>
        <Button variant="primary" onClick={() => window.print()} testId="invoice-document-print-button">
          พิมพ์ / ดาวน์โหลด (Save as PDF)
        </Button>{" "}
        <Button onClick={() => navigate(-1)}>กลับ</Button>
      </div>

      <div className="tax-invoice-doc" data-testid="invoice-document">
        {doc.isSuperseded && (
          <div className="watermark" data-testid="invoice-document-watermark">
            ยกเลิกแล้ว - ใช้ version ล่าสุดแทน
            {doc.latestInvoiceNo ? ` (เลขที่ ${doc.latestInvoiceNo}-v${String(doc.latestVersion).padStart(2, "0")})` : ""}
          </div>
        )}

        <div className="header-row">
          <div>
            <h2 style={{ margin: 0 }}>ใบแจ้งหนี้ / ใบกำกับภาษี</h2>
            <p style={{ margin: 0, color: "#555" }}>Invoice / Tax Invoice</p>
          </div>
          <div className="logo-area" data-testid="invoice-document-logo">
            {doc.issuer.logoUrl ? <img src={doc.issuer.logoUrl} alt="logo" style={{ maxWidth: "100%", maxHeight: "100%" }} /> : "LOGO"}
          </div>
        </div>

        <div className="party-block" data-testid="invoice-document-issuer">
          <strong>ผู้ออก:</strong> {doc.issuer.companyName}
          <br />
          ที่อยู่: {doc.issuer.address}
          <br />
          เลขประจำตัวผู้เสียภาษี: {doc.issuer.taxId} · โทรศัพท์: {doc.issuer.phone}
        </div>

        <div className="party-block" data-testid="invoice-document-customer">
          <strong>ลูกค้า:</strong> {doc.customer.name}
          <br />
          ที่อยู่: {doc.customer.address}
          <br />
          เลขประจำตัวผู้เสียภาษี: {doc.customer.taxId} · โทรศัพท์: {doc.customer.phone ?? "-"}
        </div>

        <p>
          <strong>เลขที่:</strong> <span data-testid="invoice-document-number">{doc.displayNo}</span> &nbsp;&nbsp;
          <strong>วันที่:</strong> {dd}/{mm}/{yy} &nbsp;&nbsp;
          <strong>เงื่อนไขชำระ:</strong> เงินสด / โอนเงิน (เครดิต 30 วัน)
        </p>

        <table data-testid="invoice-document-lines-table">
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>รายการ</th>
              <th>จำนวน</th>
              <th>ราคา</th>
              <th>ราคารวม</th>
            </tr>
          </thead>
          <tbody>
            {doc.lines.map((l: any, i: number) => (
              <tr key={i}>
                <td style={{ textAlign: "center" }}>{i + 1}</td>
                <td>{l.description}</td>
                <td style={{ textAlign: "right" }}>{l.quantity}</td>
                <td style={{ textAlign: "right" }}>{Number(l.unitPrice).toFixed(2)}</td>
                <td style={{ textAlign: "right" }}>{Number(l.lineTotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table style={{ marginTop: 12 }}>
          <tbody>
            <tr>
              <td>รวมเป็นเงิน</td>
              <td style={{ textAlign: "right" }} data-testid="invoice-document-subtotal">
                {Number(doc.subtotal).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td>หักส่วนลด</td>
              <td style={{ textAlign: "right" }} data-testid="invoice-document-discount">
                {Number(doc.discountAmount).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td>จำนวนเงินหลังหักส่วนลด</td>
              <td style={{ textAlign: "right" }} data-testid="invoice-document-after-discount">
                {Number(doc.afterDiscount).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td>ภาษีมูลค่าเพิ่ม {Number(doc.vatRateApplied)}%</td>
              <td style={{ textAlign: "right" }} data-testid="invoice-document-vat">
                {Number(doc.vatAmount).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td>
                <strong>จำนวนเงินทั้งสิ้น</strong>
              </td>
              <td style={{ textAlign: "right" }} data-testid="invoice-document-total">
                <strong>{Number(doc.totalAmount).toFixed(2)}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        <p data-testid="invoice-document-total-text">
          <strong>ตัวหนังสือ:</strong> {doc.totalAmountText}
        </p>

        <p style={{ color: "#555" }}>หมายเหตุ: กรุณาชำระเงินภายในระยะเวลาเครดิตที่กำหนด มิฉะนั้นอาจมีค่าธรรมเนียมล่าช้าตามนโยบายบริษัท</p>

        <div className="signature-row">
          <div className="signature-box">
            <div className="signature-line">ผู้รับใบแจ้งหนี้</div>
            <p>( ........................................ )</p>
          </div>
          <div className="signature-box">
            <div className="signature-line">ผู้ออกใบแจ้งหนี้</div>
            <p>( ........................................ )</p>
            <div className="stamp-area">ตราประทับ</div>
          </div>
        </div>
      </div>
    </div>
  );
}
