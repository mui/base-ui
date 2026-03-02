'use client';
import { usePathname } from 'next/navigation';
import { MarkdownIcon } from '../../icons/MarkdownIcon';

export function MarkdownLink() {
  const pathname = usePathname();

  return (
    <a
      href={`${pathname}.md`}
      className="MarkdownLinkAnchor"
      aria-label="View markdown source"
      rel="alternate"
      type="text/markdown"
    >
      <span className="MarkdownLink">
        <MarkdownIcon />
        View as Markdown
      </span>
    </a>
  );
}
