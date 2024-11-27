'use client';
import * as React from 'react';
import { ToggleButtonGroup } from '@base-ui-components/react/toggle-button-group';
import classes from './toggle.module.css';

export default function ToggleButtonGroupDemo() {
  const [value, setValue] = React.useState(['align-center']);
  return (
    <div className={classes.grid}>
      <h4 style={{ margin: 0 }}>LTR</h4>

      <ToggleButtonGroup.Root
        value={value}
        onValueChange={(newValue) => {
          // one button must always remain pressed
          if (newValue.length > 0) {
            setValue(newValue);
          }
        }}
        aria-label="Text alignment"
        className={classes.group}
      >
        <ToggleButtonGroup.Item
          value="align-left"
          aria-label="Align left"
          className={classes.button}
        >
          <AlignLeftIcon />
        </ToggleButtonGroup.Item>

        <ToggleButtonGroup.Item
          value="align-center"
          aria-label="Align center"
          className={classes.button}
        >
          <AlignCenterIcon />
        </ToggleButtonGroup.Item>

        <ToggleButtonGroup.Item
          value="align-right"
          aria-label="Align right"
          className={classes.button}
        >
          <AlignRightIcon />
        </ToggleButtonGroup.Item>
      </ToggleButtonGroup.Root>

      <h4 style={{ margin: 0 }}>RTL</h4>

      <div dir="rtl">
        <div>
          <div>
            <ToggleButtonGroup.Root
              toggleMultiple
              aria-label="Text formatting"
              className={classes.group}
            >
              <ToggleButtonGroup.Item
                value="bold"
                aria-label="Toggle bold"
                className={classes.button}
              >
                <BoldIcon />
              </ToggleButtonGroup.Item>

              <ToggleButtonGroup.Item
                value="italics"
                aria-label="Toggle italics"
                className={classes.button}
              >
                <ItalicsIcon />
              </ToggleButtonGroup.Item>

              <ToggleButtonGroup.Item
                value="underline"
                aria-label="Toggle underline"
                className={classes.button}
              >
                <UnderlineIcon />
              </ToggleButtonGroup.Item>
            </ToggleButtonGroup.Root>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlignLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
    >
      <line x1="17" y1="10" x2="3" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="17" y1="18" x2="3" y2="18" />
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
    >
      <line x1="18" y1="10" x2="6" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="18" y1="18" x2="6" y2="18" />
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
    >
      <line x1="21" y1="10" x2="7" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="21" y1="18" x2="7" y2="18" />
    </svg>
  );
}

function BoldIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
    >
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
      <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </svg>
  );
}

function ItalicsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
    >
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  );
}

function UnderlineIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
    >
      <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
      <line x1="4" y1="21" x2="20" y2="21" />
    </svg>
  );
}
