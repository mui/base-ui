'use client'
import { Drawer } from '@base-ui/react/drawer'
import { PanelLeftClose, PanelLeftOpen, XIcon } from 'lucide-react'
import { memo, useCallback, useState } from 'react'
import { MobileNavigationTrigger } from './_components/mobile-navigation-trigger'
import { NavigationItem } from './_components/navigation-item'
import { NavigationUserSection } from './_components/navigation-user-section'
import { NAVIGATION_ITEMS } from './constants'
import { createNavigationElementKey } from './helpers'
import baseUiStyles from '../ui/base-ui/base-ui-primitives.module.css'
import styles from './navigation.module.css'

type NavigationProps = {
  desktopExpanded: boolean
  onDesktopExpandedChange: (expanded: boolean) => void
  isDark: boolean
  onToggleTheme: () => void
}

export const Navigation = memo(
  ({ desktopExpanded, onDesktopExpandedChange, isDark, onToggleTheme }: NavigationProps) => {
    const [mobileOpen, setMobileOpen] = useState(false)

    const desktopMode = desktopExpanded ? 'desktop-expanded' : 'desktop-collapsed'

    const handleDesktopToggle = useCallback(
      () => onDesktopExpandedChange(!desktopExpanded),
      [desktopExpanded, onDesktopExpandedChange],
    )

    const handleMobileNavigate = useCallback(() => setMobileOpen(false), [])

    const desktopToggleLabel = desktopExpanded
      ? 'Collapse navigation drawer'
      : 'Expand navigation drawer'

    return (
      <nav
        aria-label='Primary navigation'
        className={styles.nav}
        data-desktop-expanded={desktopExpanded}
      >
        <div className={styles.desktopRail}>
          <button
            aria-expanded={desktopExpanded}
            aria-label={desktopToggleLabel}
            className={`${baseUiStyles.interactiveControl} ${baseUiStyles.neutralControlSurface} ${styles.desktopToggle}`}
            onClick={handleDesktopToggle}
            type='button'
          >
            <span aria-hidden className={styles.toggleIcon}>
              {desktopExpanded ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </span>
          </button>

          <ul className={styles.navList} data-mode={desktopMode}>
            {NAVIGATION_ITEMS.map((item, index) => (
              <NavigationItem
                item={item}
                // oxlint-disable-next-line react/no-array-index-key -- NAVIGATION_ITEMS is a static constant
                key={`desktop-${createNavigationElementKey(item, index)}`}
              />
            ))}
            <NavigationUserSection isDark={isDark} onToggleTheme={onToggleTheme} />
          </ul>
        </div>

        <div className={styles.mobileMenu}>
          <Drawer.Root onOpenChange={setMobileOpen} open={mobileOpen} swipeDirection='left'>
            <MobileNavigationTrigger open={mobileOpen} />
            <Drawer.SwipeArea className={styles.drawerSwipeArea} />
            <Drawer.Portal>
              <Drawer.Backdrop className={styles.drawerBackdrop} />
              <Drawer.Popup className={`${styles.drawerPopup} ${styles.drawerContent}`}>
                <div className={styles.drawerHeader}>
                  <Drawer.Title className={styles.drawerTitle}>Navigation</Drawer.Title>
                  <Drawer.Close
                    aria-label='Close navigation drawer'
                    className={`${baseUiStyles.interactiveControl} ${baseUiStyles.neutralControlSurface} ${styles.drawerClose}`}
                  >
                    <XIcon size={18} />
                  </Drawer.Close>
                </div>

                <ul className={styles.navList} data-mode='mobile'>
                  {NAVIGATION_ITEMS.map((item, index) => (
                    <NavigationItem
                      item={item}
                      onNavigate={handleMobileNavigate}
                      // oxlint-disable-next-line react/no-array-index-key -- NAVIGATION_ITEMS is a static constant
                      key={`mobile-${createNavigationElementKey(item, index)}`}
                    />
                  ))}
                  <NavigationUserSection isDark={isDark} onToggleTheme={onToggleTheme} />
                </ul>
              </Drawer.Popup>
            </Drawer.Portal>
          </Drawer.Root>
        </div>
      </nav>
    )
  },
)

Navigation.displayName = 'Navigation'
