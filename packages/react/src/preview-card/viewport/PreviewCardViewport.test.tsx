import { expect, vi, describe, it } from 'vitest';
import * as React from 'react';
import { PreviewCard } from '@base-ui/react/preview-card';
import { createRenderer, describeConformance, viewportConformanceTests } from '#test-utils';

describe('<PreviewCard.Viewport />', () => {
  const { render } = createRenderer();

  describeConformance(<PreviewCard.Viewport />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <PreviewCard.Root open>
          <PreviewCard.Trigger>Trigger</PreviewCard.Trigger>
          <PreviewCard.Portal>
            <PreviewCard.Positioner>
              <PreviewCard.Popup>{node}</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>,
      );
    },
  }));

  viewportConformanceTests({
    render,
    openOn: 'focus',
    createComponent: ({ root, triggers, portal, positioner, popup, viewport, renderContent }) => (
      <PreviewCard.Root {...root}>
        {({ payload }) => (
          <React.Fragment>
            {triggers.map(({ key, ...triggerProps }, index) => (
              <PreviewCard.Trigger key={key ?? index} href="#" delay={0} {...triggerProps} />
            ))}
            <PreviewCard.Portal {...portal}>
              <PreviewCard.Positioner {...positioner}>
                <PreviewCard.Popup {...popup}>
                  <PreviewCard.Viewport {...viewport}>
                    {renderContent(payload)}
                  </PreviewCard.Viewport>
                </PreviewCard.Popup>
              </PreviewCard.Positioner>
            </PreviewCard.Portal>
          </React.Fragment>
        )}
      </PreviewCard.Root>
    ),
  });

  it('throws a descriptive error when rendered outside <PreviewCard.Positioner>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <PreviewCard.Root open>
            <PreviewCard.Portal>
              <PreviewCard.Viewport />
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
});
