'use client';
import * as React from 'react';
import { Button } from '@base-ui/react/button';
import styles from './index.module.css';

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
    <div className={styles.Field}>
      <Button
        className={styles.Button}
        clickAction={() => saveAction()}
        disabled={isPending}
        focusableWhenDisabled
      >
        {isPending ? 'Saving profile' : 'Save profile'}
      </Button>
      <p className={styles.Status} aria-live="polite">
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
