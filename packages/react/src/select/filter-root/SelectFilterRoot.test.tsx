import * as React from 'react';
import { expect, vi, describe, beforeEach, it, onTestFinished } from 'vitest';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { Select } from '@base-ui/react/select';
import { Field } from '@base-ui/react/field';
import {
  createRenderer,
  filterablePopupConformanceTests,
  isJSDOM,
  resetBrowserPointer,
} from '#test-utils';

const countries = [
  { value: 'au', label: 'Australia' },
  { value: 'fr', label: 'France' },
  { value: 'de', label: 'Germany' },
  { value: 'jp', label: 'Japan' },
];

function Test(
  props: {
    root?: Partial<Select.Root.Props<string, boolean>>;
    provider?: Partial<Select.FilterProvider.Props>;
    positioner?: Partial<Select.Positioner.Props>;
  } = {},
) {
  return (
    <Select.FilterProvider {...props.provider}>
      <Select.Root items={countries} {...props.root}>
        <Select.Label>Country</Select.Label>
        <Select.Trigger data-testid="trigger">
          <Select.Value data-testid="value" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner {...props.positioner}>
            <Select.Popup data-testid="popup">
              <Select.Input aria-label="Filter countries" />
              <Select.Clear aria-label="Clear filter" />
              <Select.Empty>No matches</Select.Empty>
              <Select.List data-testid="list">
                {countries.map((country) => (
                  <Select.Item key={country.value} value={country.value}>
                    <Select.ItemText>{country.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </Select.FilterProvider>
  );
}

describe('<Select.FilterProvider><Select.Root/></Select.FilterProvider>', () => {
  beforeEach(resetBrowserPointer);
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  filterablePopupConformanceTests({
    render,
    itemRole: 'option',
    createComponent: (props) => (
      <Select.FilterProvider>
        <Select.Root {...props.rootProps}>
          <Select.Label>Letter</Select.Label>
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup {...props.popupProps}>
                <Select.Input aria-label="Filter" onFocus={props.onInputFocus} />
                <Select.List {...props.listProps}>
                  <Select.Item value="alpha">Alpha</Select.Item>
                  <Select.Item value="beta">Beta</Select.Item>
                  <Select.Item value="gamma">Gamma</Select.Item>
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </Select.FilterProvider>
    ),
  });

  describe('semantics', () => {
    it('renders a dialog with a searchbox and a listbox, and no combobox', async () => {
      await render(<Test root={{ defaultOpen: true }} />);

      const trigger = screen.getByTestId('trigger');
      const popup = screen.getByTestId('popup');
      const input = screen.getByRole('searchbox', { name: 'Filter countries' });
      const list = screen.getByRole('listbox', { name: 'Country' });

      expect(trigger.tagName).toBe('BUTTON');
      expect(trigger).not.toHaveAttribute('role');
      expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(trigger).toHaveAttribute('aria-controls', popup.id);
      expect(popup).toHaveAttribute('role', 'dialog');
      expect(popup).toHaveAttribute('aria-labelledby', screen.getByText('Country').id);
      expect(popup).not.toHaveAttribute('aria-activedescendant');
      expect(input).toHaveAttribute('aria-controls', list.id);
      expect(screen.queryByRole('combobox')).toBe(null);
      expect(screen.getAllByRole('option')).toHaveLength(4);
      screen.getAllByRole('option').forEach((option) => {
        expect(option).toHaveAttribute('tabindex', '-1');
        expect(option.id).not.toBe('');
      });
    });

    it('moves required to the listbox, which can carry it', async () => {
      await render(<Test root={{ defaultOpen: true, required: true }} />);
      expect(screen.getByTestId('trigger')).not.toHaveAttribute('aria-required');
      expect(screen.getByRole('listbox')).toHaveAttribute('aria-required', 'true');
    });

    it('marks the list multiselectable in multiple mode', async () => {
      await render(<Test root={{ defaultOpen: true, multiple: true }} />);
      expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
      expect(screen.getByTestId('popup')).not.toHaveAttribute('aria-multiselectable');
    });

    it('turns off alignItemWithTrigger', async () => {
      await render(<Test root={{ defaultOpen: true, defaultValue: 'fr' }} />);
      await waitFor(() => {
        expect(screen.getByTestId('popup')).not.toHaveAttribute('data-side', 'none');
      });
    });

    it('does not mount the popup when the trigger is focused', async () => {
      const { user } = await render(<Test />);
      const trigger = screen.getByTestId('trigger');
      await act(async () => trigger.focus());
      // The plain select force-mounts its portal after a focus tick for closed-trigger typeahead.
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
      });
      expect(screen.queryByRole('dialog', { hidden: true })).toBe(null);
      expect(screen.queryByTestId('popup')).toBe(null);

      await user.keyboard('[ArrowDown]');
      expect(await screen.findByRole('searchbox', { name: 'Filter countries' })).not.toBe(null);
    });

    it('leaves a plain select untouched', async () => {
      await render(
        <Select.Root defaultOpen>
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.List>
                  <Select.Item value="a">a</Select.Item>
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      expect(screen.getByTestId('trigger')).toHaveAttribute('role', 'combobox');
      expect(screen.getByRole('listbox')).not.toBe(null);
      expect(screen.queryByRole('dialog')).toBe(null);
    });
  });

  describe('filtering', () => {
    it('filters the options and shows the empty state', async () => {
      const { user } = await render(<Test root={{ defaultOpen: true }} />);
      const input = screen.getByRole('searchbox', { name: 'Filter countries' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await user.keyboard('an');
      expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
        'France',
        'Germany',
        'Japan',
      ]);

      await user.keyboard('x');
      expect(screen.queryAllByRole('option')).toHaveLength(0);
      expect(await screen.findByText('No matches')).not.toBe(null);

      await user.click(screen.getByLabelText('Clear filter'));
      expect(input).toHaveValue('');
      expect(screen.getAllByRole('option')).toHaveLength(4);
      expect(input).toHaveFocus();
    });

    it('matches items on their label', async () => {
      const { user } = await render(
        <Select.FilterProvider>
          <Select.Root defaultOpen>
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Input aria-label="Filter" />
                  <Select.List>
                    <Select.Item value="de" label="Deutschland">
                      Germany
                    </Select.Item>
                    <Select.Item value="fr">France</Select.Item>
                  </Select.List>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </Select.FilterProvider>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await user.keyboard('deut');
      expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
        'Germany',
      ]);
    });

    it('hides a group whose options are all filtered out', async () => {
      const { user } = await render(
        <Select.FilterProvider>
          <Select.Root defaultOpen>
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Input aria-label="Filter" />
                  <Select.List>
                    <Select.Group data-testid="europe">
                      <Select.GroupLabel>Europe</Select.GroupLabel>
                      <Select.Item value="fr">France</Select.Item>
                    </Select.Group>
                    <Select.Group data-testid="asia">
                      <Select.GroupLabel>Asia</Select.GroupLabel>
                      <Select.Item value="jp">Japan</Select.Item>
                    </Select.Group>
                  </Select.List>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </Select.FilterProvider>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await user.keyboard('jap');
      expect(screen.getByTestId('europe')).toHaveAttribute('hidden');
      expect(screen.getByTestId('asia')).not.toHaveAttribute('hidden');
    });

    it('uses a custom filter function', async () => {
      const { user } = await render(
        <Test
          root={{ defaultOpen: true }}
          provider={{ filter: (text, query) => text.toLowerCase().startsWith(query) }}
        />,
      );
      const input = screen.getByRole('searchbox', { name: 'Filter countries' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await user.keyboard('an');
      expect(screen.queryAllByRole('option')).toHaveLength(0);
      await user.keyboard('[Backspace][Backspace]ja');
      expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Japan']);
    });
  });

  describe('value retention', () => {
    it('keeps the selected label while the selected option is filtered out', async () => {
      const onValueChange = vi.fn();
      const { user } = await render(
        <Test root={{ defaultOpen: true, defaultValue: 'fr', onValueChange }} />,
      );
      const input = screen.getByRole('searchbox', { name: 'Filter countries' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await user.keyboard('jap');
      expect(screen.queryByRole('option', { name: 'France' })).toBe(null);
      expect(screen.getByTestId('value')).toHaveTextContent('France');
      expect(onValueChange).not.toHaveBeenCalled();

      await user.keyboard('[Backspace][Backspace][Backspace]');
      expect(screen.getByRole('option', { name: 'France' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      expect(screen.getByTestId('value')).toHaveTextContent('France');
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('keeps every selected value while selected options are filtered out in multiple mode', async () => {
      const onValueChange = vi.fn();
      const { user } = await render(
        <Test
          root={{
            defaultOpen: true,
            multiple: true,
            defaultValue: ['au', 'fr'],
            onValueChange,
          }}
        />,
      );
      const input = screen.getByRole('searchbox', { name: 'Filter countries' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await user.keyboard('jap');
      expect(screen.getAllByRole('option')).toHaveLength(1);
      expect(onValueChange).not.toHaveBeenCalled();

      await user.click(screen.getByRole('option', { name: 'Japan' }));
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange.mock.calls[0][0]).toEqual(['au', 'fr', 'jp']);
      expect(screen.getByRole('dialog')).not.toBe(null);
      expect(input).toHaveFocus();
    });
  });

  describe('closing', () => {
    it.skipIf(isJSDOM)(
      'does not highlight the selected option during the exit after the query was cleared',
      async () => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
        const style = document.createElement('style');
        style.textContent =
          '[role="dialog"]{transition:opacity 200ms}[role="dialog"][data-ending-style]{opacity:0}';
        document.head.appendChild(style);
        onTestFinished(() => style.remove());

        const { user } = await render(<Test root={{ defaultValue: 'de' }} />);
        await user.click(screen.getByTestId('trigger'));
        const input = await screen.findByRole('searchbox', { name: 'Filter countries' });
        await waitFor(() => {
          expect(input).toHaveFocus();
        });
        await user.keyboard('a[Backspace]');
        expect(input).toHaveValue('');
        expect(screen.getByRole('option', { name: 'Germany' })).not.toHaveAttribute(
          'data-highlighted',
        );

        const highlightedWhileClosing: string[] = [];
        const observer = new MutationObserver(() => {
          const option = document.querySelector('[role="option"][data-highlighted]');
          if (option) {
            highlightedWhileClosing.push(option.textContent ?? '');
          }
        });
        observer.observe(document.body, { subtree: true, attributes: true, childList: true });
        onTestFinished(() => observer.disconnect());

        await user.keyboard('[Escape]');
        await waitFor(() => {
          expect(screen.queryByRole('dialog')).toBe(null);
        });
        expect(highlightedWhileClosing).toEqual([]);
      },
    );
  });

  describe('multiple selection', () => {
    async function selectJapanWhileFiltering(provider?: Partial<Select.FilterProvider.Props>) {
      const { user } = await render(
        <Test root={{ defaultOpen: true, multiple: true }} provider={provider} />,
      );
      const input = screen.getByRole('searchbox', { name: 'Filter countries' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await user.keyboard('jap');
      expect(screen.getAllByRole('option')).toHaveLength(1);
      await user.click(screen.getByRole('option', { name: 'Japan' }));
      return input;
    }

    it('clears the query after an item press and reports it as an item press', async () => {
      const onValueChange = vi.fn();
      const input = await selectJapanWhileFiltering({ onValueChange });

      expect(input).toHaveValue('');
      expect(screen.getAllByRole('option')).toHaveLength(4);
      const lastCall = onValueChange.mock.calls[onValueChange.mock.calls.length - 1];
      expect(lastCall[0]).toBe('');
      expect(lastCall[1].reason).toBe('input-clear');
      expect(lastCall[1].isItemPress).toBe(true);
    });

    it('keeps the query when the item press clear is canceled', async () => {
      const input = await selectJapanWhileFiltering({
        onValueChange(value, eventDetails) {
          if (eventDetails.isItemPress) {
            eventDetails.cancel();
          }
        },
      });

      expect(input).toHaveValue('jap');
      expect(screen.getAllByRole('option')).toHaveLength(1);
      expect(screen.getByRole('option', { name: 'Japan' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });

    it('keeps the toggled item highlighted after the query clears', async () => {
      const { user } = await render(<Test root={{ defaultOpen: true, multiple: true }} />);
      const input = screen.getByRole('searchbox', { name: 'Filter countries' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await user.keyboard('ger');
      await user.keyboard('[ArrowDown]');
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('option', { name: 'Germany' }).id,
      );

      await user.keyboard('[Enter]');
      expect(input).toHaveValue('');
      expect(screen.getAllByRole('option')).toHaveLength(4);
      await waitFor(() => {
        expect(input).toHaveAttribute(
          'aria-activedescendant',
          screen.getByRole('option', { name: 'Germany' }).id,
        );
      });
    });
  });

  describe('keyboard', () => {
    it('highlights the first visible option when opened with the keyboard', async () => {
      const { user } = await render(<Test />);
      const trigger = screen.getByTestId('trigger');
      await act(async () => trigger.focus());
      await user.keyboard('[Enter]');

      const input = await screen.findByRole('searchbox', { name: 'Filter countries' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('option', { name: 'Australia' }).id,
      );
      expect(screen.getByRole('option', { name: 'Australia' })).toHaveAttribute('data-highlighted');
    });

    it('highlights the selected option when opened with the keyboard', async () => {
      const { user } = await render(<Test root={{ defaultValue: 'de' }} />);
      await act(async () => screen.getByTestId('trigger').focus());
      await user.keyboard('[ArrowDown]');

      const input = await screen.findByRole('searchbox', { name: 'Filter countries' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await waitFor(() => {
        expect(input).toHaveAttribute(
          'aria-activedescendant',
          screen.getByRole('option', { name: 'Germany' }).id,
        );
      });

      await user.keyboard('[ArrowDown]');
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('option', { name: 'Japan' }).id,
      );
    });

    it('highlights the selected option when opened with a pointer', async () => {
      const { user } = await render(<Test root={{ defaultValue: 'de' }} />);
      await user.click(screen.getByTestId('trigger'));

      const input = await screen.findByRole('searchbox', { name: 'Filter countries' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Germany' })).toHaveAttribute('data-highlighted');
      });
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('option', { name: 'Germany' }).id,
      );
    });

    it.skipIf(isJSDOM)('scrolls the selected option into view on open', async () => {
      const manyCountries = Array.from({ length: 60 }, (_, index) => ({
        value: `c${index}`,
        label: `Country ${index}`,
      }));
      const { user } = await render(
        <Select.FilterProvider>
          <Select.Root items={manyCountries} defaultValue="c50">
            <Select.Trigger data-testid="trigger">
              <Select.Value />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Input aria-label="Filter countries" />
                  <Select.List data-testid="list" style={{ maxHeight: 100, overflow: 'auto' }}>
                    {manyCountries.map((country) => (
                      <Select.Item key={country.value} value={country.value} style={{ height: 20 }}>
                        <Select.ItemText>{country.label}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.List>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </Select.FilterProvider>,
      );
      await user.click(screen.getByTestId('trigger'));

      const list = await screen.findByTestId('list');
      const selected = screen.getByRole('option', { name: 'Country 50' });
      await waitFor(() => {
        expect(list.scrollTop).toBeGreaterThan(0);
      });
      const listRect = list.getBoundingClientRect();
      const selectedRect = selected.getBoundingClientRect();
      expect(selectedRect.top).toBeGreaterThanOrEqual(listRect.top);
      expect(selectedRect.bottom).toBeLessThanOrEqual(listRect.bottom);
    });

    it('navigates from the first visible option after typing when a value is selected', async () => {
      const { user } = await render(<Test root={{ defaultValue: 'de' }} />);
      await user.click(screen.getByTestId('trigger'));
      const input = await screen.findByRole('searchbox', { name: 'Filter countries' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      // The selected option sat at index 2; the cursor must not start from there.
      await user.keyboard('j');
      expect(screen.getAllByRole('option')).toHaveLength(1);
      await user.keyboard('[ArrowDown]');
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('option', { name: 'Japan' }).id,
      );

      await user.keyboard('[Backspace]a');
      expect(screen.getAllByRole('option')).toHaveLength(4);
      await user.keyboard('[ArrowDown]');
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('option', { name: 'Australia' }).id,
      );
      await user.keyboard('[ArrowUp][ArrowUp]');
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('option', { name: 'Japan' }).id,
      );
    });

    it('returns to the input from the first option on ArrowUp', async () => {
      const { user } = await render(<Test />);
      await act(async () => screen.getByTestId('trigger').focus());
      await user.keyboard('[Enter]');

      const input = await screen.findByRole('searchbox', { name: 'Filter countries' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await user.keyboard('[ArrowDown]');
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('option', { name: 'France' }).id,
      );
      await user.keyboard('[ArrowUp][ArrowUp]');
      expect(input).not.toHaveAttribute('aria-activedescendant');
      expect(input).toHaveFocus();
      expect(input).toHaveAttribute('data-highlighted');
    });

    it('selects the highlighted option with Enter, closes, and returns focus to the trigger', async () => {
      const onValueChange = vi.fn();
      const { user } = await render(<Test root={{ onValueChange }} />);
      const trigger = screen.getByTestId('trigger');
      await act(async () => trigger.focus());
      await user.keyboard('[Enter]');

      const input = await screen.findByRole('searchbox', { name: 'Filter countries' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await user.keyboard('ger');
      await user.keyboard('[ArrowDown][Enter]');

      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange.mock.calls[0][0]).toBe('de');
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBe(null);
      });
      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
      expect(screen.getByTestId('value')).toHaveTextContent('Germany');
    });

    it('does not highlight an option when opened with a pointer', async () => {
      const { user } = await render(<Test />);
      await user.click(screen.getByTestId('trigger'));

      const input = await screen.findByRole('searchbox', { name: 'Filter countries' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      expect(input).not.toHaveAttribute('aria-activedescendant');
    });

    it('closes on Escape and returns focus to the trigger', async () => {
      const { user } = await render(<Test />);
      const trigger = screen.getByTestId('trigger');
      await user.click(trigger);
      const input = await screen.findByRole('searchbox', { name: 'Filter countries' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await user.keyboard('[Escape]');
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBe(null);
      });
      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });
  });

  describe('prop: autoHighlight', () => {
    it('highlights the first match after typing and keeps the input out of the loop', async () => {
      const { user } = await render(
        <Test root={{ defaultOpen: true }} provider={{ autoHighlight: true }} />,
      );
      const input = screen.getByRole('searchbox', { name: 'Filter countries' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      expect(input).not.toHaveAttribute('aria-activedescendant');

      await user.keyboard('an');
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('option', { name: 'France' }).id,
      );

      // With `allowEscape` off, ArrowUp from the first match stays on an option.
      await user.keyboard('[ArrowUp]');
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('option', { name: 'Japan' }).id,
      );
    });

    it("always highlights the first visible option with 'always'", async () => {
      const { user } = await render(
        <Test root={{ defaultOpen: true }} provider={{ autoHighlight: 'always' }} />,
      );
      const input = screen.getByRole('searchbox', { name: 'Filter countries' });
      await waitFor(() => {
        expect(input).toHaveAttribute(
          'aria-activedescendant',
          screen.getByRole('option', { name: 'Australia' }).id,
        );
      });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await user.keyboard('ger');
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('option', { name: 'Germany' }).id,
      );

      await user.keyboard('[Backspace][Backspace][Backspace]');
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('option', { name: 'Australia' }).id,
      );
    });
  });

  describe('prop: virtualized', () => {
    const manyItems = Array.from({ length: 100 }, (_, index) => ({
      value: `v${index}`,
      label: `Item ${index}`,
    }));

    function WindowedList(props: { start: number; mounted: boolean }) {
      const items = Select.useFilteredItems<{ value: string; label: string }>();
      if (!props.mounted) {
        return null;
      }
      return items.slice(props.start, props.start + 5).map((item, offset) => (
        <Select.Item key={item.value} index={props.start + offset} value={item.value}>
          <Select.ItemText>{item.label}</Select.ItemText>
        </Select.Item>
      ));
    }

    // Mounts five options around the highlighted one, as a virtualizer scrolled to it would.
    function Virtualized(props: {
      root?: Partial<Select.Root.Props<string, boolean>>;
      mounted?: boolean;
    }) {
      const [start, setStart] = React.useState(0);
      return (
        <Select.FilterProvider virtualized>
          <Select.Root
            items={manyItems}
            onItemHighlighted={(value, { index }) => {
              if (value !== undefined) {
                setStart(Math.max(0, index - 2));
              }
            }}
            {...props.root}
          >
            <Select.Trigger data-testid="trigger">
              <Select.Value data-testid="value" />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Input aria-label="Filter items" />
                  <Select.Empty>No matches</Select.Empty>
                  <Select.List>
                    <WindowedList start={start} mounted={props.mounted ?? true} />
                  </Select.List>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </Select.FilterProvider>
      );
    }

    async function openWithKeyboard(user: Awaited<ReturnType<typeof render>>['user']) {
      await act(async () => screen.getByTestId('trigger').focus());
      await user.keyboard('[Enter]');
      const input = await screen.findByRole('searchbox', { name: 'Filter items' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      return input;
    }

    it('filters the root items and renders the matches from useFilteredItems', async () => {
      const { user } = await render(<Virtualized />);
      await user.click(screen.getByTestId('trigger'));
      const input = await screen.findByRole('searchbox', { name: 'Filter items' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await user.keyboard('Item 9');
      expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
        'Item 9',
        'Item 90',
        'Item 91',
        'Item 92',
        'Item 93',
      ]);

      await user.keyboard('zz');
      expect(screen.queryAllByRole('option')).toHaveLength(0);
      expect(await screen.findByText('No matches')).toBeVisible();
    });

    // A virtualizer stops rendering rows as the popup closes, while the items still match.
    it('does not show the empty message while matching items are not mounted', async () => {
      const { user, setProps } = await render(<Virtualized mounted />);
      await user.click(screen.getByTestId('trigger'));
      await screen.findByRole('option', { name: 'Item 0' });

      await setProps({ mounted: false });
      expect(screen.queryAllByRole('option')).toHaveLength(0);
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 50);
        });
      });
      expect(screen.queryByText(/No matches/)).toBe(null);
    });

    it('navigates to and selects items beyond the mounted options', async () => {
      const { user } = await render(<Virtualized />);
      const input = await openWithKeyboard(user);
      expect(screen.queryByRole('option', { name: 'Item 7' })).toBe(null);

      await user.keyboard(
        '[ArrowDown][ArrowDown][ArrowDown][ArrowDown][ArrowDown][ArrowDown][ArrowDown]',
      );
      await waitFor(() => {
        expect(input).toHaveAttribute(
          'aria-activedescendant',
          screen.getByRole('option', { name: 'Item 7' }).id,
        );
      });

      await user.keyboard('[Enter]');
      expect(screen.getByTestId('value')).toHaveTextContent('Item 7');
    });

    it('moves the highlight to the last filtered item with End', async () => {
      const { user } = await render(<Virtualized />);
      const input = await openWithKeyboard(user);
      await waitFor(() => {
        expect(input).toHaveAttribute(
          'aria-activedescendant',
          screen.getByRole('option', { name: 'Item 0' }).id,
        );
      });

      await user.keyboard('[End]');
      await waitFor(() => {
        expect(input).toHaveAttribute(
          'aria-activedescendant',
          screen.getByRole('option', { name: 'Item 99' }).id,
        );
      });
    });

    it('opens at a selected item that is not mounted', async () => {
      const { user } = await render(<Virtualized root={{ defaultValue: 'v50' }} />);
      await user.click(screen.getByTestId('trigger'));

      const input = await screen.findByRole('searchbox', { name: 'Filter items' });
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Item 50' })).toHaveAttribute('data-highlighted');
      });
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('option', { name: 'Item 50' }).id,
      );
    });

    it('keeps the toggled item highlighted after a multiple select clears the query', async () => {
      const { user } = await render(<Virtualized root={{ multiple: true }} />);
      await user.click(screen.getByTestId('trigger'));
      const input = await screen.findByRole('searchbox', { name: 'Filter items' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await user.keyboard('Item 5');
      await user.keyboard('[ArrowDown][ArrowDown]');
      await waitFor(() => {
        expect(input).toHaveAttribute(
          'aria-activedescendant',
          screen.getByRole('option', { name: 'Item 50' }).id,
        );
      });

      await user.keyboard('[Enter]');
      expect(input).toHaveValue('');
      await waitFor(() => {
        expect(input).toHaveAttribute(
          'aria-activedescendant',
          screen.getByRole('option', { name: 'Item 50' }).id,
        );
      });
    });

    it('throws when useFilteredItems is called without a filter provider', async () => {
      function Probe() {
        Select.useFilteredItems();
        return null;
      }
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        await expect(render(<Probe />)).rejects.toThrow(
          'Base UI: Select.useFilteredItems() must be called inside a select wrapped in',
        );
      } finally {
        errorSpy.mockRestore();
      }
    });
  });

  describe('prop: readOnly and disabled', () => {
    it('does not commit a highlighted option with Enter while read-only', async () => {
      const onValueChange = vi.fn();
      const { user } = await render(<Test root={{ readOnly: true, onValueChange }} />);
      await act(async () => screen.getByTestId('trigger').focus());
      await user.keyboard('[Enter]');
      const input = await screen.findByRole('searchbox', { name: 'Filter countries' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('option', { name: 'Australia' }).id,
      );

      await user.keyboard('[Enter]');
      expect(onValueChange).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog')).not.toBe(null);
      expect(screen.getByRole('listbox')).toHaveAttribute('aria-readonly', 'true');
    });

    it('disables the filter controls when the root is disabled', async () => {
      await render(
        <Test root={{ defaultOpen: true, disabled: true }} provider={{ defaultValue: 'a' }} />,
      );
      expect(screen.getByRole('searchbox', { name: 'Filter countries' })).toBeDisabled();
      expect(screen.getByLabelText('Clear filter')).toBeDisabled();
    });
  });

  describe('focus', () => {
    it.each([
      { name: 'modal', modal: true },
      { name: 'non-modal', modal: false },
    ])('closes and moves focus past the popup on Tab from a $name select', async ({ modal }) => {
      const { user } = await render(
        <div>
          <Test root={{ modal }} provider={{ defaultValue: 'a' }} />
          <input data-testid="after" />
        </div>,
      );
      await act(async () => screen.getByTestId('trigger').focus());
      await user.keyboard('[Enter]');

      const input = await screen.findByRole('searchbox', { name: 'Filter countries' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await user.tab();
      await waitFor(() => {
        expect(screen.getByTestId('after')).toHaveFocus();
      });
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBe(null);
      });
    });

    it('closes and returns focus to the trigger on Shift+Tab from the input', async () => {
      const { user } = await render(<Test root={{ defaultOpen: true }} />);

      const input = screen.getByRole('searchbox', { name: 'Filter countries' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await user.tab({ shift: true });
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBe(null);
      });
      await waitFor(() => {
        expect(screen.getByTestId('trigger')).toHaveFocus();
      });
    });

    it('keeps focus on the input when an option is pressed in multiple mode', async () => {
      const { user } = await render(<Test root={{ defaultOpen: true, multiple: true }} />);
      const input = screen.getByRole('searchbox', { name: 'Filter countries' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await user.click(screen.getByRole('option', { name: 'France' }));
      expect(screen.getByRole('option', { name: 'France' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      expect(input).toHaveFocus();
    });
  });

  describe('query lifecycle', () => {
    it('clears the query when the popup closes', async () => {
      const onQueryChange = vi.fn();
      const { user } = await render(<Test provider={{ onValueChange: onQueryChange }} />);
      const trigger = screen.getByTestId('trigger');
      await user.click(trigger);

      const input = await screen.findByRole('searchbox', { name: 'Filter countries' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await user.keyboard('jap');
      onQueryChange.mockClear();

      await user.keyboard('[Escape]');
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBe(null);
      });
      expect(onQueryChange).toHaveBeenCalledTimes(1);
      expect(onQueryChange.mock.calls[0][0]).toBe('');
      expect(onQueryChange.mock.calls[0][1].reason).toBe('popup-close');

      await user.click(trigger);
      const reopenedInput = await screen.findByRole('searchbox', { name: 'Filter countries' });
      expect(reopenedInput).toHaveValue('');
      expect(screen.getAllByRole('option')).toHaveLength(4);
    });

    it('keeps a controlled query across a close', async () => {
      function Controlled() {
        const [query, setQuery] = React.useState('jap');
        return (
          <Test
            provider={{
              value: query,
              onValueChange(nextQuery, details) {
                if (details.reason !== 'popup-close') {
                  setQuery(nextQuery);
                }
              },
            }}
          />
        );
      }

      const { user } = await render(<Controlled />);
      const trigger = screen.getByTestId('trigger');
      await user.click(trigger);
      await screen.findByRole('searchbox', { name: 'Filter countries' });
      expect(screen.getAllByRole('option')).toHaveLength(1);

      await user.keyboard('[Escape]');
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBe(null);
      });

      await user.click(trigger);
      const reopenedInput = await screen.findByRole('searchbox', { name: 'Filter countries' });
      expect(reopenedInput).toHaveValue('jap');
      expect(screen.getAllByRole('option')).toHaveLength(1);
    });
  });

  describe('forms', () => {
    it('submits the value through itemToStringValue while the selected option is filtered out', async () => {
      const items = [
        { country: 'Canada', code: 'CA' },
        { country: 'Australia', code: 'AU' },
      ];
      const { user } = await render(
        <Select.FilterProvider>
          <Select.Root
            name="country"
            defaultOpen
            defaultValue={items[0]}
            itemToStringLabel={(item) => item.country}
            itemToStringValue={(item) => item.code}
          >
            <Select.Trigger>
              <Select.Value data-testid="value" />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Input aria-label="Filter" />
                  <Select.List>
                    {items.map((item) => (
                      <Select.Item key={item.code} value={item}>
                        {item.country}
                      </Select.Item>
                    ))}
                  </Select.List>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </Select.FilterProvider>,
      );

      const hiddenInput = screen.getByRole('textbox', { hidden: true });
      expect(hiddenInput).toHaveValue('CA');

      const input = screen.getByRole('searchbox', { name: 'Filter' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await user.keyboard('aus');
      expect(screen.queryByRole('option', { name: 'Canada' })).toBe(null);
      expect(hiddenInput).toHaveValue('CA');
      expect(screen.getByTestId('value')).toHaveTextContent('Canada');

      await user.click(screen.getByRole('option', { name: 'Australia' }));
      await waitFor(() => {
        expect(hiddenInput).toHaveValue('AU');
      });
    });

    it('works inside a Field with the label naming the dialog and the list', async () => {
      await render(
        <Field.Root>
          <Field.Label>Region</Field.Label>
          <Select.FilterProvider>
            <Select.Root defaultOpen>
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Input aria-label="Filter" />
                    <Select.List>
                      <Select.Item value="eu">Europe</Select.Item>
                    </Select.List>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </Select.FilterProvider>
        </Field.Root>,
      );

      expect(screen.getByRole('dialog', { name: 'Region' })).not.toBe(null);
      expect(screen.getByRole('listbox', { name: 'Region' })).not.toBe(null);
    });
  });

  describe.skipIf(isJSDOM)('scroll arrows', () => {
    it('hides the down arrow once the filtered list no longer scrolls', async () => {
      const { user } = await render(
        <Select.FilterProvider>
          <Select.Root defaultOpen>
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Input aria-label="Filter" />
                  <Select.ScrollUpArrow data-testid="up" />
                  <Select.List style={{ maxHeight: 40, overflowY: 'auto' }}>
                    {countries.map((country) => (
                      <Select.Item key={country.value} value={country.value} style={{ height: 30 }}>
                        {country.label}
                      </Select.Item>
                    ))}
                  </Select.List>
                  <Select.ScrollDownArrow data-testid="down" />
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </Select.FilterProvider>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await waitFor(() => {
        expect(screen.getByTestId('down')).toHaveAttribute('data-visible');
      });

      await user.keyboard('jap');
      await waitFor(() => {
        expect(screen.queryByTestId('down')).toBe(null);
      });
    });
  });
});
