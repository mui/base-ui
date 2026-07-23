import { expect, vi } from 'vitest';
import { PreviewCard } from '@base-ui/react/preview-card';
import { createRenderer, describeConformance } from '#test-utils';

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
});
