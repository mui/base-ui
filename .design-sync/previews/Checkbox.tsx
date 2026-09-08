import * as React from 'react';
import { Checkbox } from '@base-ui/react';
import './Checkbox.css';

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m2.5 8.5 4 4 7-9" />
    </svg>
  );
}

export const Basic = () => (
  <label className="Label">
    <Checkbox.Root defaultChecked className="Checkbox">
      <Checkbox.Indicator className="Indicator">
        <CheckIcon />
      </Checkbox.Indicator>
    </Checkbox.Root>
    Enable notifications
  </label>
);

export const Unchecked = () => (
  <label className="Label">
    <Checkbox.Root className="Checkbox">
      <Checkbox.Indicator className="Indicator">
        <CheckIcon />
      </Checkbox.Indicator>
    </Checkbox.Root>
    Subscribe to newsletter
  </label>
);

function MinusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M3 8h10" />
    </svg>
  );
}

export const Indeterminate = () => (
  <label className="Label">
    <Checkbox.Root indeterminate className="Checkbox">
      <Checkbox.Indicator className="Indicator">
        <MinusIcon />
      </Checkbox.Indicator>
    </Checkbox.Root>
    Select all
  </label>
);

export const Disabled = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <label className="Label">
      <Checkbox.Root disabled className="Checkbox">
        <Checkbox.Indicator className="Indicator">
          <CheckIcon />
        </Checkbox.Indicator>
      </Checkbox.Root>
      Disabled, unchecked
    </label>
    <label className="Label">
      <Checkbox.Root disabled defaultChecked className="Checkbox">
        <Checkbox.Indicator className="Indicator">
          <CheckIcon />
        </Checkbox.Indicator>
      </Checkbox.Root>
      Disabled, checked
    </label>
  </div>
);
