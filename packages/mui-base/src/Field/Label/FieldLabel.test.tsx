import * as React from 'react';
import * as Field from '@base_ui/react/Field';
import * as Checkbox from '@base_ui/react/Checkbox';
import * as Switch from '@base_ui/react/Switch';
import * as NumberField from '@base_ui/react/NumberField';
import * as Slider from '@base_ui/react/Slider';
import { createRenderer, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { describeConformance } from '../../../test/describeConformance';

describe('<Field.Label />', () => {
  const { render } = createRenderer();

  describeConformance(<Field.Label />, () => ({
    inheritComponent: 'label',
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

        expect(screen.getByTestId('label')).to.have.attribute(
          'for',
          screen.getAllByRole('checkbox')[1].id,
        );
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

        expect(screen.getByTestId('label')).to.have.attribute(
          'for',
          screen.getByRole('checkbox').id,
        );
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
  });
});
