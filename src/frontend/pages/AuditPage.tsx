import { useState } from "react";
import { Card, DataTable } from "../ui";
import { useAuditLogs } from "../hooks/useAdmin";

export function AuditPage() {
  const [actionType, setActionType] = useState("");
  const { data } = useAuditLogs({ actionType: actionType || undefined });

  return (
    <Card title="Audit Log (read-only)">
      <input
        placeholder="กรองด้วยประเภทรายการ เช่น Login, ConfirmPO"
        value={actionType}
        onChange={(e) => setActionType(e.target.value)}
        style={{ marginBottom: 16, padding: 6, width: 320 }}
      />
      <DataTable
        rows={data?.data ?? []}
        rowKey={(l: any) => l.id}
        columns={[
          { key: "timestamp", title: "เวลา", render: (l: any) => new Date(l.timestamp).toLocaleString("th-TH") },
          { key: "actionType", title: "ประเภทรายการ", dataIndex: "actionType" },
          { key: "entityType", title: "Entity", dataIndex: "entityType" },
          { key: "entityId", title: "Entity ID", dataIndex: "entityId" },
          { key: "userId", title: "User ID", dataIndex: "userId" }
        ]}
      />
    </Card>
  );
}
