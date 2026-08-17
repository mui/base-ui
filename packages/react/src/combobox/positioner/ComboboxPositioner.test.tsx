import { expect, vi } from 'vitest';
import * as React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import { screen, waitFor } from '@mui/internal-test-utils';
import { Combobox } from '@base-ui/react/combobox';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<Combobox.Positioner />', () => {
  const { render } = createRenderer();

  it('should not lock body scroll when controlled value={[]} triggers a re-render', async () => {
    // Render outside of act() to match real browser behavior where
    // the initial render and the useEffect re-render are separate commits.
    // Using act() batches them, hiding the bug.
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const container = document.createElement('div');
    document.body.appendChild(container);
    document.body.removeAttribute('style');
    document.documentElement.removeAttribute('style');

    function Test() {
      const [, forceRender] = React.useState(0);
      React.useEffect(() => {
        forceRender(1);
      }, []);

      return (
        <Combobox.Root multiple value={[]}>
          <Combobox.Input />
          <Combobox.Portal>
            <Combobox.Positioner />
          </Combobox.Portal>
        </Combobox.Root>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    root.render(<Test />);

    // Wait for mount + useEffect re-render + setTimeout(0) in ScrollLocker.acquire
    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });

    // Bug: the re-render causes forceMount, mounting the Positioner.
    // The Positioner's `open` is `undefined` (not `false`), so
    // `open && modal` evaluates to `undefined`, which triggers
    // useScrollLock's default parameter `enabled = true`.
    const bodyOverflowX = document.body.style.overflowX;
    const bodyOverflowY = document.body.style.overflowY;
    const htmlOverflowX = document.documentElement.style.overflowX;
    const htmlOverflowY = document.documentElement.style.overflowY;

    root.unmount();
    container.remove();
    document.body.removeAttribute('style');
    document.documentElement.removeAttribute('style');
    consoleSpy.mockRestore();

    expect(bodyOverflowX).not.toBe('hidden');
    expect(bodyOverflowY).not.toBe('hidden');
    expect(htmlOverflowX).not.toBe('hidden');
    expect(htmlOverflowY).not.toBe('hidden');
  });

  describeConformance(<Combobox.Positioner />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Combobox.Root open>
          <Combobox.Portal>{node}</Combobox.Portal>
        </Combobox.Root>,
      );
    },
  }));

  // https://github.com/mui/base-ui/issues/5118
  it.skipIf(isJSDOM)(
    'keeps the popup on the preferred side when its capped height fits below tall content',
    async () => {
      const items = Array.from({ length: 40 }, (_, index) => `item-${index}`);

      await render(
        // Anchor fixed near the bottom of the viewport: less room below than above,
        // but still more than the List's capped height.
        <div style={{ position: 'fixed', bottom: 120, left: 100 }}>
          <Combobox.Root open items={items}>
            <Combobox.Input />
            <Combobox.Portal>
              <Combobox.Positioner data-testid="positioner" side="bottom" sideOffset={0}>
                <Combobox.Popup>
                  <Combobox.List
                    style={{ maxHeight: 'min(80px, var(--available-height))', overflowY: 'auto' }}
                  >
                    {(item: string) => (
                      <Combobox.Item key={item} value={item} style={{ height: 30 }}>
                        {item}
                      </Combobox.Item>
                    )}
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </div>,
      );

      // The 40-item list (~1200px) overflows the room below the anchor, but the List is
      // capped to 80px which fits. The `--available-height` var must be seeded before
      // `size()` runs, otherwise `min(80px, var(--available-height))` is invalid on the
      // first `flip()` pass, the list is measured at full height, and the popup flips up.
      await waitFor(() => {
        expect(screen.getByTestId('positioner')).toHaveAttribute('data-side', 'bottom');
      });
    },
  );

  describe.skipIf(isJSDOM)('default anchor', () => {
    it('uses the input when input group is absent', async () => {
      const inputWidth = 120;
      const triggerWidth = 240;
      let anchorWidth = 0;
      const inputRef = React.createRef<HTMLInputElement>();

      await render(
        <Combobox.Root open>
          <Combobox.Input ref={inputRef} style={{ width: inputWidth }} />
          <Combobox.Trigger style={{ width: triggerWidth }}>Open</Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner
              sideOffset={(data) => {
                anchorWidth = data.anchor.width;
                return 0;
              }}
            >
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="One">One</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      await waitFor(() => {
        expect(anchorWidth).toBeCloseTo(inputRef.current!.getBoundingClientRect().width, 0);
        expect(anchorWidth).not.toBeCloseTo(triggerWidth, 0);
      });
    });

    it('uses the input group when present', async () => {
      const inputGroupWidth = 240;
      const inputWidth = 120;
      let anchorWidth = 0;

      await render(
        <Combobox.Root open>
          <Combobox.InputGroup style={{ width: inputGroupWidth }}>
            <Combobox.Input style={{ width: inputWidth }} />
            <Combobox.Trigger>Open</Combobox.Trigger>
          </Combobox.InputGroup>
          <Combobox.Portal>
            <Combobox.Positioner
              sideOffset={(data) => {
                anchorWidth = data.anchor.width;
                return 0;
              }}
            >
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="One">One</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      await waitFor(() => {
        expect(anchorWidth).toBeCloseTo(inputGroupWidth, 0);
      });
    });
  });
});
