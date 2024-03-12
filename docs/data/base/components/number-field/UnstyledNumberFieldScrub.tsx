import * as React from 'react';
import { NumberField } from '@mui/base/NumberField';

export default function UnstyledNumberFieldScrub() {
  const id = React.useId();
  return (
    <NumberField id={id} defaultValue={100}>
      <NumberField.ScrubArea style={{ cursor: 'ns-resize' }}>
        <label htmlFor={id} style={{ cursor: 'unset' }}>
          Scrub
        </label>
      </NumberField.ScrubArea>
      <NumberField.Group style={{ display: 'flex', gap: 4 }}>
        <NumberField.Input style={{ fontSize: 16 }} />
      </NumberField.Group>
    </NumberField>
  );
}
