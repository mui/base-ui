import * as React from 'react';
import { Field } from '@base-ui-components/react/field';
import { Checkbox } from '@base-ui-components/react/checkbox';
import { Switch } from '@base-ui-components/react/switch';
import { NumberField } from '@base-ui-components/react/number-field';
import { Slider } from '@base-ui-components/react/slider';
import { RadioGroup } from '@base-ui-components/react/radio-group';
import { Radio } from '@base-ui-components/react/radio';
import { Select } from '@base-ui-components/react/select';
import userEvent from '@testing-library/user-event';
import { act, fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { createRenderer, describeConformance } from '#test-utils';

const user = userEvent.setup();

describe('<Field.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Field.Root />, () => ({
    refInstanceof: window.HTMLDivElement,
    render,
  }));

  describe('prop: disabled', () => {
    it('should add data-disabled style hook to all components', async () => {
      await render(
        <Field.Root data-testid="field" disabled>
          <Field.Control data-testid="control" />
          <Field.Label data-testid="label" />
          <Field.Description data-testid="message" />
        </Field.Root>,
      );

      const field = screen.getByTestId('field');
      const control = screen.getByTestId('control');
      const label = screen.getByTestId('label');
      const message = screen.getByTestId('message');

      expect(field).to.have.attribute('data-disabled', '');
      expect(control).to.have.attribute('data-disabled', '');
      expect(label).to.have.attribute('data-disabled', '');
      expect(message).to.have.attribute('data-disabled', '');
    });
  });

  describe('prop: validate', () => {
    it('should validate the field on blur', async () => {
      await render(
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
      await render(
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

    it('should apply [data-field] style hooks to field components', async () => {
      await render(
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

      expect(control).not.to.have.attribute('data-valid');
      expect(label).not.to.have.attribute('data-valid');
      expect(description).not.to.have.attribute('data-valid');
      expect(error).to.equal(null);

      fireEvent.focus(control);
      fireEvent.change(control, { target: { value: 'a' } });
      fireEvent.change(control, { target: { value: '' } });
      fireEvent.blur(control);

      error = screen.getByTestId('error');

      expect(control).to.have.attribute('data-invalid', '');
      expect(label).to.have.attribute('data-invalid', '');
      expect(description).to.have.attribute('data-invalid', '');
      expect(error).to.have.attribute('data-invalid', '');

      act(() => {
        control.value = 'value';
        control.focus();
        control.blur();
      });

      error = screen.queryByTestId('error');

      expect(control).to.have.attribute('data-valid', '');
      expect(label).to.have.attribute('data-valid', '');
      expect(description).to.have.attribute('data-valid', '');
      expect(error).to.equal(null);
    });

    it('should apply aria-invalid prop to control once validated', async () => {
      await render(
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
      it('supports Checkbox', async () => {
        await render(
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

      it('supports Switch', async () => {
        await render(
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

      it('supports NumberField', async () => {
        await render(
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

      it('supports Slider', async () => {
        const { container } = await render(
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

      it('supports RadioGroup', async () => {
        await render(
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

      it('supports Select', async () => {
        await render(
          <Field.Root validate={() => 'error'}>
            <Select.Root>
              <Select.Trigger data-testid="trigger" />
              <Select.Positioner />
            </Select.Root>
          </Field.Root>,
        );

        const trigger = screen.getByTestId('trigger');

        expect(trigger).not.to.have.attribute('aria-invalid');

        fireEvent.focus(trigger);
        fireEvent.blur(trigger);

        await flushMicrotasks();

        expect(trigger).to.have.attribute('aria-invalid', 'true');
      });
    });
  });

  describe('prop: validationMode', () => {
    it('should validate the field on change', async () => {
      await render(
        <Field.Root
          validationMode="onChange"
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

      expect(control).to.have.attribute('data-invalid', '');
      expect(control).to.have.attribute('aria-invalid', 'true');
    });
  });

  describe('prop: validateDebounceTime', () => {
    const { clock, render: renderFakeTimers } = createRenderer();

    clock.withFakeTimers();

    it('should debounce validation', async () => {
      await renderFakeTimers(
        <Field.Root
          validationDebounceTime={100}
          validationMode="onChange"
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
      it('should apply [data-touched] style hook to all components when touched', async () => {
        await render(
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

        expect(root).to.have.attribute('data-touched', '');
        expect(control).to.have.attribute('data-touched', '');
        expect(label).to.have.attribute('data-touched', '');
        expect(description).to.have.attribute('data-touched', '');
        expect(error).to.equal(null);
      });

      it('supports Checkbox', async () => {
        await render(
          <Field.Root>
            <Checkbox.Root data-testid="button" />
          </Field.Root>,
        );

        const button = screen.getByTestId('button');

        fireEvent.focus(button);
        fireEvent.blur(button);

        expect(button).to.have.attribute('data-touched', '');
      });

      it('supports Switch', async () => {
        await render(
          <Field.Root>
            <Switch.Root data-testid="button" />
          </Field.Root>,
        );

        const button = screen.getByTestId('button');

        fireEvent.focus(button);
        fireEvent.blur(button);

        expect(button).to.have.attribute('data-touched', '');
      });

      it('supports NumberField', async () => {
        await render(
          <Field.Root>
            <NumberField.Root>
              <NumberField.Input />
            </NumberField.Root>
          </Field.Root>,
        );

        const input = screen.getByRole<HTMLInputElement>('textbox');

        fireEvent.focus(input);
        fireEvent.blur(input);

        expect(input).to.have.attribute('data-touched', '');
      });

      it('supports Slider', async () => {
        await render(
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

        expect(root).to.have.attribute('data-touched', '');
      });

      it('supports Select', async () => {
        await render(
          <Field.Root>
            <Select.Root>
              <Select.Trigger data-testid="trigger" />
              <Select.Positioner>
                <Select.Popup>
                  <Select.Option value="">Select</Select.Option>
                  <Select.Option value="1">Option 1</Select.Option>
                </Select.Popup>
              </Select.Positioner>
            </Select.Root>
          </Field.Root>,
        );

        const trigger = screen.getByTestId('trigger');

        expect(trigger).not.to.have.attribute('data-dirty');

        fireEvent.focus(trigger);
        fireEvent.blur(trigger);

        await flushMicrotasks();

        expect(trigger).to.have.attribute('data-touched', '');
      });

      it('supports RadioGroup (click)', async () => {
        await render(
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

        expect(group).to.have.attribute('data-touched', '');
        expect(control).to.have.attribute('data-touched', '');
      });

      it('supports RadioGroup (blur)', async () => {
        await render(
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

        expect(group).to.have.attribute('data-touched', '');
        expect(control).to.have.attribute('data-touched', '');
      });
    });

    describe('dirty', () => {
      it('should apply [data-dirty] style hook to all components when dirty', async () => {
        await render(
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

        expect(root).to.have.attribute('data-dirty', '');
        expect(control).to.have.attribute('data-dirty', '');
        expect(label).to.have.attribute('data-dirty', '');
        expect(description).to.have.attribute('data-dirty', '');

        fireEvent.change(control, { target: { value: '' } });

        expect(root).not.to.have.attribute('data-dirty');
        expect(control).not.to.have.attribute('data-dirty');
        expect(label).not.to.have.attribute('data-dirty');
        expect(description).not.to.have.attribute('data-dirty');
      });

      it('supports Checkbox', async () => {
        await render(
          <Field.Root>
            <Checkbox.Root data-testid="button" />
          </Field.Root>,
        );

        const button = screen.getByTestId('button');

        expect(button).not.to.have.attribute('data-dirty');

        fireEvent.click(button);

        expect(button).to.have.attribute('data-dirty', '');
      });

      it('supports Switch', async () => {
        await render(
          <Field.Root>
            <Switch.Root data-testid="button" />
          </Field.Root>,
        );

        const button = screen.getByTestId('button');

        expect(button).not.to.have.attribute('data-dirty');

        fireEvent.click(button);

        expect(button).to.have.attribute('data-dirty', '');
      });

      it('supports NumberField', async () => {
        await render(
          <Field.Root>
            <NumberField.Root>
              <NumberField.Input />
            </NumberField.Root>
          </Field.Root>,
        );

        const input = screen.getByRole<HTMLInputElement>('textbox');

        expect(input).not.to.have.attribute('data-dirty');

        fireEvent.change(input, { target: { value: '1' } });

        expect(input).to.have.attribute('data-dirty', '');
      });

      it('supports Slider', async () => {
        const { container } = await render(
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

        expect(root).to.have.attribute('data-dirty', '');
      });

      it('supports RadioGroup', async () => {
        await render(
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

        expect(group).to.have.attribute('data-dirty', '');
      });

      it('supports Select', async () => {
        await render(
          <Field.Root>
            <Select.Root>
              <Select.Trigger data-testid="trigger" />
              <Select.Positioner>
                <Select.Popup>
                  <Select.Option value="">Select</Select.Option>
                  <Select.Option value="1">Option 1</Select.Option>
                </Select.Popup>
              </Select.Positioner>
            </Select.Root>
          </Field.Root>,
        );

        const trigger = screen.getByTestId('trigger');

        expect(trigger).not.to.have.attribute('data-dirty');

        await userEvent.click(trigger);

        await flushMicrotasks();

        const option = screen.getByRole('option', { name: 'Option 1' });

        // Arrow Down to focus the Option 1
        await user.keyboard('{ArrowDown}');

        await userEvent.click(option);

        await flushMicrotasks();

        expect(trigger).to.have.attribute('data-dirty', '');
      });
    });
  });
});
