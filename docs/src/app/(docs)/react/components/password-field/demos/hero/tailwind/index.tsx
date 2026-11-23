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
      <PasswordField.Root
        id={id}
        className="box-border flex h-8 w-full items-center border border-neutral-950 bg-white text-neutral-950 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:-outline-offset-1 has-[input:focus-visible]:outline-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white dark:has-[input:focus-visible]:outline-white"
      >
        <PasswordField.Input
          placeholder="Enter your password"
          className="box-border h-full min-w-0 flex-1 rounded-none border-none bg-transparent px-2 py-0 text-sm font-normal any-pointer-coarse:text-base text-inherit placeholder:text-neutral-500 focus:outline-none autofill:bg-clip-text dark:placeholder:text-neutral-400 [&::-ms-reveal]:hidden"
        />
        <PasswordField.Toggle
          aria-label="Show password"
          className="grid h-full aspect-square shrink-0 place-items-center rounded-none border-none bg-transparent text-inherit select-none hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 dark:focus-visible:outline-white"
        >
          <PasswordField.ToggleIndicator className="group">
            <PadlockIcon className="block" />
          </PasswordField.ToggleIndicator>
        </PasswordField.Toggle>
      </PasswordField.Root>
    </div>
  );
}

function PadlockIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
      <path
        d="M5.5 10V5.5a2.5 2.5 0 0 1 5 0V7"
        stroke="currentColor"
        strokeWidth="1"
        className="transition-transform duration-150 group-data-visible:-translate-y-0.5 motion-reduce:transition-none"
      />
      <rect x="3" y="7" width="10" height="7" fill="currentColor" />
    </svg>
  );
}
