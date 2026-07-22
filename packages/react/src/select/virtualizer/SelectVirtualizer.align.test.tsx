import * as React from 'react';
import { expect } from 'vitest';
import { Select } from '@base-ui/react/select';
import { screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM } from '#test-utils';

describe.skipIf(isJSDOM)('<Select.Virtualizer /> aligned positioning', () => {
  const { render } = createRenderer();

  it('aligns an initially selected offscreen item with the trigger', async () => {
    const items = Array.from({ length: 100 }, (_, index) => {
      const label = `Item ${index + 1}`;
      return { value: label, label };
    });

    await render(
      <div style={{ marginLeft: 100, minHeight: 600, paddingTop: 160 }}>
        <Select.Root defaultOpen defaultValue="Item 90" items={items}>
          <Select.Trigger
            style={{
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: 160,
              height: 40,
              paddingInlineStart: 14,
            }}
          >
            <Select.Value data-testid="value" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner data-testid="positioner">
              <Select.Popup style={{ width: 220, maxHeight: 'none' }}>
                <Select.List style={{ paddingBlock: 4 }}>
                  <Select.Virtualizer<string>
                    data-testid="virtualizer"
                    estimatedItemHeight={32}
                    overscanPx={0}
                    style={{ height: 160 }}
                  >
                    {(item, index) => (
                      <Select.Item
                        value={item.value}
                        style={{
                          boxSizing: 'border-box',
                          display: 'grid',
                          alignItems: 'center',
                          gridTemplateColumns: '16px 1fr',
                          columnGap: 8,
                          height: 32,
                          paddingInline: '6px 12px',
                        }}
                      >
                        <Select.ItemIndicator>✓</Select.ItemIndicator>
                        <Select.ItemText
                          data-testid={index === 89 ? 'selected-item-text' : undefined}
                        >
                          {item.label}
                        </Select.ItemText>
                      </Select.Item>
                    )}
                  </Select.Virtualizer>
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </div>,
    );

    const positioner = screen.getByTestId('positioner');
    const value = screen.getByTestId('value');
    const selectedItemText = await screen.findByTestId('selected-item-text');
    const virtualizer = screen.getByTestId('virtualizer');

    await waitFor(() => {
      expect(positioner).toHaveAttribute('data-side', 'none');
    });
    await waitFor(() => {
      expect(
        Math.abs(
          value.getBoundingClientRect().left - selectedItemText.getBoundingClientRect().left,
        ),
      ).toBeLessThan(1);
    });
    await waitFor(() => {
      const valueRect = value.getBoundingClientRect();
      const itemRect = selectedItemText.getBoundingClientRect();
      const valueCenterY = valueRect.top + valueRect.height / 2;
      const itemCenterY = itemRect.top + itemRect.height / 2;

      expect(Math.abs(valueCenterY - itemCenterY)).toBeLessThan(1);
    });

    expect(virtualizer.scrollTop).toBeGreaterThan(0);
    expect(screen.getAllByRole('option').length).toBeLessThan(20);
  });
});
