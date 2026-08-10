import { expect } from 'vitest';
import * as React from 'react';
import { Field } from '@base-ui/react/field';
import { act, screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Field.Label />', () => {
  const { render } = createRenderer();
  const { render: renderNonStrict } = createRenderer({ strict: false });

  describeConformance(<Field.Label />, () => ({
    refInstanceof: window.HTMLLabelElement,
    testRenderPropWith: 'label',
    render(node) {
      return render(<Field.Root>{node}</Field.Root>);
    },
  }));

  it('should set htmlFor referencing the control automatically', async () => {
    await render(
      <Field.Root data-testid="field">
        <Field.Control />
        <Field.Label data-testid="label">Label</Field.Label>
      </Field.Root>,
    );

    expect(screen.getByTestId('label')).toHaveAttribute('for', screen.getByRole('textbox').id);
  });

  it('when nativeLabel={false}, clicking focuses the associated control', async () => {
    const { user } = await render(
      <Field.Root>
        <Field.Control data-testid="control" />
        <Field.Label nativeLabel={false} render={<div />} data-testid="label">
          Label
        </Field.Label>
      </Field.Root>,
    );

    const label = screen.getByTestId('label');
    const control = screen.getByTestId('control');

    expect(label).not.toHaveAttribute('for');

    await user.click(label);
    expect(control).toHaveFocus();
  });

  it('when nativeLabel={false}, clicking focuses a control inside a shadow root', async () => {
    const host = document.body.appendChild(document.createElement('div'));
    const shadowRoot = host.attachShadow({ mode: 'open' });
    const container = shadowRoot.appendChild(document.createElement('div'));

    try {
      const { user } = await render(
        <Field.Root>
          <Field.Control id="shadow-control" />
          <Field.Label nativeLabel={false} render={<span />} data-testid="label">
            Label
          </Field.Label>
        </Field.Root>,
        { container },
      );

      const label = shadowRoot.querySelector<HTMLElement>('[data-testid="label"]');
      const control = shadowRoot.getElementById('shadow-control');
      expect(label).not.toBe(null);
      expect(control).not.toBe(null);

      await user.click(label!);

      expect(shadowRoot.activeElement).toBe(control);
    } finally {
      await act(async () => {
        host.remove();
      });
    }
  });

  it('when nativeLabel={false}, clicking a nested button focuses the button', async () => {
    const { user } = await render(
      <Field.Root>
        <Field.Control data-testid="control" />
        <Field.Label nativeLabel={false} render={<div />}>
          <button type="button">inner</button>
        </Field.Label>
      </Field.Root>,
    );

    const button = screen.getByRole('button');

    await user.click(button);

    expect(button).toHaveFocus();
    expect(screen.getByTestId('control')).not.toHaveFocus();
  });

  it('when nativeLabel={false}, clicking a nested link focuses the link', async () => {
    const { user } = await render(
      <Field.Root>
        <Field.Control data-testid="control" />
        <Field.Label nativeLabel={false} render={<div />}>
          <a href="#anchor">inner</a>
        </Field.Label>
      </Field.Root>,
    );

    const link = screen.getByRole('link');

    await user.click(link);

    expect(link).toHaveFocus();
    expect(screen.getByTestId('control')).not.toHaveFocus();
  });

  it('when nativeLabel={false}, clicking focuses the control inside a focusable ancestor', async () => {
    const { user } = await render(
      <div tabIndex={0}>
        <Field.Root>
          <Field.Control data-testid="control" />
          <Field.Label nativeLabel={false} render={<span />} data-testid="label">
            Label
          </Field.Label>
        </Field.Root>
      </div>,
    );

    await user.click(screen.getByTestId('label'));

    expect(screen.getByTestId('control')).toHaveFocus();
  });

  describe('control selection', () => {
    function Fields(props: { first?: boolean; second?: boolean }) {
      const { first = true, second = true } = props;
      return (
        <Field.Root>
          {first && <Field.Control id="a" />}
          {second && <Field.Control id="b" />}
          <Field.Label data-testid="label">Label</Field.Label>
        </Field.Root>
      );
    }

    it('keeps the selected control id when another control unmounts', async () => {
      const { rerender } = await renderNonStrict(<Fields />);

      expect(screen.getByTestId('label')).toHaveAttribute('for', 'a');

      await rerender(<Fields second={false} />);

      expect(screen.getByTestId('label')).toHaveAttribute('for', 'a');
    });

    it('falls over to the remaining control when the selected one unmounts', async () => {
      const { rerender } = await renderNonStrict(<Fields />);

      expect(screen.getByTestId('label')).toHaveAttribute('for', 'a');

      await rerender(<Fields first={false} />);

      expect(screen.getByTestId('label')).toHaveAttribute('for', 'b');
    });
  });

  it('reflects the disabled state from Field.Item', async () => {
    await render(
      <Field.Root>
        <Field.Item disabled>
          <Field.Label data-testid="label">Label</Field.Label>
        </Field.Item>
      </Field.Root>,
    );

    expect(screen.getByTestId('label')).toHaveAttribute('data-disabled');
  });

  describe('dev warnings', () => {
    it('does not warn by default', async () => {
      const errorSpy = vi
        .spyOn(console, 'error')
        .mockName('console.error')
        .mockImplementation(() => {});

      await render(
        <Field.Root>
          <Field.Control />
          <Field.Label>Label</Field.Label>
        </Field.Root>,
      );

      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('does not warn when the render function returns no element', async () => {
      const errorSpy = vi
        .spyOn(console, 'error')
        .mockName('console.error')
        .mockImplementation(() => {});

      const EmptyLabel = React.forwardRef(function EmptyLabel() {
        return null;
      });

      await render(
        <Field.Root>
          <Field.Label render={<EmptyLabel />}>Label</Field.Label>
        </Field.Root>,
      );

      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('errors if nativeLabel=true but ref is not a label', async () => {
      const errorSpy = vi
        .spyOn(console, 'error')
        .mockName('console.error')
        .mockImplementation(() => {});

      try {
        await render(
          <Field.Root>
            <Field.Control />
            <Field.Label nativeLabel render={<div />}>
              Label
            </Field.Label>
          </Field.Root>,
        );

        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            'Base UI: <Field.Label> expected a <label> element because the `nativeLabel` prop is true. ' +
              'Rendering a non-<label> disables native label association, so `htmlFor` will not ' +
              'work. Use a real <label> in the `render` prop, or set `nativeLabel` to `false`.',
          ),
        );
      } finally {
        errorSpy.mockRestore();
      }
    });

    it('errors if nativeLabel=false but ref is a label', async () => {
      const errorSpy = vi
        .spyOn(console, 'error')
        .mockName('console.error')
        .mockImplementation(() => {});

      try {
        await render(
          <Field.Root>
            <Field.Control />
            <Field.Label nativeLabel={false}>Label</Field.Label>
          </Field.Root>,
        );

        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            'Base UI: <Field.Label> expected a non-<label> element because the `nativeLabel` prop is false. ' +
              'Rendering a <label> assumes native label behavior while Base UI treats it as ' +
              'non-native, which can cause unexpected pointer behavior. Use a non-<label> in the ' +
              '`render` prop, or set `nativeLabel` to `true`.',
          ),
        );
      } finally {
        errorSpy.mockRestore();
      }
    });
  });
});
