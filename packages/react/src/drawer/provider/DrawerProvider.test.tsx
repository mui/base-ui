import { describe, expect, it } from 'vitest';
import * as React from 'react';
import { Drawer } from '@base-ui/react/drawer';
import { screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { useDrawerProviderContext } from './DrawerProviderContext';

function ProviderControls() {
  const context = useDrawerProviderContext();

  if (!context) {
    return null;
  }

  return (
    <React.Fragment>
      <button onClick={() => context.setDrawerOpen('manual', true)}>Register open</button>
      <button onClick={() => context.setDrawerOpen('manual', false)}>Register closed</button>
      <button onClick={() => context.removeDrawer('manual')}>Remove registered</button>
      <button onClick={() => context.removeDrawer('missing')}>Remove missing</button>
      <button
        onClick={() => context.visualStateStore.set({ swipeProgress: 0.5, frontmostHeight: 120 })}
      >
        Set visual state
      </button>
      <button onClick={() => context.visualStateStore.set({ swipeProgress: 0 })}>
        Clear progress
      </button>
      <button onClick={() => context.visualStateStore.set({ frontmostHeight: 0 })}>
        Clear height
      </button>
      <button
        onClick={() =>
          context.visualStateStore.set({ swipeProgress: Number.NaN, frontmostHeight: Infinity })
        }
      >
        Set invalid visual state
      </button>
    </React.Fragment>
  );
}

function MultipleDrawers(props: { firstOpen: boolean; secondOpen: boolean; showSecond: boolean }) {
  const { firstOpen, secondOpen, showSecond } = props;

  return (
    <Drawer.Provider>
      <Drawer.IndentBackground data-testid="background" />
      <Drawer.Root open={firstOpen}>First drawer</Drawer.Root>
      {showSecond && <Drawer.Root open={secondOpen}>Second drawer</Drawer.Root>}
    </Drawer.Provider>
  );
}

function VisualStateCase(props: { showIndent: boolean }) {
  return (
    <Drawer.Provider>
      {props.showIndent && <Drawer.Indent data-testid="indent" />}
      <ProviderControls />
    </Drawer.Provider>
  );
}

describe('<Drawer.Provider />', () => {
  const { render } = createRenderer();

  it('stays active until every open drawer is closed or removed', async () => {
    const { setProps } = await render(
      <MultipleDrawers firstOpen={false} secondOpen={false} showSecond />,
    );
    const background = screen.getByTestId('background');

    expect(background).toHaveAttribute('data-inactive', '');

    await setProps({ firstOpen: true, secondOpen: false, showSecond: true });
    expect(background).toHaveAttribute('data-active', '');

    await setProps({ firstOpen: false, secondOpen: true, showSecond: true });
    expect(background).toHaveAttribute('data-active', '');

    await setProps({ firstOpen: false, secondOpen: true, showSecond: false });
    expect(background).toHaveAttribute('data-inactive', '');
  });

  it('ignores redundant registry updates without disturbing active state', async () => {
    const { user } = await render(
      <Drawer.Provider>
        <Drawer.IndentBackground data-testid="background" />
        <ProviderControls />
      </Drawer.Provider>,
    );
    const background = screen.getByTestId('background');

    await user.click(screen.getByRole('button', { name: 'Register open' }));
    expect(background).toHaveAttribute('data-active', '');

    await user.click(screen.getByRole('button', { name: 'Register open' }));
    await user.click(screen.getByRole('button', { name: 'Remove missing' }));
    expect(background).toHaveAttribute('data-active', '');

    await user.click(screen.getByRole('button', { name: 'Register closed' }));
    expect(background).toHaveAttribute('data-inactive', '');

    await user.click(screen.getByRole('button', { name: 'Remove registered' }));
    await user.click(screen.getByRole('button', { name: 'Remove registered' }));
    expect(background).toHaveAttribute('data-inactive', '');
  });

  it('synchronizes and restores visual state on Drawer.Indent', async () => {
    const { user, setProps } = await render(<VisualStateCase showIndent />);
    const indent = screen.getByTestId('indent');

    await user.click(screen.getByRole('button', { name: 'Set visual state' }));
    expect(indent.style.getPropertyValue('--drawer-swipe-progress')).toBe('0.5');
    expect(indent.style.getPropertyValue('--drawer-height')).toBe('120px');

    await user.click(screen.getByRole('button', { name: 'Clear progress' }));
    expect(indent.style.getPropertyValue('--drawer-swipe-progress')).toBe('0');
    expect(indent.style.getPropertyValue('--drawer-height')).toBe('120px');

    await user.click(screen.getByRole('button', { name: 'Clear height' }));
    expect(indent.style.getPropertyValue('--drawer-height')).toBe('');

    await user.click(screen.getByRole('button', { name: 'Set invalid visual state' }));
    expect(indent.style.getPropertyValue('--drawer-swipe-progress')).toBe('0');
    expect(indent.style.getPropertyValue('--drawer-height')).toBe('');

    await user.click(screen.getByRole('button', { name: 'Set visual state' }));
    await setProps({ showIndent: false });
    expect(indent.style.getPropertyValue('--drawer-swipe-progress')).toBe('0');
    expect(indent.style.getPropertyValue('--drawer-height')).toBe('');
  });

  it('allows indent parts to render without a provider', async () => {
    await render(
      <React.Fragment>
        <Drawer.Indent data-testid="indent" />
        <Drawer.IndentBackground data-testid="background" />
      </React.Fragment>,
    );

    expect(screen.getByTestId('indent')).toHaveAttribute('data-inactive', '');
    expect(screen.getByTestId('background')).toHaveAttribute('data-inactive', '');
  });
});
