import { Drawer } from '@base-ui/react/drawer';
import styles from './index.module.css';

export default function ExampleDrawer() {
  return (
    <Drawer.Root swipeDirection="down">
      <Drawer.Trigger className={styles.Button}>Open drawer with form fields</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className={styles.Backdrop} />
        <Drawer.Popup className={styles.Popup}>
          <div className={styles.Handle} />
          <Drawer.Title className={styles.Title}>Software keyboard</Drawer.Title>
          <Drawer.Description className={styles.Description}>
            Tap the input or textarea to open the keyboard and observe viewport changes.
          </Drawer.Description>

          <div className={styles.Fields}>
            <label className={styles.Field}>
              <span className={styles.Label}>Name</span>
              <input
                className={styles.Input}
                inputMode="text"
                autoComplete="name"
                placeholder="Enter your name"
              />
            </label>

            <label className={styles.Field}>
              <span className={styles.Label}>Notes</span>
              <textarea className={styles.Textarea} rows={4} placeholder="Type something…" />
            </label>
          </div>

          <div className={styles.Actions}>
            <Drawer.Close className={styles.Button}>Close</Drawer.Close>
          </div>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
