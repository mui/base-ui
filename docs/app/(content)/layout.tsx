import * as React from 'react';

import { AppBar } from 'docs-base/src/components/AppBar';
import { Navigation } from 'docs-base/src/components/Navigation';
import routes from 'docs-base/data/pages';

export default function Layout({ children }: React.PropsWithChildren<{}>) {
  return (
    <React.Fragment>
      <AppBar />
      <Navigation routes={routes} />
      {children}
    </React.Fragment>
  );
}
