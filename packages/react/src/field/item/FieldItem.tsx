'use client';
import * as React from 'react';
import { FieldRoot } from '../root/FieldRoot';
import { useFieldRootContext } from '../root/FieldRootContext';
import { fieldValidityMapping } from '../utils/constants';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { FieldItemContext } from './FieldItemContext';
import { LabelableProvider } from '../../labelable-provider';
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

  const checkboxGroupContext = useCheckboxGroupContext();
  // checkboxGroupContext.parent is truthy even if no parent checkbox is involved
  const parentId = checkboxGroupContext?.parent.id;
  // this a more reliable check
  const hasParentCheckbox = checkboxGroupContext?.allValues !== undefined;

  const controlId = hasParentCheckbox ? parentId : undefined;

  const fieldItemContext: FieldItemContext = React.useMemo(() => ({ disabled }), [disabled]);

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    state,
    props: elementProps,
    stateAttributesMapping: fieldValidityMapping,
  });

  return (
    <LabelableProvider controlId={controlId}>
      <FieldItemContext.Provider value={fieldItemContext}>{element}</FieldItemContext.Provider>
    </LabelableProvider>
  );
});

export interface FieldItemProps extends BaseUIComponentProps<'div', FieldItem.State> {
  /**
   * Whether the wrapped control should ignore user interaction.
   * The `disabled` prop on `<Field.Root>` takes precedence over this.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace FieldItem {
  export type State = FieldRoot.State;
  export type Props = FieldItemProps;
}
