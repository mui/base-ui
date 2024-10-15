import * as React from 'react';
import { expect } from 'chai';
import { screen } from '@mui/internal-test-utils';
import { NumberField } from '@base_ui/react/NumberField';
import { createRenderer, describeConformance } from '#test-utils';
import { NumberFieldRootContext } from '../Root/NumberFieldRootContext';

const testContext = {
  getGroupProps: (externalProps) => ({ role: 'group', ...externalProps }),
  ownerState: {
    value: null,
    required: false,
    disabled: false,
    invalid: false,
    readOnly: false,
  },
} as NumberFieldRootContext;

describe('<NumberField.Group />', () => {
  const { render } = createRenderer();

  describeConformance(<NumberField.Group />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <NumberFieldRootContext.Provider value={testContext}>
          {node}
        </NumberFieldRootContext.Provider>,
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
