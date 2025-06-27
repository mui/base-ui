'use client';
import * as React from 'react';
import { FieldRoot } from '../root/FieldRoot';
import { useFieldRootContext } from '../root/FieldRootContext';
import { fieldValidityMapping } from '../utils/constants';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';

import { FieldItemContext } from './FieldItemContext';
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
  const { render, className, ...elementProps } = componentProps;

  const { state } = useFieldRootContext(false);

  const checkboxGroupContext = useCheckboxGroupContext();
  // checkboxGroupContext.parent is truthy even if no parent checkbox is involved
  const parentId = checkboxGroupContext?.parent.id;
  // this a more reliable check
  const hasParentCheckbox = checkboxGroupContext?.allValues !== undefined;

  const defaultControlId = useBaseUiId();

  const initialControlId = hasParentCheckbox ? parentId : defaultControlId;

  const [controlId, setControlId] = React.useState<string | null | undefined>(initialControlId);
  const [labelId, setLabelId] = React.useState<string | undefined>(undefined);
  const [messageIds, setMessageIds] = React.useState<string[]>([]);

  const contextValue: FieldItemContext = React.useMemo(
    () => ({
      controlId,
      setControlId,
      labelId,
      setLabelId,
      messageIds,
      setMessageIds,
    }),
    [controlId, setControlId, labelId, setLabelId, messageIds, setMessageIds],
  );

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    state,
    props: elementProps,
    stateAttributesMapping: fieldValidityMapping,
  });

  return <FieldItemContext.Provider value={contextValue}>{element}</FieldItemContext.Provider>;
});

export namespace FieldItem {
  export type State = FieldRoot.State;

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
