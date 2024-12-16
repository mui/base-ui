import * as React from 'react';
import { Field } from '@base-ui-components/react/field';
import { Checkbox } from '@base-ui-components/react/checkbox';
import { Switch } from '@base-ui-components/react/switch';
import { NumberField } from '@base-ui-components/react/number-field';
import { Slider } from '@base-ui-components/react/slider';
import { RadioGroup } from '@base-ui-components/react/radio-group';
import { Radio } from '@base-ui-components/react/radio';
import { createRenderer, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { describeConformance } from '../../../test/describeConformance';

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
        render(
          <Field.Root>
            <Checkbox.Root data-testid="button" />
            <Field.Label data-testid="label" />
          </Field.Root>,
        );

        const button = screen.getByTestId('button');

        expect(screen.getByTestId('label')).to.have.attribute('for', button.id);
      });
    });

    describe('Switch', () => {
      it('supports Switch', () => {
        render(
          <Field.Root>
            <Switch.Root data-testid="button" />
            <Field.Label data-testid="label" />
          </Field.Root>,
        );

        const button = screen.getByTestId('button');

        expect(screen.getByTestId('label')).to.have.attribute('for', button.id);
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
            <RadioGroup data-testid="radio-group">
              <Radio.Root value="1" />
            </RadioGroup>
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
