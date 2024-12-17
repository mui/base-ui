'use client';
import * as React from 'react';
import { styled } from '@mui/system';
import { Menu } from '@base-ui-components/react/menu';
import {
  FloatingFocusManager,
  useClick,
  useFloatingRootContext,
  useInteractions,
  useListNavigation,
  useFloating,
  useDismiss,
} from '@floating-ui/react';
import { CompositeList } from '../../../../../packages/react/src/composite/list/CompositeList';
import { useCompositeListItem } from '../../../../../packages/react/src/composite/list/useCompositeListItem';

const RootContext = React.createContext<any>(null);

const items = Array.from({ length: 6 });

function Root() {
  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(
    null,
  );
  const [positionerElement, setPositionerElement] =
    React.useState<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [open, setOpen] = React.useState(false);

  const itemsRef = React.useRef<HTMLElement[]>([]);

  const rootContext = useFloatingRootContext({
    open,
    onOpenChange: setOpen,
    elements: {
      reference: triggerElement,
      floating: positionerElement,
    },
  });

  const click = useClick(rootContext);

  const dismiss = useDismiss(rootContext);

  const listNav = useListNavigation(rootContext, {
    listRef: itemsRef,
    activeIndex,
    onNavigate: setActiveIndex,
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    click,
    listNav,
    dismiss,
  ]);

  const contextValue = React.useMemo(
    () => ({
      rootContext,
      itemsRef,
      activeIndex,
      setActiveIndex,
      getFloatingProps,
      getItemProps,
    }),
    [rootContext, activeIndex, getFloatingProps, getItemProps],
  );

  return (
    <RootContext.Provider value={contextValue}>
      <button type="button" ref={setTriggerElement} {...getReferenceProps()}>
        Base Floating UI
      </button>
      {open && (
        <div ref={setPositionerElement} style={{ position: 'absolute' }}>
          <Popup>
            {items.map((_, i) => (
              <Item key={i}>Item {i + 1}</Item>
            ))}
          </Popup>
        </div>
      )}
    </RootContext.Provider>
  );
}

function Popup(props: { children: React.ReactNode }) {
  const { rootContext, getFloatingProps, itemsRef } = React.useContext(RootContext);
  const { context } = useFloating({ rootContext });

  return (
    <FloatingFocusManager context={context} modal={false}>
      <CompositeList elementsRef={itemsRef}>
        <div
          {...getFloatingProps(props)}
          style={{ maxHeight: 500, overflowY: 'auto' }}
        />
      </CompositeList>
    </FloatingFocusManager>
  );
}

function InnerItem(props: {
  children: React.ReactNode;
  ref: React.Ref<any>;
  highlighted: boolean;
  getItemProps: any;
}) {
  const { ref, highlighted, getItemProps, ...other } = props;

  return (
    <div
      ref={ref}
      role="option"
      aria-selected={highlighted}
      tabIndex={highlighted ? 0 : -1}
      style={{
        height: 30,
        backgroundColor: highlighted ? 'black' : 'transparent',
        color: highlighted ? 'white' : 'black',
        outline: 0,
      }}
      {...getItemProps(other)}
    />
  );
}

const MemoInnerItem = React.memo(InnerItem);

function Item(props: { children: React.ReactNode }) {
  const { activeIndex, getItemProps } = React.useContext(RootContext);
  const { index, ref } = useCompositeListItem();

  const highlighted = activeIndex === index;

  return (
    <MemoInnerItem ref={ref} highlighted={highlighted} getItemProps={getItemProps}>
      {props.children}
    </MemoInnerItem>
  );
}

export default function Page() {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <Root />
      <Menu.Root>
        <Menu.Trigger>Base UI Menu</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Popup>
            {items.map((_, i) => (
              <MenuItem key={i}>Item {i}</MenuItem>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Root>
    </div>
  );
}

const MenuItem = styled(Menu.Item)`
  height: 30px;
  outline: 0;

  &[data-highlighted] {
    background-color: black;
    color: white;
  }
`;
