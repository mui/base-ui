'use client';
import * as React from 'react';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { AnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { inertValue } from '@base-ui/utils/inertValue';
import { useAnimationsFinished } from '../../internals/useAnimationsFinished';
import { transitionStatusMapping } from '../../internals/stateAttributesMapping';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { useRenderElement } from '../../internals/useRenderElement';
import type { BaseUIComponentProps } from '../../internals/types';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import type { TreeItemId } from '../store/types';

import { useTreeRootContext } from '../root/TreeRootContext';
import { TreeGroupTransitionContext } from './TreeGroupTransitionContext';
import type { TreeGroupTransitionAnimation } from './TreeGroupTransitionContext';
import * as TreeGroupTransitionCssVars from './TreeGroupTransitionCssVars';
import * as TreeGroupTransitionDataAttributes from './TreeGroupTransitionDataAttributes';

interface TreeGroupTransitionInternalState extends TreeGroupTransitionState {
  parentId: TreeItemId;
}

const groupTransitionStateAttributesMapping: StateAttributesMapping<TreeGroupTransitionInternalState> =
  {
    animation: (value) => ({
      [value === 'expanding'
        ? TreeGroupTransitionDataAttributes.expanding
        : TreeGroupTransitionDataAttributes.collapsing]: '',
    }),
    parentId: (value) => ({ [TreeGroupTransitionDataAttributes.parentId]: String(value) }),
    ...transitionStatusMapping,
  };

/**
 * A wrapper that animates a group of tree items while it expands or collapses.
 * Rendering this part next to an item enables transitions for that item's
 * children, which render inside it. Renders `null` while the group is not animating.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeGroupTransition = fastComponentRef(function TreeGroupTransition(
  componentProps: TreeGroupTransition.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const context = React.useContext(TreeGroupTransitionContext);
  const store = useTreeRootContext();

  let rowItemId: TreeItemId | null = null;
  if (context != null) {
    rowItemId = typeof context === 'object' ? context.parentId : context;
  }

  useIsoLayoutEffect(() => {
    if (rowItemId == null) {
      return undefined;
    }
    return store.expansion.registerGroupTransition(rowItemId);
  }, [store, rowItemId]);

  if (context == null || typeof context !== 'object') {
    return null;
  }

  return (
    <TreeGroupTransitionInner {...componentProps} context={context} forwardedRef={forwardedRef} />
  );
});

function TreeGroupTransitionInner(
  props: TreeGroupTransition.Props & {
    context: TreeGroupTransitionAnimation;
    forwardedRef: React.ForwardedRef<HTMLDivElement>;
  },
) {
  const { context, forwardedRef, ...componentProps } = props;
  const { parentId, animation } = context;
  const { className, style, render, ...elementProps } = componentProps;
  const store = useTreeRootContext();

  const panelRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState<number | undefined>(undefined);
  const isExpanding = animation === 'expanding';

  // For collapsing: we start without data-ending-style (showing full height),
  // then add it after a frame to trigger height → 0 transition.
  // For expanding: we start with data-starting-style (height: 0),
  // then remove it after a frame to trigger 0 → height transition.
  const [transitionReady, setTransitionReady] = React.useState(false);

  // Batched, so groups that finish together complete in one commit.
  const runOnceAnimationsFinish = useAnimationsFinished(panelRef, false, true);

  // Re-measured when the group's rows change, not only on mount: lazily loaded
  // children arriving (or a nested expand) mid-animation would otherwise
  // animate to the height the group had before they existed.
  //
  // `transitionReady` is deliberately *not* reset when `animation` flips: the
  // reversal is driven by `useAnimationsFinished` cancelling the interrupted
  // animation and re-arming on the new one, and forcing the starting style back
  // mid-flight strands the group instead (see the reversal test in
  // `TreeRoot.animation.test.tsx`).
  useIsoLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }
    setHeight(panel.scrollHeight);
  }, [context.children, animation]);

  // Trigger the transition on the frame after the height is measured.
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

  useIsoLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel || !transitionReady) {
      return undefined;
    }

    const abortController = new AbortController();

    runOnceAnimationsFinish(() => {
      store.expansion.completeGroupTransition(parentId);
    }, abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [transitionReady, runOnceAnimationsFinish, parentId, store, animation]);

  let transitionStatus: TransitionStatus;
  if (isExpanding && !transitionReady) {
    transitionStatus = 'starting';
  } else if (!isExpanding && transitionReady) {
    transitionStatus = 'ending';
  } else {
    transitionStatus = undefined;
  }

  const state: TreeGroupTransitionInternalState = { animation, parentId, transitionStatus };

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, panelRef],
    props: [
      {
        role: 'presentation',
        children: context.children,
        style: {
          overflow: 'hidden',
          ...((height !== undefined && {
            [TreeGroupTransitionCssVars.treeGroupTransitionHeight as string]: `${height}px`,
          }) as React.CSSProperties),
        },
      },
      elementProps,
      // Once the parent is collapsed, its exiting descendants must stop being
      // available to Tab and assistive technology immediately, rather than only
      // when the height animation finishes and this wrapper unmounts.
      isExpanding
        ? undefined
        : {
            'aria-hidden': true,
            inert: inertValue(true),
          },
    ],
    stateAttributesMapping: groupTransitionStateAttributesMapping,
  });

  return element;
}

export interface TreeGroupTransitionState {
  /**
   * Whether the group is expanding or collapsing.
   */
  animation: 'expanding' | 'collapsing';
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export interface TreeGroupTransitionProps extends Omit<
  BaseUIComponentProps<'div', TreeGroupTransitionState>,
  'children'
> {}

export namespace TreeGroupTransition {
  export type State = TreeGroupTransitionState;
  export type Props = TreeGroupTransitionProps;
}
