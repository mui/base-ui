import * as React from 'react';
import { createRenderer, screen } from '@mui/internal-test-utils';
import * as Fieldset from '@base_ui/react/Fieldset';
import { expect } from 'chai';
import { describeConformance } from '../../../test/describeConformance';

describe('<Fieldset.Legend />', () => {
  const { render } = createRenderer();

  describeConformance(<Fieldset.Legend />, () => ({
    inheritComponent: 'span',
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(<Fieldset.Root>{node}</Fieldset.Root>);
    },
  }));

  it('should set aria-labelledby on the fieldset automatically', () => {
    render(
      <Fieldset.Root>
        <Fieldset.Legend data-testid="legend">Legend</Fieldset.Legend>
      </Fieldset.Root>,
    );

    expect(screen.getByRole('group')).to.have.attribute(
      'aria-labelledby',
      screen.getByTestId('legend').id,
    );
  });

  it('should set aria-labelledby on the fieldset with custom id', () => {
    render(
      <Fieldset.Root>
        <Fieldset.Legend id="legend-id" />
      </Fieldset.Root>,
    );

    expect(screen.getByRole('group')).to.have.attribute('aria-labelledby', 'legend-id');
  });
});
