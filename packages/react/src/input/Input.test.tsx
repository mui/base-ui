import { describe } from 'vitest';
import { Input } from '@base-ui/react/input';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Input />', () => {
  const { render } = createRenderer();

  describeConformance(<Input />, () => ({
    refInstanceof: window.HTMLInputElement,
    render,
  }));
});
