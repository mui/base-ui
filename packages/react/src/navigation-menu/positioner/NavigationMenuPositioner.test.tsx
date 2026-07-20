import { beforeEach, expect, vi } from 'vitest';
import { NavigationMenu } from '@base-ui/react/navigation-menu';
import { createRenderer, describeConformance } from '#test-utils';

const useNavigationMenuAnchorPositioningSpy = vi.hoisted(() => vi.fn());

vi.mock('../utils/useNavigationMenuAnchorPositioning', async () => {
  const actual = await vi.importActual<
    typeof import('../utils/useNavigationMenuAnchorPositioning')
  >('../utils/useNavigationMenuAnchorPositioning');

  return {
    ...actual,
    useNavigationMenuAnchorPositioning: ((
      ...args: Parameters<typeof actual.useNavigationMenuAnchorPositioning>
    ) => {
      useNavigationMenuAnchorPositioningSpy(...args);
      return actual.useNavigationMenuAnchorPositioning(...args);
    }) satisfies typeof actual.useNavigationMenuAnchorPositioning,
  };
});

describe('<NavigationMenu.Positioner />', () => {
  const { render } = createRenderer();

  beforeEach(() => {
    useNavigationMenuAnchorPositioningSpy.mockClear();
  });

  describeConformance(<NavigationMenu.Positioner />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <NavigationMenu.Root value="test">
          <NavigationMenu.Portal>{node}</NavigationMenu.Portal>
        </NavigationMenu.Root>,
      );
    },
  }));

  it('uses the layout viewport', async () => {
    await render(
      <NavigationMenu.Root value="test">
        <NavigationMenu.Portal>
          <NavigationMenu.Positioner />
        </NavigationMenu.Portal>
      </NavigationMenu.Root>,
    );

    expect(useNavigationMenuAnchorPositioningSpy.mock.lastCall?.[0].shift).toEqual({
      rootBoundary: 'layoutViewport',
    });
  });

  it('throws a descriptive error when rendered outside <NavigationMenu.Portal>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <NavigationMenu.Root value="test">
            <NavigationMenu.Positioner />
          </NavigationMenu.Root>,
        ),
      ).rejects.toThrow('Base UI: <NavigationMenu.Portal> is missing.');
    } finally {
      errorSpy.mockRestore();
    }
  });
});
