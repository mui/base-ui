import * as React from 'react';
import 'docs/src/styles.css';
import './layout.css';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <div className="GridlineLayoutRoot">
      <div className="GridlineLayoutContainer">
        <div className="GridlineLayoutContent">{children}</div>
      </div>
    </div>
  );
}
