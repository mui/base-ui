import * as React from 'react';
import clsx from 'clsx';
import classes from './page.module.css';
import { Sidebar } from './infra/Sidebar';

export default async function Experiments() {
  return (
    <React.Fragment>
      <Sidebar />
      <main className={clsx(classes.main, classes.landing)}>
        <h1>Base UI experiments</h1>
        <p>← Choose an experiment from the list</p>
      </main>
    </React.Fragment>
  );
}
