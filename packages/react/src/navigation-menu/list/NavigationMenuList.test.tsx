import { vi } from 'vitest';
import { fireEvent, screen } from '@mui/internal-test-utils';
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
});
