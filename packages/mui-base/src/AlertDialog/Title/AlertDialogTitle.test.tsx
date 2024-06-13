import * as React from 'react';
import * as AlertDialog from '@base_ui/react/AlertDialog';
import { createRenderer, describeConformance } from '../../../test';

describe('<AlertDialog.Title />', () => {
  const { render } = createRenderer();

  describeConformance(<AlertDialog.Title />, () => ({
    refInstanceof: window.HTMLHeadingElement,
    render: (node) => {
      return render(
        <AlertDialog.Root open>
          <AlertDialog.Backdrop />
          <AlertDialog.Popup animated={false}>{node}</AlertDialog.Popup>
        </AlertDialog.Root>,
      );
    },
    skip: ['reactTestRenderer'],
  }));
});
