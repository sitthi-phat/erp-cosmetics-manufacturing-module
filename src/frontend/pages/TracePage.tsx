import { useState } from "react";
import { Card, Button, DataTable, EmptyState, Notify } from "../ui";
import { useTraceSearch } from "../hooks/useTrace";
import { ApiError } from "../lib/apiClient";

export function TracePage() {
  const [lot, setLot] = useState("");
  const search = useTraceSearch();

  async function handleSearch() {
    try {
      await search.mutateAsync(lot);
    } catch (err) {
      if (err instanceof ApiError) Notify.error(err.message);
    }
  }

  return (
    <Card title="Traceability: Lot -> Batch -> สินค้าสำเร็จรูป -> PO">
      <input
        placeholder="เลข Lot"
        value={lot}
        onChange={(e) => setLot(e.target.value)}
        style={{ marginRight: 8, padding: 6, width: 240 }}
      />
      <Button variant="primary" onClick={handleSearch}>
        ค้นหา
      </Button>
      <div style={{ marginTop: 16 }}>
        {search.data && search.data.length === 0 && <EmptyState description="ไม่พบ Lot นี้ในระบบ กรุณาตรวจสอบเลข Lot อีกครั้ง" />}
        {(search.data ?? []).map((lotResult: any) => (
          <Card key={lotResult.lotId} title={`Lot ${lotResult.lotNumber} (${lotResult.materialName})`}>
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
