import * as React from 'react';
import { expect, vi } from 'vitest';
import { Select } from '@base-ui/react/select';
import { screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';

describe('<Select.Virtualizer /> initial value', () => {
  const { render } = createRenderer();

  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect(
      this: HTMLElement,
    ) {
      const height = this.hasAttribute('data-index') ? 20 : 60;
      return createDOMRect({ height, width: 200 });
    });
  });

  it('mounts and focuses an initially selected offscreen item', async () => {
    const items = Array.from({ length: 100 }, (_, index) => {
      const label = `Item ${index + 1}`;
      return { value: label, label };
    });

    await render(
      <Select.Root defaultOpen defaultValue="Item 90" items={items}>
        <Select.Positioner alignItemWithTrigger={false}>
          <Select.Popup>
            <Select.List>
              <Select.Virtualizer<string>
                estimatedItemHeight={20}
                overscanPx={0}
                render={<div ref={setElementClientHeight(60)} />}
              >
                {(item) => (
                  <Select.Item value={item.value} style={{ height: 20 }}>
                    {item.label}
                  </Select.Item>
                )}
              </Select.Virtualizer>
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>,
    );

    const selectedItem = await screen.findByRole('option', { name: 'Item 90' });
    await waitFor(() => expect(selectedItem).toHaveFocus());
    expect(screen.getAllByRole('option').length).toBeLessThan(20);
  });
});

function setElementClientHeight(clientHeight: number) {
  return (element: HTMLDivElement | null) => {
    if (!element) {
      return;
    }

    element.style.height = `${clientHeight}px`;
    Object.defineProperty(element, 'clientHeight', {
      configurable: true,
      value: clientHeight,
    });
    Object.defineProperty(element, 'scrollTo', {
      configurable: true,
      value: (options: ScrollToOptions) => {
        element.scrollTop = options.top ?? element.scrollTop;
      },
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
