import { vi, describe, it, expect } from 'vitest';
import { NavigationMenu } from '@base-ui/react/navigation-menu';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<NavigationMenu.Icon />', () => {
  const { render } = createRenderer();

  describeConformance(<NavigationMenu.Icon />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(
        <NavigationMenu.Root>
          <NavigationMenu.Item>{node}</NavigationMenu.Item>
        </NavigationMenu.Root>,
      );
    },
  }));

  it('does not render the default arrow when `render` is a childless custom element', async () => {
    // Regression test for https://github.com/mui/base-ui/issues/4752
    await render(
      <NavigationMenu.Root>
        <NavigationMenu.Item>
          <NavigationMenu.Icon render={<span data-testid="custom-icon" className="my-icon" />} />
        </NavigationMenu.Item>
      </NavigationMenu.Root>,
    );

    const icon = screen.getByTestId('custom-icon');
    expect(icon.textContent).toBe('');
  });

  it('throws a descriptive error when rendered outside <NavigationMenu.Item>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <NavigationMenu.Root>
            <NavigationMenu.Icon />
          </NavigationMenu.Root>,
        ),
      ).rejects.toThrow(
        'Base UI: NavigationMenuItem parts must be used within a <NavigationMenu.Item>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
