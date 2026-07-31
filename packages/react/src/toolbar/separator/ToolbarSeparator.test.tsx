import { expect, vi } from 'vitest';
import { Toolbar } from '@base-ui/react/toolbar';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Toolbar.Separator />', () => {
  const { render } = createRenderer();

  describeConformance(<Toolbar.Separator />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => render(<Toolbar.Root>{node}</Toolbar.Root>),
  }));

  it.each([
    ['horizontal', 'vertical'],
    ['vertical', 'horizontal'],
  ] as const)(
    'uses a %s separator in a %s toolbar',
    async (separatorOrientation, toolbarOrientation) => {
      await render(
        <Toolbar.Root orientation={toolbarOrientation}>
          <Toolbar.Separator />
        </Toolbar.Root>,
      );

      expect(screen.getByRole('separator')).toHaveAttribute(
        'aria-orientation',
        separatorOrientation,
      );
    },
  );

  it('allows its orientation to be overridden', async () => {
    await render(
      <Toolbar.Root orientation="horizontal">
        <Toolbar.Separator orientation="horizontal" />
      </Toolbar.Root>,
    );

    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('throws a descriptive error when rendered outside Toolbar.Root', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<Toolbar.Separator />)).rejects.toThrow(
        'Base UI: ToolbarRootContext is missing. Toolbar parts must be placed within <Toolbar.Root>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
