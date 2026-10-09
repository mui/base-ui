import { afterEach, beforeEach, expect, vi, describe, it } from 'vitest';
import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { act, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { ContextMenu } from '@base-ui/react/context-menu';
import { Menu } from '@base-ui/react/menu';
import { Menubar } from '@base-ui/react/menubar';
import { Popover } from '@base-ui/react/popover';
import {
  describeConformance,
  createRenderer,
  isJSDOM,
  resetBrowserPointer,
  positionerConformanceTests,
} from '#test-utils';

import { useMenuRootContext } from '../root/MenuRootContext';
import type { MenuOpenEventDetails } from '../utils/types';

const useAnchorPositioningSpy = vi.hoisted(() => vi.fn());

vi.mock('../../internals/useAnchorPositioning', async () => {
  const actual = await vi.importActual<typeof import('../../internals/useAnchorPositioning')>(
    '../../internals/useAnchorPositioning',
  );

  return {
    ...actual,
    useAnchorPositioning: ((...args: Parameters<typeof actual.useAnchorPositioning>) => {
      useAnchorPositioningSpy(...args);
      return actual.useAnchorPositioning(...args);
    }) satisfies typeof actual.useAnchorPositioning,
  };
});

const Trigger = React.forwardRef(function Trigger(
  props: Menu.Trigger.Props,
  ref: React.ForwardedRef<any>,
) {
  return <Menu.Trigger {...props} ref={ref} render={<div />} nativeButton={false} />;
});

describe('<Menu.Positioner />', () => {
  beforeEach(resetBrowserPointer);

  const { render } = createRenderer();

  beforeEach(() => {
    useAnchorPositioningSpy.mockClear();
  });

  it('throws when rendered outside Menu.Portal', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <Menu.Root open>
            <Menu.Positioner />
          </Menu.Root>,
        ),
      ).rejects.toThrow('Base UI: <Menu.Portal> is missing.');
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('enables lazy flipping for a filter menu', async () => {
    await render(
      <Menu.FilterProvider>
        <Menu.Root open>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Input aria-label="Filter" />
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
    );

    // `'placement'` and not `true`: the filter menu locks the alignment as well as the side, so a
    // popup that flipped once does not jitter back while typing resizes it. Combobox stays on
    // `true` (side only), which is what it shipped with.
    expect(useAnchorPositioningSpy.mock.lastCall?.[0].lazyFlip).toBe('placement');
  });

  it('leaves lazy flipping off for a plain menu', async () => {
    await render(
      <Menu.Root open>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup />
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    expect(useAnchorPositioningSpy.mock.lastCall?.[0].lazyFlip).toBe(false);
  });

  describeConformance(<Menu.Positioner />, () => ({
    render: (node) => {
      return render(
        <Menu.Root open>
          <Menu.Portal>{node}</Menu.Portal>
        </Menu.Root>,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));

  describe('layout viewport', () => {
    it('uses the layout viewport for a root context menu', async () => {
      await render(
        <ContextMenu.Root open>
          <ContextMenu.Portal>
            <ContextMenu.Positioner>
              <ContextMenu.Popup>Popup</ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>,
      );

      expect(useAnchorPositioningSpy.mock.lastCall?.[0].shift).toEqual({
        crossAxis: true,
        rootBoundary: 'layoutViewport',
      });
    });

    it('disables cross-axis shifting when side collision avoidance is flip', async () => {
      await render(
        <ContextMenu.Root open>
          <ContextMenu.Portal>
            <ContextMenu.Positioner collisionAvoidance={{ side: 'flip' }}>
              <ContextMenu.Popup>Popup</ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>,
      );

      expect(useAnchorPositioningSpy.mock.lastCall?.[0].shift).toEqual({
        crossAxis: false,
        rootBoundary: 'layoutViewport',
      });
    });

    it('preserves explicit context-menu placement and offsets', async () => {
      await render(
        <ContextMenu.Root open>
          <ContextMenu.Portal>
            <ContextMenu.Positioner side="right" align="center" sideOffset={11} alignOffset={13}>
              <ContextMenu.Popup>Popup</ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>,
      );

      expect(useAnchorPositioningSpy.mock.lastCall?.[0]).toMatchObject({
        side: 'right',
        align: 'center',
        sideOffset: 11,
        alignOffset: 13,
      });
    });

    it('uses the visual viewport for a context menu submenu', async () => {
      await render(
        <ContextMenu.Root open>
          <ContextMenu.SubmenuRoot defaultOpen>
            <ContextMenu.Portal>
              <ContextMenu.Positioner>
                <ContextMenu.Popup>Popup</ContextMenu.Popup>
              </ContextMenu.Positioner>
            </ContextMenu.Portal>
          </ContextMenu.SubmenuRoot>
        </ContextMenu.Root>,
      );

      expect(useAnchorPositioningSpy).toHaveBeenCalled();
      expect(useAnchorPositioningSpy.mock.lastCall?.[0].shift).toBe(undefined);
    });
  });

  it('closes an open submenu with a sibling reason when its controlled parent closes', async () => {
    const onSubmenuOpenChange = vi.fn();
    let closeParent = () => {};

    function Test() {
      const [open, setOpen] = React.useState(true);
      closeParent = () => setOpen(false);

      return (
        <Menu.Root open={open}>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Portal keepMounted>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.SubmenuRoot defaultOpen onOpenChange={onSubmenuOpenChange}>
                  <Menu.SubmenuTrigger>More</Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner>
                      <Menu.Popup data-testid="submenu-popup" />
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      );
    }

    await render(<Test />);
    expect(screen.queryByTestId('submenu-popup')).not.toBe(null);

    await act(async () => {
      closeParent();
    });

    await waitFor(() => {
      expect(onSubmenuOpenChange.mock.lastCall?.[0]).toBe(false);
    });
    expect(onSubmenuOpenChange.mock.lastCall?.[1].reason).toBe('sibling-open');
  });

  describe.skipIf(isJSDOM)('prop: anchor', () => {
    it('should be placed near the specified element when a ref is passed', async () => {
      function TestComponent() {
        const anchor = React.useRef<HTMLDivElement | null>(null);

        return (
          <div style={{ margin: '50px' }}>
            <Menu.Root open>
              <Menu.Portal>
                <Menu.Positioner
                  side="bottom"
                  align="start"
                  anchor={anchor}
                  arrowPadding={0}
                  data-testid="positioner"
                >
                  <Menu.Popup>
                    <Menu.Item>1</Menu.Item>
                    <Menu.Item>2</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
            <div data-testid="anchor" style={{ marginTop: '100px' }} ref={anchor} />
          </div>
        );
      }

      await render(<TestComponent />);

      const positioner = screen.getByTestId('positioner');
      const anchor = screen.getByTestId('anchor');

      const anchorPosition = anchor.getBoundingClientRect();

      await flushMicrotasks();

      expect(positioner.style.getPropertyValue('transform')).toBe(
        `translate(${anchorPosition.left}px, ${anchorPosition.bottom}px)`,
      );
    });

    it('should be placed near the specified element when an element is passed', async () => {
      function TestComponent() {
        const [anchor, setAnchor] = React.useState<HTMLDivElement | null>(null);
        const handleRef = React.useCallback((element: HTMLDivElement | null) => {
          setAnchor(element);
        }, []);

        return (
          <div style={{ margin: '50px' }}>
            <Menu.Root open>
              <Menu.Portal>
                <Menu.Positioner
                  side="bottom"
                  align="start"
                  anchor={anchor}
                  arrowPadding={0}
                  data-testid="positioner"
                >
                  <Menu.Popup>
                    <Menu.Item>1</Menu.Item>
                    <Menu.Item>2</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
            <div data-testid="anchor" style={{ marginTop: '100px' }} ref={handleRef} />
          </div>
        );
      }

      await render(<TestComponent />);

      const positioner = screen.getByTestId('positioner');
      const anchor = screen.getByTestId('anchor');

      const anchorPosition = anchor.getBoundingClientRect();

      await flushMicrotasks();

      expect(positioner.style.getPropertyValue('transform')).toBe(
        `translate(${anchorPosition.left}px, ${anchorPosition.bottom}px)`,
      );
    });

    it('should be placed near the specified element when a function returning an element is passed', async () => {
      function TestComponent() {
        const [anchor, setAnchor] = React.useState<HTMLDivElement | null>(null);
        const handleRef = React.useCallback((element: HTMLDivElement | null) => {
          setAnchor(element);
        }, []);

        const getAnchor = React.useCallback(() => anchor, [anchor]);

        return (
          <div style={{ margin: '50px' }}>
            <Menu.Root open>
              <Menu.Portal>
                <Menu.Positioner
                  side="bottom"
                  align="start"
                  anchor={getAnchor}
                  arrowPadding={0}
                  data-testid="positioner"
                >
                  <Menu.Popup>
                    <Menu.Item>1</Menu.Item>
                    <Menu.Item>2</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
            <div data-testid="anchor" style={{ marginTop: '100px' }} ref={handleRef} />
          </div>
        );
      }

      await render(<TestComponent />);

      const positioner = screen.getByTestId('positioner');
      const anchor = screen.getByTestId('anchor');

      const anchorPosition = anchor.getBoundingClientRect();

      await flushMicrotasks();

      expect(positioner.style.getPropertyValue('transform')).toBe(
        `translate(${anchorPosition.left}px, ${anchorPosition.bottom}px)`,
      );
    });

    it('should be placed at the specified position', async () => {
      const boundingRect = {
        x: 200,
        y: 100,
        top: 100,
        left: 200,
        bottom: 100,
        right: 200,
        height: 0,
        width: 0,
        toJSON: () => {},
      };

      const virtualElement = { getBoundingClientRect: () => boundingRect };

      await render(
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner
              side="bottom"
              align="start"
              anchor={virtualElement}
              arrowPadding={0}
              data-testid="positioner"
            >
              <Menu.Popup>
                <Menu.Item>1</Menu.Item>
                <Menu.Item>2</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const positioner = screen.getByTestId('positioner');
      expect(positioner.style.getPropertyValue('transform')).toBe(`translate(200px, 100px)`);
    });

    it('should accept a non-memoized function as an anchor', async () => {
      function TestComponent() {
        return (
          <div style={{ margin: '50px' }}>
            <Menu.Root open>
              <Menu.Portal>
                <Menu.Positioner
                  side="bottom"
                  align="start"
                  anchor={() => null}
                  arrowPadding={0}
                  data-testid="positioner"
                >
                  <Menu.Popup>
                    <Menu.Item>1</Menu.Item>
                    <Menu.Item>2</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </div>
        );
      }

      await render(<TestComponent />);

      expect(screen.getByTestId('positioner')).toBeInTheDocument();
      expect(screen.getAllByRole('menuitem')).toHaveLength(2);
    });

    it('should react to the anchor changing from a ref to undefined and back', async () => {
      function TestComponent() {
        const anchorRef = React.useRef<HTMLDivElement | null>(null);
        const [currentAnchor, setCurrentAnchor] = React.useState<
          React.RefObject<HTMLDivElement | null> | undefined
        >(anchorRef);

        return (
          <div style={{ margin: '50px' }}>
            <button type="button" onClick={() => setCurrentAnchor(undefined)}>
              undefined
            </button>
            <button type="button" onClick={() => setCurrentAnchor(anchorRef)}>
              ref
            </button>
            <Menu.Root open>
              <Menu.Trigger>trigger</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner
                  side="bottom"
                  align="start"
                  anchor={currentAnchor}
                  arrowPadding={0}
                  data-testid="positioner"
                >
                  <Menu.Popup>
                    <Menu.Item>1</Menu.Item>
                    <Menu.Item>2</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
            <div
              data-testid="anchor"
              style={{ marginTop: '100px', width: 10, height: 10 }}
              ref={anchorRef}
            />
          </div>
        );
      }

      await render(<TestComponent />);

      const positioner = screen.getByTestId('positioner');
      const anchorElement = screen.getByTestId('anchor');

      const setUndefinedButton = screen.getByRole('button', { name: 'undefined' });
      const setRefButton = screen.getByRole('button', { name: 'ref' });
      const trigger = screen.getByRole('button', { name: 'trigger' });

      let anchorRect = anchorElement.getBoundingClientRect();
      await flushMicrotasks();
      expect(positioner.style.getPropertyValue('transform')).toBe(
        `translate(${anchorRect.left}px, ${anchorRect.bottom}px)`,
      );

      await userEvent.click(setUndefinedButton);
      await flushMicrotasks();

      const triggerRect = trigger.getBoundingClientRect();
      expect(positioner.style.getPropertyValue('transform')).toBe(
        `translate(${Math.floor(triggerRect.left)}px, ${triggerRect.bottom}px)`,
      );

      await userEvent.click(setRefButton);
      await flushMicrotasks();

      anchorRect = anchorElement.getBoundingClientRect();
      expect(positioner.style.getPropertyValue('transform')).toBe(
        `translate(${anchorRect.left}px, ${anchorRect.bottom}px)`,
      );
    });
  });

  describe.skipIf(isJSDOM)('prop: keepMounted', () => {
    afterEach(async () => {
      const { cleanup } = await import('vitest-browser-react');
      await cleanup();
    });

    it('when keepMounted=true, should keep the content mounted when closed', async () => {
      const { userEvent: user } = await import('vitest/browser');
      const { render: vbrRender } = await import('vitest-browser-react');

      await vbrRender(
        <Menu.Root modal={false}>
          <Menu.Trigger>Toggle</Menu.Trigger>
          <Menu.Portal keepMounted>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item>1</Menu.Item>
                <Menu.Item>2</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = screen.getByRole('button', { name: 'Toggle' });

      expect(screen.queryByRole('menu', { hidden: true })).not.toBe(null);
      expect(screen.queryByRole('menu', { hidden: true })).toBeInaccessible();

      await user.click(trigger, { delay: 20 });
      await waitFor(() => {
        expect(screen.queryByRole('menu', { hidden: false })).not.toBe(null);
      });
      expect(screen.queryByRole('menu', { hidden: false })).not.toBeInaccessible();

      await user.click(trigger, { delay: 20 });
      await waitFor(() => {
        expect(screen.queryByRole('menu', { hidden: true })).not.toBe(null);
      });
      await waitFor(() => {
        expect(screen.queryByRole('menu', { hidden: true })).toBeInaccessible();
      });
    });

    it('when keepMounted=false, should unmount the content when closed', async () => {
      const { userEvent: user } = await import('vitest/browser');
      const { render: vbrRender } = await import('vitest-browser-react');

      await vbrRender(
        <Menu.Root modal={false}>
          <Menu.Trigger>Toggle</Menu.Trigger>
          <Menu.Portal keepMounted={false}>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item>1</Menu.Item>
                <Menu.Item>2</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = screen.getByRole('button', { name: 'Toggle' });

      expect(screen.queryByRole('menu', { hidden: true })).toBe(null);

      await user.click(trigger, { delay: 20 });
      await flushMicrotasks();
      await waitFor(() => {
        expect(screen.queryByRole('menu', { hidden: false })).not.toBe(null);
      });
      expect(screen.queryByRole('menu', { hidden: false })).not.toBeInaccessible();

      await user.click(trigger, { delay: 20 });
      await waitFor(() => {
        expect(screen.queryByRole('menu', { hidden: true })).toBe(null);
      });
    });
  });

  const triggerStyle = { width: 72, height: 36 };
  const popupStyle = { width: 52, height: 24 };

  describe.skipIf(isJSDOM)('Menubar parent', () => {
    it('uses bottom as the default side when the menubar is horizontal', async () => {
      let side = 'none';

      await render(
        <Menubar>
          <Menu.Root open>
            <Trigger style={triggerStyle}>File</Trigger>
            <Menu.Portal>
              <Menu.Positioner
                sideOffset={(data) => {
                  side = data.side;
                  return 0;
                }}
              >
                <Menu.Popup style={popupStyle}>Open</Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menubar>,
      );

      expect(side).toBe('bottom');
    });

    it('uses inline-end as the default side when the menubar is vertical', async () => {
      let side = 'none';

      await render(
        <Menubar orientation="vertical">
          <Menu.Root open>
            <Trigger style={triggerStyle}>File</Trigger>
            <Menu.Portal>
              <Menu.Positioner
                sideOffset={(data) => {
                  side = data.side;
                  return 0;
                }}
              >
                <Menu.Popup style={popupStyle}>Open</Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menubar>,
      );

      expect(side).toBe('inline-end');
    });
  });

  positionerConformanceTests({
    render,
    viewport: true,
    createComponent: ({ root, trigger, positioner, popup, viewport }) => (
      <Menu.Root {...root}>
        <Trigger {...trigger}>Trigger</Trigger>
        <Menu.Portal>
          <Menu.Positioner {...positioner}>
            <Menu.Popup {...popup}>
              {viewport ? <Menu.Viewport>Popup</Menu.Viewport> : 'Popup'}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    ),
  });

  describe('menuopenchange across popup families', () => {
    function MenuOpenChangeLog({ log }: { log: string[] }) {
      const { store } = useMenuRootContext();
      const tree = store.useState('floatingTreeRoot');

      React.useEffect(() => {
        function handleMenuOpenChange(details: MenuOpenEventDetails) {
          const positionerMounted = document.querySelector('[data-testid="menu-positioner"]');
          log.push(
            `open=${details.open} parent=${details.parentNodeId == null ? 'none' : 'set'} positioner=${positionerMounted != null}`,
          );
        }

        tree.events.on('menuopenchange', handleMenuOpenChange);
        return () => {
          tree.events.off('menuopenchange', handleMenuOpenChange);
        };
      }, [tree, log]);

      return null;
    }

    it('fires while the positioner is mounted for a menu nested in a popover', async () => {
      const log: string[] = [];
      const { user } = await render(
        <Popover.Root>
          <Popover.Trigger>Popover</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                <Menu.Root>
                  <MenuOpenChangeLog log={log} />
                  <Menu.Trigger>Menu</Menu.Trigger>
                  <Menu.Portal>
                    <Menu.Positioner data-testid="menu-positioner">
                      <Menu.Popup>
                        <Menu.Item>Item</Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.Root>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      await user.click(screen.getByRole('button', { name: 'Popover' }));
      log.push('popover opened');
      await user.click(await screen.findByRole('button', { name: 'Menu' }));
      await screen.findByRole('menuitem', { name: 'Item' });
      log.push('menu opened');
      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByTestId('menu-positioner')).toBe(null);
      });
      log.push('menu closed');

      // The menu's parent is the popover's node. The test renderer uses StrictMode, which runs the
      // emitting effect twice on open, so `open=true` appears twice.
      expect(log).toEqual([
        'popover opened',
        'open=true parent=set positioner=true',
        'open=true parent=set positioner=true',
        'menu opened',
        'open=false parent=set positioner=true',
        'menu closed',
      ]);
    });

    it('fires while the positioner is mounted for a menu with a popover nested in it', async () => {
      const log: string[] = [];
      const { user } = await render(
        <Menu.Root>
          <MenuOpenChangeLog log={log} />
          <Menu.Trigger>Menu</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner data-testid="menu-positioner">
              <Menu.Popup>
                <Popover.Root>
                  <Popover.Trigger>Popover</Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Positioner>
                      <Popover.Popup data-testid="popover-popup">
                        <button type="button">Inside</button>
                      </Popover.Popup>
                    </Popover.Positioner>
                  </Popover.Portal>
                </Popover.Root>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      await user.click(screen.getByRole('button', { name: 'Menu' }));
      await screen.findByTestId('menu-positioner');
      log.push('menu opened');
      await user.click(screen.getByRole('button', { name: 'Popover' }));
      await screen.findByTestId('popover-popup');
      log.push('popover opened');
      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByTestId('popover-popup')).toBe(null);
      });
      log.push(`popover closed, menu open=${screen.queryByTestId('menu-positioner') != null}`);
      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByTestId('menu-positioner')).toBe(null);
      });
      log.push('menu closed');

      // The nested popover doesn't take part in the menu's events. The test renderer uses
      // StrictMode, which runs the emitting effect twice on open, so `open=true` appears twice.
      expect(log).toEqual([
        'open=true parent=none positioner=true',
        'open=true parent=none positioner=true',
        'menu opened',
        'popover opened',
        'popover closed, menu open=true',
        'open=false parent=none positioner=true',
        'menu closed',
      ]);
    });
  });
});
