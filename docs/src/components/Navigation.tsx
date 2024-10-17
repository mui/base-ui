import * as React from 'react';
import Link from 'next/link';
import { RouteMetadata } from 'docs/data/pages';
import classes from './Navigation.module.css';

interface NavigationProps {
  routes: readonly RouteMetadata[];
}

export function Navigation(props: NavigationProps) {
  return (
    <div className={classes.root}>
      {props.routes.map((route) => (
        <div key={route.pathname} className={classes.section}>
          <h4 className={classes.sectionTitle}>{route.title}</h4>
          {route.children?.map((child) => (
            <React.Fragment key={child.pathname}>
              <Link key={child.pathname} href={child.pathname} className={classes.link}>
                {child.title}
              </Link>
              {child.children?.map((subchild) => (
                <Link key={subchild.pathname} href={subchild.pathname} className={classes.sublink}>
                  {subchild.title}
                </Link>
              ))}
            </React.Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}
