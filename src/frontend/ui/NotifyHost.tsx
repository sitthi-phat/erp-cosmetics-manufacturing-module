import { useEffect, useState } from "react";
import { subscribeNotify } from "./Notify";

/**
 * QA DEF-03: antd's `message` toast auto-dismisses, making it a flaky e2e target. This mirrors
 * the latest Notify call into stable `data-testid="notify-success"/"notify-error"/...` nodes
 * that stay in the DOM (last message wins) so e2e specs can assert on them reliably. Mount once
 * near the app root (see App.tsx).
 */
export function NotifyHost() {
  const [state, setState] = useState<Record<string, string>>({
    success: "",
    error: "",
    warning: "",
    info: ""
  });

  useEffect(() => {
    return subscribeNotify((kind, text) => {
      setState((prev) => ({ ...prev, [kind]: text }));
    });
  }, []);

  return (
    <div style={{ position: "fixed", bottom: -9999, left: -9999 }} aria-hidden="true">
      <div data-testid="notify-success">{state.success}</div>
      <div data-testid="notify-error">{state.error}</div>
      <div data-testid="notify-warning">{state.warning}</div>
      <div data-testid="notify-info">{state.info}</div>
    </div>
  );
}
