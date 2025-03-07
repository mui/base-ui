import * as React from 'react';
import { Toast } from '@base-ui-components/react/toast';
import { act, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { List, Button } from '../utils/test-utils';

const toast = {
  id: 'test',
  title: 'Toast title',
};

describe('<Toast.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Toast.Root toast={toast} />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Toast.Provider>
          <Toast.Viewport>{node}</Toast.Viewport>
        </Toast.Provider>,
      );
    },
  }));

  // requires :focus-visible check
  it.skipIf(isJSDOM)('closes when pressing escape', async () => {
    const { user } = await render(
      <Toast.Provider>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>,
    );

    const button = screen.getByRole('button', { name: 'add' });

    await act(async () => button.focus());
    await user.click(button);

    await user.keyboard('{F6}');
    await user.keyboard('{Tab}');
    await user.keyboard('{Escape}');

    expect(screen.queryByTestId('root')).to.equal(null);
  });
});
