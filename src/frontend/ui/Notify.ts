import { message } from "antd";

type NotifyKind = "success" | "error" | "warning" | "info";
type Listener = (kind: NotifyKind, text: string) => void;

const listeners = new Set<Listener>();

/** Internal: NotifyHost (below) subscribes so it can mirror the latest message into a stable,
 * always-queryable DOM node - antd's own `message` toast auto-dismisses and isn't a reliable
 * e2e hook by itself (QA DEF-03). */
function emit(kind: NotifyKind, text: string): void {
  listeners.forEach((l) => l(kind, text));
}

export function subscribeNotify(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Central Thai-facing notification surface (ECP-036). Business/error-handling code calls
 * `Notify.error(...)` etc. instead of `antd.message` directly, keeping the antd dependency
 * confined to ui/ (ADR-008 rev.2).
 */
export const Notify = {
  success(text: string): void {
    void message.success(text);
    emit("success", text);
  },
  error(text: string): void {
    void message.error(text);
    emit("error", text);
  },
  warning(text: string): void {
    void message.warning(text);
    emit("warning", text);
  },
  info(text: string): void {
    void message.info(text);
    emit("info", text);
  }
};
