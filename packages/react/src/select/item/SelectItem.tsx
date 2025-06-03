'use client';
import * as React from 'react';
import type { FloatingEvents, UseInteractionsReturn } from '@floating-ui/react';
import { SelectRootContext, useSelectRootContext } from '../root/SelectRootContext';
import { SelectIndexContext, useSelectIndexContext } from '../root/SelectIndexContext';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { useForkRef } from '../../utils/useForkRef';
import type { BaseUIComponentProps } from '../../utils/types';
import { useSelectItem } from './useSelectItem';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useLatestRef } from '../../utils/useLatestRef';
import { SelectItemContext } from './SelectItemContext';
import { useRenderElement } from '../../utils/useRenderElement';

interface InnerSelectItemProps extends Omit<SelectItem.Props, 'value'> {
  highlighted: boolean;
  selected: boolean;
  getRootItemProps: UseInteractionsReturn['getItemProps'];
  setOpen: SelectRootContext['setOpen'];
  typingRef: React.MutableRefObject<boolean>;
  selectionRef: React.MutableRefObject<{
    allowUnselectedMouseUp: boolean;
    allowSelectedMouseUp: boolean;
    allowSelect: boolean;
  }>;
  open: boolean;
  value: any;
  setValue: SelectRootContext['setValue'];
  selectedIndexRef: React.RefObject<number | null>;
  indexRef: React.RefObject<number>;
  setActiveIndex: SelectIndexContext['setActiveIndex'];
  popupRef: React.RefObject<HTMLDivElement | null>;
  keyboardActiveRef: React.RefObject<boolean>;
  events: FloatingEvents;
  multiple: boolean | undefined;
  selectedByFocus: boolean;
  textRef: React.RefObject<HTMLElement | null>;
}

const InnerSelectItem = React.memo(
  React.forwardRef(function InnerSelectItem(
    componentProps: InnerSelectItemProps,
    forwardedRef: React.ForwardedRef<HTMLDivElement>,
  ) {
    const {
      className,
      disabled = false,
      highlighted,
      selected,
      getRootItemProps,
      render,
      setOpen,
      typingRef,
      selectionRef,
      open,
      value,
      setValue,
      selectedIndexRef,
      indexRef,
      setActiveIndex,
      popupRef,
      keyboardActiveRef,
      events,
      multiple,
      selectedByFocus,
      textRef,
      ...elementProps
    } = componentProps;

    const state: SelectItem.State = React.useMemo(
      () => ({
        disabled,
        selected,
      }),
      [disabled, selected],
    );

    const rootProps = getRootItemProps({ active: highlighted, selected });
    // With our custom `focusItemOnHover` implementation, this interferes with the logic and can
    // cause the index state to be stuck when leaving the select popup.
    delete rootProps.onFocus;
    delete rootProps.id;

    const { props, rootRef } = useSelectItem({
      open,
      setOpen,
      disabled,
      highlighted,
      selected,
      ref: forwardedRef,
      typingRef,
      handleSelect: (event) => setValue(value, event),
      selectionRef,
      selectedIndexRef,
      indexRef,
      setActiveIndex,
      popupRef,
      keyboardActiveRef,
      events,
      rootProps,
      elementProps,
      multiple,
    });

    const element = useRenderElement('div', componentProps, {
      ref: [rootRef, forwardedRef],
      state,
      props,
    });

    const contextValue: SelectItemContext = React.useMemo(
      () => ({
        selected,
        selectedByFocus,
        indexRef,
        textRef,
      }),
      [selected, selectedByFocus, indexRef, textRef],
    );

    return <SelectItemContext.Provider value={contextValue}>{element}</SelectItemContext.Provider>;
  }),
);

/**
 * An individual option in the select menu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectItem = React.forwardRef(function SelectItem(
  props: SelectItem.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { value: valueProp = null, label, ...otherProps } = props;

  const textRef = React.useRef<HTMLElement | null>(null);

  const listItem = useCompositeListItem({ label, textRef });

  const { activeIndex, selectedIndex, setActiveIndex } = useSelectIndexContext();
  const {
    getItemProps,
    setOpen,
    setValue,
    open,
    selectionRef,
    typingRef,
    valuesRef,
    popupRef,
    registerSelectedItem,
    value,
    multiple,
    keyboardActiveRef,
    floatingRootContext,
  } = useSelectRootContext();

  const itemRef = React.useRef<HTMLDivElement | null>(null);
  const selectedIndexRef = useLatestRef(selectedIndex);
  const indexRef = useLatestRef(listItem.index);
  const mergedRef = useForkRef(listItem.ref, forwardedRef, itemRef);

  const hasRegistered = listItem.index !== -1;

  useModernLayoutEffect(() => {
    if (!hasRegistered) {
      return undefined;
    }

    const values = valuesRef.current;
    values[listItem.index] = valueProp;

    return () => {
      delete values[listItem.index];
    };
  }, [hasRegistered, listItem.index, valueProp, valuesRef]);

  useModernLayoutEffect(() => {
    if (hasRegistered && valueProp === value) {
      registerSelectedItem(listItem.index);
    }
  }, [hasRegistered, listItem.index, registerSelectedItem, valueProp, value]);

  const highlighted = activeIndex === listItem.index;
  const selected =
    multiple && Array.isArray(value) ? value.includes(valueProp) : selectedIndex === listItem.index;
  const selectedByFocus = selectedIndex === listItem.index;

  return (
    <InnerSelectItem
      ref={mergedRef}
      highlighted={highlighted}
      selected={selected}
      getRootItemProps={getItemProps}
      setOpen={setOpen}
      open={open}
      selectionRef={selectionRef}
      typingRef={typingRef}
      value={valueProp}
      setValue={setValue}
      selectedIndexRef={selectedIndexRef}
      indexRef={indexRef}
      setActiveIndex={setActiveIndex}
      popupRef={popupRef}
      keyboardActiveRef={keyboardActiveRef}
      events={floatingRootContext.events}
      multiple={multiple}
      selectedByFocus={selectedByFocus}
      textRef={textRef}
      {...otherProps}
    />
  );
});

export namespace SelectItem {
  export interface State {
    /**
     * Whether the item should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Whether the item is selected.
     */
    selected: boolean;
  }

  export interface Props extends Omit<BaseUIComponentProps<'div', State>, 'id'> {
    children?: React.ReactNode;
    /**
     * A unique value that identifies this select item.
     * @default null
     */
    value?: any;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * Overrides the text label to use on the trigger when this item is selected
     * and when the item is matched during keyboard text navigation.
     */
    label?: string;
  }
}
