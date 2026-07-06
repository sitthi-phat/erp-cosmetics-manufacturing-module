import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { RequirePermission } from "./components/RequirePermission";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { CustomersPage } from "./pages/CustomersPage";
import { StockPage } from "./pages/StockPage";
import { PoListPage } from "./pages/PoListPage";
import { PoCreatePage } from "./pages/PoCreatePage";
import { PoDetailPage } from "./pages/PoDetailPage";
import { ProductionPage } from "./pages/ProductionPage";
import { QcPage } from "./pages/QcPage";
import { ShippingPage } from "./pages/ShippingPage";
import { InvoicesPage } from "./pages/InvoicesPage";
import { TracePage } from "./pages/TracePage";
import { AdminPage } from "./pages/admin/AdminPage";
import { AuditPage } from "./pages/AuditPage";
import { DashboardPage } from "./pages/dashboards/DashboardPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: "customers",
        element: (
          <RequirePermission resource="customer" action="view">
            <CustomersPage />
          </RequirePermission>
        )
      },
      {
        path: "stock",
        element: (
          <RequirePermission resource="stock" action="view">
            <StockPage />
          </RequirePermission>
        )
      },
      {
        path: "trace",
        element: (
          <RequirePermission resource="traceability" action="view">
            <TracePage />
          </RequirePermission>
        )
      },
      {
        path: "pos",
        element: (
          <RequirePermission resource="po" action="view">
            <PoListPage />
          </RequirePermission>
        )
      },
      {
        path: "pos/new",
        element: (
          <RequirePermission resource="po" action="create">
            <PoCreatePage />
          </RequirePermission>
        )
      },
      {
        path: "pos/:id",
        element: (
          <RequirePermission resource="po" action="view">
            <PoDetailPage />
          </RequirePermission>
        )
      },
      {
        path: "production",
        element: (
          <RequirePermission resource="production" action="view_queue">
            <ProductionPage />
          </RequirePermission>
        )
      },
      {
        path: "qc",
        element: (
          <RequirePermission resource="qc" action="view_batches">
            <QcPage />
          </RequirePermission>
        )
      },
      {
        path: "shipping",
        element: (
          <RequirePermission resource="shipping" action="view">
            <ShippingPage />
          </RequirePermission>
        )
      },
      {
        path: "invoices",
        element: (
          <RequirePermission resource="invoice" action="view">
            <InvoicesPage />
          </RequirePermission>
        )
      },
      {
        path: "admin",
        element: (
          <RequirePermission resource="user_management" action="view_users">
            <AdminPage />
          </RequirePermission>
        )
      },
      {
        path: "audit",
        element: (
          <RequirePermission resource="audit" action="view">
            <AuditPage />
          </RequirePermission>
        )
      },
      {
        path: "dashboard/sales",
        element: (
          <RequirePermission resource="dashboard" action="sales">
            <DashboardPage role="sales" />
          </RequirePermission>
        )
      },
      {
        path: "dashboard/warehouse",
        element: (
          <RequirePermission resource="dashboard" action="warehouse">
            <DashboardPage role="warehouse" />
          </RequirePermission>
        )
      },
      {
        path: "dashboard/production",
        element: (
          <RequirePermission resource="dashboard" action="production">
            <DashboardPage role="production" />
          </RequirePermission>
        )
      },
      {
        path: "dashboard/qc",
        element: (
          <RequirePermission resource="dashboard" action="qc">
            <DashboardPage role="qc" />
          </RequirePermission>
        )
      },
      {
        path: "dashboard/logistics",
        element: (
          <RequirePermission resource="dashboard" action="logistics">
            <DashboardPage role="logistics" />
          </RequirePermission>
        )
      },
      {
        path: "dashboard/finance",
        element: (
          <RequirePermission resource="dashboard" action="finance">
            <DashboardPage role="finance" />
          </RequirePermission>
        )
      },
      {
        path: "dashboard/admin",
        element: (
          <RequirePermission resource="dashboard" action="admin">
            <DashboardPage role="admin" />
          </RequirePermission>
        )
      },
      { path: "*", element: <Navigate to="/" replace /> }
    ]
  }
]);
