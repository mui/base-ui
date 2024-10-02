import * as React from 'react';
import * as Field from '@base_ui/react/Field';
import { Checkbox } from '@base_ui/react/Checkbox';
import * as Switch from '@base_ui/react/Switch';
import * as NumberField from '@base_ui/react/NumberField';
import * as Slider from '@base_ui/react/Slider';
import * as RadioGroup from '@base_ui/react/RadioGroup';
import * as Radio from '@base_ui/react/Radio';
import userEvent from '@testing-library/user-event';
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
    refInstanceof: window.HTMLDivElement,
    render,
  }));

  describe('prop: disabled', () => {
    it('should add data-disabled style hook to all components', () => {
      render(
        <Field.Root data-testid="field" disabled>
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

      fireEvent.focus(control);
      fireEvent.blur(control);

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

      fireEvent.focus(control);
      fireEvent.blur(control);

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

      expect(control).not.to.have.attribute('data-field');
      expect(label).not.to.have.attribute('data-field');
      expect(description).not.to.have.attribute('data-field');
      expect(error).to.equal(null);

      fireEvent.focus(control);
      fireEvent.change(control, { target: { value: 'a' } });
      fireEvent.change(control, { target: { value: '' } });
      fireEvent.blur(control);

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

      fireEvent.focus(control);
      fireEvent.blur(control);

      expect(control).to.have.attribute('aria-invalid', 'true');
    });

    describe('component integration', () => {
      it('supports Checkbox', () => {
        render(
          <Field.Root validate={() => 'error'}>
            <Checkbox.Root data-testid="button" />
            <Field.Error data-testid="error" />
          </Field.Root>,
        );

        const button = screen.getByTestId('button');

        expect(button).not.to.have.attribute('aria-invalid');

        fireEvent.focus(button);
        fireEvent.blur(button);

        expect(button).to.have.attribute('aria-invalid', 'true');
      });

      it('supports Switch', () => {
        render(
          <Field.Root validate={() => 'error'}>
            <Switch.Root data-testid="button" />
            <Field.Error data-testid="error" />
          </Field.Root>,
        );

        const button = screen.getByTestId('button');

        expect(button).not.to.have.attribute('aria-invalid');

        fireEvent.focus(button);
        fireEvent.blur(button);

        expect(button).to.have.attribute('aria-invalid', 'true');
      });

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

        fireEvent.focus(input);
        fireEvent.blur(input);

        expect(input).to.have.attribute('aria-invalid', 'true');
      });

      it('supports Slider', () => {
        const { container } = render(
          <Field.Root validate={() => 'error'}>
            <Slider.Root>
              <Slider.Control>
                <Slider.Thumb data-testid="thumb" />
              </Slider.Control>
            </Slider.Root>
            <Field.Error data-testid="error" />
          </Field.Root>,
        );

        // eslint-disable-next-line testing-library/no-node-access
        const input = container.querySelector<HTMLInputElement>('input')!;
        const thumb = screen.getByTestId('thumb');

        expect(input).not.to.have.attribute('aria-invalid');

        fireEvent.focus(thumb);
        fireEvent.blur(thumb);

        expect(input).to.have.attribute('aria-invalid', 'true');
      });

      it('supports RadioGroup', () => {
        render(
          <Field.Root validate={() => 'error'}>
            <RadioGroup.Root data-testid="group">
              <Radio.Root value="1">One</Radio.Root>
              <Radio.Root value="2">Two</Radio.Root>
            </RadioGroup.Root>
            <Field.Error data-testid="error" />
          </Field.Root>,
        );

        const group = screen.getByTestId('group');

        expect(group).not.to.have.attribute('aria-invalid');

        fireEvent.focus(group);
        fireEvent.blur(group);

        expect(group).to.have.attribute('aria-invalid', 'true');
      });
    });
  });

  describe('prop: validateOnChange', () => {
    it('should validate the field on change', async () => {
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

      expect(control).to.have.attribute('data-field', 'invalid');
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
    describe('touched', () => {
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

        fireEvent.focus(control);
        fireEvent.blur(control);

        expect(root).to.have.attribute('data-touched', 'true');
        expect(control).to.have.attribute('data-touched', 'true');
        expect(label).to.have.attribute('data-touched', 'true');
        expect(description).to.have.attribute('data-touched', 'true');
        expect(error).to.equal(null);
      });

      it('supports Checkbox', () => {
        render(
          <Field.Root>
            <Checkbox.Root data-testid="button" />
          </Field.Root>,
        );

        const button = screen.getByTestId('button');

        fireEvent.focus(button);
        fireEvent.blur(button);

        expect(button).to.have.attribute('data-touched', 'true');
      });

      it('supports Switch', () => {
        render(
          <Field.Root>
            <Switch.Root data-testid="button" />
          </Field.Root>,
        );

        const button = screen.getByTestId('button');

        fireEvent.focus(button);
        fireEvent.blur(button);

        expect(button).to.have.attribute('data-touched', 'true');
      });

      it('supports NumberField', () => {
        render(
          <Field.Root>
            <NumberField.Root>
              <NumberField.Input />
            </NumberField.Root>
          </Field.Root>,
        );

        const input = screen.getByRole<HTMLInputElement>('textbox');

        fireEvent.focus(input);
        fireEvent.blur(input);

        expect(input).to.have.attribute('data-touched', 'true');
      });

      it('supports Slider', () => {
        render(
          <Field.Root>
            <Slider.Root data-testid="root">
              <Slider.Control>
                <Slider.Thumb data-testid="thumb" />
              </Slider.Control>
            </Slider.Root>
          </Field.Root>,
        );

        const root = screen.getByTestId('root');
        const thumb = screen.getByTestId('thumb');

        fireEvent.focus(thumb);
        fireEvent.blur(thumb);

        expect(root).to.have.attribute('data-touched', 'true');
      });

      it('supports RadioGroup (click)', () => {
        render(
          <Field.Root>
            <RadioGroup.Root data-testid="group">
              <Radio.Root value="1" data-testid="control">
                One
              </Radio.Root>
              <Radio.Root value="2">Two</Radio.Root>
            </RadioGroup.Root>
          </Field.Root>,
        );

        const group = screen.getByTestId('group');
        const control = screen.getByTestId('control');

        fireEvent.click(control);

        expect(group).to.have.attribute('data-touched', 'true');
        expect(control).to.have.attribute('data-touched', 'true');
      });

      it('supports RadioGroup (blur)', async () => {
        render(
          <Field.Root>
            <RadioGroup.Root data-testid="group">
              <Radio.Root value="1" data-testid="control">
                One
              </Radio.Root>
              <Radio.Root value="2">Two</Radio.Root>
            </RadioGroup.Root>
            <button />
          </Field.Root>,
        );

        const group = screen.getByTestId('group');
        const control = screen.getByTestId('control');

        await userEvent.tab(); // onto control
        await userEvent.tab(); // onto last button

        expect(group).to.have.attribute('data-touched', 'true');
        expect(control).to.have.attribute('data-touched', 'true');
      });
    });

    describe('dirty', () => {
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

      it('supports Checkbox', () => {
        render(
          <Field.Root>
            <Checkbox.Root data-testid="button" />
          </Field.Root>,
        );

        const button = screen.getByTestId('button');

        expect(button).not.to.have.attribute('data-dirty');

        fireEvent.click(button);

        expect(button).to.have.attribute('data-dirty', 'true');
      });

      it('supports Switch', () => {
        render(
          <Field.Root>
            <Switch.Root data-testid="button" />
          </Field.Root>,
        );

        const button = screen.getByTestId('button');

        expect(button).not.to.have.attribute('data-dirty');

        fireEvent.click(button);

        expect(button).to.have.attribute('data-dirty', 'true');
      });

      it('supports NumberField', () => {
        render(
          <Field.Root>
            <NumberField.Root>
              <NumberField.Input />
            </NumberField.Root>
          </Field.Root>,
        );

        const input = screen.getByRole<HTMLInputElement>('textbox');

        expect(input).not.to.have.attribute('data-dirty');

        fireEvent.change(input, { target: { value: '1' } });

        expect(input).to.have.attribute('data-dirty', 'true');
      });

      it('supports Slider', () => {
        const { container } = render(
          <Field.Root>
            <Slider.Root data-testid="root">
              <Slider.Control>
                <Slider.Thumb />
              </Slider.Control>
            </Slider.Root>
          </Field.Root>,
        );

        const root = screen.getByTestId('root');
        // eslint-disable-next-line testing-library/no-node-access
        const input = container.querySelector<HTMLInputElement>('input')!;

        expect(root).not.to.have.attribute('data-dirty');

        fireEvent.change(input, { target: { value: 'value' } });

        expect(root).to.have.attribute('data-dirty', 'true');
      });

      it('supports RadioGroup', () => {
        render(
          <Field.Root>
            <RadioGroup.Root data-testid="group">
              <Radio.Root value="1">One</Radio.Root>
              <Radio.Root value="2">Two</Radio.Root>
            </RadioGroup.Root>
          </Field.Root>,
        );

        const group = screen.getByTestId('group');

        expect(group).not.to.have.attribute('data-dirty');

        fireEvent.click(screen.getByText('One'));

        expect(group).to.have.attribute('data-dirty', 'true');
      });
    });
  });
});
