'use client';
import * as React from 'react';
import { Select } from '@base-ui/react/select';
import styles from './index.module.css';

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
    <div className={styles.Field}>
      <Select.Root value={plan} valueChangeAction={changePlan} items={plans}>
        <Select.Label className={styles.Label}>Plan</Select.Label>
        <Select.Trigger className={styles.Select}>
          <Select.Value className={styles.Value} />
          <Select.Icon>
            <CaretUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className={styles.Positioner} sideOffset={4}>
            <Select.Popup className={styles.Popup}>
              <Select.List className={styles.List}>
                {plans.map(({ label, value }) => (
                  <Select.Item key={value} value={value} className={styles.Item}>
                    <Select.ItemIndicator className={styles.ItemIndicator}>
                      <CheckIcon />
                    </Select.ItemIndicator>
                    <Select.ItemText className={styles.ItemText}>{label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      <div className={styles.Status} aria-live="polite">
        {isPending ? (
          <span className={styles.Pending}>
            <SpinnerIcon className={styles.Spinner} aria-hidden />
            Saving...
          </span>
        ) : null}
        <p className={styles.Saved}>Saved plan: {savedPlan}</p>
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

function SpinnerIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
