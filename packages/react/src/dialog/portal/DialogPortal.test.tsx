import { afterEach, beforeEach, expect } from 'vitest';
import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { act, flushMicrotasks, screen } from '@mui/internal-test-utils';

describe('<Dialog.Portal />', () => {
  const { render } = createRenderer();

  describeConformance(<Dialog.Portal />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Dialog.Root open>{node}</Dialog.Root>);
    },
  }));

  describe.skipIf(!isJSDOM)('fullscreen rerouting', () => {
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

    test('reroutes the dialog into fullscreen regardless of where the trigger lives', async () => {
      // Dialogs are not anchored to their trigger - they're viewport-relative.
      // Even when the trigger is in `document.body` (outside the fullscreen
      // subtree), an open dialog must reroute into the fullscreen element so
      // it stays visible. This is the opposite contract from Popover/Menu,
      // whose popups remain in body when the trigger is off-screen.
      const fsContainer = document.createElement('div');
      document.body.appendChild(fsContainer);

      try {
        const { setPropsAsync } = await render(
          <Dialog.Root open>
            <Dialog.Trigger>open</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Popup data-testid="popup">popup</Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>,
        );
        await flushMicrotasks();

        await act(async () => {
          setFullscreenElement(fsContainer);
        });
        await flushMicrotasks();

        const popup = await screen.findByTestId('popup');
        expect(fsContainer.contains(popup)).toBe(true);

        await setPropsAsync({ open: false });
      } finally {
        fsContainer.remove();
      }
    });
  });

  describe('Suspense integration', () => {
    // Issue #3695
    it('should not throw "Maximum update depth exceeded" when Suspense boundary is outside Portal', async () => {
      function createLazyComponent() {
        let resolvePromise: ((value: { default: React.ComponentType }) => void) | null = null;
        const promise = new Promise<{ default: React.ComponentType }>((resolve) => {
          resolvePromise = resolve;
        });

        return {
          LazyComponent: React.lazy(() => promise),
          resolve(value: { default: React.ComponentType }) {
            if (!resolvePromise) {
              throw new Error('Lazy message resolver not initialized.');
            }
            resolvePromise(value);
          },
        };
      }

      const { LazyComponent, resolve } = createLazyComponent();

      await render(
        <React.Suspense fallback="Loading…">
          <Dialog.Root open>
            <Dialog.Portal>
              <Dialog.Popup>
                <LazyComponent />
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </React.Suspense>,
      );

      expect(await screen.findByText('Loading…')).not.toBe(null);
      resolve({ default: () => <p>Greetings</p> });
      expect(await screen.findByText('Greetings')).not.toBe(null);
    });
  });
});
