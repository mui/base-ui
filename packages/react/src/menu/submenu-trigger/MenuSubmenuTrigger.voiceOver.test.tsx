import * as React from 'react';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { vi, describe, it, expect } from 'vitest';
import { createRenderer, isJSDOM } from '#test-utils';
import { Menu } from '@base-ui/react/menu';

// Kept in a separate file so the module mock doesn't leak into `MenuSubmenuTrigger.test.tsx`.
vi.mock('@base-ui/utils/platform', async () => {
  const actual =
    await vi.importActual<typeof import('@base-ui/utils/platform')>('@base-ui/utils/platform');

  return {
    platform: {
      ...actual.platform,
      screenReader: { ...actual.platform.screenReader, voiceOver: true },
    },
  };
});

function Test(props: {
  openOnHover?: boolean;
  delay?: number;
  onSubmenuOpenChange?: Menu.SubmenuRoot.Props['onOpenChange'];
}) {
  return (
    <Menu.Root>
      <Menu.Trigger>Open menu</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Popup>
            <Menu.SubmenuRoot onOpenChange={props.onSubmenuOpenChange}>
              <Menu.SubmenuTrigger openOnHover={props.openOnHover} delay={props.delay}>
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

function fireVoiceOverPress(element: Element) {
  fireEvent.pointerDown(element, {
    pointerType: 'touch',
    width: 0.333,
    height: 0.333,
    pressure: 0,
    detail: 0,
  });
  fireEvent.mouseDown(element);
}

async function waitForFrame() {
  await act(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      }),
  );
}

describe('<Menu.SubmenuTrigger /> with VoiceOver', () => {
  const { render } = createRenderer();

  it('omits the expanded state when the submenu is opened with ArrowRight', async () => {
    const { user } = await render(<Test />);

    await user.keyboard('[Tab]');
    await user.keyboard('[Enter]');

    const submenuTrigger = await screen.findByRole('menuitem', { name: 'More' });
    await waitFor(() => {
      expect(submenuTrigger).toHaveFocus();
    });
    expect(submenuTrigger).toHaveAttribute('aria-expanded', 'false');

    await user.keyboard('[ArrowRight]');

    await screen.findByTestId('submenu');
    // Focus moves into the submenu; this is the announcement VoiceOver must not talk over.
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Alpha' })).toHaveFocus();
    });

    expect(submenuTrigger).not.toHaveAttribute('aria-expanded');
    // The submenu is still discoverable through `aria-haspopup`.
    expect(submenuTrigger).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('omits the expanded state when the submenu is opened with Enter', async () => {
    const { user } = await render(<Test />);

    await user.keyboard('[Tab]');
    await user.keyboard('[Enter]');

    const submenuTrigger = await screen.findByRole('menuitem', { name: 'More' });
    await waitFor(() => {
      expect(submenuTrigger).toHaveFocus();
    });

    await user.keyboard('[Enter]');

    await screen.findByTestId('submenu');
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Alpha' })).toHaveFocus();
    });

    expect(submenuTrigger).not.toHaveAttribute('aria-expanded');
  });

  it('keeps the expanded state when the submenu is opened by hover', async () => {
    const { user } = await render(<Test />);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    const submenuTrigger = await screen.findByRole('menuitem', { name: 'More' });
    await user.hover(submenuTrigger);

    await screen.findByTestId('submenu');

    // Focus stays on the trigger, so there is no item announcement to talk over.
    expect(submenuTrigger).toHaveAttribute('aria-expanded', 'true');
  });

  it.skipIf(isJSDOM)(
    'keeps the expanded state when a virtual pointer presses an already-open submenu',
    async () => {
      const { user } = await render(<Test />);

      await user.click(screen.getByRole('button', { name: 'Open menu' }));

      const submenuTrigger = await screen.findByRole('menuitem', { name: 'More' });
      await user.hover(submenuTrigger);
      await screen.findByTestId('submenu');
      expect(submenuTrigger).toHaveAttribute('aria-expanded', 'true');

      fireVoiceOverPress(submenuTrigger);
      await waitForFrame();

      expect(submenuTrigger).toHaveAttribute('aria-expanded', 'true');
    },
  );

  it('keeps the expanded state when the submenu is opened with a physical pointer press', async () => {
    const { user } = await render(<Test openOnHover={false} />);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    const submenuTrigger = await screen.findByRole('menuitem', { name: 'More' });
    await user.click(submenuTrigger);

    const submenu = await screen.findByTestId('submenu');
    await waitFor(() => {
      expect(submenu).toHaveFocus();
    });

    expect(submenuTrigger).toHaveAttribute('aria-expanded', 'true');
  });

  it.skipIf(isJSDOM)('omits the expanded state when opened with a virtual pointer', async () => {
    const { user } = await render(<Test />);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    const submenuTrigger = await screen.findByRole('menuitem', { name: 'More' });
    fireVoiceOverPress(submenuTrigger);

    await screen.findByTestId('submenu');
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Alpha' })).toHaveFocus();
    });

    expect(submenuTrigger).not.toHaveAttribute('aria-expanded');
  });

  it.skipIf(isJSDOM)(
    'keeps the expanded state when hover follows a canceled virtual pointer press',
    async () => {
      const onSubmenuOpenChange = vi.fn((open, eventDetails) => {
        if (open && onSubmenuOpenChange.mock.calls.length === 1) {
          eventDetails.cancel();
        }
      });
      const { user } = await render(<Test delay={0} onSubmenuOpenChange={onSubmenuOpenChange} />);

      await user.click(screen.getByRole('button', { name: 'Open menu' }));

      const submenuTrigger = await screen.findByRole('menuitem', { name: 'More' });
      fireVoiceOverPress(submenuTrigger);

      await waitFor(() => {
        expect(onSubmenuOpenChange).toHaveBeenCalledTimes(1);
      });
      expect(screen.queryByTestId('submenu')).toBe(null);

      await user.hover(submenuTrigger);
      await screen.findByTestId('submenu');

      expect(submenuTrigger).toHaveAttribute('aria-expanded', 'true');
    },
  );
});
