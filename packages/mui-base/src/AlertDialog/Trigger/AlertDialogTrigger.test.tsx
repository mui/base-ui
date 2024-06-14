import * as React from 'react';
import * as AlertDialog from '@base_ui/react/AlertDialog';
import { createRenderer, describeConformance } from '../../../test';

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
    skip: ['reactTestRenderer'],
  }));
});
