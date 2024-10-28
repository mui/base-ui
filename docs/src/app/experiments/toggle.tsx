'use client';
import * as React from 'react';
import { ToggleButton } from '@base_ui/react/ToggleButton';

export default function ToggleButtonDemo() {
  const [pressed, setPressed] = React.useState(true);
  return (
    <div>
      <ToggleButton
        pressed={pressed}
        onPressedChange={setPressed}
        // className={classes.button}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </ToggleButton>
    </div>
  );
}
