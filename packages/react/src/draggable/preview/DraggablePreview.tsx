'use client';
import * as React from 'react';
import { getReactElementRef } from '@base-ui/utils/getReactElementRef';
import type { BaseUIComponentProps } from '../../internals/types';
import { unwrapLazyRenderProp, useRenderElement } from '../../internals/useRenderElement';
import {
  CompositeListContext,
  NO_COMPOSITE_LIST,
} from '../../internals/composite/list/CompositeListContext';
import { resolveClassName } from '../../utils/resolveClassName';
import { resolveStyle } from '../../utils/resolveStyle';
import { useDraggableRootContext } from '../root/DraggableRootContext';
import { useDraggablePositionerContext } from '../positioner/DraggablePositionerContext';
import * as DraggablePositionerCssVars from '../positioner/DraggablePositionerCssVars';
import type { DraggableTriggerProps, DraggableTriggerState } from '../trigger/DraggableTrigger';
import * as DraggablePreviewDataAttributes from './DraggablePreviewDataAttributes';

const PREVIEW_PROPS = { [DraggablePreviewDataAttributes.dragPreview as string]: '' };

// The trigger's size at pickup, which a copy rendered outside its layout would lose.
const CLONE_SIZE_STYLE = {
  boxSizing: 'border-box',
  width: `var(${DraggablePositionerCssVars.dragSourceWidth})`,
  height: `var(${DraggablePositionerCssVars.dragSourceHeight})`,
} as React.CSSProperties;

/**
 * The content that follows the pointer during a drag. Without children, it renders the
 * trigger again: its element, props and children as they were when the drag started,
 * without its `id`, event handlers, and the refs of its element and children.
 * Render it inside `<Draggable.Positioner>`.
 * Renders a `<div>` element, or the trigger's element when empty.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/utils/draggable)
 */
export const DraggablePreview = React.forwardRef(function DraggablePreview(
  componentProps: DraggablePreview.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, style, children, ...elementProps } = componentProps;
  const rootContext = useDraggableRootContext();
  const positionerContext = useDraggablePositionerContext();
  // An explicit `null` is custom content that renders nothing.
  const isClone = children === undefined;
  // The trigger's props when its drag started, read once per drag. Subscribing to them
  // would render the preview again in a second commit each time the trigger renders.
  const preview = rootContext.drag.preview;
  const [snapshot, setSnapshot] = React.useState(() => ({
    preview,
    props: rootContext.triggerProps.current,
  }));
  if (isClone && preview !== null && snapshot.preview !== preview) {
    setSnapshot({ preview, props: rootContext.triggerProps.current });
  }
  const triggerProps = isClone ? snapshot.props : null;
  let props = componentProps;
  let ownProps: React.HTMLAttributes<HTMLElement> = { ...elementProps, children };
  if (isClone && triggerProps) {
    const clone = getCloneProps(triggerProps, {
      // The trigger as it looked before the pickup.
      dragging: false,
      settling: false,
      disabled: rootContext.disabled,
    });
    props = {
      ...componentProps,
      className: className ?? clone.className,
      render: render ?? clone.render,
      style: {
        ...clone.style,
        ...CLONE_SIZE_STYLE,
        ...resolveStyle(style, {}),
      },
    };
    ownProps = { ...clone.elementProps, ...elementProps, children: clone.children };
  }

  const element = useRenderElement('div', props, {
    ref: [forwardedRef, positionerContext.previewRef],
    props: [PREVIEW_PROPS, ownProps],
  });

  // List items inside the preview, such as a copied `Tabs.Tab`, skip registering with the
  // trigger's list: the copy would claim the item's index and fight it for the highlight.
  return (
    <CompositeListContext.Provider value={NO_COMPOSITE_LIST}>
      {element}
    </CompositeListContext.Provider>
  );
});

/**
 * The trigger's props for its copy, with function props resolved against `state`. Drops
 * what must stay unique to the trigger: its `id`, event handlers, and the refs of its
 * `render` element and children.
 */
function getCloneProps(props: DraggableTriggerProps, state: DraggableTriggerState) {
  const { className, render: renderProp, style, children, id, ...rest } = props;
  const render = unwrapLazyRenderProp(renderProp);
  const elementProps: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(rest)) {
    if (!isEventHandler(name)) {
      elementProps[name] = value;
    }
  }
  return {
    className: resolveClassName(className, state),
    style: resolveStyle(style, state),
    render:
      typeof render === 'function'
        ? (renderProps: React.HTMLAttributes<any>) => {
            const element = render(renderProps, state);
            return React.isValidElement(element)
              ? cloneWithoutChildRefs(element, getUniqueRenderProps(element, renderProps))
              : element;
          }
        : render && cloneWithoutChildRefs(render, getUniqueRenderProps(render)),
    children: withoutRefs(children),
    elementProps: elementProps as React.HTMLAttributes<HTMLElement>,
  };
}

function isEventHandler(name: string) {
  return /^on[A-Z]/.test(name);
}

/**
 * Overrides for the props of the trigger's `render` element that belong to the trigger
 * alone: its ref, its `id`, and its event handlers. Each takes the preview's own value
 * from `previewProps`.
 */
function getUniqueRenderProps(render: React.ReactElement, previewProps: object = {}) {
  const props = render.props as Record<string, unknown>;
  const own = previewProps as Record<string, unknown>;
  const unique: Record<string, unknown> = { ref: own.ref ?? null };
  for (const name of ['id', ...Object.keys(props).filter(isEventHandler)]) {
    if (props[name] !== own[name]) {
      unique[name] = own[name];
    }
  }
  return unique as React.Attributes;
}

/**
 * `node` with the refs of its elements cleared, so they keep pointing at the trigger's
 * children, which outlive the preview.
 */
function withoutRefs(node: React.ReactNode): React.ReactNode {
  if (Array.isArray(node)) {
    const next = node.map(withoutRefs);
    return next.some((child, index) => child !== node[index]) ? next : node;
  }
  if (!React.isValidElement(node)) {
    return node;
  }
  return cloneWithoutChildRefs(
    node,
    getReactElementRef(node) != null ? ({ ref: null } as React.Attributes) : undefined,
  );
}

/** `element` cloned with `config`, and with the refs of its children cleared. */
function cloneWithoutChildRefs(element: React.ReactElement, config: React.Attributes | undefined) {
  const children = (element.props as { children?: React.ReactNode }).children;
  const nextChildren = withoutRefs(children);
  if (nextChildren === children) {
    return config ? React.cloneElement(element, config) : element;
  }
  // Passed as arguments, as JSX does, so React doesn't ask static children for keys.
  return Array.isArray(nextChildren)
    ? React.cloneElement(element, config, ...nextChildren)
    : React.cloneElement(element, config, nextChildren);
}

export interface DraggablePreviewState {}

export interface DraggablePreviewProps extends BaseUIComponentProps<'div', DraggablePreviewState> {}

export namespace DraggablePreview {
  export type State = DraggablePreviewState;
  export type Props = DraggablePreviewProps;
}
