import { expect } from 'vitest';
import * as React from 'react';
import { Select } from '@base-ui/react/select';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

const RTL_EXPERIMENT_OPTIONS = [
  { value: 'arabic', label: 'العربية الفصحى' },
  { value: 'levantine', label: 'العربية الشامية' },
  { value: 'maghrebi', label: 'العربية المغاربية' },
  { value: 'sudanese', label: 'العربية السودانية' },
  { value: 'gulf', label: 'العربية الخليجية' },
];

const RTL_EXPERIMENT_ARABIC_FONT_FAMILY =
  '"Noto Naskh Arabic", "Amiri", "Scheherazade New", Georgia, serif';

const RTL_EXPERIMENT_CSS = `
  .selectHeroExperiment_Page {
    min-height: 100vh;
    padding: 40px;
    background: var(--color-gray-50);
    color: var(--color-gray-900);
    font-family: ${RTL_EXPERIMENT_ARABIC_FONT_FAMILY};
  }

  .selectHeroExperiment_Container {
    max-width: 480px;
    margin-inline: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .selectHeroExperiment_Title {
    margin: 0;
    font-size: 28px;
    line-height: 1.2;
  }

  .selectHeroExperiment_Description {
    margin: 0;
    line-height: 1.6;
  }

  .selectHeroExperiment_Field {
    display: flex;
    flex-direction: column;
    align-items: start;
    gap: 0.25rem;
    margin-top: 12px;
  }

  .selectHeroExperiment_Label {
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 700;
    color: var(--color-gray-900);
    cursor: default;
  }

  .selectHeroExperiment_Value[data-placeholder] {
    opacity: 0.6;
  }

  .selectHeroExperiment_Select {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    height: 2.5rem;
    padding-left: 0.875rem;
    padding-right: 0.75rem;
    margin: 0;
    outline: 0;
    border: 1px solid var(--color-gray-200);
    border-radius: 0.375rem;
    background-color: canvas;
    font-family: ${RTL_EXPERIMENT_ARABIC_FONT_FAMILY};
    font-size: 1rem;
    line-height: 1.5rem;
    font-weight: 400;
    color: var(--color-gray-900);
    -webkit-user-select: none;
    user-select: none;
    min-width: 10rem;
    direction: rtl;
  }

  .selectHeroExperiment_Select[data-popup-open] {
    background-color: var(--color-gray-100);
  }

  .selectHeroExperiment_Positioner {
    outline: none;
    z-index: 1;
    -webkit-user-select: none;
    user-select: none;
    direction: rtl;
  }

  .selectHeroExperiment_Popup {
    box-sizing: border-box;
    border-radius: 0.375rem;
    background-color: canvas;
    background-clip: padding-box;
    color: var(--color-gray-900);
    min-width: var(--anchor-width);
    transform-origin: var(--transform-origin);
    transition:
      transform 150ms,
      opacity 150ms;
    font-family: ${RTL_EXPERIMENT_ARABIC_FONT_FAMILY};
    direction: rtl;
  }

  .selectHeroExperiment_Popup[data-starting-style],
  .selectHeroExperiment_Popup[data-ending-style] {
    opacity: 0;
    transform: scale(0.9);
  }

  .selectHeroExperiment_Popup[data-side='none'] {
    transition: none;
    transform: none;
    opacity: 1;
    min-width: calc(var(--anchor-width) + 1rem);
  }

  @media (prefers-color-scheme: light) {
    .selectHeroExperiment_Popup {
      outline: 1px solid var(--color-gray-200);
      box-shadow:
        0 10px 15px -3px var(--color-gray-200),
        0 4px 6px -4px var(--color-gray-200);
    }
  }

  .selectHeroExperiment_List {
    box-sizing: border-box;
    position: relative;
    padding-block: 0.25rem;
    overflow-y: auto;
    max-height: var(--available-height);
    scroll-padding-block: 1.5rem;
  }

  .selectHeroExperiment_Item {
    box-sizing: border-box;
    outline: 0;
    font-size: 0.875rem;
    line-height: 1rem;
    padding-block: 0.5rem;
    padding-left: 1rem;
    padding-right: 0.625rem;
    display: grid;
    gap: 0.5rem;
    align-items: center;
    grid-template-columns: 0.75rem 1fr;
    cursor: default;
    -webkit-user-select: none;
    user-select: none;
    direction: rtl;
  }

  [data-side='none'] .selectHeroExperiment_Item {
    font-size: 1rem;
    padding-left: 3rem;
    padding-right: 0.625rem;
  }

  .selectHeroExperiment_Item[data-highlighted] {
    z-index: 0;
    position: relative;
    color: var(--color-gray-50);
  }

  .selectHeroExperiment_Item[data-highlighted]::before {
    content: '';
    z-index: -1;
    position: absolute;
    inset-block: 0;
    inset-inline: 0.25rem;
    border-radius: 0.25rem;
    background-color: var(--color-gray-900);
  }

  .selectHeroExperiment_ItemIndicator {
    grid-column-start: 1;
  }

  .selectHeroExperiment_ItemIndicatorIcon {
    display: block;
    width: 0.75rem;
    height: 0.75rem;
  }

  .selectHeroExperiment_ItemText {
    grid-column-start: 2;
  }
`;

