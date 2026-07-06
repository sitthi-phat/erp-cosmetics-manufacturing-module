import { Card, DataTable, EmptyState } from "../../ui";
import { useDashboard } from "../../hooks/useDashboard";

const TITLES: Record<string, string> = {
  sales: "Dashboard - Sales/CS",
  warehouse: "Dashboard - คลังสินค้า (real-time)",
  production: "Dashboard - ฝ่ายผลิต",
  qc: "Dashboard - QA/QC",
  logistics: "Dashboard - ฝ่ายจัดส่ง",
  finance: "Dashboard - ฝ่ายบัญชี/การเงิน",
  admin: "Dashboard - Admin"
};

/**
 * ECP-027..033: one renderer per role, wired to the specific fields the backend now computes
 * (dashboard.routes.ts). QA DEF-04 fix: renders the exact Thai empty-state text each AC
 * requires (ECP-027 AC2, ECP-028 AC3, ECP-029 AC2) instead of a raw JSON dump - a raw
 * `<pre>{JSON.stringify(...)}</pre>` can never satisfy an AC that specifies exact visible text.
 */
export function DashboardPage({ role }: { role: string }) {
  const { data, isLoading } = useDashboard(role);
  const title = TITLES[role];

  if (isLoading) return <Card title={title}>{null}</Card>;
  if (!data) return <Card title={title}><EmptyState description="ไม่มีข้อมูล" /></Card>;

  switch (role) {
    case "sales":
      return (
        <Card title={title} testId="dashboard-sales">
          {data.isEmpty ? (
            <EmptyState description={data.emptyStateMessage} testId="dashboard-empty-message" />
          ) : (
            <DataTable
              rows={data.byStatus}
              rowKey={(r: any) => r.status}
              columns={[
                { key: "status", title: "สถานะ", dataIndex: "status" },
                { key: "count", title: "จำนวน", dataIndex: "count" }
              ]}
            />
          )}
        </Card>
      );

    case "warehouse":
      return (
        <Card title={title} testId="dashboard-warehouse">
          {data.missingBomWarning && <p style={{ color: "#ad6800" }}>{data.missingBomWarning}</p>}
          {data.lowStock.length === 0 ? (
            <EmptyState description="ไม่มีวัตถุดิบที่ใกล้หมดในขณะนี้" />
          ) : (
            <DataTable
              rows={data.lowStock}
              rowKey={(r: any) => r.materialId}
              getRowTestId={(r: any) => `low-stock-material-row-${r.name}`}
              columns={[
                { key: "name", title: "วัตถุดิบ", dataIndex: "name" },
                { key: "physicalQty", title: "คงเหลือ", dataIndex: "physicalQty" }
              ]}
            />
          )}
        </Card>
      );

    case "production":
      return (
        <Card title={title} testId="dashboard-production">
          <p>งานที่ต้องทำ: {data.pendingCount}</p>
          {data.pendingCount === 0 ? (
            <EmptyState description={data.emptyStateMessage} testId="dashboard-empty-message" />
          ) : (
            <DataTable
              rows={data.orders}
              rowKey={(o: any) => o.id}
              columns={[
                { key: "po", title: "PO", render: (o: any) => o.po?.poNumber },
                { key: "product", title: "สินค้า", render: (o: any) => o.poLine?.product?.name }
              ]}
            />
          )}
        </Card>
      );

    case "qc":
      return (
        <Card title={title} testId="dashboard-qc">
          {data.emptyStateMessage ? (
            <EmptyState description={data.emptyStateMessage} testId="dashboard-empty-message" />
          ) : (
            <ul>
              <li>QC Pending: {data.pending}</li>
              <li>QC Approved: {data.approved}</li>
              <li>QC Rejected: {data.rejected}</li>
            </ul>
          )}
        </Card>
      );

    case "logistics":
      return (
        <Card title={title} testId="dashboard-logistics">
          {data.emptyStateMessage ? (
            <EmptyState description={data.emptyStateMessage} testId="dashboard-empty-message" />
          ) : (
            <p>รอจัดส่ง: {data.readyToShip} รายการ</p>
          )}
        </Card>
      );

    case "finance":
      return (
        <Card title={title} testId="dashboard-finance">
          {data.emptyStateMessage ? (
            <EmptyState description={data.emptyStateMessage} testId="dashboard-empty-message" />
          ) : (
            <p>
              ยอดค้างชำระรวม = {data.totalOutstanding.toFixed(2)} บาท ({data.countOutstanding} invoice)
            </p>
          )}
        </Card>
      );

    case "admin":
      return (
        <Card title={title} testId="dashboard-admin">
          <DataTable
            rows={data.usersByRole}
            rowKey={(r: any) => r.roleName}
            emptyText="0 คน"
            columns={[
              { key: "roleName", title: "Role", dataIndex: "roleName" },
              { key: "count", title: "จำนวนผู้ใช้", dataIndex: "count" }
            ]}
          />
          <h4>กิจกรรมล่าสุด</h4>
          <ul>
            {data.recentAudit.map((a: any) => (
              <li key={a.id}>
                {a.actionType} - {new Date(a.timestamp).toLocaleString("th-TH")}
              </li>
            ))}
          </ul>
        </Card>
      );

    default:
      return <Card title={title}>{null}</Card>;
  }
}
