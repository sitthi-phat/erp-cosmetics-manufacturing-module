import type { ThemeConfig } from "antd";

/**
 * Single place that owns design tokens (ADR-008 rev.2 §5). Swapping UI libraries later means
 * re-mapping these tokens to the new library's theme system in one file.
 */
export const theme: ThemeConfig = {
  token: {
    colorPrimary: "#1677ff",
    borderRadius: 6,
    fontSize: 14
  }
};
