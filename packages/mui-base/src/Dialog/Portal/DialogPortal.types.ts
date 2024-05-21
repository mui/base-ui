export interface DialogPortalProps {
  children?: React.ReactNode;
  id?: string;
  root?: HTMLElement | React.MutableRefObject<HTMLElement | null> | null;
  preserveTabOrder?: boolean;
}
