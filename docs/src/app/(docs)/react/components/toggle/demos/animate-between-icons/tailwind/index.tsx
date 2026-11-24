'use client';
import * as React from 'react';
import { Toggle } from '@base-ui/react/toggle';

export default function ExampleToggleAnimateBetweenIcons() {
  return (
    <Toggle.Root
      aria-label="Mute"
      className="grid size-8 place-items-center border-none rounded-none bg-transparent text-neutral-950 dark:text-white select-none *:[grid-area:1/1] hover:not-data-disabled:bg-neutral-100 dark:hover:not-data-disabled:bg-neutral-800 active:not-data-disabled:bg-neutral-200 dark:active:not-data-disabled:bg-neutral-700 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white"
    >
      <Toggle.Indicator
        match="off"
        className="transition-[opacity,scale] duration-150 data-ending-style:scale-50 data-ending-style:opacity-0 data-starting-style:scale-50 data-starting-style:opacity-0 motion-reduce:transition-none"
      >
        <VolumeIcon />
      </Toggle.Indicator>
      <Toggle.Indicator
        match="on"
        className="transition-[opacity,scale] duration-150 data-ending-style:scale-50 data-ending-style:opacity-0 data-starting-style:scale-50 data-starting-style:opacity-0 motion-reduce:transition-none"
      >
        <VolumeMutedIcon />
      </Toggle.Indicator>
    </Toggle.Root>
  );
}

function VolumeIcon(props: React.ComponentProps<'svg'>) {
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
        d="M2 6h2.5L8 3v10L4.5 10H2V6ZM10.5 6a2.5 2.5 0 0 1 0 4M12 4a5 5 0 0 1 0 8"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VolumeMutedIcon(props: React.ComponentProps<'svg'>) {
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
        d="M2 6h2.5L8 3v10L4.5 10H2V6ZM10.5 6l3 4M13.5 6l-3 4"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
