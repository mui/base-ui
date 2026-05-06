'use client';
import * as React from 'react';
import { Fullscreen } from '@base-ui/react/fullscreen';

const playerFullscreen = Fullscreen.createHandle();

export default function ExampleFullscreenDetached() {
  return (
    <div className="flex w-72 flex-col gap-2">
      <header className="flex items-center justify-between gap-3 px-0.5">
        <p className="m-0 inline-flex items-center gap-2 text-[13px] leading-5 font-medium text-gray-700">
          <span className="size-2 rounded-full bg-blue-800" aria-hidden="true" />
          Camera 01
        </p>
        <Fullscreen.Trigger
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2.5 text-[13px] font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[fullscreen]:hidden"
          handle={playerFullscreen}
        >
          <ExpandIcon />
          Enter fullscreen
        </Fullscreen.Trigger>
      </header>

      <Fullscreen.Root handle={playerFullscreen}>
        <Fullscreen.Container className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 bg-[radial-gradient(circle_at_50%_30%,var(--color-gray-100)_0%,transparent_70%)] text-gray-900 data-[fullscreen]:aspect-auto data-[fullscreen]:h-screen data-[fullscreen]:w-screen data-[fullscreen]:rounded-none data-[fullscreen]:border-transparent">
          <span className="flex items-center gap-2 text-sm leading-5 text-gray-600">
            Live broadcast
          </span>
          <Fullscreen.Close className="absolute top-2.5 right-2.5 inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2.5 text-[13px] font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 data-[not-fullscreen]:hidden">
            <CloseIcon />
            Close
          </Fullscreen.Close>
        </Fullscreen.Container>
      </Fullscreen.Root>
    </div>
  );
}

function ExpandIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" {...props}>
      <path d="M2 5V2H5M10 7V10H7M5 10H2V7M7 2H10V5" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

function CloseIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" {...props}>
      <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}
