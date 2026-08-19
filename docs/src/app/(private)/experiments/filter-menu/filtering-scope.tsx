'use client';
import { FilterMenu } from '@base-ui/react/filter-menu';
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
          <h2>Root input only</h2>
          <p>The root input filters its own items. The submenu list owns virtual focus.</p>
          <RootFilterOnly />
        </section>

        <section className={classes.Example}>
          <h2>Submenu input only</h2>
          <p>The root list owns virtual focus. Only the submenu provides filtering.</p>
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
              <FilterMenu.SubmenuRoot>
                <FilterMenu.SubmenuTrigger className={classes.Item}>
                  Share <span aria-hidden>›</span>
                </FilterMenu.SubmenuTrigger>
                <FilterMenu.Portal>
                  <FilterMenu.Positioner className={classes.Positioner} sideOffset={4}>
                    <FilterMenu.Popup className={classes.Popup}>
                      <FilterMenu.List>
                        <FilterMenu.Item className={classes.Item}>Email</FilterMenu.Item>
                        <FilterMenu.Item className={classes.Item}>Copy link</FilterMenu.Item>
                      </FilterMenu.List>
                    </FilterMenu.Popup>
                  </FilterMenu.Positioner>
                </FilterMenu.Portal>
              </FilterMenu.SubmenuRoot>
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
    <FilterMenu.Root>
      <FilterMenu.Trigger className={classes.Trigger}>Open actions</FilterMenu.Trigger>
      <FilterMenu.Portal>
        <FilterMenu.Positioner className={classes.Positioner} sideOffset={8}>
          <FilterMenu.Popup className={classes.Popup}>
            <FilterMenu.List>
              <FilterMenu.Item className={classes.Item}>Rename</FilterMenu.Item>
              <FilterMenu.SubmenuRoot>
                <FilterMenu.SubmenuTrigger className={classes.Item}>
                  Move to <span aria-hidden>›</span>
                </FilterMenu.SubmenuTrigger>
                <FilterMenu.Portal>
                  <FilterMenu.Positioner className={classes.Positioner} sideOffset={4}>
                    <FilterMenu.Popup className={classes.Popup}>
                      <FilterMenu.Input
                        className={classes.Input}
                        aria-label="Filter destinations"
                      />
                      <FilterMenu.List>
                        <FilterMenu.Item className={classes.Item}>Documents</FilterMenu.Item>
                        <FilterMenu.Item className={classes.Item}>Downloads</FilterMenu.Item>
                        <FilterMenu.Item className={classes.Item}>Archive</FilterMenu.Item>
                      </FilterMenu.List>
                    </FilterMenu.Popup>
                  </FilterMenu.Positioner>
                </FilterMenu.Portal>
              </FilterMenu.SubmenuRoot>
              <FilterMenu.Item className={classes.Item}>Delete</FilterMenu.Item>
            </FilterMenu.List>
          </FilterMenu.Popup>
        </FilterMenu.Positioner>
      </FilterMenu.Portal>
    </FilterMenu.Root>
  );
}
