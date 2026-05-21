import { expect } from 'vitest';
import { Toast } from '@base-ui/react/toast';
import { fireEvent, screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

const toast: Toast.Root.ToastObject = {
  id: 'test',
  title: 'Toast title',
};

function AddToastButton() {
  const { add } = Toast.useToastManager();

  return (
    <button
      type="button"
      onClick={() => {
        add({
          title: 'Toast title',
        });
      }}
    >
      Add
    </button>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();

  return toasts.map((toastItem) => (
    <Toast.Root key={toastItem.id} toast={toastItem}>
      <Toast.Content data-testid="content">Content</Toast.Content>
    </Toast.Root>
  ));
}

describe('<Toast.Content />', () => {
  const { render } = createRenderer();

  describeConformance(<Toast.Content>content</Toast.Content>, () => ({
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

  it('has expanded and behind state attributes', async () => {
    const { user } = await render(
      <Toast.Provider>
        <Toast.Viewport>
          <ToastList />
        </Toast.Viewport>
        <AddToastButton />
      </Toast.Provider>,
    );

    const button = screen.getByRole('button', { name: 'Add' });
    await user.click(button);
    await user.click(button);

    const contents = await screen.findAllByTestId('content');
    expect(contents.some((content) => content.hasAttribute('data-behind'))).toBe(true);

    fireEvent.mouseEnter(contents[0].closest('[role="dialog"]') as HTMLElement);

    for (const content of contents) {
      expect(content).toHaveAttribute('data-expanded', '');
    }
  });
});
