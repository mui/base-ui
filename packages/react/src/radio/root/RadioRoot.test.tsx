import * as React from 'react';
import { expect } from 'chai';
import { Radio } from '@base-ui-components/react/radio';
import { RadioGroup } from '@base-ui-components/react/radio-group';
import { fireEvent, screen } from '@mui/internal-test-utils';
import { describeConformance, createRenderer } from '#test-utils';

describe('<Radio.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Radio.Root value="" />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render,
  }));

  it('does not forward `value` prop', async () => {
    await render(
      <RadioGroup>
        <Radio.Root value="test" data-testid="radio-root" />
      </RadioGroup>,
    );

    expect(screen.getByTestId('radio-root')).not.to.have.attribute('value');
  });

  it('allows `null` value', async () => {
    await render(
      <RadioGroup>
        <Radio.Root value={null} data-testid="radio-null" />
        <Radio.Root value="a" data-testid="radio-a" />
      </RadioGroup>,
    );

    const radioNull = screen.getByTestId('radio-null');
    const radioA = screen.getByTestId('radio-a');
    fireEvent.click(radioNull);
    expect(radioNull).to.have.attribute('aria-checked', 'true');
    fireEvent.click(radioA);
    expect(radioNull).to.have.attribute('aria-checked', 'false');
  });
});
