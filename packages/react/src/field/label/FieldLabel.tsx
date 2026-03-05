'use client';
import * as React from 'react';
import { error } from '@base-ui/utils/error';
import { SafeReact } from '@base-ui/utils/safeReact';
import { isHTMLElement } from '@floating-ui/utils/dom';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { ownerDocument } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { getTarget } from '../../floating-ui-react/utils';
import { FieldRoot } from '../root/FieldRoot';
import { useFieldRootContext } from '../root/FieldRootContext';
import { useLabelableContext } from '../../labelable-provider/LabelableContext';
import { fieldValidityMapping } from '../utils/constants';
import { useBaseUiId } from '../../utils/useBaseUiId';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * An accessible label that is automatically associated with the field control.
 * Renders a `<label>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export const FieldLabel = React.forwardRef(function FieldLabel(
  componentProps: FieldLabel.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { render, className, id: idProp, nativeLabel = true, ...elementProps } = componentProps;

  const fieldRootContext = useFieldRootContext(false);

  const { controlId, setLabelId, labelId: contextLabelId } = useLabelableContext();

  const generatedLabelId = useBaseUiId(idProp);
  const labelId = idProp ?? contextLabelId ?? generatedLabelId;

  const labelRef = React.useRef<HTMLElement | null>(null);

  const handleInteraction = useStableCallback((event: React.MouseEvent) => {
    const target = getTarget(event.nativeEvent) as HTMLElement | null;
    if (target?.closest('button,input,select,textarea')) {
      return;
    }

    // Prevent text selection when double clicking label.
    if (!event.defaultPrevented && event.detail > 1) {
      event.preventDefault();
    }

    if (nativeLabel || !controlId) {
      return;
    }

    const controlElement = ownerDocument(event.currentTarget).getElementById(controlId);
    if (isHTMLElement(controlElement)) {
      controlElement.focus({
        // Available from Chrome 144+ (January 2026).
        // Safari and Firefox already support it.
        // @ts-expect-error not available in types yet
        focusVisible: true,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (!labelRef.current) {
        return;
      }

      const isLabelTag = labelRef.current.tagName === 'LABEL';

      if (nativeLabel) {
        if (!isLabelTag) {
          const ownerStackMessage = SafeReact.captureOwnerStack?.() || '';
          const message =
            '<Field.Label> expected a <label> element because the `nativeLabel` prop is true. ' +
            'Rendering a non-<label> disables native label association, so `htmlFor` will not ' +
            'work. Use a real <label> in the `render` prop, or set `nativeLabel` to `false`.';
          error(`${message}${ownerStackMessage}`);
        }
      } else if (isLabelTag) {
        const ownerStackMessage = SafeReact.captureOwnerStack?.() || '';
        const message =
          '<Field.Label> expected a non-<label> element because the `nativeLabel` prop is false. ' +
          'Rendering a <label> assumes native label behavior while Base UI treats it as ' +
          'non-native, which can cause unexpected pointer behavior. Use a non-<label> in the ' +
          '`render` prop, or set `nativeLabel` to `true`.';
        error(`${message}${ownerStackMessage}`);
      }
    }, [nativeLabel]);
  }

  useIsoLayoutEffect(() => {
    setLabelId(labelId);

    return () => {
      setLabelId(undefined);
    };
  }, [labelId, setLabelId]);

  const element = useRenderElement('label', componentProps, {
    ref: [forwardedRef, labelRef],
    state: fieldRootContext.state,
    props: [
      { id: labelId },
      nativeLabel
        ? {
            htmlFor: controlId ?? undefined,
            onMouseDown: handleInteraction,
          }
        : {
            onClick: handleInteraction,
            onPointerDown(event) {
              event.preventDefault();
            },
          },
      elementProps,
    ],
    stateAttributesMapping: fieldValidityMapping,
  });

  return element;
});

export type FieldLabelState = FieldRoot.State;

export interface FieldLabelProps extends BaseUIComponentProps<'label', FieldLabel.State> {
  /**
   * Whether the component renders a native `<label>` element when replacing it via the `render` prop.
   * Set to `false` if the rendered element is not a label (e.g. `<div>`).
   *
   * This is useful to avoid inheriting label behaviors on `<button>` controls (such as `<Select.Trigger>` and `<Combobox.Trigger>`), including avoiding `:hover` on the button when hovering the label, and preventing clicks on the label from firing on the button.
   * @default true
   */
  nativeLabel?: boolean | undefined;
}

export namespace FieldLabel {
  export type State = FieldLabelState;
  export type Props = FieldLabelProps;
}
