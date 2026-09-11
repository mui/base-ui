import { expect, vi } from 'vitest';
import * as React from 'react';
import { screen, fireEvent } from '@mui/internal-test-utils';
import { Textarea } from '@base-ui/react/textarea';
import { Field } from '@base-ui/react/field';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Textarea.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Textarea.Root />, () => ({
    refInstanceof: window.HTMLTextAreaElement,
    render,
  }));

  it('renders a textarea element', async () => {
    await render(<Textarea.Root data-testid="textarea" />);
    expect(screen.getByTestId('textarea').tagName).toBe('TEXTAREA');
  });

  describe('uncontrolled', () => {
    it('uses defaultValue', async () => {
      await render(<Textarea.Root defaultValue="hello" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveValue('hello');
    });

    it('fires onValueChange on input', async () => {
      const onValueChange = vi.fn();
      await render(
        <Textarea.Root onValueChange={onValueChange} data-testid="textarea" />,
      );
      const textarea = screen.getByTestId('textarea');
      fireEvent.change(textarea, { target: { value: 'hello' } });
      expect(onValueChange).toHaveBeenCalledOnce();
      expect(onValueChange.mock.calls[0][0]).toBe('hello');
    });
  });

  describe('controlled', () => {
    it('reflects controlled value', async () => {
      function Controlled() {
        const [value, setValue] = React.useState('initial');
        return (
          <div>
            <Textarea.Root value={value} onValueChange={(v) => setValue(v)} data-testid="textarea" />
            <button type="button" onClick={() => setValue('updated')}>
              Update
            </button>
          </div>
        );
      }

      const { user } = await render(<Controlled />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveValue('initial');

      await user.click(screen.getByRole('button'));
      expect(textarea).toHaveValue('updated');
    });
  });

  describe('prop: disabled', () => {
    it('sets the disabled attribute', async () => {
      await render(<Textarea.Root disabled data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toBeDisabled();
    });
  });

  describe('prop: maxLength', () => {
    it('sets the maxlength attribute', async () => {
      await render(<Textarea.Root maxLength={100} data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('maxlength', '100');
    });
  });

  describe('Field integration', () => {
    it('works within Field.Root', async () => {
      await render(
        <Field.Root>
          <Field.Label>Comment</Field.Label>
          <Textarea.Root data-testid="textarea" />
        </Field.Root>,
      );

      const textarea = screen.getByTestId('textarea');
      const label = screen.getByText('Comment');
      expect(textarea).toHaveAttribute('aria-labelledby', label.id);
    });

    it('sets data-dirty when value changes', async () => {
      await render(
        <Field.Root>
          <Textarea.Root data-testid="textarea" />
        </Field.Root>,
      );

      const textarea = screen.getByTestId('textarea');
      expect(textarea).not.toHaveAttribute('data-dirty');

      fireEvent.change(textarea, { target: { value: 'changed' } });
      expect(textarea).toHaveAttribute('data-dirty', '');
    });

    it('sets data-touched on blur', async () => {
      await render(
        <Field.Root>
          <Textarea.Root data-testid="textarea" />
        </Field.Root>,
      );

      const textarea = screen.getByTestId('textarea');
      expect(textarea).not.toHaveAttribute('data-touched');

      fireEvent.focus(textarea);
      fireEvent.blur(textarea);
      expect(textarea).toHaveAttribute('data-touched', '');
    });

    it('sets data-focused on focus', async () => {
      await render(
        <Field.Root>
          <Textarea.Root data-testid="textarea" />
        </Field.Root>,
      );

      const textarea = screen.getByTestId('textarea');
      expect(textarea).not.toHaveAttribute('data-focused');

      fireEvent.focus(textarea);
      expect(textarea).toHaveAttribute('data-focused', '');
    });
  });
});
