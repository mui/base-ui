'use client';
import * as React from 'react';
import { Input } from '@base-ui/react/input';

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
    <div className="flex flex-col items-start gap-2">
      <label className="flex flex-col items-start gap-1 text-sm font-bold text-neutral-950 dark:text-white">
        Name
        <Input
          value={name}
          valueChangeAction={updateName}
          className="h-8 w-40 border border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 px-2 text-sm any-pointer-coarse:text-base font-normal text-neutral-950 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-2 focus:-outline-offset-1 focus:outline-neutral-950 dark:focus:outline-white"
        />
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
        <p className="m-0">Saved name: {name}</p>
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
