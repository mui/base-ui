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

  describe('filled state ownership', () => {
    it('publishes an empty state when a filled control is replaced by a fresh one', async () => {
      function TestCase() {
        const [instance, setInstance] = React.useState(0);

        return (
          <Field.Root data-testid="root">
            <Field.Control key={instance} />
            <button type="button" onClick={() => setInstance(1)}>
              Replace
            </button>
          </Field.Root>
        );
      }

      await render(<TestCase />);

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a' } });
      expect(screen.getByTestId('root')).toHaveAttribute('data-filled', '');

      fireEvent.click(screen.getByRole('button', { name: 'Replace' }));

      expect(screen.getByRole('textbox')).toHaveValue('');
      expect(screen.getByTestId('root')).not.toHaveAttribute('data-filled');
    });

    it('does not let a superseded control clear the active control state', async () => {
      function TestCase() {
        const [value, setValue] = React.useState('a');

        return (
          <Field.Root data-testid="root">
            <Field.Control value={value} onValueChange={setValue} />
            <Field.Control defaultValue="filled" />
            <button type="button" onClick={() => setValue('')}>
              Clear first
            </button>
          </Field.Root>
        );
      }

      await render(<TestCase />);

      expect(screen.getByTestId('root')).toHaveAttribute('data-filled', '');

      fireEvent.click(screen.getByRole('button', { name: 'Clear first' }));

      expect(screen.getByTestId('root')).toHaveAttribute('data-filled', '');
    });

    it('keeps the active control readable after a superseded control unmounts', async () => {
      const validate = vi.fn<(value: unknown) => string | null>(() => null);

      function TestCase() {
        const actionsRef = React.useRef<Field.Root.Actions>(null);
        const [oldMounted, setOldMounted] = React.useState(true);

        return (
          <div>
            <Field.Root validate={validate} actionsRef={actionsRef}>
              {oldMounted && <Field.Control key="old" defaultValue="old" />}
              <Field.Control key="new" defaultValue="new" />
            </Field.Root>
            <button type="button" onClick={() => setOldMounted(false)}>
              Unmount old
            </button>
            <button type="button" onClick={() => actionsRef.current?.validate()}>
              Validate
            </button>
          </div>
        );
      }

      await render(<TestCase />);

      fireEvent.click(screen.getByRole('button', { name: 'Unmount old' }));
      fireEvent.click(screen.getByRole('button', { name: 'Validate' }));

      expect(validate).toHaveBeenCalledTimes(1);
      expect(validate.mock.lastCall?.[0]).toBe('new');
    });

    it('lets a remaining control publish after the owning control unmounts', async () => {
      function TestCase() {
        const [value, setValue] = React.useState('a');
        const [mounted, setMounted] = React.useState(true);

        return (
          <Field.Root data-testid="root">
            <Field.Control value={value} onValueChange={setValue} />
            {mounted && <Field.Control defaultValue="filled" />}
            <button type="button" onClick={() => setMounted(false)}>
              Unmount second
            </button>
            <button type="button" onClick={() => setValue('')}>
              Clear first
            </button>
          </Field.Root>
        );
      }

      await render(<TestCase />);

      expect(screen.getByTestId('root')).toHaveAttribute('data-filled', '');

      fireEvent.click(screen.getByRole('button', { name: 'Unmount second' }));
      fireEvent.click(screen.getByRole('button', { name: 'Clear first' }));

      expect(screen.getByTestId('root')).not.toHaveAttribute('data-filled');
    });

    it('releases data-filled as soon as the filled owner unmounts', async () => {
      function App(props: { showSecond?: boolean }) {
        const { showSecond = true } = props;
        return (
          <Field.Root data-testid="root">
            <Field.Control />
            {showSecond && <Field.Control defaultValue="filled" />}
          </Field.Root>
        );
      }

      const { setProps } = await render(<App />);

      expect(screen.getByTestId('root')).toHaveAttribute('data-filled', '');

      await setProps({ showSecond: false });

      expect(screen.getByTestId('root')).not.toHaveAttribute('data-filled');
    });

    it('lets an uncontrolled survivor republish after the owner unmounts', async () => {
      function App(props: { showSecond?: boolean }) {
        const { showSecond = true } = props;
        return (
          <Field.Root data-testid="root">
            <Field.Control defaultValue="survivor" />
            {showSecond && <Field.Control />}
          </Field.Root>
        );
      }

      const { setProps } = await render(<App />);

      expect(screen.getByTestId('root')).not.toHaveAttribute('data-filled');

      await setProps({ showSecond: false });

      expect(screen.getByTestId('root')).toHaveAttribute('data-filled', '');
    });
  });

  describe('[data-focused]', () => {
    function Controls(props: {
      firstMounted?: boolean;
      firstDisabled?: boolean;
      secondMounted?: boolean;
    }) {
      const { firstMounted = true, firstDisabled = false, secondMounted = false } = props;
      return (
        <Field.Root data-testid="root">
          <Field.Label data-testid="label">Name</Field.Label>
          {firstMounted && <Field.Control data-testid="first" disabled={firstDisabled} />}
          {secondMounted && <Field.Control data-testid="second" />}
        </Field.Root>
      );
    }

    it('is removed when the focused control becomes disabled', async () => {
      const { setProps } = await render(<Controls />);

      const control = screen.getByTestId('first');
      act(() => {
        control.focus();
      });

      expect(screen.getByTestId('root')).toHaveAttribute('data-focused', '');
      expect(control).toHaveAttribute('data-focused', '');

      await setProps({ firstDisabled: true });

      expect(screen.getByTestId('root')).not.toHaveAttribute('data-focused');
      expect(control).not.toHaveAttribute('data-focused');
      expect(screen.getByTestId('label')).not.toHaveAttribute('data-focused');
    });

    it('is removed when the focused control unmounts', async () => {
      const { setProps } = await render(<Controls />);

      act(() => {
        screen.getByTestId('first').focus();
      });

      expect(screen.getByTestId('root')).toHaveAttribute('data-focused', '');

      await setProps({ firstMounted: false });

      expect(screen.getByTestId('root')).not.toHaveAttribute('data-focused');
      expect(screen.getByTestId('label')).not.toHaveAttribute('data-focused');
    });

    it('is kept when a different control in the field is disabled or unmounted', async () => {
      const { setProps } = await render(<Controls secondMounted />);

      const second = screen.getByTestId('second');
      act(() => {
        second.focus();
      });

      expect(screen.getByTestId('root')).toHaveAttribute('data-focused', '');

      await setProps({ firstDisabled: true });

      expect(screen.getByTestId('root')).toHaveAttribute('data-focused', '');
      expect(second).toHaveAttribute('data-focused', '');

      await setProps({ firstMounted: false });

      expect(screen.getByTestId('root')).toHaveAttribute('data-focused', '');
      expect(second).toHaveAttribute('data-focused', '');
    });

    // A control that blurred earlier must not release state that focus has since moved to.
    it('does not let a blurred control release the focused state of another control', async () => {
      const { setProps } = await render(<Controls secondMounted />);

      const first = screen.getByTestId('first');
      const second = screen.getByTestId('second');

      act(() => {
        first.focus();
      });
      act(() => {
        second.focus();
      });

      expect(screen.getByTestId('root')).toHaveAttribute('data-focused', '');

      await setProps({ firstMounted: false });

      expect(screen.getByTestId('root')).toHaveAttribute('data-focused', '');
    });
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
