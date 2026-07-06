import { Popover } from '@base-ui-components/react/popover';
import chevronIcon from '@public/chevron-up-icon.svg';
import Button from '@ui/components/button';
import Image from 'next/image';
import styles from './filterPopover.module.css';

type FilterPopoverProps = {
    popupContent: React.ReactElement;
    hasFilterApplied: boolean;
    className?: { trigger?: string; popup?: string };
};

export default function FilterPopover({ popupContent, hasFilterApplied, className }: FilterPopoverProps) {
    return (
        <Popover.Root>
            <Popover.Trigger
                className={`${className?.trigger} ${hasFilterApplied ? styles.hasFilterApplied : ''}`}
                render={
                    <Button variant="ghost" className={styles.trigger}>
                        Filtres <Image src={chevronIcon} className={styles.chevronIcon} alt="chevron" />
                    </Button>
                }
            />
            <Popover.Portal>
                <Popover.Positioner side="right" align="start">
                    <Popover.Popup className={styles.popup}>{popupContent}</Popover.Popup>
                </Popover.Positioner>
            </Popover.Portal>
        </Popover.Root>
    );
}
