import * as React from 'react';
import { expect, vi, describe, beforeEach, it, afterEach } from 'vitest';
import { Select } from '@base-ui/react/select';
import { Virtualizer } from '@base-ui/react/virtualizer';
import { flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, createDOMRect, setElementClientHeight } from '#test-utils';

function getOptions() {
  return screen.queryAllByRole('option');
}

function createItems(count: number) {
  return Array.from({ length: count }, (_, index) => `item-${index}`);
}

describe('Select virtualization — aligned placement', () => {
  const { render } = createRenderer();

  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect(
      this: HTMLElement,
    ) {
      if (this.hasAttribute('data-index')) {
        return createDOMRect({ height: 20, width: 200 });
      }
      return createDOMRect({ height: 60, width: 200 });
    });
  });

  describe('S1-1 — a registered virtualizer suppresses aligned placement', () => {
    /**
     * Deliberately rendered without `<Select.Popup>`. The popup's placement effect falls back to
     * anchored placement when it cannot measure, which would turn alignment off for the wrong
     * reason and let this test pass while the gate is still wrong.
     */
    it('suppresses aligned placement for a registered disabled virtualizer', async () => {
      await render(
        <Select.Root defaultOpen items={createItems(4)}>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner data-testid="positioner">
              <Select.List>
                <Virtualizer
                  enabled={false}
                  estimatedItemHeight={20}
                  render={<div ref={setElementClientHeight(60)} />}
                >
                  {(item: string) => <Select.Item value={item}>{item}</Select.Item>}
                </Virtualizer>
              </Select.List>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      await waitFor(() => {
        expect(getOptions().length).toBe(4);
      });

      expect(screen.getByTestId('positioner')).not.toHaveAttribute('data-side', 'none');
    });
  });

  /**
   * A real aligned session. The suite-wide rect mock anchors every box at the origin, which trips
   * `triggerRect.top < triggerCollisionThreshold` and makes the popup fall back to anchored
   * placement before it writes anything — so alignment has to be given room here to be observed.
   */
  describe('with room for aligned placement', () => {
    beforeEach(() => {
      Object.defineProperty(document.documentElement, 'clientHeight', {
        configurable: true,
        value: 800,
      });
      Object.defineProperty(document.documentElement, 'clientWidth', {
        configurable: true,
        value: 1000,
      });
    });

    afterEach(() => {
      // Own properties survive the renderer's mock restoration, unlike the `vi.spyOn` above, so
      // anything appended to the outer describe would inherit this viewport.
      delete (document.documentElement as any).clientHeight;
      delete (document.documentElement as any).clientWidth;
    });

    beforeEach(() => {
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect(
        this: HTMLElement,
      ) {
        if (this.tagName === 'BUTTON') {
          return createDOMRect({ height: 30, width: 200, x: 100, y: 300 });
        }
        if (this.hasAttribute('data-index')) {
          return createDOMRect({ height: 20, width: 200, x: 100, y: 300 });
        }
        return createDOMRect({ height: 200, width: 200, x: 100, y: 250 });
      });
    });

    function LateVirtualizer(props: { virtualized: boolean }) {
      return (
        <Select.Root defaultOpen items={createItems(4)} value="item-1">
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner data-testid="positioner">
              <Select.Popup data-testid="popup">
                <Select.List>
                  {props.virtualized ? (
                    <Virtualizer
                      enabled={false}
                      estimatedItemHeight={20}
                      render={<div ref={setElementClientHeight(60)} />}
                    >
                      {(item: string) => (
                        <Select.Item value={item}>
                          <Select.ItemText>{item}</Select.ItemText>
                        </Select.Item>
                      )}
                    </Virtualizer>
                  ) : (
                    createItems(4).map((item) => (
                      <Select.Item key={item} value={item}>
                        <Select.ItemText>{item}</Select.ItemText>
                      </Select.Item>
                    ))
                  )}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      );
    }

    it('clears the aligned geometry when a virtualizer registers into an aligned popup', async () => {
      const { setProps } = await render(<LateVirtualizer virtualized={false} />);

      await waitFor(() => {
        expect(getOptions().length).toBe(4);
      });

      const positioner = screen.getByTestId('positioner');
      // The static list really is aligned, so there is geometry to clear.
      expect(positioner).toHaveAttribute('data-side', 'none');
      expect(positioner.style.maxHeight).toBe('none');

      await setProps({ virtualized: true });
      await flushMicrotasks();

      // Reached only because the popup's guard keys on registration: with the positioner predicate
      // alone the measurement still runs on the registration commit and leaves these behind.
      expect(positioner.style.maxHeight).toBe('');
      expect(positioner.style.bottom).toBe('');
      expect(positioner.style.marginTop).toBe('');
    });

    it('does not carry a transform origin from an aligned session into a virtualized one', async () => {
      const { setProps } = await render(<LateVirtualizer virtualized={false} />);

      await waitFor(() => {
        expect(getOptions().length).toBe(4);
      });
      expect(screen.getByTestId('popup').style.getPropertyValue('--transform-origin')).not.toBe('');

      await setProps({ virtualized: true });
      await flushMicrotasks();

      expect(screen.getByTestId('popup').style.getPropertyValue('--transform-origin')).toBe('');
    });
  });
});
