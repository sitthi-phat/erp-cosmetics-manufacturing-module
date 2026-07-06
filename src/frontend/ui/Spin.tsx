import { Spin as AntSpin, Alert as AntAlert, Empty as AntEmpty } from "antd";
import type { ReactNode } from "react";

export function Spin({ spinning, children }: { spinning: boolean; children: ReactNode }) {
  return <AntSpin spinning={spinning}>{children}</AntSpin>;
}

export function ErrorBanner({ message, action }: { message: string; action?: ReactNode }) {
  return <AntAlert type="error" showIcon message={message} action={action} style={{ marginBottom: 16 }} />;
}

export function EmptyState({ description }: { description: string }) {
  return <AntEmpty description={description} />;
}
