import * as React from 'react';
import { expect } from 'chai';
import { screen } from '@mui/internal-test-utils';
import { NumberField } from '@base_ui/react/NumberField';
import { createRenderer, describeConformance } from '#test-utils';
import { isWebKit } from '../../utils/detectBrowser';
import { NumberFieldRootContext } from '../Root/NumberFieldRootContext';

const testContext = {
  getScrubAreaCursorProps: (externalProps) => externalProps,
  isScrubbing: true,
  ownerState: {
    value: null,
    required: false,
    disabled: false,
    invalid: false,
    readOnly: false,
  },
} as NumberFieldRootContext;

describe('<NumberField.ScrubAreaCursor />', () => {
  const { render } = createRenderer();

  // This component doesn't render on WebKit.
  if (isWebKit()) {
    return;
  }

  describeConformance(<NumberField.ScrubAreaCursor />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render: async (node) => {
      return render(
        <NumberFieldRootContext.Provider value={testContext}>
          {node}
        </NumberFieldRootContext.Provider>,
      );
    },
  }));

  it('has presentation role', async () => {
    await render(
      <NumberField.Root>
        <NumberField.ScrubArea />
      </NumberField.Root>,
    );
    expect(screen.queryByRole('presentation')).not.to.equal(null);
  });
});
