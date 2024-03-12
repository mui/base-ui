import * as React from 'react';
import { NumberField } from '@mui/base/NumberField';

export default function UnstyledNumberFieldFormat() {
  return (
    <NumberField
      format={{ style: 'currency', currency: 'USD' }}
      defaultValue={10}
      min={0}
    >
      <NumberField.Group style={{ display: 'flex', gap: 4 }}>
        <NumberField.Decrement>-</NumberField.Decrement>
        <NumberField.Input style={{ fontSize: 16 }} />
        <NumberField.Increment>+</NumberField.Increment>
      </NumberField.Group>
    </NumberField>
  );
}
