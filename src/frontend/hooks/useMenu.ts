import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/authContext";
import type { MenuItem } from "../ui";

interface MenuDef {
  key: string;
  label: string;
  path: string;
  resource: string;
  action: string;
}

const MENU_DEFS: MenuDef[] = [
  { key: "home", label: "หน้าแรก", path: "/", resource: "dashboard", action: "sales" },
  { key: "customers", label: "ลูกค้า", path: "/customers", resource: "customer", action: "view" },
  { key: "pos", label: "คำสั่งซื้อ (PO)", path: "/pos", resource: "po", action: "view" },
  { key: "stock", label: "สต็อกวัตถุดิบ", path: "/stock", resource: "stock", action: "view" },
  { key: "trace", label: "Traceability", path: "/trace", resource: "traceability", action: "view" },
  { key: "production", label: "งานผลิต", path: "/production", resource: "production", action: "view_queue" },
  { key: "qc", label: "ตรวจสอบคุณภาพ (QC)", path: "/qc", resource: "qc", action: "view_batches" },
  { key: "shipping", label: "จัดส่งสินค้า", path: "/shipping", resource: "shipping", action: "view" },
  { key: "invoices", label: "Invoice / การเงิน", path: "/invoices", resource: "invoice", action: "view" },
  { key: "admin", label: "จัดการผู้ใช้งาน & VAT", path: "/admin", resource: "user_management", action: "view_users" },
  { key: "audit", label: "Audit Log", path: "/audit", resource: "audit", action: "view" }
];

/** ECP-034 AC1: menu only shows what the current role is allowed to see. */
export function useMenu(): MenuItem[] {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  return MENU_DEFS.filter((m) => hasPermission(m.resource, m.action)).map((m) => ({
    key: m.key,
    label: m.label,
    onClick: () => navigate(m.path)
  }));
}
