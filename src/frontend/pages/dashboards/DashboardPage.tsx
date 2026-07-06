import { Card, EmptyState } from "../../ui";
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

/** ECP-027..033: one generic renderer for all 7 role dashboards (same JSON shape per role, see backend). */
export function DashboardPage({ role }: { role: string }) {
  const { data, isLoading } = useDashboard(role);

  if (isLoading) return <Card title={TITLES[role]}>{null}</Card>;
  if (!data) return <Card title={TITLES[role]}><EmptyState description="ไม่มีข้อมูล" /></Card>;

  return (
    <Card title={TITLES[role]}>
      <pre style={{ background: "#f7f7f7", padding: 16, borderRadius: 6, overflowX: "auto" }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </Card>
  );
}
