import { expect, describe, it } from 'vitest';
import * as React from 'react';
import { Toast } from '@base-ui/react/toast';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { fireEvent, screen, waitFor } from '@mui/internal-test-utils';

const toast = {
  id: 'test',
  title: 'Toast title',
};

describe('<Toast.Content />', () => {
  const { render } = createRenderer();

  describeConformance(<Toast.Content />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Toast.Provider>
          <Toast.Viewport>
            <Toast.Root toast={toast}>{node}</Toast.Root>
          </Toast.Viewport>
        </Toast.Provider>,
      );
    },
  }));

  function App() {
    const { toasts, add } = Toast.useToastManager();
    const [count, setCount] = React.useState(0);
    return (
      <React.Fragment>
        <button
          type="button"
          onClick={() => {
            const next = count + 1;
            setCount(next);
            add({ title: `toast-${next}` });
          }}
        >
          add
        </button>
        <Toast.Viewport data-testid="viewport">
          {toasts.map((toastItem) => (
            <Toast.Root key={toastItem.id} toast={toastItem}>
              <Toast.Content data-testid={`content-${toastItem.title}`}>
                <Toast.Title />
              </Toast.Content>
            </Toast.Root>
          ))}
        </Toast.Viewport>
      </React.Fragment>
    );
  }

  it('marks content behind the frontmost toast with data-behind', async () => {
    await render(
      <Toast.Provider>
        <App />
      </Toast.Provider>,
    );

    const addButton = screen.getByRole('button', { name: 'add' });
    fireEvent.click(addButton);
    fireEvent.click(addButton);

    // The newest toast is at the front; the older one sits behind it.
    expect(screen.getByTestId('content-toast-2')).not.toHaveAttribute('data-behind');
    expect(screen.getByTestId('content-toast-1')).toHaveAttribute('data-behind');
  });

  it('reflects the expanded state when the viewport is hovered', async () => {
    await render(
      <Toast.Provider>
        <App />
      </Toast.Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'add' }));

    const content = screen.getByTestId('content-toast-1');
    expect(content).not.toHaveAttribute('data-expanded');

    fireEvent.mouseEnter(screen.getByTestId('viewport'));
    expect(content).toHaveAttribute('data-expanded');
  });

  it.skipIf(isJSDOM)(
    'does not commit pending app updates when observers re-measure an unchanged height',
    async () => {
      const errors: string[] = [];
      function handleError(event: ErrorEvent) {
        errors.push(event.message);
        event.preventDefault();
      }
      window.addEventListener('error', handleError);

      function observeSelf(node: HTMLElement | null) {
        if (!node) {
          return undefined;
        }
        const observer = new ResizeObserver(() => {});
        observer.observe(node);
        return () => observer.disconnect();
      }

      function ObservedPanelApp() {
        const { toasts, add } = Toast.useToastManager();
        const [panelKey, setPanelKey] = React.useState(0);
        return (
          <React.Fragment>
            {/* Shallower than the toast content, and observed again on every remount. */}
            <div key={panelKey} ref={observeSelf} data-testid="panel">
              panel {panelKey}
            </div>
            <button
              type="button"
              onClick={() => {
                add({ title: 'Saved' });
                // Pending while the new toast content receives its first observation.
                requestAnimationFrame(() => setPanelKey((key) => key + 1));
              }}
            >
              add
            </button>
            <Toast.Viewport>
              {toasts.map((toastItem) => (
                <Toast.Root key={toastItem.id} toast={toastItem}>
                  <Toast.Content>
                    <Toast.Title />
                  </Toast.Content>
                </Toast.Root>
              ))}
            </Toast.Viewport>
          </React.Fragment>
        );
      }

      try {
        const { user } = await render(
          <Toast.Provider timeout={0}>
            <ObservedPanelApp />
          </Toast.Provider>,
        );

        expect(screen.getByTestId('panel')).toHaveTextContent('panel 0');

        await user.click(screen.getByRole('button', { name: 'add' }));

        await waitFor(() => {
          expect(screen.getByTestId('panel')).toHaveTextContent('panel 1');
        });
        // Let the observer deliveries that follow the remount run.
        await new Promise((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(resolve));
        });

        expect(errors).toEqual([]);
      } finally {
        window.removeEventListener('error', handleError);
      }
    },
  );
});
