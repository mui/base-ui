'use client';
import * as React from 'react';
import { Accordion } from '@base-ui-components/react/accordion';
import classes from './styles.module.css';

export default function UnstyledAccordionIntroduction() {
  return (
    <div className={classes.demo}>
      <Accordion.Root className={classes.root} aria-label="Base UI Accordion">
        <Accordion.Item className={classes.item}>
          <Accordion.Header className={classes.header}>
            <Accordion.Trigger className={classes.trigger}>
              <span className={classes.triggerText}>Trigger 1</span>
              <ExpandMoreIcon />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className={classes.panel}>
            This is the contents of Accordion.Panel 1
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item className={classes.item}>
          <Accordion.Header className={classes.header}>
            <Accordion.Trigger className={classes.trigger}>
              <span className={classes.triggerText}>Trigger 2</span>
              <ExpandMoreIcon />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className={classes.panel}>
            This is the contents of Accordion.Panel 2
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item className={classes.item}>
          <Accordion.Header className={classes.header}>
            <Accordion.Trigger className={classes.trigger}>
              <span className={classes.triggerText}>Trigger 3</span>
              <ExpandMoreIcon />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className={classes.panel}>
            This is the contents of Accordion.Panel 3
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  );
}

function ExpandMoreIcon(props) {
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
