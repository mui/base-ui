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
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { CheckboxGroup } from '@base-ui-components/react/checkbox-group';

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

    describe('NumberField', () => {
      it('disables the input when `disabled` is true', async () => {
        await render(
          <Field.Root disabled>
            <NumberField.Root>
              <NumberField.Input />
            </NumberField.Root>
          </Field.Root>,
        );

        const input = screen.getByRole<HTMLInputElement>('textbox');

        expect(input).to.have.attribute('disabled', '');
      });

      it('does not disable the input when `disabled` is false', async () => {
        await render(
          <Field.Root disabled={false}>
            <NumberField.Root>
              <NumberField.Input />
            </NumberField.Root>
          </Field.Root>,
        );

        const input = screen.getByRole<HTMLInputElement>('textbox');

        expect(input).not.to.have.attribute('disabled');
      });
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
  });

  describe('prop: validationMode', () => {
    describe('onChange', () => {
      it('validates the field on change', async () => {
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

      it('validates Checkbox on change', async () => {
        await render(
          <Field.Root
            validationMode="onChange"
            validate={(value) => {
              const checked = value as boolean;
              return checked ? 'error' : null;
            }}
          >
            <Checkbox.Root data-testid="button" />
          </Field.Root>,
        );

        const button = screen.getByTestId('button');

        expect(button).not.to.have.attribute('aria-invalid');

        fireEvent.click(button);

        expect(button).to.have.attribute('aria-invalid', 'true');
      });

      it('validates Switch on change', async () => {
        await render(
          <Field.Root
            validationMode="onChange"
            validate={(value) => {
              const checked = value as boolean;
              return checked ? 'error' : null;
            }}
          >
            <Switch.Root data-testid="button" />
          </Field.Root>,
        );

        const button = screen.getByTestId('button');

        expect(button).not.to.have.attribute('aria-invalid');

        fireEvent.click(button);

        expect(button).to.have.attribute('aria-invalid', 'true');
      });

      it('validates NumberField on change', async () => {
        await render(
          <Field.Root
            validationMode="onChange"
            validate={(value) => {
              return value === 1 ? 'error' : null;
            }}
          >
            <NumberField.Root>
              <NumberField.Input data-testid="input" />
            </NumberField.Root>
          </Field.Root>,
        );

        const input = screen.getByTestId('input');

        expect(input).not.to.have.attribute('aria-invalid');

        fireEvent.change(input, { target: { value: '1' } });

        expect(input).to.have.attribute('aria-invalid', 'true');
      });

      it('validates Slider on change', async () => {
        const { container } = await render(
          <Field.Root
            validationMode="onChange"
            validate={(value) => {
              return value === 1 ? 'error' : null;
            }}
          >
            <Slider.Root>
              <Slider.Control>
                <Slider.Thumb data-testid="thumb" />
              </Slider.Control>
            </Slider.Root>
          </Field.Root>,
        );

        // eslint-disable-next-line testing-library/no-node-access
        const input = container.querySelector<HTMLInputElement>('input')!;

        expect(input).not.to.have.attribute('aria-invalid');

        fireEvent.change(input, { target: { value: '1' } });

        expect(input).to.have.attribute('aria-invalid', 'true');
      });

      it('validates RadioGroup on change', async () => {
        await render(
          <Field.Root
            validationMode="onChange"
            validate={(value) => {
              return value === '1' ? 'error' : null;
            }}
          >
            <RadioGroup data-testid="group">
              <Radio.Root value="1">One</Radio.Root>
              <Radio.Root value="2">Two</Radio.Root>
            </RadioGroup>
          </Field.Root>,
        );

        const one = screen.getByText('One');

        expect(one).not.to.have.attribute('aria-invalid');

        fireEvent.click(one);

        expect(one).to.have.attribute('aria-invalid', 'true');
      });

      // flaky in real browser
      it.skipIf(!isJSDOM)('validates Select on change', async () => {
        const { user } = await render(
          <Field.Root
            validationMode="onChange"
            validate={(value) => {
              return value === '1' ? 'error' : null;
            }}
          >
            <Select.Root>
              <Select.Trigger data-testid="trigger">
                <Select.Value placeholder="Select an option" />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Item value="1">Option 1</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </Field.Root>,
        );

        const trigger = screen.getByTestId('trigger');

        expect(trigger).not.to.have.attribute('aria-invalid');

        await userEvent.click(trigger);

        await flushMicrotasks();

        // Arrow Down to focus the Option 1
        await user.keyboard('{ArrowDown}');
        await user.keyboard('{Enter}');

        expect(trigger).to.have.attribute('aria-invalid', 'true');
      });

      it('validates CheckboxGroup on change', async () => {
        await render(
          <Field.Root
            validationMode="onChange"
            validate={(value) => {
              const v = value as string[];
              return v.includes('fuji-apple') ? 'error' : null;
            }}
          >
            <CheckboxGroup defaultValue={['fuji-apple']}>
              <Checkbox.Root name="fuji-apple" data-testid="button-1" />
              <Checkbox.Root name="gala-apple" data-testid="button-2" />
              <Checkbox.Root name="granny-smith-apple" data-testid="button-3" />
            </CheckboxGroup>
          </Field.Root>,
        );

        const button1 = screen.getByTestId('button-1');
        const button2 = screen.getByTestId('button-2');
        const button3 = screen.getByTestId('button-3');

        expect(button1).not.to.have.attribute('aria-invalid');
        expect(button2).not.to.have.attribute('aria-invalid');
        expect(button3).not.to.have.attribute('aria-invalid');

        fireEvent.click(button1);

        expect(button1).not.to.have.attribute('aria-invalid');
        expect(button2).not.to.have.attribute('aria-invalid');
        expect(button3).not.to.have.attribute('aria-invalid');

        fireEvent.click(button2);

        expect(button1).not.to.have.attribute('aria-invalid');
        expect(button2).not.to.have.attribute('aria-invalid');
        expect(button3).not.to.have.attribute('aria-invalid');

        fireEvent.click(button1);

        expect(button1).to.have.attribute('aria-invalid', 'true');
        expect(button2).to.have.attribute('aria-invalid', 'true');
        expect(button3).to.have.attribute('aria-invalid', 'true');

        fireEvent.click(button3);

        expect(button1).to.have.attribute('aria-invalid', 'true');
        expect(button2).to.have.attribute('aria-invalid', 'true');
        expect(button3).to.have.attribute('aria-invalid', 'true');
      });
    });

    describe('onBlur', () => {
      it('validates the field on blur', async () => {
        await render(
          <Field.Root
            validationMode="onBlur"
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

        expect(control).not.to.have.attribute('data-invalid');

        fireEvent.blur(control);

        expect(control).to.have.attribute('data-invalid', '');
        expect(control).to.have.attribute('aria-invalid', 'true');
      });

      it('validates Checkbox on blur', async () => {
        await render(
          <Field.Root
            validationMode="onBlur"
            validate={(value) => {
              const checked = value as boolean;
              return checked ? 'error' : null;
            }}
          >
            <Checkbox.Root data-testid="button" />
            <Field.Error data-testid="error" />
          </Field.Root>,
        );

        const button = screen.getByTestId('button');

        expect(button).not.to.have.attribute('aria-invalid');

        fireEvent.click(button);
        fireEvent.blur(button);

        expect(button).to.have.attribute('aria-invalid', 'true');
      });

      it('validates Switch on blur', async () => {
        await render(
          <Field.Root
            validationMode="onBlur"
            validate={(value) => {
              const checked = value as boolean;
              return checked ? 'error' : null;
            }}
          >
            <Switch.Root data-testid="button" />
            <Field.Error data-testid="error" />
          </Field.Root>,
        );

        const button = screen.getByTestId('button');

        expect(button).not.to.have.attribute('aria-invalid');

        fireEvent.click(button);
        fireEvent.blur(button);

        expect(button).to.have.attribute('aria-invalid', 'true');
      });

      it('validates NumberField on blur', async () => {
        await render(
          <Field.Root
            validationMode="onBlur"
            validate={(value) => {
              return value === 1 ? 'error' : null;
            }}
          >
            <NumberField.Root>
              <NumberField.Input data-testid="input" />
            </NumberField.Root>
            <Field.Error data-testid="error" />
          </Field.Root>,
        );

        const input = screen.getByTestId('input');

        expect(input).not.to.have.attribute('aria-invalid');

        fireEvent.change(input, { target: { value: '1' } });
        fireEvent.blur(input);

        expect(input).to.have.attribute('aria-invalid', 'true');
      });

      it('validates Slider on blur', async () => {
        const { container } = await render(
          <Field.Root
            validationMode="onBlur"
            validate={(value) => {
              return value === 1 ? 'error' : null;
            }}
          >
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

        fireEvent.change(input, { target: { value: '1' } });
        fireEvent.blur(thumb);

        expect(input).to.have.attribute('aria-invalid', 'true');
      });

      it('validates RadioGroup on blur', async () => {
        await render(
          <Field.Root
            validationMode="onBlur"
            validate={(value) => {
              return value === '1' ? 'error' : null;
            }}
          >
            <RadioGroup data-testid="group">
              <Radio.Root value="1">One</Radio.Root>
              <Radio.Root value="2">Two</Radio.Root>
            </RadioGroup>
            <Field.Error data-testid="error" />
          </Field.Root>,
        );

        const group = screen.getByTestId('group');

        expect(group).not.to.have.attribute('aria-invalid');

        fireEvent.click(screen.getByText('One'));
        fireEvent.blur(group);

        expect(group).to.have.attribute('aria-invalid', 'true');
      });

      // flaky in real browser
      it.skipIf(!isJSDOM)('validates Select on blur', async () => {
        const { user } = await render(
          <Field.Root
            validationMode="onBlur"
            validate={(value) => {
              return value === '1' ? 'error' : null;
            }}
          >
            <Select.Root>
              <Select.Trigger data-testid="trigger">
                <Select.Value placeholder="Select an option" />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Item value="1">Option 1</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
            <Field.Error data-testid="error" />
          </Field.Root>,
        );

        const trigger = screen.getByTestId('trigger');

        expect(trigger).not.to.have.attribute('aria-invalid');

        await user.click(trigger);

        await flushMicrotasks();

        // Arrow Down to focus the Option 1
        await user.keyboard('{ArrowDown}');
        await user.keyboard('{Enter}');

        fireEvent.blur(trigger);

        await flushMicrotasks();

        await waitFor(() => {
          expect(trigger).to.have.attribute('aria-invalid', 'true');
        });
      });

      it('validates CheckboxGroup on blur', async () => {
        await render(
          <Field.Root
            validationMode="onBlur"
            validate={(value) => {
              const v = value as string[];
              return v.includes('fuji-apple') ? 'error' : null;
            }}
          >
            <CheckboxGroup defaultValue={['fuji-apple']}>
              <Checkbox.Root name="fuji-apple" data-testid="button-1" />
              <Checkbox.Root name="gala-apple" data-testid="button-2" />
              <Checkbox.Root name="granny-smith-apple" data-testid="button-3" />
            </CheckboxGroup>
            <Field.Error data-testid="error" />
          </Field.Root>,
        );

        const button1 = screen.getByTestId('button-1');
        const button2 = screen.getByTestId('button-2');
        const button3 = screen.getByTestId('button-3');

        expect(button1).not.to.have.attribute('aria-invalid');
        expect(button2).not.to.have.attribute('aria-invalid');
        expect(button3).not.to.have.attribute('aria-invalid');

        fireEvent.click(button1);
        fireEvent.blur(button1);

        expect(button1).not.to.have.attribute('aria-invalid');
        expect(button2).not.to.have.attribute('aria-invalid');
        expect(button3).not.to.have.attribute('aria-invalid');

        fireEvent.click(button3);
        fireEvent.blur(button3);

        expect(button1).not.to.have.attribute('aria-invalid');
        expect(button2).not.to.have.attribute('aria-invalid');
        expect(button3).not.to.have.attribute('aria-invalid');

        fireEvent.click(button1);
        fireEvent.blur(button1);

        expect(button1).to.have.attribute('aria-invalid', 'true');
        expect(button2).to.have.attribute('aria-invalid', 'true');
        expect(button3).to.have.attribute('aria-invalid', 'true');
      });
    });

    describe('computed validity state', () => {
      it('should not mark field as invalid for valueMissing if not dirty', async () => {
        await render(
          <Field.Root>
            <Field.Control data-testid="control" required />
          </Field.Root>,
        );

        const control = screen.getByTestId('control');

        fireEvent.focus(control);
        fireEvent.blur(control);

        expect(control).not.to.have.attribute('data-invalid');
        expect(control).not.to.have.attribute('aria-invalid');
      });

      it('should mark field as invalid for valueMissing if dirty', async () => {
        await render(
          <Field.Root>
            <Field.Control data-testid="control" required />
          </Field.Root>,
        );

        const control = screen.getByTestId('control');

        // Mark as touched and dirtied
        fireEvent.focus(control);
        fireEvent.change(control, { target: { value: 'a' } });
        fireEvent.change(control, { target: { value: '' } });
        fireEvent.blur(control);

        // valueMissing is true, and markedDirtyRef is true, so valid should be false
        expect(control).to.have.attribute('data-invalid', '');
        expect(control).to.have.attribute('aria-invalid', 'true');
      });

      it('should mark field as invalid for other errors (e.g., typeMismatch) even if not dirty', async () => {
        await render(
          <Field.Root>
            <Field.Control data-testid="control" type="email" defaultValue="not_an_email@" />
          </Field.Root>,
        );

        const control = screen.getByTestId('control');

        // Mark as touched but not dirty
        fireEvent.focus(control);
        fireEvent.blur(control);

        // typeMismatch is true, so valid should be false regardless of dirty state
        expect(control).to.have.attribute('data-invalid', '');
        expect(control).to.have.attribute('aria-invalid', 'true');
      });
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
    });

    describe('filled', async () => {
      it('should apply [data-filled] style hook to all components when filled', async () => {
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

        expect(root).not.to.have.attribute('data-filled');
        expect(control).not.to.have.attribute('data-filled');
        expect(label).not.to.have.attribute('data-filled');
        expect(description).not.to.have.attribute('data-filled');

        fireEvent.change(control, { target: { value: 'value' } });

        expect(root).to.have.attribute('data-filled', '');
        expect(control).to.have.attribute('data-filled', '');
        expect(label).to.have.attribute('data-filled', '');
        expect(description).to.have.attribute('data-filled', '');

        fireEvent.change(control, { target: { value: '' } });

        expect(root).not.to.have.attribute('data-filled');
        expect(control).not.to.have.attribute('data-filled');
        expect(label).not.to.have.attribute('data-filled');
        expect(description).not.to.have.attribute('data-filled');
      });

      it('changes [data-filled] when the value is changed externally', async () => {
        function App() {
          const [value, setValue] = React.useState('');
          return (
            <div>
              <Field.Root>
                <Field.Control value={value} onChange={(event) => setValue(event.target.value)} />
              </Field.Root>
              <button onClick={() => setValue('test')}>change</button>
              <button onClick={() => setValue('')}>reset</button>
            </div>
          );
        }

        const { user } = await render(<App />);

        expect(screen.getByRole('textbox')).not.to.have.attribute('data-filled', '');

        await user.click(screen.getByRole('button', { name: 'change' }));
        expect(screen.getByRole('textbox')).to.have.attribute('data-filled', '');

        await user.click(screen.getByRole('button', { name: 'reset' }));
        expect(screen.getByRole('textbox')).not.to.have.attribute('data-filled', '');
      });
    });

    describe('focused', () => {
      it('should apply [data-focused] style hook to all components when focused', async () => {
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

        expect(root).not.to.have.attribute('data-focused');
        expect(control).not.to.have.attribute('data-focused');
        expect(label).not.to.have.attribute('data-focused');
        expect(description).not.to.have.attribute('data-focused');

        fireEvent.focus(control);

        expect(root).to.have.attribute('data-focused', '');
        expect(control).to.have.attribute('data-focused', '');
        expect(label).to.have.attribute('data-focused', '');
        expect(description).to.have.attribute('data-focused', '');

        fireEvent.blur(control);

        expect(root).not.to.have.attribute('data-focused');
        expect(control).not.to.have.attribute('data-focused');
        expect(label).not.to.have.attribute('data-focused');
        expect(description).not.to.have.attribute('data-focused');
      });
    });
  });
});
