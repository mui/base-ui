'use client';

import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { contains, getTarget } from '../../floating-ui-react/utils/element';
import { TYPEABLE_SELECTOR } from '../../floating-ui-react/utils/constants';
import { useRenderElement } from '../../internals/useRenderElement';
import type { BaseUIComponentProps } from '../../internals/types';
import { DropzoneRootContext } from './DropzoneRootContext';
import { dropzoneRootStateAttributesMapping } from './stateAttributesMapping';

const INTERACTIVE_SELECTOR = `button,a[href],[role="button"],select,[tabindex]:not([tabindex="-1"]),${TYPEABLE_SELECTOR}`;

function hasFiles(dataTransfer: DataTransfer | null): boolean {
  return dataTransfer?.types.includes('Files') ?? false;
}

export interface DropzoneRootState {
  /**
   * Whether files are being dragged over the dropzone.
   */
  dragging: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
}

export interface DropzoneRootProps extends Omit<
  BaseUIComponentProps<'div', DropzoneRootState>,
  'children'
> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Event handler called when the dragging state changes.
   */
  onDraggingChange?: ((dragging: boolean) => void) | undefined;
  /**
   * Event handler called when the dropzone is activated without a `Dropzone.HiddenInput` present.
   * Use this to open a custom file picker when the built-in hidden input is not used.
   */
  onOpen?: (() => void) | undefined;
  /**
   * Event handler called when files are dropped onto the dropzone.
   */
  onFilesDrop?: ((files: File[], event: React.DragEvent<HTMLDivElement>) => void) | undefined;
  /**
   * The content of the dropzone.
   * A render function can be used to access the dragging state.
   */
  children?: React.ReactNode | ((state: { isDragging: boolean }) => React.ReactNode) | undefined;
}

/**
 * Interactive drop target and file selection area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Dropzone](https://base-ui.com/react/components/dropzone)
 */
export const DropzoneRoot = React.forwardRef<HTMLDivElement, DropzoneRootProps>(
  function DropzoneRoot(props, forwardedRef) {
    const {
      className,
      render,
      style,
      children,
      disabled = false,
      onDraggingChange,
      onOpen,
      onFilesDrop,
      ...elementProps
    } = props;

    const [dragging, setDraggingState] = React.useState(false);
    const [announcement, setAnnouncement] = React.useState<{ text: string; key: number }>({
      text: '',
      key: 0,
    });
    const inputElementRef = React.useRef<HTMLInputElement | null>(null);
    const draggingRef = React.useRef(dragging);

    const setInputElement = useStableCallback((node: HTMLInputElement | null) => {
      inputElementRef.current = node;
    });

    const setDragging = useStableCallback((nextDragging: boolean) => {
      if (draggingRef.current === nextDragging) {
        return;
      }

      draggingRef.current = nextDragging;
      setDraggingState(nextDragging);
      onDraggingChange?.(nextDragging);
    });

    const handleDragEnter = useStableCallback((event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (disabled || dragging || !hasFiles(event.dataTransfer)) {
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
      if (disabled || !dragging) {
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
      if (disabled || !hasFiles(event.dataTransfer)) {
        return;
      }

      event.dataTransfer.dropEffect = 'copy';
    });

    const handleDrop = useStableCallback((event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (disabled || !hasFiles(event.dataTransfer)) {
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
      const interactiveElement = target?.closest(INTERACTIVE_SELECTOR);

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

      // Do not trigger open when nested interactive controls are used.
      const target = getTarget(event.nativeEvent) as Element | null;
      if (target !== event.currentTarget) {
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
        <React.Fragment>
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
                children:
                  typeof children === 'function' ? children({ isDragging: dragging }) : children,
              },
              elementProps,
            ],
            stateAttributesMapping: dropzoneRootStateAttributesMapping,
          })}
          <output
            key={announcement.key}
            aria-atomic="true"
            aria-live="polite"
            style={{
              position: 'absolute',
              left: '-10000px',
              width: '1px',
              height: '1px',
              overflow: 'hidden',
            }}
          >
            {announcement.text}
          </output>
        </React.Fragment>
      </DropzoneRootContext.Provider>
    );
  },
);

export namespace DropzoneRoot {
  export type State = DropzoneRootState;
  export type Props = DropzoneRootProps;
}
