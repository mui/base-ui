'use client';
import { Drawer } from '@base-ui/react/drawer';
import styles from './index.module.css';

const fields = [
  ['Name', 'Ada Lovelace'],
  ['Phone', '+1 (555) 123-4567'],
  ['Street address', '12 Computing Way'],
  ['Apartment', 'Unit 4B'],
  ['Delivery window', 'After 6 PM'],
  ['Backup contact', 'Grace Hopper'],
];

export default function ExampleDrawerVirtualKeyboardAware() {
  return (
    <Drawer.Root>
      <Drawer.Trigger className={styles.Button}>Open keyboard-aware drawer</Drawer.Trigger>
      <Drawer.VirtualKeyboardProvider>
        <Drawer.Portal>
          <Drawer.Backdrop className={styles.Backdrop} />
          <Drawer.Viewport className={styles.Viewport}>
            <Drawer.Popup className={styles.Popup}>
              <div className={styles.Header}>
                <div className={styles.Handle} />
                <div className={styles.HeaderActions}>
                  <Drawer.Close className={`${styles.Button} ${styles.HeaderButton}`}>
                    Cancel
                  </Drawer.Close>
                  <Drawer.Title className={styles.Title}>Delivery details</Drawer.Title>
                  <button className={`${styles.Button} ${styles.HeaderButton}`} type="button">
                    Save
                  </button>
                </div>
              </div>

              <div className={styles.Scroll}>
                <div className={styles.Form}>
                  {fields.map(([label, placeholder]) => (
                    <label className={styles.Field} key={label}>
                      <span className={styles.FieldLabel}>{label}</span>
                      <input className={styles.Input} placeholder={placeholder} type="text" />
                    </label>
                  ))}

                  <label className={styles.Field}>
                    <span className={styles.FieldLabel}>Instructions</span>
                    <textarea
                      className={styles.Textarea}
                      placeholder="Gate code, drop-off spot, or anything else the driver should know"
                    />
                  </label>
                </div>
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.VirtualKeyboardProvider>
    </Drawer.Root>
  );
}
