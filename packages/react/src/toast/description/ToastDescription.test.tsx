import { expect } from 'vitest';
import { Toast } from '@base-ui/react/toast';
import { createRenderer, describeConformance } from '#test-utils';
import { screen } from '@mui/internal-test-utils';
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
    expect(rootElement).not.toBe(null);
    expect(rootElement.getAttribute('aria-describedby')).toBe(descriptionId);
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
    expect(descriptionElement).toBe(null);
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
    expect(titleElement).not.toBe(null);
    expect(titleElement.textContent).toBe('description');
  });

  it('renders content passed through the render prop', async () => {
    await render(
      <Toast.Provider>
        <Toast.Viewport>
          <Toast.Root toast={toast}>
            <Toast.Description render={<div>render prop description</div>} />
          </Toast.Root>
        </Toast.Viewport>
      </Toast.Provider>,
    );

    expect(screen.getByText('render prop description')).not.toBe(null);
  });

  it('renders content passed through a render function', async () => {
    await render(
      <Toast.Provider>
        <Toast.Viewport>
          <Toast.Root toast={toast}>
            <Toast.Description render={(props) => <div {...props}>render fn description</div>} />
          </Toast.Root>
        </Toast.Viewport>
      </Toast.Provider>,
    );

    expect(screen.getByText('render fn description')).not.toBe(null);
  });

  it('wires aria-describedby to a description rendered through the render prop', async () => {
    await render(
      <Toast.Provider>
        <Toast.Viewport>
          <Toast.Root toast={toast} data-testid="root">
            <Toast.Description render={<div>render prop description</div>} />
          </Toast.Root>
        </Toast.Viewport>
      </Toast.Provider>,
    );

    const descriptionElement = screen.getByText('render prop description');
    const rootElement = screen.getByTestId('root');
    expect(rootElement.getAttribute('aria-describedby')).toBe(descriptionElement.id);
  });

  it('does not render a childless render prop when there is no content', async () => {
    await render(
      <Toast.Provider>
        <Toast.Viewport>
          <Toast.Root toast={toast}>
            <Toast.Description render={<div data-testid="description-render" />} />
          </Toast.Root>
        </Toast.Viewport>
      </Toast.Provider>,
    );

    expect(screen.queryByTestId('description-render')).toBe(null);
  });

  it('renders a numeric render prop child such as 0', async () => {
    await render(
      <Toast.Provider>
        <Toast.Viewport>
          <Toast.Root toast={toast}>
            <Toast.Description render={<div>{0}</div>} />
          </Toast.Root>
        </Toast.Viewport>
      </Toast.Provider>,
    );

    expect(screen.getByText('0')).not.toBe(null);
  });
});
