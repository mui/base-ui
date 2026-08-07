'use client';
import * as React from 'react';
import { Button } from '@base-ui/react/button';

interface SaveState {
  savedAt: string | null;
}

const initialState: SaveState = {
  savedAt: null,
};

async function saveProfile(): Promise<SaveState> {
  await wait(1000);

  return {
    savedAt: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  };
}

export default function ExampleButton() {
  const [state, saveAction, isPending] = React.useActionState(saveProfile, initialState);
  let status = 'No changes saved';

  if (isPending) {
    status = 'Saving changes...';
  } else if (state.savedAt) {
    status = `Saved at ${state.savedAt}`;
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        className="flex h-8 items-center justify-center gap-2 rounded-none border border-neutral-950 bg-white px-3 text-sm leading-none whitespace-nowrap font-normal text-neutral-950 select-none hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white data-disabled:border-neutral-500 data-disabled:text-neutral-500 disabled:border-neutral-500 disabled:text-neutral-500 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 dark:data-disabled:border-neutral-400 dark:data-disabled:text-neutral-400"
        clickAction={() => saveAction()}
        disabled={isPending}
        focusableWhenDisabled
      >
        {isPending ? 'Saving profile' : 'Save profile'}
      </Button>
      <p
        className="m-0 text-sm leading-5 text-neutral-600 dark:text-neutral-400"
        aria-live="polite"
      >
        {status}
      </p>
    </div>
  );
}

function wait(delay: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, delay);
  });
}
