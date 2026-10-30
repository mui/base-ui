import { describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { NavigationMenu } from '@base-ui/react/navigation-menu';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { reactMajor, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<NavigationMenu.Viewport />', () => {
  const { render } = createRenderer();

  function TestMenu({
    children,
    content = 'Menu content',
  }: {
    children: React.ReactNode;
    content?: React.ReactNode;
  }) {
    return (
      <NavigationMenu.Root defaultValue="item">
        <NavigationMenu.List>
          <NavigationMenu.Item value="item">
            <NavigationMenu.Trigger>Item</NavigationMenu.Trigger>
            <NavigationMenu.Content>{content}</NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
        {children}
      </NavigationMenu.Root>
    );
  }

  describeConformance(<NavigationMenu.Viewport />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<NavigationMenu.Root>{node}</NavigationMenu.Root>);
    },
  }));

  it('preserves trigger ownership when its ref changes in a detached container', async () => {
    const container = document.createElement('div');
    const firstRef = React.createRef<HTMLDivElement>();
    const secondRef = React.createRef<HTMLDivElement>();

    function TestCase({ viewportRef }: { viewportRef: React.Ref<HTMLDivElement> }) {
      return (
        <TestMenu>
          <NavigationMenu.Viewport id="viewport" ref={viewportRef} />
        </TestMenu>
      );
    }

    const { rerender } = await render(<TestCase viewportRef={firstRef} />, {
      container,
      strict: false,
    });
    const viewport = firstRef.current;
    expect(viewport?.isConnected).toBe(false);
    expect(viewport).toHaveTextContent('Menu content');
    expect(container.querySelector('[aria-owns="viewport"]')).not.toBe(null);

    await rerender(<TestCase viewportRef={secondRef} />);
    expect(firstRef.current).toBe(null);
    expect(secondRef.current).toBe(viewport);
    expect(container.querySelector('[aria-owns="viewport"]')).not.toBe(null);
    expect(viewport).toHaveTextContent('Menu content');
  });

  it.skipIf(reactMajor < 18)(
    'unmounts content when removing the viewport during a transition',
    async () => {
      const onUnmount = vi.fn();
      let hide = () => {};

      function Content() {
        React.useEffect(() => onUnmount, []);
        return <p>Menu content</p>;
      }

      function TestCase() {
        const [show, setShow] = React.useState(true);
        const [count, setCount] = React.useState(0);
        hide = () => React.startTransition(() => setShow(false));

        useIsoLayoutEffect(() => {
          if (!show) {
            queueMicrotask(() => ReactDOM.flushSync(() => setCount((previous) => previous + 1)));
          }
        }, [show]);

        return (
          <React.Fragment>
            <span data-testid="count">{count}</span>
            <TestMenu content={<Content />}>
              {show && <NavigationMenu.Viewport data-testid="viewport" />}
            </TestMenu>
          </React.Fragment>
        );
      }

      await render(<TestCase />, { strict: false });
      expect(screen.getByTestId('viewport')).toHaveTextContent('Menu content');
      const initialUnmountCount = onUnmount.mock.calls.length;
      // Let React flush passive teardown between microtasks instead of flushing it through act.
      vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', false);
      try {
        hide();
        await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));
        expect(screen.queryByTestId('viewport')).toBe(null);
        expect(onUnmount).toHaveBeenCalledTimes(initialUnmountCount + 1);
      } finally {
        vi.unstubAllGlobals();
      }
    },
  );

  describe('prop: render', () => {
    it('keeps menu content visible when render element children change', async () => {
      function TestCase({ header }: { header: boolean }) {
        return (
          <TestMenu>
            <NavigationMenu.Viewport
              data-testid="viewport"
              render={
                header ? (
                  <div>
                    <span>Custom header</span>
                  </div>
                ) : (
                  <div />
                )
              }
            />
          </TestMenu>
        );
      }

      const { rerender } = await render(<TestCase header={false} />, { strict: false });
      const viewport = screen.getByTestId('viewport');
      expect(viewport).toHaveTextContent('Menu content');

      await rerender(<TestCase header />);
      expect(screen.getByText('Custom header')).toBeVisible();
      expect(viewport).toHaveTextContent('Menu content');
    });

    it('keeps content visible when render children replace a suspended target', async () => {
      const LazyChild = React.lazy(() => new Promise<{ default: React.ComponentType }>(() => {}));

      function TestCase({ suspend, header }: { suspend: boolean; header: boolean }) {
        return (
          <TestMenu>
            <React.Suspense fallback="Loading...">
              <NavigationMenu.Viewport
                data-testid="viewport"
                render={
                  header ? (
                    <div>
                      <span>Custom header</span>
                    </div>
                  ) : (
                    <div />
                  )
                }
              >
                {suspend && <LazyChild />}
              </NavigationMenu.Viewport>
            </React.Suspense>
          </TestMenu>
        );
      }

      const { rerender } = await render(<TestCase suspend={false} header={false} />, {
        strict: false,
      });
      const viewport = screen.getByTestId('viewport');
      expect(viewport).toHaveTextContent('Menu content');

      await rerender(<TestCase suspend header={false} />);
      expect(viewport).not.toBeVisible();
      expect(screen.getByText('Loading...')).toBeVisible();

      await rerender(<TestCase suspend={false} header />);
      expect(viewport).toBeVisible();
      expect(viewport).toHaveTextContent('Custom header');
      expect(viewport).toHaveTextContent('Menu content');
    });

    it('unmounts content when a custom component removes its viewport element', async () => {
      const onUnmount = vi.fn();
      const CustomViewport = React.forwardRef<
        HTMLDivElement,
        React.ComponentPropsWithoutRef<'div'> & { show: boolean }
      >(function CustomViewport({ show, ...props }, ref) {
        return show ? <div {...props} ref={ref} /> : null;
      });

      function Content() {
        React.useEffect(() => onUnmount, []);
        return <p>Menu content</p>;
      }

      function TestCase({ show }: { show: boolean }) {
        return (
          <TestMenu content={<Content />}>
            <NavigationMenu.Viewport render={<CustomViewport show={show} />} />
          </TestMenu>
        );
      }

      const { rerender } = await render(<TestCase show />, { strict: false });
      expect(screen.getByText('Menu content')).toBeVisible();
      const initialUnmountCount = onUnmount.mock.calls.length;

      await rerender(<TestCase show={false} />);
      expect(onUnmount).toHaveBeenCalledTimes(initialUnmountCount + 1);

      await rerender(<TestCase show />);
      expect(screen.getByText('Menu content')).toBeVisible();
    });
  });

  it.each([
    {
      name: 'inline primary and inline fallback',
      primaryPositioned: false,
      fallbackPositioned: false,
    },
    {
      name: 'positioned primary and positioned fallback',
      primaryPositioned: true,
      fallbackPositioned: true,
    },
    {
      name: 'inline primary and positioned fallback',
      primaryPositioned: false,
      fallbackPositioned: true,
    },
    {
      name: 'positioned primary and inline fallback',
      primaryPositioned: true,
      fallbackPositioned: false,
    },
  ])(
    'moves content between $name through Suspense',
    async ({ primaryPositioned, fallbackPositioned }) => {
      const LazyChild = React.lazy(() => new Promise<{ default: React.ComponentType }>(() => {}));

      function Viewport({
        testId,
        positioned,
        children,
      }: {
        testId: string;
        positioned: boolean;
        children?: React.ReactNode;
      }) {
        const viewport = (
          <NavigationMenu.Viewport data-testid={testId}>{children}</NavigationMenu.Viewport>
        );

        return positioned ? (
          <NavigationMenu.Portal>
            <NavigationMenu.Positioner>
              <NavigationMenu.Popup>{viewport}</NavigationMenu.Popup>
            </NavigationMenu.Positioner>
          </NavigationMenu.Portal>
        ) : (
          viewport
        );
      }

      function TestCase({ suspend }: { suspend: boolean }) {
        return (
          <TestMenu>
            <React.Suspense
              fallback={<Viewport positioned={fallbackPositioned} testId="fallback" />}
            >
              <Viewport positioned={primaryPositioned} testId="primary">
                {suspend && <LazyChild />}
              </Viewport>
            </React.Suspense>
          </TestMenu>
        );
      }

      const { rerender } = await render(<TestCase suspend={false} />, { strict: false });
      const primaryViewport = screen.getByTestId('primary');
      expect(primaryViewport).toHaveTextContent('Menu content');

      await rerender(<TestCase suspend />);
      expect(primaryViewport).not.toBeVisible();
      expect(screen.getByTestId('fallback')).toHaveTextContent('Menu content');

      await rerender(<TestCase suspend={false} />);
      expect(primaryViewport).toBeVisible();
      expect(primaryViewport).toHaveTextContent('Menu content');
    },
  );

  describe.skipIf(reactMajor < 19)('React.Activity', () => {
    const Activity = (
      React as typeof React & {
        Activity: React.ComponentType<{ mode: 'visible' | 'hidden'; children: React.ReactNode }>;
      }
    ).Activity;

    it('reveals content after render children change while hidden', async () => {
      function TestCase({ visible, header }: { visible: boolean; header: boolean }) {
        return (
          <TestMenu>
            <Activity mode={visible ? 'visible' : 'hidden'}>
              <NavigationMenu.Viewport
                data-testid="viewport"
                render={
                  header ? (
                    <div>
                      <span>Custom header</span>
                    </div>
                  ) : (
                    <div />
                  )
                }
              />
            </Activity>
          </TestMenu>
        );
      }

      const { rerender } = await render(<TestCase visible header={false} />, { strict: false });
      const viewport = screen.getByTestId('viewport');
      expect(viewport).toHaveTextContent('Menu content');

      await rerender(<TestCase visible={false} header={false} />);
      expect(viewport).not.toBeVisible();

      await rerender(<TestCase visible={false} header />);
      expect(viewport).toHaveTextContent('Custom header');

      await rerender(<TestCase visible header />);
      expect(viewport).toBeVisible();
      expect(viewport).toHaveTextContent('Menu content');
    });

    it('moves content to a replacement viewport after removing a hidden inline viewport', async () => {
      function TestCase({ stage }: { stage: 'inline' | 'hidden' | 'positioned' }) {
        return (
          <TestMenu>
            {stage === 'positioned' ? (
              <NavigationMenu.Portal>
                <NavigationMenu.Positioner>
                  <NavigationMenu.Popup>
                    <NavigationMenu.Viewport data-testid="positioned-viewport" />
                  </NavigationMenu.Popup>
                </NavigationMenu.Positioner>
              </NavigationMenu.Portal>
            ) : (
              <Activity mode={stage === 'hidden' ? 'hidden' : 'visible'}>
                <NavigationMenu.Viewport data-testid="inline-viewport" />
              </Activity>
            )}
          </TestMenu>
        );
      }

      // StrictMode's effect replay on the replacement viewport can clear the stale target.
      const { rerender } = await render(<TestCase stage="inline" />, { strict: false });
      const inlineViewport = screen.getByTestId('inline-viewport');
      expect(inlineViewport).toHaveTextContent('Menu content');

      await rerender(<TestCase stage="hidden" />);
      expect(inlineViewport).not.toBeVisible();

      await rerender(<TestCase stage="positioned" />);
      expect(inlineViewport.isConnected).toBe(false);
      expect(screen.getByTestId('positioned-viewport')).toHaveTextContent('Menu content');
    });
  });
});
