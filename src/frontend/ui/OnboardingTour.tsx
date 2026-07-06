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

/**
 * ECP-034 AC2: first-login guidance, no separate manual required.
 *
 * DEF-07 fix, corrected (DevOps re-verify, 2026-07-07): the first attempt (`mask={false}` alone)
 * was NOT sufficient - confirmed by re-running `npx playwright test` and inspecting
 * `@rc-component/tour`'s `Mask.js` source directly: the mask wrapper's `pointerEvents` is only
 * set to `'none'` when the step has a resolved `target` position (`pos && !disabledInteraction
 * ? 'none' : 'auto'`). With NO target at all (our previous usage), `pos` is falsy, so the
 * full-viewport wrapper div gets `pointer-events: auto` and blocks every click on the page
 * REGARDLESS of the `mask`/`showMask` prop - `mask={false}` only skips rendering the visual `
 * <svg>` dimming, not the underlying blocking div. The actual fix needs a truthy `target` so the
 * library takes the "has a target" branch: default to `document.body` when the caller doesn't
 * supply a specific `targetRef`, which (combined with `mask={false}`, so no darkening/cutout
 * `<svg>` renders at all) yields a fully non-blocking floating tooltip - confirmed by re-running
 * `npx playwright test` and watching `nav-po-list` become clickable immediately after login.
 */
export function OnboardingTour({ open, steps, onClose }: OnboardingTourProps) {
  const tourSteps: TourProps["steps"] = steps.map((s) => ({
    title: s.title,
    description: s.description,
    target: s.targetRef ? () => s.targetRef!.current! : () => document.body
  }));
  return <Tour open={open} steps={tourSteps} onClose={onClose} mask={false} />;
}
