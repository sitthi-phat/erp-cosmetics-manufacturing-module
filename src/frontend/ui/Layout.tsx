import { Layout as AntLayout, Menu as AntMenu } from "antd";
import type { ReactNode } from "react";

const { Header, Sider, Content } = AntLayout;

export interface MenuItem {
  key: string;
  label: string;
  onClick: () => void;
}

export interface AppShellProps {
  menuItems: MenuItem[];
  selectedKey: string;
  headerRight?: ReactNode;
  children: ReactNode;
}

/** App shell (sidebar menu + header + content) - the one place that imports antd Layout/Menu. */
export function AppShell({ menuItems, selectedKey, headerRight, children }: AppShellProps) {
  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      <Sider width={220} theme="light">
        <div style={{ padding: 16, fontWeight: 700 }}>ERP Cosmetics Factory</div>
        <AntMenu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems.map((m) => ({ key: m.key, label: m.label, onClick: m.onClick }))}
        />
      </Sider>
      <AntLayout>
        <Header style={{ background: "#fff", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 24px" }}>
          {headerRight}
        </Header>
        <Content style={{ padding: 24 }}>{children}</Content>
      </AntLayout>
    </AntLayout>
  );
}
