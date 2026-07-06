import { Tooltip as AntTooltip } from "antd";
import type { ReactNode } from "react";

export interface TooltipProps {
  text: string;
  children: ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
  return <AntTooltip title={text}>{children}</AntTooltip>;
}
