import { Table, Empty } from "antd";
import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  key: string;
  title: string;
  render?: (record: T) => ReactNode;
  dataIndex?: keyof T;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (record: T) => string | number;
  loading?: boolean;
  emptyText?: string;
  /** Optional per-row `data-testid` (QA DEF-03), e.g. `(r) => \`queue-row-${r.poNumber}\`` */
  getRowTestId?: (record: T) => string;
  /** Forwarded as `data-testid` on the table's outer wrapper element. */
  testId?: string;
}

/** Neutral table wrapper (ADR-008 rev.2) - business code never touches antd's Table API directly. */
export function DataTable<T>({ columns, rows, rowKey, loading, emptyText, getRowTestId, testId }: DataTableProps<T>) {
  return (
    <div data-testid={testId}>
      <Table<T>
        loading={loading}
        dataSource={rows}
        rowKey={rowKey}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: <Empty description={emptyText ?? "ไม่มีข้อมูล"} /> }}
        onRow={getRowTestId ? (record) => ({ "data-testid": getRowTestId(record) } as any) : undefined}
        columns={columns.map((c) => ({
          key: c.key,
          title: c.title,
          dataIndex: c.dataIndex as string | undefined,
          render: c.render ? (_: unknown, record: T) => c.render!(record) : undefined
        }))}
      />
    </div>
  );
}
