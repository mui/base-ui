'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { warn } from '@base-ui/utils/warn';
import { BaseUIComponentProps } from '../../utils/types';
import { useCollapsibleRootContext } from '../../collapsible/root/CollapsibleRootContext';
import { useCollapsiblePanel } from '../../collapsible/panel/useCollapsiblePanel';
import { useAccordionRootContext } from '../root/AccordionRootContext';
import type { AccordionRoot } from '../root/AccordionRoot';
import type { AccordionItem } from '../item/AccordionItem';
import { useAccordionItemContext } from '../item/AccordionItemContext';
import { accordionStateAttributesMapping } from '../item/stateAttributesMapping';
import { AccordionPanelCssVars } from './AccordionPanelCssVars';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';
import type { TransitionStatus } from '../../utils/useTransitionStatus';

/**
 * A collapsible panel with the accordion item contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 */
export const AccordionPanel = React.forwardRef(function AccordionPanel(
  componentProps: AccordionPanel.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    className,
    hiddenUntilFound: hiddenUntilFoundProp,
    keepMounted: keepMountedProp,
    id: idProp,
    render,
    ...elementProps
  } = componentProps;

  const { hiddenUntilFound: contextHiddenUntilFound, keepMounted: contextKeepMounted } =
    useAccordionRootContext();

  const {
    abortControllerRef,
    animationTypeRef,
    height,
    mounted,
    onOpenChange,
    open,
    panelId,
    panelRef,
    runOnceAnimationsFinish,
    setDimensions,
    setHiddenUntilFound,
    setKeepMounted,
    setMounted,
    setOpen,
    setVisible,
    transitionDimensionRef,
    visible,
    width,
    setPanelIdState,
    transitionStatus,
  } = useCollapsibleRootContext();

  const hiddenUntilFound = hiddenUntilFoundProp ?? contextHiddenUntilFound;
  const keepMounted = keepMountedProp ?? contextKeepMounted;

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useIsoLayoutEffect(() => {
      if (keepMountedProp === false && hiddenUntilFound) {
        warn(
          'The `keepMounted={false}` prop on a Accordion.Panel will be ignored when using `contextHiddenUntilFound` on the Panel or the Root since it requires the panel to remain mounted when closed.',
        );
      }
    }, [hiddenUntilFound, keepMountedProp]);
  }

  useIsoLayoutEffect(() => {
    if (idProp) {
      setPanelIdState(idProp);
      return () => {
        setPanelIdState(undefined);
      };
    }
    return undefined;
  }, [idProp, setPanelIdState]);

  useIsoLayoutEffect(() => {
    setHiddenUntilFound(hiddenUntilFound);
  }, [setHiddenUntilFound, hiddenUntilFound]);

  useIsoLayoutEffect(() => {
    setKeepMounted(keepMounted);
  }, [setKeepMounted, keepMounted]);

  useOpenChangeComplete({
    open: open && transitionStatus === 'idle',
    ref: panelRef,
    onComplete() {
      if (!open) {
        return;
      }

      setDimensions({ width: undefined, height: undefined });
    },
  });

  const { props } = useCollapsiblePanel({
    abortControllerRef,
    animationTypeRef,
    externalRef: forwardedRef,
    height,
    hiddenUntilFound,
    id: idProp ?? panelId,
    keepMounted,
    mounted,
    onOpenChange,
    open,
    panelRef,
    runOnceAnimationsFinish,
    setDimensions,
    setMounted,
    setOpen,
    setVisible,
    transitionDimensionRef,
    visible,
    width,
  });

  const { state, triggerId } = useAccordionItemContext();

  const panelState: AccordionPanel.State = React.useMemo(
    () => ({
      ...state,
      transitionStatus,
    }),
    [state, transitionStatus],
  );

  const element = useRenderElement('div', componentProps, {
    state: panelState,
    ref: [forwardedRef, panelRef],
    props: [
      props,
      {
        'aria-labelledby': triggerId,
        role: 'region',
        style: {
          [AccordionPanelCssVars.accordionPanelHeight as string]:
            height === undefined ? 'auto' : `${height}px`,
          [AccordionPanelCssVars.accordionPanelWidth as string]:
            width === undefined ? 'auto' : `${width}px`,
        },
      },
      elementProps,
    ],
    stateAttributesMapping: accordionStateAttributesMapping,
  });

  const shouldRender = keepMounted || hiddenUntilFound || (!keepMounted && mounted);
  if (!shouldRender) {
    return null;
  }

  return element;
});

export interface AccordionPanelState extends AccordionItem.State {
  transitionStatus: TransitionStatus;
}

export interface AccordionPanelProps
  extends
    BaseUIComponentProps<'div', AccordionPanel.State>,
    Pick<AccordionRoot.Props, 'hiddenUntilFound' | 'keepMounted'> {}

export namespace AccordionPanel {
  export type State = AccordionPanelState;
  export type Props = AccordionPanelProps;
}
