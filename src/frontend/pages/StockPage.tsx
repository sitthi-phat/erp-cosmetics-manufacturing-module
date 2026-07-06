import { Card, DataTable, StatusTag } from "../ui";
import { useStock, StockRow } from "../hooks/useStock";

const LOW_STOCK_THRESHOLD = 100;

export function StockPage() {
  const { data: rows, isLoading, isError, dataUpdatedAt } = useStock();

  return (
    <Card title="สต็อกวัตถุดิบ (real-time)" testId="stock-page-card">
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
        getRowTestId={(r) => `stock-row-${r.materialName}`}
        columns={[
          {
            key: "materialName",
            title: "วัตถุดิบ",
            render: (r) => (
              <>
                {r.materialName}
                {r.physicalQty > 0 && r.physicalQty < LOW_STOCK_THRESHOLD && (
                  <span data-testid="low-stock-material-row" style={{ display: "none" }} />
                )}
              </>
            )
          },
          { key: "uom", title: "หน่วย", dataIndex: "uom" },
          {
            key: "physicalQty",
            title: "ยอดจริง (physical)",
            render: (r) => <span data-testid="stock-physical">{r.physicalQty}</span>
          },
          { key: "reservedQty", title: "ยอดจอง (reserved)", dataIndex: "reservedQty" },
          { key: "availableQty", title: "ยอดพร้อมใช้ (available)", dataIndex: "availableQty" },
          {
            key: "status",
            title: "สถานะ",
            render: (r) =>
              r.outOfStock ? (
                <StatusTag status="Cancelled" label="หมดสต็อก" testId="status-badge" />
              ) : (
                <StatusTag status="Active" label="ปกติ" testId="status-badge" />
              )
          }
        ]}
      />
    </Card>
  );
}
