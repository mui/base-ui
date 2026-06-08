import { afterEach, beforeEach, expect } from 'vitest';
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
  });
});
