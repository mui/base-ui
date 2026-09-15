import * as React from 'react';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { describe, it, expect } from 'vitest';
import { createRenderer, isJSDOM } from '#test-utils';
import { Menu } from '@base-ui/react/menu';

function Test(props: { submenuTriggerProps?: React.ComponentProps<typeof Menu.SubmenuTrigger> }) {
  return (
    <Menu.Root>
      <Menu.Trigger>Open menu</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Popup>
            <Menu.SubmenuRoot>
              <Menu.SubmenuTrigger data-testid="submenu-trigger" {...props.submenuTriggerProps}>
                More
              </Menu.SubmenuTrigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup data-testid="submenu">
                    <Menu.Item>Alpha</Menu.Item>
                    <Menu.Item>Beta</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.SubmenuRoot>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
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
  fireEvent.click(element, { detail: 0 });
}

async function waitForFrames(count = 2) {
  for (let i = 0; i < count; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await act(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve());
        }),
    );
  }
}

// `isVirtualPointerEvent` returns `false` under jsdom, so the virtual press cannot be detected there.
describe.skipIf(isJSDOM)('<Menu.SubmenuTrigger /> with a screen reader press', () => {
  const { render } = createRenderer();

  it('opens the submenu on a screen reader press with the default `openOnHover`', async () => {
    const { user } = await render(<Test />);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    const submenuTrigger = await screen.findByTestId('submenu-trigger');

    fireScreenReaderPress(submenuTrigger);

    expect(await screen.findByTestId('submenu')).not.toBe(null);
  });

  it('keeps the submenu open on a screen reader press with `openOnHover={false}`', async () => {
    const { user } = await render(<Test submenuTriggerProps={{ openOnHover: false }} />);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    const submenuTrigger = await screen.findByTestId('submenu-trigger');

    fireScreenReaderMouseDown(submenuTrigger);

    await screen.findByTestId('submenu');

    // The trailing click must not toggle the freshly opened submenu closed.
    fireEvent.click(submenuTrigger, { detail: 0 });
    await waitForFrames();

    expect(screen.queryByTestId('submenu')).not.toBe(null);
  });

  it('ignores an ordinary mouse press with the default `openOnHover`', async () => {
    const { user } = await render(<Test />);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    const submenuTrigger = await screen.findByTestId('submenu-trigger');

    // A real pressed mouse reports non-zero pressure, so it is not a virtual press.
    fireEvent.pointerDown(submenuTrigger, {
      pointerType: 'mouse',
      width: 1,
      height: 1,
      pressure: 0.5,
      detail: 0,
    });
    fireEvent.mouseDown(submenuTrigger);
    fireEvent.click(submenuTrigger, { detail: 1 });

    await waitForFrames();

    expect(screen.queryByTestId('submenu')).toBe(null);
  });

  it('opens a filterable submenu from a filterable parent and focuses its input', async () => {
    await render(
      <Menu.FilterProvider>
        <Menu.Root defaultOpen>
          <Menu.Trigger>Open menu</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterInput aria-label="Filter actions" />
                <Menu.List>
                  <Menu.Item>Share</Menu.Item>
                  <Menu.FilterProvider>
                    <Menu.SubmenuRoot>
                      <Menu.SubmenuTrigger data-testid="submenu-trigger">More</Menu.SubmenuTrigger>
                      <Menu.Portal>
                        <Menu.Positioner>
                          <Menu.Popup data-testid="submenu">
                            <Menu.FilterInput aria-label="Filter more" />
                            <Menu.List>
                              <Menu.Item>Alpha</Menu.Item>
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
      </Menu.FilterProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('searchbox', { name: 'Filter actions' })).toHaveFocus();
    });
    const submenuTrigger = screen.getByTestId('submenu-trigger');

    fireScreenReaderPress(submenuTrigger);

    expect(await screen.findByTestId('submenu')).not.toBe(null);
    await waitFor(() => {
      expect(screen.getByRole('searchbox', { name: 'Filter more' })).toHaveFocus();
    });
  });

  it('keeps focus in a kept-mounted filterable submenu opened by a screen reader press', async () => {
    await render(
      <Menu.FilterProvider>
        <Menu.Root defaultOpen>
          <Menu.Trigger>Open menu</Menu.Trigger>
          <Menu.Portal keepMounted>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterInput aria-label="Filter actions" />
                <Menu.List>
                  <Menu.Item>Share</Menu.Item>
                  <Menu.FilterProvider>
                    <Menu.SubmenuRoot>
                      <Menu.SubmenuTrigger data-testid="submenu-trigger">More</Menu.SubmenuTrigger>
                      <Menu.Portal keepMounted>
                        <Menu.Positioner>
                          <Menu.Popup data-testid="submenu">
                            <Menu.FilterInput aria-label="Filter more" />
                            <Menu.List>
                              <Menu.Item>Alpha</Menu.Item>
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
      </Menu.FilterProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('searchbox', { name: 'Filter actions' })).toHaveFocus();
    });

    fireScreenReaderPress(screen.getByTestId('submenu-trigger'));

    await waitFor(() => {
      expect(screen.getByRole('searchbox', { name: 'Filter more' })).toHaveFocus();
    });
    // The stale return-focus cleanup must not pull focus back to the parent input.
    await waitForFrames();
    expect(screen.getByRole('searchbox', { name: 'Filter more' })).toHaveFocus();
  });
});
