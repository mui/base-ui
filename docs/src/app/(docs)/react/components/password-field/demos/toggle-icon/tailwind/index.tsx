'use client';
import * as React from 'react';
import { PasswordFieldPreview as PasswordField } from '@base-ui/react/password-field';

export default function ExamplePasswordFieldToggleIcon() {
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
          className="grid h-full aspect-square shrink-0 place-items-center rounded-none *:[grid-area:1/1] border-none bg-transparent text-inherit select-none hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 dark:focus-visible:outline-white"
        >
          <PasswordField.ToggleIndicator match="password-masked">
            <EyeOffIcon />
          </PasswordField.ToggleIndicator>
          <PasswordField.ToggleIndicator match="password-visible">
            <EyeIcon />
          </PasswordField.ToggleIndicator>
        </PasswordField.Toggle>
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
  const maskId = React.useId();
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
        <rect width="16" height="16" fill="white" />
        <path d="M2.53 1.47l12 12" stroke="black" strokeWidth="1.5" />
      </mask>
      <g mask={`url(#${maskId})`}>
        <path
          d="M1.333 8s2.334-4.667 6.667-4.667S14.667 8 14.667 8 12.333 12.667 8 12.667 1.333 8 1.333 8Z"
          stroke="currentColor"
          strokeWidth="1"
        />
        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1" />
      </g>
      <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
