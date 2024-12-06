'use client';
import * as React from 'react';
import { Toggle } from '@base-ui-components/react/toggle';
import classes from './styles.module.css';

export default function ToggleIntroduction() {
  const [pressed, setPressed] = React.useState(false);
  return (
    <Toggle
      pressed={pressed}
      onPressedChange={setPressed}
      className={classes.button}
      aria-label="Bookmark this article"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className={classes.icon}
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </Toggle>
  );
}
