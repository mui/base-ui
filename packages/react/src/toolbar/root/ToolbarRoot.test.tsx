import * as React from 'react';
import { expect } from 'chai';
// import { spy } from 'sinon';
// import { act } from '@mui/internal-test-utils';
import { Toolbar } from '@base-ui-components/react/toolbar';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Toolbar.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Toolbar.Root />, () => ({
    refInstanceof: window.HTMLDivElement,
    render,
  }));

  describe('ARIA attributes', () => {
    it('has role="toolbar"', async () => {
      const { container } = await render(<Toolbar.Root />);

      expect(container.firstElementChild as HTMLElement).to.have.attribute('role', 'toolbar');
    });
  });
});
