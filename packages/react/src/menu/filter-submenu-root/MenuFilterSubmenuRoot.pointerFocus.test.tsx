import * as React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { Menu } from '@base-ui/react/menu';
import { createRenderer, firePointer, resetBrowserPointer, waitSingleFrame } from '#test-utils';

function Test(props: { filteredParent: boolean; autoFocus?: boolean; openOnHover?: boolean }) {
  const Provider = props.filteredParent ? Menu.FilterProvider : React.Fragment;
  return (
    <Provider>
      <Menu.Root defaultOpen modal={false}>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              {props.filteredParent && <Menu.FilterInput aria-label="Filter actions" />}
              <Menu.List data-testid="parent-list">
                <Menu.FilterProvider>
                  <Menu.SubmenuRoot>
                    <Menu.SubmenuTrigger openOnHover={props.openOnHover} delay={0}>
                      More
                    </Menu.SubmenuTrigger>
                    <Menu.Portal>
                      <Menu.Positioner>
                        <Menu.Popup>
                          <Menu.FilterInput
                            aria-label="Filter more actions"
                            autoFocus={props.autoFocus}
                          />
                          <Menu.List>
                            <Menu.Item>Share</Menu.Item>
                          </Menu.List>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Portal>
                  </Menu.SubmenuRoot>
                </Menu.FilterProvider>
              </Menu.List>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </Provider>
  );
}

async function waitForParentFocus(filteredParent: boolean) {
  const owner = filteredParent
    ? screen.getByRole('searchbox', { name: 'Filter actions' })
    : screen.getByTestId('parent-list');
  await waitFor(() => expect(owner).toHaveFocus());
}

async function press(trigger: HTMLElement, pointerType: string) {
  firePointer.down(trigger, { pointerType, timeStamp: 10, width: 10, height: 10, pressure: 0.5 });
  fireEvent.mouseDown(trigger, { detail: 1 });
  await act(() => waitSingleFrame());
  firePointer.up(trigger, { pointerType, timeStamp: 20 });
  fireEvent.mouseUp(trigger, { detail: 1 });
  fireEvent.click(trigger, { detail: 1 });
}

describe.each([false, true])('submenu pointer focus with filteredParent=%s', (filteredParent) => {
  beforeEach(resetBrowserPointer);
  const { render } = createRenderer();

  describe.each([false, true])('autoFocus=%s', (autoFocus) => {
    it.each(['mouse', 'touch', 'pen'])(
      'handles a %s press without hover opening',
      async (pointerType) => {
        await render(
          <Test filteredParent={filteredParent} autoFocus={autoFocus} openOnHover={false} />,
        );
        await waitForParentFocus(filteredParent);
        await press(screen.getByRole('menuitem', { name: 'More' }), pointerType);
        const input = await screen.findByRole('searchbox', { name: 'Filter more actions' });
        await act(() => waitSingleFrame());
        await waitFor(() =>
          expect(input.matches(':focus')).toBe(pointerType === 'mouse' || autoFocus),
        );
      },
    );

    it('handles a touch press with hover opening enabled', async () => {
      await render(<Test filteredParent={filteredParent} autoFocus={autoFocus} />);
      await waitForParentFocus(filteredParent);
      await press(screen.getByRole('menuitem', { name: 'More' }), 'touch');
      const input = await screen.findByRole('searchbox', { name: 'Filter more actions' });
      await act(() => waitSingleFrame());
      await waitFor(() => expect(input.matches(':focus')).toBe(autoFocus));
    });
  });

  it.each(['mouse', 'touch', 'pen'])(
    'does not focus a hover-opened input on a %s press',
    async (pointerType) => {
      const { user } = await render(<Test filteredParent={filteredParent} />);
      await waitForParentFocus(filteredParent);
      const trigger = screen.getByRole('menuitem', { name: 'More' });
      await user.hover(trigger);
      const input = await screen.findByRole('searchbox', { name: 'Filter more actions' });
      await act(() => waitSingleFrame());
      expect(input).not.toHaveFocus();
      await press(trigger, pointerType);
      await act(() => waitSingleFrame());
      expect(input).not.toHaveFocus();
    },
  );

  it('lets keyboard activation enter a hover-opened submenu', async () => {
    const { user } = await render(<Test filteredParent={filteredParent} />);
    await waitForParentFocus(filteredParent);
    const trigger = screen.getByRole('menuitem', { name: 'More' });
    await user.hover(trigger);
    const input = await screen.findByRole('searchbox', { name: 'Filter more actions' });
    await act(() => waitSingleFrame());
    expect(input).not.toHaveFocus();
    fireEvent.click(trigger, { detail: 0 });
    await waitFor(() => expect(input).toHaveFocus());
  });
});
