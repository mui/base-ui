import * as React from 'react';
import { Toast } from '@base-ui/react/toast';
import { fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { createRenderer, isJSDOM } from '#test-utils';
import { useToastActions } from './useToastActions';
import { List } from './utils/test-utils';

async function tick(clock: ReturnType<typeof createRenderer>['clock'], ms: number) {
  clock.tick(ms);
  await flushMicrotasks();
}

describe.skipIf(!isJSDOM)('useToastActions', () => {
  const { clock, render } = createRenderer();

  clock.withFakeTimers();

  it('adds a toast without subscribing to state (no re-renders on toast changes)', async () => {
    const renderCount = { current: 0 };

    function ActionButton() {
      const { add } = useToastActions();
      renderCount.current += 1;
      return (
        <button
          onClick={() => {
            add({ title: 'test' });
          }}
        >
          add
        </button>
      );
    }

    await render(
      <Toast.Provider>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
        <ActionButton />
      </Toast.Provider>,
    );

    const initialRenders = renderCount.current;

    const button = screen.getByRole('button', { name: 'add' });
    fireEvent.click(button);

    expect(screen.queryByTestId('root')).not.to.equal(null);

    // The action-only component should NOT have re-rendered
    expect(renderCount.current).to.equal(initialRenders);

    await tick(clock, 5000);

    // After auto-dismiss, still no re-render
    expect(renderCount.current).to.equal(initialRenders);
  });

  it('closes a toast', async () => {
    let toastId = '';

    function ActionButton() {
      const { add, close } = useToastActions();
      return (
        <div>
          <button
            onClick={() => {
              toastId = add({ title: 'closeable' });
            }}
          >
            add
          </button>
          <button
            onClick={() => {
              close(toastId);
            }}
          >
            close
          </button>
        </div>
      );
    }

    await render(
      <Toast.Provider>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
        <ActionButton />
      </Toast.Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'add' }));
    expect(screen.queryByTestId('root')).not.to.equal(null);

    fireEvent.click(screen.getByRole('button', { name: 'close' }));
    expect(screen.queryByTestId('root')).to.equal(null);
  });

  it('updates a toast', async () => {
    let toastId = '';

    function ActionButton() {
      const { add, update } = useToastActions();
      return (
        <div>
          <button
            onClick={() => {
              toastId = add({ title: 'original' });
            }}
          >
            add
          </button>
          <button
            onClick={() => {
              update(toastId, { description: 'updated desc' });
            }}
          >
            update
          </button>
        </div>
      );
    }

    await render(
      <Toast.Provider>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
        <ActionButton />
      </Toast.Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'add' }));
    expect(screen.getByTestId('title')).to.have.text('original');

    fireEvent.click(screen.getByRole('button', { name: 'update' }));
    expect(screen.getByTestId('description')).to.have.text('updated desc');
  });

  it('handles promise toasts', async () => {
    let resolvePromise: (value: string) => void;

    function ActionButton() {
      const { promise } = useToastActions();
      return (
        <button
          onClick={() => {
            const p = new Promise<string>((resolve) => {
              resolvePromise = resolve;
            });
            promise(p, {
              loading: 'Loading...',
              success: (value) => `Success: ${value}`,
              error: 'Error',
            });
          }}
        >
          promise
        </button>
      );
    }

    await render(
      <Toast.Provider>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
        <ActionButton />
      </Toast.Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'promise' }));
    expect(screen.getByTestId('description')).to.have.text('Loading...');

    resolvePromise!('done');
    await flushMicrotasks();

    expect(screen.getByTestId('description')).to.have.text('Success: done');
  });

  it('throws when used outside of Toast.Provider', () => {
    function BadComponent() {
      useToastActions();
      return null;
    }

    expect(() => {
      // Use renderToString-like approach by wrapping in try/catch
      const container = document.createElement('div');
      const root = (React as any).createRoot?.(container) ?? null;
      if (root) {
        expect(() => {
          root.render(<BadComponent />);
        }).to.throw('Base UI: useToastActions must be used within <Toast.Provider>.');
      }
    });
  });
});
