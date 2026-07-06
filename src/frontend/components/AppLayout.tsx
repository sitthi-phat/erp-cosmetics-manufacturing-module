import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { AppShell, Button } from "../ui";
import { useMenu } from "../hooks/useMenu";
import { useAuth } from "../lib/authContext";
import { apiClient } from "../lib/apiClient";

export function AppLayout() {
  const menuItems = useMenu();
  const { me } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const selectedKey = menuItems.find((m) => location.pathname.startsWith(`/${m.key}`))?.key ?? "home";

  async function handleLogout() {
    await apiClient.post("/auth/logout");
    navigate("/login");
  }

  return (
    <AppShell
      menuItems={menuItems}
      selectedKey={selectedKey}
      headerRight={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span>
            {me?.fullName} ({me?.role})
          </span>
          <Button onClick={handleLogout} testId="logout-button">
            ออกจากระบบ
          </Button>
        </div>
      }
    >
      <Outlet />
    </AppShell>
  );
}
