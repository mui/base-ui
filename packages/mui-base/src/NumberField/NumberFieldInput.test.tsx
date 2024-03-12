import * as React from 'react';
import { expect } from 'chai';
import { createRenderer, screen } from '@mui/internal-test-utils';
import { NumberField } from '@mui/base/NumberField';
import { describeConformance } from '../../test/describeConformance';
import { NumberFieldContext, NumberFieldContextValue } from './NumberFieldContext';

const testContext = {
  getInputProps: (externalProps) => externalProps,
  ownerState: {
    value: null,
    required: false,
    disabled: false,
    invalid: false,
    readOnly: false,
  },
} as NumberFieldContextValue;

describe('<NumberField.Group />', () => {
  const { render } = createRenderer();

  describeConformance(<NumberField.Input />, () => ({
    inheritComponent: 'input',
    refInstanceof: window.HTMLInputElement,
    render(node) {
      return render(
        <NumberFieldContext.Provider value={testContext}>{node}</NumberFieldContext.Provider>,
      );
    },
    skip: ['reactTestRenderer'],
  }));

  it('has textbox role', () => {
    render(
      <NumberField>
        <NumberField.Input />
      </NumberField>,
    );
    expect(screen.queryByRole('textbox')).not.to.equal(null);
  });
});
