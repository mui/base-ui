'use client';
import * as React from 'react';
import { Collapsible } from '@base-ui-components/react/collapsible';
import classes from './styles.module.css';

export default function CollapsibleIntroduction() {
  const [open, setOpen] = React.useState(true);
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger className={classes.trigger}>
        <ExpandMoreIcon className={classes.icon} />
        Show {open ? 'less' : 'more'}
      </Collapsible.Trigger>
      <Collapsible.Panel className={classes.panel}>
        <p>
          This is the collapsed content. The element that shows and hides the content
          has role button
        </p>
        <p>
          When the content is visible, the element with role `button` has
          `aria-expanded` set to `true`
        </p>
        <p>When the content panel is hidden, it is set to `false`</p>
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
