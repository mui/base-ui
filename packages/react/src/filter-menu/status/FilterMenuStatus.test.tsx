import * as React from 'react';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'vitest';
import { createRenderer } from '#test-utils';
import { FilterMenu } from '@base-ui/react/filter-menu';

describe('<FilterMenu.Status />', () => {
  const { render } = createRenderer();

  function App(props: { children?: React.ReactNode }) {
    return (
      <FilterMenu.Root inline open>
        <FilterMenu.Input aria-label="Filter fruit" />
        <FilterMenu.Status data-testid="status">{props.children}</FilterMenu.Status>
        <FilterMenu.List>
          <FilterMenu.Item>Apple</FilterMenu.Item>
        </FilterMenu.List>
      </FilterMenu.Root>
    );
  }

  it('renders nothing while it has no children', async () => {
    const { setProps } = await render(<App />);

    expect(screen.queryByTestId('status')).toBe(null);

    await setProps({ children: 'Loading' });
    expect(screen.getByTestId('status')).toHaveTextContent('Loading');
    expect(screen.getByTestId('status')).toHaveAttribute('role', 'status');

    await setProps({ children: null });
    expect(screen.queryByTestId('status')).toBe(null);
  });
});
