import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { expect } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, resetBrowserPointer } from '#test-utils';
import { FilterMenu } from '@base-ui/react/filter-menu';
import { FilterDropdown } from '..';

describe('<FilterDropdown.Root />', () => {
  beforeEach(resetBrowserPointer);

  const { render } = createRenderer();

  it('renders the expected markup and ARIA relationships', async () => {
    await render(
      <TestFilterDropdownRoot open value="">
        <FilterDropdown.Trigger id={undefined}>Choose a country</FilterDropdown.Trigger>
        <FilterDropdown.Popup id={undefined}>
          <FilterDropdown.Input aria-label="Filter countries" />
          <FilterDropdown.List id={undefined} data-testid="list" />
        </FilterDropdown.Popup>
      </TestFilterDropdownRoot>,
    );

    const trigger = screen.getByRole('button', { name: 'Choose a country' });

    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls');

    const popup = screen.getByRole('dialog', { name: 'Choose a country' });
    const input = screen.getByRole('searchbox', { name: 'Filter countries' });
    const list = screen.getByRole('menu', { name: 'Choose a country' });

    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger.getAttribute('aria-controls')).toBe(popup.id);
    expect(popup.tagName).toBe('DIV');
    expect(popup).toHaveAttribute('aria-labelledby', trigger.id);
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('inputmode', 'search');
    expect(input).toHaveAttribute('enterkeyhint', 'search');
    expect(input).toHaveAttribute('autocomplete', 'off');
    expect(input).not.toHaveAttribute('role', 'combobox');
    expect(input).not.toHaveAttribute('aria-expanded');
    expect(list).toHaveAttribute('id');
    expect(list).toHaveAttribute('tabindex', '-1');
    expect(input).toHaveAttribute('aria-controls', list.id);
    expect(input).not.toHaveAttribute('aria-activedescendant');
  });

  it('does not associate the trigger with the popup while closed', async () => {
    await render(
      <TestFilterDropdownRoot open={false} value="">
        <FilterDropdown.Trigger id={undefined}>Choose a country</FilterDropdown.Trigger>
        <FilterDropdown.Popup id={undefined} />
      </TestFilterDropdownRoot>,
    );

    const trigger = screen.getByRole('button', { name: 'Choose a country' });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).not.toHaveAttribute('aria-controls');
  });

  it('keeps focus on the input when the list or popup background is clicked', async () => {
    const { user } = await render(
      <TestFilterDropdownRoot open value="">
        <FilterDropdown.Popup id={undefined} data-testid="popup">
          <FilterDropdown.Input aria-label="Filter countries" />
          <FilterDropdown.List id={undefined} />
        </FilterDropdown.Popup>
      </TestFilterDropdownRoot>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter countries' });
    const list = screen.getByRole('menu');

    await user.click(input);
    await user.click(list);
    expect(input).toHaveFocus();

    await user.click(screen.getByTestId('popup'));

    expect(input).toHaveFocus();
  });

  it('focuses the input when the pointer enters or the popup itself receives focus', async () => {
    const { user } = await render(
      <TestFilterDropdownRoot open value="">
        <FilterDropdown.Popup id={undefined} data-testid="popup" tabIndex={-1}>
          <FilterDropdown.Input aria-label="Filter countries" />
          <FilterDropdown.List id={undefined}>
            <div role="menuitem">Canada</div>
          </FilterDropdown.List>
        </FilterDropdown.Popup>
        <button type="button">Outside</button>
      </TestFilterDropdownRoot>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter countries' });
    const outside = screen.getByRole('button', { name: 'Outside' });
    const popup = screen.getByTestId('popup');

    await act(async () => {
      outside.focus();
    });
    await user.hover(popup);
    expect(input).toHaveFocus();

    await act(async () => {
      outside.focus();
      popup.focus();
    });
    expect(input).toHaveFocus();
  });

  it('does not focus a parent input when the pointer enters a portalled nested popup', async () => {
    const { user } = await render(
      <TestFilterDropdownRoot open value="">
        <FilterDropdown.Popup id={undefined} data-testid="parent-popup">
          <FilterDropdown.Input aria-label="Filter parent items" />
          <TestFilterDropdownRoot open value="">
            {ReactDOM.createPortal(
              <FilterDropdown.Popup id={undefined} data-testid="child-popup">
                <FilterDropdown.Input aria-label="Filter child items" />
              </FilterDropdown.Popup>,
              document.body,
            )}
          </TestFilterDropdownRoot>
        </FilterDropdown.Popup>
      </TestFilterDropdownRoot>,
    );

    const parentInput = screen.getByRole('searchbox', { name: 'Filter parent items' });
    const childInput = screen.getByRole('searchbox', { name: 'Filter child items' });

    await act(async () => {
      parentInput.focus();
    });
    await user.hover(screen.getByTestId('child-popup'));

    expect(childInput).toHaveFocus();
  });

  it('does not focus a parent input when the pointer enters an inline nested popup', async () => {
    const { user } = await render(
      <TestFilterDropdownRoot open value="">
        <FilterDropdown.Popup id={undefined} data-testid="parent-popup">
          <FilterDropdown.Input aria-label="Filter parent items" />
          <TestFilterDropdownRoot open value="">
            <FilterDropdown.Popup id={undefined} data-testid="child-popup">
              <FilterDropdown.Input aria-label="Filter child items" />
            </FilterDropdown.Popup>
          </TestFilterDropdownRoot>
        </FilterDropdown.Popup>
      </TestFilterDropdownRoot>,
    );

    const parentInput = screen.getByRole('searchbox', { name: 'Filter parent items' });
    const childInput = screen.getByRole('searchbox', { name: 'Filter child items' });

    await act(async () => {
      parentInput.focus();
    });
    await user.hover(screen.getByTestId('child-popup'));

    expect(childInput).toHaveFocus();
  });

  it('updates relationships when id props change', async () => {
    function App() {
      const [version, setVersion] = React.useState('first');

      return (
        <TestFilterDropdownRoot open value="">
          <FilterDropdown.Trigger id={`${version}-trigger`}>Actions</FilterDropdown.Trigger>
          <FilterDropdown.Popup id={`${version}-popup`}>
            <FilterDropdown.Input aria-label="Filter actions" />
            <FilterDropdown.List id={`${version}-list`} />
            <button type="button" onClick={() => setVersion('second')}>
              Change ids
            </button>
          </FilterDropdown.Popup>
        </TestFilterDropdownRoot>
      );
    }

    const { user } = await render(<App />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    const popup = screen.getByRole('dialog');
    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    const list = screen.getByRole('menu');

    await user.click(screen.getByRole('button', { name: 'Change ids' }));

    expect(trigger).toHaveAttribute('id', 'second-trigger');
    expect(trigger).toHaveAttribute('aria-controls', 'second-popup');
    expect(popup).toHaveAttribute('id', 'second-popup');
    expect(popup).toHaveAttribute('aria-labelledby', 'second-trigger');
    expect(input).toHaveAttribute('aria-controls', 'second-list');
    expect(list).toHaveAttribute('id', 'second-list');
    expect(list).toHaveAttribute('aria-labelledby', 'second-trigger');
  });

  it('releases id overrides when their props are removed', async () => {
    function App() {
      const [customIds, setCustomIds] = React.useState(true);

      return (
        <TestFilterDropdownRoot open value="">
          <FilterDropdown.Trigger id={customIds ? 'custom-trigger' : undefined}>
            Actions
          </FilterDropdown.Trigger>
          <FilterDropdown.Popup id={customIds ? 'custom-popup' : undefined}>
            <FilterDropdown.Input aria-label="Filter actions" />
            <FilterDropdown.List id={customIds ? 'custom-list' : undefined} />
            <button type="button" onClick={() => setCustomIds(false)}>
              Remove ids
            </button>
          </FilterDropdown.Popup>
        </TestFilterDropdownRoot>
      );
    }

    const { user } = await render(<App />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    const popup = screen.getByRole('dialog');
    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    const list = screen.getByRole('menu');

    await user.click(screen.getByRole('button', { name: 'Remove ids' }));

    await waitFor(() => {
      expect(trigger).not.toHaveAttribute('id', 'custom-trigger');
    });
    expect(popup).not.toHaveAttribute('id', 'custom-popup');
    expect(list).not.toHaveAttribute('id', 'custom-list');
    expect(trigger.getAttribute('aria-controls')).toBe(popup.id);
    expect(input.getAttribute('aria-controls')).toBe(list.id);
  });

  it('keeps the live region in sync with a changing Empty message', async () => {
    function App() {
      const [value, setValue] = React.useState('zz');

      return (
        <TestFilterDropdownRoot open value={value} onValueChange={setValue}>
          <FilterDropdown.Trigger id={undefined}>Choose a country</FilterDropdown.Trigger>
          <FilterDropdown.Popup id={undefined}>
            <FilterDropdown.Input aria-label="Filter countries" />
            <FilterDropdown.Empty>No matches for {value}</FilterDropdown.Empty>
            <FilterDropdown.List id={undefined} />
          </FilterDropdown.Popup>
        </TestFilterDropdownRoot>
      );
    }

    const { user } = await render(<App />);
    const status = screen.getByRole('status');

    await waitFor(() => {
      expect(status).toHaveTextContent('No matches for zz');
    });

    await user.type(screen.getByRole('searchbox', { name: 'Filter countries' }), 'q');

    await waitFor(() => {
      expect(status).toHaveTextContent('No matches for zzq');
    });
  });

  describe('prop: filter with null', () => {
    it('clears a stale highlight when the item set changes', async () => {
      function ServerResults(props: { items: string[] }) {
        return (
          <FilterMenu.Root defaultOpen filter={null}>
            <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
            <FilterMenu.Portal>
              <FilterMenu.Positioner>
                <FilterMenu.Popup>
                  <FilterMenu.Input aria-label="Filter actions" />
                  <FilterMenu.List>
                    {props.items.map((item) => (
                      <FilterMenu.Item key={item}>{item}</FilterMenu.Item>
                    ))}
                  </FilterMenu.List>
                </FilterMenu.Popup>
              </FilterMenu.Positioner>
            </FilterMenu.Portal>
          </FilterMenu.Root>
        );
      }

      const { user, setProps } = await render(<ServerResults items={['A', 'B', 'C']} />);

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      // A query is needed for the filter pass to run at all; `null` keeps every item visible.
      fireEvent.change(input, { target: { value: 'q' } });
      await user.keyboard('[ArrowDown][ArrowDown][ArrowDown]');

      await waitFor(() => {
        expect(input).toHaveAttribute(
          'aria-activedescendant',
          screen.getByRole('menuitem', { name: 'C' }).id,
        );
      });

      // Results swap under the highlight. Leaving `activeIndex` alone would point the cursor at
      // whatever moved into that slot, and Enter would run an item the user never chose.
      await setProps({ items: ['X', 'Y', 'Z'] });

      await waitFor(() => {
        expect(input).not.toHaveAttribute('aria-activedescendant');
      });
    });
  });

  it('clears a stale highlight when items change with an empty query', async () => {
    function Results(props: { items: string[] }) {
      return (
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  {props.items.map((item) => (
                    <FilterMenu.Item key={item}>{item}</FilterMenu.Item>
                  ))}
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>
      );
    }

    const { user, setProps } = await render(<Results items={['A', 'B']} />);
    const input = screen.getByRole('searchbox', { name: 'Filter actions' });

    await user.keyboard('[ArrowDown][ArrowDown]');
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('menuitem', { name: 'B' }).id,
    );

    await setProps({ items: ['B', 'A'] });

    await waitFor(() => {
      expect(input).not.toHaveAttribute('aria-activedescendant');
    });
  });
});

function TestFilterDropdownRoot(
  props: Omit<React.ComponentProps<typeof FilterDropdown.Root>, 'listRef'>,
) {
  const listRef = React.useRef<Array<HTMLElement | null>>([]);
  return <FilterDropdown.Root {...props} listRef={listRef} />;
}
