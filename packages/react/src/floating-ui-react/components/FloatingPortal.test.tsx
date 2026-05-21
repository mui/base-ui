import { afterEach, beforeEach, expect, vi } from 'vitest';
import * as React from 'react';
import { act, fireEvent, flushMicrotasks, render, screen } from '@mui/internal-test-utils';
import { isJSDOM } from '@base-ui/utils/detectBrowser';
import { FloatingPortal, useFloating } from '../index';
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

interface AppWithReferenceProps {
  testId?: string;
}

function AppWithReference(props: AppWithReferenceProps) {
  const { testId = 'app' } = props;
  const [open, setOpen] = React.useState(false);
  const [reference, setReference] = React.useState<HTMLElement | null>(null);
  const { refs } = useFloating({
    open,
    onOpenChange: setOpen,
    elements: { reference },
  });

  return (
    <React.Fragment>
      <button
        data-testid={`${testId}-reference`}
        ref={(node) => {
          setReference(node);
          refs.setReference(node);
        }}
        onClick={() => setOpen(!open)}
      />
      <FloatingPortal referenceElement={reference}>
        {open && <div ref={refs.setFloating} data-testid={`${testId}-floating`} />}
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

  describe('fullscreen rerouting', () => {
    let fullscreenElement: Element | null = null;
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      Document.prototype,
      'fullscreenElement',
    );

    beforeEach(() => {
      fullscreenElement = null;
      Object.defineProperty(Document.prototype, 'fullscreenElement', {
        configurable: true,
        get: () => fullscreenElement,
      });
    });

    afterEach(() => {
      fullscreenElement = null;
      if (originalDescriptor) {
        Object.defineProperty(Document.prototype, 'fullscreenElement', originalDescriptor);
      } else {
        Reflect.deleteProperty(Document.prototype, 'fullscreenElement');
      }
    });

    function setFullscreenElement(element: Element | null) {
      fullscreenElement = element;
      document.dispatchEvent(new Event('fullscreenchange'));
    }

    test('reroutes the portal into the fullscreen element when default container is outside it', async () => {
      const fsContainer = document.createElement('div');
      fsContainer.id = 'fs-container';
      document.body.appendChild(fsContainer);

      try {
        render(<App />);
        fireEvent.click(screen.getByTestId('reference'));
        await flushMicrotasks();

        expect(screen.getByTestId('floating').parentElement?.parentElement).toBe(document.body);

        await act(async () => {
          setFullscreenElement(fsContainer);
        });
        await flushMicrotasks();

        expect(screen.getByTestId('floating').parentElement?.parentElement).toBe(fsContainer);
      } finally {
        fsContainer.remove();
      }
    });

    test('does not reroute when the default container is already inside the fullscreen element', async () => {
      render(<App />);
      fireEvent.click(screen.getByTestId('reference'));
      await flushMicrotasks();

      await act(async () => {
        setFullscreenElement(document.documentElement);
      });
      await flushMicrotasks();

      expect(screen.getByTestId('floating').parentElement?.parentElement).toBe(document.body);
    });

    test('respects an explicit `container` prop even while in fullscreen', async () => {
      const fsContainer = document.createElement('div');
      const explicitContainer = document.createElement('div');
      explicitContainer.id = 'explicit';
      document.body.appendChild(fsContainer);
      document.body.appendChild(explicitContainer);

      try {
        render(<App container={explicitContainer} />);
        fireEvent.click(screen.getByTestId('reference'));
        await flushMicrotasks();

        expect(screen.getByTestId('floating').parentElement?.parentElement).toBe(explicitContainer);

        await act(async () => {
          setFullscreenElement(fsContainer);
        });
        await flushMicrotasks();

        expect(screen.getByTestId('floating').parentElement?.parentElement).toBe(explicitContainer);
      } finally {
        fsContainer.remove();
        explicitContainer.remove();
      }
    });

    test('moves the portal back to body when fullscreen exits', async () => {
      const fsContainer = document.createElement('div');
      document.body.appendChild(fsContainer);

      try {
        render(<App />);
        fireEvent.click(screen.getByTestId('reference'));
        await flushMicrotasks();

        await act(async () => {
          setFullscreenElement(fsContainer);
        });
        await flushMicrotasks();

        expect(screen.getByTestId('floating').parentElement?.parentElement).toBe(fsContainer);

        await act(async () => {
          setFullscreenElement(null);
        });
        await flushMicrotasks();

        expect(screen.getByTestId('floating').parentElement?.parentElement).toBe(document.body);
      } finally {
        fsContainer.remove();
      }
    });

    test('mounts directly into the fullscreen element when opened while fullscreen is already active', async () => {
      const fsContainer = document.createElement('div');
      document.body.appendChild(fsContainer);

      try {
        render(<App />);

        await act(async () => {
          setFullscreenElement(fsContainer);
        });
        await flushMicrotasks();

        fireEvent.click(screen.getByTestId('reference'));
        await flushMicrotasks();

        expect(screen.getByTestId('floating').parentElement?.parentElement).toBe(fsContainer);
      } finally {
        fsContainer.remove();
      }
    });

    test('does not reroute when the referenceElement is outside the fullscreen subtree', async () => {
      // Real-world edge case: two sibling elements A and B. The user opens a
      // dropdown inside A whose item programmatically fullscreens B. The
      // dropdown is still open but its trigger lives in A (now invisible).
      // Rerouting the portal into B would make the popup visible but anchored
      // to an off-screen trigger.
      const siblingA = document.createElement('div');
      const siblingB = document.createElement('div');
      document.body.appendChild(siblingA);
      document.body.appendChild(siblingB);

      try {
        render(
          <div>
            <AppWithReference testId="a" />
          </div>,
          { container: siblingA },
        );

        fireEvent.click(screen.getByTestId('a-reference'));
        await flushMicrotasks();

        expect(screen.getByTestId('a-floating').parentElement?.parentElement).toBe(document.body);

        await act(async () => {
          setFullscreenElement(siblingB);
        });
        await flushMicrotasks();

        // Trigger is in siblingA, not in siblingB's fullscreen subtree, so the
        // portal must stay in body rather than reroute into siblingB.
        expect(screen.getByTestId('a-floating').parentElement?.parentElement).toBe(document.body);
        expect(siblingB.contains(screen.getByTestId('a-floating'))).toBe(false);
      } finally {
        siblingA.remove();
        siblingB.remove();
      }
    });

    test('reroutes when the referenceElement is inside the fullscreen subtree', async () => {
      // Normal case: the fullscreen element is an ancestor of the trigger, so
      // rerouting into it keeps the popup visible AND correctly anchored.
      const fsContainer = document.createElement('div');
      document.body.appendChild(fsContainer);

      try {
        render(<AppWithReference />, { container: fsContainer });

        fireEvent.click(screen.getByTestId('app-reference'));
        await flushMicrotasks();

        expect(screen.getByTestId('app-floating').parentElement?.parentElement).toBe(document.body);

        await act(async () => {
          setFullscreenElement(fsContainer);
        });
        await flushMicrotasks();

        expect(screen.getByTestId('app-floating').parentElement?.parentElement).toBe(fsContainer);
      } finally {
        fsContainer.remove();
      }
    });

    test('falls back to the default heuristic when referenceElement is not provided', async () => {
      // Direct FloatingPortal users who don't pass a trigger still get the
      // existing "container outside fullscreen -> reroute" behaviour so they
      // remain visible during fullscreen mode.
      const fsContainer = document.createElement('div');
      document.body.appendChild(fsContainer);

      try {
        render(<App />);
        fireEvent.click(screen.getByTestId('reference'));
        await flushMicrotasks();

        await act(async () => {
          setFullscreenElement(fsContainer);
        });
        await flushMicrotasks();

        expect(screen.getByTestId('floating').parentElement?.parentElement).toBe(fsContainer);
      } finally {
        fsContainer.remove();
      }
    });

    test('shares a single document fullscreenchange subscription across multiple portals', async () => {
      // Mount one portal first so the singleton store attaches its listener
      // (if it isn't already) and we can spy on additions made afterwards.
      render(<App />);
      await flushMicrotasks();

      const addSpy = vi.spyOn(document, 'addEventListener');

      try {
        render(<App />);
        render(<App />);
        render(<App />);
        for (const reference of screen.getAllByTestId('reference')) {
          fireEvent.click(reference);
        }
        await flushMicrotasks();

        const fullscreenCalls = addSpy.mock.calls.filter(
          ([type]) => type === 'fullscreenchange' || type === 'webkitfullscreenchange',
        );
        // Mounting more portals must not attach additional document listeners
        // because all subscribers share the singleton fullscreen store.
        expect(fullscreenCalls).toHaveLength(0);
      } finally {
        addSpy.mockRestore();
      }
    });
  });
});
