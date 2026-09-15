import * as React from 'react';
import { expect, vi, describe, beforeEach, it } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, createDOMRect, isJSDOM, setElementClientHeight } from '#test-utils';
import { Virtualizer } from './Virtualizer';

interface TestRow {
  id: number;
  label: string;
}

function createRows(count: number): TestRow[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    label: `Item ${index + 1}`,
  }));
}

const HEADER_HEIGHT = 30;
const SCROLLER_HEIGHT = 100;

type TestTableProps = Omit<
  Virtualizer.Props<TestRow>,
  'children' | 'getItemKey' | 'items' | 'layout'
> & {
  items: TestRow[];
  /** The height of each row's cells, by item index. */
  rowHeight?: ((index: number) => number) | undefined;
  /** Content of the table after the virtualized section. */
  footer?: React.ReactNode;
  scrollerStyle?: React.CSSProperties | undefined;
  /** Whether the row renderer spreads the metadata it is handed. */
  spreadItemProps?: boolean | undefined;
  /** Renders the table with no scroll container around it. */
  unscrolled?: boolean | undefined;
};

/**
 * A semantic table whose body the virtualizer renders: column widths from a `<colgroup>`, a
 * sticky header, and a scroll container of the table's own around it.
 */
function TestTable(props: TestTableProps) {
  const {
    footer,
    items,
    rowHeight = () => 20,
    scrollerStyle,
    spreadItemProps = true,
    unscrolled = false,
    ...virtualizerProps
  } = props;

  const table = (
    <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%' }}>
      <colgroup>
        <col style={{ width: 60 }} />
        <col />
      </colgroup>
      <thead>
        <tr>
          <th
            scope="col"
            style={{ height: HEADER_HEIGHT, padding: 0, position: 'sticky', top: 0, zIndex: 1 }}
          >
            #
          </th>
          <th scope="col" style={{ padding: 0, position: 'sticky', top: 0, zIndex: 1 }}>
            Label
          </th>
        </tr>
      </thead>
      <Virtualizer<TestRow>
        estimatedItemHeight={20}
        getItemKey={(row) => row.id}
        items={items}
        layout="table"
        overscanPx={0}
        {...virtualizerProps}
      >
        {(row, index, itemProps) => (
          <tr {...(spreadItemProps ? itemProps : null)} tabIndex={-1}>
            <td style={{ height: rowHeight(index), padding: 0 }}>{index + 1}</td>
            <td style={{ padding: 0 }}>{row.label}</td>
          </tr>
        )}
      </Virtualizer>
      {footer}
    </table>
  );

  if (unscrolled) {
    return table;
  }

  return (
    <div
      data-testid="scroller"
      ref={isJSDOM ? setElementClientHeight(SCROLLER_HEIGHT) : undefined}
      style={{
        font: '14px/16px sans-serif',
        height: SCROLLER_HEIGHT,
        overflowY: 'auto',
        scrollPaddingTop: HEADER_HEIGHT,
        width: 300,
        ...scrollerStyle,
      }}
    >
      {table}
    </div>
  );
}

function getSection() {
  return document.querySelector('tbody')!;
}

function getRow(label: string) {
  return screen.getByText(label).closest('tr')!;
}

