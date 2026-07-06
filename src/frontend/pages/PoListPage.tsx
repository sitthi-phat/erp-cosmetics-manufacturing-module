import { useNavigate } from "react-router-dom";
import { Card, DataTable, Button, StatusTag } from "../ui";
import { usePOs } from "../hooks/usePo";

export function PoListPage() {
  const { data: pos, isLoading } = usePOs();
  const navigate = useNavigate();

  return (
    <Card title="คำสั่งซื้อ (Purchase Order)" extra={<Button variant="primary" onClick={() => navigate("/pos/new")}>+ สร้าง PO ใหม่</Button>}>
      <DataTable
        loading={isLoading}
        rows={pos ?? []}
        rowKey={(p: any) => p.id}
        emptyText="ยังไม่มี PO ในระบบ"
        columns={[
          { key: "poNumber", title: "เลขที่ PO", dataIndex: "poNumber" },
          { key: "customer", title: "ลูกค้า", render: (p: any) => p.customer?.name },
          { key: "status", title: "สถานะ", render: (p: any) => <StatusTag status={p.status} /> },
          {
            key: "actions",
            title: "",
            render: (p: any) => <Button onClick={() => navigate(`/pos/${p.id}`)}>ดูรายละเอียด</Button>
          }
        ]}
      />
    </Card>
  );
}
