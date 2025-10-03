import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Combobox.Backdrop />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.Backdrop />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Combobox.Root defaultOpen>
          <Combobox.Portal>{node}</Combobox.Portal>
        </Combobox.Root>,
      );
    },
  }));
});
