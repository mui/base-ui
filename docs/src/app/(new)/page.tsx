import { Logo } from 'docs/src/components/Logo';
import { Metadata } from 'next/types';
import * as React from 'react';

export default function Page() {
  return (
    <div className="m-auto px-7 pb-[min(5rem,max(3.5rem,10vh))] pt-7 md:pt-12">
      <div className="max-w-[420px]">
        <Logo className="mb-8 ml-px" />
        <h1 className="mb-2 text-balance text-2xl font-medium">
          Unstyled React components for building accessible user interfaces.
        </h1>
        <p className="text-color-gray mb-6 text-pretty">
          From the creators of Radix, Floating UI, and MUI.
        </p>

        <span className="text-color-gray border-color-border -ml-[px] relative cursor-default select-none rounded-full border px-1.5 pb-[2px] pt-[1.5px] text-xs">
          Coming soon
        </span>
      </div>
    </div>
  );
}

const description =
  'Unstyled UI components for building accessible user interfaces.';

export const metadata: Metadata = {
  description,
  twitter: {
    description,
  },
  openGraph: {
    description,
  },
};
