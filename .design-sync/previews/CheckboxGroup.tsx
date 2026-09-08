import * as React from 'react';
import { Checkbox } from '@base-ui/react';
import { CheckboxGroup } from '@base-ui/react';
import './CheckboxGroup.css';

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
  <CheckboxGroup aria-label="Apples" defaultValue={['fuji-apple']} className="CheckboxGroup">
    <div className="Caption">Apples</div>
    <label className="Item">
      <Checkbox.Root name="apple" value="fuji-apple" className="Checkbox">
        <Checkbox.Indicator className="Indicator">
          <CheckIcon />
        </Checkbox.Indicator>
      </Checkbox.Root>
      Fuji
    </label>
    <label className="Item">
      <Checkbox.Root name="apple" value="gala-apple" className="Checkbox">
        <Checkbox.Indicator className="Indicator">
          <CheckIcon />
        </Checkbox.Indicator>
      </Checkbox.Root>
      Gala
    </label>
    <label className="Item">
      <Checkbox.Root name="apple" value="granny-smith-apple" className="Checkbox">
        <Checkbox.Indicator className="Indicator">
          <CheckIcon />
        </Checkbox.Indicator>
      </Checkbox.Root>
      Granny Smith
    </label>
  </CheckboxGroup>
);

export const Disabled = () => (
  <CheckboxGroup
    aria-label="Apples"
    disabled
    defaultValue={['fuji-apple']}
    className="CheckboxGroup"
  >
    <div className="Caption">Apples</div>
    <label className="Item">
      <Checkbox.Root name="apple" value="fuji-apple" className="Checkbox">
        <Checkbox.Indicator className="Indicator">
          <CheckIcon />
        </Checkbox.Indicator>
      </Checkbox.Root>
      Fuji
    </label>
    <label className="Item">
      <Checkbox.Root name="apple" value="gala-apple" className="Checkbox">
        <Checkbox.Indicator className="Indicator">
          <CheckIcon />
        </Checkbox.Indicator>
      </Checkbox.Root>
      Gala
    </label>
    <label className="Item">
      <Checkbox.Root name="apple" value="granny-smith-apple" className="Checkbox">
        <Checkbox.Indicator className="Indicator">
          <CheckIcon />
        </Checkbox.Indicator>
      </Checkbox.Root>
      Granny Smith
    </label>
  </CheckboxGroup>
);
