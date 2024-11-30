import * as React from 'react';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';
import { createRenderer, describeConformance } from '#test-utils';

describe('<AlertDialog.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<AlertDialog.Trigger />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render: (node) => {
      return render(
        <AlertDialog.Root open animated={false}>
          <AlertDialog.Backdrop />
          {node}
        </AlertDialog.Root>,
      );
    },
  }));
});
