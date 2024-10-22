import * as React from 'react';
import { Metadata } from 'next/types';
import { readFile } from 'node:fs/promises';

const description =
  'Unstyled React components for building accessible user interfaces.';

export default async function Page() {
  const logo = await readFile('public/static/logo.svg', 'utf-8');
  return (
    <div className="relative flex grow flex-col justify-between gap-10 lg:justify-center">
      <div className="flex px-7 pt-7 md:px-16 md:pt-14 lg:items-center lg:pb-[min(5rem,max(3.5rem,10vh))]">
        <div className="max-w-[26rem] 2xl:max-w-[40rem]">
          <h1 className="mb-2 text-balance text-2xl font-medium 2xl:mb-3 2xl:text-3xl">
            {description}
          </h1>
          <p className="text-color-gray mb-4 text-pretty 2xl:text-lg">
            From the creators of Radix, Floating UI, and MUI.
          </p>
          <div className="flex">
            <span className="text-color-gray border-color-border -ml-[px] relative cursor-default select-none rounded-full border px-1.5 pb-[2px] pt-[1.5px] text-xs">
              Coming soon
            </span>
          </div>
        </div>
      </div>

      <div className="mb-10 lg:hidden">
        <div
          style={{
            height: 70,
            background: 'var(--color-gridline)',
            maskImage: `url("data:image/svg+xml;utf8,${encodeURI(logo)}")`,
            maskSize: '280px 70px',
            maskPosition: '50%',
          }}
        />
        <div
          style={{
            height: 70,
            background: 'var(--color-gridline)',
            maskImage: `url("data:image/svg+xml;utf8,${encodeURI(logo)}")`,
            maskSize: '280px 70px',
            maskPosition: 'calc(50% - 140px)',
          }}
        />
      </div>

      <div
        className="hidden lg:block"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: '5rem',
          width: 280,
          background: 'var(--color-gridline)',
          maskImage: `url("data:image/svg+xml;utf8,${encodeURI(logo)}")`,
          maskSize: '280px 70px',
          maskPosition: '0 -52px',
          maskRepeat: 'repeat-y',
        }}
      />
    </div>
  );
}

export const metadata: Metadata = {
  description,
  twitter: {
    description,
  },
  openGraph: {
    description,
  },
};
