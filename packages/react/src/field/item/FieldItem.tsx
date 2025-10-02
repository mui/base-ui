'use client';
import * as React from 'react';
import { FieldRoot } from '../root/FieldRoot';
import { useFieldRootContext } from '../root/FieldRootContext';
import { fieldValidityMapping } from '../utils/constants';
import { mergeProps } from '../../merge-props';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';
import { FieldItemContext } from './FieldItemContext';
import { useLabelable } from '../root/useLabelable';
import { LabelableContext, useLabelableContext } from '../root/LabelableContext';
import { useCheckboxGroupContext } from '../../checkbox-group/CheckboxGroupContext';

/**
 * Groups individual items in a checkbox group or radio group with a label and description.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export const FieldItem = React.forwardRef(function FieldItem(
  componentProps: FieldItem.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, disabled: disabledProp = false, ...elementProps } = componentProps;

  const { state, disabled: rootDisabled } = useFieldRootContext(false);

  const disabled = rootDisabled || disabledProp;

  const { messageIds: parentMessageIds } = useLabelableContext();

  const checkboxGroupContext = useCheckboxGroupContext();
  // checkboxGroupContext.parent is truthy even if no parent checkbox is involved
  const parentId = checkboxGroupContext?.parent.id;
  // this a more reliable check
  const hasParentCheckbox = checkboxGroupContext?.allValues !== undefined;

  const defaultControlId = useBaseUiId();

  const initialControlId = hasParentCheckbox ? parentId : defaultControlId;

  const labelable = useLabelable({ initialControlId });

  const getDescriptionProps = React.useCallback(
    (externalProps: HTMLProps) => {
      const messageIds = parentMessageIds.concat(labelable.messageIds);
      return mergeProps({ 'aria-describedby': messageIds.join(' ') || undefined }, externalProps);
    },
    [parentMessageIds, labelable.messageIds],
  );

  const labelableContext: LabelableContext = React.useMemo(
    () => ({ ...labelable, getDescriptionProps }),
    [labelable, getDescriptionProps],
  );

  const fieldItemContext: FieldItemContext = React.useMemo(() => ({ disabled }), [disabled]);

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    state,
    props: elementProps,
    stateAttributesMapping: fieldValidityMapping,
  });

  return (
    <LabelableContext.Provider value={labelableContext}>
      <FieldItemContext.Provider value={fieldItemContext}>{element}</FieldItemContext.Provider>
    </LabelableContext.Provider>
  );
});

export namespace FieldItem {
  export type State = FieldRoot.State;

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Whether the wrapped control should ignore user interaction.
     * The `disabled` prop on `<Field.Root>` takes precedence over this.
     * @default false
     */
    disabled?: boolean;
  }
}
