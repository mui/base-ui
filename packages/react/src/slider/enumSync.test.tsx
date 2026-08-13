import * as React from 'react';
import { expect } from 'vitest';
import { Slider } from '@base-ui/react/slider';
import { screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { SliderThumbDataAttributes } from './thumb/SliderThumbDataAttributes';

// The parts inline these enums' values instead of referencing the members, so
// nothing links the docs enums to runtime behavior. These tests re-link every
// inlined member so a rename to only one side fails CI. Members that are not
// inlined (emitted by the default state serializer) are out of scope. Test-only
// imports ship no production bytes.
describe('Slider enum sync', () => {
  const { render } = createRenderer();

  it('names the thumb index attribute per SliderThumbDataAttributes', async () => {
    await render(
      <Slider.Root>
        <Slider.Control>
          <Slider.Thumb data-testid="thumb" />
        </Slider.Control>
      </Slider.Root>,
    );

    expect(screen.getByTestId('thumb')).toHaveAttribute(SliderThumbDataAttributes.index, '0');
  });
});
