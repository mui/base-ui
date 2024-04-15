import * as React from 'react';
import { expect } from 'chai';
import { createRenderer, screen, waitFor } from '@mui/internal-test-utils';
import * as NumberField from '@base_ui/react/NumberField';
import { describeConformance } from '../../test/describeConformance';
import { NumberFieldContext, NumberFieldContextValue } from './NumberFieldContext';

function createPointerMoveEvent({ movementX = 0, movementY = 0 }) {
  return new PointerEvent('pointermove', {
    bubbles: true,
    movementX,
    movementY,
  });
}

const testContext = {
  getScrubAreaProps: (externalProps) => externalProps,
  ownerState: {
    value: null,
    required: false,
    disabled: false,
    invalid: false,
    readOnly: false,
  },
} as NumberFieldContextValue;

describe('<NumberField.ScrubArea />', () => {
  const { render } = createRenderer();

  describeConformance(<NumberField.ScrubArea />, () => ({
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

  if (/jsdom/.test(window.navigator.userAgent)) {
    return;
  }

  const pointerDownEvent = new PointerEvent('pointerdown', {
    bubbles: true,
    clientX: 100,
    clientY: 100,
  });

  it('should increment or decrement the value when scrubbing with the pointer', async () => {
    render(
      <NumberField.Root defaultValue={0}>
        <NumberField.Input />
        <NumberField.ScrubArea data-testid="scrub-area">
          <NumberField.ScrubAreaCursor />
        </NumberField.ScrubArea>
      </NumberField.Root>,
    );

    const scrubArea = screen.getByTestId('scrub-area');
    const input = screen.getByRole('textbox');

    scrubArea.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100 }),
    );
    scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: 10 }));

    await waitFor(() => expect(input).to.have.value('-10'));

    scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: -5 }));

    await waitFor(() => expect(input).to.have.value('-5'));

    scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: 2 }));

    await waitFor(() => expect(input).to.have.value('-7'));
  });

  describe('prop: pixelSensitivity', () => {
    it('should only increment if the pointer movement was greater than or equal to the value', async () => {
      render(
        <NumberField.Root defaultValue={0}>
          <NumberField.Input />
          <NumberField.ScrubArea data-testid="scrub-area" pixelSensitivity={5}>
            <NumberField.ScrubAreaCursor />
          </NumberField.ScrubArea>
        </NumberField.Root>,
      );

      const scrubArea = screen.getByTestId('scrub-area');
      const input = screen.getByRole('textbox');

      scrubArea.dispatchEvent(pointerDownEvent);
      scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: 2 }));

      await waitFor(() => expect(input).to.have.value('0'));

      scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: -2 }));

      await waitFor(() => expect(input).to.have.value('0'));

      scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: -1 }));
      scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: -1 }));
      scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: -1 }));
      scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: -1 }));

      await waitFor(() => expect(input).to.have.value('0'));

      scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: -1 }));

      await waitFor(() => expect(input).to.have.value('1'));

      scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: -5 }));

      await waitFor(() => expect(input).to.have.value('6'));

      scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: 4 }));

      await waitFor(() => expect(input).to.have.value('6'));

      scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: 1 }));

      await waitFor(() => expect(input).to.have.value('5'));

      scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: -5 }));

      await waitFor(() => expect(input).to.have.value('10'));
    });
  });

  describe('prop: direction', () => {
    it('should only scrub if the pointer moved in the given direction', async () => {
      render(
        <NumberField.Root defaultValue={0}>
          <NumberField.Input />
          <NumberField.ScrubArea data-testid="scrub-area" direction="horizontal">
            <NumberField.ScrubAreaCursor />
          </NumberField.ScrubArea>
        </NumberField.Root>,
      );

      const scrubArea = screen.getByTestId('scrub-area');
      const input = screen.getByRole('textbox');

      scrubArea.dispatchEvent(pointerDownEvent);
      scrubArea.dispatchEvent(createPointerMoveEvent({ movementX: 10 }));

      await waitFor(() => expect(input).to.have.value('10'));

      scrubArea.dispatchEvent(createPointerMoveEvent({ movementY: 10 }));

      await waitFor(() => expect(input).to.have.value('10'));
    });
  });
});
