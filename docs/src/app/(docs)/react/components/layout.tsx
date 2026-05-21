import type { Metadata } from 'next/types';
import type * as React from 'react';

export default function ComponentsLayout({ children }: React.PropsWithChildren) {
  return children;
}

export const metadata: Metadata = {
  title: {
    template: '%s React Component · Base UI',
    default: 'Components',
  },
};
