'use client';
import { warn } from '@base-ui/utils/warn';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import * as React from 'react';
import { useRenderElement } from '../../internals/useRenderElement';
import { useButton } from '../../internals/use-button';
import type { BaseUIComponentProps, NativeButtonProps } from '../../internals/types';
import { useDraggableRootContext } from '../root/DraggableRootContext';
import { useTranslations } from '../../internals/localization-context/LocalizationContext';

/**
 * Whether `children` renders text a sighted user would read as the control's
 * name, so the default `aria-label` can stand aside rather than replace it.
 *
 * Walks into elements and fragments: the common styled form is
 * `<Handle><span>Reorder</span></Handle>`, and a check limited to direct
 * children would miss it and inject a name over the visible one. Whitespace-only
 * strings don't count — JSX preserves the spaces in `<Handle> <Icon /> </Handle>`
 * as children, and treating those as text would strip an icon-only handle's name
 * and expose it as an unnamed button.
 */
function hasRenderedText(children: React.ReactNode): boolean {
  return React.Children.toArray(children).some((child) => {
    if (typeof child === 'string') {
      return child.trim() !== '';
    }
    if (typeof child === 'number') {
      return true;
    }
    if (React.isValidElement<{ children?: React.ReactNode }>(child)) {
      // `aria-hidden` subtrees contribute nothing to the accessible name, so an
      // icon that labels itself for sighted users only must not suppress ours.
      // React accepts both the boolean and the `Booleanish` string form.
      const childProps = child.props as Record<string, unknown>;
      const ariaHidden = childProps['aria-hidden'];
      if (
        ariaHidden === true ||
        ariaHidden === 'true' ||
        childProps.hidden === true ||
        childProps.inert === true
      ) {
        return false;
      }
      return hasRenderedText(child.props.children);
    }
    return false;
  });
}

/**
 * Restricts the drag pickup to this element, leaving the rest of the source
 * interactive. Omit it to make the whole source draggable.
 * Renders a `<button>` element.
 *
 * A handle is typically a grip icon with no text, which would expose it as an
 * unnamed button. When the root has a `label` and the handle carries neither
 * `aria-label` nor `aria-labelledby` nor visible text, it takes a localized
 * name built from that label. A handle that renders visible text keeps that text
 * as its name; give it an explicit `aria-label` that *starts with* the visible
 * text if it needs a longer one. The subtree returned by a render function or
 * rendered internally by a custom component cannot be inspected safely; name an
 * icon-only handle explicitly when using either form.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/components/draggable)
 */
export const DraggableHandle = React.forwardRef(function DraggableHandle(
  componentProps: DraggableHandle.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    className,
    render,
    style,
    nativeButton = true,
    // Stripped rather than forwarded: the type rejects it, but a JavaScript
    // consumer can still pass it, and letting it reach the DOM natively disables
    // the button while the root stays draggable.
    disabled: disabledProp,
    ...elementProps
  } = componentProps;

  const { setHandleElement, label, disabled } = useDraggableRootContext();

  if (process.env.NODE_ENV !== 'production') {
    if (disabledProp !== undefined) {
      warn(
        'Base UI: `disabled` was passed to Draggable.Handle, which has no disabled state of its own. ' +
          'The engine reads `disabled` from Draggable.Root, so the handle would look disabled while the root stayed draggable. ' +
          'Set `disabled` on Draggable.Root instead.',
      );
    }
  }
  const translations = useTranslations();

  // A disabled root refuses the pickup at the engine level; the handle follows
  // so it isn't left as a focusable button that does nothing.
  const { getButtonProps, buttonRef } = useButton({ disabled, native: nativeButton });

  const state: DraggableHandle.State = { disabled };

  // Identifies this handle to the root across attach and detach. Created once,
  // so the ref callback keeps a stable identity too.
  const handleRef = useRefWithInit(() => {
    const token = {};
    return (node: HTMLElement | null) => setHandleElement(node, token);
  }).current;

  // Only when the root named the draggable and the consumer named nothing:
  // an explicit `aria-labelledby` or `aria-label` is authoritative, and without
  // a root `label` there is nothing to build a meaningful name from.
  //
  // Text children count as naming it too. The default exists for the icon-only
  // grip this component is usually rendered as; applied over visible text it
  // *replaces* that text in the accessible name — "Drag Task 3" over a handle
  // reading "Reorder" — which is a WCAG 2.5.3 (Label in Name) failure, and leaves
  // a speech-input user unable to activate it by what they can see.
  const renderedChildren = React.isValidElement<{ children?: React.ReactNode }>(render)
    ? render.props.children
    : undefined;
  const hasTextChildren = hasRenderedText(elementProps.children ?? renderedChildren);
  // Calling a render function just to inspect its output would invoke consumer code twice,
  // while a custom component's internal subtree is not available until React renders it.
  // Do not risk replacing unknown visible text with the generated name. Consumers using an
  // icon-only opaque render provide aria-label/aria-labelledby explicitly.
  const hasOpaqueRender =
    typeof render === 'function' ||
    (React.isValidElement(render) &&
      typeof render.type !== 'string' &&
      renderedChildren === undefined);
  const needsDefaultLabel =
    label !== undefined &&
    !hasTextChildren &&
    !hasOpaqueRender &&
    elementProps['aria-label'] === undefined &&
    elementProps['aria-labelledby'] === undefined;

  return useRenderElement('button', componentProps, {
    state,
    props: [
      needsDefaultLabel ? { 'aria-label': translations.dragHandleLabel({ label }) } : undefined,
      elementProps,
      getButtonProps,
    ],
    ref: [forwardedRef, buttonRef, handleRef],
  });
});

export interface DraggableHandleState {
  /**
   * Whether the draggable is disabled.
   */
  disabled: boolean;
}

export interface DraggableHandleProps
  extends
    Omit<BaseUIComponentProps<'button', DraggableHandleState>, 'disabled'>,
    Omit<NativeButtonProps, 'disabled'> {
  /**
   * A handle has no `disabled` of its own: the engine reads `disabled` from
   * `Draggable.Root`, so setting it here would natively disable the button while
   * leaving the root keyboard-draggable, with no `data-disabled` and the wrong
   * button props. Disable the root instead, and the handle follows.
   *
   * Typed `never` so passing it is a compile error rather than a silent no-op.
   */
  disabled?: never | undefined;
}

export namespace DraggableHandle {
  export type State = DraggableHandleState;
  export type Props = DraggableHandleProps;
}
