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
  Superseded: "default",
  Passed: "green",
  Failed: "red",
  Approved: "green",
  Rejected: "red"
};

export interface StatusTagProps {
  status: string;
  label?: string;
}

/** Neutral status badge (ADR-008 rev.2) - centralizes the status -> color mapping in one place. */
export function StatusTag({ status, label }: StatusTagProps) {
  return <Tag color={COLOR_MAP[status] ?? "default"}>{label ?? status}</Tag>;
}
