import { fireEvent, flushMicrotasks, render, screen } from '@mui/internal-test-utils';
import * as React from 'react';

import { FloatingPortal, useFloating } from '../index';
import { isJSDOM } from '../../utils/detectBrowser';

function App(props: {
  root?: HTMLElement | null | React.RefObject<HTMLElement | null>;
  id?: string;
}) {
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
  test('creates a custom id node', async () => {
    render(<App id="custom-id" />);
    await flushMicrotasks();
    expect(document.querySelector('#custom-id')).toBeInTheDocument();
  });

  test('uses a custom id node as the root', async () => {
    const customRoot = document.createElement('div');
    customRoot.id = 'custom-root';
    document.body.appendChild(customRoot);
    render(<App id="custom-root" />);
    fireEvent.click(screen.getByTestId('reference'));
    await flushMicrotasks();
    expect(screen.getByTestId('floating').parentElement?.parentElement).toBe(customRoot);
    customRoot.remove();
  });

  test('creates a custom id node as the root', async () => {
    render(<App id="custom-id" />);
    fireEvent.click(screen.getByTestId('reference'));
    await flushMicrotasks();
    expect(screen.getByTestId('floating').parentElement?.parentElement?.id).toBe('custom-id');
  });

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
          <App root={root} />;
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
});
