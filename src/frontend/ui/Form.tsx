import { Form as AntForm, Input, InputNumber, Select, DatePicker, Button as AntButton } from "antd";
import type { ReactNode } from "react";

export interface FormProps {
  children: ReactNode;
  onSubmit: (values: Record<string, unknown>) => void;
  initialValues?: Record<string, unknown>;
  testId?: string;
}

/** Neutral form wrapper (ADR-008 rev.2) - business pages never import antd's Form directly. */
export function Form({ children, onSubmit, initialValues, testId }: FormProps) {
  const [form] = AntForm.useForm();
  return (
    <AntForm layout="vertical" form={form} initialValues={initialValues} onFinish={onSubmit} data-testid={testId}>
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
  /** Forwarded as `data-testid` on the underlying input (QA DEF-03). */
  testId?: string;
}

export function TextField({ name, label, required, errorMessage, placeholder, testId }: TextFieldProps) {
  return (
    <AntForm.Item
      name={name}
      label={label}
      rules={required ? [{ required: true, message: errorMessage ?? `กรุณากรอก${label}` }] : []}
    >
      <Input placeholder={placeholder} data-testid={testId ?? name} />
    </AntForm.Item>
  );
}

export function PasswordField({ name, label, required, errorMessage, placeholder, testId }: TextFieldProps) {
  return (
    <AntForm.Item
      name={name}
      label={label}
      rules={required ? [{ required: true, message: errorMessage ?? `กรุณากรอก${label}` }] : []}
    >
      <Input.Password placeholder={placeholder} data-testid={testId ?? name} />
    </AntForm.Item>
  );
}

export function TextAreaField({ name, label, required, errorMessage, testId }: TextFieldProps) {
  return (
    <AntForm.Item
      name={name}
      label={label}
      rules={required ? [{ required: true, message: errorMessage ?? `กรุณากรอก${label}` }] : []}
    >
      <Input.TextArea rows={3} data-testid={testId ?? name} />
    </AntForm.Item>
  );
}

export interface NumberFieldProps extends TextFieldProps {
  min?: number;
  max?: number;
  step?: number;
}

export function NumberField({ name, label, required, min, max, step, errorMessage, testId }: NumberFieldProps) {
  return (
    <AntForm.Item
      name={name}
      label={label}
      rules={required ? [{ required: true, message: errorMessage ?? `กรุณากรอก${label}` }] : []}
    >
      <InputNumber min={min} max={max} step={step} style={{ width: "100%" }} data-testid={testId ?? name} />
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
  testId?: string;
}

export function SelectField({ name, label, options, required, placeholder, testId }: SelectFieldProps) {
  return (
    <AntForm.Item name={name} label={label} rules={required ? [{ required: true, message: `กรุณาเลือก${label}` }] : []}>
      <Select placeholder={placeholder} options={options} data-testid={testId ?? name} />
    </AntForm.Item>
  );
}

export interface DateFieldProps {
  name: string;
  label: string;
  required?: boolean;
  testId?: string;
}

export function DateField({ name, label, required, testId }: DateFieldProps) {
  return (
    <AntForm.Item name={name} label={label} rules={required ? [{ required: true, message: `กรุณาเลือก${label}` }] : []}>
      <DatePicker style={{ width: "100%" }} data-testid={testId ?? name} />
    </AntForm.Item>
  );
}

export interface SubmitButtonProps {
  children: ReactNode;
  loading?: boolean;
  testId?: string;
}

export function SubmitButton({ children, loading, testId }: SubmitButtonProps) {
  return (
    <AntForm.Item>
      <AntButton type="primary" htmlType="submit" loading={loading} data-testid={testId ?? "form-submit"}>
        {children}
      </AntButton>
    </AntForm.Item>
  );
}
