import * as React from 'react';
import './layout.css';

export default function ExperimentsLayout({ children }: React.PropsWithChildren) {
  return <div className="experiments-layout-root">{children}</div>;
}
