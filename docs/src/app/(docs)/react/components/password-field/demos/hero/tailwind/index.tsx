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
      <PasswordField.Root id={id}>
        <PasswordField.Group className="box-border flex h-8 w-full items-center border border-neutral-950 bg-white text-neutral-950 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:-outline-offset-1 has-[input:focus-visible]:outline-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white dark:has-[input:focus-visible]:outline-white">
          <PasswordField.Input
            placeholder="Enter your password"
            className="box-border h-full min-w-0 flex-1 rounded-none border-none bg-transparent px-2 py-0 text-sm font-normal any-pointer-coarse:text-base text-inherit placeholder:text-neutral-500 focus:outline-none autofill:bg-clip-text dark:placeholder:text-neutral-400 [&::-ms-reveal]:hidden"
          />
          <PasswordField.Toggle
            aria-label="Show password"
            className="grid h-full aspect-square shrink-0 place-items-center rounded-none *:[grid-area:1/1] border-none bg-transparent text-inherit select-none hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 dark:focus-visible:outline-white"
          >
            <PasswordField.ToggleIndicator match="off">
              <EyeOffIcon />
            </PasswordField.ToggleIndicator>
            <PasswordField.ToggleIndicator match="on">
              <EyeIcon />
            </PasswordField.ToggleIndicator>
          </PasswordField.Toggle>
        </PasswordField.Group>
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
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1" />
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
        d="M5.854 3.733C6.503 3.485 7.219 3.333 8 3.333C12.333 3.333 14.667 8 14.667 8C14.667 8 13.996 9.341 12.707 10.585M11.537 11.537C10.571 12.188 9.388 12.667 8 12.667C3.667 12.667 1.333 8 1.333 8C1.333 8 2.411 5.844 4.463 4.463"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M9.768 9.768A2.5 2.5 0 0 1 6.232 6.232M7.646 5.525A2.5 2.5 0 0 1 10.475 8.354"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
