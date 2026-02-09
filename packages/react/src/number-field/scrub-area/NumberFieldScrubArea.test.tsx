import { expect } from 'chai';
import { screen, act } from '@mui/internal-test-utils';
import { spy } from 'sinon';
import { NumberField } from '@base-ui/react/number-field';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { isWebKit } from '@base-ui/utils/detectBrowser';

// TODO (@Janpot): Contribute https://github.com/testing-library/user-event/issues/903 and
// rely on `user.pointer()` instead.
let currentPos = { clientX: 0, clientY: 0 };

function createPointerDownEvent(elm: HTMLElement) {
  const box = elm.getBoundingClientRect();
  const centerX = box.left + box.width / 2;
  const centerY = box.top + box.height / 2;
  currentPos = { clientX: centerX, clientY: centerY };
  return new PointerEvent('pointerdown', {
    bubbles: true,
    ...currentPos,
  });
}

function createPointerMoveEvent({ movementX = 0, movementY = 0 }) {
  currentPos = {
    clientX: currentPos.clientX + movementX,
    clientY: currentPos.clientY + movementY,
  };
  return new PointerEvent('pointermove', {
    bubbles: true,
    ...currentPos,
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
      scrubArea.dispatchEvent(createPointerDownEvent(scrubArea));
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
      scrubArea.dispatchEvent(createPointerDownEvent(scrubArea));
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
        scrubArea.dispatchEvent(createPointerDownEvent(scrubArea));
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
        scrubArea.dispatchEvent(createPointerDownEvent(scrubArea));
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 10 }));
      });

      expect(input).to.have.value('10');

      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: 10 }));
      });

      expect(input).to.have.value('10');
    });
  });

  it('should fire onClick when clicked without scrubbing', async () => {
    const handleClick = spy();

    const { user } = await render(
      <NumberField.Root defaultValue={0}>
        <NumberField.ScrubArea data-testid="scrub-area" onClick={handleClick}>
          <NumberField.ScrubAreaCursor />
        </NumberField.ScrubArea>
      </NumberField.Root>,
    );

    await user.click(screen.getByTestId('scrub-area'));

    expect(handleClick.callCount).to.equal(1);
  });

  it('should fire onClick on child elements', async () => {
    const handleScrubAreaClick = spy();
    const handleLabelClick = spy();

    const { user } = await render(
      <NumberField.Root defaultValue={0}>
        <NumberField.ScrubArea onClick={handleScrubAreaClick}>
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <label onClick={handleLabelClick}>Amount</label>
          <NumberField.ScrubAreaCursor />
        </NumberField.ScrubArea>
      </NumberField.Root>,
    );

    await user.click(screen.getByText('Amount'));

    expect(handleLabelClick.callCount).to.equal(1);
    expect(handleScrubAreaClick.callCount).to.equal(1);
  });
});
