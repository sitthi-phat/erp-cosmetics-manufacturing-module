import { Tour } from "antd";
import type { TourProps } from "antd";
import type { RefObject } from "react";

export interface OnboardingStep {
  title: string;
  description: string;
  targetRef?: RefObject<HTMLElement>;
}

export interface OnboardingTourProps {
  open: boolean;
  steps: OnboardingStep[];
  onClose: () => void;
}

/** ECP-034 AC2: first-login guidance, no separate manual required. */
export function OnboardingTour({ open, steps, onClose }: OnboardingTourProps) {
  const tourSteps: TourProps["steps"] = steps.map((s) => ({
    title: s.title,
    description: s.description,
    target: s.targetRef ? () => s.targetRef!.current! : null
  }));
  return <Tour open={open} steps={tourSteps} onClose={onClose} />;
}
