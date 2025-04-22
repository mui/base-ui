'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { warn } from '../../utils/warn';
import { useCollapsibleRootContext } from '../../collapsible/root/CollapsibleRootContext';
import { useCollapsiblePanel } from '../../collapsible/panel/useCollapsiblePanel';
import { useAccordionRootContext } from '../root/AccordionRootContext';
import type { AccordionRoot } from '../root/AccordionRoot';
import type { AccordionItem } from '../item/AccordionItem';
import { useAccordionItemContext } from '../item/AccordionItemContext';
import { accordionStyleHookMapping } from '../item/styleHooks';
import { AccordionPanelCssVars } from './AccordionPanelCssVars';
import { usePanelResize } from '../../utils/usePanelResize';

/**
 * A collapsible panel with the accordion item contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 */
const AccordionPanel = React.forwardRef(function AccordionPanel(
  props: AccordionPanel.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    className,
    hiddenUntilFound: hiddenUntilFoundProp,
    keepMounted: keepMountedProp,
    id: idProp,
    render,
    style: styleProp,
    ...otherProps
  } = props;

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
    setPanelId,
    setVisible,
    transitionDimensionRef,
    visible,
    width,
  } = useCollapsibleRootContext();

  const hiddenUntilFound = hiddenUntilFoundProp ?? contextHiddenUntilFound;
  const keepMounted = keepMountedProp ?? contextKeepMounted;

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEnhancedEffect(() => {
      if (keepMountedProp === false && hiddenUntilFound) {
        warn(
          'The `keepMounted={false}` prop on a Accordion.Panel will be ignored when using `contextHiddenUntilFound` on the Panel or the Root since it requires the panel to remain mounted when closed.',
        );
      }
    }, [hiddenUntilFound, keepMountedProp]);
  }

  useEnhancedEffect(() => {
    setHiddenUntilFound(hiddenUntilFound);
  }, [setHiddenUntilFound, hiddenUntilFound]);

  useEnhancedEffect(() => {
    setKeepMounted(keepMounted);
  }, [setKeepMounted, keepMounted]);

  usePanelResize(panelRef, setDimensions, open);

  const { getRootProps } = useCollapsiblePanel({
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
    setPanelId,
    setVisible,
    transitionDimensionRef,
    visible,
    width,
  });

  const { state, triggerId } = useAccordionItemContext();

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    state,
    className,
    ref: [forwardedRef, panelRef],
    extraProps: {
      ...otherProps,
      'aria-labelledby': triggerId,
      role: 'region',
      style: {
        [AccordionPanelCssVars.accordionPanelHeight]: height ? `${height}px` : undefined,
        [AccordionPanelCssVars.accordionPanelWidth]: width ? `${width}px` : undefined,
        ...styleProp,
      },
    },
    customStyleHookMapping: accordionStyleHookMapping,
  });

  const shouldRender = keepMounted || hiddenUntilFound || (!keepMounted && mounted);
  if (!shouldRender) {
    return null;
  }

  return renderElement();
});

namespace AccordionPanel {
  export interface Props
    extends BaseUIComponentProps<'div', AccordionItem.State>,
      Pick<AccordionRoot.Props, 'hiddenUntilFound' | 'keepMounted'> {}
}

export { AccordionPanel };
