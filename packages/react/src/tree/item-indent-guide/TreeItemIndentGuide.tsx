'use client';
import * as React from 'react';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import { useStore } from '@base-ui/utils/store';
import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useTreeRootContext } from '../root/TreeRootContext';
import { useTreeItemContext } from '../item/TreeItemContext';
import type { TreeState } from '../store/types';
import { selectAncestorLastChildFlags } from './selectAncestorLastChildFlags';
import * as TreeItemIndentGuideCssVars from './TreeItemIndentGuideCssVars';
import * as TreeItemIndentGuideDataAttributes from './TreeItemIndentGuideDataAttributes';

const stateAttributesMapping = { level: () => null };

/**
 * Renders vertical indent guide lines for a tree item, one per ancestor level.
 * Each line carries `data-level` and, when its ancestor is a last child, `data-last`.
 * Renders a `<span>` element containing inner `<span>` elements.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeItemIndentGuide = fastComponentRef(function TreeItemIndentGuide(
  componentProps: TreeItemIndentGuide.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { className, render, style, ...elementProps } = componentProps;

  const store = useTreeRootContext();
  const itemId = useTreeItemContext();
  const level = store.useState('itemLevel', itemId);
  // Any structural change creates new flag arrays, while the flags of most rows stay the same.
  const selectFlags = React.useMemo(() => {
    let previous: boolean[] | undefined;
    return (state: TreeState) => {
      const next = selectAncestorLastChildFlags(state, itemId);
      if (previous === undefined || !areArraysEqual(previous, next)) {
        previous = next;
      }
      return previous;
    };
  }, [itemId]);
  const ancestorLastChildFlags = useStore(store, selectFlags);

  const hasGuides = level > 1;

  const state: TreeItemIndentGuide.State = {
    level,
  };

  const guideSpans = hasGuides
    ? ancestorLastChildFlags.map((isLast: boolean, index: number) => {
        const lineLevel = index + 1;
        const attrs: Record<string, string> = {
          [TreeItemIndentGuideDataAttributes.level]: String(lineLevel),
        };
        if (isLast) {
          attrs[TreeItemIndentGuideDataAttributes.last] = '';
        }
        return (
          <span
            key={lineLevel}
            aria-hidden
            style={{ [TreeItemIndentGuideCssVars.level]: lineLevel } as React.CSSProperties}
            {...attrs}
          />
        );
      })
    : null;

  return useRenderElement('span', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      { 'aria-hidden': true } as React.HTMLAttributes<HTMLSpanElement>,
      elementProps,
      { children: guideSpans } as React.HTMLAttributes<HTMLSpanElement>,
    ],
    stateAttributesMapping,
    enabled: hasGuides,
  });
});

export interface TreeItemIndentGuideState {
  /**
   * The level of the item in the tree hierarchy (1-based).
   */
  level: number;
}

export interface TreeItemIndentGuideProps extends BaseUIComponentProps<
  'span',
  TreeItemIndentGuideState
> {}

export namespace TreeItemIndentGuide {
  export type State = TreeItemIndentGuideState;
  export type Props = TreeItemIndentGuideProps;
}
