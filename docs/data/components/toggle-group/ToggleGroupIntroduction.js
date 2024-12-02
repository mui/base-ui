'use client';
import * as React from 'react';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';
import { Toggle } from '@base-ui-components/react/toggle';
import classes from './styles.module.css';

export default function ToggleGroupIntroduction() {
  const [value, setValue] = React.useState(['align-center']);
  return (
    <ToggleGroup
      className={classes.root}
      value={value}
      onValueChange={(newValue) => {
        if (newValue.length > 0) {
          setValue(newValue);
        }
      }}
      aria-label="Text alignment"
    >
      <Toggle className={classes.button} value="align-left" aria-label="Align left">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          className={classes.icon}
        >
          <line x1="17" y1="10" x2="3" y2="10" />
          <line x1="21" y1="6" x2="3" y2="6" />
          <line x1="21" y1="14" x2="3" y2="14" />
          <line x1="17" y1="18" x2="3" y2="18" />
        </svg>
      </Toggle>

      <Toggle
        className={classes.button}
        value="align-center"
        aria-label="Align center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          className={classes.icon}
        >
          <line x1="18" y1="10" x2="6" y2="10" />
          <line x1="21" y1="6" x2="3" y2="6" />
          <line x1="21" y1="14" x2="3" y2="14" />
          <line x1="18" y1="18" x2="6" y2="18" />
        </svg>
      </Toggle>

      <Toggle
        className={classes.button}
        value="align-right"
        aria-label="Align right"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          className={classes.icon}
        >
          <line x1="21" y1="10" x2="7" y2="10" />
          <line x1="21" y1="6" x2="3" y2="6" />
          <line x1="21" y1="14" x2="3" y2="14" />
          <line x1="21" y1="18" x2="7" y2="18" />
        </svg>
      </Toggle>
    </ToggleGroup>
  );
}
