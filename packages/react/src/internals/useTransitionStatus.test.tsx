import * as React from 'react';
import { expect, describe, it, vi, afterEach } from 'vitest';
import { AnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { act, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { useTransitionStatus } from './useTransitionStatus';

describe('useTransitionStatus', () => {
  const { render } = createRenderer();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function Test(props: { open: boolean }) {
    const { transitionStatus } = useTransitionStatus(props.open);
    return <div data-testid="status" data-status={transitionStatus ?? 'none'} />;
  }

  it('does not request a frame for an element that mounts already open', async () => {
    const requestSpy = vi.spyOn(AnimationFrame, 'request');

    await render(<Test open />);

    expect(screen.getByTestId('status')).toHaveAttribute('data-status', 'none');
    expect(requestSpy).not.toHaveBeenCalled();
  });

  it('clears the starting status on the next frame after opening', async () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(AnimationFrame, 'request').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });

    const { setProps } = await render(<Test open={false} />);
    await setProps({ open: true });

    expect(screen.getByTestId('status')).toHaveAttribute('data-status', 'starting');
    expect(frames).toHaveLength(1);

    await act(async () => {
      frames[0](0);
    });

    expect(screen.getByTestId('status')).toHaveAttribute('data-status', 'none');
  });

  it('clears a stale ending status when reopened before the exit settles', async () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(AnimationFrame, 'request').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });

    const { setProps } = await render(<Test open />);
    await setProps({ open: false });
    expect(screen.getByTestId('status')).toHaveAttribute('data-status', 'ending');

    await setProps({ open: true });
    expect(frames).toHaveLength(1);

    await act(async () => {
      frames[0](0);
    });

    expect(screen.getByTestId('status')).toHaveAttribute('data-status', 'none');
  });
});
