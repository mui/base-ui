import * as React from 'react';
import { Field } from '@base_ui/react/Field';
import { Checkbox } from '@base_ui/react/Checkbox';
import { Switch } from '@base_ui/react/Switch';
import { NumberField } from '@base_ui/react/NumberField';
import { Slider } from '@base_ui/react/Slider';
import { RadioGroup } from '@base_ui/react/RadioGroup';
import { Radio } from '@base_ui/react/Radio';
import { createRenderer, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { describeConformance } from '#test-utils';

describe('<Field.Label />', () => {
  const { render } = createRenderer();

  describeConformance(<Field.Label />, () => ({
    refInstanceof: window.HTMLLabelElement,
    render(node) {
      return render(<Field.Root>{node}</Field.Root>);
    },
  }));

  it('should set htmlFor referencing the control automatically', () => {
    render(
      <Field.Root data-testid="field">
        <Field.Control />
        <Field.Label data-testid="label">Label</Field.Label>
      </Field.Root>,
    );

    expect(screen.getByTestId('label')).to.have.attribute('for', screen.getByRole('textbox').id);
  });

  describe('component integration', () => {
    describe('Checkbox', () => {
      it('supports Checkbox', () => {
        const { container } = render(
          <Field.Root>
            <Checkbox.Root data-testid="button" />
            <Field.Label data-testid="label" />
          </Field.Root>,
        );

        const internalInput = container.querySelector<HTMLInputElement>('input[type="checkbox"]')!;

        expect(screen.getByTestId('label')).to.have.attribute('for', internalInput.id);
      });
    });

    describe('Switch', () => {
      it('supports Switch', () => {
        const { container } = render(
          <Field.Root>
            <Switch.Root data-testid="button" />
            <Field.Label data-testid="label" />
          </Field.Root>,
        );

        const internalInput = container.querySelector<HTMLInputElement>('input[type="checkbox"]')!;

        expect(screen.getByTestId('label')).to.have.attribute('for', internalInput.id);
      });
    });

    describe('NumberField', () => {
      it('supports NumberField', () => {
        render(
          <Field.Root>
            <NumberField.Root>
              <NumberField.Input />
            </NumberField.Root>
            <Field.Label data-testid="label" />
          </Field.Root>,
        );

        expect(screen.getByTestId('label')).to.have.attribute(
          'for',
          screen.getByRole('textbox').id,
        );
      });
    });

    describe('Slider', () => {
      it('supports Slider', () => {
        render(
          <Field.Root>
            <Slider.Root data-testid="slider">
              <Slider.Control />
            </Slider.Root>
            <Field.Label data-testid="label" render={<span />} />
          </Field.Root>,
        );

        expect(screen.getByTestId('slider')).to.have.attribute(
          'aria-labelledby',
          screen.getByTestId('label').id,
        );
      });
    });

    describe('RadioGroup', () => {
      it('supports RadioGroup', () => {
        render(
          <Field.Root>
            <RadioGroup.Root data-testid="radio-group">
              <Radio.Root value="1" />
            </RadioGroup.Root>
            <Field.Label data-testid="label" />
          </Field.Root>,
        );

        expect(screen.getByTestId('radio-group')).to.have.attribute(
          'aria-labelledby',
          screen.getByTestId('label').id,
        );
      });
    });
  });
});
