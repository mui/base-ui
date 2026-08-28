'use client';
import * as React from 'react';
import { Select } from '@base-ui/react/select';

const plans = [
  { label: 'Starter', value: 'starter' },
  { label: 'Pro', value: 'pro' },
  { label: 'Enterprise', value: 'enterprise' },
];

type Plan = (typeof plans)[number]['value'];

interface SavePlanPayload {
  value: Plan | null;
  signal: AbortSignal;
}

async function savePlan(previousPlan: Plan | null, payload: SavePlanPayload) {
  try {
    await wait(1000, payload.signal);
  } catch {
    return previousPlan;
  }

  return payload.value;
}

export default function ExampleSelect() {
  const abortRef = React.useRef<AbortController | null>(null);
  const [plan, dispatchPlanChange, isPending] = React.useActionState(
    savePlan,
    'starter' as Plan | null,
  );
  const savedPlan = getPlanLabel(plan);

  async function changePlan(nextPlan: Plan | null) {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    await dispatchPlanChange({
      value: nextPlan,
      signal: abortRef.current.signal,
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Select.Root value={plan} valueChangeAction={changePlan} items={plans}>
        <Select.Label className="cursor-default text-sm font-bold text-neutral-950 dark:text-white">
          Plan
        </Select.Label>
        <Select.Trigger className="flex h-8 min-w-40 items-center justify-between gap-3 pl-2 pr-1 text-sm leading-none whitespace-nowrap border border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white select-none hover:not-data-disabled:bg-neutral-100 dark:hover:not-data-disabled:bg-neutral-800 active:not-data-disabled:bg-neutral-200 dark:active:not-data-disabled:bg-neutral-700 data-disabled:border-neutral-500 data-disabled:text-neutral-500 disabled:border-neutral-500 disabled:text-neutral-500 dark:data-disabled:border-neutral-400 dark:data-disabled:text-neutral-400 data-popup-open:bg-neutral-100 dark:data-popup-open:bg-neutral-800 font-normal focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white">
          <Select.Value className="data-placeholder:text-neutral-500 dark:data-placeholder:text-neutral-400" />
          <Select.Icon>
            <CaretUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className="outline-hidden select-none z-10" sideOffset={4}>
            <Select.Popup className="group min-w-[var(--anchor-width)] origin-[var(--transform-origin)] bg-clip-padding border border-neutral-950 bg-white text-neutral-950 outline-hidden shadow-[0.25rem_0.25rem_0] shadow-black/12 transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-[side=none]:translate-y-px data-[side=none]:min-w-[calc(var(--anchor-width)+1.75rem)] data-[side=none]:data-ending-style:transition-none data-starting-style:scale-[0.98] data-starting-style:opacity-0 data-[side=none]:data-starting-style:scale-100 data-[side=none]:data-starting-style:opacity-100 data-[side=none]:data-starting-style:transition-none dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none">
              <Select.List className="relative py-1 scroll-py-6 overflow-y-auto max-h-[var(--available-height)]">
                {plans.map(({ label, value }) => (
                  <Select.Item
                    key={value}
                    value={value}
                    className="grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 py-1.5 pr-4 pl-2.5 text-sm outline-hidden select-none data-highlighted:bg-neutral-950 data-highlighted:text-white dark:data-highlighted:bg-white dark:data-highlighted:text-neutral-950"
                  >
                    <Select.ItemIndicator className="col-start-1">
                      <CheckIcon />
                    </Select.ItemIndicator>
                    <Select.ItemText className="col-start-2">{label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      <div
        className="flex max-w-64 flex-col items-start gap-1 text-sm leading-5 text-neutral-600 dark:text-neutral-400"
        aria-live="polite"
      >
        {isPending ? <span>Saving...</span> : null}
        <p className="m-0">Saved plan: {savedPlan}</p>
      </div>
    </div>
  );
}

function getPlanLabel(value: Plan | null) {
  return plans.find((plan) => plan.value === value)?.label ?? 'None';
}

function wait(delay: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }

    const timeout = setTimeout(() => {
      signal.removeEventListener('abort', handleAbort);
      resolve();
    }, delay);

    function handleAbort() {
      clearTimeout(timeout);
      reject(signal.reason);
    }

    signal.addEventListener('abort', handleAbort, { once: true });
  });
}

function CaretUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M11 10H5l3 3.5zm0-4H5l3-3.5z" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m2.5 8.5 4 4 7-9" />
    </svg>
  );
}
