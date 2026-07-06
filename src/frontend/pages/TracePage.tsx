import { useState } from "react";
import { Card, Button, DataTable, EmptyState, Notify } from "../ui";
import { useTraceSearch } from "../hooks/useTrace";
import { ApiError } from "../lib/apiClient";

export function TracePage() {
  const [term, setTerm] = useState("");
  const search = useTraceSearch();

  async function handleSearch() {
    try {
      await search.mutateAsync(term);
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  return (
    <Card title="Traceability: ค้นหาด้วยเลข Lot, Batch, PO หรือ Invoice (ช่องเดียว)" testId="trace-page-card">
      {/* ECP-014 AC3: always-visible legend explaining Lot (source) vs Batch (destination) -
          answers pond's own question "Batch เอาไว้ทำอะไร" directly on screen. */}
      <div
        data-testid="trace-legend"
        style={{ background: "#e6f4ff", padding: 12, borderRadius: 4, marginBottom: 16, fontSize: 13 }}
      >
        <strong>คำอธิบาย:</strong>{" "}
        <span data-testid="trace-legend-lot">Lot = ล็อตวัตถุดิบที่รับเข้าจาก supplier (ต้นทาง)</span>
        {" · "}
        <span data-testid="trace-legend-batch">Batch = รอบการผลิตที่นำ Lot มาแปลงเป็นสินค้าสำเร็จรูป (ปลายทาง)</span>
        <div style={{ marginTop: 4 }}>
          ทิศทางการตรวจสอบย้อนกลับ: <strong>Lot (ต้นทาง) → Batch (ปลายทาง) → สินค้าสำเร็จรูป → PO → Invoice</strong>
        </div>
      </div>
      <input
        placeholder="เลข Lot / Batch / PO / Invoice"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSearch();
        }}
        data-testid="trace-search-input"
        style={{ marginRight: 8, padding: 6, width: 280 }}
      />
      <Button variant="primary" onClick={handleSearch} testId="trace-search-button">
        ค้นหา
      </Button>
      <div style={{ marginTop: 16 }}>
        {search.data && search.data.length === 0 && (
          <EmptyState description="ไม่พบข้อมูลที่ตรงกับคำค้นหา กรุณาตรวจสอบเลข Lot/Batch/PO/Invoice อีกครั้ง" testId="trace-not-found" />
        )}
        {(search.data ?? []).map((lotResult: any) => (
          <Card key={lotResult.lotId} title={`Lot ${lotResult.lotNumber} (${lotResult.materialName})`} testId={`trace-result-${lotResult.lotNumber}`}>
            <DataTable
              rows={lotResult.batches}
              rowKey={(b: any) => b.batchId}
              emptyText="ยังไม่มี Batch ที่ใช้ Lot นี้"
              columns={[
                { key: "batchNumber", title: "เลข Batch", dataIndex: "batchNumber" },
                { key: "productName", title: "สินค้าที่ผลิตได้", dataIndex: "productName" },
                { key: "status", title: "สถานะ", dataIndex: "status" },
                { key: "po", title: "PO", render: (b: any) => (b.po ? `${b.po.poNumber} (${b.po.customerName})` : "-") }
              ]}
            />
          </Card>
        ))}
      </div>
    </Card>
  );
}
