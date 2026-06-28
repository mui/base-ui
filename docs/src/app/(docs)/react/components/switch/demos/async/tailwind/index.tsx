'use client';
import * as React from 'react';
import { Switch } from '@base-ui/react/switch';

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
    <div className="flex flex-col items-start gap-2">
      <label className="flex items-center gap-2 text-sm font-normal text-neutral-950 dark:text-white">
        <Switch.Root
          checked={checked}
          checkedChangeAction={updateChecked}
          className="flex h-5 w-9 shrink-0 border border-neutral-950 bg-white p-0.5 transition-colors duration-150 ease-[ease] dark:border-white dark:bg-neutral-950 data-checked:bg-neutral-950 dark:data-checked:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:focus-visible:outline-white"
        >
          <Switch.Thumb className="size-3.5 bg-neutral-950 transition-[translate,background-color] duration-150 ease-[ease] data-checked:translate-x-4 data-checked:bg-white dark:bg-white dark:data-checked:bg-neutral-950" />
        </Switch.Root>
        Marketing emails
      </label>

      <div
        className="min-h-11 text-sm leading-5 text-neutral-800 dark:text-neutral-200"
        aria-live="polite"
      >
        {isPending ? (
          <span className="flex items-center gap-1.5">
            <SpinnerIcon className="animate-spin" aria-hidden />
            Saving...
          </span>
        ) : null}
        <p className="m-0">Saved setting: {checked ? 'On' : 'Off'}</p>
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
