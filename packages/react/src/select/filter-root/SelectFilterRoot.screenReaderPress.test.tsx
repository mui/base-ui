import * as React from 'react';
import { fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { describe, it, expect, beforeEach } from 'vitest';
import { createRenderer, isJSDOM, resetBrowserPointer } from '#test-utils';
import { Select } from '@base-ui/react/select';

function Test() {
  return (
    <Select.FilterProvider>
      <Select.Root>
        <Select.Trigger data-testid="trigger">
          <Select.Value placeholder="Country" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup data-testid="popup">
              <Select.FilterInput aria-label="Filter countries" />
              <Select.List>
                <Select.Item value="au">Australia</Select.Item>
                <Select.Item value="fr">France</Select.Item>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </Select.FilterProvider>
  );
}

function fireScreenReaderMouseDown(element: Element) {
  fireEvent.pointerDown(element, {
    pointerType: 'mouse',
    width: 1,
    height: 1,
    pressure: 0,
    detail: 0,
  });
  fireEvent.mouseDown(element, { detail: 0 });
}

// Chrome performs a screen reader activation (TalkBack, VoiceOver, NVDA) as a synthetic mouse
// press: a zero-pressure 1x1 `pointerdown` followed by `mousedown` and a `detail: 0` click.
function fireScreenReaderPress(element: Element) {
  fireScreenReaderMouseDown(element);
  fireEvent.mouseUp(element, { detail: 0 });
  fireEvent.click(element, { detail: 0 });
}

// `isVirtualPointerEvent` returns `false` under jsdom, so the virtual press cannot be detected there.
describe.skipIf(isJSDOM)('<Select.FilterProvider /> with a screen reader press', () => {
  beforeEach(resetBrowserPointer);
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  it('opens the popup, focuses the input, and highlights the first option', async () => {
    await render(<Test />);

    fireScreenReaderPress(screen.getByTestId('trigger'));

    const input = await screen.findByRole('searchbox', { name: 'Filter countries' });
    await waitFor(() => {
      expect(input).toHaveFocus();
    });
    await waitFor(() => {
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('option', { name: 'Australia' }).id,
      );
    });
    // Assistive-technology clicks report no pointer type, so the popup does not trap focus.
    expect(screen.getByTestId('popup')).not.toHaveAttribute('aria-modal');
  });

  it('does not highlight an option after an ordinary mouse press', async () => {
    await render(<Test />);
    const trigger = screen.getByTestId('trigger');

    // A real pressed mouse reports non-zero pressure, so it is not a virtual press.
    fireEvent.pointerDown(trigger, {
      pointerType: 'mouse',
      width: 1,
      height: 1,
      pressure: 0.5,
      detail: 1,
    });
    fireEvent.mouseDown(trigger, { detail: 1 });
    fireEvent.mouseUp(trigger, { detail: 1 });
    fireEvent.click(trigger, { detail: 1 });

    const input = await screen.findByRole('searchbox', { name: 'Filter countries' });
    await waitFor(() => {
      expect(input).toHaveFocus();
    });
    expect(input).not.toHaveAttribute('aria-activedescendant');
  });
});
