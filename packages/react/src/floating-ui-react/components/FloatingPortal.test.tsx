import { describe, expect, test, vi } from 'vitest';
import * as React from 'react';
import {
  fireEvent,
  flushMicrotasks,
  ignoreActWarnings,
  render,
  screen,
} from '@mui/internal-test-utils';
import { createRenderer, isJSDOM } from '#test-utils';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { FloatingFocusManager, FloatingPortal } from '../index';
import { useFloating } from '../../../test/floating-ui-tests/useFloating';
import { FloatingPortalLite } from '../../utils/FloatingPortalLite';
import type { UseFloatingPortalNodeProps } from './FloatingPortal';

interface AppProps {
  container?: UseFloatingPortalNodeProps['container'];
}

function App(props: AppProps) {
  const [open, setOpen] = React.useState(false);
  const { refs } = useFloating({
    open,
    onOpenChange: setOpen,
  });

  return (
    <React.Fragment>
      <button data-testid="reference" ref={refs.setReference} onClick={() => setOpen(!open)} />
      <FloatingPortal {...props}>
        {open && <div ref={refs.setFloating} data-testid="floating" />}
      </FloatingPortal>
    </React.Fragment>
  );
}

describe.skipIf(!isJSDOM)('FloatingPortal', () => {
  test('allows custom containers', async () => {
    const customRoot = document.createElement('div');
    customRoot.id = 'custom-root';
    document.body.appendChild(customRoot);
    render(<App container={customRoot} />);
    fireEvent.click(screen.getByTestId('reference'));

    await flushMicrotasks();

    const parent = screen.getByTestId('floating').parentElement;
    expect(parent?.hasAttribute('data-base-ui-portal')).toBe(true);
    expect(parent?.parentElement).toBe(customRoot);
    customRoot.remove();
  });

  test('allows refs as containers', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const ref = { current: el };
    render(<App container={ref} />);
    fireEvent.click(screen.getByTestId('reference'));
    await flushMicrotasks();
    const parent = screen.getByTestId('floating').parentElement;
    expect(parent?.hasAttribute('data-base-ui-portal')).toBe(true);
    expect(parent?.parentElement).toBe(el);
    document.body.removeChild(el);
  });

  test('allows containers to be initially null', async () => {
    function RootApp() {
      const [container, setContainer] = React.useState<HTMLElement | null>(null);
      const [renderContainer, setRenderContainer] = React.useState(false);

      React.useEffect(() => {
        setRenderContainer(true);
      }, []);

      return (
        <React.Fragment>
          {renderContainer && <div ref={setContainer} data-testid="root" />}
          <App container={container} />
        </React.Fragment>
      );
    }

    render(<RootApp />);

    fireEvent.click(screen.getByTestId('reference'));
    await flushMicrotasks();

    const subRoot = screen.getByTestId('floating').parentElement;
    const root = screen.getByTestId('root');
    expect(root).toBe(subRoot?.parentElement);
  });

  test('reattaches the portal when the container changes', async () => {
    const customRoot = document.createElement('div');
    document.body.appendChild(customRoot);

    try {
      function RootSwitcher() {
        const [container, setContainer] =
          React.useState<UseFloatingPortalNodeProps['container']>(undefined);

        return (
          <React.Fragment>
            <App container={container} />
            <button onClick={() => setContainer(undefined)} data-testid="use-undefined" />
            <button onClick={() => setContainer(customRoot)} data-testid="use-element" />
          </React.Fragment>
        );
      }

      render(<RootSwitcher />);

      fireEvent.click(screen.getByTestId('reference'));

      expect((await screen.findByTestId('floating')).parentElement?.parentElement).toBe(
        document.body,
      );

      fireEvent.click(screen.getByTestId('use-element'));

      expect((await screen.findByTestId('floating')).parentElement?.parentElement).toBe(customRoot);

      fireEvent.click(screen.getByTestId('use-undefined'));

      const floatingInBodyAgain = await screen.findByTestId('floating');
      expect(floatingInBodyAgain.parentElement?.parentElement).toBe(document.body);
      expect(customRoot.contains(floatingInBodyAgain)).toBe(false);
    } finally {
      customRoot.remove();
    }
  });

  test('forwards HTML props to the portal element', async () => {
    render(
      <FloatingPortal data-testid="portal-element" className="closed">
        <div />
      </FloatingPortal>,
    );

    await flushMicrotasks();

    const portal = document.querySelector('[data-testid="portal-element"]') as HTMLElement | null;
    expect(portal).not.toBeNull();
    expect(portal).toHaveClass('closed');
    expect(portal).toHaveAttribute('data-base-ui-portal');
  });

  test('uses the rendered portal ID for the aria-owns relationship', async () => {
    function Test() {
      const { context, refs } = useFloating({ open: true });

      return (
        <FloatingPortal id="custom-portal">
          <FloatingFocusManager context={context.rootStore} modal={false}>
            <div ref={refs.setFloating} />
          </FloatingFocusManager>
        </FloatingPortal>
      );
    }

    render(<Test />);
    await flushMicrotasks();

    expect(document.querySelector('[aria-owns]')).toHaveAttribute('aria-owns', 'custom-portal');
  });

  test('FloatingPortalLite forwards HTML props to the portal element', async () => {
    render(
      <FloatingPortalLite data-testid="lite-portal">
        <div />
      </FloatingPortalLite>,
    );

    await flushMicrotasks();

    const portal = document.querySelector('[data-testid="lite-portal"]');
    expect(portal).not.toBeNull();
  });
});

