import * as React from 'react';
import './layout.css';

export default function Layout({ children }: React.PropsWithChildren) {
  return <React.Fragment>{children}</React.Fragment>;
}
