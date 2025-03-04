import * as React from 'react';
import { Toast } from '@base-ui-components/react/toast';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Toast.Viewport />', () => {
  const { render } = createRenderer();

  describeConformance(<Toast.Viewport />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Toast.Provider>{node}</Toast.Provider>);
    },
  }));
});
