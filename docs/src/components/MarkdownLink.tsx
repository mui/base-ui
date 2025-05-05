'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

export function MarkdownLink() {
  const pathname = usePathname();

  return (
    <a
      href={`${pathname}.md`}
      className="text-base text-gray-500 transition-colors hover:text-gray-800"
    >
      markdown
    </a>
  );
}
