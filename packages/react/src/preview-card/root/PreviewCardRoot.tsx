'use client';
import * as React from 'react';
import { PreviewCardRootContext } from './PreviewCardContext';
import { usePreviewCardRoot } from './usePreviewCardRoot';
import { CLOSE_DELAY, OPEN_DELAY } from '../utils/constants';
import type { BaseOpenChangeReason } from '../../utils/translateOpenChangeReason';

/**
 * Groups all parts of the preview card.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export const PreviewCardRoot: React.FC<PreviewCardRoot.Props> = function PreviewCardRoot(props) {
  const { delay, closeDelay, onOpenChangeComplete, actionsRef } = props;

  const delayWithDefault = delay ?? OPEN_DELAY;
  const closeDelayWithDefault = closeDelay ?? CLOSE_DELAY;

  const previewCardRoot = usePreviewCardRoot({
    delay,
    closeDelay,
    actionsRef,
    onOpenChangeComplete,
    open: props.open,
    onOpenChange: props.onOpenChange,
    defaultOpen: props.defaultOpen,
  });

  const contextValue = React.useMemo(
    () => ({
      ...previewCardRoot,
      delay: delayWithDefault,
      closeDelay: closeDelayWithDefault,
    }),
    [closeDelayWithDefault, delayWithDefault, previewCardRoot],
  );

  return (
    <PreviewCardRootContext.Provider value={contextValue}>
      {props.children}
    </PreviewCardRootContext.Provider>
  );
};

export namespace PreviewCardRoot {
  export interface State {}

  export interface Props extends usePreviewCardRoot.Parameters {
    children?: React.ReactNode;
  }

  export type Actions = usePreviewCardRoot.Actions;

  export type OpenChangeReason = BaseOpenChangeReason;
}
