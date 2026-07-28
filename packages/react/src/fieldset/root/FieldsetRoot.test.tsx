import { expect } from 'vitest';
import * as React from 'react';
import { createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
import { Checkbox } from '@base-ui/react/checkbox';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import { Field } from '@base-ui/react/field';
import { Fieldset } from '@base-ui/react/fieldset';
import { RadioGroup } from '@base-ui/react/radio-group';
import { Slider } from '@base-ui/react/slider';
import { describeConformance } from '../../../test/describeConformance';

describe('<Fieldset.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Fieldset.Root />, () => ({
    inheritComponent: 'fieldset',
    refInstanceof: window.HTMLFieldSetElement,
    render,
  }));

  it('sets the native disabled attribute', async () => {
    await render(
      <Fieldset.Root disabled data-testid="fieldset">
        <input />
      </Fieldset.Root>,
    );

    expect(screen.getByTestId('fieldset')).toHaveAttribute('disabled');
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('keeps nested fieldsets disabled when an ancestor fieldset is disabled', async () => {
    await render(
      <Fieldset.Root disabled>
        <Fieldset.Root>
          <Field.Root>
            <Field.Control data-testid="control" />
          </Field.Root>
        </Fieldset.Root>
      </Fieldset.Root>,
    );

    expect(screen.getByTestId('control')).toHaveAttribute('disabled');
  });

  it('updates nested disabled precedence in both directions', async () => {
    function App() {
      const [outerDisabled, setOuterDisabled] = React.useState(false);
      const [innerDisabled, setInnerDisabled] = React.useState(true);

      return (
        <React.Fragment>
          <Fieldset.Root disabled={outerDisabled}>
            <Fieldset.Root disabled={innerDisabled}>
              <Field.Root data-testid="root">
                <Field.Control data-testid="control" />
              </Field.Root>
            </Fieldset.Root>
          </Fieldset.Root>
          <button type="button" onClick={() => setOuterDisabled(true)}>
            Disable outer
          </button>
          <button type="button" onClick={() => setInnerDisabled(false)}>
            Enable inner
          </button>
          <button type="button" onClick={() => setOuterDisabled(false)}>
            Enable outer
          </button>
        </React.Fragment>
      );
    }

    await render(<App />);

    expect(screen.getByTestId('control')).toBeDisabled();
    expect(screen.getByTestId('root')).toHaveAttribute('data-disabled');
    fireEvent.click(screen.getByRole('button', { name: 'Disable outer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enable inner' }));
    expect(screen.getByTestId('control')).toBeDisabled();
    expect(screen.getByTestId('root')).toHaveAttribute('data-disabled');
    fireEvent.click(screen.getByRole('button', { name: 'Enable outer' }));
    expect(screen.getByTestId('control')).not.toBeDisabled();
    expect(screen.getByTestId('root')).not.toHaveAttribute('data-disabled');
  });

  it('passes disabled to rendered Base UI roots', async () => {
    await render(
      <div>
        <Fieldset.Root disabled render={<RadioGroup data-testid="radio-group" />} />
        <Fieldset.Root disabled render={<CheckboxGroup />}>
          <Checkbox.Root name="apple" data-testid="checkbox" />
        </Fieldset.Root>
        <Fieldset.Root disabled render={<Slider.Root defaultValue={50} />}>
          <Slider.Control data-testid="slider-control">
            <Slider.Track>
              <Slider.Thumb />
            </Slider.Track>
          </Slider.Control>
        </Fieldset.Root>
      </div>,
    );

    expect(screen.getByTestId('radio-group')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByTestId('checkbox')).toHaveAttribute('data-disabled');
    expect(screen.getByTestId('slider-control')).toHaveAttribute('data-disabled');
  });
});
