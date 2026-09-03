import * as React from 'react';
import { screen } from '@mui/internal-test-utils';
import { expect, describe, it } from 'vitest';
import { createRenderer } from '#test-utils';
import { Menu } from '@base-ui/react/menu';

describe('<Menu.FilterStatus />', () => {
  const { render } = createRenderer();

  function App(props: { children?: React.ReactNode }) {
    return (
      <Menu.FilterProvider>
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterInput aria-label="Filter fruit" />
                <Menu.FilterStatus data-testid="status">{props.children}</Menu.FilterStatus>
                <Menu.FilterList>
                  <Menu.Item>Apple</Menu.Item>
                </Menu.FilterList>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>
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
