import * as React from 'react';
import { Fullscreen } from '@base-ui/react/fullscreen';

export default function ExampleFullscreenPortal() {
  return (
    <Fullscreen.Root>
      <Fullscreen.Trigger className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2.5 text-[13px] font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50">
        <ExpandIcon />
        Open fullscreen
      </Fullscreen.Trigger>
      <Fullscreen.Portal>
        <Fullscreen.Container className="relative flex h-screen w-screen flex-col items-center justify-center gap-2 bg-gray-50 bg-[radial-gradient(circle_at_50%_30%,var(--color-gray-100)_0%,transparent_70%)] text-gray-900">
          <h2 className="m-0 text-lg leading-7 font-semibold tracking-tight">
            Mounted only when open
          </h2>
          <p className="m-0 text-[15px] leading-6 text-gray-600">
            This content is only mounted while in fullscreen.
          </p>
          <Fullscreen.Close className="absolute top-4 right-4 inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2.5 text-[13px] font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
            <CloseIcon />
            Close
          </Fullscreen.Close>
        </Fullscreen.Container>
      </Fullscreen.Portal>
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
