import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import * as RadioGroup from '@base_ui/react/RadioGroup';
import { describeConformance } from '../../../test/describeConformance';

describe('<RadioGroup.Indicator />', () => {
  const { render } = createRenderer();

  describeConformance(<RadioGroup.Indicator />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <RadioGroup.Root defaultValue="1">
          <RadioGroup.Item name="1">{node}</RadioGroup.Item>
        </RadioGroup.Root>,
      );
    },
  }));
});
