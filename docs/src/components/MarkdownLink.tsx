'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { MarkdownIcon } from '../icons/MarkdownIcon';

export function MarkdownLink() {
  const pathname = usePathname();

  return (
    <a
      href={`${pathname}.md`}
      className="text-base text-gray-500 transition-colors hover:text-gray-800 inline-flex items-center"
      aria-label="View markdown source"
    >
      <MarkdownIcon />
    </a>
  );
}
