import * as React from 'react';
import Link from 'next/link';
import { BaseUIIcon } from 'docs-base/src/icons/BaseUI';

export default function Home() {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translateX(-50%) translateY(-50%)',
        maxWidth: 500,
      }}
    >
      <div className="mb-8">
        <BaseUIIcon />
      </div>
      <h1 className="Text size-7 mb-2">
        Unstyled UI components for building accessible web apps and design systems.
      </h1>
      <p className="Text size-5 color-gray weight-1 mb-8">
        From the creators of Radix, Floating UI, and MUI.
      </p>
      <Link className="Link Text size-4" href="/base-ui-react/getting-started/overview">
        Documentation
      </Link>
    </div>
  );
}
