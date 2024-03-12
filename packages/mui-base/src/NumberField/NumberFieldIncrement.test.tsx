import * as React from 'react';
import { expect } from 'chai';
import { createRenderer, screen } from '@mui/internal-test-utils';
import { NumberField } from '@mui/base/NumberField';
import { describeConformance } from '../../test/describeConformance';
import { NumberFieldContext, NumberFieldContextValue } from './NumberFieldContext';

const testContext = {
  getIncrementButtonProps: (externalProps) => externalProps,
  ownerState: {
    value: null,
    required: false,
    disabled: false,
    invalid: false,
    readOnly: false,
  },
} as NumberFieldContextValue;

describe('<NumberField.Increment />', () => {
  const { render } = createRenderer();

  describeConformance(<NumberField.Increment />, () => ({
    inheritComponent: 'button',
    refInstanceof: window.HTMLButtonElement,
    render(node) {
      return render(
        <NumberFieldContext.Provider value={testContext}>{node}</NumberFieldContext.Provider>,
      );
    },
    skip: ['reactTestRenderer'],
  }));

  it('has increase label', () => {
    render(
      <NumberField>
        <NumberField.Increment />
      </NumberField>,
    );
    expect(screen.queryByLabelText('Increase')).not.to.equal(null);
  });
});
