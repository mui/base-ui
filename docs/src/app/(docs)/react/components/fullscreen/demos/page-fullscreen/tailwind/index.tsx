'use client';
import * as React from 'react';
import { Fullscreen } from '@base-ui/react/fullscreen';

export default function ExampleFullscreenPage() {
  return (
    <Fullscreen.Root target={getDocumentElement}>
      <Fullscreen.Trigger className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2.5 text-[13px] font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50">
        <ExpandIcon />
        Fullscreen the page
      </Fullscreen.Trigger>
    </Fullscreen.Root>
  );
}

function getDocumentElement() {
  if (typeof document === 'undefined') {
    return null;
  }
  return document.documentElement;
}

function ExpandIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" {...props}>
      <path d="M2 5V2H5M10 7V10H7M5 10H2V7M7 2H10V5" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}
