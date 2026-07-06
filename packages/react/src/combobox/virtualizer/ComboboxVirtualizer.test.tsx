import * as React from 'react';
import { expect, vi } from 'vitest';
import { Combobox } from '@base-ui/react/combobox';
import { screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Combobox.Virtualizer />', () => {
  const { render } = createRenderer();

  describeConformance(
    <Combobox.Virtualizer estimateSize={20}>
      {(item: string) => (
        <Combobox.Item key={item} value={item}>
          {item}
        </Combobox.Item>
      )}
    </Combobox.Virtualizer>,
    () => ({
      refInstanceof: window.HTMLDivElement,
      render(node) {
        return render(
          <Combobox.Root defaultOpen items={['one']}>
            <Combobox.List>{node}</Combobox.List>
          </Combobox.Root>,
        );
      },
    }),
  );

  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect(
      this: HTMLElement,
    ) {
      if (this.hasAttribute('data-index')) {
        return createDOMRect({ height: 20, width: 200 });
      }

      return createDOMRect({ height: 60, width: 200 });
    });
  });

  it('only renders the visible combobox items', async () => {
    await render(
      <Combobox.Root defaultOpen items={createItems(100)}>
        <Combobox.List>
          <Combobox.Virtualizer
            estimateSize={20}
            overscan={1}
            render={<div ref={setElementClientHeight(60)} data-testid="virtualizer" />}
          >
            {(item: string) => (
              <Combobox.Item key={item} value={item}>
                {item}
              </Combobox.Item>
            )}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(4));

    expect(screen.getByRole('option', { name: 'Item 1' })).not.toBe(null);
    expect(screen.getByRole('option', { name: 'Item 4' })).not.toBe(null);
    expect(screen.queryByRole('option', { name: 'Item 20' })).toBe(null);

    const virtualizer = screen.getByTestId('virtualizer');
    expect(virtualizer).toHaveStyle({ overflow: 'auto' });
    expect(virtualizer.style.getPropertyValue('--total-size')).toBe('2000px');
  });

  it('passes virtual metadata to combobox items', async () => {
    await render(
      <Combobox.Root defaultOpen items={createItems(10)}>
        <Combobox.List>
          <Combobox.Virtualizer
            estimateSize={20}
            paddingStart={4}
            overscan={0}
            render={<div ref={setElementClientHeight(40)} />}
          >
            {(item: string) => (
              <Combobox.Item key={item} value={item}>
                {item}
              </Combobox.Item>
            )}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    const firstItem = await screen.findByRole('option', { name: 'Item 1' });

    expect(firstItem).toHaveAttribute('aria-posinset', '1');
    expect(firstItem).toHaveAttribute('aria-setsize', '10');
    expect(firstItem).toHaveAttribute('data-index', '0');
    expect(firstItem).toHaveStyle({
      height: '20px',
      position: 'absolute',
      transform: 'translateY(4px)',
    });
  });

  it('selects the highlighted filtered item without explicit item indices', async () => {
    const { user } = await render(
      <Combobox.Root items={['one', 'two', 'three', 'four', 'five']}>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Virtualizer
                  estimateSize={20}
                  render={<div ref={setElementClientHeight(80)} />}
                >
                  {(item: string) => (
                    <Combobox.Item key={item} value={item}>
                      {item}
                    </Combobox.Item>
                  )}
                </Combobox.Virtualizer>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const input = screen.getByTestId('input');
    await user.click(input);
    await waitFor(() => expect(screen.getByRole('listbox')).not.toBe(null));

    await user.type(input, 'f');
    await waitFor(() => expect(screen.queryByRole('option', { name: 'one' })).toBe(null));
    expect(screen.getByRole('option', { name: 'four' })).not.toBe(null);

    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    await waitFor(() => expect(input).toHaveValue('four'));
    expect(screen.queryByRole('listbox')).toBe(null);
  });

  it('scrolls the highlighted item into view', async () => {
    let scrollTop = 0;
    const handleScrollTo = vi.fn((options: ScrollToOptions) => {
      scrollTop = options.top ?? scrollTop;
    });

    const { user } = await render(
      <Combobox.Root defaultOpen items={createItems(10)}>
        <Combobox.Input data-testid="input" />
        <Combobox.List>
          <Combobox.Virtualizer
            estimateSize={20}
            overscan={1}
            render={
              <div
                ref={setElementScrollState({
                  clientHeight: 40,
                  getScrollTop: () => scrollTop,
                  scrollTo: handleScrollTo,
                })}
              />
            }
          >
            {(item: string) => (
              <Combobox.Item key={item} value={item}>
                {item}
              </Combobox.Item>
            )}
          </Combobox.Virtualizer>
        </Combobox.List>
      </Combobox.Root>,
    );

    await user.click(screen.getByTestId('input'));
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');

    await waitFor(() => expect(handleScrollTo).toHaveBeenCalled());
    expect(scrollTop).toBe(20);
  });
});

function createItems(count: number) {
  return Array.from({ length: count }, (_, index) => `Item ${index + 1}`);
}

function setElementClientHeight(clientHeight: number) {
  return (element: HTMLDivElement | null) => {
    if (!element) {
      return;
    }

    Object.defineProperty(element, 'clientHeight', {
      configurable: true,
      value: clientHeight,
    });
  };
}

function setElementScrollState(options: {
  clientHeight: number;
  getScrollTop: () => number;
  scrollTo: (options: ScrollToOptions) => void;
}) {
  return (element: HTMLDivElement | null) => {
    if (!element) {
      return;
    }

    Object.defineProperty(element, 'clientHeight', {
      configurable: true,
      value: options.clientHeight,
    });
    Object.defineProperty(element, 'scrollTop', {
      configurable: true,
      get: options.getScrollTop,
    });
    Object.defineProperty(element, 'scrollTo', {
      configurable: true,
      value: options.scrollTo,
    });
  };
}

function createDOMRect(rect: Partial<DOMRectInit>) {
  return {
    x: rect.x ?? 0,
    y: rect.y ?? 0,
    width: rect.width ?? 0,
    height: rect.height ?? 0,
    top: rect.y ?? 0,
    left: rect.x ?? 0,
    right: (rect.x ?? 0) + (rect.width ?? 0),
    bottom: (rect.y ?? 0) + (rect.height ?? 0),
    toJSON() {
      return this;
    },
  } as DOMRect;
}
