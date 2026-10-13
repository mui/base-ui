import { Drawer } from '@base-ui/react/drawer';
import CssModulesDrawer from '../../(docs)/react/components/drawer/demos/position/css-modules';
import TailwindDrawer from '../../(docs)/react/components/drawer/demos/position/tailwind';
import styles from '../../(docs)/react/components/drawer/demos/position/css-modules/index.module.css';

export default function DrawerBottomViewportExperiment() {
  return (
    <div style={{ minHeight: '300vh', paddingTop: '100vh' }}>
      <h1>Bottom drawer viewport</h1>
      <p>
        On Chrome for iOS, scroll down until the browser toolbar hides and these triggers sit near
        the top of the screen. Compare the original bottom-anchored viewport with the two
        top-anchored demos. Repeat with the toolbar visible, after rotating, and after closing and
        reopening each drawer. The drawer should meet the bottom edge without shifting the page.
      </p>
      <OriginalDrawer />
      <h2>CSS Modules: top anchored</h2>
      <CssModulesDrawer />
      <h2>Tailwind CSS: top anchored</h2>
      <TailwindDrawer />
    </div>
  );
}

function OriginalDrawer() {
  return (
    <Drawer.Root>
      <Drawer.Trigger className={styles.Button}>
        Open original bottom-anchored drawer
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className={styles.Backdrop} />
        <Drawer.Viewport className={styles.Viewport} style={{ bottom: 0, height: 'auto' }}>
          <Drawer.Popup className={styles.Popup}>
            <div className={styles.Handle} />
            <Drawer.Content className={styles.Content}>
              <Drawer.Title className={styles.Title}>Notifications</Drawer.Title>
              <Drawer.Description className={styles.Description}>
                Original viewport: fixed with inset: 0 and automatic height.
              </Drawer.Description>
              <div className={styles.Actions}>
                <Drawer.Close className={styles.Button}>Close</Drawer.Close>
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
