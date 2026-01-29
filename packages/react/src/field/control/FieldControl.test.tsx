import { createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
import { Field } from '@base-ui/react/field';
import { expect } from 'chai';
import { describeConformance, isJSDOM } from '#test-utils';

describe('<Field.Control />', () => {
  const { render, renderToString } = createRenderer();
  const { render: renderNonStrict } = createRenderer({ strict: false });

  describeConformance(<Field.Control />, () => ({
    refInstanceof: window.HTMLInputElement,
    render(node) {
      return render(<Field.Root>{node}</Field.Root>);
    },
  }));

  it('avoids rerendering for uncontrolled input changes', async () => {
    const renderCountRef = { current: 0 };

    function RenderCountedControl() {
      renderCountRef.current += 1;
      return <Field.Control data-testid="control" />;
    }

    renderNonStrict(
      <Field.Root>
        <RenderCountedControl />
      </Field.Root>,
    );

    const control = screen.getByTestId('control');
    const initialRenderCount = renderCountRef.current;

    fireEvent.change(control, { target: { value: 'a' } });
    const afterFirstChange = renderCountRef.current;

    fireEvent.change(control, { target: { value: 'ab' } });
    fireEvent.change(control, { target: { value: 'abc' } });

    expect(renderCountRef.current).to.equal(afterFirstChange);
    expect(afterFirstChange).to.be.at.most(initialRenderCount + 1);
  });

  it.skipIf(isJSDOM)('should sync focused state when autoFocus is used with SSR', async () => {
    vi.spyOn(console, 'error')
      .mockName('console.error')
      .mockImplementation(() => {});

    function App() {
      return (
        <Field.Root data-testid="root">
          <Field.Label data-testid="label">Name</Field.Label>
          <Field.Control autoFocus />
        </Field.Root>
      );
    }

    const { hydrate } = renderToString(<App />);

    const control = screen.getByRole('textbox');
    expect(control).to.have.attribute('autofocus');

    // Simulate focused by browser before hydration
    control.focus();
    expect(control).to.equal(document.activeElement);

    hydrate();

    expect(screen.getByTestId('root')).to.have.attribute('data-focused', '');
    expect(control).to.have.attribute('data-focused', '');
    expect(screen.getByText('Name')).to.have.attribute('data-focused', '');
  });
});
