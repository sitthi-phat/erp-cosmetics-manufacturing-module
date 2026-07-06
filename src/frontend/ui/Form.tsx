import { Form as AntForm, Input, InputNumber, Select, DatePicker, Button as AntButton } from "antd";
import type { ReactNode } from "react";

export interface FormProps {
  children: ReactNode;
  onSubmit: (values: Record<string, unknown>) => void;
  initialValues?: Record<string, unknown>;
  testId?: string;
  /** Called when client-side field validation (e.g. NumberField's min/max range check) blocks
   * submission - receives the first validation error message so callers can surface it exactly
   * like a server-side error (DEF-13: a blocked-by-validation submit must still show a clear,
   * visible message, not silently do nothing). */
  onValidationError?: (message: string) => void;
}

/** Neutral form wrapper (ADR-008 rev.2) - business pages never import antd's Form directly. */
export function Form({ children, onSubmit, initialValues, testId, onValidationError }: FormProps) {
  const [form] = AntForm.useForm();
  return (
    <AntForm
      layout="vertical"
      form={form}
      initialValues={initialValues}
      onFinish={onSubmit}
      onFinishFailed={
        onValidationError
          ? (info) => onValidationError(info.errorFields?.[0]?.errors?.[0] ?? "ข้อมูลที่กรอกไม่ถูกต้อง")
          : undefined
      }
      data-testid={testId}
    >
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
  /** Message shown when the value is outside [min, max] (ECP-038 AC3: must be a visible error,
   * never a silent auto-correction). Defaults to a generic Thai message built from min/max. */
  rangeErrorMessage?: string;
}

/**
 * DEF-13 fix (QA verify-3, Major): passing `min`/`max` straight to antd's `<InputNumber>` makes
 * it silently CLAMP any out-of-range value the moment the field loses focus (e.g. typing "150"
 * with `max={100}` becomes "100" with zero indication anything changed) - by the time Form
 * validation would run, the value has already been corrected, so a range `rules` check would
 * never even see the out-of-range number to reject it. Fix: don't pass `min`/`max` to
 * `<InputNumber>` at all (so the user's actual typed value, e.g. 150, is preserved on screen
 * exactly as typed) and enforce the range purely via a Form validator, which surfaces a real,
 * visible error message and blocks submission - matching ECP-038 AC3's "must show an error,
 * never silently adjust the value" requirement.
 */
export function NumberField({ name, label, required, min, max, step, errorMessage, rangeErrorMessage, testId }: NumberFieldProps) {
  const rules: Array<Record<string, unknown>> = [];
  if (required) {
    rules.push({ required: true, message: errorMessage ?? `กรุณากรอก${label}` });
  }
  if (min !== undefined || max !== undefined) {
    rules.push({
      validator: async (_: unknown, value: unknown) => {
        if (value === undefined || value === null || value === "") return Promise.resolve();
        const num = Number(value);
        const outOfRange = (min !== undefined && num < min) || (max !== undefined && num > max);
        if (outOfRange) {
          return Promise.reject(
            new Error(rangeErrorMessage ?? `${label}ต้องอยู่ระหว่าง ${min ?? "-∞"} ถึง ${max ?? "∞"}`)
          );
        }
        return Promise.resolve();
      }
    });
  }
  return (
    <AntForm.Item name={name} label={label} rules={rules}>
      <InputNumber step={step} style={{ width: "100%" }} data-testid={testId ?? name} />
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

/**
 * DEF-11 fix (QA verify-3, Major): every numeric-valued `<Select>` in the app (customer/product/
 * worker/material pickers) rendered the raw numeric `value` instead of the human-readable
 * `label` text in the visible dropdown - accessibility's `aria-label` was correct, but the
 * on-screen text was not (`aria-label="บริษัท ABC จำกัด (CUS-00000001)"` next to visible text
 * "21"). Root cause: antd/rc-select's own value-to-option matching (used to resolve what text
 * to render for the currently selected item) is sensitive to `value` identity/typing edge cases
 * when the `options` array is provided as a plain prop and the bound field value's type/identity
 * doesn't line up perfectly at render time (e.g. options loaded asynchronously via React Query
 * a tick after the field value is set). Two changes together eliminate the whole class of bug
 * rather than one specific instance of it:
 *   1. `labelInValue` - antd then stores `{ value, label }` as the field's value, captured
 *      directly at SELECTION time, so displaying the selected item's text never again depends
 *      on re-matching a bare `value` against a (possibly stale/async) `options` array.
 *   2. `optionLabelProp="label"` - explicitly forces the selected-value display (and each
 *      dropdown row) to always render the option's `label`, never falls back to `value`.
 * Since `labelInValue` changes the field's stored shape to `{value,label}`, `Form`'s
 * `initialValues` and every page's submit handler must read `.value` off it - callers already
 * do `Number(values.xxx)` everywhere, so `normalizeSelectValues()` (exported below) unwraps
 * `{value,label}` back to a bare `value` before handlers ever see it, keeping every existing
 * `Number(values.xxx)` call working unchanged.
 */
export function SelectField({ name, label, options, required, placeholder, testId }: SelectFieldProps) {
  return (
    <AntForm.Item name={name} label={label} rules={required ? [{ required: true, message: `กรุณาเลือก${label}` }] : []}>
      <Select
        placeholder={placeholder}
        options={options}
        labelInValue
        optionLabelProp="label"
        showSearch
        optionFilterProp="label"
        filterOption={(input, option) =>
          (option?.label ? String(option.label) : "").toLowerCase().includes(input.toLowerCase())
        }
        data-testid={testId ?? name}
      />
    </AntForm.Item>
  );
}

/**
 * `labelInValue` makes every `SelectField` store `{ value, label }` instead of a bare value.
 * Call this on a form's raw submitted values before reading any select-backed field, so
 * `Number(values.customerId)` etc. keep working exactly as before across the whole app.
 */
export function normalizeSelectValues(values: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(values)) {
    if (val && typeof val === "object" && "value" in (val as Record<string, unknown>)) {
      normalized[key] = (val as { value: unknown }).value;
    } else {
      normalized[key] = val;
    }
  }
  return normalized;
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
