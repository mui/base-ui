import { Drawer } from '@base-ui/react/drawer';
import styles from './index.module.css';

export default function ExampleDrawer() {
  return (
    <Drawer.Root>
      <Drawer.Trigger className={styles.Button}>Open drawer</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className={styles.Backdrop} />
        <Drawer.Popup className={styles.Popup}>
          <Drawer.Title className={styles.Title}>Drawer</Drawer.Title>
          <Drawer.Description className={styles.Description}>
            This is a drawer that slides in from the side. You can swipe to dismiss it.
          </Drawer.Description>
          <div className={styles.Actions}>
            <Drawer.Close className={styles.Button}>Close</Drawer.Close>
          </div>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
