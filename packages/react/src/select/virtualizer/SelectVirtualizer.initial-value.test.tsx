import * as React from 'react';
import { expect, vi } from 'vitest';
import { Select } from '@base-ui/react/select';
import { screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, createDOMRect, setElementClientHeight } from '#test-utils';

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
