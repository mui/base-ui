import * as React from 'react';
import type { Metadata, Viewport } from 'next';
import { Link } from 'docs/src/components/Link';
import { ArrowRightIcon } from 'docs/src/icons/ArrowRightIcon';
import { Logo } from 'docs/src/components/Logo';

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
            name: 'Base UI',
            url: 'https://base-ui.com',
          }),
        }}
      />
      <div className="HomepageRoot">
        <div>
          <Logo aria-label="Base UI" />
          <h1 className="Text size-3 bp2:size-4">
            Unstyled UI components for building accessible user interfaces
          </h1>
          <p className="Text">
            From the creators of Radix, Floating&nbsp;UI, and Material&nbsp;UI.
          </p>
          <Link className="" href="/react/overview/quick-start">
            Documentation <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </React.Fragment>
  );
}

const description = 'Unstyled UI components for building accessible web apps and design systems.';

export const metadata: Metadata = {
  description,
  twitter: {
    description,
  },
  openGraph: {
    description,
  },
};

// Custom viewport for the homepage because on mobile it doesn't have a header
export const viewport: Viewport = {
  themeColor: [
    // Desktop Safari page background
    {
      media: '(prefers-color-scheme: light) and (min-width: 1024px)',
      color: 'oklch(95% 0.25% 264)',
    },
    {
      media: '(prefers-color-scheme: dark) and (min-width: 1024px)',
      color: 'oklch(25% 1% 264)',
    },

    // Mobile Safari header background (match the page content)
    {
      media: '(prefers-color-scheme: light)',
      color: '#FFF',
    },
    {
      media: '(prefers-color-scheme: dark)',
      color: '#000',
    },
  ],
};
