"use client";

import { Popover } from "@base-ui-components/react/popover";
import {
  type ComponentProps,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { cn } from "#/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CoachMarkStep {
  /** Unique identifier for the step. */
  id: string | number;
  /**
   * CSS selector for the anchor element.
   * When omitted the popover renders in the centre of the viewport.
   */
  targetSelector?: string;
  /** Step heading text. */
  title: string;
  /** Step body description. */
  description: string;
  /** Optional illustration shown above the title. */
  image?: ReactNode;
}

interface CoachMarkProps {
  /** Ordered list of onboarding steps. */
  steps: CoachMarkStep[];
  /** Zero-based index of the currently visible step. */
  currentStep: number;
  /** Called when the user navigates to a different step. */
  onStepChange: (step: number) => void;
  /** Called when the user completes all steps. */
  onComplete: () => void;
  /** Called when the user skips the tour. */
  onSkip: () => void;
  /** Extra class names forwarded to the popup card. */
  className?: string;
  /** Extra props forwarded to the Popover.Positioner. */
  positionerProps?: ComponentProps<typeof Popover.Positioner>;
}

// ---------------------------------------------------------------------------
// CoachMark
// ---------------------------------------------------------------------------

/**
 * CoachMark — sequential onboarding hints anchored to target UI elements.
 *
 * Renders one Popover per active step. Focus is trapped inside the popup.
 * Pressing Escape calls `onSkip`.
 *
 * @example
 * const [step, setStep] = useState(0);
 * const [open, setOpen] = useState(true);
 *
 * if (!open) return null;
 *
 * <CoachMark
 *   steps={steps}
 *   currentStep={step}
 *   onStepChange={setStep}
 *   onComplete={() => setOpen(false)}
 *   onSkip={() => setOpen(false)}
 * />
 */
function CoachMark({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  onSkip,
  className,
  positionerProps,
}: CoachMarkProps) {
  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const firstFocusableRef = useRef<HTMLButtonElement | null>(null);

  // Resolve the anchor element from the selector whenever the step changes.
  useEffect(() => {
    // No-op: anchor resolution happens in the Trigger ref callback below.
  }, []);

  const handlePrev = useCallback(() => {
    if (!isFirst) {
      onStepChange(currentStep - 1);
    }
  }, [currentStep, isFirst, onStepChange]);

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete();
    } else {
      onStepChange(currentStep + 1);
    }
  }, [currentStep, isLast, onComplete, onStepChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onSkip();
      }
    },
    [onSkip],
  );

  if (!step) {
    return null;
  }

  const total = steps.length;

  return (
    <Popover.Root open>
      {/*
       * The anchor element is the resolved DOM node when a targetSelector is
       * provided, or a centred virtual anchor when omitted.
       * Base UI Popover.Trigger doubles as the anchor reference when rendered
       * inside the tree; here we use a zero-size hidden trigger so that Base UI
       * can still calculate positioning while the real anchor is external.
       */}
      <Popover.Trigger
        aria-hidden
        tabIndex={-1}
        className="pointer-events-none fixed left-1/2 top-1/2 size-0 -translate-x-1/2 -translate-y-1/2 opacity-0"
        ref={(node: HTMLButtonElement | null) => {
          if (node && step.targetSelector) {
            const target = document.querySelector(step.targetSelector);
            if (target) {
              // Override getBoundingClientRect so Base UI positions against
              // the real target instead of the hidden trigger.
              node.getBoundingClientRect = () => target.getBoundingClientRect();
            }
          }
        }}
      />

      <Popover.Portal>
        <Popover.Positioner
          sideOffset={12}
          {...positionerProps}
          className={cn("z-[9999]", positionerProps?.className)}
        >
          <Popover.Popup
            aria-label={step.title}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-80 rounded-xl bg-surface-white p-5 shadow-3",
              "border border-divider-gray-light",
              "outline-none",
              "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
              "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
              "transition-[opacity,transform] duration-200 ease-out",
              className,
            )}
          >
            {/* Optional illustration */}
            {step.image && (
              <div className="mb-4 overflow-hidden rounded-lg">
                {step.image}
              </div>
            )}

            {/* Step counter */}
            <p className="mb-1 text-body-xs text-fg-subtle" aria-live="polite">
              {currentStep + 1} / {total}
            </p>

            {/* Title */}
            <h3 className="mb-2 text-heading-xs text-fg-basic">{step.title}</h3>

            {/* Description */}
            <p className="mb-5 text-body-sm text-fg-neutral">
              {step.description}
            </p>

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-2">
              {/* Skip — always visible */}
              <button
                type="button"
                onClick={onSkip}
                className={cn(
                  "text-label-sm text-fg-subtle",
                  "rounded-sm px-1 py-0.5",
                  "underline-offset-2 hover:underline",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-primary",
                )}
              >
                건너뛰기
              </button>

              <div className="flex items-center gap-2">
                {/* Previous — hidden on first step */}
                {!isFirst && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className={cn(
                      "rounded-md-lg px-4 py-2 text-label-sm font-bold",
                      "bg-btn-tertiary-fill text-fg-basic",
                      "outline outline-1 outline-btn-tertiary-border",
                      "hover:bg-btn-tertiary-fill-hover",
                      "active:bg-btn-tertiary-fill-pressed",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-primary",
                      "transition-colors",
                    )}
                  >
                    이전
                  </button>
                )}

                {/* Next / Complete */}
                <button
                  ref={firstFocusableRef}
                  type="button"
                  onClick={handleNext}
                  className={cn(
                    "rounded-md-lg px-4 py-2 text-label-sm font-bold",
                    "bg-btn-primary-fill text-fg-inverse-static",
                    "hover:bg-btn-primary-fill-hover",
                    "active:bg-btn-primary-fill-pressed",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-primary",
                    "transition-colors",
                  )}
                >
                  {isLast ? "완료" : "다음"}
                </button>
              </div>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

CoachMark.displayName = "CoachMark";

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { CoachMark };
export type { CoachMarkProps, CoachMarkStep };
