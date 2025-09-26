import * as React from 'react';
import { fireEvent, flushMicrotasks, render, screen } from '@mui/internal-test-utils';
import { isJSDOM } from '@base-ui-components/utils/detectBrowser';
import { FloatingPortal, useFloating } from '../index';
import type { UseFloatingPortalNodeProps } from './FloatingPortal';

interface AppProps {
  root?: UseFloatingPortalNodeProps['root'];
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
  test('allows custom roots', async () => {
    const customRoot = document.createElement('div');
    customRoot.id = 'custom-root';
    document.body.appendChild(customRoot);
    render(<App root={customRoot} />);
    fireEvent.click(screen.getByTestId('reference'));

    await flushMicrotasks();

    const parent = screen.getByTestId('floating').parentElement;
    expect(parent?.hasAttribute('data-base-ui-portal')).toBe(true);
    expect(parent?.parentElement).toBe(customRoot);
    customRoot.remove();
  });

  test('allows refs as roots', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const ref = { current: el };
    render(<App root={ref} />);
    fireEvent.click(screen.getByTestId('reference'));
    await flushMicrotasks();
    const parent = screen.getByTestId('floating').parentElement;
    expect(parent?.hasAttribute('data-base-ui-portal')).toBe(true);
    expect(parent?.parentElement).toBe(el);
    document.body.removeChild(el);
  });

  test('allows roots to be initially null', async () => {
    function RootApp() {
      const [root, setRoot] = React.useState<HTMLElement | null>(null);
      const [renderRoot, setRenderRoot] = React.useState(false);

      React.useEffect(() => {
        setRenderRoot(true);
      }, []);

      return (
        <React.Fragment>
          {renderRoot && <div ref={setRoot} data-testid="root" />}
          <App root={root} />
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

  test('reattaches the portal when the root changes', async () => {
    const customRoot = document.createElement('div');
    document.body.appendChild(customRoot);

    try {
      function RootSwitcher() {
        const [root, setRoot] = React.useState<UseFloatingPortalNodeProps['root']>(undefined);

        return (
          <React.Fragment>
            <App root={root} />
            <button onClick={() => setRoot(undefined)} data-testid="use-undefined" />
            <button onClick={() => setRoot(customRoot)} data-testid="use-element" />
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
});
