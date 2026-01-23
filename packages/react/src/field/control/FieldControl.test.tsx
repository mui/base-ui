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

  describe('style hooks', () => {
    describe('touched', () => {
      it('should apply [data-touched] style hook when focused and blurred', async () => {
        await render(<Field.Control data-testid="control" />);

        const control = screen.getByTestId('control');

        expect(control).not.to.have.attribute('data-touched');

        fireEvent.focus(control);
        fireEvent.blur(control);

        expect(control).to.have.attribute('data-touched', '');
      });

      it('should remain touched after regaining and losing focus', async () => {
        await render(<Field.Control data-testid="control" />);

        const control = screen.getByTestId('control');

        fireEvent.focus(control);
        fireEvent.blur(control);

        expect(control).to.have.attribute('data-touched', '');

        fireEvent.focus(control);
        expect(control).to.have.attribute('data-touched', '');

        fireEvent.blur(control);
        expect(control).to.have.attribute('data-touched', '');
      });
    });

    describe('dirty', () => {
      it('should apply [data-dirty] style hook when value changes', async () => {
        await render(<Field.Control data-testid="control" />);

        const control = screen.getByTestId('control');
        expect(control).not.to.have.attribute('data-dirty');

        fireEvent.change(control, { target: { value: 'value' } });
        expect(control).to.have.attribute('data-dirty', '');

        fireEvent.change(control, { target: { value: '' } });
        expect(control).not.to.have.attribute('data-dirty');
      });

      it('should not be dirty when changing back to the initial value', async () => {
        await render(<Field.Control data-testid="control" defaultValue="initial" />);

        const control = screen.getByTestId('control');
        expect(control).not.to.have.attribute('data-dirty');

        fireEvent.change(control, { target: { value: 'changed' } });
        expect(control).to.have.attribute('data-dirty', '');

        fireEvent.change(control, { target: { value: 'initial' } });
        expect(control).not.to.have.attribute('data-dirty');
      });
    });

    describe('filled', () => {
      it('should apply [data-filled] style hook when filled', async () => {
        await render(<Field.Control data-testid="control" />);

        const control = screen.getByTestId('control');
        expect(control).not.to.have.attribute('data-filled');

        fireEvent.change(control, { target: { value: 'value' } });
        expect(control).to.have.attribute('data-filled', '');

        fireEvent.change(control, { target: { value: '' } });
        expect(control).not.to.have.attribute('data-filled');
      });
    });

    describe('focused', () => {
      it('should apply [data-focused] style hook when focused', async () => {
        await render(<Field.Control data-testid="control" />);

        const control = screen.getByTestId('control');
        expect(control).not.to.have.attribute('data-focused');

        fireEvent.focus(control);
        expect(control).to.have.attribute('data-focused', '');

        fireEvent.blur(control);
        expect(control).not.to.have.attribute('data-focused');
      });
    });
  });
});
