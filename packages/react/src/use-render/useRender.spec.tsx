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

const validDataset: useRender.DatasetProps = {
  'data-testid': 'button',
  'data-disabled': true,
  'data-count': 42,
  'data-label': 'Click me',
  'data-empty': undefined,
};

const element5 = useRender({
  render: () => <button type="button">Click</button>,
  dataset: {
    'data-testid': 'submit-button',
    'data-active': true,
    'data-index': 0,
  },
});

expectType<React.ReactElement, typeof element5>(element5);

const element6 = useRender({
  render: <div />,
  dataset: {
    'data-string': 'text',
    'data-number': 123,
    'data-boolean': false,
    'data-undefined': undefined,
  },
});

expectType<React.ReactElement, typeof element6>(element6);

const element7 = useRender({
  render: <button type="button" aria-label="Submit" />,
  dataset: {
    'data-testid': 'submit-button',
    'data-form': 'login',
  },
  props: {
    className: 'btn-primary',
    onClick: () => console.log('clicked'),
  },
});

expectType<React.ReactElement, typeof element7>(element7);
