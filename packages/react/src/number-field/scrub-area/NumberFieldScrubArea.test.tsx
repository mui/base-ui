import * as React from 'react';
import { expect } from 'chai';
import { screen, waitFor, act } from '@mui/internal-test-utils';
import { NumberField } from '@base-ui-components/react/number-field';
import { createRenderer, describeConformance } from '#test-utils';
import { isWebKit } from '../../utils/detectBrowser';
import { NumberFieldRootContext } from '../root/NumberFieldRootContext';

function createPointerMoveEvent({ movementX = 0, movementY = 0 }) {
  return new PointerEvent('pointermove', {
    bubbles: true,
    movementX,
    movementY,
  });
}

const testContext = {
  getScrubAreaProps: (externalProps) => externalProps,
  state: {
    value: null,
    required: false,
    disabled: false,
    invalid: false,
    readOnly: false,
  },
} as NumberFieldRootContext;

describe('<NumberField.ScrubArea />', () => {
  const { render } = createRenderer();

  describeConformance(<NumberField.ScrubArea />, () => ({
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

  // Only run the following tests in Chromium/Firefox.
  if (/jsdom/.test(window.navigator.userAgent) || isWebKit()) {
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
      scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: 10 }));
    });

    await waitFor(() => expect(input).to.have.value('-10'));
    await act(async () => {
      scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: -5 }));
    });

    await waitFor(() => expect(input).to.have.value('-5'));

    await act(async () => {
      scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: 2 }));
    });

    await waitFor(() => expect(input).to.have.value('-7'));
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
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: 2 }));
      });

      await waitFor(() => expect(input).to.have.value('0'));

      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: -2 }));
      });

      await waitFor(() => expect(input).to.have.value('0'));

      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: -1 }));
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: -1 }));
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: -1 }));
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: -1 }));
      });

      await waitFor(() => expect(input).to.have.value('0'));

      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: -1 }));
      });

      await waitFor(() => expect(input).to.have.value('1'));

      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: -5 }));
      });

      await waitFor(() => expect(input).to.have.value('6'));

      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: 4 }));
      });

      await waitFor(() => expect(input).to.have.value('6'));

      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: 1 }));
      });

      await waitFor(() => expect(input).to.have.value('5'));

      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: -5 }));
      });

      await waitFor(() => expect(input).to.have.value('10'));
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

      await waitFor(() => expect(input).to.have.value('10'));

      await act(async () => {
        scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: 10 }));
      });

      await waitFor(() => expect(input).to.have.value('10'));
    });
  });
});
