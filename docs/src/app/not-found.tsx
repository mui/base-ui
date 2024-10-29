import * as React from 'react';

import { AppBar } from 'docs/src/components/AppBar';
import { Navigation } from 'docs/src/components/Navigation';
import routes from 'docs/data/pages';

export default function NotFound() {
  return (
    <React.Fragment>
      <AppBar />
      <Navigation routes={routes} />
      <main>
        <h1>Page not found</h1>
      </main>
    </React.Fragment>
  );
}
