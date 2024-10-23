import * as React from 'react';
import { Metadata } from 'next/types';
import { readFile } from 'node:fs/promises';

const description =
  'Unstyled React components for building accessible user interfaces.';

export default async function Page() {
  const logo = await readFile('public/static/logo.svg', 'utf-8');
  return (
    <div className="relative flex grow flex-col justify-between gap-10 lg:justify-center [@media(min-height:720px)]:justify-center">
      <div className="flex px-7 pt-7 md:px-16 md:pt-14 lg:items-center lg:pb-[min(10rem,max(3.5rem,10vh))]">
        <div className="grow lg:max-w-[calc(100%-280px-8rem)]">
          <h1 className="mb-2 text-balance text-3xl font-medium md:mb-5 md:text-5xl md:tracking-[-0.025em] lg:text-[max(2rem,min(4.25vw,4rem))] lg:leading-none 2xl:leading-[0.95]">
            {description}
          </h1>
          <p className="text-color-gray mb-5 text-pretty md:text-lg lg:text-2xl">
            From the creators of Radix, Floating UI, and MUI.
          </p>
          <div className="flex">
            <span className="text-color-gray border-color-border relative -ml-0.5 cursor-default select-none rounded-full border px-2.5 pb-1.5 pt-1.5 text-sm">
              Coming soon
            </span>
          </div>
        </div>
      </div>

      <div className="mb-10 lg:hidden">
        <div
          className="LogoPattern"
          style={{
            height: 70,
            background: 'var(--color-gridline)',
            maskImage: `url("data:image/svg+xml;utf8,${encodeURI(logo)}")`,
            maskSize: '280px 70px',
            maskPosition: '50%',
          }}
        />
        <div
          className="LogoPattern"
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
        className="LogoPattern hidden lg:block"
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
