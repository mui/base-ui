import { expect } from 'vitest';
import { Toast } from '@base-ui/react/toast';
import { createRenderer, describeConformance } from '#test-utils';
import { screen } from '@mui/internal-test-utils';
import { List, Button } from '../utils/test-utils';

const toast = {
  id: 'test',
  title: 'Toast title',
};

describe('<Toast.Title />', () => {
  const { render } = createRenderer();

  describeConformance(<Toast.Title>title</Toast.Title>, () => ({
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
    expect(rootElement).not.toBe(null);
    expect(rootElement.getAttribute('aria-labelledby')).toBe(titleId);
  });

  it('does not render if it has no children', async () => {
    function AddButton() {
      const { add } = Toast.useToastManager();
      return (
        <button type="button" onClick={() => add({ title: undefined })}>
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

    const titleElement = screen.queryByTestId('title');
    expect(titleElement).toBe(null);
  });

  it('renders the title by default', async () => {
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
    expect(titleElement).not.toBe(null);
    expect(titleElement.textContent).toBe('title');
  });

  it('renders content passed through the render prop', async () => {
    await render(
      <Toast.Provider>
        <Toast.Viewport>
          <Toast.Root toast={{ id: 'test' }}>
            <Toast.Title render={<div>render prop title</div>} />
          </Toast.Root>
        </Toast.Viewport>
      </Toast.Provider>,
    );

    expect(screen.getByText('render prop title')).not.toBe(null);
  });

  it('renders content passed through a render function', async () => {
    await render(
      <Toast.Provider>
        <Toast.Viewport>
          <Toast.Root toast={{ id: 'test' }}>
            <Toast.Title render={(props) => <div {...props}>render fn title</div>} />
          </Toast.Root>
        </Toast.Viewport>
      </Toast.Provider>,
    );

    expect(screen.getByText('render fn title')).not.toBe(null);
  });

  it('wires aria-labelledby to a title rendered through the render prop', async () => {
    await render(
      <Toast.Provider>
        <Toast.Viewport>
          <Toast.Root toast={{ id: 'test' }} data-testid="root">
            <Toast.Title render={<div>render prop title</div>} />
          </Toast.Root>
        </Toast.Viewport>
      </Toast.Provider>,
    );

    const titleElement = screen.getByText('render prop title');
    const rootElement = screen.getByTestId('root');
    expect(rootElement.getAttribute('aria-labelledby')).toBe(titleElement.id);
  });

  it('does not render a childless render prop when there is no content', async () => {
    await render(
      <Toast.Provider>
        <Toast.Viewport>
          <Toast.Root toast={{ id: 'test' }}>
            <Toast.Title render={<div data-testid="title-render" />} />
          </Toast.Root>
        </Toast.Viewport>
      </Toast.Provider>,
    );

    expect(screen.queryByTestId('title-render')).toBe(null);
  });

  it('renders a numeric render prop child such as 0', async () => {
    await render(
      <Toast.Provider>
        <Toast.Viewport>
          <Toast.Root toast={{ id: 'test' }}>
            <Toast.Title render={<div>{0}</div>} />
          </Toast.Root>
        </Toast.Viewport>
      </Toast.Provider>,
    );

    expect(screen.getByText('0')).not.toBe(null);
  });
});
