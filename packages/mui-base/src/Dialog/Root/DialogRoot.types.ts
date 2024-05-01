export interface DialogRootProps {
  open?: boolean;
  modal?: boolean;
  children?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}
