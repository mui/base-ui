import * as React from 'react';
import { expect, vi } from 'vitest';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';
import { FilterDropdown } from '..';

describe('<FilterDropdown.Clear />', () => {
  const { render } = createRenderer();

  describeConformance(<FilterDropdown.Clear />, () => ({
    refInstanceof: window.HTMLButtonElement,
    button: true,
    render(node) {
      return render(
        <ControlledFilterDropdownRoot initialValue="can">
          <FilterDropdown.Popup id={undefined}>{node}</FilterDropdown.Popup>
        </ControlledFilterDropdownRoot>,
      );
    },
  }));

  it('does not render when the filter value is empty', async () => {
    await render(
      <ControlledFilterDropdownRoot>
        <FilterDropdown.Popup id={undefined}>
          <FilterDropdown.Clear data-testid="clear" />
        </FilterDropdown.Popup>
      </ControlledFilterDropdownRoot>,
    );

    expect(screen.queryByTestId('clear')).toBe(null);
  });

  it('clears the filter value and focuses the input when clicked', async () => {
    const onValueChange = vi.fn();
    const { user } = await render(
      <ControlledFilterDropdownRoot initialValue="can" onValueChange={onValueChange}>
        <FilterDropdown.Popup id={undefined}>
          <FilterDropdown.Input aria-label="Filter countries" />
          <FilterDropdown.Clear aria-label="Clear filter" />
        </FilterDropdown.Popup>
      </ControlledFilterDropdownRoot>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter countries' });
    await user.click(screen.getByRole('button', { name: 'Clear filter' }));

    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Clear filter' })).toBe(null);
    expect(onValueChange).toHaveBeenLastCalledWith(
      '',
      expect.objectContaining({ reason: 'clear-press' }),
    );
  });

  it('does nothing when disabled', async () => {
    const { user } = await render(
      <ControlledFilterDropdownRoot initialValue="can">
        <FilterDropdown.Popup id={undefined}>
          <FilterDropdown.Input aria-label="Filter countries" />
          <FilterDropdown.Clear aria-label="Clear filter" disabled />
        </FilterDropdown.Popup>
      </ControlledFilterDropdownRoot>,
    );

    const clear = screen.getByRole('button', { name: 'Clear filter' });
    expect(clear).toBeDisabled();

    await user.click(clear);

    expect(screen.getByRole('searchbox', { name: 'Filter countries' })).toHaveValue('can');
  });
});

interface ControlledFilterDropdownRootProps {
  children: React.ReactNode;
  initialValue?: string;
  onValueChange?: React.ComponentProps<typeof FilterDropdown.Root>['onValueChange'];
}

function ControlledFilterDropdownRoot(props: ControlledFilterDropdownRootProps) {
  const { children, initialValue = '', onValueChange } = props;
  const [value, setValue] = React.useState(initialValue);

  return (
    <FilterDropdown.Root
      open
      value={value}
      onValueChange={(nextValue, eventDetails) => {
        onValueChange?.(nextValue, eventDetails);
        setValue(nextValue);
      }}
    >
      {children}
    </FilterDropdown.Root>
  );
}
