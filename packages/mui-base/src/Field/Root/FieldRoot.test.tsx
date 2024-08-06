import * as React from 'react';
import * as Field from '@base_ui/react/Field';
import * as Checkbox from '@base_ui/react/Checkbox';
import * as Switch from '@base_ui/react/Switch';
import * as NumberField from '@base_ui/react/NumberField';
import {
  act,
  createRenderer,
  fireEvent,
  flushMicrotasks,
  screen,
  waitFor,
} from '@mui/internal-test-utils';
import { expect } from 'chai';
import { describeConformance } from '../../../test/describeConformance';

describe('<Field.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Field.Root />, () => ({
    inheritComponent: 'div',
    refInstanceof: window.HTMLDivElement,
    render,
  }));

  describe('prop: disabled', () => {
    it('should add data-disabled style hook to all components when `disabled` is on Control', () => {
      render(
        <Field.Root data-testid="field">
          <Field.Control disabled data-testid="control" />
          <Field.Label data-testid="label" />
          <Field.Description data-testid="message" />
        </Field.Root>,
      );

      const field = screen.getByTestId('field');
      const control = screen.getByTestId('control');
      const label = screen.getByTestId('label');
      const message = screen.getByTestId('message');

      expect(field).to.have.attribute('data-disabled', 'true');
      expect(control).to.have.attribute('data-disabled', 'true');
      expect(label).to.have.attribute('data-disabled', 'true');
      expect(message).to.have.attribute('data-disabled', 'true');
    });
  });

  describe('prop: validate', () => {
    it('should validate the field on blur', () => {
      render(
        <Field.Root validate={() => 'error'}>
          <Field.Control />
          <Field.Error />
        </Field.Root>,
      );

      const control = screen.getByRole('textbox');
      const message = screen.queryByText('error');

      expect(message).to.equal(null);

      act(() => {
        control.focus();
        control.blur();
      });

      expect(screen.queryByText('error')).not.to.equal(null);
    });

    it('supports async validation', async () => {
      render(
        <Field.Root validate={() => Promise.resolve('error')}>
          <Field.Control />
          <Field.Error />
        </Field.Root>,
      );

      const control = screen.getByRole('textbox');
      const message = screen.queryByText('error');

      expect(message).to.equal(null);

      act(() => {
        control.focus();
        control.blur();
      });

      await flushMicrotasks();

      await waitFor(() => {
        expect(screen.queryByText('error')).not.to.equal(null);
      });
    });

    it('should apply [data-field] style hooks to field components', () => {
      render(
        <Field.Root>
          <Field.Label data-testid="label">Label</Field.Label>
          <Field.Description data-testid="description">Description</Field.Description>
          <Field.Error data-testid="error" />
          <Field.Control data-testid="control" required />
        </Field.Root>,
      );

      const control = screen.getByTestId<HTMLInputElement>('control');
      const label = screen.getByTestId('label');
      const description = screen.getByTestId('description');
      let error = screen.queryByTestId('error');

      expect(control).to.have.attribute('data-field', 'valid');
      expect(label).to.have.attribute('data-field', 'valid');
      expect(description).to.have.attribute('data-field', 'valid');
      expect(error).to.equal(null);

      act(() => {
        control.focus();
        control.blur();
      });

      error = screen.getByTestId('error');

      expect(control).to.have.attribute('data-field', 'invalid');
      expect(label).to.have.attribute('data-field', 'invalid');
      expect(description).to.have.attribute('data-field', 'invalid');
      expect(error).to.have.attribute('data-field', 'invalid');

      act(() => {
        control.value = 'value';
        control.focus();
        control.blur();
      });

      error = screen.queryByTestId('error');

      expect(control).to.have.attribute('data-field', 'valid');
      expect(label).to.have.attribute('data-field', 'valid');
      expect(description).to.have.attribute('data-field', 'valid');
      expect(error).to.equal(null);
    });

    it('should apply aria-invalid prop to control once validated', () => {
      render(
        <Field.Root validate={() => 'error'}>
          <Field.Control />
          <Field.Error />
        </Field.Root>,
      );

      const control = screen.getByRole('textbox');

      expect(control).not.to.have.attribute('aria-invalid');

      act(() => {
        control.focus();
        control.blur();
      });

      expect(control).to.have.attribute('aria-invalid', 'true');
    });

    describe('component integration', () => {
      describe('Checkbox', () => {
        it('supports Checkbox', () => {
          render(
            <Field.Root validate={() => 'error'}>
              <Checkbox.Root data-testid="button" />
              <Field.Error data-testid="error" />
            </Field.Root>,
          );

          const button = screen.getByTestId('button');

          expect(button).not.to.have.attribute('aria-invalid');

          act(() => {
            button.focus();
            button.blur();
          });

          expect(button).to.have.attribute('aria-invalid', 'true');
        });
      });

      describe('Switch', () => {
        it('supports Switch', () => {
          render(
            <Field.Root validate={() => 'error'}>
              <Switch.Root data-testid="button" />
              <Field.Error data-testid="error" />
            </Field.Root>,
          );

          const button = screen.getByTestId('button');

          expect(button).not.to.have.attribute('aria-invalid');

          act(() => {
            button.focus();
            button.blur();
          });

          expect(button).to.have.attribute('aria-invalid', 'true');
        });
      });

      describe('NumberField', () => {
        it('supports NumberField', () => {
          render(
            <Field.Root validate={() => 'error'}>
              <NumberField.Root>
                <NumberField.Input />
              </NumberField.Root>
              <Field.Error data-testid="error" />
            </Field.Root>,
          );

          const input = screen.getByRole('textbox');

          expect(input).not.to.have.attribute('aria-invalid');

          act(() => {
            input.focus();
            input.blur();
          });

          expect(input).to.have.attribute('aria-invalid', 'true');
        });
      });
    });
  });

  describe('prop: validateOnChange', () => {
    it('should validate the field on change', () => {
      render(
        <Field.Root
          validateOnChange
          validate={(value) => {
            const str = value as string;
            return str.length < 3 ? 'error' : null;
          }}
        >
          <Field.Control />
          <Field.Error />
        </Field.Root>,
      );

      const control = screen.getByRole<HTMLInputElement>('textbox');
      const message = screen.queryByText('error');

      expect(message).to.equal(null);

      fireEvent.change(control, { target: { value: 't' } });

      expect(control).to.have.attribute('aria-invalid', 'true');
    });
  });

  describe('prop: validateDebounceTime', () => {
    const { clock, render: renderFakeTimers } = createRenderer();

    clock.withFakeTimers();

    it('should debounce validation', async () => {
      renderFakeTimers(
        <Field.Root
          validateDebounceTime={100}
          validateOnChange
          validate={(value) => {
            const str = value as string;
            return str.length < 3 ? 'error' : null;
          }}
        >
          <Field.Control />
          <Field.Error />
        </Field.Root>,
      );

      const control = screen.getByRole<HTMLInputElement>('textbox');
      const message = screen.queryByText('error');

      expect(message).to.equal(null);

      fireEvent.change(control, { target: { value: 't' } });

      expect(control).not.to.have.attribute('aria-invalid');

      clock.tick(99);

      fireEvent.change(control, { target: { value: 'te' } });

      clock.tick(99);

      expect(control).not.to.have.attribute('aria-invalid');

      clock.tick(1);

      expect(control).to.have.attribute('aria-invalid', 'true');
      expect(screen.queryByText('error')).not.to.equal(null);
    });
  });

  describe('style hooks', () => {
    it('should apply [data-touched] style hook to all components when touched', () => {
      render(
        <Field.Root data-testid="root">
          <Field.Control data-testid="control" />
          <Field.Label data-testid="label" />
          <Field.Description data-testid="description" />
          <Field.Error data-testid="error" />
        </Field.Root>,
      );

      const root = screen.getByTestId('root');
      const control = screen.getByTestId('control');
      const label = screen.getByTestId('label');
      const description = screen.getByTestId('description');
      const error = screen.queryByTestId('error');

      expect(root).not.to.have.attribute('data-touched');
      expect(control).not.to.have.attribute('data-touched');
      expect(label).not.to.have.attribute('data-touched');
      expect(description).not.to.have.attribute('data-touched');
      expect(error).to.equal(null);

      act(() => {
        fireEvent.focus(control);
        fireEvent.blur(control);
      });

      expect(root).to.have.attribute('data-touched', 'true');
      expect(control).to.have.attribute('data-touched', 'true');
      expect(label).to.have.attribute('data-touched', 'true');
      expect(description).to.have.attribute('data-touched', 'true');
      expect(error).to.equal(null);
    });
  });

  it('should apply [data-dirty] style hook to all components when dirty', () => {
    render(
      <Field.Root data-testid="root">
        <Field.Control data-testid="control" />
        <Field.Label data-testid="label" />
        <Field.Description data-testid="description" />
        <Field.Error data-testid="error" />
      </Field.Root>,
    );

    const root = screen.getByTestId('root');
    const control = screen.getByTestId('control');
    const label = screen.getByTestId('label');
    const description = screen.getByTestId('description');

    expect(root).not.to.have.attribute('data-dirty');
    expect(control).not.to.have.attribute('data-dirty');
    expect(label).not.to.have.attribute('data-dirty');
    expect(description).not.to.have.attribute('data-dirty');

    fireEvent.change(control, { target: { value: 'value' } });

    expect(root).to.have.attribute('data-dirty', 'true');
    expect(control).to.have.attribute('data-dirty', 'true');
    expect(label).to.have.attribute('data-dirty', 'true');
    expect(description).to.have.attribute('data-dirty', 'true');

    fireEvent.change(control, { target: { value: '' } });

    expect(root).not.to.have.attribute('data-dirty');
    expect(control).not.to.have.attribute('data-dirty');
    expect(label).not.to.have.attribute('data-dirty');
    expect(description).not.to.have.attribute('data-dirty');
  });
});
