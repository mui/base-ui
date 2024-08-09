import * as React from 'react';
import Link from 'next/link';
import { RouteMetadata } from 'docs-base/data/base/pages';
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

export function OldNavigation() {
  return (
    <div className={classes.root}>
      <div className="pb-4">
        <div className="d-f ai-center h-7 pl-3">
          <h4 className="Text size-3 weight-2 c-default">Getting Started</h4>
        </div>
        <Link href="/base-ui-react/getting-started/overview/" className="LinkBlock">
          Overview
        </Link>
        <Link href="/base-ui-react/getting-started/quickstart/" className="LinkBlock">
          Quick Start
        </Link>
        <Link href="/base-ui-react/getting-started/usage/" className="LinkBlock">
          Usage
        </Link>
        <Link href="/base-ui-react/getting-started/accessibility/" className="LinkBlock">
          Accessibility
        </Link>
        <Link href="/" className="LinkBlock">
          Releases
        </Link>
        <Link href="/" className="LinkBlock">
          Support
        </Link>
      </div>
      <div className="pb-4">
        <div className="d-f ai-center h-7 pl-3">
          <h4 className="Text size-3 weight-2 c-default">Guides</h4>
        </div>
        <Link href="/" className="LinkBlock active">
          Styling
        </Link>
        <Link href="/" className="LinkBlock">
          Animation
        </Link>
        <Link href="/" className="LinkBlock">
          Composition
        </Link>
        <Link href="/" className="LinkBlock">
          Server-side Rendering
        </Link>
      </div>
      <div>
        <div className="d-f ai-center h-7 pl-3">
          <h4 className="Text size-3 weight-2 c-default">Components</h4>
        </div>
        <Link href="/" className="LinkBlock">
          AlertDialog
        </Link>
        <Link href="/" className="LinkBlock">
          Checkbox
        </Link>
        <Link href="/" className="LinkBlock">
          CheckboxGroup
        </Link>
        <Link href="/" className="LinkBlock">
          Dialog
          <span className="Badge ml-1">Beta</span>
        </Link>
        <Link href="/" className="LinkBlock">
          HoverCard
        </Link>
        <Link href="/" className="LinkBlock">
          Menu
        </Link>
        <Link href="/" className="LinkBlock">
          NumberField
          <span className="Badge ml-1">Beta</span>
        </Link>
        <Link href="/" className="LinkBlock">
          Popover
        </Link>
        <Link href="/" className="LinkBlock">
          RadioGroup
        </Link>
        <Link href="/" className="LinkBlock">
          Separator
        </Link>
        <Link href="/" className="LinkBlock">
          Slider
        </Link>
        <Link href="/" className="LinkBlock">
          Switch
        </Link>
        <Link href="/" className="LinkBlock">
          Tabs
          <span className="Badge ml-2">Beta</span>
        </Link>
        <Link href="/" className="LinkBlock">
          Tooltip
        </Link>
      </div>
    </div>
  );
}
