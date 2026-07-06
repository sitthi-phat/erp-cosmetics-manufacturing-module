import { Button as AntButton } from "antd";
import type { ReactNode } from "react";

export interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "default" | "danger" | "link";
  htmlType?: "button" | "submit";
  loading?: boolean;
  disabled?: boolean;
}

/** Neutral Button wrapper (ADR-008 rev.2) - callers never import antd's Button directly. */
export function Button({ children, onClick, variant = "default", htmlType = "button", loading, disabled }: ButtonProps) {
  const type = variant === "primary" ? "primary" : variant === "link" ? "link" : "default";
  return (
    <AntButton
      type={type}
      danger={variant === "danger"}
      htmlType={htmlType}
      loading={loading}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </AntButton>
  );
}
