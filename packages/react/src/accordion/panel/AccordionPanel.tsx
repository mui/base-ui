'use client';
import * as React from 'react';
import { warn } from '@base-ui/utils/warn';
import type { BaseUIComponentProps } from '../../internals/types';
import { useCollapsiblePanel } from '../../collapsible/panel/useCollapsiblePanel';
import { useAccordionRootContext } from '../root/AccordionRootContext';
import type { AccordionRoot } from '../root/AccordionRoot';
import type { AccordionItemState } from '../item/AccordionItem';
import { useAccordionItemContext } from '../item/AccordionItemContext';
import { accordionStateAttributesMapping } from '../item/stateAttributesMapping';
import * as AccordionPanelCssVars from './AccordionPanelCssVars';
import type { TransitionStatus } from '../../internals/useTransitionStatus';

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
  const { hiddenUntilFound: contextHiddenUntilFound, keepMounted: contextKeepMounted } =
    useAccordionRootContext();
  const { state, triggerId } = useAccordionItemContext();

  const hiddenUntilFound = componentProps.hiddenUntilFound ?? contextHiddenUntilFound;
  const keepMounted = componentProps.keepMounted ?? contextKeepMounted;

  /* istanbul ignore else -- `process.env.NODE_ENV` is a build-time constant under test */
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (componentProps.keepMounted === false && hiddenUntilFound) {
        warn(
          'The `keepMounted={false}` prop on an `Accordion.Panel` is ignored when `hiddenUntilFound` is enabled on the panel or root, since the panel must remain mounted while closed.',
        );
      }
    }, [hiddenUntilFound, componentProps.keepMounted]);
  }

  return useCollapsiblePanel(
    componentProps,
    forwardedRef,
    accordionStateAttributesMapping,
    AccordionPanelCssVars.accordionPanelHeight,
    AccordionPanelCssVars.accordionPanelWidth,
    hiddenUntilFound,
    keepMounted,
    state,
    {
      'aria-labelledby': triggerId,
      role: 'region',
    },
  );
});

export interface AccordionPanelState extends AccordionItemState {
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export interface AccordionPanelProps
  extends
    BaseUIComponentProps<'div', AccordionPanelState>,
    Pick<AccordionRoot.Props, 'hiddenUntilFound' | 'keepMounted'> {}

export namespace AccordionPanel {
  export type State = AccordionPanelState;
  export type Props = AccordionPanelProps;
}
