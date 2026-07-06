import { Spin as AntSpin, Alert as AntAlert, Empty as AntEmpty } from "antd";
import type { ReactNode } from "react";

export function Spin({ spinning, children }: { spinning: boolean; children: ReactNode }) {
  return <AntSpin spinning={spinning}>{children}</AntSpin>;
}

export function ErrorBanner({ message, action, testId }: { message: string; action?: ReactNode; testId?: string }) {
  return (
    <AntAlert
      type="error"
      showIcon
      message={message}
      action={action}
      style={{ marginBottom: 16 }}
      data-testid={testId}
    />
  );
}

export function EmptyState({ description, testId }: { description: string; testId?: string }) {
  return <AntEmpty description={<span data-testid={testId}>{description}</span>} />;
}
