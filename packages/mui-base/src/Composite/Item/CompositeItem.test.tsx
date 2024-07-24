import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import { describeConformance } from '../../../test/describeConformance';
import { CompositeRoot } from '../Root/CompositeRoot';
import { CompositeItem } from './CompositeItem';

describe('<CompositeItem />', () => {
  const { render } = createRenderer();

  describeConformance(<CompositeItem />, () => ({
    inheritComponent: 'div',
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<CompositeRoot>{node}</CompositeRoot>);
    },
  }));
});
