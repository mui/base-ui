import * as React from 'react';
import { afterEach, beforeEach, expect } from 'vitest';
import { act, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { isJSDOM } from '@base-ui/utils/detectBrowser';
import { Popover } from '@base-ui/react/popover';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Popover.Portal />', () => {
  const { render } = createRenderer();

  describeConformance(<Popover.Portal />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Popover.Root open>{node}</Popover.Root>);
    },
  }));

  describe.skipIf(!isJSDOM)('fullscreen rerouting follows the resolved anchor', () => {
    let fullscreenElement: Element | null = null;
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      Document.prototype,
      'fullscreenElement',
    );

    beforeEach(() => {
      fullscreenElement = null;
      Object.defineProperty(Document.prototype, 'fullscreenElement', {
        configurable: true,
        get: () => fullscreenElement,
      });
    });

    afterEach(() => {
      fullscreenElement = null;
      if (originalDescriptor) {
        Object.defineProperty(Document.prototype, 'fullscreenElement', originalDescriptor);
      } else {
        Reflect.deleteProperty(Document.prototype, 'fullscreenElement');
      }
    });

    function setFullscreenElement(element: Element | null) {
      fullscreenElement = element;
      document.dispatchEvent(new Event('fullscreenchange'));
    }

    function TestPopover({
      open,
      anchorElement,
    }: {
      open: boolean;
      anchorElement: Element;
    }) {
      return (
        <Popover.Root open={open}>
          <Popover.Trigger>trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner anchor={anchorElement}>
              <Popover.Popup data-testid="popup">popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      );
    }

    test('reroutes into fullscreen when the custom anchor lives inside the fullscreen subtree', async () => {
      // Trigger is rendered in `document.body` (outside fullscreen). The
      // positioner is anchored to a button inside the fullscreened container,
      // so the popup must follow the anchor into the fullscreen subtree.
      const fsContainer = document.createElement('div');
      document.body.appendChild(fsContainer);
      const anchorButton = document.createElement('button');
      anchorButton.textContent = 'anchor';
      fsContainer.appendChild(anchorButton);

      try {
        const { setPropsAsync } = await render(
          <TestPopover open anchorElement={anchorButton} />,
        );
        await flushMicrotasks();

        await act(async () => {
          setFullscreenElement(fsContainer);
        });
        await flushMicrotasks();

        const popup = await screen.findByTestId('popup');
        expect(fsContainer.contains(popup)).toBe(true);

        // Close the popup before the test ends so Floating UI's autoUpdate
        // listeners detach and don't fire updates after teardown.
        await setPropsAsync({ open: false, anchorElement: anchorButton });
      } finally {
        fsContainer.remove();
      }
    });

    test('does not reroute when both trigger and custom anchor are outside the fullscreen subtree', async () => {
      // The user fullscreens a sibling element that contains neither the
      // trigger nor the anchor. The popup must stay in body — rerouting it
      // into the fullscreened sibling would render it visible but anchored to
      // an off-screen element.
      const fsContainer = document.createElement('div');
      document.body.appendChild(fsContainer);
      const externalAnchor = document.createElement('button');
      externalAnchor.textContent = 'anchor';
      document.body.appendChild(externalAnchor);

      try {
        const { setPropsAsync } = await render(
          <TestPopover open anchorElement={externalAnchor} />,
        );
        await flushMicrotasks();

        await act(async () => {
          setFullscreenElement(fsContainer);
        });
        await flushMicrotasks();

        const popup = await screen.findByTestId('popup');
        expect(fsContainer.contains(popup)).toBe(false);
        expect(document.body.contains(popup)).toBe(true);

        await setPropsAsync({ open: false, anchorElement: externalAnchor });
      } finally {
        fsContainer.remove();
        externalAnchor.remove();
      }
    });
  });
});
