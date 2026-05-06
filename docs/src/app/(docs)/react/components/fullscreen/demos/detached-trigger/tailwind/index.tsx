'use client';
import * as React from 'react';
import { Fullscreen } from '@base-ui/react/fullscreen';

const playerFullscreen = Fullscreen.createHandle();

export default function ExampleFullscreenDetached() {
  return (
    <div className="flex w-64 flex-col gap-3">
      <header className="flex items-center justify-end">
        <Fullscreen.Trigger
          className="inline-flex items-center gap-1.5 rounded-xs bg-gray-100 px-2 py-1 text-sm font-normal hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-blue-800 active:bg-gray-200 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[fullscreen]:hidden"
          handle={playerFullscreen}
        >
          <ExpandIcon className="size-3" />
          Enter fullscreen
        </Fullscreen.Trigger>
      </header>

      <Fullscreen.Root handle={playerFullscreen}>
        <Fullscreen.Container className="relative flex h-36 w-full items-center justify-center rounded-lg bg-gradient-to-br from-blue-300 via-gray-100 to-gray-400 text-sm text-gray-900 data-[fullscreen]:h-screen data-[fullscreen]:w-screen data-[fullscreen]:rounded-none">
          <Fullscreen.Close className="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-xs bg-white/85 px-2 py-1 text-sm font-normal hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-blue-800 active:bg-gray-200 data-[not-fullscreen]:hidden">
            <CloseIcon className="size-3" />
            Close
          </Fullscreen.Close>
        </Fullscreen.Container>
      </Fullscreen.Root>
    </div>
  );
}

function ExpandIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" {...props}>
      <path d="M2 5V2H5M10 7V10H7M5 10H2V7M7 2H10V5" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

function CloseIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" {...props}>
      <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}
