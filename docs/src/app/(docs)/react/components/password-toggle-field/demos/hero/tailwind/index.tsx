'use client';
import * as React from 'react';
import { PasswordToggleFieldPreview as PasswordToggleField } from '@base-ui/react/password-toggle-field';

export default function ExamplePasswordToggleField() {
  const id = React.useId();
  return (
    <div className="flex w-full max-w-64 flex-col items-start gap-1">
      <label htmlFor={id} className="text-sm font-bold text-neutral-950 dark:text-white">
        Password
      </label>
      <PasswordToggleField.Root className="relative flex w-full items-center">
        <PasswordToggleField.Input
          id={id}
          placeholder="Enter your password"
          className="box-border h-8 w-full border border-neutral-950 bg-white py-0 pr-8 pl-2 text-sm font-normal any-pointer-coarse:text-base text-neutral-950 placeholder:text-neutral-500 focus:outline-2 focus:-outline-offset-1 focus:outline-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white dark:placeholder:text-neutral-400 dark:focus:outline-white"
        />
        <PasswordToggleField.Toggle
          aria-label="Show password"
          className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-none border-none bg-transparent text-neutral-950 select-none hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:text-white dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 dark:focus-visible:outline-white"
          render={(props, state) => (
            <button type="button" {...props}>
              {state.pressed ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          )}
        />
      </PasswordToggleField.Root>
    </div>
  );
}

function EyeIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="block" {...props}>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function EyeOffIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="block" {...props}>
      <path
        d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.4 5.2A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.4 3.3M6.2 6.2A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 3-.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
