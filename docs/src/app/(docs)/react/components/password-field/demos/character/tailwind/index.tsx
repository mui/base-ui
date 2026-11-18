'use client';
import * as React from 'react';
import { PasswordFieldPreview as PasswordField } from '@base-ui/react/password-field';

export default function ExamplePasswordFieldCharacter() {
  const id = React.useId();
  return (
    <PasswordField.Root id={id} className="flex w-full max-w-64 flex-col items-start gap-1">
      <PasswordField.Indicator
        keepMounted
        className="group mb-2 block self-center text-neutral-950 dark:text-white"
      >
        <Character />
      </PasswordField.Indicator>
      <label htmlFor={id} className="text-sm font-bold text-neutral-950 dark:text-white">
        Password
      </label>
      <div className="box-border flex h-8 w-full items-center border border-neutral-950 bg-white text-neutral-950 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:-outline-offset-1 has-[input:focus-visible]:outline-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white dark:has-[input:focus-visible]:outline-white">
        <PasswordField.Input
          placeholder="Enter your password"
          className="box-border h-full min-w-0 flex-1 rounded-none border-none bg-transparent px-2 py-0 text-sm font-normal any-pointer-coarse:text-base text-inherit placeholder:text-neutral-500 focus:outline-none autofill:bg-clip-text dark:placeholder:text-neutral-400 [&::-ms-reveal]:hidden"
        />
        <PasswordField.Toggle
          aria-label="Show password"
          className="grid h-full aspect-square shrink-0 place-items-center rounded-none border-none bg-transparent text-inherit select-none *:[grid-area:1/1] hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 dark:focus-visible:outline-white"
        >
          <PasswordField.Indicator match="hidden">
            <EyeOffIcon />
          </PasswordField.Indicator>
          <PasswordField.Indicator match="visible">
            <EyeIcon />
          </PasswordField.Indicator>
        </PasswordField.Toggle>
      </div>
    </PasswordField.Root>
  );
}

// Covers its eyes while the password is masked.
function Character() {
  const hand =
    '-translate-y-[26px] transition-transform duration-200 ease-[steps(3)] group-data-visible:translate-y-0 motion-reduce:transition-none';
  return (
    <svg width="72" height="56" viewBox="0 0 72 56" fill="none" className="block">
      <rect
        x="15"
        y="5"
        width="42"
        height="50"
        stroke="currentColor"
        strokeWidth="2"
        className="fill-white dark:fill-neutral-950"
      />
      <rect x="24" y="21" width="7" height="7" fill="currentColor" />
      <rect x="41" y="21" width="7" height="7" fill="currentColor" />
      <rect x="31" y="38" width="10" height="2" fill="currentColor" />
      <Hand x={10} className={hand} />
      <Hand x={40} className={hand} />
    </svg>
  );
}

function Hand({ x, className }: { x: number; className: string }) {
  return (
    <g className={className}>
      <rect x={x} y="44" width="22" height="12" fill="currentColor" />
      <path
        d={`M${x + 5.5} 44v6M${x + 11} 44v6M${x + 16.5} 44v6`}
        strokeWidth="1"
        className="stroke-white dark:stroke-neutral-950"
      />
    </g>
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
