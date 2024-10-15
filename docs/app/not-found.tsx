import * as React from 'react';

import { AppBar } from 'docs-base/src/components/AppBar';
import { Navigation } from 'docs-base/src/components/Navigation';
import routes from 'docs-base/data/pages';
import classes from './(content)/styles.module.css';

export default function NotFound() {
  return (
    <React.Fragment>
      <AppBar />
      <Navigation routes={routes} />
      <main className={classes.content}>
        <h1>Page not found</h1>
      </main>
    </React.Fragment>
  );
}
