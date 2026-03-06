import * as React from 'react';
import { DrawerPreview as Drawer } from '@base-ui/react/drawer';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { describe, expect, it } from 'vitest';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<Drawer.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<Drawer.Popup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Drawer.Root open>
          <Drawer.Portal>{node}</Drawer.Portal>
        </Drawer.Root>,
      );
    },
  }));

  it('defaults initial focus to the popup element', async () => {
    await render(
      <div>
        <input />
        <Drawer.Root modal={false}>
          <Drawer.Trigger>Open</Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup data-testid="popup">
                <input data-testid="popup-input" />
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      </div>,
    );

    await act(async () => {
      screen.getByRole('button', { name: 'Open' }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('popup')).toHaveFocus();
      expect(screen.getByTestId('popup-input')).not.toHaveFocus();
    });
  });

  it.skipIf(isJSDOM)(
    'includes border size in frontmost height CSS variable for nested drawers',
    async () => {
      await render(
        <Drawer.Root open>
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup data-testid="parent-popup">
                <Drawer.Root open>
                  <Drawer.Portal>
                    <Drawer.Viewport>
                      <Drawer.Popup
                        data-testid="child-popup"
                        style={{
                          height: 100,
                          borderTop: '2px solid transparent',
                          borderBottom: '2px solid transparent',
                        }}
                      >
                        <div style={{ height: 10 }}>Child drawer</div>
                      </Drawer.Popup>
                    </Drawer.Viewport>
                  </Drawer.Portal>
                </Drawer.Root>
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>,
      );

      const parentPopup = screen.getByTestId('parent-popup');
      const childPopup = screen.getByTestId('child-popup');

      await waitFor(() => {
        expect(childPopup.offsetHeight).toBeGreaterThan(childPopup.scrollHeight);
        expect(parentPopup.style.getPropertyValue('--drawer-frontmost-height')).toBe(
          `${childPopup.offsetHeight}px`,
        );
      });
    },
  );
});
