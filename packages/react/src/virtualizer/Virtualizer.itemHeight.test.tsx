import * as React from 'react';
import { expect, vi, describe, beforeEach, it } from 'vitest';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import {
  createRenderer,
  createDOMRect,
  isJSDOM,
  mockResizeObserver,
  setElementClientHeight,
} from '#test-utils';
import { Virtualizer } from './Virtualizer';

interface TestItem {
  id: number;
  label: string;
}

interface TestGroup {
  label: string;
  items: TestItem[];
}

function createItems(count: number): TestItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    label: `Item ${index + 1}`,
  }));
}

function createGroups(sizes: number[]): TestGroup[] {
  let next = 0;
  return sizes.map((size, groupIndex) => ({
    label: `Group ${groupIndex + 1}`,
    items: Array.from({ length: size }, () => {
      const item = { id: next, label: `Item ${next + 1}` };
      next += 1;
      return item;
    }),
  }));
}

function renderGroupHeader(group: TestGroup, _: number, headerProps: Virtualizer.GroupHeaderProps) {
  return <div {...headerProps}>{group.label}</div>;
}

function Listbox(
  props: {
    items: TestItem[];
  } & Omit<Virtualizer.Props<TestItem>, 'children' | 'getItemKey' | 'items'>,
) {
  const { items, ...virtualizerProps } = props;

  return (
    <Virtualizer<TestItem>
      getItemKey={(item) => item.id}
      items={items}
      role="listbox"
      {...virtualizerProps}
    >
      {(item, _, itemProps) => (
        <div {...itemProps} role="option" aria-selected={false} tabIndex={-1}>
          {item.label}
        </div>
      )}
    </Virtualizer>
  );
}

