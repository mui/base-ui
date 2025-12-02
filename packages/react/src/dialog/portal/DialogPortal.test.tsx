import * as React from 'react';
import { Dialog } from '@base-ui-components/react/dialog';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Dialog.Portal />', () => {
  const { render } = createRenderer();

  describeConformance(<Dialog.Portal />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Dialog.Root open>{node}</Dialog.Root>);
    },
  }));
});
