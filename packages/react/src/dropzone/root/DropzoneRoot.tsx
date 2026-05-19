'use client';

import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { contains, getTarget } from '../../floating-ui-react/utils/element';
import { useRenderElement } from '../../internals/useRenderElement';
import type { BaseUIComponentProps } from '../../internals/types';
import { DropzoneRootContext } from './DropzoneRootContext';
import { dropzoneRootStateAttributesMapping } from './stateAttributesMapping';

export interface DropzoneRootState {
  /**
   * Whether files are being dragged over the dropzone.
   */
  dragging: boolean;
  /**
   * Whether the dropzone is disabled.
   */
  disabled: boolean;
}

export interface DropzoneRootProps extends Omit<
  BaseUIComponentProps<'div', DropzoneRootState>,
  'children'
> {
  /**
   * Whether the dropzone is disabled.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Controlled dragging state.
   */
  dragging?: boolean | undefined;
  /**
   * Called when dragging state changes.
   */
  onDraggingChange?: ((dragging: boolean) => void) | undefined;
  /**
   * Called when the dropzone is activated by click or keyboard and no
   * `Dropzone.HiddenInput` is present. Use this as an escape hatch to
   * open a custom file picker when the built-in hidden input is not used.
   */
  onOpen?: (() => void) | undefined;
  /**
   * Called when files are dropped on the dropzone.
   */
  onFilesDrop?: ((files: File[], event: React.DragEvent<HTMLDivElement>) => void) | undefined;
  /**
   * The content of the dropzone.
   * This can be a React node or a render function that receives the dragging state.
   */
  children?: React.ReactNode | ((state: { isDragging: boolean }) => React.ReactNode) | undefined;
}

/**
 * Interactive drop target and file selection area.
 */
export const DropzoneRoot = React.forwardRef<HTMLDivElement, DropzoneRootProps>(
  function DropzoneRoot(props, forwardedRef) {
    const {
      className,
      render,
      style,
      children,
      disabled = false,
      dragging: draggingProp,
      onDraggingChange,
      onOpen,
      onFilesDrop,
      ...elementProps
    } = props;

    const [draggingUncontrolled, setDraggingUncontrolled] = React.useState(false);
    const [announcement, setAnnouncement] = React.useState<{ text: string; key: number }>({
      text: '',
      key: 0,
    });
    const inputElementRef = React.useRef<HTMLInputElement | null>(null);
    const dragging = draggingProp ?? draggingUncontrolled;

    const setInputElement = useStableCallback((node: HTMLInputElement | null) => {
      inputElementRef.current = node;
    });

    const setDragging = useStableCallback((nextDragging: boolean) => {
      if (draggingProp == null) {
        setDraggingUncontrolled(nextDragging);
      }
      onDraggingChange?.(nextDragging);
    });

    const handleDragEnter = useStableCallback((event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (disabled) {
        return;
      }
      setDragging(true);
      setAnnouncement((prev) => ({
        text: 'Ready to drop files',
        key: prev.key + 1,
      }));
    });

    const handleDragLeave = useStableCallback((event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (disabled) {
        return;
      }
      if (contains(event.currentTarget, event.relatedTarget as Element | null)) {
        return;
      }
      setDragging(false);
      setAnnouncement((prev) => ({
        text: 'Drag ended',
        key: prev.key + 1,
      }));
    });

    const handleDragOver = useStableCallback((event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (disabled) {
        return;
      }

      event.dataTransfer.dropEffect = 'copy';
    });

    const handleDrop = useStableCallback((event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (disabled) {
        return;
      }

      setDragging(false);
      const files = Array.from(event.dataTransfer.files);
      const message =
        files.length > 0
          ? `Dropped ${files.length} file${files.length !== 1 ? 's' : ''}`
          : 'No files dropped';
      setAnnouncement((prev) => ({
        text: message,
        key: prev.key + 1,
      }));
      if (files.length > 0) {
        onFilesDrop?.(files, event);
      }
    });

    const openPicker = useStableCallback(() => {
      if (inputElementRef.current) {
        inputElementRef.current.click();
        return;
      }

      onOpen?.();
    });

    const handleClick = useStableCallback((event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) {
        return;
      }

      // Do not trigger open when nested interactive controls are used.
      const target = getTarget(event.nativeEvent) as HTMLElement | null;
      const currentTarget = event.currentTarget as HTMLElement;
      const interactiveElement = target?.closest(
        'button, a, input, textarea, select, [role="button"]',
      );

      if (interactiveElement && interactiveElement !== currentTarget) {
        return;
      }

      event.preventDefault();
      openPicker();
    });

    const handleKeyDown = useStableCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) {
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openPicker();
      }
    });

    const contextValue = React.useMemo(
      () => ({
        disabled,
        setInputElement,
      }),
      [disabled, setInputElement],
    );

    return (
      <DropzoneRootContext.Provider value={contextValue}>
        {useRenderElement('div', props, {
          state: { dragging, disabled },
          ref: forwardedRef,
          props: [
            {
              role: 'button',
              tabIndex: disabled ? -1 : 0,
              'aria-disabled': disabled || undefined,
              onDragEnter: handleDragEnter,
              onDragLeave: handleDragLeave,
              onDragOver: handleDragOver,
              onDrop: handleDrop,
              onClick: handleClick,
              onKeyDown: handleKeyDown,
              children: (
                <React.Fragment>
                  <div
                    key={announcement.key}
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    style={{
                      position: 'absolute',
                      left: '-10000px',
                      width: '1px',
                      height: '1px',
                      overflow: 'hidden',
                    }}
                  >
                    {announcement.text}
                  </div>
                  {typeof children === 'function' ? children({ isDragging: dragging }) : children}
                </React.Fragment>
              ),
            },
            elementProps,
          ],
          stateAttributesMapping: dropzoneRootStateAttributesMapping,
        })}
      </DropzoneRootContext.Provider>
    );
  },
);

export namespace DropzoneRoot {
  export type State = DropzoneRootState;
  export type Props = DropzoneRootProps;
}
