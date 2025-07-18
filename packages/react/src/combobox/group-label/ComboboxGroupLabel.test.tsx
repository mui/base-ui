import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Combobox.GroupLabel />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.GroupLabel />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Combobox.Root open>
          <Combobox.Group>{node}</Combobox.Group>
        </Combobox.Root>,
      );
    },
  }));
});
