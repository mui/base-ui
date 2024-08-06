import * as React from 'react';
import { expect } from 'chai';
import { screen } from '@mui/internal-test-utils';
import * as NumberField from '@base_ui/react/NumberField';
import { NumberFieldContext, type NumberFieldContextValue } from '@base_ui/react/NumberField';
import { isWebKit } from '../../utils/detectBrowser';
import { createRenderer, describeConformance } from '#test-utils';

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
} as NumberFieldContextValue;

describe('<NumberField.ScrubAreaCursor />', () => {
  const { render } = createRenderer();

  // This component doesn't render on WebKit.
  if (isWebKit()) {
    return;
  }

  describeConformance(<NumberField.ScrubAreaCursor />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(
        <NumberFieldContext.Provider value={testContext}>{node}</NumberFieldContext.Provider>,
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
