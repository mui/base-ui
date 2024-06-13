import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import * as CheckboxGroup from '@base_ui/react/CheckboxGroup';
import { expect } from 'chai';
import { describeConformance } from '../../../test/describeConformance';

describe('<CheckboxGroup.Label />', () => {
  const { render } = createRenderer();

  describeConformance(<CheckboxGroup.Label />, () => ({
    inheritComponent: 'span',
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(<CheckboxGroup.Root>{node}</CheckboxGroup.Root>);
    },
    skip: ['reactTestRenderer'],
  }));

  it('should label the group', () => {
    const { getByRole } = render(
      <CheckboxGroup.Root>
        <CheckboxGroup.Label>Test</CheckboxGroup.Label>
      </CheckboxGroup.Root>,
    );

    expect(getByRole('group')).toHaveAccessibleName('Test');
  });
});
