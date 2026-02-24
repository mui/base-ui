'use client';
import * as React from 'react';
import { error } from '@base-ui/utils/error';
import { SafeReact } from '@base-ui/utils/safeReact';
import { isHTMLElement } from '@floating-ui/utils/dom';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { ownerDocument } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { getTarget } from '../floating-ui-react/utils';
import { useLabelableContext } from '../labelable-provider/LabelableContext';
import { useBaseUiId } from '../utils/useBaseUiId';

const INTERACTIVE_SELECTOR = 'button,input,select,textarea';

/**
 * @internal
 */
export function useLabel(params: UseLabelParameters): UseLabelReturnValue {
  const { id: idProp, nativeLabel } = params;

  const { controlId, labelId: contextLabelId, setLabelId } = useLabelableContext();

  const generatedLabelId = useBaseUiId(idProp);
  const labelId = idProp ?? contextLabelId ?? generatedLabelId;

  const labelRef = React.useRef<HTMLElement | null>(null);

  function handleMouseDown(event: React.MouseEvent) {
    // Prevent text selection when double clicking label.
    if (!event.defaultPrevented && event.detail > 1) {
      event.preventDefault();
    }
  }

  const handleClick = useStableCallback(function handleClick(event: React.MouseEvent) {
    const target = getTarget(event.nativeEvent) as HTMLElement | null;
    if (isInteractiveTarget(target)) {
      return;
    }

    handleMouseDown(event);

    if (!controlId) {
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
            'Expected a <label> element because the `nativeLabel` prop is true. ' +
            'Rendering a non-<label> disables native label association, so `htmlFor` will not ' +
            'work. Use a real <label> in the `render` prop, or set `nativeLabel` to `false`.';
          error(`${message}${ownerStackMessage}`);
        }
      } else if (isLabelTag) {
        const ownerStackMessage = SafeReact.captureOwnerStack?.() || '';
        const message =
          'Expected a non-<label> element because the `nativeLabel` prop is false. ' +
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

  const interactionProps: React.ComponentProps<'label'> = nativeLabel
    ? {
        htmlFor: controlId ?? undefined,
        onMouseDown: handleMouseDown,
      }
    : {
        onClick: handleClick,
        onPointerDown(event) {
          const target = getTarget(event.nativeEvent) as HTMLElement | null;
          if (isInteractiveTarget(target)) {
            return;
          }

          event.preventDefault();
        },
      };

  return {
    labelRef,
    labelId,
    interactionProps,
  };
}

interface UseLabelParameters {
  id?: string | undefined;
  nativeLabel: boolean;
}

interface UseLabelReturnValue {
  labelRef: React.RefObject<HTMLElement | null>;
  labelId: string | undefined;
  interactionProps: React.ComponentProps<'label'>;
}

function isInteractiveTarget(target: HTMLElement | null): boolean {
  return target?.closest(INTERACTIVE_SELECTOR) != null;
}