describe('<Virtualizer /> table layout', () => {
  const { render } = createRenderer();

  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect(
      this: HTMLElement,
    ) {
      if (this.hasAttribute('data-row-index')) {
        return createDOMRect({ height: 20, width: 200 });
      }

      return createDOMRect({ height: SCROLLER_HEIGHT, width: 200 });
    });
  });

  it('renders a window of rows as the only children of the table section', async () => {
    await render(<TestTable className="Body" items={createRows(100)} />);

    await screen.findByText('Item 1');

    const section = getSection();
    expect(section).toHaveClass('Body');
    // Every child is a row: no wrapper of the virtualizer's own between the section and a row.
    const children = Array.from(section.children);
    expect(children.length).toBeGreaterThan(2);
    expect(children.every((child) => child.tagName === 'TR')).toBe(true);
    expect(children.every((child) => child.hasAttribute('data-row-index'))).toBe(true);
    expect(section.querySelector('div')).toBe(null);
    // The rows outside the window are stood in for by a row group after the section, holding
    // their space in an empty row.
    const spacerSection = section.nextElementSibling!;
    expect(spacerSection.tagName).toBe('TBODY');
    expect(spacerSection.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(Array.from(spacerSection.children).every((child) => child.tagName === 'TR')).toBe(true);
    // A window, not the collection.
    const rows = section.querySelectorAll('[data-row-index]');
    expect(rows.length).toBeGreaterThanOrEqual(5);
    expect(rows.length).toBeLessThan(50);
    expect(screen.queryByText('Item 100')).toBe(null);
  });

  it('hands the row its metadata through the renderer argument', async () => {
    await render(<TestTable items={createRows(100)} />);

    const row = (await screen.findByText('Item 3')).closest('tr')!;

    expect(row).toHaveAttribute('data-row-index', '2');
    expect(row).toHaveAttribute('data-index', '2');
    expect(row).toHaveAttribute('aria-posinset', '3');
    expect(row).toHaveAttribute('aria-setsize', '100');
  });

  it('keeps the active row mounted as a row of the section outside the window', async () => {
    await render(<TestTable activeIndex={{ index: 50, scroll: false }} items={createRows(100)} />);

    const activeRow = (await screen.findByText('Item 51')).closest('tr')!;

    expect(activeRow.parentElement).toBe(getSection());
    expect(activeRow).toHaveStyle({ position: 'absolute' });
    expect(activeRow).not.toHaveAttribute('hidden');
    expect(Array.from(getSection().children).every((child) => child.tagName === 'TR')).toBe(true);
  });

  it('renders every row and no spacer while virtualization is disabled', async () => {
    await render(<TestTable enabled={false} items={createRows(100)} />);

    await screen.findByText('Item 100');

    const section = getSection();
    expect(section.querySelectorAll('[data-row-index]')).toHaveLength(100);
    expect(section.querySelector('[aria-hidden]')).toBe(null);
    expect(Array.from(section.children).every((child) => child.tagName === 'TR')).toBe(true);
    // No row group reserving space, and nothing holding the rows in place.
    expect(section.parentElement!.querySelectorAll('tbody')).toHaveLength(1);
    expect(section.style.position).toBe('');
  });

  it('renders group headers as rows of the section', async () => {
    const groups = [
      { name: 'First', items: createRows(3) },
      { name: 'Second', items: createRows(100).slice(3) },
    ];

    await render(
      <TestTable
        getGroupKey={(group: (typeof groups)[number]) => group.name}
        items={groups as never}
        renderGroupHeader={(group: (typeof groups)[number], _index, headerProps) => (
          <tr {...headerProps} aria-hidden={undefined}>
            <th colSpan={2} scope="rowgroup">
              {group.name}
            </th>
          </tr>
        )}
      />,
    );

    const header = (await screen.findByText('Second')).closest('tr')!;

    expect(header.parentElement).toBe(getSection());
    expect(header).toHaveAttribute('data-row-index', '4');
    expect(getRow('Item 4')).toHaveAttribute('data-row-index', '5');
    expect(Array.from(getSection().children).every((child) => child.tagName === 'TR')).toBe(true);
  });

  it('warns when a row does not receive the renderer argument', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await render(<TestTable items={createRows(100)} spreadItemProps={false} />);

      await waitFor(() =>
        expect(
          warnSpy.mock.calls.some(([message]) =>
            String(message).includes('did not receive the third argument'),
          ),
        ).toBe(true),
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('renders every row and warns without a scroll container', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await render(<TestTable items={createRows(100)} unscrolled />);

      await screen.findByText('Item 100');
      expect(getSection().querySelectorAll('[data-row-index]')).toHaveLength(100);
      expect(
        warnSpy.mock.calls.some(([message]) =>
          String(message).includes('has no scrollable ancestor'),
        ),
      ).toBe(true);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('warns when the scroll container is not height-constrained', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      function Test() {
        return (
          <div ref={setElementClientHeight(5000)} style={{ overflowY: 'auto' }}>
            <table>
              <Virtualizer<TestRow>
                estimatedItemHeight={20}
                getItemKey={(row) => row.id}
                items={createRows(100)}
                layout="table"
              >
                {(row, _index, itemProps) => (
                  <tr {...itemProps}>
                    <td>{row.label}</td>
                  </tr>
                )}
              </Virtualizer>
            </table>
          </div>
        );
      }

      await render(<Test />);

      await waitFor(() =>
        expect(
          warnSpy.mock.calls.some(([message]) =>
            String(message).includes(
              'The scroll container of <Virtualizer layout="table"> must have a constrained height',
            ),
          ),
        ).toBe(true),
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  describe.skipIf(isJSDOM)('in a laid-out table', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    function expectFullyVisible(row: HTMLElement, scroller: HTMLElement) {
      const rowRect = row.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      expect(rowRect.top).toBeGreaterThanOrEqual(scrollerRect.top - 1);
      expect(rowRect.bottom).toBeLessThanOrEqual(scrollerRect.bottom + 1);
    }

    it('lays out rows of varying measured heights to the end of the collection', async () => {
      // Rows of 20, 30, 40 and 50 pixels, estimated at 20: every measurement disagrees with the
      // estimate, and the space each row takes is its own.
      await render(
        <TestTable items={createRows(200)} rowHeight={(index) => 20 + (index % 4) * 10} />,
      );
      const scroller = screen.getByTestId('scroller');

      await screen.findByText('Item 1');
      expect(getRow('Item 2').getBoundingClientRect().height).toBe(30);
      expect(getRow('Item 4').getBoundingClientRect().height).toBe(50);

      scroller.scrollTop = scroller.scrollHeight;
      fireEvent.scroll(scroller);

      // Measuring the tail grows the content; the viewport stays pinned to its end. Corrections
      // are written from measured rects, so the pinned position can be fractional.
      await waitFor(() => expect(screen.queryByText('Item 200')).not.toBe(null));
      await waitFor(() =>
        expect(
          Math.abs(scroller.scrollTop - (scroller.scrollHeight - scroller.clientHeight)),
        ).toBeLessThanOrEqual(1),
      );
      await waitFor(() => expectFullyVisible(getRow('Item 200'), scroller));
      // The last row ends where the content does: nothing is reserved after it.
      expect(
        Math.abs(
          getRow('Item 200').getBoundingClientRect().bottom -
            scroller.getBoundingClientRect().bottom,
        ),
      ).toBeLessThanOrEqual(1);
      expect(getRow('Item 199').getBoundingClientRect().height).toBe(40);
    });

    it('scrolls a distant row into view by index', async () => {
      const actionsRef = React.createRef<Virtualizer.Actions>();
      await render(
        <TestTable
          actionsRef={actionsRef}
          items={createRows(500)}
          rowHeight={(index) => 20 + (index % 4) * 10}
        />,
      );
      const scroller = screen.getByTestId('scroller');
      await screen.findByText('Item 1');

      await act(async () => {
        actionsRef.current?.scrollToIndex(300, { align: 'start' });
      });

      // Below the sticky header, which `scroll-padding-top` on the scroll container reserves.
      await waitFor(() =>
        expect(getRow('Item 301').getBoundingClientRect().top).toBeCloseTo(
          scroller.getBoundingClientRect().top + HEADER_HEIGHT,
          0,
        ),
      );
      expect(getRow('Item 301')).toHaveAttribute('data-index', '300');

      await act(async () => {
        actionsRef.current?.scrollToIndex(120, { align: 'end' });
      });

      await waitFor(() =>
        expect(getRow('Item 121').getBoundingClientRect().bottom).toBeCloseTo(
          scroller.getBoundingClientRect().bottom,
          0,
        ),
      );
    });

    it('scrolls the active row into view when it changes', async () => {
      const { setProps } = await render(<TestTable activeIndex={0} items={createRows(500)} />);
      const scroller = screen.getByTestId('scroller');
      await screen.findByText('Item 1');

      await setProps({ activeIndex: 400 });

      await waitFor(() => expect(scroller.scrollTop).toBeGreaterThan(7000));
      await waitFor(() => expectFullyVisible(getRow('Item 401'), scroller));
    });

    it('keeps DOM focus on the active row while it is outside the window', async () => {
      const actionsRef = React.createRef<Virtualizer.Actions>();
      await render(
        <TestTable
          actionsRef={actionsRef}
          activeIndex={{ index: 0, scroll: false }}
          items={createRows(200)}
        />,
      );
      const scroller = screen.getByTestId('scroller');

      const activeRow = (await screen.findByText('Item 1')).closest('tr')!;
      await act(async () => {
        activeRow.focus();
      });
      expect(document.activeElement).toBe(activeRow);

      await act(async () => {
        actionsRef.current?.scrollToIndex(150, { align: 'start' });
      });
      await waitFor(() => expect(scroller.scrollTop).toBeGreaterThan(2500));

      // The row is outside the window now, retained as a row of the section that takes no
      // space, and it is the same element, so the focus it holds is kept.
      expect(getRow('Item 1')).toBe(activeRow);
      expect(activeRow.parentElement).toBe(getSection());
      expect(activeRow).toHaveStyle({ position: 'absolute' });
      expect(document.activeElement).toBe(activeRow);
      expect(Array.from(getSection().children).every((child) => child.tagName === 'TR')).toBe(true);
    });

    it('anchors the content when a refined estimate moves the rows above the viewport', async () => {
      // Short rows first, so the estimate they seed is far below the tall rows that follow.
      // Refining it once those are measured rewrites every unmeasured row, and the rows above
      // the viewport with them. The browser's own scroll anchoring is suppressed on the section,
      // so the compensation must come from the virtualizer alone.
      await render(
        <TestTable items={createRows(300)} rowHeight={(index) => (index < 100 ? 20 : 60)} />,
      );
      const scroller = screen.getByTestId('scroller');
      await screen.findByText('Item 1');
      await waitFor(() => expect(scroller.scrollHeight).toBeLessThan(6500));

      scroller.scrollTop = 2400;
      fireEvent.scroll(scroller);

      // The tall rows around the viewport are measured before the estimate is refined.
      await waitFor(() => expect(scroller.scrollHeight).toBeGreaterThan(6100));
      const scrollerRect = scroller.getBoundingClientRect();
      const anchor = Array.from(
        getSection().querySelectorAll<HTMLElement>('[data-row-index]'),
      ).find((row) => row.getBoundingClientRect().top >= scrollerRect.top + HEADER_HEIGHT)!;
      const anchorIndex = anchor.dataset.rowIndex!;
      const anchorTop = anchor.getBoundingClientRect().top;
      expect(Number(anchorIndex)).toBeGreaterThanOrEqual(100);

      // Refining the estimate once scrolling is idle moves the content above the viewport by
      // thousands of pixels; the row the user is looking at stays where it is.
      await waitFor(() => expect(scroller.scrollHeight).toBeGreaterThan(15000));
      expect(scroller.scrollTop).toBeGreaterThan(2400);
      await waitFor(() =>
        expect(
          getSection()
            .querySelector<HTMLElement>(`[data-row-index="${anchorIndex}"]`)
            ?.getBoundingClientRect().top,
        ).toBeCloseTo(anchorTop, 0),
      );
    });

    it('measures what the scroll container holds around the section', async () => {
      const actionsRef = React.createRef<Virtualizer.Actions>();
      await render(
        <TestTable
          actionsRef={actionsRef}
          footer={
            <tfoot>
              <tr>
                <td colSpan={2} style={{ height: 40, padding: 0 }}>
                  Footer
                </td>
              </tr>
            </tfoot>
          }
          items={createRows(200)}
          scrollerStyle={{ boxSizing: 'border-box', paddingBlock: 10 }}
        />,
      );
      const scroller = screen.getByTestId('scroller');
      await screen.findByText('Item 1');

      // Offsets are reported from the scroll origin: past the padding and the header.
      await waitFor(() =>
        expect(actionsRef.current?.getItemMetrics(0)).toEqual({ offset: 40, size: 20 }),
      );
      expect(actionsRef.current?.getIndexAtOffset(45)).toBe(0);
      expect(actionsRef.current?.getIndexAtOffset(60)).toBe(1);
      // The total covers the surroundings too: padding, header, rows, footer, padding.
      await waitFor(() =>
        expect(getSection().style.getPropertyValue('--total-size')).toBe(
          `${10 + HEADER_HEIGHT + 200 * 20 + 40 + 10}px`,
        ),
      );
      expect(scroller.scrollHeight).toBe(10 + HEADER_HEIGHT + 200 * 20 + 40 + 10);

      // The last row lands against the bottom edge, with the footer scrolled out below it.
      await act(async () => {
        actionsRef.current?.scrollToIndex(199, { align: 'end' });
      });
      await waitFor(() =>
        expect(getRow('Item 200').getBoundingClientRect().bottom).toBeCloseTo(
          scroller.getBoundingClientRect().bottom,
          0,
        ),
      );
    });

    it('renders trailing content as rows after the reserved space', async () => {
      const actionsRef = React.createRef<Virtualizer.Actions>();
      await render(
        <TestTable
          actionsRef={actionsRef}
          items={createRows(200)}
          trailing={
            <tr data-testid="trailing">
              <td colSpan={2} style={{ height: 40, padding: 0 }}>
                Loading…
              </td>
            </tr>
          }
        />,
      );
      const scroller = screen.getByTestId('scroller');
      await screen.findByText('Item 1');

      const section = getSection();
      const trailing = screen.getByTestId('trailing');
      // After the reserved space, in the row group that holds it.
      const spacerSection = section.nextElementSibling!;
      expect(trailing.parentElement).toBe(spacerSection);
      expect(trailing.previousElementSibling).toHaveAttribute('aria-hidden', 'true');
      expect(spacerSection.lastElementChild).toBe(trailing);
      expect(Array.from(spacerSection.children).every((child) => child.tagName === 'TR')).toBe(
        true,
      );

      await waitFor(() =>
        expect(section.style.getPropertyValue('--total-size')).toBe(
          `${HEADER_HEIGHT + 200 * 20 + 40}px`,
        ),
      );

      scroller.scrollTop = scroller.scrollHeight;
      fireEvent.scroll(scroller);

      await waitFor(() => expectFullyVisible(getRow('Item 200'), scroller));
      expectFullyVisible(trailing, scroller);
      expect(trailing.getBoundingClientRect().bottom).toBeCloseTo(
        scroller.getBoundingClientRect().bottom,
        0,
      );
    });

    it('holds the rows in a sticky row group that a transform positions', async () => {
      const actionsRef = React.createRef<Virtualizer.Actions>();
      await render(
        <TestTable
          actionsRef={actionsRef}
          items={createRows(300)}
          rowHeight={(index) => 20 + (index % 3) * 10}
        />,
      );
      const scroller = screen.getByTestId('scroller');
      const section = getSection();
      await screen.findByText('Item 1');

      expect(getComputedStyle(section).position).toBe('sticky');

      scroller.scrollTop = 2000;
      fireEvent.scroll(scroller);

      await waitFor(() => expect(screen.queryByText('Item 1')).toBe(null));
      // Held at the scrollport's start edge, and translated to where the window's rows belong.
      await waitFor(() =>
        expect(section.style.transform).toMatch(/^translate3d\(0(?:px)?, .+px, 0(?:px)?\)$/),
      );
      await waitFor(() => {
        const scrollerTop = scroller.getBoundingClientRect().top + scroller.clientTop;
        const errors = Array.from(section.querySelectorAll<HTMLElement>('[data-row-index]')).map(
          (row) => {
            const metrics = actionsRef.current!.getItemMetrics(Number(row.dataset.rowIndex))!;
            const expected = metrics.offset - scroller.scrollTop;
            return Math.abs(row.getBoundingClientRect().top - scrollerTop - expected);
          },
        );
        expect(Math.max(...errors)).toBeLessThan(1);
      });

      // The sticky header, positioned as well, paints above the section.
      const headerCell = scroller.querySelector('th')!;
      const headerRect = headerCell.getBoundingClientRect();
      expect(document.elementFromPoint(headerRect.left + 5, headerRect.top + 5)).toBe(headerCell);
    });

    it('scrolls to a row while virtualization is disabled', async () => {
      const actionsRef = React.createRef<Virtualizer.Actions>();
      await render(<TestTable actionsRef={actionsRef} enabled={false} items={createRows(100)} />);
      const scroller = screen.getByTestId('scroller');

      await act(async () => {
        actionsRef.current?.scrollToIndex(60, { align: 'start' });
      });

      // Below the header the table starts with, and below the sticky one at the top edge.
      await waitFor(() => expect(scroller.scrollTop).toBe(HEADER_HEIGHT + 60 * 20 - HEADER_HEIGHT));
      expect(getRow('Item 61').getBoundingClientRect().top).toBeCloseTo(
        scroller.getBoundingClientRect().top + HEADER_HEIGHT,
        0,
      );
    });
  });
});
