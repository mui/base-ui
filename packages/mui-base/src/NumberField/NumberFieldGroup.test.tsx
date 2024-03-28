import * as React from 'react';
import { expect } from 'chai';
import { createRenderer, screen } from '@mui/internal-test-utils';
import { NumberField } from '@mui/base/NumberField';
import { describeConformance } from '../../test/describeConformance';
import { NumberFieldContext, NumberFieldContextValue } from './NumberFieldContext';

const testContext = {
  getGroupProps: (externalProps) => ({ role: 'group', ...externalProps }),
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

  describeConformance(<NumberField.Group />, () => ({
    inheritComponent: 'div',
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <NumberFieldContext.Provider value={testContext}>{node}</NumberFieldContext.Provider>,
      );
    },
    skip: ['reactTestRenderer'],
  }));

  it('has role prop', () => {
    render(
      <NumberField>
        <NumberField.Group />
      </NumberField>,
    );
    expect(screen.queryByRole('group')).not.to.equal(null);
  });
});
