import * as React from 'react';
import 'docs/src/styles.css';
import './layout.css';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <div className="RootLayout">
      <div className="RootLayoutContainer">
        <div className="RootLayoutContent">{children}</div>
      </div>
    </div>
  );
}
