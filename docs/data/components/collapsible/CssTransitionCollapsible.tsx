'use client';
import * as React from 'react';
import clsx from 'clsx';
import { Collapsible } from '@base-ui-components/react/collapsible';
import transitionClasses from './transitions.module.css';
import classes from './styles.module.css';

export default function CssTransitionCollapsible() {
  const [open, setOpen] = React.useState(true);
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger className={classes.trigger}>
        <ExpandMoreIcon className={classes.icon} />
        Show {open ? 'less' : 'more'}
      </Collapsible.Trigger>
      <Collapsible.Panel className={clsx(classes.panel, transitionClasses.panel)}>
        <p>This is the collapsed content.</p>
        <p>
          You can find the Base UI repository{' '}
          <a
            href="https://github.com/mui/base-ui"
            target="_blank"
            rel="noreferrer noopener"
          >
            here
          </a>
          .
        </p>
        <p>This is a longer sentence and also the third paragraph.</p>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

function ExpandMoreIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z" fill="currentColor" />
    </svg>
  );
}
