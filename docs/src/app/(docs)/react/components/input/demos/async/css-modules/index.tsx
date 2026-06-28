'use client';
import * as React from 'react';
import { Input } from '@base-ui/react/input';
import styles from './index.module.css';

interface SaveNamePayload {
  value: string;
  signal: AbortSignal;
}

async function saveName(previousName: string, payload: SaveNamePayload) {
  try {
    await wait(1000, payload.signal);
  } catch {
    return previousName;
  }

  return payload.value;
}

export default function ExampleInput() {
  const abortRef = React.useRef<AbortController | null>(null);
  const [name, dispatchNameChange, isPending] = React.useActionState(saveName, 'Colm Tuite');

  async function updateName(nextName: string) {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    await dispatchNameChange({
      value: nextName,
      signal: abortRef.current.signal,
    });
  }

  return (
    <div className={styles.Field}>
      <label className={styles.Label}>
        Name
        <Input value={name} valueChangeAction={updateName} className={styles.Input} />
      </label>

      <div className={styles.Status} aria-live="polite">
        {isPending ? (
          <span className={styles.Pending}>
            <SpinnerIcon className={styles.Spinner} aria-hidden />
            Saving...
          </span>
        ) : null}
        <p className={styles.Saved}>Saved name: {name}</p>
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
