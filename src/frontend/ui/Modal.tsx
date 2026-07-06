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
}

export function Modal({ open, title, children, onOk, onCancel, confirmLoading, okText }: ModalProps) {
  return (
    <AntModal
      open={open}
      title={title}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      okText={okText ?? "ยืนยัน"}
      cancelText="ยกเลิก"
    >
      {children}
    </AntModal>
  );
}
