import { expect } from 'chai';
import { screen, act } from '@mui/internal-test-utils';
import { spy } from 'sinon';
import { NumberField } from '@base-ui-components/react/number-field';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { isWebKit } from '@base-ui-components/utils/detectBrowser';

function createPointerMoveEvent({ movementX = 0, movementY = 0 }) {
  return new PointerEvent('pointermove', {
    bubbles: true,
    movementX,
    movementY,
  });
}

describe('<NumberField.ScrubArea />', () => {
  const { render } = createRenderer();

  describeConformance(<NumberField.ScrubArea />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render: async (node) => {
      return render(<NumberField.Root>{node}</NumberField.Root>);
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

  // Only run the following tests in Chromium/Firefox.
  if (isJSDOM || isWebKit) {
    return;
  }

  // `PointerEvent` isn't defined in JSDOM. This needs to be located beneath the return above.
  const pointerDownEvent = new PointerEvent('pointerdown', {
    bubbles: true,
    clientX: 100,
    clientY: 100,
  });

  it('should increment or decrement the value when scrubbing with the pointer', async () => {
    await render(
      <NumberField.Root defaultValue={0}>
        <NumberField.Input />
        <NumberField.ScrubArea data-testid="scrub-area">
          <NumberField.ScrubAreaCursor />
        </NumberField.ScrubArea>
      </NumberField.Root>,
    );

    const scrubArea = screen.getByTestId('scrub-area');
    const input = screen.getByRole('textbox');

    await act(async () => {
      scrubArea.dispatchEvent(pointerDownEvent);
      scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: -10 }));
    });

    expect(input).to.have.value('-10');
    await act(async () => {
      scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 5 }));
    });

    expect(input).to.have.value('-5');

    await act(async () => {
      scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: -2 }));
    });

    expect(input).to.have.value('-7');
  });

  it('calls onValueChange while scrubbing and onValueCommitted on pointerup', async () => {
    const onValueChange = spy();
    const onValueCommitted = spy();

    await render(
      <NumberField.Root
        defaultValue={0}
        onValueChange={onValueChange}
        onValueCommitted={onValueCommitted}
      >
        <NumberField.Input />
        <NumberField.ScrubArea data-testid="scrub-area">
          <NumberField.ScrubAreaCursor />
        </NumberField.ScrubArea>
      </NumberField.Root>,
    );

    const scrubArea = screen.getByTestId('scrub-area');

    await act(async () => {
      scrubArea.dispatchEvent(pointerDownEvent);
      scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 3 }));
    });

    // One or more changes depending on pixel sensitivity and environment
    expect(onValueChange.callCount).to.be.greaterThan(0);

    await act(async () => {
      window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    });

    expect(onValueCommitted.callCount).to.equal(1);

    const lastChange = onValueChange.lastCall.args[0];
    const committed = onValueCommitted.firstCall.args[0];
    expect(committed).to.equal(lastChange);
  });

  describe('prop: pixelSensitivity', () => {
    it('should only increment if the pointer movement was greater than or equal to the value', async () => {
      await render(
        <NumberField.Root defaultValue={0}>
          <NumberField.Input />
          <NumberField.ScrubArea data-testid="scrub-area" pixelSensitivity={5}>
            <NumberField.ScrubAreaCursor />
          </NumberField.ScrubArea>
        </NumberField.Root>,
      );

      const scrubArea = screen.getByTestId('scrub-area');
      const input = screen.getByRole('textbox');

      await act(async () => {
        scrubArea.dispatchEvent(pointerDownEvent);
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: -2 }));
      });

      expect(input).to.have.value('0');

      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 2 }));
      });

      expect(input).to.have.value('0');

      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 1 }));
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 1 }));
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 1 }));
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 1 }));
      });

      expect(input).to.have.value('0');

      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 1 }));
      });

      expect(input).to.have.value('1');

      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 5 }));
      });

      expect(input).to.have.value('6');

      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: -4 }));
      });

      expect(input).to.have.value('6');

      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: -1 }));
      });

      expect(input).to.have.value('5');

      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 5 }));
      });

      expect(input).to.have.value('10');
    });
  });

  describe('prop: direction', () => {
    it('should only scrub if the pointer moved in the given direction', async () => {
      await render(
        <NumberField.Root defaultValue={0}>
          <NumberField.Input />
          <NumberField.ScrubArea data-testid="scrub-area" direction="horizontal">
            <NumberField.ScrubAreaCursor />
          </NumberField.ScrubArea>
        </NumberField.Root>,
      );

      const scrubArea = screen.getByTestId('scrub-area');
      const input = screen.getByRole('textbox');

      await act(async () => {
        scrubArea.dispatchEvent(pointerDownEvent);
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 10 }));
      });

      expect(input).to.have.value('10');

      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: 10 }));
      });

      expect(input).to.have.value('10');
    });
  });
});
