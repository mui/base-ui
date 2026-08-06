import * as React from 'react';
import { expect, vi } from 'vitest';
import { act, createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
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

    renderNonStrict(
      <Field.Root>
        <Field.Control
          data-testid="control"
          render={(props) => {
            renderCountRef.current += 1;
            return <input {...props} />;
          }}
        />
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

  it('renders once per keystroke for controlled input changes', async () => {
    const renderCountRef = { current: 0 };

    function App() {
      const [value, setValue] = React.useState('');
      return (
        <Field.Root>
          <Field.Control
            data-testid="control"
            value={value}
            onValueChange={setValue}
            render={(props) => {
              renderCountRef.current += 1;
              return <input {...props} />;
            }}
          />
        </Field.Root>
      );
    }

    renderNonStrict(<App />);

    const control = screen.getByTestId('control');

    // The first keystroke also flips dirty and filled, so measure the steady state after it.
    fireEvent.change(control, { target: { value: 'a' } });
    const settledRenderCount = renderCountRef.current;

    fireEvent.change(control, { target: { value: 'ab' } });
    fireEvent.change(control, { target: { value: 'abc' } });

    // The controlled echo must not schedule a second render per keystroke.
    expect(renderCountRef.current).toBe(settledRenderCount + 2);
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

  it('validates once when a controlled value is changed by the user', async () => {
    const validate = vi.fn(() => null);

    function App() {
      const [value, setValue] = React.useState('');
      return (
        <Field.Root validationMode="onChange" validate={validate}>
          <Field.Control value={value} onValueChange={setValue} />
        </Field.Root>
      );
    }

    await render(<App />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a' } });

    expect(validate).toHaveBeenCalledTimes(1);
  });

  it('clears dirty state when a numeric controlled value returns to its initial value', async () => {
    function App() {
      const [value, setValue] = React.useState(5);
      return (
        <Field.Root data-testid="root">
          <Field.Control value={value} onValueChange={(nextValue) => setValue(Number(nextValue))} />
        </Field.Root>
      );
    }

    await render(<App />);

    const root = screen.getByTestId('root');
    const control = screen.getByRole('textbox');

    expect(root).not.toHaveAttribute('data-dirty');

    fireEvent.change(control, { target: { value: '56' } });

    expect(root).toHaveAttribute('data-dirty', '');

    fireEvent.change(control, { target: { value: '5' } });

    expect(root).not.toHaveAttribute('data-dirty');
  });

  it('syncs state and validates when the controlled value changes programmatically', async () => {
    const validate = vi.fn((_value: unknown) => null);

    function App() {
      const [value, setValue] = React.useState('');
      return (
        <Field.Root data-testid="root" validationMode="onChange" validate={validate}>
          <Field.Control value={value} onValueChange={setValue} />
          <button type="button" onClick={() => setValue('external')}>
            set
          </button>
        </Field.Root>
      );
    }

    await render(<App />);

    fireEvent.click(screen.getByRole('button'));

    const root = screen.getByTestId('root');

    expect(root).toHaveAttribute('data-filled', '');
    expect(root).toHaveAttribute('data-dirty', '');
    expect(validate).toHaveBeenCalledTimes(1);
    expect(validate.mock.lastCall?.[0]).toBe('external');
  });

  it('sets filled state on mount when the control is prefilled', async () => {
    await render(
      <Field.Root data-testid="root">
        <Field.Control defaultValue="foo" />
      </Field.Root>,
    );

    expect(screen.getByTestId('root')).toHaveAttribute('data-filled', '');
  });

  it('does not set filled state on mount for an empty controlled value', async () => {
    await render(
      <Field.Root data-testid="root">
        <Field.Control value="" onValueChange={() => {}} />
      </Field.Root>,
    );

    expect(screen.getByTestId('root')).not.toHaveAttribute('data-filled');
  });

  it('does not validate when the change is canceled', async () => {
    const validate = vi.fn(() => null);

    await render(
      <Field.Root validationMode="onChange" validate={validate}>
        <Field.Control onValueChange={(value, details) => details.cancel()} />
      </Field.Root>,
    );

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a' } });

    expect(validate).not.toHaveBeenCalled();
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

  it.skipIf(isJSDOM)('validates once when Enter implicitly submits a form', async () => {
    const { userEvent } = await import('vitest/browser');
    const user = userEvent.setup();
    const validate = vi.fn(() => null);
    const handleSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());

    await render(
      <Form onSubmit={handleSubmit}>
        <Field.Root validate={validate}>
          <Field.Control defaultValue="a" />
        </Field.Root>
        <button type="submit">submit</button>
      </Form>,
    );

    const control = screen.getByRole<HTMLInputElement>('textbox');

    await act(() => user.type(control, '[Enter]'));

    expect(validate).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it.skipIf(isJSDOM)('validates when Enter does not implicitly submit the form', async () => {
    const { userEvent } = await import('vitest/browser');
    const user = userEvent.setup();
    const validate = vi.fn(() => null);
    const handleSubmit = vi.fn();

    await render(
      <Form onSubmit={handleSubmit}>
        <Field.Root validate={validate}>
          <Field.Control defaultValue="a" />
        </Field.Root>
        <input />
      </Form>,
    );

    const control = screen.getByDisplayValue<HTMLInputElement>('a');

    await act(() => user.type(control, '[Enter]'));

    expect(validate).toHaveBeenCalledTimes(1);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it.skipIf(isJSDOM)('validates the latest value when Enter does not submit the form', async () => {
    const { userEvent } = await import('vitest/browser');
    const user = userEvent.setup();
    const validate = vi.fn((_value: unknown) => null);

    function App() {
      const [value, setValue] = React.useState('a');
      return (
        <Form onKeyDown={() => setValue('')}>
          <Field.Root validate={validate}>
            <Field.Control value={value} onValueChange={setValue} />
          </Field.Root>
          <input />
        </Form>
      );
    }

    await render(<App />);

    await act(() => user.type(screen.getByDisplayValue('a'), '[Enter]'));

    expect(validate).toHaveBeenCalledTimes(1);
    expect(validate.mock.lastCall?.[0]).toBe('');
  });

  it('validates when Enter is pressed outside a form', async () => {
    const validate = vi.fn(() => null);

    await render(
      <Field.Root validate={validate}>
        <Field.Control defaultValue="a" />
      </Field.Root>,
    );

    const control = screen.getByRole('textbox');
    act(() => control.focus());
    fireEvent.keyDown(control, { key: 'Enter' });

    expect(validate).toHaveBeenCalledTimes(1);
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
    it('updates the label association when the control is swapped', async () => {
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

      await renderNonStrict(<App />);

      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'a');
      expect(screen.getByTestId('label')).toHaveAttribute('for', 'a');

      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'b');
      expect(screen.getByTestId('label')).toHaveAttribute('for', 'b');
    });
  });
});
