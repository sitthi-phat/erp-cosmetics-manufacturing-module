import { Descriptions as AntDescriptions, Card as AntCard } from "antd";
import type { ReactNode } from "react";

export interface DescriptionItem {
  label: string;
  value: ReactNode;
}

export function Descriptions({ items, title, testId }: { items: DescriptionItem[]; title?: string; testId?: string }) {
  return (
    <AntDescriptions title={title} column={2} bordered size="small" data-testid={testId}>
      {items.map((item) => (
        <AntDescriptions.Item key={item.label} label={item.label}>
          {item.value}
        </AntDescriptions.Item>
      ))}
    </AntDescriptions>
  );
}

export function Card({
  title,
  children,
  extra,
  testId
}: {
  title?: string;
  children: ReactNode;
  extra?: ReactNode;
  /** Forwarded as `data-testid` on the card's outer DOM node (QA DEF-03). */
  testId?: string;
}) {
  return (
    <AntCard title={title} extra={extra} style={{ marginBottom: 16 }} data-testid={testId}>
      {children}
    </AntCard>
  );
}
