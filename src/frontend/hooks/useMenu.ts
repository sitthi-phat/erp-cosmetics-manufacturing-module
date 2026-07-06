import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/authContext";
import type { MenuItem } from "../ui";

interface MenuDef {
  key: string;
  label: string;
  path: string;
  resource: string;
  action: string;
  /** QA DEF-03: aligned with tests/e2e/*.spec.ts naming where a 1:1 nav item exists. Our nav
   * is a single sidebar per page (not separate "list"/"create" links), so items like
   * `nav-po-create` don't have an exact equivalent - see Engineer's summary for the mapping
   * notes QA should use to adjust selectors. */
  testId: string;
}

const MENU_DEFS: MenuDef[] = [
  { key: "home", label: "หน้าแรก", path: "/", resource: "dashboard", action: "sales", testId: "nav-home" },
  { key: "customers", label: "ลูกค้า", path: "/customers", resource: "customer", action: "view", testId: "nav-customers" },
  // NOTE for QA: demoFlow.spec.ts assumes a separate `nav-po-create` link; our PO flow is
  // list -> "+ create" button -> detail (2 pages), so this single nav item covers both -
  // `nav-po-create` is also emitted as an alias data-testid on the "+ create" button itself
  // in PoListPage.tsx instead of here.
  { key: "pos", label: "คำสั่งซื้อ (PO)", path: "/pos", resource: "po", action: "view", testId: "nav-po-list" },
  { key: "stock", label: "สต็อกวัตถุดิบ", path: "/stock", resource: "stock", action: "view", testId: "nav-stock" },
  { key: "trace", label: "Traceability", path: "/trace", resource: "traceability", action: "view", testId: "nav-traceability" },
  {
    key: "production",
    label: "งานผลิต",
    path: "/production",
    resource: "production",
    action: "view_queue",
    testId: "nav-production-queue"
  },
  { key: "qc", label: "ตรวจสอบคุณภาพ (QC)", path: "/qc", resource: "qc", action: "view_batches", testId: "nav-qc-batches" },
  { key: "bom", label: "จัดการ BOM", path: "/bom", resource: "bom", action: "view", testId: "nav-bom" },
  {
    key: "shipping",
    label: "จัดส่งสินค้า",
    path: "/shipping",
    resource: "shipping",
    action: "view",
    testId: "nav-shipping-create"
  },
  { key: "invoices", label: "Invoice / การเงิน", path: "/invoices", resource: "invoice", action: "view", testId: "nav-invoice-list" },
  {
    key: "admin",
    label: "จัดการผู้ใช้งาน & VAT",
    path: "/admin",
    resource: "user_management",
    action: "view_users",
    testId: "nav-manage-permissions"
  },
  { key: "audit", label: "Audit Log", path: "/audit", resource: "audit", action: "view", testId: "nav-audit" }
];

/** ECP-034 AC1: menu only shows what the current role is allowed to see. */
export function useMenu(): MenuItem[] {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  return MENU_DEFS.filter((m) => hasPermission(m.resource, m.action)).map((m) => ({
    key: m.key,
    label: m.label,
    onClick: () => navigate(m.path),
    testId: m.testId
  }));
}
