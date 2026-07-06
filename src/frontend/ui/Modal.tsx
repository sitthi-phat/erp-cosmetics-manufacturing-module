import { Modal as AntModal } from "antd";
import type { ReactNode } from "react";

export interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onOk?: () => void;
  onCancel: () => void;
  confirmLoading?: boolean;
  okText?: string;
  /** Forwarded as `data-testid` on the modal's wrap container (QA DEF-03). */
  testId?: string;
}

export function Modal({ open, title, children, onOk, onCancel, confirmLoading, okText, testId }: ModalProps) {
  return (
    <AntModal
      open={open}
      title={title}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      okText={okText ?? "ยืนยัน"}
      cancelText="ยกเลิก"
      wrapProps={testId ? { "data-testid": testId } : undefined}
    >
      {children}
    </AntModal>
  );
}
