import * as React from 'react';
import { expect } from 'chai';
import { screen, act } from '@mui/internal-test-utils';
import sinon from 'sinon';
import { NumberField } from '@base-ui/react/number-field';
import { isWebKit } from '@base-ui/utils/detectBrowser';
import { createRenderer, describeConformance } from '#test-utils';
import { NumberFieldScrubAreaContext } from '../scrub-area/NumberFieldScrubAreaContext';

const defaultScrubAreaContext: NumberFieldScrubAreaContext = {
  isScrubbing: true,
  isTouchInput: false,
  isPointerLockDenied: false,
  direction: 'horizontal',
  pixelSensitivity: 2,
  teleportDistance: undefined,
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
          <NumberField.Input />
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

  it('only renders a cursor for the active scrub area', async () => {
    const originalRequestPointerLock = Element.prototype.requestPointerLock;

    try {
      Element.prototype.requestPointerLock = sinon.stub().resolves();

      const { user } = await render(
        <NumberField.Root>
          <NumberField.Input />
          <NumberField.ScrubArea data-testid="scrub-area-1">
            <NumberField.ScrubAreaCursor data-testid="scrub-area-cursor" />
          </NumberField.ScrubArea>
          <NumberField.ScrubArea data-testid="scrub-area-2">
            <NumberField.ScrubAreaCursor data-testid="scrub-area-cursor" />
          </NumberField.ScrubArea>
        </NumberField.Root>,
      );

      const firstScrubArea = screen.getByTestId('scrub-area-1');

      await act(async () => {
        await user.pointer({ target: firstScrubArea, keys: '[MouseLeft>]', pointerName: 'mouse' });
        await new Promise((resolve) => {
          setTimeout(resolve, 25);
        });
      });

      expect(screen.queryAllByTestId('scrub-area-cursor')).to.have.length(1);
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

  it('does not render after a quick tap when pointer lock resolves later', async () => {
    const originalRequestPointerLock = Element.prototype.requestPointerLock;

    try {
      // Simulate pointer lock resolving after the user already released the pointer (tap)
      Element.prototype.requestPointerLock = sinon.stub().returns(
        new Promise((resolve) => {
          setTimeout(resolve, 30);
        }),
      );

      const { user } = await render(
        <NumberField.Root>
          <NumberField.Input />
          <NumberField.ScrubArea data-testid="scrub-area">
            <NumberField.ScrubAreaCursor data-testid="scrub-area-cursor" />
          </NumberField.ScrubArea>
        </NumberField.Root>,
      );

      const scrubArea = screen.getByTestId('scrub-area');

      await act(async () => {
        // Quick press and release (tap)
        await user.pointer({ target: scrubArea, keys: '[MouseLeft>]', pointerName: 'mouse' });
        await user.pointer({ target: scrubArea, keys: '[/MouseLeft]', pointerName: 'mouse' });
        window.dispatchEvent(new Event('pointerup'));
        // Wait longer than the delayed pointer lock resolution
        await new Promise((resolve) => {
          setTimeout(resolve, 50);
        });
      });

      // After a tap, the scrub cursor should not remain rendered
      expect(screen.queryByTestId('scrub-area-cursor')).to.equal(null);
    } finally {
      Element.prototype.requestPointerLock = originalRequestPointerLock;
    }
  });
});
