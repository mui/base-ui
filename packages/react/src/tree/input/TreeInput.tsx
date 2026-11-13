'use client';
import * as React from 'react';
import { platform } from '@base-ui/utils/platform';
import { useStore } from '@base-ui/utils/store';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { useTreeFilterPart } from '../filter-provider/TreeFilterContext';

/**
 * A search field that filters the tree.
 * Requires the tree to be wrapped in `Tree.FilterProvider`.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeInput = React.forwardRef(function TreeInput(
  componentProps: TreeInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const {
    render,
    className,
    style,
    id: idProp,
    disabled: disabledProp = false,
    ...elementProps
  } = componentProps;

  // Browsers flag a form field with neither an id nor a name.
  const id = useBaseUiId(idProp);

  const { store, filtering, value, onValueChange } = useTreeFilterPart('Input');
  const treeDisabled = useStore(store, (state) => state.disabled);
  const listId = useStore(store, (state) => state.listId);
  const disabled = treeDisabled || disabledProp;

  // IME text isn't committed until the composition ends, so filtering waits for it.
  const [composingValue, setComposingValue] = React.useState<string | null>(null);
  const isComposingRef = React.useRef(false);

  function commitValue(nextValue: string, nativeEvent: Event) {
    onValueChange(
      nextValue,
      createChangeEventDetails(
        nextValue === '' ? REASONS.inputClear : REASONS.inputChange,
        nativeEvent,
      ),
    );
  }

  // A ref callback rather than an effect, so an element swapped by `render`
  // registers too.
  const inputRef = React.useCallback(
    (element: HTMLInputElement | null) =>
      element == null ? undefined : filtering.registerInput(element),
    [filtering],
  );

  const state: TreeInput.State = { disabled };

  return useRenderElement('input', componentProps, {
    state,
    ref: [forwardedRef, inputRef],
    props: [
      {
        id,
        type: 'text',
        role: 'searchbox',
        inputMode: 'search',
        enterKeyHint: 'search',
        autoComplete: 'off',
        spellCheck: 'false',
        autoCorrect: 'off',
        autoCapitalize: 'none',
        disabled,
        'aria-controls': listId,
        value: composingValue ?? value,
        onCompositionStart(event: React.CompositionEvent<HTMLInputElement>) {
          // Some Android keyboards treat all typing as one composition.
          if (platform.os.android) {
            return;
          }
          isComposingRef.current = true;
          setComposingValue(event.currentTarget.value);
        },
        onCompositionEnd(event: React.CompositionEvent<HTMLInputElement>) {
          if (!isComposingRef.current) {
            return;
          }
          isComposingRef.current = false;
          setComposingValue(null);
          commitValue(event.currentTarget.value, event.nativeEvent);
        },
        onChange(event: React.ChangeEvent<HTMLInputElement>) {
          if (isComposingRef.current) {
            setComposingValue(event.currentTarget.value);
            return;
          }
          commitValue(event.currentTarget.value, event.nativeEvent);
        },
        onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
          // Modified keys edit the text, and IME keys belong to the composition.
          if (
            event.nativeEvent.isComposing ||
            event.which === 229 ||
            event.shiftKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.altKey
          ) {
            return;
          }
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
            if (event.key === 'Enter' && !filtering.isActive(store.state)) {
              return;
            }
            const from = event.key === 'ArrowUp' ? 'last' : 'first';
            if (filtering.focusTree(from, REASONS.keyboard, event.nativeEvent)) {
              event.preventDefault();
            }
          } else if (event.key === 'Escape' && value !== '' && !event.currentTarget.readOnly) {
            // Clear first; a surrounding popup closes on the next Escape.
            event.preventDefault();
            event.stopPropagation();
            onValueChange('', createChangeEventDetails(REASONS.escapeKey, event.nativeEvent));
          }
        },
      },
      elementProps,
    ],
  });
});

export interface TreeInputState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
}

export interface TreeInputProps extends BaseUIComponentProps<'input', TreeInputState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace TreeInput {
  export type State = TreeInputState;
  export type Props = TreeInputProps;
}
