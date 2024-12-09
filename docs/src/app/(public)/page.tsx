import * as React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import 'docs/src/styles.css';

export default function Home() {
  return (
    <div className="flex h-dvh w-dvh items-center justify-center">
      <Link className="Link Text s-4" href="/react/components/accordion">
        Documentation
      </Link>
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
