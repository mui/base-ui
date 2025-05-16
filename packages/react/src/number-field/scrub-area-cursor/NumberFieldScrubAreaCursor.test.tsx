import * as React from 'react';
import { expect } from 'chai';
import { screen, act } from '@mui/internal-test-utils';
import sinon from 'sinon';
import { NumberField } from '@base-ui-components/react/number-field';
import { createRenderer, describeConformance } from '#test-utils';
import { isWebKit } from '../../utils/detectBrowser';
import { NumberFieldScrubAreaContext } from '../scrub-area/NumberFieldScrubAreaContext';

const defaultScrubAreaContext: NumberFieldScrubAreaContext = {
  isScrubbing: true,
  isTouchInput: false,
  isPointerLockDenied: false,
  direction: 'horizontal',
  pixelSensitivity: 2,
  teleportDistance: undefined,
  getScrubAreaProps: (p = {}) => p,
  scrubAreaCursorRef: React.createRef<HTMLSpanElement>(),
  scrubAreaRef: React.createRef<HTMLDivElement>(),
};

// This component doesn't render on WebKit.
describe.skipIf(isWebKit)('<NumberField.ScrubAreaCursor />', () => {
  const { render } = createRenderer();

  describeConformance(<NumberField.ScrubAreaCursor />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(
        <NumberField.Root>
          <NumberField.ScrubArea>
            <NumberFieldScrubAreaContext.Provider value={defaultScrubAreaContext}>
              {node}
            </NumberFieldScrubAreaContext.Provider>
          </NumberField.ScrubArea>
        </NumberField.Root>,
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
