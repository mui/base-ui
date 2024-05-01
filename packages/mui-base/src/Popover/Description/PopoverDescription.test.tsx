import * as React from 'react';
import * as Popover from '@base_ui/react/Popover';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { describeConformance } from '../../../test/describeConformance';
import { createRenderer } from '../../../test';

describe('<Popover.Description />', () => {
  const { render } = createRenderer();

  describeConformance(<Popover.Description />, () => ({
    inheritComponent: 'p',
    refInstanceof: window.HTMLParagraphElement,
    render(node) {
      return render(
        <Popover.Root open>
          <Popover.Positioner>
            <Popover.Popup>{node}</Popover.Popup>
          </Popover.Positioner>
        </Popover.Root>,
      );
    },
    skip: ['reactTestRenderer'],
  }));

  it('describes the popup element with its id', async () => {
    await render(
      <Popover.Root open animated={false}>
        <Popover.Positioner>
          <Popover.Popup>
            <Popover.Description>Title</Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Root>,
    );

    const id = document.querySelector('p')?.id;
    expect(screen.getByRole('dialog')).to.have.attribute('aria-describedby', id);
  });
});
