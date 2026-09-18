import * as React from 'react';
import { expect, vi, describe, beforeEach, it } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { Select } from '@base-ui/react/select';
import { Field } from '@base-ui/react/field';
import { createRenderer, isJSDOM, resetBrowserPointer } from '#test-utils';

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
              <Select.FilterInput aria-label="Filter countries" />
              <Select.FilterClear aria-label="Clear filter" />
              <Select.FilterEmpty>No matches</Select.FilterEmpty>
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

      await user.click(screen.getByRole('button', { name: 'Clear filter' }));
      expect(input).toHaveValue('');
      expect(screen.getAllByRole('option')).toHaveLength(4);
      expect(input).toHaveFocus();
    });

    it('matches items on their keywords', async () => {
      const { user } = await render(
        <Select.FilterProvider>
          <Select.Root defaultOpen>
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.FilterInput aria-label="Filter" />
                  <Select.List>
                    <Select.Item value="de" keywords={['Deutschland']}>
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
                  <Select.FilterInput aria-label="Filter" />
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
      // Multiple selection keeps the popup open and the query in place.
      expect(screen.getByRole('dialog')).not.toBe(null);
      expect(input).toHaveValue('jap');
      expect(input).toHaveFocus();
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
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('option', { name: 'Germany' }).id,
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

  describe('focus', () => {
    it('traps focus in a modal popup opened with the keyboard', async () => {
      const { user } = await render(
        <div>
          <Test provider={{ defaultInputValue: 'a' }} />
          <input data-testid="after" />
        </div>,
      );
      await act(async () => screen.getByTestId('trigger').focus());
      await user.keyboard('[Enter]');

      const input = await screen.findByRole('searchbox', { name: 'Filter countries' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      const clear = screen.getByRole('button', { name: 'Clear filter' });
      await user.tab();
      expect(clear).toHaveFocus();
      await user.tab();
      expect(input).toHaveFocus();
      expect(screen.getByRole('dialog')).not.toBe(null);
    });

    it('moves focus past the popup when tabbing from a non-modal input', async () => {
      const { user } = await render(
        <div>
          <Test root={{ defaultOpen: true, modal: false }} />
          <input data-testid="after" />
        </div>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter countries' });
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

    it('closes and returns focus to the trigger on Shift+Tab from a non-modal input', async () => {
      const { user } = await render(<Test root={{ defaultOpen: true, modal: false }} />);

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
      const onInputValueChange = vi.fn();
      const { user } = await render(<Test provider={{ onInputValueChange }} />);
      const trigger = screen.getByTestId('trigger');
      await user.click(trigger);

      const input = await screen.findByRole('searchbox', { name: 'Filter countries' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await user.keyboard('jap');
      onInputValueChange.mockClear();

      await user.keyboard('[Escape]');
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBe(null);
      });
      expect(onInputValueChange).toHaveBeenCalledTimes(1);
      expect(onInputValueChange.mock.calls[0][0]).toBe('');
      expect(onInputValueChange.mock.calls[0][1].reason).toBe('popup-close');

      await user.click(trigger);
      const reopenedInput = await screen.findByRole('searchbox', { name: 'Filter countries' });
      expect(reopenedInput).toHaveValue('');
      expect(screen.getAllByRole('option')).toHaveLength(4);
    });

    it('keeps a controlled query across a close', async () => {
      function Controlled() {
        const [inputValue, setInputValue] = React.useState('jap');
        return (
          <Test
            provider={{
              inputValue,
              onInputValueChange(value, details) {
                if (details.reason !== 'popup-close') {
                  setInputValue(value);
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
                  <Select.FilterInput aria-label="Filter" />
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
                    <Select.FilterInput aria-label="Filter" />
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
                  <Select.FilterInput aria-label="Filter" />
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

  it('uses fireEvent-driven typing without dropping the selected value', async () => {
    await render(<Test root={{ defaultOpen: true, defaultValue: 'fr' }} />);
    const input = screen.getByRole('searchbox', { name: 'Filter countries' });
    fireEvent.change(input, { target: { value: 'zzz' } });
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByTestId('value')).toHaveTextContent('France');
  });
});
