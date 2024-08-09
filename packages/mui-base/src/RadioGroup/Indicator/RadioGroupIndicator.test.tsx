import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import * as RadioGroup from '@base_ui/react/RadioGroup';
import { describeConformance } from '../../../test/describeConformance';

describe('<RadioGroup.Indicator />', () => {
  const { render } = createRenderer();

  describeConformance(<RadioGroup.Indicator />, () => ({
    inheritComponent: 'span',
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(
        <RadioGroup.Root defaultValue="1">
          <RadioGroup.Item value="1">{node}</RadioGroup.Item>
        </RadioGroup.Root>,
      );
    },
  }));
});
