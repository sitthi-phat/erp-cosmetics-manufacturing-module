import { ConfigProvider } from "antd";
import type { ReactNode } from "react";
import { theme } from "./theme";

/** App-wide antd theme bootstrap - kept inside ui/ so ConfigProvider/antd stays confined here (ADR-008 rev.2). */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  return <ConfigProvider theme={theme}>{children}</ConfigProvider>;
}
