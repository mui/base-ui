import * as React from 'react';
import Link from 'next/link';
import { RouteMetadata } from 'docs-base/data/pages';
import classes from './Navigation.module.css';

interface NavigationProps {
  routes: readonly RouteMetadata[];
}

export function Navigation(props: NavigationProps) {
  return (
    <div className={classes.root}>
      {props.routes.map((route) => (
        <div key={route.pathname} className="pb-4">
          <div className="d-f ai-center h-7 pl-3">
            <h4 className="Text size-3 weight-2 c-default">{route.title}</h4>
          </div>
          {route.children?.map((child) => (
            <React.Fragment key={child.pathname}>
              <Link key={child.pathname} href={child.pathname} className="LinkBlock">
                {child.title}
              </Link>
              {child.children?.map((subchild) => (
                <Link key={subchild.pathname} href={subchild.pathname} className="LinkBlock pl-6">
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
