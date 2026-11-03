'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useDraggableRootContext } from '../root/DraggableRootContext';
import { useDraggablePositionerContext } from '../positioner/DraggablePositionerContext';
import * as DraggablePositionerCssVars from '../positioner/DraggablePositionerCssVars';
import type { DraggableTriggerProps, DraggableTriggerState } from '../trigger/DraggableTrigger';
import * as DraggablePreviewDataAttributes from './DraggablePreviewDataAttributes';

const PREVIEW_PROPS = { [DraggablePreviewDataAttributes.dragPreview as string]: '' };

// The trigger's size at pickup, so a copy of it keeps that size away from its layout.
const CLONE_SIZE_STYLE = {
  boxSizing: 'border-box',
  width: `var(${DraggablePositionerCssVars.dragSourceWidth})`,
  height: `var(${DraggablePositionerCssVars.dragSourceHeight})`,
} as React.CSSProperties;

function selectTriggerProps(props: DraggableTriggerProps | null) {
  return props;
}

/**
 * The content that follows the pointer during a drag. Without children, it renders the
 * trigger again: its element, props and children, without its `id`, `ref` and event handlers.
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
  const triggerProps = useStore(rootContext.triggerProps, selectTriggerProps);

  // An explicit `null` is custom content that renders nothing.
  const isClone = children === undefined;
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
        ...(typeof style === 'function' ? style({}) : style),
      },
    };
    ownProps = { ...clone.elementProps, ...elementProps, children: clone.children };
  }

  return useRenderElement('div', props, {
    ref: [forwardedRef, positionerContext.previewRef],
    props: [PREVIEW_PROPS, ownProps],
  });
});

/**
 * The trigger's props for its copy: function props resolved with the trigger's state,
 * and without what must stay unique to the trigger: its `id`, event handlers, and the
 * ref of its `render` element.
 */
function getCloneProps(props: DraggableTriggerProps, state: DraggableTriggerState) {
  const { className, render, style, children, id, ...rest } = props;
  const elementProps: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(rest)) {
    if (!/^on[A-Z]/.test(name)) {
      elementProps[name] = value;
    }
  }
  return {
    className: typeof className === 'function' ? className(state) : className,
    style: typeof style === 'function' ? style(state) : style,
    render:
      typeof render === 'function'
        ? (renderProps: React.HTMLAttributes<any>) => render(renderProps, state)
        : // The element's ref belongs to the trigger, which keeps it while the preview mounts.
          render && React.cloneElement(render, { ref: null } as React.Attributes),
    children,
    elementProps: elementProps as React.HTMLAttributes<HTMLElement>,
  };
}

export interface DraggablePreviewState {}

export interface DraggablePreviewProps extends BaseUIComponentProps<'div', DraggablePreviewState> {}

export namespace DraggablePreview {
  export type State = DraggablePreviewState;
  export type Props = DraggablePreviewProps;
}
