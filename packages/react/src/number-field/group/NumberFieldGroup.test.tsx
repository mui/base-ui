import * as React from 'react';
import { expect } from 'chai';
import { screen } from '@mui/internal-test-utils';
import { NumberField } from '@base-ui-components/react/number-field';
import { createRenderer, describeConformance } from '#test-utils';
import { NumberFieldRootContext } from '../root/NumberFieldRootContext';
import { NOOP } from '../../utils/noop';

const testContext = {
  allowInputSyncRef: { current: false },
  autoFocus: false,
  disabled: false,
  formatOptionsRef: { current: undefined },
  getAllowedNonNumericKeys: () => [],
  getScrubAreaProps: (externalProps) => externalProps,
  getScrubAreaCursorProps: (externalProps) => externalProps,
  getStepAmount: NOOP,
  id: 'id',
  incrementValue: NOOP,
  inputMode: 'numeric',
  inputRef: { current: null },
  inputValue: '',
  intentionalTouchCheckTimeoutRef: { current: -1 },
  invalid: false,
  isPressedRef: { current: false },
  isScrubbing: false,
  isTouchInput: false,
  isPointerLockDenied: false,
  max: undefined,
  maxWithDefault: 100,
  mergedRef: (_node) => {},
  min: undefined,
  minWithDefault: 0,
  name: 'NumberField',
  movesAfterTouchRef: { current: 0 },
  readOnly: false,
  required: false,
  scrubAreaRef: { current: null },
  scrubAreaCursorRef: { current: null },
  scrubHandleRef: {
    current: {
      direction: 'horizontal',
      pixelSensitivity: 0,
      teleportDistance: 0,
    },
  },
  setInputValue: NOOP,
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
