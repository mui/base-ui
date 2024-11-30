import * as React from 'react';

import { AppBar } from 'docs/src/components/AppBar';
import { Navigation } from 'docs/src/components/Navigation';
import routes from 'docs/data/pages';
import 'docs/src/styles.css';
import 'docs/src/styles/style.css';

export default function Layout({ children }: React.PropsWithChildren<{}>) {
  return (
    <React.Fragment>
      <AppBar />
      <Navigation routes={routes} />
      {children}
    </React.Fragment>
  );
}
