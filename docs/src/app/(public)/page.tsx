import * as React from 'react';
import type { Metadata } from 'next';
import { Link } from 'docs/src/components/Link';
import { ArrowRightIcon } from 'docs/src/icons/ArrowRightIcon';
import { Logo } from 'docs/src/components/Logo';
import './page.css';

export default function Homepage() {
  return (
    <React.Fragment>
      {/* Set the Site name for Google results. https://developers.google.com/search/docs/appearance/site-names */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Base UI',
            url: 'https://base-ui.com',
          }),
        }}
      />
      <div className="HomepageRoot">
        <div className="HomepageContent">
          <Logo className="mb-8 ml-px" aria-label="Base UI" />
          <h1 className="HomepageHeading">
            Unstyled UI components for building accessible web apps and design
            systems.
          </h1>
          <p className="HomepageCaption">
            From the creators of Radix, Floating&nbsp;UI, and Material&nbsp;UI.
          </p>
          <Link
            className="-m-1 inline-flex items-center gap-1 p-1"
            href="/react/overview/quick-start"
          >
            Documentation <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </React.Fragment>
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
