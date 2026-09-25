import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { Menu } from '@base-ui/react/menu';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { createRenderer, resetBrowserPointer } from '#test-utils';
import { useMenuRootContext } from './MenuRootContext';

function Popup({ children, ...props }: Menu.Portal.Props) {
  return (
    <Menu.Portal {...props}>
      <Menu.Positioner anchor={document.body}>
        <Menu.Popup>{children}</Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  );
}

function Submenu({
  label,
  children,
  openOnHover = false,
  ...props
}: Menu.SubmenuRoot.Props & { label: string; openOnHover?: boolean }) {
  return (
    <Menu.SubmenuRoot {...props}>
      <Menu.SubmenuTrigger openOnHover={openOnHover} delay={0}>
        {label}
      </Menu.SubmenuTrigger>
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Popup>{children}</Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.SubmenuRoot>
  );
}

describe('<Menu.Root /> without a trigger', () => {
  const { render } = createRenderer();

  beforeEach(resetBrowserPointer);
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  async function focusItem(name: string) {
    const item = await screen.findByRole('menuitem', { name });
    await act(async () => item.focus());
    return item;
  }

  describe.each(['ltr', 'rtl'] as const)('%s', (direction) => {
    it.each([false, true])(
      'keeps nested Escape and focus local, keepMounted=%s',
      async (keepMounted) => {
        const changed = vi.fn();
        const { user } = await render(
          <DirectionProvider direction={direction}>
            <Menu.Root defaultOpen modal={false} onOpenChange={changed}>
              <Popup keepMounted={keepMounted}>
                <Submenu label="More">
                  <Menu.Item>Leaf</Menu.Item>
                </Submenu>
              </Popup>
            </Menu.Root>
          </DirectionProvider>,
        );
        const more = await focusItem('More');
        const root = screen.getByRole('menu');
        const openKey = direction === 'rtl' ? '{ArrowLeft}' : '{ArrowRight}';
        await user.keyboard(openKey);
        await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Leaf' })).toHaveFocus());
        expect(changed).not.toHaveBeenCalled();
        expect(root).toHaveAttribute('data-open');

        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('menuitem', { name: 'Leaf' })).toBeNull());
        expect(more).toHaveFocus();
        expect(changed).not.toHaveBeenCalled();
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
        expect(changed).toHaveBeenCalledExactlyOnceWith(
          false,
          expect.objectContaining({ reason: 'escape-key' }),
        );
        expect(root.isConnected).toBe(keepMounted);
      },
    );
  });

  it.each([false, true])(
    'supports an external anchor across reopen, keepMounted=%s',
    async (keepMounted) => {
      const changed = vi.fn();
      function Demo() {
        const [anchor, setAnchor] = React.useState<HTMLButtonElement | null>(null);
        return (
          <React.Fragment>
            <button type="button" onClick={(event) => setAnchor(event.currentTarget)}>
              Open
            </button>
            <Menu.Root
              open={Boolean(anchor)}
              onOpenChange={(open, details) => {
                changed(open, details.reason);
                if (!open) {
                  setAnchor(null);
                }
              }}
            >
              <Menu.Portal keepMounted={keepMounted}>
                <Menu.Positioner anchor={anchor}>
                  <Menu.Popup>
                    <Submenu label="More">
                      <Menu.Item>Nested</Menu.Item>
                    </Submenu>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </React.Fragment>
        );
      }
      const { user } = await render(<Demo />);
      const anchor = screen.getByRole('button', { name: 'Open' });
      async function openAndSelect() {
        await user.click(anchor);
        await focusItem('More');
        await user.keyboard('{ArrowRight}');
        const nested = await screen.findByRole('menuitem', { name: 'Nested' });
        await waitFor(() => expect(nested).toHaveFocus());
        expect(changed).not.toHaveBeenCalled();
        await user.click(nested);
        await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
        expect(changed).toHaveBeenCalledExactlyOnceWith(false, 'item-press');
        await waitFor(() => expect(anchor).toHaveFocus());
        changed.mockClear();
      }
      await openAndSelect();
      await openAndSelect();
    },
  );

  it.each(['click', 'hover'] as const)(
    'closes a sibling submenu without closing the root on %s',
    async (method) => {
      const changed = vi.fn();
      const firstChanged = vi.fn();
      const { user } = await render(
        <Menu.Root defaultOpen modal={false} onOpenChange={changed}>
          <Popup>
            <Submenu label="First" onOpenChange={firstChanged} openOnHover={method === 'hover'}>
              <Menu.Item>First item</Menu.Item>
            </Submenu>
            <Submenu label="Second" openOnHover={method === 'hover'}>
              <Menu.Item>Second item</Menu.Item>
            </Submenu>
          </Popup>
        </Menu.Root>,
      );
      await user[method](await focusItem('First'));
      await screen.findByRole('menuitem', { name: 'First item' });
      firstChanged.mockClear();
      await user[method](screen.getByRole('menuitem', { name: 'Second' }));
      await screen.findByRole('menuitem', { name: 'Second item' });
      await waitFor(() =>
        expect(screen.queryByRole('menuitem', { name: 'First item' })).toBeNull(),
      );
      expect(firstChanged).toHaveBeenCalledExactlyOnceWith(
        false,
        expect.objectContaining({
          reason: expect.stringMatching(
            method === 'hover' ? /^(trigger-hover|sibling-open)$/ : /^sibling-open$/,
          ),
        }),
      );
      expect(changed).not.toHaveBeenCalled();
    },
  );

  it('keeps an initially open submenu attached to the root', async () => {
    const changed = vi.fn();
    const completed = vi.fn();
    await render(
      <Menu.Root defaultOpen modal={false} onOpenChange={changed}>
        <Popup>
          <Submenu label="More" defaultOpen onOpenChangeComplete={completed}>
            <Menu.Item>Nested</Menu.Item>
          </Submenu>
        </Popup>
      </Menu.Root>,
    );
    await waitFor(() => expect(completed).toHaveBeenCalledWith(true));
    expect(screen.getAllByRole('menu')).toHaveLength(2);
    expect(changed).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    'preserves real trigger registration, initially present=%s',
    async (initialTrigger) => {
      const changed = vi.fn();
      const registered = vi.fn();
      const rootIds = vi.fn();
      function CaptureTriggerIds() {
        const { store } = useMenuRootContext();
        useIsoLayoutEffect(() => {
          registered(store, store.select('floatingNodeId'), store.select('floatingParentNodeId'));
        }, [store]);
        return null;
      }
      function Demo() {
        const [hasTrigger, setHasTrigger] = React.useState(initialTrigger);
        useIsoLayoutEffect(() => {
          if (hasTrigger) {
            const [store, nodeId, parentNodeId] = registered.mock.lastCall!;
            rootIds(
              store.select('floatingNodeId'),
              nodeId,
              store.select('floatingParentNodeId'),
              parentNodeId,
            );
          }
        }, [hasTrigger]);
        return (
          <Menu.Root defaultOpen modal={false} onOpenChange={changed}>
            {hasTrigger && (
              <React.Fragment>
                <Menu.Trigger>Options</Menu.Trigger>
                <CaptureTriggerIds />
              </React.Fragment>
            )}
            <Popup>
              <Menu.SubmenuRoot>
                <Menu.SubmenuTrigger
                  openOnHover={false}
                  onKeyDown={(event) => {
                    if (event.key === 'F2') {
                      setHasTrigger(true);
                    }
                  }}
                >
                  More
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup>
                      <Menu.Item>Nested</Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>
            </Popup>
          </Menu.Root>
        );
      }
      const { user } = await render(<Demo />);
      await focusItem('More');
      await user.keyboard('{F2}');
      const trigger = screen.getByRole('button', { name: 'Options' });
      expect(rootIds).toHaveBeenCalled();
      for (const [nodeId, triggerNodeId, parentNodeId, triggerParentNodeId] of rootIds.mock.calls) {
        expect(triggerNodeId).toBeDefined();
        expect(nodeId).toBe(triggerNodeId);
        expect(parentNodeId).toBe(triggerParentNodeId);
      }
      await user.keyboard('{ArrowRight}');
      await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Nested' })).toHaveFocus());
      expect(changed).not.toHaveBeenCalled();
      await user.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('menuitem', { name: 'Nested' })).toBeNull());
      await user.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
      await waitFor(() => expect(trigger).toHaveFocus());
    },
  );
});
