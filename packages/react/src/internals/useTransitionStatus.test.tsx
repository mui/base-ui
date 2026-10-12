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

  it('clears the starting status when an unmount and a close are batched', async () => {
    vi.spyOn(AnimationFrame, 'request').mockImplementation(() => 1);
    const controls: {
      current: { setOpen: (open: boolean) => void; setMounted: (mounted: boolean) => void } | null;
    } = { current: null };

    function UnmountableTest() {
      const [open, setOpen] = React.useState(false);
      const { transitionStatus, setMounted } = useTransitionStatus(open);
      controls.current = { setOpen, setMounted };
      return <div data-testid="status" data-status={transitionStatus ?? 'none'} />;
    }

    await render(<UnmountableTest />);
    await act(async () => {
      controls.current!.setOpen(true);
    });
    expect(screen.getByTestId('status')).toHaveAttribute('data-status', 'starting');

    // A forced unmount batched with the close skips the ending phase.
    await act(async () => {
      controls.current!.setMounted(false);
      controls.current!.setOpen(false);
    });

    expect(screen.getByTestId('status')).toHaveAttribute('data-status', 'none');
  });
});
