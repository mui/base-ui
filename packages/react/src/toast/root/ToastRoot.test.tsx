import * as React from 'react';
import { Toast } from '@base-ui-components/react/toast';
import { act, screen, fireEvent, waitFor } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { List, Button } from '../utils/test-utils';

const toast: Toast.Root.ToastObject = {
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

  it('renders title and description inside role=status node one tick later', async () => {
    function AccessibilityTestButton() {
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

    function AccessibilityTestList() {
      return Toast.useToast().toasts.map((toastItem) => (
        <Toast.Root key={toastItem.id} toast={toastItem} data-testid="root">
          <Toast.Title>{toastItem.title}</Toast.Title>
          <Toast.Description data-testid="description">{toastItem.description}</Toast.Description>
          <Toast.Close aria-label="close" />
        </Toast.Root>
      ));
    }

    await render(
      <Toast.Provider>
        <Toast.Viewport>
          <AccessibilityTestList />
        </Toast.Viewport>
        <AccessibilityTestButton />
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