describe.each([
  { name: 'FloatingPortal', Portal: FloatingPortal },
  { name: 'FloatingPortalLite', Portal: FloatingPortalLite },
])('$name container resolution', ({ Portal }) => {
  const { render: renderPortal } = createRenderer();

  test.each([
    { ancestor: true, strict: false },
    { ancestor: true, strict: true },
    { ancestor: false, strict: false },
    { ancestor: false, strict: true },
  ])(
    'mounts directly inside a ref attached later in the commit (ancestor=$ancestor, strict=$strict)',
    async ({ ancestor, strict }) => {
      const parents = new Set<ParentNode | null>();
      function Test() {
        const container = React.useRef<HTMLDivElement>(null);
        const content = (
          <Portal
            container={container}
            ref={(node) => {
              if (node) {
                parents.add(node.parentNode);
              }
            }}
          >
            <div data-testid="content" />
          </Portal>
        );
        return ancestor ? (
          <div ref={container} data-testid="container">
            {content}
          </div>
        ) : (
          <React.Fragment>
            {content}
            <div ref={container} data-testid="container" />
          </React.Fragment>
        );
      }

      await renderPortal(<Test />, { strict });

      const container = screen.getByTestId('container');
      expect(container).toContainElement(screen.getByTestId('content'));
      // The portal must never mount in the fallback container, even temporarily.
      expect(parents).toEqual(new Set([container]));
    },
  );

  test.each([
    { name: 'without StrictMode', strict: false },
    { name: 'with StrictMode', strict: true },
  ])(
    'mounts inside an ancestor ref before later commit microtasks run $name',
    async ({ strict }) => {
      const mountedAtCheckpoint: boolean[] = [];

      function Test() {
        const container = React.useRef<HTMLDivElement>(null);

        useIsoLayoutEffect(() => {
          // The portal's layout effect queues its container check before this parent effect.
          // Its children must already be committed by this point, before the browser can paint.
          queueMicrotask(() => {
            const content = container.current?.querySelector('[data-testid="content"]');
            mountedAtCheckpoint.push(content?.isConnected ?? false);
          });
        }, []);

        return (
          <div ref={container} data-testid="container">
            <Portal container={container}>
              <div data-testid="content" />
            </Portal>
          </div>
        );
      }

      await renderPortal(<Test />, { strict });

      expect(screen.getByTestId('container')).toContainElement(screen.getByTestId('content'));
      expect(mountedAtCheckpoint).toEqual(strict ? [true, true] : [true]);
    },
  );

  test
    .skipIf(isJSDOM || !React.ViewTransition || typeof document.startViewTransition !== 'function')
    .each([
      { name: 'mounts once inside an ancestor ref', ancestor: true, action: 'none' },
      { name: 'mounts once inside a later sibling ref', ancestor: false, action: 'none' },
      {
        name: 'mounts once inside a ref replaced by cascading layout updates',
        ancestor: false,
        action: 'replace',
      },
      { name: 'skips mounting when the container is cleared', ancestor: false, action: 'clear' },
    ])('$name without canceling a view transition', async ({ ancestor, action }) => {
    ignoreActWarnings();
    const mounts: boolean[] = [];
    const startViewTransition = document.startViewTransition.bind(document);
    const startViewTransitionSpy = vi.spyOn(document, 'startViewTransition');
    const started = new Promise<ViewTransition>((resolve) => {
      startViewTransitionSpy.mockImplementation((...args) => {
        const transition = startViewTransition(...args);
        resolve(transition);
        return transition;
      });
    });

    function Child() {
      const node = React.useRef<HTMLDivElement>(null);
      useIsoLayoutEffect(() => {
        mounts.push(node.current?.isConnected ?? false);
      }, []);
      return (
        <div ref={node} data-testid="content">
          Content
        </div>
      );
    }

    function PortalContent() {
      const container = React.useRef<HTMLDivElement>(null);
      const [step, setStep] = React.useState(0);

      useIsoLayoutEffect(() => {
        if (action !== 'none' && step < 2) {
          setStep(step + 1);
        }
      }, [step]);

      const containerId = action === 'replace' && step === 2 ? 'second' : 'first';
      const content = (
        <Portal container={action === 'clear' && step === 2 ? null : container}>
          <Child />
        </Portal>
      );
      return ancestor ? (
        <div ref={container} data-testid={containerId}>
          {content}
        </div>
      ) : (
        <React.Fragment>
          {content}
          <div key={containerId} ref={container} data-testid={containerId} />
        </React.Fragment>
      );
    }

    function Test() {
      const [show, setShow] = React.useState(false);
      return (
        <React.Fragment>
          <button onClick={() => React.startTransition(() => setShow(true))}>Show</button>
          <React.ViewTransition>
            <div>{show ? <PortalContent /> : 'Before'}</div>
          </React.ViewTransition>
        </React.Fragment>
      );
    }

    try {
      await renderPortal(<Test />, { strict: false });
      expect(screen.queryByTestId('content')).toBe(null);

      // act() flushes pending React effects and can cancel the native transition itself.
      screen.getByRole('button', { name: 'Show' }).click();
      const transition = await started;
      const readiness = await transition.ready.then(
        () => 'ready',
        (error: Error) => error.name,
      );
      await transition.finished;

      const canceled = action === 'clear';
      const container = screen.getByTestId(action === 'replace' ? 'second' : 'first');
      expect(screen.queryByTestId('content')?.parentElement?.parentElement ?? null).toBe(
        canceled ? null : container,
      );
      expect(mounts).toEqual(canceled ? [] : [true]);
      expect(readiness).toBe('ready');
    } finally {
      startViewTransitionSpy.mockRestore();
    }
  });

  test('mounts children once in a connected container when a later update replaces its ref', async () => {
    const mounts: boolean[] = [];

    function Child() {
      const node = React.useRef<HTMLDivElement>(null);
      useIsoLayoutEffect(() => {
        mounts.push(node.current?.isConnected ?? false);
      }, []);
      return <div ref={node} data-testid="content" />;
    }

    function Test() {
      const container = React.useRef<HTMLDivElement>(null);
      const [step, setStep] = React.useState(0);

      useIsoLayoutEffect(() => {
        if (step < 2) {
          setStep(step + 1);
        }
      }, [step]);

      const containerId = step < 2 ? 'first' : 'second';
      return (
        <React.Fragment>
          <Portal container={container} data-testid="portal">
            <Child />
          </Portal>
          <div key={containerId} ref={container} data-testid={containerId} />
        </React.Fragment>
      );
    }

    await renderPortal(<Test />, { strict: false });

    expect(screen.getByTestId('portal').parentElement).toBe(screen.getByTestId('second'));
    expect(mounts).toEqual([true]);
  });

  test('mounts deeply nested portals inside their ancestor refs', async () => {
    function Nested({ remaining }: { remaining: number }) {
      const container = React.useRef<HTMLDivElement>(null);
      return (
        <div ref={container} data-testid="nested-container">
          <Portal container={container} data-testid="nested-portal">
            {remaining > 1 ? <Nested remaining={remaining - 1} /> : <div data-testid="leaf" />}
          </Portal>
        </div>
      );
    }

    await renderPortal(<Nested remaining={18} />, { strict: false });

    expect(screen.getByTestId('leaf')).toBeInTheDocument();
    expect(screen.getAllByTestId('nested-portal').map((node) => node.parentElement)).toEqual(
      screen.getAllByTestId('nested-container'),
    );
  });

  test('batches sibling portals without adding commits for each container ref', async () => {
    let commitCount = 0;

    function Item() {
      const container = React.useRef<HTMLDivElement>(null);
      return (
        <div ref={container} data-testid="container">
          <Portal container={container}>
            <div data-testid="content" />
          </Portal>
        </div>
      );
    }

    function Test({ count }: { count: number }) {
      return (
        <React.Profiler
          id="portals"
          onRender={() => {
            commitCount += 1;
          }}
        >
          {Array.from({ length: count }, (_, index) => (
            <Item key={index} />
          ))}
        </React.Profiler>
      );
    }

    const { unmount } = await renderPortal(<Test count={1} />, { strict: false });
    expect(screen.getByTestId('container')).toContainElement(screen.getByTestId('content'));
    const singlePortalCommitCount = commitCount;
    expect(singlePortalCommitCount).toBeGreaterThan(0);
    unmount();
    commitCount = 0;

    await renderPortal(<Test count={20} />, { strict: false });

    expect(screen.getAllByTestId('content')).toHaveLength(20);
    expect(
      screen.getAllByTestId('content').map((node) => node.parentElement?.parentElement),
    ).toEqual(screen.getAllByTestId('container'));
    expect(commitCount).toBe(singlePortalCommitCount);
  });

  test.each([{ nested: false }, { nested: true }])(
    'uses the fallback container when a ref stays empty (nested=$nested)',
    async ({ nested }) => {
      const container = React.createRef<HTMLDivElement>();
      const content = (
        <Portal container={container} data-testid="portal">
          <div data-testid="content" />
        </Portal>
      );

      await renderPortal(
        nested ? <FloatingPortal data-testid="parent">{content}</FloatingPortal> : content,
      );

      const fallback = nested ? screen.getByTestId('parent') : document.body;
      expect(screen.getByTestId('portal').parentElement).toBe(fallback);
      expect(fallback).toContainElement(screen.getByTestId('content'));
    },
  );

  test.each([{ clear: false }, { clear: true }])(
    'cancels a queued container check when the container prop changes (clear=$clear)',
    async ({ clear }) => {
      function Test() {
        const firstContainer = React.useRef<HTMLDivElement>(null);
        const secondContainer = React.useRef<HTMLDivElement>(null);
        const [step, setStep] = React.useState(0);

        useIsoLayoutEffect(() => {
          if (step < 2) {
            setStep(step + 1);
          }
        }, [step]);

        const nextContainer = clear ? null : secondContainer.current;
        return (
          <React.Fragment>
            <Portal container={step < 2 ? firstContainer : nextContainer} data-testid="portal">
              <div data-testid="content" />
            </Portal>
            <div ref={firstContainer} data-testid="first" />
            <div ref={secondContainer} data-testid="second" />
          </React.Fragment>
        );
      }

      await renderPortal(<Test />, { strict: false });

      expect(screen.getByTestId('first')).toBeEmptyDOMElement();
      expect(screen.queryByTestId('portal')?.parentElement ?? null).toBe(
        clear ? null : screen.getByTestId('second'),
      );
    },
  );
});
