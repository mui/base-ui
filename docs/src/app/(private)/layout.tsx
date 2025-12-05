import * as React from 'react';
import 'docs/src/styles.css';
import './layout.css';
import { Metadata } from 'next';

export default function Layout({ children }: React.PropsWithChildren) {
  return children;
}

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
