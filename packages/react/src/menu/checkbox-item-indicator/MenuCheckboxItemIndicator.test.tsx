import { expect, vi, describe, beforeEach, it } from 'vitest';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { MenuCheckboxItemContext } from '../checkbox-item/MenuCheckboxItemContext';

describe('<Menu.CheckboxItemIndicator />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  describeConformance(<Menu.CheckboxItemIndicator keepMounted />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.CheckboxItem>{node}</Menu.CheckboxItem>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );
    },
  }));

  it('throws when rendered outside Menu.CheckboxItem', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<Menu.CheckboxItemIndicator />)).rejects.toThrow(
        'Base UI: MenuCheckboxItemContext is missing. MenuCheckboxItem parts must be placed within <Menu.CheckboxItem>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('renders for an indeterminate checkbox item', async () => {
    const renderSpy = vi.fn();

    await render(
      <MenuCheckboxItemContext.Provider
        value={{ checked: false, indeterminate: true, disabled: false, highlighted: false }}
      >
        <Menu.CheckboxItemIndicator
          data-testid="indicator"
          render={(props, state) => {
            renderSpy(state);
            return <span {...props} />;
          }}
        />
      </MenuCheckboxItemContext.Provider>,
    );

    const indicator = screen.getByTestId('indicator');
    expect(indicator).toHaveAttribute('data-indeterminate', '');
    expect(indicator).not.toHaveAttribute('data-checked');
    expect(indicator).not.toHaveAttribute('data-unchecked');
    expect(renderSpy.mock.lastCall?.[0]).toHaveProperty('indeterminate', true);
  });

  it('updates the indicator state across checked and indeterminate values', async () => {
    function Test({ value }: { value: 'checked' | 'indeterminate' | 'unchecked' }) {
      return (
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.CheckboxItem
                  checked={value === 'checked'}
                  indeterminate={value === 'indeterminate'}
                >
                  <Menu.CheckboxItemIndicator data-testid="indicator" keepMounted />
                </Menu.CheckboxItem>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      );
    }

    const { rerender } = await render(<Test value="checked" />);
    const indicator = screen.getByTestId('indicator');

    expect(indicator).toHaveAttribute('data-checked', '');

    await rerender(<Test value="indeterminate" />);
    expect(indicator).toHaveAttribute('data-indeterminate', '');
    expect(indicator).not.toHaveAttribute('data-checked');

    await rerender(<Test value="checked" />);
    expect(indicator).toHaveAttribute('data-checked', '');

    await rerender(<Test value="unchecked" />);
    expect(indicator).toHaveAttribute('data-unchecked', '');
  });

  it.skipIf(isJSDOM)(
    'should remove the indicator when there is no exit animation defined',
    async ({ onTestFinished }) => {
      const frameCallbacks: FrameRequestCallback[] = [];
      const requestAnimationFrameSpy = vi
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation((callback) => {
          frameCallbacks.push(callback);
          return frameCallbacks.length;
        });
      onTestFinished(() => requestAnimationFrameSpy.mockRestore());

      function Test() {
        const [checked, setChecked] = React.useState(true);
        return (
          <div>
            <button onClick={() => setChecked(false)}>Close</button>
            <Menu.Root open modal={false}>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.CheckboxItem checked={checked}>
                      <Menu.CheckboxItemIndicator data-testid="indicator" />
                    </Menu.CheckboxItem>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </div>
        );
      }

      await render(<Test />);

      expect(screen.queryByTestId('indicator')).not.toBe(null);

      await waitFor(() => expect(frameCallbacks.length).toBeGreaterThan(0));
      while (frameCallbacks.length > 0) {
        act(() => {
          const callbacks = frameCallbacks.splice(0);
          callbacks.forEach((callback) => callback(performance.now()));
        });
      }
      requestAnimationFrameSpy.mockRestore();

      fireEvent.click(screen.getByText('Close'));

      await waitFor(() => {
        expect(screen.queryByTestId('indicator')).toBe(null);
      });
    },
  );

  it.skipIf(isJSDOM)('should remove the indicator when the animation finishes', async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

    let animationFinished = false;
    const notifyAnimationFinished = () => {
      animationFinished = true;
    };

    function Test() {
      const style = `
        @keyframes test-anim {
          to {
            opacity: 0;
          }
        }
        .animation-test-indicator[data-ending-style] {
          animation: test-anim 1ms;
        }
      `;

      const [checked, setChecked] = React.useState(true);

      return (
        <div>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: style }} />
          <button onClick={() => setChecked(false)}>Close</button>
          <Menu.Root open modal={false}>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.CheckboxItem checked={checked}>
                    <Menu.CheckboxItemIndicator
                      className="animation-test-indicator"
                      data-testid="indicator"
                      keepMounted
                      onAnimationEnd={notifyAnimationFinished}
                    />
                  </Menu.CheckboxItem>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>
      );
    }

    const { user } = await render(<Test />);

    expect(screen.getByTestId('indicator')).not.toHaveAttribute('hidden');

    const closeButton = screen.getByText('Close');
    await user.click(closeButton);

    await waitFor(() => {
      expect(animationFinished).toBe(true);
    });
  });

  it.skipIf(isJSDOM)(
    'keeps the indicator mounted to play its exit animation when unchecked without keepMounted',
    async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      function Test() {
        const style = `
        @keyframes test-anim {
          to {
            opacity: 0;
          }
        }
        .animation-test-indicator[data-ending-style] {
          animation: test-anim 1ms;
        }
      `;

        const [checked, setChecked] = React.useState(true);

        return (
          <div>
            {/* eslint-disable-next-line react/no-danger */}
            <style dangerouslySetInnerHTML={{ __html: style }} />
            <button onClick={() => setChecked(false)}>Close</button>
            <Menu.Root open modal={false}>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.CheckboxItem checked={checked}>
                      <Menu.CheckboxItemIndicator
                        className="animation-test-indicator"
                        data-testid="indicator"
                      />
                    </Menu.CheckboxItem>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </div>
        );
      }

      await render(<Test />);

      expect(screen.getByTestId('indicator')).not.toBe(null);

      fireEvent.click(screen.getByText('Close'));

      expect(screen.getByTestId('indicator')).toHaveAttribute('data-ending-style');

      await waitFor(() => {
        expect(screen.queryByTestId('indicator')).toBe(null);
      });
    },
  );
});
