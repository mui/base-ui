'use client';
import * as React from 'react';
import { Toolbar } from '@base-ui-components/react/toolbar';
import { Toggle } from '@base-ui-components/react/toggle';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';
import s from './toolbar.module.css';
import '../../../demo-theme.css';

export default function App() {
  return (
    <Toolbar.Root className={s.Root}>
      <ToggleGroup defaultValue={[]} className={s.ToggleGroup}>
        <Toggle aria-label="Bold" value="bold" className={s.Toggle}>
          <BoldIcon className={s.Icon} />
        </Toggle>
        <Toggle aria-label="Italics" value="italics" className={s.Toggle}>
          <ItalicsIcon className={s.Icon} />
        </Toggle>
        <Toggle aria-label="Underline" value="underline" className={s.Toggle}>
          <UnderlineIcon className={s.Icon} />
        </Toggle>
      </ToggleGroup>

      <Toolbar.Separator className={s.Separator} />

      <ToggleGroup defaultValue={['left']} className={s.ToggleGroup}>
        <Toggle aria-label="Align left" value="left" className={s.Toggle}>
          <AlignLeftIcon className={s.Icon} />
        </Toggle>
        <Toggle aria-label="Align center" value="center" className={s.Toggle}>
          <AlignCenterIcon className={s.Icon} />
        </Toggle>
        <Toggle aria-label="Align right" value="right" className={s.Toggle}>
          <AlignRightIcon className={s.Icon} />
        </Toggle>
      </ToggleGroup>
    </Toolbar.Root>
  );
}

function AlignLeftIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <line x1="17" y1="10" x2="3" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="17" y1="18" x2="3" y2="18" />
    </svg>
  );
}

function AlignCenterIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <line x1="18" y1="10" x2="6" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="18" y1="18" x2="6" y2="18" />
    </svg>
  );
}

function AlignRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <line x1="21" y1="10" x2="7" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="21" y1="18" x2="7" y2="18" />
    </svg>
  );
}

function BoldIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
      <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </svg>
  );
}

function ItalicsIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  );
}

function UnderlineIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
      <line x1="4" y1="21" x2="20" y2="21" />
    </svg>
  );
}
