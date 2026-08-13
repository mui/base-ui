import { vi } from 'vitest';
import { NavigationMenu } from '@base-ui/react/navigation-menu';
import { createRenderer, describeConformance } from '#test-utils';

describe('<NavigationMenu.Arrow />', () => {
  const { render } = createRenderer();

  describeConformance(<NavigationMenu.Arrow />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <NavigationMenu.Root value="test">
          <NavigationMenu.Portal>
            <NavigationMenu.Positioner>{node}</NavigationMenu.Positioner>
          </NavigationMenu.Portal>
        </NavigationMenu.Root>,
      );
    },
  }));

  it('throws a descriptive error when rendered outside <NavigationMenu.Positioner>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <NavigationMenu.Root>
            <NavigationMenu.Arrow />
          </NavigationMenu.Root>,
        ),
      ).rejects.toThrow(
        'Base UI: NavigationMenuPositionerContext is missing. NavigationMenuPositioner parts must be placed within <NavigationMenu.Positioner>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
