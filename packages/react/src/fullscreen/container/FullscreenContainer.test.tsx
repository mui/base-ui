import * as React from 'react';
import { Fullscreen } from '@base-ui/react/fullscreen';
import { createRenderer, describeConformance } from '#test-utils';
import { installFullscreenApiStubs, type FullscreenApiStubs } from '../root/fullscreenApiTestUtils';

describe('<Fullscreen.Container />', () => {
  const { render } = createRenderer();
  let stubs: FullscreenApiStubs;

  beforeEach(() => {
    stubs = installFullscreenApiStubs();
  });

  afterEach(() => {
    stubs.restore();
  });

  describeConformance(<Fullscreen.Container />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => {
      return render(<Fullscreen.Root>{node}</Fullscreen.Root>);
    },
  }));
});
