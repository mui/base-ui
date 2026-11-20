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

  it('removes the default arrow when `children={null}` is passed alongside `render`', async () => {
    // See https://github.com/mui/base-ui/issues/4752 — `render` alone does not clear the
    // default glyph (that would change behavior for call sites using `render` only to swap
    // the tag); pairing it with `children={null}` is the documented way to opt out.
    await render(
      <NavigationMenu.Root>
        <NavigationMenu.Item>
          <NavigationMenu.Icon render={<span data-testid="custom-icon" className="my-icon" />}>
            {null}
          </NavigationMenu.Icon>
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
