import * as React from 'react';
import * as Field from '@base_ui/react/Field';
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

    it('should apply [data-valid] and [data-invalid] style hooks to field components', () => {
      render(
        <Field.Root>
          <Field.Label data-testid="label">Label</Field.Label>
          <Field.Description data-testid="description">Description</Field.Description>
          <Field.Error data-testid="error" forceShow />
          <Field.Control data-testid="control" required />
        </Field.Root>,
      );

      const control = screen.getByTestId<HTMLInputElement>('control');
      const label = screen.getByTestId('label');
      const description = screen.getByTestId('description');
      const error = screen.getByTestId('error');

      expect(control).not.to.have.attribute('data-invalid');
      expect(control).not.to.have.attribute('data-valid');
      expect(label).not.to.have.attribute('data-invalid');
      expect(label).not.to.have.attribute('data-valid');
      expect(description).not.to.have.attribute('data-invalid');
      expect(description).not.to.have.attribute('data-valid');
      expect(error).not.to.have.attribute('data-valid');
      expect(error).not.to.have.attribute('data-invalid');

      act(() => {
        control.focus();
        control.blur();
      });

      expect(control).to.have.attribute('data-invalid');
      expect(control).not.to.have.attribute('data-valid');
      expect(label).to.have.attribute('data-invalid');
      expect(label).not.to.have.attribute('data-valid');
      expect(description).to.have.attribute('data-invalid');
      expect(description).not.to.have.attribute('data-valid');
      expect(error).to.have.attribute('data-invalid');
      expect(error).not.to.have.attribute('data-valid');

      act(() => {
        control.value = 'value';
        control.focus();
        control.blur();
      });

      expect(control).to.have.attribute('data-valid');
      expect(control).not.to.have.attribute('data-invalid');
      expect(label).to.have.attribute('data-valid');
      expect(label).not.to.have.attribute('data-invalid');
      expect(description).to.have.attribute('data-valid');
      expect(description).not.to.have.attribute('data-invalid');
      expect(error).to.have.attribute('data-valid');
      expect(error).not.to.have.attribute('data-invalid');
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

  describe('prop: validateDebounceMs', () => {
    const { clock, render: renderFakeTimers } = createRenderer();

    clock.withFakeTimers();

    it('should debounce validation', async () => {
      renderFakeTimers(
        <Field.Root
          validateDebounceMs={100}
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
});
