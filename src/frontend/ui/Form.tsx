import { Form as AntForm, Input, InputNumber, Select, DatePicker, Button as AntButton } from "antd";
import type { ReactNode } from "react";

export interface FormProps {
  children: ReactNode;
  onSubmit: (values: Record<string, unknown>) => void;
  initialValues?: Record<string, unknown>;
}

/** Neutral form wrapper (ADR-008 rev.2) - business pages never import antd's Form directly. */
export function Form({ children, onSubmit, initialValues }: FormProps) {
  const [form] = AntForm.useForm();
  return (
    <AntForm layout="vertical" form={form} initialValues={initialValues} onFinish={onSubmit}>
      {children}
    </AntForm>
  );
}

export interface TextFieldProps {
  name: string;
  label: string;
  required?: boolean;
  errorMessage?: string;
  placeholder?: string;
}

export function TextField({ name, label, required, errorMessage, placeholder }: TextFieldProps) {
  return (
    <AntForm.Item
      name={name}
      label={label}
      rules={required ? [{ required: true, message: errorMessage ?? `กรุณากรอก${label}` }] : []}
    >
      <Input placeholder={placeholder} />
    </AntForm.Item>
  );
}

export function PasswordField({ name, label, required, errorMessage, placeholder }: TextFieldProps) {
  return (
    <AntForm.Item
      name={name}
      label={label}
      rules={required ? [{ required: true, message: errorMessage ?? `กรุณากรอก${label}` }] : []}
    >
      <Input.Password placeholder={placeholder} />
    </AntForm.Item>
  );
}

export function TextAreaField({ name, label, required, errorMessage }: TextFieldProps) {
  return (
    <AntForm.Item
      name={name}
      label={label}
      rules={required ? [{ required: true, message: errorMessage ?? `กรุณากรอก${label}` }] : []}
    >
      <Input.TextArea rows={3} />
    </AntForm.Item>
  );
}

export interface NumberFieldProps extends TextFieldProps {
  min?: number;
  max?: number;
  step?: number;
}

export function NumberField({ name, label, required, min, max, step, errorMessage }: NumberFieldProps) {
  return (
    <AntForm.Item
      name={name}
      label={label}
      rules={required ? [{ required: true, message: errorMessage ?? `กรุณากรอก${label}` }] : []}
    >
      <InputNumber min={min} max={max} step={step} style={{ width: "100%" }} />
    </AntForm.Item>
  );
}

export interface SelectFieldOption {
  value: string | number;
  label: string;
}

export interface SelectFieldProps {
  name: string;
  label: string;
  options: SelectFieldOption[];
  required?: boolean;
  placeholder?: string;
}

export function SelectField({ name, label, options, required, placeholder }: SelectFieldProps) {
  return (
    <AntForm.Item name={name} label={label} rules={required ? [{ required: true, message: `กรุณาเลือก${label}` }] : []}>
      <Select placeholder={placeholder} options={options} />
    </AntForm.Item>
  );
}

export interface DateFieldProps {
  name: string;
  label: string;
  required?: boolean;
}

export function DateField({ name, label, required }: DateFieldProps) {
  return (
    <AntForm.Item name={name} label={label} rules={required ? [{ required: true, message: `กรุณาเลือก${label}` }] : []}>
      <DatePicker style={{ width: "100%" }} />
    </AntForm.Item>
  );
}

export interface SubmitButtonProps {
  children: ReactNode;
  loading?: boolean;
}

export function SubmitButton({ children, loading }: SubmitButtonProps) {
  return (
    <AntForm.Item>
      <AntButton type="primary" htmlType="submit" loading={loading}>
        {children}
      </AntButton>
    </AntForm.Item>
  );
}
