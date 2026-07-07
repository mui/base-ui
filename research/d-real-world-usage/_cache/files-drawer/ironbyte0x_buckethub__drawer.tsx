import { createContext, useContext } from 'react';
import { XIcon } from 'lucide-react';
import { Drawer as DrawerPrimitive } from '@base-ui/react/drawer';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { useViewportSize } from '@react-aria/utils';
import { Icon } from '../icon';
import { IconButton } from '../icon-button';
import {
  StyledDrawerBackdrop,
  StyledDrawerBody,
  StyledDrawerClose,
  StyledDrawerDescription,
  StyledDrawerFooter,
  StyledDrawerHeader,
  StyledDrawerPopup,
  StyledDrawerSwipeArea,
  StyledDrawerTitle,
  StyledDrawerTrigger,
  StyledDrawerViewport
} from './drawer.styled';
import { usePreventScroll } from './use-prevent-scroll';

export type SnapPoint = DrawerPrimitive.Root.SnapPoint;

type DrawerPosition = 'left' | 'right' | 'bottom' | 'top';

const DrawerPositionContext = createContext<DrawerPosition>('right');

const SWIPE_DIRECTION_MAP: Record<DrawerPosition, 'left' | 'right' | 'up' | 'down'> = {
  left: 'left',
  right: 'right',
  bottom: 'down',
  top: 'up'
};

interface RootProps extends React.ComponentProps<typeof DrawerPrimitive.Root> {
  position?: DrawerPosition;
  onOpenChange?: (open: boolean) => void;
}

const Root: React.FunctionComponent<RootProps> = ({
  open: openProp,
  defaultOpen: defaultOpenProps,
  onOpenChange: onOpenChangeProp,
  children,
  position = 'right',
  ...props
}) => {
  const [open, onOpenChange] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpenProps ?? false,
    onChange: onOpenChangeProp
  });

  usePreventScroll({
    isDisabled: !open
  });

  return (
    <DrawerPositionContext value={position}>
      <DrawerPrimitive.Root
        swipeDirection={SWIPE_DIRECTION_MAP[position]}
        open={open}
        modal
        onOpenChange={onOpenChange}
        {...props}
      >
        {children}
      </DrawerPrimitive.Root>
    </DrawerPositionContext>
  );
};

const Trigger: React.FunctionComponent<React.ComponentProps<typeof StyledDrawerTrigger>> =
  StyledDrawerTrigger;

const isIOSDevice = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
const isSafariBrowser =
  typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isIOSSafariBrowser = isIOSDevice && isSafariBrowser;

const Content: React.FunctionComponent<
  Omit<React.ComponentProps<typeof StyledDrawerPopup>, 'position'>
> = ({ children, ...props }) => {
  const position = useContext(DrawerPositionContext);

  const viewport = useViewportSize();
  const pageHeight = document.body.clientHeight;
  const safariFloatingBarHeight = isIOSSafariBrowser ? 200 : 0;
  const takenPageHeight = pageHeight - viewport.height;
  const bottomOffset = Math.floor(takenPageHeight + safariFloatingBarHeight);

  return (
    <DrawerPrimitive.Portal
      style={
        {
          '--drawer-internal-offset-bottom': safariFloatingBarHeight + 'px',
          '--drawer-bottom-offset': bottomOffset + 'px'
        } as React.CSSProperties
      }
    >
      <StyledDrawerBackdrop />

      <StyledDrawerViewport position={position}>
        <StyledDrawerPopup position={position} {...props}>
          {children}
        </StyledDrawerPopup>
      </StyledDrawerViewport>
    </DrawerPrimitive.Portal>
  );
};

const Header: React.FunctionComponent<React.ComponentProps<typeof StyledDrawerHeader>> =
  StyledDrawerHeader;

const Title: React.FunctionComponent<React.ComponentProps<typeof StyledDrawerTitle>> =
  StyledDrawerTitle;

const Description: React.FunctionComponent<React.ComponentProps<typeof StyledDrawerDescription>> =
  StyledDrawerDescription;

const CloseTrigger: React.FunctionComponent<React.ComponentProps<typeof StyledDrawerClose>> =
  StyledDrawerClose;

const Close: React.FunctionComponent<
  Omit<React.ComponentProps<typeof CloseTrigger>, 'children'>
> = () => {
  return (
    <CloseTrigger
      render={(props) => (
        <IconButton
          variant="ghost"
          size="xs"
          css={{ marginTop: '-1.5', marginRight: '-1.5' }}
          {...props}
        >
          <Icon as={XIcon} size="sm" color="base" />
        </IconButton>
      )}
    />
  );
};

const Body: React.FunctionComponent<React.ComponentProps<typeof StyledDrawerBody>> =
  StyledDrawerBody;

const Footer: React.FunctionComponent<React.ComponentProps<typeof StyledDrawerFooter>> =
  StyledDrawerFooter;

const SwipeArea: React.FunctionComponent<React.ComponentProps<typeof StyledDrawerSwipeArea>> =
  StyledDrawerSwipeArea;

Root.displayName = 'Drawer';
Trigger.displayName = 'Drawer.Trigger';
Content.displayName = 'Drawer.Content';
Header.displayName = 'Drawer.Header';
Title.displayName = 'Drawer.Title';
Description.displayName = 'Drawer.Description';
CloseTrigger.displayName = 'Drawer.CloseTrigger';
Close.displayName = 'Drawer.Close';
Body.displayName = 'Drawer.Body';
Footer.displayName = 'Drawer.Footer';
SwipeArea.displayName = 'Drawer.SwipeArea';

type DrawerComponent = React.FunctionComponent<RootProps> & {
  Trigger: typeof Trigger;
  Content: typeof Content;
  Header: typeof Header;
  Title: typeof Title;
  Description: typeof Description;
  CloseTrigger: typeof CloseTrigger;
  Close: typeof Close;
  Body: typeof Body;
  Footer: typeof Footer;
  SwipeArea: typeof SwipeArea;
  createHandle: typeof DrawerPrimitive.createHandle;
};

export const Drawer: DrawerComponent = Object.assign(Root, {
  Trigger,
  Content,
  Header,
  Title,
  Description,
  CloseTrigger,
  Close,
  Body,
  Footer,
  SwipeArea,
  createHandle: DrawerPrimitive.createHandle
});
