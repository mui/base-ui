import * as React from 'react';
import { Toast } from '@base-ui-components/react/toast';
import { createRenderer, describeConformance } from '#test-utils';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';

const toast = {
  id: 'test',
  title: 'Toast title',
};

describe('<Toast.Title />', () => {
  const { render } = createRenderer();

  describeConformance(<Toast.Title />, () => ({
    refInstanceof: window.HTMLHeadingElement,
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

  it('adds aria-labelledby to the root element', async () => {
    function Button() {
      const { add } = Toast.useToast();
      return (
        <button
          type="button"
          onClick={() => {
            add({
              title: 'title',
            });
          }}
        >
          add
        </button>
      );
    }

    function List() {
      return Toast.useToast().toasts.map((toastItem) => (
        <Toast.Root key={toastItem.id} toast={toastItem} data-testid="root">
          <Toast.Content>
            <Toast.Title data-testid="title">{toastItem.title}</Toast.Title>
          </Toast.Content>
          <Toast.Close aria-label="close" />
        </Toast.Root>
      ));
    }

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

    const titleElement = screen.getByTestId('title');
    const titleId = titleElement.id;

    const rootElement = screen.getByTestId('root');
    expect(rootElement).to.not.equal(null);
    expect(rootElement.getAttribute('aria-labelledby')).to.equal(titleId);
  });
});
