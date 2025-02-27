import * as React from 'react';
import { expect } from 'chai';
import { screen } from '@mui/internal-test-utils';
import { NumberField } from '@base-ui-components/react/number-field';
import { createRenderer, describeConformance } from '#test-utils';
import { NumberFieldRootContext } from '../root/NumberFieldRootContext';
import { NOOP } from '../../utils/noop';

const testContext = {
  allowInputSyncRef: { current: false },
  disabled: false,
  formatOptionsRef: { current: undefined },
  getInputProps: (externalProps) => externalProps,
  getScrubAreaProps: (externalProps) => externalProps,
  getScrubAreaCursorProps: (externalProps) => externalProps,
  getStepAmount: NOOP,
  id: 'id',
  incrementValue: NOOP,
  inputRef: { current: null },
  inputValue: '',
  intentionalTouchCheckTimeoutRef: { current: -1 },
  isPressedRef: { current: false },
  isScrubbing: false,
  maxWithDefault: 100,
  mergedRef: (_node) => {},
  minWithDefault: 0,
  movesAfterTouchRef: { current: 0 },
  readOnly: false,
  scrubAreaRef: { current: null },
  scrubAreaCursorRef: { current: null },
  scrubHandleRef: {
    current: {
      direction: 'horizontal',
      pixelSensitivity: 0,
      teleportDistance: 0,
    },
  },
  setValue: NOOP,
  state: {
    value: null,
    required: false,
    disabled: false,
    invalid: false,
    readOnly: false,
    scrubbing: false,
    touched: false,
    dirty: false,
    inputValue: '',
    valid: true,
    filled: false,
    focused: false,
  },
  startAutoChange: NOOP,
  stopAutoChange: NOOP,
  value: null,
  valueRef: { current: null },
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
