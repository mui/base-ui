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
  });

  describe('focused state ownership', () => {
    it('releases the focused state when the focused control unmounts', async () => {
      function TestCase() {
        const [mounted, setMounted] = React.useState(true);

        return (
          <Field.Root data-testid="root">
            {mounted && <Field.Control />}
            <button type="button" onClick={() => setMounted(false)}>
              Remove
            </button>
          </Field.Root>
        );
      }

      await render(<TestCase />);

      fireEvent.focus(screen.getByRole('textbox'));
      expect(screen.getByTestId('root')).toHaveAttribute('data-focused', '');

      fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

      expect(screen.getByTestId('root')).not.toHaveAttribute('data-focused');
    });

    it('does not let a blurred control release the focused state of another control', async () => {
      function TestCase() {
        const [mounted, setMounted] = React.useState(true);

        return (
          <Field.Root data-testid="root">
            {mounted && <Field.Control data-testid="first" />}
            <Field.Control data-testid="second" />
            <button type="button" onClick={() => setMounted(false)}>
              Remove first
            </button>
          </Field.Root>
        );
      }

      await render(<TestCase />);

      fireEvent.focus(screen.getByTestId('first'));
      fireEvent.blur(screen.getByTestId('first'));
      fireEvent.focus(screen.getByTestId('second'));
      expect(screen.getByTestId('root')).toHaveAttribute('data-focused', '');

      fireEvent.click(screen.getByRole('button', { name: 'Remove first' }));

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
});
