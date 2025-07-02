import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createRenderer } from '@mui/internal-test-utils';
import { useAnimationsFinished } from './useAnimationsFinished';
import { NOOP } from './noop';
import { useEventCallback } from './useEventCallback';

interface TestComponentProps {
  onAnimationsFinished?: () => void;
  ref?: React.RefObject<HTMLElement | null>;
  waitForNextTick?: boolean;
}

const TestComponent = function TestComponent({
  onAnimationsFinished = NOOP,
  ref,
  waitForNextTick,
}: TestComponentProps) {
  const divRef = React.useRef<HTMLDivElement | null>(null);
  const onAnimationsFinishedEvent = useAnimationsFinished(ref ?? divRef, waitForNextTick);
  const onAnimationsFinishedFn = useEventCallback(onAnimationsFinished);

  React.useEffect(() => {
    onAnimationsFinishedEvent(onAnimationsFinishedFn);
  }, [onAnimationsFinishedEvent, onAnimationsFinishedFn]);

  return <div ref={divRef} />;
};

describe('useAnimationsFinished', () => {
  const { render } = createRenderer();

  it('works correctly when ref is assigned', () => {
    const onAnimationsFinished = spy();

    render(<TestComponent onAnimationsFinished={onAnimationsFinished} />);

    expect(onAnimationsFinished.callCount).to.greaterThan(0);
  });

  it('works correctly when ref is not assigned', () => {
    const onAnimationsFinished = spy();

    render(<TestComponent ref={{ current: null }} onAnimationsFinished={onAnimationsFinished} />);

    expect(onAnimationsFinished.callCount).to.greaterThan(0);
  });
});
