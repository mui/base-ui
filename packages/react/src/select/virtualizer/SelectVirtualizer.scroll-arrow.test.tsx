import { expect, vi } from 'vitest';
import { Select } from '@base-ui/react/select';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';

describe('<Select.Virtualizer /> scroll arrows', () => {
  const { render } = createRenderer();

  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect(
      this: HTMLElement,
    ) {
      return createDOMRect({ height: this.hasAttribute('data-index') ? 20 : 60, width: 200 });
    });
  });

  it('uses the virtualizer as the scroll arrow scrollport', async () => {
    let scrollTop = 100;

    vi.useFakeTimers();
    try {
      const items = Array.from({ length: 100 }, (_, index) => ({
        label: `Item ${index + 1}`,
        value: `item-${index + 1}`,
      }));

      await render(
        <Select.Root defaultOpen items={items}>
          <Select.Positioner alignItemWithTrigger={false}>
            <Select.Popup>
              <Select.List>
                <Select.ScrollUpArrow keepMounted />
                <Select.Virtualizer<string>
                  estimatedItemHeight={20}
                  render={
                    <div
                      ref={(element) => {
                        if (!element) {
                          return;
                        }

                        Object.defineProperties(element, {
                          clientHeight: { configurable: true, value: 60 },
                          scrollHeight: { configurable: true, value: 2000 },
                          scrollTop: {
                            configurable: true,
                            get: () => scrollTop,
                            set: (value: number) => {
                              scrollTop = value;
                            },
                          },
                        });
                      }}
                    />
                  }
                >
                  {(item) => (
                    <Select.Item value={item.value} style={{ height: 20 }}>
                      {item.label}
                    </Select.Item>
                  )}
                </Select.Virtualizer>
                <Select.ScrollDownArrow keepMounted />
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Root>,
      );

      const arrow = screen.getByText('▼');
      fireEvent.mouseMove(arrow, { movementX: 0, movementY: 1 });

      act(() => {
        vi.advanceTimersByTime(40);
      });

      expect(scrollTop).toBe(120);
      fireEvent.mouseLeave(arrow);
    } finally {
      vi.useRealTimers();
    }
  });
});

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
