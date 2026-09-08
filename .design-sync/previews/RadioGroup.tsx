import * as React from 'react';
import { Radio } from '@base-ui/react';
import { RadioGroup } from '@base-ui/react';
import './RadioGroup.css';

export const Basic = () => (
  <RadioGroup aria-label="Best apple" defaultValue="fuji-apple" className="RadioGroup">
    <div className="Caption">Best apple</div>
    <label className="Item">
      <Radio.Root value="fuji-apple" className="Radio">
        <Radio.Indicator className="Indicator" />
      </Radio.Root>
      Fuji
    </label>
    <label className="Item">
      <Radio.Root value="gala-apple" className="Radio">
        <Radio.Indicator className="Indicator" />
      </Radio.Root>
      Gala
    </label>
    <label className="Item">
      <Radio.Root value="granny-smith-apple" className="Radio">
        <Radio.Indicator className="Indicator" />
      </Radio.Root>
      Granny Smith
    </label>
  </RadioGroup>
);

export const Disabled = () => (
  <RadioGroup aria-label="Best apple" disabled defaultValue="fuji-apple" className="RadioGroup">
    <div className="Caption">Best apple</div>
    <label className="Item">
      <Radio.Root value="fuji-apple" className="Radio">
        <Radio.Indicator className="Indicator" />
      </Radio.Root>
      Fuji
    </label>
    <label className="Item">
      <Radio.Root value="gala-apple" className="Radio">
        <Radio.Indicator className="Indicator" />
      </Radio.Root>
      Gala
    </label>
  </RadioGroup>
);
