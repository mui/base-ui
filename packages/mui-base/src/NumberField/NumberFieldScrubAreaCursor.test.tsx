import * as React from 'react';
import { createRenderer, screen } from '@mui/internal-test-utils';
import * as NumberField from '@base_ui/react/NumberField';
import { expect } from 'chai';
import { describeConformance } from '../../test/describeConformance';
import { NumberFieldContext, NumberFieldContextValue } from './NumberFieldContext';
import { isWebKit } from '../utils/detectBrowser';

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
    inheritComponent: 'span',
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(
        <NumberFieldContext.Provider value={testContext}>{node}</NumberFieldContext.Provider>,
      );
    },
    skip: ['reactTestRenderer'],
  }));

  it('has presentation role', () => {
    render(
      <NumberField.Root>
        <NumberField.ScrubArea />
      </NumberField.Root>,
    );
    expect(screen.queryByRole('presentation')).not.to.equal(null);
  });
});
