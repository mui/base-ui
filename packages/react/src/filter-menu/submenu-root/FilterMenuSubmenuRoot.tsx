'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { ownerDocument } from '@base-ui/utils/owner';
import { isHTMLElement } from '@floating-ui/utils/dom';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { activeElement } from '../../floating-ui-react/utils';
import {
  MenuSubmenuRoot,
  type MenuSubmenuRootProps,
} from '../../menu/submenu-root/MenuSubmenuRoot';
import { FilterDropdownRoot } from '../../filter-dropdown/root/FilterDropdownRoot';
import {
  useFilterDropdownRootContext,
  type FilterDropdownFilter,
} from '../../filter-dropdown/root/FilterDropdownRootContext';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';

export function FilterMenuSubmenuRoot(props: FilterMenuSubmenuRoot.Props): React.JSX.Element {
  const {
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    inputValue: inputValueProp,
    defaultInputValue = '',
    onInputValueChange,
    filter,
    disabled: disabledProp,
    children,
    ...submenuProps
  } = props;
  const { store: parentStore } = useMenuRootContext();
  const parentDisabled = parentStore.useState('disabled');
  const [open, setOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    name: 'FilterMenuSubmenu',
    state: 'open',
  });
  const [inputValue, setInputValue] = useControlled({
    controlled: inputValueProp,
    default: defaultInputValue,
    name: 'FilterMenuSubmenu',
    state: 'inputValue',
  });
  const parentFilterContext = useFilterDropdownRootContext(true);
  const previousOpenRef = React.useRef(open);
  const parentInputFocusedRef = React.useRef(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const disabled = disabledProp ?? parentDisabled;

  function handleOpenChange(nextOpen: boolean, details: FilterMenuSubmenuRoot.ChangeEventDetails) {
    onOpenChange?.(nextOpen, details);
    if (!details.isCanceled) {
      if (nextOpen) {
        const parentInput = parentFilterContext?.inputRef.current;
        parentInputFocusedRef.current =
          parentInput != null && activeElement(ownerDocument(parentInput)) === parentInput;
        triggerRef.current = isHTMLElement(details.trigger) ? details.trigger : null;
      }
      setOpen(nextOpen);
    }
  }

  const handleInputValueChange = useStableCallback(
    (nextValue: string, details: FilterMenuSubmenuRoot.InputValueChangeEventDetails) => {
      onInputValueChange?.(nextValue, details);
      if (!details.isCanceled) {
        setInputValue(nextValue);
      }
    },
  );

  useIsoLayoutEffect(() => {
    if (previousOpenRef.current && !open && inputValue !== '') {
      handleInputValueChange('', createChangeEventDetails(REASONS.popupClose));
    }
  }, [handleInputValueChange, open, inputValue]);

  React.useEffect(() => {
    if (previousOpenRef.current && !open && parentInputFocusedRef.current) {
      if (triggerRef.current && parentFilterContext) {
        const index = parentFilterContext.listRef.current.indexOf(triggerRef.current);
        parentFilterContext.setActiveIndex(index === -1 ? null : index);
      }
      parentFilterContext?.inputRef.current?.focus({ preventScroll: true });
    } else if (previousOpenRef.current && !open && triggerRef.current && parentFilterContext) {
      const index = parentFilterContext.listRef.current.indexOf(triggerRef.current);
      parentFilterContext.setActiveIndex(index === -1 ? null : index);
    }
    previousOpenRef.current = open;
  }, [open, parentFilterContext]);

  return (
    <MenuSubmenuRoot
      {...submenuProps}
      disabled={disabled}
      open={open}
      onOpenChange={handleOpenChange}
    >
      <FilterMenuSubmenuContent
        open={open}
        disabled={disabled}
        value={inputValue}
        filter={filter}
        onValueChange={handleInputValueChange}
      >
        {children}
      </FilterMenuSubmenuContent>
    </MenuSubmenuRoot>
  );
}

interface FilterMenuSubmenuContentProps {
  open: boolean;
  disabled?: boolean | undefined;
  value: string;
  filter?: FilterDropdownFilter | undefined;
  onValueChange: FilterMenuSubmenuRoot.Props['onInputValueChange'];
  children?: React.ReactNode;
}

function FilterMenuSubmenuContent(props: FilterMenuSubmenuContentProps) {
  const { store } = useMenuRootContext();
  return (
    <FilterDropdownRoot
      open={props.open}
      disabled={props.disabled}
      value={props.value}
      filter={props.filter}
      listRef={store.context.itemDomElements}
      onValueChange={props.onValueChange}
    >
      {props.children}
    </FilterDropdownRoot>
  );
}

export namespace FilterMenuSubmenuRoot {
  export type Props = Omit<MenuSubmenuRootProps, 'open' | 'defaultOpen' | 'onOpenChange'> & {
    open?: boolean | undefined;
    defaultOpen?: boolean | undefined;
    onOpenChange?:
      | ((open: boolean, eventDetails: MenuSubmenuRoot.ChangeEventDetails) => void)
      | undefined;
    filter?: FilterDropdownFilter | undefined;
    defaultInputValue?: string | undefined;
    inputValue?: string | undefined;
    onInputValueChange?:
      | ((value: string, eventDetails: FilterMenuSubmenuRoot.InputValueChangeEventDetails) => void)
      | undefined;
  };
  export type State = MenuSubmenuRoot.State;
  export type ChangeEventReason = MenuSubmenuRoot.ChangeEventReason;
  export type ChangeEventDetails = MenuSubmenuRoot.ChangeEventDetails;
  export type InputValueChangeEventReason = FilterMenuRootInputValueChangeEventReason;
  export type InputValueChangeEventDetails = FilterMenuRootInputValueChangeEventDetails;
}

type FilterMenuRootInputValueChangeEventReason =
  | 'input-change'
  | 'input-clear'
  | 'clear-press'
  | 'popup-close';
interface FilterMenuRootInputValueChangeEventDetails {
  reason: FilterMenuRootInputValueChangeEventReason;
  event?: Event | undefined;
  isCanceled: boolean;
  cancel(): void;
}
