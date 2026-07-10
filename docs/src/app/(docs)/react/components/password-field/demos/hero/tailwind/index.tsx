'use client';
import * as React from 'react';
import { PasswordFieldPreview as PasswordField } from '@base-ui/react/password-field';

export default function ExamplePasswordField() {
  const id = React.useId();
  return (
    <div className="flex w-full max-w-64 flex-col items-start gap-1">
      <label htmlFor={id} className="text-sm font-bold text-neutral-950 dark:text-white">
        Password
      </label>
      <PasswordField.Root className="box-border flex h-8 w-full items-center border border-neutral-950 bg-white text-neutral-950 focus-within:outline-2 focus-within:-outline-offset-1 focus-within:outline-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white dark:focus-within:outline-white">
        <PasswordField.Input
          id={id}
          placeholder="Enter your password"
          className="box-border h-full min-w-0 flex-1 rounded-none border-none bg-transparent px-2 py-0 text-sm font-normal any-pointer-coarse:text-base text-inherit placeholder:text-neutral-500 focus:outline-none dark:placeholder:text-neutral-400"
        />
        <PasswordField.Toggle
          aria-label="Show password"
          className="flex h-full aspect-square shrink-0 items-center justify-center rounded-none border-none bg-transparent text-inherit select-none hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 dark:focus-visible:outline-white"
          render={(props, state) => (
            <button type="button" {...props}>
              {state.pressed ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          )}
        />
      </PasswordField.Root>
    </div>
  );
}

function EyeIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path
        d="M1.333 8s2.334-4.667 6.667-4.667S14.667 8 14.667 8 12.333 12.667 8 12.667 1.333 8 1.333 8Z"
        stroke="currentColor"
        strokeWidth="1"
      />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function EyeOffIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path
        d="M2 2l12 12M7.067 7.067a2 2 0 0 0 2.8 2.8M6.267 3.467A6.467 6.467 0 0 1 8 3.333c4.333 0 6.667 4.667 6.667 4.667a11.333 11.333 0 0 1-1.6 2.2M4.133 4.133A11.333 11.333 0 0 0 1.333 8s2.334 4.667 6.667 4.667a6.467 6.467 0 0 0 2-.334"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}
