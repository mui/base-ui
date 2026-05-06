import * as React from 'react';
import { Fullscreen } from '@base-ui/react/fullscreen';

export default function ExampleFullscreen() {
  return (
    <Fullscreen.Root>
      <Fullscreen.Container className="relative flex aspect-[16/10] w-72 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 bg-[radial-gradient(circle_at_50%_30%,var(--color-gray-100)_0%,transparent_70%)] text-gray-900 data-[fullscreen]:aspect-auto data-[fullscreen]:h-screen data-[fullscreen]:w-screen data-[fullscreen]:rounded-none data-[fullscreen]:border-transparent">
        <p className="absolute top-2.5 left-3 m-0 text-xs leading-4 tracking-wider text-gray-500 uppercase data-[fullscreen]:hidden">
          Preview
        </p>
        <span className="flex items-center gap-3 text-[15px] leading-6 font-medium">
          <span className="size-2 rounded-full bg-blue-800" aria-hidden="true" />
          Live broadcast
        </span>

        <Fullscreen.Trigger className="absolute right-2.5 bottom-2.5 inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2.5 text-[13px] font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[fullscreen]:hidden">
          <ExpandIcon />
          Enter fullscreen
        </Fullscreen.Trigger>
        <Fullscreen.Close className="absolute top-2.5 right-2.5 inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2.5 text-[13px] font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 data-[not-fullscreen]:hidden">
          <CloseIcon />
          Close
        </Fullscreen.Close>
      </Fullscreen.Container>
    </Fullscreen.Root>
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
