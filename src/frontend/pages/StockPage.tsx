import { Card, DataTable, StatusTag } from "../ui";
import { useStock, StockRow } from "../hooks/useStock";

export function StockPage() {
  const { data: rows, isLoading, isError, dataUpdatedAt } = useStock();

  return (
    <Card title="สต็อกวัตถุดิบ (real-time)">
      {isError && (
        <p style={{ color: "red" }}>
          ไม่สามารถโหลดข้อมูล stock ได้ในขณะนี้ กรุณาลองใหม่ (ข้อมูลล่าสุดที่เคยอัปเดตสำเร็จ:{" "}
          {new Date(dataUpdatedAt).toLocaleString("th-TH")})
        </p>
      )}
      <DataTable<StockRow>
        loading={isLoading}
        rows={rows ?? []}
        rowKey={(r) => r.materialId}
        columns={[
          { key: "materialName", title: "วัตถุดิบ", dataIndex: "materialName" },
          { key: "uom", title: "หน่วย", dataIndex: "uom" },
          { key: "physicalQty", title: "ยอดจริง (physical)", dataIndex: "physicalQty" },
          { key: "reservedQty", title: "ยอดจอง (reserved)", dataIndex: "reservedQty" },
          { key: "availableQty", title: "ยอดพร้อมใช้ (available)", dataIndex: "availableQty" },
          {
            key: "status",
            title: "สถานะ",
            render: (r) => (r.outOfStock ? <StatusTag status="Cancelled" label="หมดสต็อก" /> : <StatusTag status="Active" label="ปกติ" />)
          }
        ]}
      />
    </Card>
  );
}
