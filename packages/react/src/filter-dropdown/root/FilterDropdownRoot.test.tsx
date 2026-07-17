import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { expect } from 'vitest';
import { fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { FilterDropdown } from '..';

describe('<FilterDropdown.Root />', () => {
  const { render } = createRenderer();

  it('renders the expected markup and ARIA relationships', async () => {
    await render(
      <FilterDropdown.Root open value="">
        <FilterDropdown.Trigger id={undefined}>Choose a country</FilterDropdown.Trigger>
        <FilterDropdown.Popup id={undefined}>
          <FilterDropdown.Input aria-label="Filter countries" />
          <FilterDropdown.List id={undefined} data-testid="list">
            <FilterDropdown.Item label="Canada">Canada</FilterDropdown.Item>
          </FilterDropdown.List>
        </FilterDropdown.Popup>
      </FilterDropdown.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'Choose a country' });

    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls');

    const popup = screen.getByRole('dialog', { name: 'Choose a country' });
    const input = screen.getByRole('searchbox', { name: 'Filter countries' });
    const list = screen.getByRole('menu', { name: 'Choose a country' });
    const item = screen.getByRole('menuitem', { name: 'Canada' });

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
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).not.toHaveAttribute('aria-expanded');
    expect(list).toHaveAttribute('id');
    expect(item).not.toHaveAttribute('aria-selected');
    expect(input).toHaveAttribute('aria-controls', list.id);
    expect(input).not.toHaveAttribute('aria-activedescendant');
  });

  it('does not associate the trigger with the popup while closed', async () => {
    await render(
      <FilterDropdown.Root open={false} value="">
        <FilterDropdown.Trigger id={undefined}>Choose a country</FilterDropdown.Trigger>
        <FilterDropdown.Popup id={undefined} />
      </FilterDropdown.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'Choose a country' });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).not.toHaveAttribute('aria-controls');
  });

  it('keeps focus on the input when the list or popup background is clicked', async () => {
    const { user } = await render(
      <FilterDropdown.Root open value="">
        <FilterDropdown.Popup id={undefined} data-testid="popup">
          <FilterDropdown.Input aria-label="Filter countries" />
          <FilterDropdown.List id={undefined}>
            <FilterDropdown.Item label="Canada">Canada</FilterDropdown.Item>
          </FilterDropdown.List>
        </FilterDropdown.Popup>
      </FilterDropdown.Root>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter countries' });
    const list = screen.getByRole('menu');

    await user.click(input);
    await user.click(list);
    expect(input).toHaveFocus();

    await user.click(screen.getByTestId('popup'));

    expect(input).toHaveFocus();
  });

  it('focuses the input when the pointer or focus enters the popup', async () => {
    await render(
      <FilterDropdown.Root open value="">
        <FilterDropdown.Popup id={undefined} data-testid="popup">
          <FilterDropdown.Input aria-label="Filter countries" />
          <FilterDropdown.List id={undefined}>
            <FilterDropdown.Item label="Canada">Canada</FilterDropdown.Item>
          </FilterDropdown.List>
        </FilterDropdown.Popup>
        <button type="button">Outside</button>
      </FilterDropdown.Root>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter countries' });
    const outside = screen.getByRole('button', { name: 'Outside' });

    outside.focus();
    fireEvent.mouseMove(screen.getByTestId('popup'));
    expect(input).toHaveFocus();

    outside.focus();
    fireEvent.focus(screen.getByRole('menuitem', { name: 'Canada' }));
    expect(input).toHaveFocus();
  });

  it('does not focus a parent input when the pointer enters a portalled nested popup', async () => {
    await render(
      <FilterDropdown.Root open value="">
        <FilterDropdown.Popup id={undefined} data-testid="parent-popup">
          <FilterDropdown.Input aria-label="Filter parent items" />
          <FilterDropdown.Root open value="">
            {ReactDOM.createPortal(
              <FilterDropdown.Popup id={undefined} data-testid="child-popup">
                <FilterDropdown.Input aria-label="Filter child items" />
              </FilterDropdown.Popup>,
              document.body,
            )}
          </FilterDropdown.Root>
        </FilterDropdown.Popup>
      </FilterDropdown.Root>,
    );

    const parentInput = screen.getByRole('searchbox', { name: 'Filter parent items' });
    const childInput = screen.getByRole('searchbox', { name: 'Filter child items' });

    parentInput.focus();
    fireEvent.mouseMove(screen.getByTestId('child-popup'));

    expect(childInput).toHaveFocus();
  });

  it('resets the controlled value when the popup closes', async () => {
    function App() {
      const [open, setOpen] = React.useState(true);
      const [value, setValue] = React.useState('');

      return (
        <FilterDropdown.Root open={open} value={value} onValueChange={setValue}>
          <FilterDropdown.Popup id={undefined}>
            <FilterDropdown.Input aria-label="Filter countries" />
            <FilterDropdown.List id={undefined}>
              <FilterDropdown.Item label="Canada">Canada</FilterDropdown.Item>
            </FilterDropdown.List>
          </FilterDropdown.Popup>
          <button type="button" onClick={() => setOpen(false)}>
            Close popup
          </button>
        </FilterDropdown.Root>
      );
    }

    const { user } = await render(<App />);

    const input = screen.getByRole('searchbox', { name: 'Filter countries' });
    await user.type(input, 'can');

    expect(input).toHaveValue('can');

    await user.click(screen.getByRole('button', { name: 'Close popup' }));

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('updates relationships when id props change', async () => {
    function App() {
      const [version, setVersion] = React.useState('first');

      return (
        <FilterDropdown.Root open value="">
          <FilterDropdown.Trigger id={`${version}-trigger`}>Actions</FilterDropdown.Trigger>
          <FilterDropdown.Popup id={`${version}-popup`}>
            <FilterDropdown.Input aria-label="Filter actions" />
            <FilterDropdown.List id={`${version}-list`} />
            <button type="button" onClick={() => setVersion('second')}>
              Change ids
            </button>
          </FilterDropdown.Popup>
        </FilterDropdown.Root>
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

  it('filters rendered items using their label', async () => {
    function App() {
      const [value, setValue] = React.useState('');
      return (
        <FilterDropdown.Root open value={value} onValueChange={setValue}>
          <FilterDropdown.Popup id={undefined}>
            <FilterDropdown.Input aria-label="Filter countries" />
            <FilterDropdown.List id={undefined}>
              <FilterDropdown.Item label="Canada">Canada</FilterDropdown.Item>
              <FilterDropdown.Item label="Japan">Japan</FilterDropdown.Item>
            </FilterDropdown.List>
          </FilterDropdown.Popup>
        </FilterDropdown.Root>
      );
    }

    const { user } = await render(<App />);

    await user.type(screen.getByRole('searchbox', { name: 'Filter countries' }), 'can');

    await waitFor(() => {
      expect(screen.getByText('Canada')).not.toBe(null);
    });
    expect(screen.queryByText('Japan')).toBe(null);
  });

  it('filters items when the input is not rendered', async () => {
    await render(
      <FilterDropdown.Root open value="zz" filter={() => false}>
        <FilterDropdown.Popup id={undefined}>
          <FilterDropdown.List id={undefined}>
            <FilterDropdown.Item label="Canada">Canada</FilterDropdown.Item>
            <FilterDropdown.Item label="Japan">Japan</FilterDropdown.Item>
          </FilterDropdown.List>
        </FilterDropdown.Popup>
      </FilterDropdown.Root>,
    );

    await waitFor(() => {
      expect(screen.queryByText('Canada')).toBe(null);
    });
    expect(screen.queryByText('Japan')).toBe(null);
  });

  it('renders Empty when no rendered items match', async () => {
    await render(
      <FilterDropdown.Root open value="zz">
        <FilterDropdown.Trigger id={undefined}>Choose a country</FilterDropdown.Trigger>
        <FilterDropdown.Popup id={undefined}>
          <FilterDropdown.Input aria-label="Filter countries" />
          <FilterDropdown.Empty data-testid="empty">
            <span id="empty-message">No countries found.</span>
          </FilterDropdown.Empty>
          <FilterDropdown.List id={undefined}>
            <FilterDropdown.Item label="Canada">Canada</FilterDropdown.Item>
          </FilterDropdown.List>
        </FilterDropdown.Popup>
      </FilterDropdown.Root>,
    );

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-atomic', 'true');
    expect(status).toHaveStyle({ position: 'fixed' });
    expect(status.parentElement).toBe(status.ownerDocument.body);

    await waitFor(() => {
      expect(status).toHaveTextContent('No countries found.');
    });

    const empty = screen.getByTestId('empty');
    expect(empty).not.toHaveAttribute('role');
    expect(empty).not.toHaveAttribute('aria-live');
    expect(empty.ownerDocument.querySelectorAll('#empty-message')).toHaveLength(1);
  });
});
