'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { AnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useAnimationsFinished } from '../../utils/useAnimationsFinished';
import { TransitionStatusDataAttributes } from '../../utils/stateAttributesMapping';
import { useRenderElement } from '../../utils/useRenderElement';
import { useTreeRootContext } from '../root/TreeRootContext';
import { TreeGroupTransitionDataAttributes } from './TreeGroupTransitionDataAttributes';

/**
 * A temporary wrapper rendered around a group of tree items during
 * expand/collapse animation. Animates its height from 0 to scrollHeight
 * (or vice versa) using CSS variables and data attributes.
 *
 * Removed from the DOM once the animation completes.
 *
 * @internal
 */
export function TreeGroupTransition(props: TreeGroupTransitionInternalProps) {
  const { parentId, animation, render, children } = props;
  const store = useTreeRootContext();

  const panelRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState<number | undefined>(undefined);
  const isExpanding = animation === 'expanding';

  // For collapsing: we start without data-ending-style (showing full height),
  // then add it after a frame to trigger height → 0 transition.
  // For expanding: we start with data-starting-style (height: 0),
  // then remove it after a frame to trigger 0 → height transition.
  const [transitionReady, setTransitionReady] = React.useState(false);

  const runOnceAnimationsFinish = useAnimationsFinished(panelRef);

  // Measure height on mount
  useIsoLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }
    setHeight(panel.scrollHeight);
  }, []);

  // After height is measured, trigger the transition on the next frame
  useIsoLayoutEffect(() => {
    if (height === undefined) {
      return undefined;
    }

    const frame = AnimationFrame.request(() => {
      setTransitionReady(true);
    });

    return () => {
      AnimationFrame.cancel(frame);
    };
  }, [height]);

  // Handle animation completion — calls store directly
  useIsoLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel || !transitionReady) {
      return undefined;
    }

    const abortController = new AbortController();

    runOnceAnimationsFinish(() => {
      store.completeGroupTransition(parentId);
    }, abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [transitionReady, runOnceAnimationsFinish, parentId, store]);

  const state: TreeGroupTransitionState = { animation };

  const dataAttributes: Record<string, string> = {
    [TreeGroupTransitionDataAttributes.parentId]: parentId,
  };

  if (isExpanding && !transitionReady) {
    dataAttributes[TransitionStatusDataAttributes.startingStyle] = '';
  }
  if (!isExpanding && transitionReady) {
    dataAttributes[TransitionStatusDataAttributes.endingStyle] = '';
  }

  const element = useRenderElement('div', { render }, {
    state,
    ref: panelRef,
    props: [
      {
        role: 'presentation',
        children,
        style: {
          overflow: 'hidden',
          ...((height !== undefined && {
            ['--tree-group-height' as string]: `${height}px`,
          }) as React.CSSProperties),
        },
        ...dataAttributes,
      },
    ],
  });

  return element;
}

export interface TreeGroupTransitionState {
  animation: 'expanding' | 'collapsing';
}

interface TreeGroupTransitionInternalProps {
  parentId: string;
  animation: 'expanding' | 'collapsing';
  render?: React.ReactElement | ((props: React.HTMLAttributes<any> & React.RefAttributes<any>, state: TreeGroupTransitionState) => React.ReactElement);
  children: React.ReactNode;
}

export namespace TreeGroupTransition {
  export type State = TreeGroupTransitionState;
}
