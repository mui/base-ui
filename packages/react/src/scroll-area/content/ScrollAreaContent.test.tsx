import * as React from 'react';
import { expect, vi } from 'vitest';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { createRenderer, isJSDOM } from '#test-utils';
import { screen, waitFor } from '@mui/internal-test-utils';
import { describeConformance } from '../../../test/describeConformance';

describe('<ScrollArea.Content />', () => {
  const { render } = createRenderer();

  describeConformance(<ScrollArea.Content />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <ScrollArea.Root>
          <ScrollArea.Viewport>{node}</ScrollArea.Viewport>
        </ScrollArea.Root>,
      );
    },
  }));

  it('throws a descriptive error when rendered outside <ScrollArea.Viewport>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <ScrollArea.Root>
            <ScrollArea.Content />
          </ScrollArea.Root>,
        ),
      ).rejects.toThrow(
        'Base UI: ScrollAreaViewportContext missing. ScrollAreaViewport parts must be placed within <ScrollArea.Viewport>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it.skipIf(isJSDOM)('recomputes overflow when observed content resizes', async () => {
    const renderArea = (contentHeight: number) => (
      <ScrollArea.Root data-testid="root" style={{ width: 100, height: 100 }}>
        <ScrollArea.Viewport style={{ width: '100%', height: '100%' }}>
          <ScrollArea.Content data-testid="content" style={{ height: contentHeight }} />
        </ScrollArea.Viewport>
      </ScrollArea.Root>
    );

    const { rerender } = await render(renderArea(50));
    const root = screen.getByTestId('root');

    await waitFor(() => expect(root).not.toHaveAttribute('data-has-overflow-y'));

    await rerender(renderArea(1000));

    await waitFor(() => expect(root).toHaveAttribute('data-has-overflow-y'));
  });

  it('supports a custom content renderer that does not forward its ref', async () => {
    function ContentWithoutRef({ ref: ignoredRef, ...props }: React.ComponentPropsWithRef<'div'>) {
      return <div {...props} />;
    }

    await render(
      <ScrollArea.Root>
        <ScrollArea.Viewport>
          <ScrollArea.Content data-testid="content" render={<ContentWithoutRef />} />
        </ScrollArea.Viewport>
      </ScrollArea.Root>,
    );

    expect(screen.getByTestId('content')).toBeInTheDocument();
  });
});
