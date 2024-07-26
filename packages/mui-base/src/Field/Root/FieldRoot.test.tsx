import * as React from 'react';
import * as Field from '@base_ui/react/Field';
import * as Checkbox from '@base_ui/react/Checkbox';
import * as Switch from '@base_ui/react/Switch';
import * as NumberField from '@base_ui/react/NumberField';
import * as Slider from '@base_ui/react/Slider';
import { act, createRenderer, flushMicrotasks, screen } from '@mui/internal-test-utils';
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
    it('should add data-disabled style hook to all components', () => {
      render(
        <Field.Root disabled data-testid="field">
          <Field.Control data-testid="control" />
          <Field.Label data-testid="label" />
          <Field.Message data-testid="message" />
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
    it('should validate the field on blur', async () => {
      render(
        <Field.Root validate={() => 'error'}>
          <Field.Control />
          <Field.Message show="customError" />
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

      expect(screen.queryByText('error')).not.to.equal(null);
    });

    it('supports async validation', async () => {
      render(
        <Field.Root validate={() => Promise.resolve('error')}>
          <Field.Control />
          <Field.Message show="customError" />
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

      expect(screen.queryByText('error')).not.to.equal(null);
    });

    it('[Checkbox] forwards the disabled prop to Base UI input components', () => {
      render(
        <Field.Root disabled>
          <Checkbox.Root />
        </Field.Root>,
      );

      expect(screen.getAllByRole('checkbox')[1]).to.have.attribute('disabled');
    });

    it('[Switch] forwards the disabled prop to Base UI input components', () => {
      render(
        <Field.Root disabled>
          <Switch.Root />
        </Field.Root>,
      );

      expect(screen.getAllByRole('checkbox')[0]).to.have.attribute('disabled');
    });

    it('[NumberField] forwards the disabled prop to Base UI input components', () => {
      render(
        <Field.Root disabled>
          <NumberField.Root>
            <NumberField.Group>
              <NumberField.Input />
            </NumberField.Group>
          </NumberField.Root>
        </Field.Root>,
      );

      expect(screen.getByRole('textbox')).to.have.attribute('disabled');
    });

    it('[Slider] forwards the disabled prop to Base UI input components', () => {
      render(
        <Field.Root disabled>
          <Slider.Root>
            <Slider.Output />
            <Slider.Control>
              <Slider.Track>
                <Slider.Indicator />
                <Slider.Thumb />
              </Slider.Track>
            </Slider.Control>
          </Slider.Root>
        </Field.Root>,
      );

      expect(screen.getByRole('slider')).to.have.attribute('disabled');
    });
  });

  describe('prop: name', () => {
    it('forwards the name to the control', () => {
      render(
        <Field.Root name="field">
          <Field.Control />
        </Field.Root>,
      );

      expect(screen.getByRole('textbox')).to.have.attribute('name', 'field');
    });

    it('[Checkbox] forwards the name to Base UI input components', () => {
      render(
        <Field.Root name="field">
          <Checkbox.Root />
        </Field.Root>,
      );

      expect(screen.getAllByRole('checkbox')[1]).to.have.attribute('name', 'field');
    });

    it('[Switch] forwards the name to Base UI input components', () => {
      render(
        <Field.Root name="field">
          <Switch.Root />
        </Field.Root>,
      );

      expect(screen.getAllByRole('checkbox')[0]).to.have.attribute('name', 'field');
    });

    it('[NumberField] forwards the name to Base UI input components', () => {
      render(
        <Field.Root name="field">
          <NumberField.Root>
            <NumberField.Group>
              <NumberField.Input />
            </NumberField.Group>
          </NumberField.Root>
        </Field.Root>,
      );

      expect(screen.getByRole('textbox')).to.have.attribute('name', 'field');
    });

    it('[Slider] forwards the name to Base UI input components', () => {
      render(
        <Field.Root name="field">
          <Slider.Root>
            <Slider.Output />
            <Slider.Control>
              <Slider.Track>
                <Slider.Indicator />
                <Slider.Thumb />
              </Slider.Track>
            </Slider.Control>
          </Slider.Root>
        </Field.Root>,
      );

      expect(screen.getByRole('slider')).to.have.attribute('name', 'field');
    });
  });
});
