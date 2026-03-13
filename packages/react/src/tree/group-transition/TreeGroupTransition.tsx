'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { AnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useAnimationsFinished } from '../../utils/useAnimationsFinished';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';
import { useTreeRootContext } from '../root/TreeRootContext';
import { TreeGroupTransitionDataAttributes } from './TreeGroupTransitionDataAttributes';
import { TreeGroupTransitionCssVars } from './TreeGroupTransitionCssVars';
import { TreeGroupTransitionContext } from './TreeGroupTransitionContext';
import type { TransitionStatus } from '../../utils/useTransitionStatus';

interface TreeGroupTransitionInternalState extends TreeGroupTransitionState {
  parentId: string;
  transitionStatus: TransitionStatus;
}

const groupTransitionStateAttributesMapping: StateAttributesMapping<TreeGroupTransitionInternalState> =
  {
    animation: () => null,
    parentId: (value) => ({ [TreeGroupTransitionDataAttributes.parentId]: value }),
    ...transitionStatusMapping,
  };

/**
 * A wrapper rendered around a group of tree items during expand/collapse
 * animation. Animates its height from 0 to scrollHeight (or vice versa)
 * using CSS variables and data attributes.
 *
 * Auto-returns `null` when there are no animated children.
 * Removed from the DOM once the animation completes.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export function TreeGroupTransition(componentProps: TreeGroupTransition.Props) {
  const context = React.useContext(TreeGroupTransitionContext);

  if (!componentProps.children || !context) {
    return null;
  }

  return <TreeGroupTransitionInner {...componentProps} context={context} />;
}

function TreeGroupTransitionInner(
  props: TreeGroupTransition.Props & {
    context: NonNullable<React.ContextType<typeof TreeGroupTransitionContext>>;
  },
) {
  const { context, ...componentProps } = props;
  const { parentId, animation } = context;
  const {
    className,
    style,
    render,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;
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
    ref: panelRef,
    props: [
      {
        role: 'presentation',
        style: {
          overflow: 'hidden',
          ...((height !== undefined && {
            [TreeGroupTransitionCssVars.treeGroupHeight as string]: `${height}px`,
          }) as React.CSSProperties),
        },
      },
      elementProps,
    ],
    stateAttributesMapping: groupTransitionStateAttributesMapping,
  });

  return element;
}

export interface TreeGroupTransitionState {
  animation: 'expanding' | 'collapsing';
}

export interface TreeGroupTransitionProps extends BaseUIComponentProps<
  'div',
  TreeGroupTransitionState
> {}

export namespace TreeGroupTransition {
  export type State = TreeGroupTransitionState;
  export type Props = TreeGroupTransitionProps;
}