describe('<Select.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.Popup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Select.Root open>
          <Select.Portal>
            <Select.Positioner>{node}</Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );
    },
  }));

  it('has aria attributes when no Select.List is present', async () => {
    const { user } = await render(
      <Select.Root multiple>
        <Select.Trigger>Trigger</Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup data-testid="popup">Popup</Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    const trigger = screen.getByRole('combobox');

    expect(trigger).not.toHaveAttribute('aria-controls');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);

    const popup = await screen.findByTestId('popup');
    const listbox = await screen.findByRole('listbox');

    expect(popup).toBe(listbox);
    expect(popup.id).not.toBe('');
    expect(popup).toHaveAttribute('aria-multiselectable', 'true');
    expect(trigger).toHaveAttribute('aria-controls', popup.id);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
  });

  it('places aria attributes on Select.List instead if it is present', async () => {
    const { user } = await render(
      <Select.Root multiple>
        <Select.Trigger>Trigger</Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup data-testid="popup">
              <Select.List data-testid="list">
                <Select.Item value="1">Item 1</Select.Item>
                <Select.Item value="2">Item 2</Select.Item>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    const trigger = screen.getByRole('combobox');

    expect(trigger).not.toHaveAttribute('aria-controls');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');

    await user.click(trigger);

    const popup = await screen.findByTestId('popup');
    const list = await screen.findByTestId('list');
    const listbox = await screen.findByRole('listbox');

    expect(list).toBe(listbox);
    expect(list).toHaveAttribute('aria-multiselectable');
    expect(popup).toHaveAttribute('role', 'presentation');
    expect(popup).not.toHaveAttribute('aria-multiselectable');
    expect(list.id).not.toBe('');
    expect(trigger).toHaveAttribute('aria-controls', list.id);
    expect(trigger).not.toHaveAttribute('aria-controls', popup.id);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
  });

  it('restores transform-related inline styles after measurement', async () => {
    let popupElement: HTMLElement | null = null;

    await render(
      <Select.Root open>
        <Select.Trigger>Trigger</Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup
              ref={(node) => {
                if (node) {
                  node.style.setProperty('transform', 'translateX(10px)');
                  node.style.setProperty('scale', '0.8');
                  node.style.setProperty('translate', '1px 2px');
                }
                popupElement = node;
              }}
            >
              <Select.Item value="1">
                <Select.ItemText>Item 1</Select.ItemText>
              </Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    await new Promise<void>(queueMicrotask);

    expect(popupElement).not.toBe(null);
    expect(popupElement!.style.getPropertyValue('transform')).toBe('translateX(10px)');
    expect(popupElement!.style.getPropertyValue('scale')).toBe('0.8');
    expect(popupElement!.style.getPropertyValue('translate')).toBe('1px 2px');
  });

  it.skipIf(isJSDOM)('keeps alignItemWithTrigger active at browser zoom', async () => {
    const docEl = document.documentElement;
    const previousZoom = docEl.style.zoom;

    try {
      docEl.style.zoom = '0.9';

      await render(
        <div style={{ paddingTop: 100, paddingLeft: 10 }}>
          <Select.Root open defaultValue="css-modules">
            <Select.Trigger data-testid="trigger" style={{ width: 108, height: 30 }}>
              <Select.Value />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner data-testid="positioner">
                <Select.Popup data-testid="popup" style={{ maxHeight: 'none' }}>
                  <Select.Item value="css-modules">
                    <Select.ItemText>CSS Modules</Select.ItemText>
                  </Select.Item>
                  <Select.Item value="tailwind-v4">
                    <Select.ItemText>Tailwind v4</Select.ItemText>
                  </Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </div>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('positioner')).toHaveAttribute('data-side', 'none');
      });
    } finally {
      docEl.style.zoom = previousZoom;
    }
  });

  it.skipIf(isJSDOM)('aligns the selected item with the trigger inline start in ltr', async () => {
    await render(
      <div
        dir="ltr"
        style={{
          marginLeft: 100,
          minHeight: 600,
          paddingTop: 96,
        }}
      >
        <DirectionProvider direction="ltr">
          <Select.Root open defaultValue="with-longer-label">
            <Select.Trigger
              style={{
                width: 160,
                display: 'flex',
                justifyContent: 'flex-start',
                paddingInlineStart: 12,
                paddingInlineEnd: 28,
              }}
            >
              <Select.Value data-testid="value">With longer label</Select.Value>
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner data-testid="positioner">
                <Select.Popup style={{ width: 180, maxHeight: 'none' }}>
                  <Select.Item value="with-longer-label">
                    <Select.ItemText
                      data-testid="item-text"
                      style={{
                        paddingInlineStart: 24,
                        paddingInlineEnd: 8,
                      }}
                    >
                      With longer label
                    </Select.ItemText>
                  </Select.Item>
                  <Select.Item value="other">
                    <Select.ItemText>Other option</Select.ItemText>
                  </Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </DirectionProvider>
      </div>,
    );

    const positioner = screen.getByTestId('positioner');
    const value = screen.getByTestId('value');
    const itemText = screen.getByTestId('item-text');

    await waitFor(() => {
      expect(positioner).toHaveAttribute('data-side', 'none');
      expect(
        Math.abs(value.getBoundingClientRect().left - itemText.getBoundingClientRect().left),
      ).toBeLessThan(1);
    });
  });

  it.skipIf(isJSDOM)('aligns the selected item with the trigger inline end in rtl', async () => {
    await render(
      <div
        dir="rtl"
        style={{
          marginLeft: 100,
          minHeight: 600,
          paddingTop: 96,
        }}
      >
        <DirectionProvider direction="rtl">
          <Select.Root open defaultValue="with-longer-label">
            <Select.Trigger
              style={{
                width: 160,
                display: 'flex',
                justifyContent: 'flex-end',
                paddingInlineStart: 28,
                paddingInlineEnd: 12,
              }}
            >
              <Select.Value data-testid="value">With longer label</Select.Value>
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner data-testid="positioner">
                <Select.Popup style={{ width: 180, maxHeight: 'none' }}>
                  <Select.Item value="with-longer-label">
                    <Select.ItemText
                      data-testid="item-text"
                      style={{
                        paddingInlineStart: 8,
                        paddingInlineEnd: 24,
                      }}
                    >
                      With longer label
                    </Select.ItemText>
                  </Select.Item>
                  <Select.Item value="other">
                    <Select.ItemText>Other option</Select.ItemText>
                  </Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </DirectionProvider>
      </div>,
    );

    const positioner = screen.getByTestId('positioner');
    const value = screen.getByTestId('value');
    const itemText = screen.getByTestId('item-text');

    await waitFor(() => {
      expect(positioner).toHaveAttribute('data-side', 'none');
      expect(
        Math.abs(value.getBoundingClientRect().right - itemText.getBoundingClientRect().right),
      ).toBeLessThan(1);
    });

    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    });
  });

  it.skipIf(isJSDOM)(
    'aligns the selected item with the trigger inline end on first open in the docs-style rtl layout',
    async () => {
      const { user } = await render(<RtlHeroExperimentSelect defaultValue="maghrebi" />);

      try {
        await user.click(screen.getByRole('combobox'));

        const positioner = await screen.findByTestId('positioner');
        const value = screen.getByTestId('value');
        const itemText = screen.getByTestId('item-text');

        await waitFor(() => {
          expect(positioner).toHaveAttribute('data-side', 'none');
          expect(
            Math.abs(value.getBoundingClientRect().right - itemText.getBoundingClientRect().right),
          ).toBeLessThan(1);
        });
      } finally {
        await act(async () => {
          await new Promise((resolve) => {
            setTimeout(resolve, 0);
          });
        });
      }
    },
  );

  it.skipIf(isJSDOM)('seeds anchor width from the custom anchor on first open', async () => {
    function AnchoredRtlHeroExperimentSelect() {
      const anchorRef = React.useRef<HTMLDivElement | null>(null);

      return (
        <RtlHeroExperimentSelect
          defaultValue="maghrebi"
          anchorRef={anchorRef}
          anchorStyle={{ width: 240 }}
        />
      );
    }

    const { user } = await render(<AnchoredRtlHeroExperimentSelect />);

    try {
      await user.click(screen.getByRole('combobox'));

      const positioner = await screen.findByTestId('positioner');

      await waitFor(() => {
        expect(positioner).toHaveAttribute('data-side', 'none');
        expect(positioner.style.getPropertyValue('--anchor-width')).toBe('240px');
      });
    } finally {
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      });
    }
  });

  it.skipIf(isJSDOM)(
    'keeps scrolling the aligned list at browser zoom after the popup fills the available height',
    async () => {
      const docEl = document.documentElement;
      const previousZoom = docEl.style.zoom;
      const createRect = (left: number, top: number, width: number, height: number) => ({
        x: left,
        y: top,
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
        toJSON: () => ({}),
      });

      try {
        docEl.style.zoom = '0.9';

        await render(
          <div style={{ paddingTop: 100, paddingLeft: 10 }}>
            <Select.Root open defaultValue="item-1">
              <Select.Trigger data-testid="trigger" style={{ width: 108, height: 30 }}>
                <Select.Value />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner data-testid="positioner">
                  <Select.Popup data-testid="popup" style={{ maxHeight: '225.538px' }}>
                    <Select.List data-testid="list">
                      <Select.Item value="item-1">Item 1</Select.Item>
                      <Select.Item value="item-2">Item 2</Select.Item>
                    </Select.List>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </div>,
        );

        const positioner = screen.getByTestId('positioner');
        const list = screen.getByTestId('list');

        await waitFor(() => {
          expect(positioner).toHaveAttribute('data-side', 'none');
        });

        let scrollTop = 0;

        Object.defineProperty(positioner, 'getBoundingClientRect', {
          value: () => createRect(10, 0, 108, 202.984375),
          configurable: true,
        });
        Object.defineProperty(list, 'scrollTop', {
          configurable: true,
          get: () => scrollTop,
          set: (value: number) => {
            scrollTop = value;
          },
        });
        Object.defineProperty(list, 'scrollHeight', {
          value: 598,
          configurable: true,
        });
        Object.defineProperty(list, 'clientHeight', {
          value: 226,
          configurable: true,
        });

        positioner.style.height = '225.538px';
        positioner.style.bottom = '0px';

        list.scrollTop = 14;
        fireEvent.scroll(list);

        await waitFor(() => {
          expect(scrollTop).toBe(14);
          expect(positioner.style.height).toBe('226px');
        });
      } finally {
        docEl.style.zoom = previousZoom;
      }
    },
  );

  it.skipIf(isJSDOM)(
    'treats short popups as top-positioned when maxScrollTop is off by 1px',
    async () => {
      const docEl = document.documentElement;
      const clientHeightDescriptor = Object.getOwnPropertyDescriptor(docEl, 'clientHeight');
      const clientWidthDescriptor = Object.getOwnPropertyDescriptor(docEl, 'clientWidth');

      const restoreDescriptor = (
        target: object,
        property: 'clientHeight' | 'clientWidth',
        descriptor: PropertyDescriptor | undefined,
      ) => {
        if (descriptor) {
          Object.defineProperty(target, property, descriptor);
        } else {
          delete (target as Record<string, unknown>)[property];
        }
      };

      const createRect = (left: number, top: number, width: number, height: number) => ({
        x: left,
        y: top,
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
        toJSON: () => ({}),
      });

      try {
        Object.defineProperty(docEl, 'clientHeight', { value: 646, configurable: true });
        Object.defineProperty(docEl, 'clientWidth', { value: 300, configurable: true });

        await render(
          <Select.Root open defaultValue="1">
            <Select.Trigger
              data-testid="trigger"
              ref={(node) => {
                if (!node) {
                  return;
                }

                Object.defineProperty(node, 'offsetWidth', { value: 80, configurable: true });
                Object.defineProperty(node, 'offsetHeight', { value: 30, configurable: true });
                Object.defineProperty(node, 'getBoundingClientRect', {
                  value: () => createRect(10, 170.3793487548828, 80, 30),
                  configurable: true,
                });
              }}
            >
              Trigger
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner
                data-testid="positioner"
                ref={(node) => {
                  if (!node) {
                    return;
                  }

                  Object.defineProperty(node, 'getBoundingClientRect', {
                    value: () => createRect(10, 0, 108, 63.96739196777344),
                    configurable: true,
                  });
                }}
              >
                <Select.Popup
                  data-testid="popup"
                  ref={(node) => {
                    if (!node) {
                      return;
                    }

                    Object.defineProperty(node, 'scrollHeight', {
                      value: 64,
                      configurable: true,
                    });
                    Object.defineProperty(node, 'clientHeight', {
                      value: 63,
                      configurable: true,
                    });
                  }}
                >
                  <Select.Item value="1">Item 1</Select.Item>
                  <Select.Item value="2">Item 2</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>,
        );

        const positioner = screen.getByTestId('positioner');

        await waitFor(() => {
          expect(positioner).toHaveAttribute('data-side', 'none');
          expect(positioner.style.top).not.toBe('');
          expect(positioner.style.bottom).toBe('');
        });
      } finally {
        restoreDescriptor(docEl, 'clientHeight', clientHeightDescriptor);
        restoreDescriptor(docEl, 'clientWidth', clientWidthDescriptor);
      }
    },
  );

  it.skipIf(isJSDOM)(
    'keeps alignItemWithTrigger active when the aligned height is fractionally below minHeight',
    async () => {
      const docEl = document.documentElement;
      const clientHeightDescriptor = Object.getOwnPropertyDescriptor(docEl, 'clientHeight');
      const clientWidthDescriptor = Object.getOwnPropertyDescriptor(docEl, 'clientWidth');

      const restoreDescriptor = (
        target: object,
        property: 'clientHeight' | 'clientWidth',
        descriptor: PropertyDescriptor | undefined,
      ) => {
        if (descriptor) {
          Object.defineProperty(target, property, descriptor);
        } else {
          delete (target as Record<string, unknown>)[property];
        }
      };

      const createRect = (left: number, top: number, width: number, height: number) => ({
        x: left,
        y: top,
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
        toJSON: () => ({}),
      });

      try {
        Object.defineProperty(docEl, 'clientHeight', { value: 646, configurable: true });
        Object.defineProperty(docEl, 'clientWidth', { value: 300, configurable: true });

        await render(
          <Select.Root open defaultValue="1">
            <Select.Trigger
              data-testid="trigger"
              ref={(node) => {
                if (!node) {
                  return;
                }

                Object.defineProperty(node, 'offsetWidth', { value: 80, configurable: true });
                Object.defineProperty(node, 'offsetHeight', { value: 30, configurable: true });
                Object.defineProperty(node, 'getBoundingClientRect', {
                  value: () => createRect(10, 170.3793487548828, 80, 30),
                  configurable: true,
                });
              }}
            >
              Trigger
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner
                data-testid="positioner"
                ref={(node) => {
                  if (!node) {
                    return;
                  }

                  Object.defineProperty(node, 'getBoundingClientRect', {
                    value: () => createRect(10, 0, 108, 63.96739196777344),
                    configurable: true,
                  });
                }}
              >
                <Select.Popup
                  data-testid="popup"
                  style={{ minHeight: 65 }}
                  ref={(node) => {
                    if (!node) {
                      return;
                    }

                    Object.defineProperty(node, 'scrollHeight', {
                      value: 64,
                      configurable: true,
                    });
                    Object.defineProperty(node, 'clientHeight', {
                      value: 63,
                      configurable: true,
                    });
                  }}
                >
                  <Select.Item value="1">Item 1</Select.Item>
                  <Select.Item value="2">Item 2</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('positioner')).toHaveAttribute('data-side', 'none');
        });
      } finally {
        restoreDescriptor(docEl, 'clientHeight', clientHeightDescriptor);
        restoreDescriptor(docEl, 'clientWidth', clientWidthDescriptor);
      }
    },
  );

  describe('prop: finalFocus', () => {
    it('should focus the trigger by default when closed', async () => {
      await render(
        <div>
          <input />
          <Select.Root>
            <Select.Trigger data-testid="trigger">Open</Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Item value="1">Item 1</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
          <input />
        </div>,
      );

      const trigger = screen.getByTestId('trigger');
      await act(async () => {
        trigger.click();
      });

      const item = screen.getByText('Item 1');
      await act(async () => {
        item.click();
      });

      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });

    it('should focus the element provided to the prop when closed', async () => {
      function TestComponent() {
        const inputRef = React.useRef<HTMLInputElement | null>(null);
        return (
          <div>
            <input />
            <Select.Root>
              <Select.Trigger data-testid="trigger">Open</Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup finalFocus={inputRef}>
                    <Select.Item value="1">Item 1</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
            <input />
            <input data-testid="input-to-focus" ref={inputRef} />
            <input />
          </div>
        );
      }

      await render(<TestComponent />);

      const trigger = screen.getByTestId('trigger');
      await act(async () => {
        trigger.click();
      });

      const item = screen.getByText('Item 1');
      await act(async () => {
        item.click();
      });

      const inputToFocus = screen.getByTestId('input-to-focus');

      await waitFor(() => {
        expect(inputToFocus).toHaveFocus();
      });
    });

    it('should focus the element provided to `finalFocus` as a function when closed', async () => {
      function TestComponent() {
        const ref = React.useRef<HTMLInputElement>(null);
        const getRef = React.useCallback(() => ref.current, []);
        return (
          <div>
            <Select.Root>
              <Select.Trigger data-testid="trigger">Open</Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup finalFocus={getRef}>
                    <Select.Item value="1">Item 1</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
            <input data-testid="input-to-focus" ref={ref} />
          </div>
        );
      }

      await render(<TestComponent />);

      const trigger = screen.getByTestId('trigger');
      await act(async () => {
        trigger.click();
      });

      const item = screen.getByText('Item 1');
      await act(async () => {
        item.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('input-to-focus')).toHaveFocus();
      });
    });

    it('should not move focus when finalFocus is false', async () => {
      function TestComponent() {
        return (
          <div>
            <Select.Root>
              <Select.Trigger data-testid="trigger">Open</Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup finalFocus={false}>
                    <Select.Item value="1">Item 1</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </div>
        );
      }

      await render(<TestComponent />);
      const trigger = screen.getByTestId('trigger');

      await act(async () => {
        trigger.click();
      });

      const item = screen.getByText('Item 1');
      await act(async () => {
        item.click();
      });

      await waitFor(() => {
        expect(trigger).not.toHaveFocus();
      });
    });

    it('should move focus to trigger when finalFocus returns true', async () => {
      function TestComponent() {
        return (
          <div>
            <Select.Root>
              <Select.Trigger data-testid="trigger">Open</Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup finalFocus={() => true}>
                    <Select.Item value="1">Item 1</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </div>
        );
      }

      await render(<TestComponent />);
      const trigger = screen.getByTestId('trigger');

      await act(async () => {
        trigger.click();
      });

      const item = screen.getByText('Item 1');
      await act(async () => {
        item.click();
      });

      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });

    it('uses default behavior when finalFocus returns null', async () => {
      function TestComponent() {
        return (
          <div>
            <Select.Root>
              <Select.Trigger data-testid="trigger">Open</Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup finalFocus={() => null}>
                    <Select.Item value="1">Item 1</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </div>
        );
      }

      await render(<TestComponent />);
      const trigger = screen.getByTestId('trigger');

      await act(async () => {
        trigger.click();
      });

      const item = screen.getByText('Item 1');
      await act(async () => {
        item.click();
      });

      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });
  });
});

