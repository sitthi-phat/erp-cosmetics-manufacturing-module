import { message } from "antd";

/**
 * Central Thai-facing notification surface (ECP-036). Business/error-handling code calls
 * `Notify.error(...)` etc. instead of `antd.message` directly, keeping the antd dependency
 * confined to ui/ (ADR-008 rev.2).
 */
export const Notify = {
  success(text: string): void {
    void message.success(text);
  },
  error(text: string): void {
    void message.error(text);
  },
  warning(text: string): void {
    void message.warning(text);
  },
  info(text: string): void {
    void message.info(text);
  }
};
