import * as React from 'react';
import 'docs/src/styles.css';
import './layout.css';
import { Header } from 'docs/src/components/Header';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <div className="RootLayout">
      <div className="RootLayoutContainer">
        <Header />
        <div className="RootLayoutContent">{children}</div>
      </div>
    </div>
  );
}
