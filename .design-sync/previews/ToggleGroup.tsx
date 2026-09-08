import * as React from 'react';
import { Toggle } from '@base-ui/react';
import { ToggleGroup } from '@base-ui/react';
import './ToggleGroup.css';

function AlignLeftIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 16 16"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path strokeLinecap="square" strokeLinejoin="round" d="M2.5 4.5h11m-11 7h9M2.5 8h5" />
    </svg>
  );
}

function AlignCenterIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path strokeLinecap="square" strokeLinejoin="round" d="M2.5 4.5h11m-10 7h9M5.5 8h5" />
    </svg>
  );
}

function AlignRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path strokeLinecap="square" strokeLinejoin="round" d="M2.5 4.5h11m-9 7h9M8.5 8h5" />
    </svg>
  );
}

export const Basic = () => (
  <ToggleGroup aria-label="Text alignment" defaultValue={['left']} className="Panel">
    <Toggle aria-label="Align left" value="left" className="Button">
      <AlignLeftIcon />
    </Toggle>
    <Toggle aria-label="Align center" value="center" className="Button">
      <AlignCenterIcon />
    </Toggle>
    <Toggle aria-label="Align right" value="right" className="Button">
      <AlignRightIcon />
    </Toggle>
  </ToggleGroup>
);

export const Disabled = () => (
  <ToggleGroup aria-label="Text alignment" disabled defaultValue={['left']} className="Panel">
    <Toggle aria-label="Align left" value="left" className="Button">
      <AlignLeftIcon />
    </Toggle>
    <Toggle aria-label="Align center" value="center" className="Button">
      <AlignCenterIcon />
    </Toggle>
    <Toggle aria-label="Align right" value="right" className="Button">
      <AlignRightIcon />
    </Toggle>
  </ToggleGroup>
);
