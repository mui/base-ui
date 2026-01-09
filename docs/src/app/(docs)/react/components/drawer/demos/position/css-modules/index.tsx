import { Drawer } from '@base-ui/react/drawer';
import styles from './index.module.css';

export default function ExampleDrawer() {
  return (
    <Drawer.Root swipeDirection="down">
      <Drawer.Trigger className={styles.Button}>Open bottom drawer</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className={styles.Backdrop} />
        <Drawer.Popup className={styles.Popup}>
          <div className={styles.Handle} />
          <Drawer.Title className={styles.Title}>Notifications</Drawer.Title>
          <Drawer.Description className={styles.Description}>
            You are all caught up. Good job!
          </Drawer.Description>
          <div className={styles.Actions}>
            <Drawer.Close className={styles.Button}>Close</Drawer.Close>
          </div>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
