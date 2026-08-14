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
  isKeyboardOpenReason,
  type MenuSubmenuRootProps,
} from '../../menu/submenu-root/MenuSubmenuRoot';
import { FilterDropdownRoot } from '../../filter-dropdown/root/FilterDropdownRoot';
import {
  useFilterDropdownRootContext,
  type FilterDropdownFilter,
  type FilterDropdownRootContext as FilterDropdownRootContextValue,
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
  const [inputFocusVisible, setInputFocusVisible] = React.useState(false);
  const parentFilterContext = useFilterDropdownRootContext(true);
  const submenuFilterContextRef = React.useRef<FilterDropdownRootContextValue | null>(null);
  const previousOpenRef = React.useRef(open);
  const parentInputFocusedRef = React.useRef(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);

  const disabled = disabledProp ?? parentDisabled;

  function handleOpenChange(nextOpen: boolean, details: FilterMenuSubmenuRoot.ChangeEventDetails) {
    onOpenChange?.(nextOpen, details);
    if (details.isCanceled) {
      return;
    }

    const isKeyboardOpen = nextOpen && isKeyboardOpenReason(details);

    if (nextOpen) {
      // Record where to restore the parent's state when the submenu closes.
      const parentInput = parentFilterContext?.inputRef.current;
      parentInputFocusedRef.current =
        parentInput != null && activeElement(ownerDocument(parentInput)) === parentInput;
      triggerRef.current = isHTMLElement(details.trigger) ? details.trigger : null;

      // Keyboard opens move focus into the submenu, so release the parent's virtual highlight.
      // The close effect restores it, which also resyncs list navigation's internal index.
      if (isKeyboardOpen) {
        parentFilterContext?.setActiveIndex(null);
      }
    }

    setOpen(nextOpen);
    setInputFocusVisible(isKeyboardOpen);
  }

  // The keyboard entering an already-open submenu moves focus onto its input, mirroring how a
  // keyboard open focuses it.
  const handleKeyboardEnter = useStableCallback(() => {
    parentFilterContext?.setActiveIndex(null);

    const submenuContext = submenuFilterContextRef.current;
    if (submenuContext) {
      submenuContext.setActiveIndex(null);
      submenuContext.setInputFocusVisible(true);
      submenuContext.inputRef.current?.focus({ preventScroll: true });
    }
  });

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

  // On close, re-highlight the trigger in the parent list and return focus to the parent's
  // input when it held focus at open.
  React.useEffect(() => {
    const didClose = previousOpenRef.current && !open;
    previousOpenRef.current = open;
    if (!didClose || !parentFilterContext) {
      return;
    }

    if (triggerRef.current) {
      const index = parentFilterContext.listRef.current.indexOf(triggerRef.current);
      parentFilterContext.setActiveIndex(index === -1 ? null : index);
    }
    if (parentInputFocusedRef.current) {
      parentFilterContext.inputRef.current?.focus({ preventScroll: true });
    }
  }, [open, parentFilterContext]);

  return (
    <MenuSubmenuRoot
      {...submenuProps}
      disabled={disabled}
      open={open}
      onOpenChange={handleOpenChange}
      onKeyboardEnter={handleKeyboardEnter}
    >
      <FilterMenuSubmenuContent
        open={open}
        disabled={disabled}
        inputFocusVisible={inputFocusVisible}
        value={inputValue}
        filter={filter}
        onValueChange={handleInputValueChange}
        contextRef={submenuFilterContextRef}
      >
        {children}
      </FilterMenuSubmenuContent>
    </MenuSubmenuRoot>
  );
}

interface FilterMenuSubmenuContentProps {
  open: boolean;
  disabled?: boolean | undefined;
  inputFocusVisible: boolean;
  value: string;
  filter?: FilterDropdownFilter | undefined;
  onValueChange: FilterMenuSubmenuRoot.Props['onInputValueChange'];
  contextRef: React.RefObject<FilterDropdownRootContextValue | null>;
  children?: React.ReactNode;
}

function FilterMenuSubmenuContent(props: FilterMenuSubmenuContentProps) {
  const { store } = useMenuRootContext();
  return (
    <FilterDropdownRoot
      open={props.open}
      disabled={props.disabled}
      inputFocusVisible={props.inputFocusVisible}
      value={props.value}
      filter={props.filter}
      listRef={store.context.itemDomElements}
      onValueChange={props.onValueChange}
      contextRef={props.contextRef}
    >
      {props.children}
    </FilterDropdownRoot>
  );
}

export namespace FilterMenuSubmenuRoot {
  export type Props = Omit<
    MenuSubmenuRootProps,
    'open' | 'defaultOpen' | 'onOpenChange' | 'onKeyboardEnter'
  > & {
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
  export type InputValueChangeEventReason = FilterDropdownRoot.ChangeEventReason;
  export type InputValueChangeEventDetails = FilterDropdownRoot.ChangeEventDetails;
}
