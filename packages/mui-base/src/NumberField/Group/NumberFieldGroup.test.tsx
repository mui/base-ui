import * as React from 'react';
import { expect } from 'chai';
import { screen } from '@mui/internal-test-utils';
import * as NumberField from '@base_ui/react/NumberField';
import { NumberFieldContext, type NumberFieldContextValue } from '@base_ui/react/NumberField';
import { createRenderer, describeConformance } from '../../../test';

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
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <NumberFieldContext.Provider value={testContext}>{node}</NumberFieldContext.Provider>,
      );
    },
  }));

  it('has role prop', async () => {
    await render(
      <NumberField.Root>
        <NumberField.Group />
      </NumberField.Root>,
    );
    expect(screen.queryByRole('group')).not.to.equal(null);
  });
});
