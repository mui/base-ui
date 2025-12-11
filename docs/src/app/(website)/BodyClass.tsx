'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

export function BodyClass() {
  const pathname = usePathname();

  React.useEffect(() => {
    if (pathname === '/') {
      document.body.classList.add('Body');
    } else {
      document.body.classList.remove('Body');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('Body');
    };
  }, [pathname]);

  return null;
}
