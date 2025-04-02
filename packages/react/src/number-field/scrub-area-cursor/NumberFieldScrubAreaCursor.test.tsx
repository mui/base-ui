import * as React from 'react';
import { expect } from 'chai';
import { screen, act } from '@mui/internal-test-utils';
import sinon from 'sinon';
import { NumberField } from '@base-ui-components/react/number-field';
import { createRenderer, describeConformance } from '#test-utils';
import { isWebKit } from '../../utils/detectBrowser';
import { NOOP } from '../../utils/noop';
import { NumberFieldRootContext } from '../root/NumberFieldRootContext';

const defaultTestContext = {
  allowInputSyncRef: { current: false },
  autoFocus: false,
  disabled: false,
  formatOptionsRef: { current: undefined },
  getAllowedNonNumericKeys: () => [],
  getScrubAreaProps: (externalProps) => externalProps,
  getStepAmount: NOOP,
  id: 'id',
  incrementValue: NOOP,
  inputMode: 'numeric',
  inputRef: { current: null },
  inputValue: '',
  intentionalTouchCheckTimeoutRef: { current: -1 },
  invalid: false,
  isPressedRef: { current: false },
  isScrubbing: true,
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
  locale: 'en',
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
        <NumberFieldRootContext.Provider value={defaultTestContext}>
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

  it('renders when using mouse input', async () => {
    const originalRequestPointerLock = Element.prototype.requestPointerLock;

    try {
      Element.prototype.requestPointerLock = sinon.stub().resolves();

      const { user } = await render(
        <NumberField.Root>
          <NumberField.ScrubArea data-testid="scrub-area">
            <NumberField.ScrubAreaCursor data-testid="scrub-area-cursor" />
          </NumberField.ScrubArea>
        </NumberField.Root>,
      );

      const scrubArea = screen.getByTestId('scrub-area');

      await act(async () => {
        await user.pointer({ target: scrubArea, keys: '[MouseLeft>]', pointerName: 'mouse' });
        await new Promise((resolve) => {
          setTimeout(resolve, 25);
        });
      });

      expect(screen.queryByTestId('scrub-area-cursor')).not.to.equal(null);
    } finally {
      Element.prototype.requestPointerLock = originalRequestPointerLock;
    }
  });

  it('does not render when using touch input', async () => {
    const { user } = await render(
      <NumberField.Root>
        <NumberField.ScrubArea>
          <NumberField.ScrubAreaCursor data-testid="scrub-area-cursor" />
        </NumberField.ScrubArea>
      </NumberField.Root>,
    );

    const scrubArea = screen.getByRole('presentation');

    await act(async () => {
      await user.pointer({ target: scrubArea, keys: '[TouchA>]', pointerName: 'touch' });
      await new Promise((resolve) => {
        setTimeout(resolve, 25);
      });
    });

    expect(screen.queryByTestId('scrub-area-cursor')).to.equal(null);
  });

  it('handles pointer lock denial through requestPointerLock API', async () => {
    const originalRequestPointerLock = Element.prototype.requestPointerLock;

    try {
      Element.prototype.requestPointerLock = sinon
        .stub()
        .throws(new Error('User denied pointer lock'));

      const { user } = await render(
        <NumberField.Root>
          <NumberField.ScrubArea>
            <NumberField.ScrubAreaCursor data-testid="scrub-area-cursor" />
          </NumberField.ScrubArea>
        </NumberField.Root>,
      );

      const scrubArea = screen.getByRole('presentation');

      await act(async () => {
        await user.pointer({ target: scrubArea, keys: '[MouseLeft>]', pointerName: 'mouse' });
        await new Promise((resolve) => {
          setTimeout(resolve, 25);
        });
      });

      expect(screen.queryByTestId('scrub-area-cursor')).to.equal(null);

      const requestLockStub = Element.prototype.requestPointerLock as sinon.SinonStub;
      expect(requestLockStub.called).to.equal(true);
    } finally {
      Element.prototype.requestPointerLock = originalRequestPointerLock;
    }
  });
});
