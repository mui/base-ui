'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { MarkdownIcon } from '../../icons/MarkdownIcon';

export function MarkdownLink() {
  const pathname = usePathname();

  return (
    <a
      href={`${pathname}.md`}
      className="MarkdownLink"
      aria-label="View markdown source"
      rel="alternate"
      type="text/markdown"
    >
      <MarkdownIcon />
      View as Markdown
    </a>
  );
}
