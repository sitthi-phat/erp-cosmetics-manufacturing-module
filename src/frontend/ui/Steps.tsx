import { Steps as AntSteps } from "antd";

export interface StepItem {
  title: string;
  description?: string;
}

export interface StepsProps {
  current: number;
  items: StepItem[];
}

/** Used for PO 5-step timeline (ECP-006). */
export function Steps({ current, items }: StepsProps) {
  return <AntSteps current={current} items={items} />;
}
