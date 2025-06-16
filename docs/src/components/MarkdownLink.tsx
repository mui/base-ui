'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { MarkdownIcon } from '../icons/MarkdownIcon';

export function MarkdownLink() {
  const pathname = usePathname();

  return (
    <a
      href={`${pathname}.md`}
      className="inline-flex items-center text-base text-gray-500 transition-colors hover:text-gray-800"
      aria-label="View markdown source"
    >
      <MarkdownIcon />
    </a>
  );
}
