'use client';
import { FilterMenu } from '@base-ui/react/filter-menu';
import { Menu } from '@base-ui/react/menu';
import classes from './filtering-scope.module.css';

export default function FilterMenuFilteringScopeExperiment() {
  return (
    <div className={classes.Page}>
      <h1>Filter menu scope</h1>
      <p>
        These examples verify that filtering can be enabled independently at the root and submenu
        levels.
      </p>

      <div className={classes.Examples}>
        <section className={classes.Example}>
          <h2>Filterable root, plain submenu</h2>
          <p>The root input filters its own items. The submenu has no filter input.</p>
          <RootFilterOnly />
        </section>

        <section className={classes.Example}>
          <h2>Plain root, filterable submenu</h2>
          <p>The root is an ordinary Menu. Only the submenu provides filtering.</p>
          <SubmenuFilterOnly />
        </section>
      </div>
    </div>
  );
}

function RootFilterOnly() {
  return (
    <FilterMenu.Root>
      <FilterMenu.Trigger className={classes.Trigger}>Open actions</FilterMenu.Trigger>
      <FilterMenu.Portal>
        <FilterMenu.Positioner className={classes.Positioner} sideOffset={8}>
          <FilterMenu.Popup className={classes.Popup}>
            <FilterMenu.Input className={classes.Input} aria-label="Filter root actions" />
            <FilterMenu.List>
              <FilterMenu.Item className={classes.Item}>Rename</FilterMenu.Item>
              <Menu.SubmenuRoot>
                <FilterMenu.SubmenuTrigger className={classes.Item}>
                  Share <span aria-hidden>›</span>
                </FilterMenu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner className={classes.Positioner} sideOffset={4}>
                    <Menu.Popup className={classes.Popup}>
                      <Menu.Item className={classes.Item}>Email</Menu.Item>
                      <Menu.Item className={classes.Item}>Copy link</Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>
              <FilterMenu.Item className={classes.Item}>Delete</FilterMenu.Item>
            </FilterMenu.List>
          </FilterMenu.Popup>
        </FilterMenu.Positioner>
      </FilterMenu.Portal>
    </FilterMenu.Root>
  );
}

function SubmenuFilterOnly() {
  return (
    <Menu.Root>
      <Menu.Trigger className={classes.Trigger}>Open actions</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={classes.Positioner} sideOffset={8}>
          <Menu.Popup className={classes.Popup}>
            <Menu.Item className={classes.Item}>Rename</Menu.Item>
            <FilterMenu.SubmenuRoot>
              <FilterMenu.SubmenuTrigger className={classes.Item}>
                Move to <span aria-hidden>›</span>
              </FilterMenu.SubmenuTrigger>
              <FilterMenu.Portal>
                <FilterMenu.Positioner className={classes.Positioner} sideOffset={4}>
                  <FilterMenu.Popup className={classes.Popup}>
                    <FilterMenu.Input className={classes.Input} aria-label="Filter destinations" />
                    <FilterMenu.List>
                      <FilterMenu.Item className={classes.Item}>Documents</FilterMenu.Item>
                      <FilterMenu.Item className={classes.Item}>Downloads</FilterMenu.Item>
                      <FilterMenu.Item className={classes.Item}>Archive</FilterMenu.Item>
                    </FilterMenu.List>
                  </FilterMenu.Popup>
                </FilterMenu.Positioner>
              </FilterMenu.Portal>
            </FilterMenu.SubmenuRoot>
            <Menu.Item className={classes.Item}>Delete</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
