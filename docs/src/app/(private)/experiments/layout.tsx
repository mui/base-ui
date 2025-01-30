import * as React from 'react';
import 'docs/src/styles.css';
import classes from './layout.module.css';

export default function Layout({ children }: React.PropsWithChildren<{}>) {
  return <div className={classes.root}>{children}</div>;
}
