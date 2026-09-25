'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { warn } from '@base-ui/utils/warn';
import { BaseUIComponentProps } from '../../internals/types';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { useComboboxGroupContext } from '../group/ComboboxGroupContext';
import { useComboboxVirtualGroupContext } from '../group/ComboboxVirtualGroupContext';
import { useRenderElement } from '../../internals/useRenderElement';

/**
 * An accessible label that is automatically associated with its parent group.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxGroupLabel = React.forwardRef(function ComboboxGroupLabel(
  componentProps: ComboboxGroupLabel.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, id: idProp, ...elementProps } = componentProps;

  // Inside a virtualizer the group's wrapper is the virtualizer's, and it already references the
  // id it hands the header; the label adopts that id rather than registering one of its own.
  const virtualGroup = useComboboxVirtualGroupContext();
  const groupContext = useComboboxGroupContext(virtualGroup != null);

  const ownId = useBaseUiId(idProp);
  const id = virtualGroup?.id ?? ownId;

  if (process.env.NODE_ENV !== 'production') {
    // Only once the virtualizer's id exists: on React 17 it arrives after the first render.
    if (
      virtualGroup != null &&
      virtualGroup.id != null &&
      idProp != null &&
      idProp !== virtualGroup.id
    ) {
      warn(
        '<Combobox.GroupLabel> received an `id` prop that conflicts with the id provided by ' +
          '<Virtualizer>. Remove the `id` prop from virtualized group labels.',
      );
    }
  }

  const setLabelId = groupContext?.setLabelId;

  useIsoLayoutEffect(() => {
    if (setLabelId == null || virtualGroup != null) {
      return undefined;
    }

    setLabelId(id);
    return () => {
      setLabelId((currentId) => (currentId === id ? undefined : currentId));
    };
  }, [id, setLabelId, virtualGroup]);

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [{ id, 'aria-hidden': true }, elementProps],
  });

  return element;
});

export interface ComboboxGroupLabelState {}

export interface ComboboxGroupLabelProps extends BaseUIComponentProps<
  'div',
  ComboboxGroupLabelState
> {}

export namespace ComboboxGroupLabel {
  export type State = ComboboxGroupLabelState;
  export type Props = ComboboxGroupLabelProps;
}
