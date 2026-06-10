import { expect } from 'vitest';
import * as React from 'react';
import { fireEvent, flushMicrotasks, render, screen } from '@mui/internal-test-utils';
import { isJSDOM, useTestInteractions } from '#test-utils';
import { FloatingFocusManager, FloatingPortal, useClick, useFloating } from '../index';
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

function GuardedApp(props: { renderOwner?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const { refs, context } = useFloating({ open, onOpenChange: setOpen });
  const click = useClick(context);
  const { getReferenceProps, getFloatingProps } = useTestInteractions([click]);

  return (
    <React.Fragment>
      <button ref={refs.setReference} {...getReferenceProps()} data-testid="reference" />
      {open && (
        <FloatingPortal renderOwner={props.renderOwner}>
          <FloatingFocusManager context={context} modal={false}>
            <div ref={refs.setFloating} {...getFloatingProps()} data-testid="floating">
              <button data-testid="inside" />
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
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

  test('renders the owner node by default', async () => {
    render(<GuardedApp />);

    fireEvent.click(screen.getByTestId('reference'));
    await flushMicrotasks();

    const portal = screen.getByTestId('floating').closest('[data-base-ui-portal]');
    expect(portal?.id).toBeTruthy();
    expect(document.querySelector(`span[aria-owns="${portal!.id}"]`)).not.toBeNull();
  });

  test('omits the owner node when renderOwner is false but keeps the focus guards', async () => {
    render(<GuardedApp renderOwner={false} />);

    fireEvent.click(screen.getByTestId('reference'));
    await flushMicrotasks();

    const portal = screen.getByTestId('floating').closest('[data-base-ui-portal]');
    expect(portal?.id).toBeTruthy();
    expect(document.querySelector(`span[aria-owns="${portal!.id}"]`)).toBeNull();
    // The focus guards remain so tab order is still managed.
    expect(document.querySelectorAll('[data-base-ui-focus-guard]').length).toBeGreaterThan(0);
  });
});