describe('<Virtualizer /> itemHeight', () => {
  const { render } = createRenderer();

  beforeEach(() => {
    // Rows report a height of their own, which a declared height must override rather than
    // converge on: nothing about this geometry is a measurement.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect(
      this: HTMLElement,
    ) {
      if (this.hasAttribute('data-row-index')) {
        return createDOMRect({ height: 50, width: 200 });
      }

      return createDOMRect({ height: 60, width: 200 });
    });
  });

  it('positions items from the declared height and never observes them', async () => {
    const resizeObserver = mockResizeObserver();

    try {
      await render(
        <Listbox
          itemHeight={20}
          overscanPx={0}
          render={<div ref={setElementClientHeight(60)} data-testid="virtualizer" />}
          items={createItems(100)}
        />,
      );

      const virtualizer = screen.getByTestId('virtualizer');
      // Exact from the first render: 100 items of 20 pixels, with no measured row in it.
      expect(virtualizer.style.getPropertyValue('--total-size')).toBe('2000px');
      // Three rows cover the scrollport, and the render buffer keeps one estimated row beyond it.
      await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(5));
      expect(screen.queryByText('Item 20')).toBe(null);

      // A row the observer never took cannot be notified about: the geometry is unmoved by a
      // measurement that contradicts the declaration.
      const firstRow = screen.getByText('Item 1').closest('[data-row-index]') as HTMLElement;
      await act(async () => {
        resizeObserver.notify(firstRow, 50);
      });

      expect(virtualizer.style.getPropertyValue('--total-size')).toBe('2000px');
      expect(screen.getAllByRole('option')).toHaveLength(5);
    } finally {
      resizeObserver.restore();
    }
  });

  it('measures the mounted rows again when the declared height is removed', async () => {
    const resizeObserver = mockResizeObserver();

    try {
      const { setProps } = await render(
        <Listbox
          itemHeight={20}
          overscanPx={0}
          render={<div ref={setElementClientHeight(60)} data-testid="virtualizer" />}
          items={createItems(100)}
        />,
      );

      const virtualizer = screen.getByTestId('virtualizer');
      await screen.findByText('Item 1');
      expect(virtualizer.style.getPropertyValue('--total-size')).toBe('2000px');

      // The rows are already mounted, and their ref keeps its identity across the change, so
      // nothing would observe them unless the binding is made again.
      await setProps({ itemHeight: undefined, estimatedItemHeight: 20 });

      const firstRow = screen.getByText('Item 1').closest('[data-row-index]') as HTMLElement;
      await act(async () => {
        resizeObserver.notify(firstRow, 50);
      });

      await waitFor(() =>
        expect(virtualizer.style.getPropertyValue('--total-size')).toBe('2030px'),
      );
    } finally {
      resizeObserver.restore();
    }
  });

  it('scrolls to an item arithmetically', async () => {
    const actionsRef = React.createRef<Virtualizer.Actions>();

    await render(
      <Listbox
        actionsRef={actionsRef}
        itemHeight={20}
        overscanPx={0}
        render={<div ref={setElementClientHeight(60)} data-testid="virtualizer" />}
        items={createItems(100)}
      />,
    );
    const virtualizer = screen.getByTestId('virtualizer');

    // No estimate to correct, so the first write is the final one.
    await act(async () => {
      actionsRef.current?.scrollToIndex(80, { align: 'start' });
    });
    await waitFor(() => expect(virtualizer.scrollTop).toBe(1600));
    expect(actionsRef.current?.getItemMetrics(80)).toEqual({ offset: 1600, size: 20 });
  });

  it('keeps measuring group headers, whose height is not declared', async () => {
    const resizeObserver = mockResizeObserver();

    try {
      await render(
        <Virtualizer<TestItem>
          estimatedGroupHeaderHeight={20}
          getItemKey={(item) => item.id}
          itemHeight={20}
          items={createGroups([3, 3])}
          overscanPx={0}
          render={<div ref={setElementClientHeight(1000)} data-testid="virtualizer" />}
          renderGroupHeader={renderGroupHeader}
          role="listbox"
        >
          {(item, _, itemProps) => (
            <div {...itemProps} role="option" aria-selected={false}>
              {item.label}
            </div>
          )}
        </Virtualizer>,
      );

      const virtualizer = screen.getByTestId('virtualizer');
      // Six items of 20, plus two headers still carrying their estimate.
      expect(virtualizer.style.getPropertyValue('--total-size')).toBe('160px');

      const header = screen.getByText('Group 1').closest('[data-row-index]') as HTMLElement;
      await act(async () => {
        resizeObserver.notify(header, 50);
      });

      // The header is measured like any row of the consumer's own; the items around it are not.
      await waitFor(() => expect(virtualizer.style.getPropertyValue('--total-size')).toBe('190px'));
    } finally {
      resizeObserver.restore();
    }
  });

  it.skipIf(isJSDOM)('lands a row where the browser lays it out', async () => {
    // Against real layout rather than mocked rects: the arithmetic the declared height replaces
    // measurement with has to agree with where the browser puts the rows.
    vi.restoreAllMocks();
    const actionsRef = React.createRef<Virtualizer.Actions>();

    await render(
      <Virtualizer<TestItem>
        actionsRef={actionsRef}
        getItemKey={(item) => item.id}
        itemHeight={20}
        items={createItems(500)}
        overscanPx={0}
        render={<div data-testid="virtualizer" style={{ height: 100 }} />}
        role="listbox"
      >
        {(item, _, itemProps) => (
          <div {...itemProps} role="option" aria-selected={false} style={{ height: 20 }}>
            {item.label}
          </div>
        )}
      </Virtualizer>,
    );
    const virtualizer = screen.getByTestId('virtualizer');

    await act(async () => {
      actionsRef.current?.scrollToIndex(300, { align: 'start' });
    });
    await waitFor(() => expect(virtualizer.scrollTop).toBe(6000));

    const row = await screen.findByText('Item 301');
    await waitFor(() =>
      expect(row.getBoundingClientRect().top).toBeCloseTo(
        virtualizer.getBoundingClientRect().top,
        0,
      ),
    );
  });

  it('warns about a height no item can be laid out as', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await render(
        <Listbox
          itemHeight={0}
          overscanPx={0}
          render={<div ref={setElementClientHeight(60)} />}
          items={createItems(10)}
        />,
      );

      expect(warnSpy.mock.calls.map(([message]) => String(message)).join('\n')).toContain(
        'received an `itemHeight` of 0',
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('warns when an estimate is given alongside a declared height', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await render(
        <Listbox
          estimatedItemHeight={30}
          itemHeight={20}
          overscanPx={0}
          render={<div ref={setElementClientHeight(60)} />}
          items={createItems(10)}
        />,
      );

      expect(warnSpy.mock.calls.map(([message]) => String(message)).join('\n')).toContain(
        'received both `itemHeight` and `estimatedItemHeight`',
      );
    } finally {
      warnSpy.mockRestore();
    }
  });
});
