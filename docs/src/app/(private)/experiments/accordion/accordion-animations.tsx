'use client';
import * as React from 'react';
import { Accordion } from '@base-ui-components/react/accordion';
import classes from './accordion.module.css';

function classNames(...c: Array<string | undefined | null | false>) {
  return c.filter(Boolean).join(' ');
}

export default function App() {
  return (
    <div className={classes.wrapper}>
      <h3>CSS @keyframe animations + `hidden=&quot;until-found&quot;`</h3>
      <Accordion.Root
        className={classes.root}
        aria-label="Uncontrolled Material UI Accordion"
        hiddenUntilFound
      >
        {[0, 1, 2].map((index) => (
          <Accordion.Item className={classes.item} key={index}>
            <Accordion.Header className={classes.header}>
              <Accordion.Trigger className={classes.trigger}>
                <span className={classes.triggerText}>Trigger {index + 1}</span>
                <ExpandMoreIcon />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel
              className={classNames(classes.panel, classes.cssanimation)}
            >
              <p>
                This is the contents of Accordion.Panel {index + 1}
                <br />
                It uses `hidden=&quot;until-found&quot;` and can be opened by the
                browser&apos;s in-page search
                <br />
                <input type="text" />
              </p>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion.Root>

      <h3>CSS transitions</h3>
      <Accordion.Root
        className={classes.root}
        aria-label="Uncontrolled Material UI Accordion"
      >
        {[0, 1, 2].map((index) => (
          <Accordion.Item className={classes.item} key={index}>
            <Accordion.Header className={classes.header}>
              <Accordion.Trigger className={classes.trigger}>
                <span className={classes.triggerText}>Trigger {index + 1}</span>
                <ExpandMoreIcon />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel
              className={classNames(classes.panel, classes.csstransition)}
            >
              <p>This is the contents of Accordion.Panel {index + 1}</p>
              <a href="https://www.w3.org/TR/WCAG22/">WCAG 2.2</a>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </div>
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
