'use client';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import {
  Archive,
  Bookmark,
  ChevronRight,
  Copy,
  Download,
  Ellipsis,
  FolderDown,
  Link2,
  Mail,
  MessageCircle,
  Pencil,
  Printer,
  Radio,
  Share,
} from 'lucide-react';
import styles from './ios-style-popups.module.css';

interface MorphingSubmenuProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
}

function MorphingSubmenu(props: MorphingSubmenuProps) {
  const { children, trigger } = props;

  const actionsRef = React.useRef<Menu.Root.Actions | null>(null);
  const [closing, setClosing] = React.useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setClosing(true);
    }
  }

  function handleOpenChangeComplete() {
    setClosing(false);
  }

  return (
    <Menu.SubmenuRoot
      actionsRef={actionsRef}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
    >
      <Menu.SubmenuTrigger
        className={styles.SubmenuTrigger}
        data-morphing={closing ? '' : undefined}
        openOnHover={false}
      >
        {trigger}
      </Menu.SubmenuTrigger>

      <Menu.Portal>
        <Menu.Positioner
          className={`${styles.Positioner} ${styles.ChildPositioner}`}
          side="bottom"
          align="center"
          sideOffset={({ side, anchor }) =>
            side === 'top' || side === 'bottom' ? -anchor.height : -anchor.width
          }
          collisionAvoidance={{ side: 'flip', align: 'shift', fallbackAxisSide: 'none' }}
        >
          <Menu.Popup className={`${styles.Popup} ${styles.ChildPopup}`}>
            <button
              type="button"
              tabIndex={-1}
              className={styles.SubmenuHeader}
              aria-hidden="true"
              onClick={() => actionsRef.current?.close()}
            >
              {trigger}
            </button>
            <div className={styles.SubmenuHeaderSpacer} aria-hidden="true" />
            <div className={styles.SubmenuSeparator} aria-hidden="true" />
            <div className={styles.ChildItems}>{children}</div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.SubmenuRoot>
  );
}

export default function IosStyleMenuPopups() {
  const [rootClosing, setRootClosing] = React.useState(false);

  function handleRootOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setRootClosing(true);
    }
  }

  function handleRootOpenChangeComplete() {
    setRootClosing(false);
  }

  return (
    <main className={styles.Page}>
      <Menu.Root
        onOpenChange={handleRootOpenChange}
        onOpenChangeComplete={handleRootOpenChangeComplete}
      >
        <Menu.Trigger className={styles.Trigger} data-morphing={rootClosing ? '' : undefined}>
          <Ellipsis />
          <span className={styles.ScreenReaderOnly}>Document actions</span>
        </Menu.Trigger>

        <Menu.Portal>
          <Menu.Positioner className={styles.Positioner} side="top" align="start" sideOffset={-10}>
            <Menu.Popup className={`${styles.Popup} ${styles.RootPopup}`}>
              <div className={styles.RootSurface}>
                <div className={styles.PopupContent}>
                  <Menu.Item className={styles.Item}>
                    <Pencil className={styles.ItemIcon} />
                    Edit
                  </Menu.Item>
                  <Menu.Item className={styles.Item}>
                    <Copy className={styles.ItemIcon} />
                    Copy
                  </Menu.Item>

                  <MorphingSubmenu
                    trigger={
                      <React.Fragment>
                        <span className={styles.ItemLabel}>
                          <Share className={styles.ItemIcon} />
                          Share
                        </span>
                        <ChevronRight className={styles.Chevron} />
                      </React.Fragment>
                    }
                  >
                    <Menu.Item className={styles.Item}>
                      <MessageCircle className={styles.ItemIcon} />
                      Messages
                    </Menu.Item>
                    <Menu.Item className={styles.Item}>
                      <Mail className={styles.ItemIcon} />
                      Email
                    </Menu.Item>
                    <Menu.Item className={styles.Item}>
                      <Link2 className={styles.ItemIcon} />
                      Copy Link
                    </Menu.Item>
                    <MorphingSubmenu
                      trigger={
                        <React.Fragment>
                          <span className={styles.ItemLabel}>
                            <Ellipsis className={styles.ItemIcon} />
                            More
                          </span>
                          <ChevronRight className={styles.Chevron} />
                        </React.Fragment>
                      }
                    >
                      <Menu.Item className={styles.Item}>
                        <Radio className={styles.ItemIcon} />
                        AirDrop
                      </Menu.Item>
                      <Menu.Item className={styles.Item}>
                        <FolderDown className={styles.ItemIcon} />
                        Save to Files
                      </Menu.Item>
                      <Menu.Item className={styles.Item}>
                        <Bookmark className={styles.ItemIcon} />
                        Add Bookmark
                      </Menu.Item>
                    </MorphingSubmenu>
                  </MorphingSubmenu>

                  <Menu.Item className={styles.Item}>
                    <Download className={styles.ItemIcon} />
                    Download
                  </Menu.Item>
                  <Menu.Item className={styles.Item}>
                    <Printer className={styles.ItemIcon} />
                    Print
                  </Menu.Item>
                  <Menu.Item className={styles.Item}>
                    <Archive className={styles.ItemIcon} />
                    Archive
                  </Menu.Item>
                </div>
              </div>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </main>
  );
}
