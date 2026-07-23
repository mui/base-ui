import * as React from 'react';
import { expect } from 'vitest';
import { Toast } from '@base-ui/react/toast';
import { screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM } from '#test-utils';
import { ToastRootCssVars } from './root/ToastRootCssVars';
import { ToastRootDataAttributes } from './root/ToastRootDataAttributes';
import { ToastViewportCssVars } from './viewport/ToastViewportCssVars';
import { toastRootStateAttributesMapping } from './root/ToastRoot';
import { List, Button } from './utils/test-utils';

const toast: Toast.Root.ToastObject = {
  id: 'test',
  title: 'Toast title',
};

// The parts inline these enums' values instead of referencing the members, so
// nothing links the docs enums to runtime behavior. These tests re-link every
// inlined member so a rename to only one side fails CI. Test-only imports ship
// no production bytes.
describe('Toast enum sync', () => {
  const { render } = createRenderer();

  it('names the swipe direction attribute per ToastRootDataAttributes', () => {
    const emitted = toastRootStateAttributesMapping.swipeDirection!('left');
    expect(Object.keys(emitted!)[0]).toBe(ToastRootDataAttributes.swipeDirection);
  });

  it('names the group attribute per ToastRootDataAttributes', () => {
    const emitted = toastRootStateAttributesMapping.group!('top-right');
    expect(Object.keys(emitted!)[0]).toBe(ToastRootDataAttributes.group);
  });

  it('names the root CSS variables per ToastRootCssVars', async () => {
    const { user } = await render(
      <Toast.Provider>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'add' }));

    const root = screen.getByTestId('root');

    // Written unconditionally through the root `style` prop.
    expect(root.style.getPropertyValue(ToastRootCssVars.index)).not.toBe('');
    expect(root.style.getPropertyValue(ToastRootCssVars.offsetY)).not.toBe('');
    expect(root.style.getPropertyValue(ToastRootCssVars.swipeMovementX)).not.toBe('');
    expect(root.style.getPropertyValue(ToastRootCssVars.swipeMovementY)).not.toBe('');
  });

  it('names the positioner index CSS variable per ToastRootCssVars', async () => {
    await render(
      <Toast.Provider>
        <Toast.Positioner toast={toast} data-testid="positioner" />
      </Toast.Provider>,
    );

    expect(
      screen.getByTestId('positioner').style.getPropertyValue(ToastRootCssVars.index),
    ).not.toBe('');
  });

  it.skipIf(isJSDOM)(
    'names the measured height CSS variables per ToastRootCssVars and ToastViewportCssVars',
    async () => {
      const { user } = await render(
        <Toast.Provider>
          <Toast.Viewport data-testid="viewport">
            <List />
          </Toast.Viewport>
          <Button />
        </Toast.Provider>,
      );

      await user.click(screen.getByRole('button', { name: 'add' }));

      // Both variables appear once the toast height has been measured.
      await waitFor(() =>
        expect(screen.getByTestId('root').style.getPropertyValue(ToastRootCssVars.height)).not.toBe(
          '',
        ),
      );
      await waitFor(() =>
        expect(
          screen
            .getByTestId('viewport')
            .style.getPropertyValue(ToastViewportCssVars.frontmostHeight),
        ).not.toBe(''),
      );
    },
  );
});
