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

describe('<Field.Description />', () => {
  const { render } = createRenderer();

  describeConformance(<Field.Description />, () => ({
    refInstanceof: window.HTMLParagraphElement,
    render(node) {
      return render(<Field.Root>{node}</Field.Root>);
    },
  }));

  it('should set aria-describedby on the control automatically', () => {
    render(
      <Field.Root>
        <Field.Control />
        <Field.Description>Message</Field.Description>
      </Field.Root>,
    );

    expect(screen.getByRole('textbox')).to.have.attribute(
      'aria-describedby',
      screen.getByText('Message').id,
    );
  });

  describe('component integration', () => {
    describe('Checkbox', () => {
      it('supports Checkbox', () => {
        const { container } = render(
          <Field.Root>
            <Checkbox.Root data-testid="button" />
            <Field.Description data-testid="description" />
          </Field.Root>,
        );

        const internalInput = container.querySelector<HTMLInputElement>('input[type="checkbox"]');

        expect(internalInput).to.have.attribute(
          'aria-describedby',
          screen.getByTestId('description').id,
        );
      });
    });

    describe('Switch', () => {
      it('supports Switch', () => {
        const { container } = render(
          <Field.Root>
            <Switch.Root data-testid="button" />
            <Field.Description data-testid="description" />
          </Field.Root>,
        );

        const internalInput = container.querySelector<HTMLInputElement>('input[type="checkbox"]');

        expect(internalInput).to.have.attribute(
          'aria-describedby',
          screen.getByTestId('description').id,
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
            <Field.Description data-testid="description" />
          </Field.Root>,
        );

        expect(screen.getByRole('textbox')).to.have.attribute(
          'aria-describedby',
          screen.getByTestId('description').id,
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
            <Field.Description data-testid="description" />
          </Field.Root>,
        );

        expect(screen.getByTestId('slider')).to.have.attribute(
          'aria-describedby',
          screen.getByTestId('description').id,
        );
      });
    });

    describe('RadioGroup', () => {
      it('supports RadioGroup', () => {
        render(
          <Field.Root>
            <RadioGroup>
              <Radio.Root value="1" />
            </RadioGroup>
            <Field.Description data-testid="description" />
          </Field.Root>,
        );

        expect(screen.getByTestId('description')).to.have.attribute(
          'id',
          screen.getByRole('radiogroup').getAttribute('aria-describedby')!,
        );
      });
    });
  });
});
