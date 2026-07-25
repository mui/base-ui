import { expect, vi } from 'vitest';
import * as React from 'react';
import { Toast } from '@base-ui/react/toast';
import { screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

const toast: Toast.Root.ToastObject = {
  id: 'test',
  title: 'Toast title',
};

describe('<Toast.Arrow />', () => {
  const { render } = createRenderer();

  describeConformance(<Toast.Arrow />, () => ({
    refInstanceof: window.Element,
    render(node) {
      return render(
        <Toast.Provider>
          <Toast.Positioner toast={toast}>{node}</Toast.Positioner>
        </Toast.Provider>,
      );
    },
  }));

  it.skipIf(isJSDOM)('mirrors the resolved side of its positioner', async () => {
    function App() {
      const anchorRef = React.useRef<HTMLButtonElement | null>(null);
      const { add, toasts } = Toast.useToastManager();
      return (
        <React.Fragment>
          <button
            type="button"
            ref={anchorRef}
            style={{ position: 'absolute', top: 200, left: 100, width: 80, height: 20 }}
            onClick={() =>
              add({
                title: 'title',
                positionerProps: { anchor: anchorRef.current, side: 'bottom' },
              })
            }
          >
            anchor
          </button>
          <Toast.Viewport>
            {toasts.map((toastItem) => (
              <Toast.Positioner key={toastItem.id} toast={toastItem}>
                <Toast.Root toast={toastItem}>
                  <Toast.Arrow data-testid="arrow" />
                  <Toast.Title />
                </Toast.Root>
              </Toast.Positioner>
            ))}
          </Toast.Viewport>
        </React.Fragment>
      );
    }

    const { user } = await render(
      <Toast.Provider>
        <App />
      </Toast.Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'anchor' }));

    const arrow = screen.getByTestId('arrow');
    await waitFor(() => expect(arrow).toHaveAttribute('data-side', 'bottom'));
    expect(arrow).toHaveAttribute('aria-hidden', 'true');
  });

  it('throws a descriptive error when rendered outside <Toast.Positioner>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <Toast.Provider>
            <Toast.Arrow />
          </Toast.Provider>,
        ),
      ).rejects.toThrow(
        'Base UI: ToastPositionerContext is missing. ToastPositioner parts must be placed within <Toast.Positioner>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
