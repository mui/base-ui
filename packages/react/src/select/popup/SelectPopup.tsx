'use client';
import * as React from 'react';
import { FloatingFocusManager } from '@floating-ui/react';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useSelectRootContext } from '../root/SelectRootContext';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { useSelector } from '../../utils/store';
import type { Side } from '../../utils/useAnchorPositioning';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { useSelectPopup } from './useSelectPopup';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';
import { selectors } from '../store';
import { EMPTY_OBJECT, DISABLED_TRANSITIONS_STYLE } from '../../utils/constants';
import { SelectItemTemplate } from '../item-template/SelectItemTemplate';
import { SelectRoot } from '../root/SelectRoot';
import { SelectGroupTemplate } from '../group-template/SelectGroupTemplate';

const customStyleHookMapping: CustomStyleHookMapping<SelectPopup.State> = {
  ...popupStateMapping,
  ...transitionStatusMapping,
};

/**
 * A container for the select items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectPopup = React.forwardRef(function SelectPopup(
  componentProps: SelectPopup.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { store, popupRef, onOpenChangeComplete, items } = useSelectRootContext();
  const positioner = useSelectPositionerContext();

  const id = useSelector(store, selectors.id);
  const open = useSelector(store, selectors.open);
  const mounted = useSelector(store, selectors.mounted);
  const popupProps = useSelector(store, selectors.popupProps);
  const transitionStatus = useSelector(store, selectors.transitionStatus);
  const alignItemWithTriggerActive = useSelector(store, selectors.alignItemWithTriggerActive);

  useOpenChangeComplete({
    open,
    ref: popupRef,
    onComplete() {
      if (open) {
        onOpenChangeComplete?.(true);
      }
    },
  });

  const state: SelectPopup.State = React.useMemo(
    () => ({
      open,
      transitionStatus,
      side: positioner.side,
      align: positioner.align,
    }),
    [open, transitionStatus, positioner],
  );

  const { props } = useSelectPopup();

  const childrenArray = React.Children.toArray(componentProps.children);

  const itemTemplateComponent = childrenArray.find(
    (child) => React.isValidElement(child) && child.type === SelectItemTemplate,
  ) as React.ReactElement<SelectItemTemplate.Props> | undefined;

  const itemTemplate = itemTemplateComponent ? itemTemplateComponent.props.children : undefined;

  const groupTemplateComponent = childrenArray.find(
    (child) => React.isValidElement(child) && child.type === SelectGroupTemplate,
  ) as React.ReactElement<SelectGroupTemplate.Props> | undefined;

  const groupTemplate = groupTemplateComponent ? groupTemplateComponent.props.children : undefined;

  const children =
    itemTemplate && items
      ? {
          children: renderItems(items, itemTemplate, groupTemplate).concat(elementProps.children),
        }
      : undefined;

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, popupRef],
    state,
    customStyleHookMapping,
    props: [
      popupProps,
      props,
      transitionStatus === 'starting' ? DISABLED_TRANSITIONS_STYLE : EMPTY_OBJECT,
      elementProps,
      children,
    ],
  });

  const popupSelector = `[data-id="${id}-popup"]`;

  const html = React.useMemo(
    () => ({
      __html: `${popupSelector}{scrollbar-width:none}${popupSelector}::-webkit-scrollbar{display:none}`,
    }),
    [popupSelector],
  );

  return (
    <React.Fragment>
      {id && alignItemWithTriggerActive && (
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={html}
        />
      )}
      <FloatingFocusManager
        context={positioner.context}
        modal={false}
        disabled={!mounted}
        restoreFocus
      >
        {element}
      </FloatingFocusManager>
    </React.Fragment>
  );
});

function renderItems(
  items: SelectRoot.SelectOption<any>[] | SelectRoot.SelectGroup<any>[],
  itemTemplate:
    | ((item: SelectRoot.SelectOption<any>, props: HTMLProps) => React.ReactNode)
    | undefined,
  groupTemplate:
    | ((
        item: SelectRoot.SelectGroup<any>,
        props: HTMLProps,
        childItems: React.ReactNode[],
      ) => React.ReactNode)
    | undefined,
): React.ReactNode[] {
  return items.map((item) => {
    if (isGroupTemplate(item)) {
      const childItems = renderItems(item.items, itemTemplate, groupTemplate);

      if (!groupTemplate) {
        return childItems;
      }

      return groupTemplate(item, {}, childItems);
    }

    return itemTemplate?.(item, {}) ?? null;
  });
}

export namespace SelectPopup {
  export interface Props extends BaseUIComponentProps<'div', State> {
    children?: React.ReactNode;
    /**
     * @ignore
     */
    id?: string;
  }

  export interface State {
    side: Side | 'none';
    align: 'start' | 'end' | 'center';
    open: boolean;
    transitionStatus: TransitionStatus;
  }
}

function isGroupTemplate(
  item: SelectRoot.SelectOption<any> | SelectRoot.SelectGroup<any>,
): item is SelectRoot.SelectGroup<any> {
  return (item as SelectRoot.SelectGroup<any>).items !== undefined;
}
