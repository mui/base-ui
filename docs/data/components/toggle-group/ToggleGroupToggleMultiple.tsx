'use client';
import * as React from 'react';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';
import { Toggle } from '@base-ui-components/react/toggle';
import classes from './styles.module.css';

export default function ToggleGroupToggleMultiple() {
  return (
    <ToggleGroup
      toggleMultiple
      aria-label="Text formatting"
      className={classes.root}
    >
      <Toggle value="bold" aria-label="Toggle bold" className={classes.button}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          className={classes.icon}
        >
          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
          <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
        </svg>
      </Toggle>

      <Toggle value="italics" aria-label="Toggle italics" className={classes.button}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          className={classes.icon}
        >
          <line x1="19" y1="4" x2="10" y2="4" />
          <line x1="14" y1="20" x2="5" y2="20" />
          <line x1="15" y1="4" x2="9" y2="20" />
        </svg>
      </Toggle>

      <Toggle
        value="underline"
        aria-label="Toggle underline"
        className={classes.button}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          className={classes.icon}
        >
          <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
          <line x1="4" y1="21" x2="20" y2="21" />
        </svg>
      </Toggle>
    </ToggleGroup>
  );
}
