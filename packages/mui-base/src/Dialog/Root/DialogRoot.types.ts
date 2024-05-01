export interface DialogRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  modal?: boolean;
  children?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}
