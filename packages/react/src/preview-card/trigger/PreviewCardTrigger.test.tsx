import { expect, vi, describe, it } from 'vitest';
import { PreviewCard } from '@base-ui/react/preview-card';
import { fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, wait } from '#test-utils';

describe('<PreviewCard.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<PreviewCard.Trigger />, () => ({
    refInstanceof: window.HTMLAnchorElement,
    render(node) {
      return render(<PreviewCard.Root open>{node}</PreviewCard.Root>);
    },
  }));

  it('throws without PreviewCard.Root or a handle', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<PreviewCard.Trigger />)).rejects.toThrow(
        'Base UI: <PreviewCard.Trigger> must be either used within a <PreviewCard.Root> component or provided with a handle.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('stays closed when focus returns to the trigger after leaving the window, once the card has unmounted', async () => {
    const { user } = await render(
      <PreviewCard.Root>
        <PreviewCard.Trigger href="#" delay={0}>
          Trigger
        </PreviewCard.Trigger>
        <PreviewCard.Portal>
          <PreviewCard.Positioner>
            <PreviewCard.Popup data-testid="popup">Content</PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>,
    );
    const trigger = screen.getByRole('link', { name: 'Trigger' });

    await user.keyboard('[Tab]');
    expect(trigger).toHaveFocus();
    await waitFor(() => {
      expect(screen.queryByTestId('popup')).not.toBe(null);
    });

    await user.keyboard('[Escape]');
    await waitFor(() => {
      expect(screen.queryByTestId('popup')).toBe(null);
    });

    // Leaving the window blurs the trigger, then the window, while the trigger stays the active
    // element; coming back focuses the window, then the trigger.
    fireEvent.blur(trigger);
    fireEvent.blur(window);
    fireEvent.focus(window);
    fireEvent.focus(trigger);
    await wait(50);

    expect(screen.queryByTestId('popup')).toBe(null);
  });
});
