import { vi } from 'vitest';
import * as React from 'react';
import { act, fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { NavigationMenu } from '@base-ui/react/navigation-menu';
import { createRenderer, describeConformance } from '#test-utils';

describe('<NavigationMenu.List />', () => {
  const { render } = createRenderer();

  describeConformance(<NavigationMenu.List />, () => ({
    refInstanceof: window.HTMLUListElement,
    render(node) {
      return render(<NavigationMenu.Root>{node}</NavigationMenu.Root>);
    },
  }));

  it('throws a descriptive error when rendered outside <NavigationMenu.Root>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<NavigationMenu.List />)).rejects.toThrow(
        'Base UI: NavigationMenuRootContext is missing. Navigation Menu parts must be placed within <NavigationMenu.Root>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('stops vertical navigation keys from escaping the list', async () => {
    const handleKeyDown = vi.fn();

    await render(
      <div onKeyDown={handleKeyDown}>
        <NavigationMenu.Root orientation="vertical">
          <NavigationMenu.List data-testid="list">
            <NavigationMenu.Item>
              <NavigationMenu.Trigger>Item</NavigationMenu.Trigger>
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu.Root>
      </div>,
    );

    const trigger = screen.getByRole('button', { name: 'Item' });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'ArrowUp' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });

    expect(handleKeyDown.mock.calls.length).toBe(0);

    fireEvent.keyDown(trigger, { key: 'PageDown' });

    expect(handleKeyDown.mock.calls.length).toBe(1);
  });

  describe('item removal', () => {
    function App({ showFirst }: { showFirst: boolean }) {
      return (
        <NavigationMenu.Root>
          <NavigationMenu.List>
            {showFirst && (
              <NavigationMenu.Item>
                <NavigationMenu.Trigger data-testid="first">One</NavigationMenu.Trigger>
              </NavigationMenu.Item>
            )}
            <NavigationMenu.Item>
              <NavigationMenu.Trigger data-testid="middle">Two</NavigationMenu.Trigger>
            </NavigationMenu.Item>
            <NavigationMenu.Item>
              <NavigationMenu.Trigger data-testid="last">Three</NavigationMenu.Trigger>
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu.Root>
      );
    }

    it('navigates from the focused trigger after an earlier item is removed', async () => {
      const { setProps } = await render(<App showFirst />);

      const first = screen.getByTestId('first');
      await act(async () => {
        first.focus();
      });

      fireEvent.keyDown(first, { key: 'ArrowRight' });
      await flushMicrotasks();

      const middle = screen.getByTestId('middle');
      fireEvent.keyDown(middle, { key: 'ArrowRight' });
      await flushMicrotasks();

      const last = screen.getByTestId('last');
      expect(last).toHaveFocus();

      await setProps({ showFirst: false });

      fireEvent.keyDown(last, { key: 'ArrowLeft' });
      await flushMicrotasks();

      expect(middle).toHaveFocus();
    });
  });
});
