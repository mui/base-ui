import * as React from 'react';
import { Metadata } from 'next';
import { Link } from 'docs/src/components/Link';
import { ArrowRightIcon } from 'docs/src/components/icons/ArrowRightIcon';
import { Logo } from 'docs/src/components/Logo';
import './page.css';

export default function Homepage() {
  return (
    <div className="HomepageRoot">
      <div className="HomepageContent">
        <Logo className="mb-8 ml-px" aria-label="Base UI" />
        <h1 className="HomepageHeading">
          Unstyled UI components for building accessible web apps and design systems.
        </h1>
        <p className="HomepageCaption">
          From the creators of Radix, Floating UI, and Material UI.
        </p>
        <Link
          className="-m-1 inline-flex items-center gap-1 p-1"
          href="/react/components/accordion"
        >
          Documentation <ArrowRightIcon />
        </Link>
      </div>
    </div>
  );
}

const description =
  'Unstyled UI components for building accessible web apps and design systems.';

export const metadata: Metadata = {
  description,
  twitter: {
    description,
  },
  openGraph: {
    description,
  },
};
