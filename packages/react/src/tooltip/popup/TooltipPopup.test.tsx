import { expect, vi } from 'vitest';
import { Tooltip } from '@base-ui/react/tooltip';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Tooltip.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<Tooltip.Popup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Tooltip.Root open>
          <Tooltip.Portal>
            <Tooltip.Positioner>{node}</Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>,
      );
    },
  }));

  it('should render the children', async () => {
    await render(
      <Tooltip.Root open>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup>Content</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );

    expect(screen.getByText('Content')).not.toBe(null);
  });

  it('throws a descriptive error when rendered outside <Tooltip.Positioner>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <Tooltip.Root open>
            <Tooltip.Portal>
              <Tooltip.Popup />
            </Tooltip.Portal>
          </Tooltip.Root>,
        ),
      ).rejects.toThrow(
        'Base UI: TooltipPositionerContext is missing. TooltipPositioner parts must be placed within <Tooltip.Positioner>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
