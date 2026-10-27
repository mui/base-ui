import { expect, vi, describe, it } from 'vitest';
import * as React from 'react';
import { Toast } from '@base-ui/react/toast';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { act, fireEvent, flushMicrotasks, reactMajor, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { useToastProviderContext } from './ToastProviderContext';
import type { ToastManager } from '../createToastManager';

describe('<Toast.Provider />', () => {
  const { clock, render } = createRenderer();

  clock.withFakeTimers();

  it('syncs a changed timeout before descendant layout effects', async () => {
    const onClose = vi.fn();

    function AddToastInLayoutEffect(props: { active: boolean }) {
      const { add } = Toast.useToastManager();

      useIsoLayoutEffect(() => {
        if (props.active) {
          add({ id: 'toast', title: 'Toast', onClose });
        }
      }, [add, props.active]);

      return null;
    }

    function App(props: { timeout: number; addToast: boolean }) {
      return (
        <Toast.Provider timeout={props.timeout}>
          <AddToastInLayoutEffect active={props.addToast} />
        </Toast.Provider>
      );
    }

    const { setProps } = await render(<App timeout={5000} addToast={false} />);

    await setProps({ timeout: 1000, addToast: true });

    clock.tick(999);
    await flushMicrotasks();
    expect(onClose).not.toHaveBeenCalled();

    clock.tick(2);
    await flushMicrotasks();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('syncs a changed limit before descendant layout effects', async () => {
    const observeToasts = vi.fn();

    function AddToastsInLayoutEffect(props: { active: boolean }) {
      const { add } = Toast.useToastManager();

      useIsoLayoutEffect(() => {
        if (props.active) {
          add({ id: 'first', title: 'First', timeout: 0 });
          add({ id: 'second', title: 'Second', timeout: 0 });
        }
      }, [add, props.active]);

      return null;
    }

    function ObserveToastsInLayoutEffect(props: { active: boolean }) {
      const store = useToastProviderContext();

      useIsoLayoutEffect(() => {
        if (props.active) {
          observeToasts(
            store.state.toasts.map((toast) => ({
              id: toast.id,
              limited: toast.limited,
            })),
          );
        }
      }, [props.active, store]);

      return null;
    }

    function App(props: { limit: number; runEffects: boolean }) {
      return (
        <Toast.Provider limit={props.limit}>
          <AddToastsInLayoutEffect active={props.runEffects} />
          <ObserveToastsInLayoutEffect active={props.runEffects} />
        </Toast.Provider>
      );
    }

    const { setProps } = await render(<App limit={3} runEffects={false} />);

    await setProps({ limit: 1, runEffects: true });

    expect(observeToasts).toHaveBeenCalledWith([
      { id: 'second', limited: false },
      { id: 'first', limited: true },
    ]);
  });

  it('does not sync provider props from an abandoned render', async () => {
    const onClose = vi.fn();
    const suspendedRender = vi.fn();
    const never = new Promise(() => {});

    function SuspendingChild(): React.JSX.Element {
      suspendedRender();
      throw never;
    }

    function AddToastButton() {
      const { add } = Toast.useToastManager();
      return (
        <button
          type="button"
          onClick={() => {
            add({ title: 'Toast', onClose });
          }}
        >
          Add toast
        </button>
      );
    }

    function App() {
      const [timeout, setTimeout] = React.useState(5000);
      const [suspend, setSuspend] = React.useState(false);
      const [, startTransition] = React.useTransition();

      return (
        <React.Fragment>
          <button
            type="button"
            onClick={() => {
              startTransition(() => {
                setTimeout(1000);
                setSuspend(true);
              });
            }}
          >
            Start suspended update
          </button>
          <React.Suspense fallback="Loading">
            <Toast.Provider timeout={timeout}>
              {suspend && <SuspendingChild />}
              <AddToastButton />
            </Toast.Provider>
          </React.Suspense>
        </React.Fragment>
      );
    }

    await render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Start suspended update' }));
    await flushMicrotasks();
    expect(suspendedRender).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Add toast' }));

    clock.tick(1001);
    await flushMicrotasks();
    expect(onClose).not.toHaveBeenCalled();

    clock.tick(4000);
    await flushMicrotasks();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe.skipIf(reactMajor < 19)('React.Activity', () => {
    const Activity = (
      React as typeof React & {
        Activity: React.ComponentType<{ mode: 'visible' | 'hidden'; children: React.ReactNode }>;
      }
    ).Activity;

    function App(props: { visible: boolean; toastManager: ToastManager }) {
      return (
        <Activity mode={props.visible ? 'visible' : 'hidden'}>
          <Toast.Provider toastManager={props.toastManager}>
            <Toast.Viewport data-testid="viewport">
              <ToastList />
            </Toast.Viewport>
          </Toast.Provider>
        </Activity>
      );
    }

    function ToastList() {
      return Toast.useToastManager().toasts.map((toast) => (
        <Toast.Root key={toast.id} toast={toast}>
          <Toast.Title />
        </Toast.Root>
      ));
    }

    it('pauses the auto-dismiss timer while hidden and resumes it with the remaining time once revealed', async () => {
      const onClose = vi.fn();
      const toastManager = Toast.createToastManager();
      const { setProps } = await render(<App visible toastManager={toastManager} />);

      await act(async () => {
        toastManager.add({ title: 'Toast', timeout: 1000, onClose });
      });

      clock.tick(400);
      await setProps({ visible: false });

      clock.tick(5000);
      await flushMicrotasks();
      expect(onClose).not.toHaveBeenCalled();

      await setProps({ visible: true });

      clock.tick(599);
      await flushMicrotasks();
      expect(onClose).not.toHaveBeenCalled();

      clock.tick(2);
      await flushMicrotasks();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('keeps the timer paused after reveal while the viewport is still hovered', async () => {
      const onClose = vi.fn();
      const toastManager = Toast.createToastManager();
      const { setProps } = await render(<App visible toastManager={toastManager} />);

      await act(async () => {
        toastManager.add({ title: 'Toast', timeout: 1000, onClose });
      });

      fireEvent.mouseEnter(screen.getByTestId('viewport'));
      expect(screen.getByTestId('viewport')).toHaveAttribute('data-expanded');

      await setProps({ visible: false });
      await setProps({ visible: true });

      clock.tick(2000);
      await flushMicrotasks();
      expect(onClose).not.toHaveBeenCalled();

      fireEvent.mouseLeave(screen.getByTestId('viewport'));

      clock.tick(1001);
      await flushMicrotasks();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not start the timer of a toast updated while hidden until it is revealed', async () => {
      const onClose = vi.fn();
      const toastManager = Toast.createToastManager();
      const { setProps } = await render(<App visible toastManager={toastManager} />);

      let resolvePromise: (value: string) => void = () => {};
      await act(async () => {
        toastManager.promise(
          new Promise<string>((resolve) => {
            resolvePromise = resolve;
          }),
          {
            loading: 'loading',
            success: { title: 'success', timeout: 1000, onClose },
            error: 'error',
          },
        );
      });

      await setProps({ visible: false });

      // The promise settles while hidden, which gives the toast a timer.
      await act(async () => {
        resolvePromise('done');
      });

      clock.tick(5000);
      await flushMicrotasks();
      expect(onClose).not.toHaveBeenCalled();

      await setProps({ visible: true });

      clock.tick(1001);
      await flushMicrotasks();
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
