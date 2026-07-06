import { Tag } from "antd";

const COLOR_MAP: Record<string, string> = {
  Draft: "default",
  Confirmed: "processing",
  InProduction: "processing",
  Shipped: "cyan",
  Invoiced: "purple",
  Closed: "green",
  Cancelled: "red",
  Pending: "default",
  Assigned: "processing",
  InProgress: "processing",
  Completed: "green",
  QCPending: "gold",
  QCApproved: "green",
  QCRejected: "red",
  ReadyToShip: "cyan",
  Delivered: "green",
  Active: "green",
  Inactive: "default",
  Issued: "processing",
  PartiallyPaid: "gold",
  Paid: "green",
  Overpaid: "volcano",
  Superseded: "default",
  Passed: "green",
  Failed: "red",
  Approved: "green",
  Rejected: "red"
};

export interface StatusTagProps {
  status: string;
  label?: string;
  /** Forwarded as `data-testid` (QA DEF-03). Defaults to "status-badge" so a generic e2e
   * selector like `getByTestId("status-badge")` finds any StatusTag if the caller doesn't
   * override it with a more specific id (e.g. "invoice-status-badge", "shipment-status-badge"). */
  testId?: string;
}

/** Neutral status badge (ADR-008 rev.2) - centralizes the status -> color mapping in one place. */
export function StatusTag({ status, label, testId }: StatusTagProps) {
  return (
    <Tag color={COLOR_MAP[status] ?? "default"} data-testid={testId ?? "status-badge"}>
      {label ?? status}
    </Tag>
  );
}
