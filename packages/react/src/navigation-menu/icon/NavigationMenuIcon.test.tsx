import { vi } from 'vitest';
import { NavigationMenu } from '@base-ui/react/navigation-menu';
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
