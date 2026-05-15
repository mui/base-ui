import * as React from 'react';

export function NpmIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentColor" width="16" height="16" viewBox="0 0 16 16" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M1 1h14v14H1zM4 4h8v8H4zM7.5 6h3v6h-3z" />
    </svg>
  );
}
