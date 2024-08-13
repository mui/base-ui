import * as React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <h1 className="Text size-8">
        Accessible, composable, unstyled UI components for building high-quality React apps,
        websites, and design systems.
      </h1>
      <Link href="/base-ui-react/getting-started/overview">Documentation</Link>
    </div>
  );
}