function RtlHeroExperimentSelect({
  defaultValue,
  anchorRef,
  anchorStyle,
}: {
  defaultValue: string;
  anchorRef?: React.RefObject<HTMLDivElement | null>;
  anchorStyle?: React.CSSProperties;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div dir="rtl" className="selectHeroExperiment_Page">
      <style>{RTL_EXPERIMENT_CSS}</style>
      <DirectionProvider direction="rtl">
        <div className="selectHeroExperiment_Container">
          <h1 className="selectHeroExperiment_Title">RTL Select alignment</h1>
          <p className="selectHeroExperiment_Description">
            تجربة بسيطة لاختبار محاذاة <code>Select</code> في الاتجاه من اليمين إلى اليسار.
          </p>

          <div className="selectHeroExperiment_Field" ref={anchorRef} style={anchorStyle}>
            <Select.Root defaultValue={defaultValue} open={open} onOpenChange={setOpen}>
              <Select.Label className="selectHeroExperiment_Label">اللهجة</Select.Label>
              <Select.Trigger className="selectHeroExperiment_Select">
                <Select.Value className="selectHeroExperiment_Value" data-testid="value">
                  {(value) =>
                    RTL_EXPERIMENT_OPTIONS.find((option) => option.value === value)?.label ??
                    'اختر لهجة'
                  }
                </Select.Value>
                <Select.Icon className="selectHeroExperiment_SelectIcon">
                  <ChevronUpDownIcon />
                </Select.Icon>
              </Select.Trigger>

              <Select.Portal>
                <Select.Positioner
                  anchor={anchorRef}
                  className="selectHeroExperiment_Positioner"
                  data-testid="positioner"
                  dir="rtl"
                  sideOffset={8}
                >
                  <Select.Popup className="selectHeroExperiment_Popup" dir="rtl">
                    <Select.List className="selectHeroExperiment_List">
                      {RTL_EXPERIMENT_OPTIONS.map(({ label, value }) => (
                        <Select.Item
                          key={value}
                          value={value}
                          className="selectHeroExperiment_Item"
                        >
                          <Select.ItemIndicator className="selectHeroExperiment_ItemIndicator">
                            <CheckIcon className="selectHeroExperiment_ItemIndicatorIcon" />
                          </Select.ItemIndicator>
                          <Select.ItemText
                            className="selectHeroExperiment_ItemText"
                            data-testid={value === defaultValue ? 'item-text' : undefined}
                          >
                            {label}
                          </Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.List>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </div>
        </div>
      </DirectionProvider>
    </div>
  );
}

function ChevronUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.5"
      {...props}
    >
      <path d="M0.5 4.5L4 1.5L7.5 4.5" />
      <path d="M0.5 7.5L4 10.5L7.5 7.5" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}
