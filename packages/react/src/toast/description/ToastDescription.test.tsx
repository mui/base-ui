import { Toast } from '@base-ui/react/toast';
import { createRenderer, describeConformance } from '#test-utils';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { List, Button } from '../utils/test-utils';

const toast: Toast.Root.ToastObject = {
  id: 'test',
  title: 'Toast title',
};

describe('<Toast.Description />', () => {
  const { render } = createRenderer();

  describeConformance(<Toast.Description>description</Toast.Description>, () => ({
    refInstanceof: window.HTMLParagraphElement,
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

  it('adds aria-describedby to the root element', async () => {
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

    const descriptionElement = screen.getByTestId('description');
    const descriptionId = descriptionElement.id;

    const rootElement = screen.getByTestId('root');
    expect(rootElement).not.to.equal(null);
    expect(rootElement.getAttribute('aria-describedby')).to.equal(descriptionId);
  });

  it('does not render if it has no children', async () => {
    function AddButton() {
      const { add } = Toast.useToastManager();
      return (
        <button type="button" onClick={() => add({ description: undefined })}>
          add
        </button>
      );
    }

    const { user } = await render(
      <Toast.Provider>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
        <AddButton />
      </Toast.Provider>,
    );

    const button = screen.getByRole('button', { name: 'add' });
    await user.click(button);

    const descriptionElement = screen.queryByTestId('description');
    expect(descriptionElement).to.equal(null);
  });

  it('renders the description by default', async () => {
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

    const titleElement = screen.getByTestId('description');
    expect(titleElement).not.to.equal(null);
    expect(titleElement.textContent).to.equal('description');
  });
});
