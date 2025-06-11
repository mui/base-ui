/* eslint-disable react-hooks/rules-of-hooks */
import * as React from 'react';
import { expectType } from '#test-utils';
import { useRender } from './useRender';

const element1 = useRender({
  render: () => <div>Test</div>,
});

expectType<React.ReactElement, typeof element1>(element1);

const element2 = useRender({
  render: () => <div>Test</div>,
  enabled: true,
});

expectType<React.ReactElement, typeof element2>(element2);

const element3 = useRender({
  render: () => <div>Test</div>,
  enabled: false,
});

expectType<null, typeof element3>(element3);

const element4 = useRender({
  render: () => <div>Test</div>,
  enabled: Math.random() > 0.5,
});

expectType<React.ReactElement | null, typeof element4>(element4);
