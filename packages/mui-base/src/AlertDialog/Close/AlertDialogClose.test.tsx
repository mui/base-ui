import * as React from 'react';
import * as AlertDialog from '@base_ui/react/AlertDialog';
import { createRenderer, describeConformance } from '../../../test';

describe('<AlertDialog.Close />', () => {
  const { render } = createRenderer();

  describeConformance(<AlertDialog.Close />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render: (node) => {
      return render(
        <AlertDialog.Root open animated={false}>
          <AlertDialog.Backdrop />
          <AlertDialog.Popup>{node}</AlertDialog.Popup>
        </AlertDialog.Root>,
      );
    },
    skip: ['reactTestRenderer'],
  }));
});
