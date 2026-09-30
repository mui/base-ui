import * as React from 'react';
import { expect, vi, describe, beforeEach, it } from 'vitest';
import { screen } from '@mui/internal-test-utils';
import {
  createRenderer,
  createDOMRect,
  setElementClientHeight,
  TestListItem,
  createVirtualizerItems as createItems,
} from '#test-utils';
import type { VirtualizerTestItem as TestItem } from '#test-utils';
import { Virtualizer } from './Virtualizer';
import { createVirtualizerRegistry, useVirtualizerItem, VirtualizerHostProvider } from './host';
import type { VirtualizerHost, VirtualizerHostState } from './host';
import type { VirtualizerItemMetadata } from './types';

/**
 * A host assembled from the public contract alone, so each test can place parts around the
 * virtualizer the way a host author would.
 */
function Host(props: {
  children: React.ReactNode;
  items: readonly TestItem[];
  rendersItemPart?: boolean;
}) {
  const { children, items, rendersItemPart = true } = props;
  const registry = React.useRef(createVirtualizerRegistry()).current;
  const host = React.useMemo<VirtualizerHost>(
    () => ({ componentName: 'TestList', registry, rendersItemPart }),
    [registry, rendersItemPart],
  );
  const state = React.useMemo<VirtualizerHostState>(() => ({ activeIndex: null, items }), [items]);

  return (
    <VirtualizerHostProvider host={host} state={state}>
      {children}
    </VirtualizerHostProvider>
  );
}

function renderVirtualizer(renderItem: (item: TestItem, index: number) => React.ReactElement) {
  return (
    <Virtualizer<TestItem>
      estimatedItemHeight={20}
      getItemKey={(item) => item.label}
      render={<div ref={setElementClientHeight(60)} />}
    >
      {renderItem}
    </Virtualizer>
  );
}

function collectWarnings(warnSpy: { mock: { calls: unknown[][] } }) {
  return warnSpy.mock.calls.map((args) => String(args[0])).join('\n');
}

describe('<Virtualizer /> host contract', () => {
  const { render } = createRenderer();

  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect(
      this: HTMLElement,
    ) {
      return createDOMRect({ height: this.hasAttribute('data-row-index') ? 20 : 60, width: 200 });
    });
  });

  it("keeps a row's metadata from an item part of a list nested in the row", async () => {
    const seen: Array<VirtualizerItemMetadata | undefined> = [];

    function NestedItemPart() {
      seen.push(useVirtualizerItem());
      return null;
    }

    await render(
      <Host items={createItems(3)}>
        {renderVirtualizer((item) => (
          <TestListItem>
            {item.label}
            <VirtualizerHostProvider host={undefined} state={undefined}>
              <NestedItemPart />
            </VirtualizerHostProvider>
          </TestListItem>
        ))}
      </Host>,
    );

    expect(await screen.findByText('Item 1')).not.toBe(null);
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((metadata) => metadata === undefined)).toBe(true);
  });

  it('warns about an item part rendered outside the virtualizer', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await render(
        <Host items={createItems(3)}>
          <TestListItem>static</TestListItem>
          {renderVirtualizer((item) => (
            <TestListItem>{item.label}</TestListItem>
          ))}
        </Host>,
      );

      expect(collectWarnings(warnSpy)).toContain(
        'must not render static <TestList.Item> elements alongside',
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('warns about an item part rendered after the virtualizer mounted', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    function Test(props: { withStaticItem: boolean }) {
      return (
        <Host items={createItems(3)}>
          {renderVirtualizer((item) => (
            <TestListItem>{item.label}</TestListItem>
          ))}
          {props.withStaticItem && <TestListItem>static</TestListItem>}
        </Host>
      );
    }

    try {
      const { setProps } = await render(<Test withStaticItem={false} />);
      expect(collectWarnings(warnSpy)).not.toContain('must not render static');

      await setProps({ withStaticItem: true });

      expect(collectWarnings(warnSpy)).toContain(
        'must not render static <TestList.Item> elements alongside',
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('warns when an item renderer returns no item part', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await render(
        <Host items={createItems(3)}>
          {renderVirtualizer((item) => (
            <div>{item.label}</div>
          ))}
        </Host>,
      );

      expect(collectWarnings(warnSpy)).toContain('must render exactly one <TestList.Item>');
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('checks nothing for a host whose rows are plain elements', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await render(
        <Host items={createItems(3)} rendersItemPart={false}>
          <Virtualizer<TestItem>
            estimatedItemHeight={20}
            getItemKey={(item) => item.label}
            render={<div ref={setElementClientHeight(60)} />}
          >
            {(item, _index, itemProps) => <div {...itemProps}>{item.label}</div>}
          </Virtualizer>
        </Host>,
      );

      expect(await screen.findByText('Item 1')).toHaveAttribute('aria-posinset', '1');
      expect(collectWarnings(warnSpy)).not.toContain('must render exactly one');
    } finally {
      warnSpy.mockRestore();
    }
  });
});
