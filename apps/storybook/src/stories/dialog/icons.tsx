import * as React from 'react';

/**
 * Icons shared across the behavior stories and the real-world recreations in this
 * directory (extracted so recreations/*.tsx can import them without duplicating or
 * creating a circular import with dialog.stories.tsx).
 */

export function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="round"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m2.5 2.5 11 11m-11 0 11-11" />
    </svg>
  );
}
