'use client';
import * as React from 'react';

// Already resolved on the server; resolves 5s after the module loads on the client.
const clientDelay: Promise<void> | null =
  typeof window === 'undefined'
    ? null
    : new Promise((resolve) => {
        setTimeout(resolve, 5000);
      });

/**
 * Suspends during hydration only, keeping the surrounding Suspense boundary dehydrated
 * (server HTML on screen) so the pre-hydration behavior stays observable for a while.
 */
export function HydrationDelay() {
  if (clientDelay) {
    React.use(clientDelay);
  }
  return null;
}
