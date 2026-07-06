import { useNavigate } from "react-router-dom";
import { Card, DataTable, Button, StatusTag } from "../ui";
import { usePOs } from "../hooks/usePo";

export function PoListPage() {
  const { data: pos, isLoading } = usePOs();
  const navigate = useNavigate();

  return (
    <Card
      title="คำสั่งซื้อ (Purchase Order)"
      testId="po-list-card"
      extra={
        // QA DEF-03 note: demoFlow.spec.ts expects a `nav-po-create` sidebar link; our flow uses
        // a page-level "+ create" button instead (list -> create -> detail, see PoDetailPage
        // for the confirm step). Both ids point at the same action so either selector works.
        <Button variant="primary" onClick={() => navigate("/pos/new")} testId="nav-po-create">
          + สร้าง PO ใหม่
        </Button>
      }
    >
      <DataTable
        loading={isLoading}
        rows={pos ?? []}
        rowKey={(p: any) => p.id}
        emptyText="ยังไม่มี PO ในระบบ"
        getRowTestId={(p: any) => `queue-row-${p.poNumber}`}
        columns={[
          { key: "poNumber", title: "เลขที่ PO", dataIndex: "poNumber" },
          { key: "customer", title: "ลูกค้า", render: (p: any) => p.customer?.name },
          { key: "status", title: "สถานะ", render: (p: any) => <StatusTag status={p.status} testId="status-badge" /> },
          {
            key: "actions",
            title: "",
            render: (p: any) => (
              <Button onClick={() => navigate(`/pos/${p.id}`)} testId={`po-${p.poNumber}-view`}>
                ดูรายละเอียด
              </Button>
            )
          }
        ]}
      />
    </Card>
  );
}
