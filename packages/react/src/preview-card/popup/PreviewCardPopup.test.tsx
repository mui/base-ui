import { expect, vi } from 'vitest';
import { PreviewCard } from '@base-ui/react/preview-card';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<PreviewCard.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<PreviewCard.Popup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <PreviewCard.Root open>
          <PreviewCard.Portal>
            <PreviewCard.Positioner>{node}</PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>,
      );
    },
  }));

  it('throws a descriptive error when rendered outside <PreviewCard.Root>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<PreviewCard.Popup />)).rejects.toThrow(
        'Base UI: PreviewCardRootContext is missing. PreviewCard parts must be placed within <PreviewCard.Root>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('throws a descriptive error when rendered outside <PreviewCard.Positioner>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <PreviewCard.Root open>
            <PreviewCard.Portal>
              <PreviewCard.Popup />
            </PreviewCard.Portal>
          </PreviewCard.Root>,
        ),
      ).rejects.toThrow(
        'Base UI: PreviewCardPositionerContext is missing. PreviewCardPositioner parts must be placed within <PreviewCard.Positioner>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('should render the children', async () => {
    await render(
      <PreviewCard.Root open>
        <PreviewCard.Portal>
          <PreviewCard.Positioner>
            <PreviewCard.Popup>Content</PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>,
    );

    expect(screen.getByText('Content')).not.toBe(null);
  });
});
