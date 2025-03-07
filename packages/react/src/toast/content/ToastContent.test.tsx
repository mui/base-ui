import * as React from 'react';
import { Toast } from '@base-ui-components/react/toast';
import { createRenderer, describeConformance } from '#test-utils';
import { fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { expect } from 'chai';

const toast = {
  id: 'test',
  title: 'Toast title',
};

describe('<Toast.Content />', () => {
  const { render } = createRenderer();

  describeConformance(<Toast.Content />, () => ({
    refInstanceof: window.HTMLDivElement,
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

  it('renders title and description inside role=status node one tick later', async () => {
    function Button() {
      const { add } = Toast.useToast();
      return (
        <button
          type="button"
          onClick={() => {
            add({
              title: 'title',
              description: 'description',
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
            <Toast.Title>{toastItem.title}</Toast.Title>
            <Toast.Description data-testid="description">{toastItem.description}</Toast.Description>
          </Toast.Content>
          <Toast.Close aria-label="close" />
        </Toast.Root>
      ));
    }

    await render(
      <Toast.Provider>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'add' }));

    const status = screen.getByRole('status');
    expect(status).not.to.have.text('titledescription');

    await waitFor(() => {
      expect(status).to.have.text('titledescription');
    });
  });
});
