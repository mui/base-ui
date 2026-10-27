'use client';
import * as React from 'react';
import { usePathname } from 'next/navigation';
import { MarkdownIcon } from '../../icons/MarkdownIcon';

export function MarkdownLink() {
  const pathname = usePathname();
  const markdownUrl = `${pathname}.md`;

  return (
    <React.Fragment>
      {/* Hoisted to <head> by React so crawlers and AI agents discover the Markdown twin */}
      <link rel="alternate" type="text/markdown" href={markdownUrl} />
      <a
        href={markdownUrl}
        className="SubtitleLink"
        aria-label="View markdown source"
        rel="alternate"
        type="text/markdown"
      >
        <span className="SubtitleLinkText">
          <MarkdownIcon />
          View as Markdown
        </span>
      </a>
    </React.Fragment>
  );
}
