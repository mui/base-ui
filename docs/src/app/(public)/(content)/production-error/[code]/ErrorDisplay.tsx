'use client';
import * as React from 'react';
import { useSearchParams } from 'next/navigation';

export interface ErrorDisplayProps {
  msg: string;
}

function ErrorMessageWithArgs({ msg }: ErrorDisplayProps) {
  const searchParams = useSearchParams();
  return React.useMemo(() => {
    const args = searchParams.getAll('args[]');
    let index = 0;
    return msg.replace(/%s/g, () => {
      const replacement = args[index];
      index += 1;
      return replacement === undefined ? '[missing argument]' : replacement;
    });
  }, [msg, searchParams]);
}

export default function ErrorDisplay({ msg }: ErrorDisplayProps) {
  const fallbackMsg = React.useMemo(() => msg.replace(/%s/g, '…'), [msg]);

  return (
    <code>
      <React.Suspense fallback={fallbackMsg}>
        <ErrorMessageWithArgs msg={msg} />
      </React.Suspense>
    </code>
  );
}
