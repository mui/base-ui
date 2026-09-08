import * as React from 'react';
import { NumberField } from '@base-ui/react';
import './NumberField.css';

function PlusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="round"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M1.5 8h13M8 14.5v-13" />
    </svg>
  );
}

function MinusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="round"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M1.5 8h13" />
    </svg>
  );
}

export const Basic = () => {
  const id = React.useId();
  return (
    <NumberField.Root id={id} defaultValue={100} className="Field">
      <NumberField.ScrubArea className="ScrubArea">
        <label htmlFor={id} className="Label">
          Amount
        </label>
      </NumberField.ScrubArea>

      <NumberField.Group className="Group">
        <NumberField.Decrement className="Decrement">
          <MinusIcon />
        </NumberField.Decrement>
        <NumberField.Input className="Input" />
        <NumberField.Increment className="Increment">
          <PlusIcon />
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  );
};

export const Disabled = () => {
  const id = React.useId();
  return (
    <NumberField.Root id={id} defaultValue={100} disabled className="Field">
      <label htmlFor={id} className="Label">
        Amount
      </label>

      <NumberField.Group className="Group">
        <NumberField.Decrement className="Decrement">
          <MinusIcon />
        </NumberField.Decrement>
        <NumberField.Input className="Input" />
        <NumberField.Increment className="Increment">
          <PlusIcon />
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  );
};

export const MinMax = () => {
  const id = React.useId();
  return (
    <NumberField.Root id={id} defaultValue={0} min={0} max={10} className="Field">
      <label htmlFor={id} className="Label">
        Quantity
      </label>

      <NumberField.Group className="Group">
        <NumberField.Decrement className="Decrement">
          <MinusIcon />
        </NumberField.Decrement>
        <NumberField.Input className="Input" />
        <NumberField.Increment className="Increment">
          <PlusIcon />
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  );
};
