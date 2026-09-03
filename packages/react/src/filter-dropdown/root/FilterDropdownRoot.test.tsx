import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { expect, describe, beforeEach, it } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, resetBrowserPointer } from '#test-utils';
import { Menu } from '@base-ui/react/menu';
import { FilterDropdown } from '..';

describe('<FilterDropdown.Root />', () => {
  beforeEach(resetBrowserPointer);

  const { render } = createRenderer();

  it('renders the expected markup and ARIA relationships', async () => {
    await render(
      <React.Fragment>
        <button type="button" id="host-trigger">
          Choose a country
        </button>
        <TestFilterDropdownRoot open value="" triggerId="host-trigger">
          <FilterDropdown.Popup id={undefined}>
            <FilterDropdown.Input aria-label="Filter countries" />
            <FilterDropdown.List id={undefined} data-testid="list" />
          </FilterDropdown.Popup>
        </TestFilterDropdownRoot>
      </React.Fragment>,
    );

    const popup = screen.getByRole('dialog', { name: 'Choose a country' });
    const input = screen.getByRole('searchbox', { name: 'Filter countries' });
    const list = screen.getByRole('menu', { name: 'Choose a country' });

    expect(popup.tagName).toBe('DIV');
    expect(popup).toHaveAttribute('aria-labelledby', 'host-trigger');
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
    const popup = screen.getByRole('dialog');
    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    const list = screen.getByRole('menu');

    await user.click(screen.getByRole('button', { name: 'Change ids' }));

    expect(popup).toHaveAttribute('id', 'second-popup');
    expect(input).toHaveAttribute('aria-controls', 'second-list');
    expect(list).toHaveAttribute('id', 'second-list');
  });

  it('releases id overrides when their props are removed', async () => {
    function App() {
      const [customIds, setCustomIds] = React.useState(true);

      return (
        <TestFilterDropdownRoot open value="">
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
    const popup = screen.getByRole('dialog');
    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    const list = screen.getByRole('menu');

    await user.click(screen.getByRole('button', { name: 'Remove ids' }));

    await waitFor(() => {
      expect(popup).not.toHaveAttribute('id', 'custom-popup');
    });
    expect(list).not.toHaveAttribute('id', 'custom-list');
    // Removing an explicit id must return the element to its generated one, not leave it dangling.
    expect(popup.id).not.toBe('');
    expect(input.getAttribute('aria-controls')).toBe(list.id);
  });

  it('keeps the live region in sync with a changing Empty message', async () => {
    function App() {
      const [value, setValue] = React.useState('zz');

      return (
        <TestFilterDropdownRoot open value={value} onValueChange={setValue}>
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
          <Menu.FilterRoot defaultOpen filter={null}>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.FilterList>
                    {props.items.map((item) => (
                      <Menu.Item key={item}>{item}</Menu.Item>
                    ))}
                  </Menu.FilterList>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.FilterRoot>
        );
      }

      const { user, setProps } = await render(<ServerResults items={['A', 'B', 'C']} />);

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      // `null` runs no match pass, but the query still has to change for the highlight to be
      // reconciled against the new results.
      fireEvent.change(input, { target: { value: 'q' } });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
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

    it('keeps autoHighlight seeding the first item', async () => {
      function ServerResults(props: { items: string[] }) {
        return (
          <Menu.FilterRoot autoHighlight defaultOpen filter={null}>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.FilterList>
                    {props.items.map((item) => (
                      <Menu.Item key={item}>{item}</Menu.Item>
                    ))}
                  </Menu.FilterList>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.FilterRoot>
        );
      }

      const { setProps } = await render(<ServerResults items={['A', 'B']} />);
      const input = screen.getByRole('searchbox', { name: 'Filter actions' });

      // The consumer owns matching, so the rendered set never changes here. Seeding must still
      // follow the query.
      fireEvent.change(input, { target: { value: 'q' } });

      await waitFor(() => {
        expect(input).toHaveAttribute(
          'aria-activedescendant',
          screen.getByRole('menuitem', { name: 'A' }).id,
        );
      });

      // A query that matches nothing, then results returning, must seed again rather than leave
      // the list unhighlighted.
      await setProps({ items: [] });
      await waitFor(() => {
        expect(input).not.toHaveAttribute('aria-activedescendant');
      });

      await setProps({ items: ['X', 'Y'] });

      await waitFor(() => {
        expect(input).toHaveAttribute(
          'aria-activedescendant',
          screen.getByRole('menuitem', { name: 'X' }).id,
        );
      });
    });
  });

  it('clears a stale highlight when items change with an empty query', async () => {
    function Results(props: { items: string[] }) {
      return (
        <Menu.FilterRoot defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterInput aria-label="Filter actions" />
                <Menu.FilterList>
                  {props.items.map((item) => (
                    <Menu.Item key={item}>{item}</Menu.Item>
                  ))}
                </Menu.FilterList>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.FilterRoot>
      );
    }

    const { user, setProps } = await render(<Results items={['A', 'B']} />);
    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    await waitFor(() => {
      expect(input).toHaveFocus();
    });

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
