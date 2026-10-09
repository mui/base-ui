import { describe, expect, test } from 'vitest';
import * as React from 'react';
import { fireEvent, flushMicrotasks, render, screen } from '@mui/internal-test-utils';
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
    'uses the latest container when it changes before the ref resolves (clear=$clear)',
    async ({ clear }) => {
      function Test() {
        const firstContainer = React.useRef<HTMLDivElement>(null);
        const secondContainer = React.useRef<HTMLDivElement>(null);
        const [container, setContainer] =
          React.useState<UseFloatingPortalNodeProps['container']>(firstContainer);

        useIsoLayoutEffect(() => {
          setContainer(clear ? null : secondContainer.current);
        }, []);

        return (
          <React.Fragment>
            <div ref={firstContainer} data-testid="first">
              <Portal container={container} data-testid="portal">
                <div data-testid="content" />
              </Portal>
            </div>
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
