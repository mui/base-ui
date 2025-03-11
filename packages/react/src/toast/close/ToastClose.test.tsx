import * as React from 'react';
import { Toast } from '@base-ui-components/react/toast';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { createRenderer, describeConformance } from '#test-utils';
import { List, Button } from '../utils/test-utils';

describe('<Toast.Close />', () => {
  const { render } = createRenderer();

  const toast: Toast.Root.ToastObject = {
    id: 'test',
    title: 'title',
  };

  describeConformance(<Toast.Close />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render(node) {
      return render(
        <Toast.Provider>
          <Toast.Viewport>
            <Toast.Root toast={toast}>{node}</Toast.Root>
          </Toast.Viewport>
        </Toast.Provider>,
      );
    },
  }));

  it('closes the toast when clicked', async () => {
    const { user } = await render(
      <Toast.Provider>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>,
    );

    const button = screen.getByRole('button', { name: 'add' });

    await user.click(button);

    expect(screen.getByTestId('title')).not.to.equal(null);

    const closeButton = screen.getByRole('button', { name: 'close' });

    await user.click(closeButton);

    expect(screen.queryByTestId('title')).to.equal(null);
  });
});
