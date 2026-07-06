import { Dialog as BaseUIDialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import { useId, useRef, type ComponentProps } from 'react';

import { ButtonIcon } from '../ButtonIcon/ButtonIcon';
import { Heading } from '../Heading/Heading';
import { Stack } from '../Stack/Stack';

import * as styles from './Dialog.css';

type BaseUIDialogRoot = ComponentProps<typeof BaseUIDialog.Root>;
type BaseUIDialogPopup = ComponentProps<typeof BaseUIDialog.Popup>;

interface Props {
  title: string;
  open: BaseUIDialogRoot['open'];
  onOpenChange: NonNullable<BaseUIDialogRoot['onOpenChange']>;
  initialFocus?: BaseUIDialogPopup['initialFocus'];
  finalFocus?: BaseUIDialogPopup['finalFocus'];
  children: BaseUIDialogPopup['children'];
}

export const Dialog = ({
  title,
  open,
  onOpenChange,
  finalFocus,
  initialFocus,
  children,
}: Props) => {
  const titleId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  return (
    <BaseUIDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseUIDialog.Portal>
        <BaseUIDialog.Backdrop className={styles.backdrop} />
        <BaseUIDialog.Popup
          className={styles.popup}
          initialFocus={initialFocus || headingRef}
          aria-labelledby={titleId}
          finalFocus={finalFocus}
        >
          <Stack space="xlarge">
            <div className={styles.titleContainer}>
              <Heading level="2">
                <span
                  ref={headingRef}
                  tabIndex={-1}
                  id={titleId}
                  className={styles.titleOutline}
                >
                  {title}
                </span>
              </Heading>
            </div>

            <>{children}</>
          </Stack>
          <div className={styles.closeContainer}>
            <BaseUIDialog.Close
              render={
                <ButtonIcon
                  bleed
                  variant="transparent"
                  icon={<X />}
                  label="Close"
                />
              }
            />
          </div>
        </BaseUIDialog.Popup>
      </BaseUIDialog.Portal>
    </BaseUIDialog.Root>
  );
};
