import { Descriptions as AntDescriptions, Card as AntCard } from "antd";
import type { ReactNode } from "react";

export interface DescriptionItem {
  label: string;
  value: ReactNode;
}

export function Descriptions({ items, title }: { items: DescriptionItem[]; title?: string }) {
  return (
    <AntDescriptions title={title} column={2} bordered size="small">
      {items.map((item) => (
        <AntDescriptions.Item key={item.label} label={item.label}>
          {item.value}
        </AntDescriptions.Item>
      ))}
    </AntDescriptions>
  );
}

export function Card({ title, children, extra }: { title?: string; children: ReactNode; extra?: ReactNode }) {
  return (
    <AntCard title={title} extra={extra} style={{ marginBottom: 16 }}>
      {children}
    </AntCard>
  );
}
