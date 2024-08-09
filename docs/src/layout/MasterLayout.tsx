import * as React from 'react';
import { AppBar } from '../modules/common/AppBar';
import { Navigation } from '../modules/common/Navigation';
import classes from './MasterLayout.module.css';
import routes from '../../data/base/pages';

export interface MasterLayoutProps {
  children: React.ReactNode;
}

export function MasterLayout({ children }: MasterLayoutProps) {
  return (
    <React.Fragment>
      <AppBar />
      <Navigation routes={routes} />
      <main className={classes.main}>{children}</main>
    </React.Fragment>
  );
}
