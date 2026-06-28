'use client';
import * as React from 'react';
import { Switch } from '@base-ui/react/switch';
import styles from './index.module.css';

interface SaveSettingPayload {
  value: boolean;
  signal: AbortSignal;
}

async function saveSetting(previousChecked: boolean, payload: SaveSettingPayload) {
  try {
    await wait(1000, payload.signal);
  } catch {
    return previousChecked;
  }

  return payload.value;
}

export default function ExampleSwitch() {
  const abortRef = React.useRef<AbortController | null>(null);
  const [checked, dispatchCheckedChange, isPending] = React.useActionState(saveSetting, true);

  async function updateChecked(nextChecked: boolean) {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    await dispatchCheckedChange({
      value: nextChecked,
      signal: abortRef.current.signal,
    });
  }

  return (
    <div className={styles.Field}>
      <label className={styles.Label}>
        <Switch.Root
          checked={checked}
          checkedChangeAction={updateChecked}
          className={styles.Switch}
        >
          <Switch.Thumb className={styles.Thumb} />
        </Switch.Root>
        Marketing emails
      </label>

      <div className={styles.Status} aria-live="polite">
        {isPending ? (
          <span className={styles.Pending}>
            <SpinnerIcon className={styles.Spinner} aria-hidden />
            Saving...
          </span>
        ) : null}
        <p className={styles.Saved}>Saved setting: {checked ? 'On' : 'Off'}</p>
      </div>
    </div>
  );
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

function SpinnerIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
