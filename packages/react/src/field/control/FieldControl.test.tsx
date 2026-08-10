import { expect, vi } from 'vitest';
import * as React from 'react';
import { createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
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

    expect(renderCountRef.current).toBe(afterFirstChange);
    expect(afterFirstChange).toBeLessThanOrEqual(initialRenderCount + 1);
  });

  it('validates once when changed by the user', async () => {
    const validate = vi.fn();

    await render(
      <Field.Root validationMode="onChange" validate={validate}>
        <Field.Control />
      </Field.Root>,
    );

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a' } });

    expect(validate).toHaveBeenCalledTimes(1);
    expect(validate.mock.lastCall?.[0]).toBe('a');
  });

  it('does not clear errors or validate when change is prevented', async () => {
    const validate = vi.fn();
    const handleValueChange = vi.fn();

    await render(
      <Form errors={{ message: 'Server error' }}>
        <Field.Root name="message" validationMode="onChange" validate={validate}>
          <Field.Control onValueChange={handleValueChange} />
          <Field.Error />
        </Field.Root>
      </Form>,
    );

    const control = screen.getByRole<HTMLInputElement>('textbox');
    control.addEventListener('input', (event) => event.preventDefault(), {
      capture: true,
      once: true,
    });
    fireEvent.input(control, { cancelable: true, target: { value: 'a' } });

    expect(handleValueChange).toHaveBeenCalledTimes(1);
    expect(validate).not.toHaveBeenCalled();
    expect(screen.getByText('Server error')).toBeInTheDocument();
  });

  it('shows a required error when a prefilled value is cleared', async () => {
    await render(
      <Field.Root validationMode="onChange">
        <Field.Control data-testid="control" defaultValue="value" required />
        <Field.Error match="valueMissing">Required</Field.Error>
      </Field.Root>,
    );

    const control = screen.getByTestId('control');

    fireEvent.change(control, { target: { value: '' } });

    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Required')).toBeInTheDocument();
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
    expect(control).toHaveAttribute('autofocus');

    // Simulate focused by browser before hydration
    control.focus();
    expect(control).toBe(document.activeElement);

    hydrate();

    expect(screen.getByTestId('root')).toHaveAttribute('data-focused', '');
    expect(control).toHaveAttribute('data-focused', '');
    expect(screen.getByText('Name')).toHaveAttribute('data-focused', '');
  });

  describe('id', () => {
    it('associates the label with the control when server-side rendering', () => {
      renderToString(
        <Field.Root>
          <Field.Label>Label</Field.Label>
          <Field.Control id="custom-id" />
        </Field.Root>,
      );

      const control = screen.getByRole('textbox');
      expect(control.id).not.toBe('');
      expect(screen.getByText('Label')).toHaveAttribute('for', control.id);
    });

    it('applies the explicit id on the first client render', () => {
      renderNonStrict(
        <Field.Root>
          <Field.Control id="explicit" />
        </Field.Root>,
      );

      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'explicit');
    });

    it('updates the label association when the control is swapped', () => {
      function App() {
        const [controlKey, setControlKey] = React.useState('a');
        return (
          <React.Fragment>
            <Field.Root>
              <Field.Label data-testid="label">Label</Field.Label>
              <Field.Control key={controlKey} id={controlKey} />
            </Field.Root>
            <button onClick={() => setControlKey('b')}>swap</button>
          </React.Fragment>
        );
      }

      renderNonStrict(<App />);

      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'a');
      expect(screen.getByTestId('label')).toHaveAttribute('for', 'a');

      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'b');
      expect(screen.getByTestId('label')).toHaveAttribute('for', 'b');
    });

    it('keeps the label associated when an explicit id control is replaced by one without an id', async () => {
      function App() {
        const [explicit, setExplicit] = React.useState(true);
        return (
          <React.Fragment>
            <Field.Root>
              <Field.Label data-testid="label">Label</Field.Label>
              {explicit ? <Field.Control key="a" id="custom" /> : <Field.Control key="b" />}
            </Field.Root>
            <button onClick={() => setExplicit(false)}>swap</button>
          </React.Fragment>
        );
      }

      const { user } = await renderNonStrict(<App />);

      expect(screen.getByTestId('label')).toHaveAttribute('for', 'custom');

      fireEvent.click(screen.getByRole('button'));

      const control = screen.getByRole('textbox');
      expect(control.id).not.toBe('');
      expect(screen.getByTestId('label')).toHaveAttribute('for', control.id);

      await user.click(screen.getByTestId('label'));

      expect(control).toHaveFocus();
    });
  });
});
