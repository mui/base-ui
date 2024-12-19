'use client';
import * as React from 'react';
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
import styles from './highlight.module.css';

const RootContext = React.createContext<any>(null);

const items = Array.from({ length: 6 });

function RawMenu() {
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
        <div ref={setPositionerElement} style={{ position: 'absolute', top: 100 }}>
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

function BaseUIMenu() {
  return (
    <Menu.Root>
      <Menu.Trigger className={styles.Button}>
        Song <ChevronDownIcon className={styles.ButtonIcon} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.Positioner} sideOffset={8}>
          <Menu.Popup className={styles.Popup}>
            <Menu.Arrow className={styles.Arrow}>
              <ArrowSvg />
            </Menu.Arrow>
            <Menu.Item className={styles.Item}>Add to Library</Menu.Item>
            <Menu.Item className={styles.Item}>Add to Playlist</Menu.Item>
            <Menu.Separator className={styles.Separator} />
            <Menu.Item className={styles.Item}>Play Next</Menu.Item>
            <Menu.Item className={styles.Item}>Play Last</Menu.Item>
            <Menu.Separator className={styles.Separator} />
            <Menu.Item className={styles.Item}>Favorite</Menu.Item>
            <Menu.Item className={styles.Item}>Share</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className={styles.ArrowFill}
      />
      <path
        d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
        className={styles.ArrowOuterStroke}
      />
      <path
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
        className={styles.ArrowInnerStroke}
      />
    </svg>
  );
}

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M1 3.5L5 7.5L9 3.5" stroke="currentcolor" strokeWidth="1.5" />
    </svg>
  );
}

export default function Page() {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <RawMenu />
      <BaseUIMenu />
    </div>
  );
}
