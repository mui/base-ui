import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, screen } from '@mui/internal-test-utils';
import type { DndTestEngine, DndTestRenderer } from './dndEngine';

const swapCases = [
  { name: 'a key change remounts the part', swap: (id: string) => ({ key: id }) },
  {
    name: 'the part renders a new node',
    swap: (id: string) => ({
      render: (props: React.HTMLAttributes<HTMLElement>) => <div key={id} {...props} />,
    }),
  },
];

/**
 * Tests the registration that every element-registering Draggable part gets from
 * `useRegistrationRef`. Call it from a file that calls `setupDragEngineTests()`.
 */
export function dragRegistrationConformanceTests(config: DragRegistrationTestConfig) {
  const {
    render: renderDnd,
    createComponent,
    isRegistered,
    startDrag,
    wrapper: Wrapper = React.Fragment,
  } = config;

  describe('registration conformance', () => {
    function renderPart(props: DragRegistrationTestProps) {
      return <Wrapper>{createComponent(props)}</Wrapper>;
    }

    it('registers once under Strict Mode and unregisters on unmount', async () => {
      const { engine, rerender } = await renderDnd(renderPart({ 'data-testid': 'part' }));
      const element = screen.getByTestId('part');
      expect(await isRegistered(element, engine)).toBe(true);

      await rerender(<Wrapper />);
      // A registration leaked by the Strict Mode remount would outlive the unmount.
      expect(await isRegistered(element, engine)).toBe(false);
    });

    it('unregisters when its rendered element unmounts on its own', async () => {
      let hide = () => {};
      const Host = React.forwardRef(function Host(
        props: React.ComponentProps<'div'>,
        ref: React.ForwardedRef<HTMLDivElement>,
      ) {
        const [visible, setVisible] = React.useState(true);
        hide = () => setVisible(false);
        return visible ? <div ref={ref} {...props} /> : null;
      });
      const { engine } = await renderDnd(renderPart({ 'data-testid': 'part', render: <Host /> }));
      const element = screen.getByTestId('part');
      expect(await isRegistered(element, engine)).toBe(true);

      // Only `Host` re-renders, so the part runs no effect of its own.
      await act(async () => hide());
      expect(await isRegistered(element, engine)).toBe(false);
    });

    it.each(swapCases)(
      'moves the registration to the new node when $name in one commit',
      async ({ swap }) => {
        const { engine, rerender } = await renderDnd(
          renderPart({ 'data-testid': 'part', ...swap('a') }),
        );
        const first = screen.getByTestId('part');
        expect(await isRegistered(first, engine)).toBe(true);

        await rerender(renderPart({ 'data-testid': 'part', ...swap('b') }));
        const second = screen.getByTestId('part');
        expect(second).not.toBe(first);
        expect(await isRegistered(first, engine)).toBe(false);
        expect(await isRegistered(second, engine)).toBe(true);
      },
    );

    if (startDrag) {
      it('calls the latest handler after a re-render, with the node its ref points to', async () => {
        const stale = vi.fn();
        const latest = vi.fn();
        const ref = vi.fn<(node: HTMLElement | null) => void>();
        const { engine, rerender } = await renderDnd(
          renderPart({ 'data-testid': 'part', ref, onEvent: stale }),
        );
        const element = screen.getByTestId('part');

        await rerender(renderPart({ 'data-testid': 'part', ref, onEvent: latest }));
        expect(screen.getByTestId('part')).toBe(element);
        await startDrag(element, engine);

        expect(stale).not.toHaveBeenCalled();
        expect(latest.mock.calls[0]?.[0]).toBe(element);
        expect(ref.mock.lastCall?.[0]).toBe(element);
      });

      it('does not call a handler from a suspended render', async () => {
        const committed = vi.fn();
        const suspended = vi.fn();
        const suspendedRender = vi.fn();
        const never = new Promise<void>(() => {});

        function SuspendingChild(): React.JSX.Element {
          suspendedRender();
          throw never;
        }

        function App() {
          const [suspend, setSuspend] = React.useState(false);
          const [, startTransition] = React.useTransition();
          return (
            <React.Fragment>
              <button type="button" onClick={() => startTransition(() => setSuspend(true))}>
                Suspend update
              </button>
              <React.Suspense fallback="Loading">
                {renderPart({ 'data-testid': 'part', onEvent: suspend ? suspended : committed })}
                {suspend && <SuspendingChild />}
              </React.Suspense>
            </React.Fragment>
          );
        }

        const { engine, user } = await renderDnd(<App />);
        await user.click(screen.getByRole('button', { name: 'Suspend update' }));
        expect(suspendedRender).toHaveBeenCalled();

        const element = screen.getByTestId('part');
        await startDrag(element, engine);

        expect(committed.mock.calls[0]?.[0]).toBe(element);
        expect(suspended).not.toHaveBeenCalled();
      });
    }
  });
}

export interface DragRegistrationTestProps {
  'data-testid': string;
  /**
   * Goes on the part itself, so changing it remounts the part.
   */
  key?: string | undefined;
  ref?: React.RefCallback<HTMLElement> | undefined;
  render?:
    | React.ReactElement
    | ((props: React.HTMLAttributes<HTMLElement>) => React.ReactElement)
    | undefined;
  /**
   * Call it from the handler that `startDrag` triggers, with the element from its event details.
   */
  onEvent?: ((element: Element) => void) | undefined;
}

export interface DragRegistrationTestConfig {
  /**
   * `renderDnd` from `createDndRenderer()`. It must render in Strict Mode, the default,
   * which registers, cleans up, and registers again on mount.
   */
  render: DndTestRenderer['renderDnd'];
  /**
   * Returns the part with the given props spread on it.
   */
  createComponent: (props: DragRegistrationTestProps) => React.ReactElement;
  /**
   * Renders around the part, for a part that needs a parent such as `Draggable.Root`.
   * The suite unmounts the part by rendering the wrapper alone.
   * @default React.Fragment
   */
  wrapper?: React.JSXElementConstructor<{ children?: React.ReactNode }> | undefined;
  /**
   * Whether `element` holds a registration. The suite also asks after the element is
   * detached, so the answer can't depend on it being in the document.
   */
  isRegistered: (element: HTMLElement, engine: DndTestEngine) => boolean | Promise<boolean>;
  /**
   * Starts a drag that triggers the handler wired to `onEvent`. Omit it for a part
   * without handlers, which skips the handler tests.
   */
  startDrag?: ((element: HTMLElement, engine: DndTestEngine) => Promise<void>) | undefined;
}
