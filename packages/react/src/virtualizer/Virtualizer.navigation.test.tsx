/* eslint-disable no-await-in-loop -- Each keypress depends on the preceding activation. */
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM, mockResizeObserver } from '#test-utils';
import { Virtualizer } from './Virtualizer';

const items = Array.from({ length: 500 }, (_, index) => index);

function TestList(props: {
  layout: 'list' | 'table';
  items?: number[];
  actionsRef: React.RefObject<Virtualizer.Actions | null>;
  estimatedItemHeight: number | (() => number);
}) {
  const { layout, items: itemsProp = items, ...virtualizerProps } = props;
  const [activeIndex, setActiveIndex] = React.useState(0);
  const isTable = layout === 'table';
  const virtualizer = (
    <Virtualizer
      {...virtualizerProps}
      activeIndex={activeIndex}
      items={itemsProp}
      layout={layout}
      data-testid={isTable ? undefined : 'scroller'}
      style={isTable ? undefined : { height: 200, width: 300 }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setActiveIndex((index) => index + 1);
        }
      }}
    >
      {(item, index, itemProps) =>
        isTable ? (
          <tr {...itemProps} tabIndex={-1} data-testid={`item-${index}`}>
            <td style={{ height: 40, padding: 0 }}>{item}</td>
          </tr>
        ) : (
          <div {...itemProps} tabIndex={-1} data-testid={`item-${index}`} style={{ height: 40 }}>
            {item}
          </div>
        )
      }
    </Virtualizer>
  );

  return isTable ? (
    <div data-testid="scroller" style={{ height: 200, width: 300, overflow: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>{virtualizer}</table>
    </div>
  ) : (
    virtualizer
  );
}

describe.skipIf(isJSDOM)('<Virtualizer /> underestimated row navigation', () => {
  const { render } = createRenderer();

  describe.each(['list', 'table'] as const)('%s layout', (layout) => {
    it('retries when a first measurement matches an updated estimate', async () => {
      const observer = mockResizeObserver();
      try {
        const actionsRef = React.createRef<Virtualizer.Actions>();
        const { setProps } = await render(
          <TestList layout={layout} actionsRef={actionsRef} estimatedItemHeight={() => 20} />,
        );
        const scroller = screen.getByTestId('scroller');
        for (let index = 0; index < 5; index += 1) {
          observer.notify(scroller.querySelector<HTMLElement>(`[data-row-index="${index}"]`)!, 40);
        }
        await waitFor(() => expect(actionsRef.current!.getItemMetrics(5)?.offset).toBe(200));

        for (let index = 0; index < 5; index += 1) {
          const row = screen.getByTestId(`item-${index}`);
          await act(async () => row.focus({ preventScroll: true }));
          fireEvent.keyDown(row, { key: 'ArrowDown' });
        }
        await waitFor(() => expect(scroller.scrollTop).toBe(20));

        // Update the estimate before the destination's first observer notification. Its
        // measured flag changes, but its cached height does not, so the engine emits no update.
        await setProps({ estimatedItemHeight: () => 40, items: [...items, 500] });
        await waitFor(() => expect(actionsRef.current!.getItemMetrics(5)?.size).toBe(40));
        observer.notify(scroller.querySelector<HTMLElement>('[data-row-index="5"]')!, 40);

        await waitFor(() =>
          expect(screen.getByTestId('item-5').getBoundingClientRect().bottom).toBeLessThanOrEqual(
            scroller.getBoundingClientRect().bottom + 1,
          ),
        );
      } finally {
        observer.restore();
      }
    });

    it.each(['static', 'per-item'] as const)(
      'keeps active rows visible with a %s estimate at half their height',
      async (estimate) => {
        const actionsRef = React.createRef<Virtualizer.Actions>();
        await render(
          <TestList
            layout={layout}
            actionsRef={actionsRef}
            estimatedItemHeight={estimate === 'static' ? 20 : () => 20}
          />,
        );
        const scroller = screen.getByTestId('scroller');
        expect(screen.getByTestId('item-0').getBoundingClientRect().height).toBe(40);

        for (let index = 1; index <= 300; index += 1) {
          const previousRow = screen.getByTestId(`item-${index - 1}`);
          await act(async () => {
            previousRow.focus({ preventScroll: true });
          });
          fireEvent.keyDown(previousRow, { key: 'ArrowDown' });
          await waitFor(() =>
            expect(
              screen.getByTestId(`item-${index}`).getBoundingClientRect().bottom,
            ).toBeLessThanOrEqual(scroller.getBoundingClientRect().bottom + 1),
          );
          expect(
            screen.getByTestId(`item-${index}`).getBoundingClientRect().top,
          ).toBeGreaterThanOrEqual(scroller.getBoundingClientRect().top - 1);
        }

        // A static estimate refines unvisited rows; a per-item estimate stays under caller control.
        await waitFor(() =>
          expect(actionsRef.current!.getItemMetrics(499)?.size).toBe(
            estimate === 'static' ? 40 : 20,
          ),
        );

        // A row already visited must use its measured size for imperative alignment too.
        await act(async () => {
          actionsRef.current!.scrollToIndex(290, { align: 'start' });
        });
        await waitFor(() =>
          expect(screen.getByTestId('item-290').getBoundingClientRect().top).toBeCloseTo(
            scroller.getBoundingClientRect().top,
            0,
          ),
        );
        expect(actionsRef.current!.getItemMetrics(290)?.size).toBe(40);
        expect(scroller.scrollTop).toBeCloseTo(actionsRef.current!.getItemMetrics(290)!.offset, 0);
      },
    );
  });
});
