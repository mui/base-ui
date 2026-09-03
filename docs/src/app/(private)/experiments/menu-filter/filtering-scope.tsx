'use client';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import classes from './filtering-scope.module.css';

export default function MenuFilteringScopeExperiment() {
  const [autoHighlight, setAutoHighlight] = React.useState(false);
  const [focusOnHover, setFocusOnHover] = React.useState(false);

  return (
    <div className={classes.Page}>
      <h1>Menu filter scope</h1>
      <p>
        These examples verify that filtering can be enabled independently at the root and submenu
        levels.
      </p>

      <label className={classes.Option}>
        <input
          type="checkbox"
          checked={autoHighlight}
          onChange={(event) => setAutoHighlight(event.currentTarget.checked)}
        />
        autoHighlight
      </label>
      <label className={classes.Option}>
        <input
          type="checkbox"
          checked={focusOnHover}
          onChange={(event) => setFocusOnHover(event.currentTarget.checked)}
        />
        Focus the submenu input when its trigger is hovered (Notion-like, via <code>autoFocus</code>
        )
      </label>

      <div className={classes.Examples}>
        <section className={classes.Example}>
          <h2>Root input only</h2>
          <p>The root input filters its own items. The submenu is a plain menu.</p>
          <RootFilterOnly autoHighlight={autoHighlight} />
        </section>

        <section className={classes.Example}>
          <h2>Submenu input only</h2>
          <p>The root is a plain menu. Only the submenu filters.</p>
          <SubmenuFilterOnly autoHighlight={autoHighlight} focusOnHover={focusOnHover} />
        </section>

        <section className={classes.Example}>
          <h2>Root and submenu inputs</h2>
          <p>
            Every level filters. By default focus moves into a submenu once the pointer enters it.
          </p>
          <NestedFilters autoHighlight={autoHighlight} focusOnHover={focusOnHover} />
        </section>
      </div>
    </div>
  );
}

function RootFilterOnly(props: { autoHighlight: boolean }) {
  return (
    <Menu.FilterProvider autoHighlight={props.autoHighlight}>
      <Menu.Root>
        <Menu.Trigger className={classes.Trigger}>Open actions</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={classes.Positioner} sideOffset={8}>
            <Menu.Popup className={classes.Popup}>
              <Menu.FilterInput className={classes.Input} aria-label="Filter root actions" />
              <Menu.FilterList className={classes.List}>
                <Menu.Item className={classes.Item}>Rename</Menu.Item>
                <Menu.SubmenuRoot>
                  <Menu.SubmenuTrigger className={classes.Item}>
                    Share <span aria-hidden>›</span>
                  </Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner className={classes.Positioner} sideOffset={4}>
                      <Menu.Popup className={classes.Popup}>
                        <Menu.Item className={classes.Item}>Email</Menu.Item>
                        <Menu.Item className={classes.Item}>Copy link</Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
                <Menu.Item className={classes.Item}>Delete</Menu.Item>
              </Menu.FilterList>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </Menu.FilterProvider>
  );
}

function SubmenuFilterOnly(props: { autoHighlight: boolean; focusOnHover: boolean }) {
  return (
    <Menu.Root>
      <Menu.Trigger className={classes.Trigger}>Open actions</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={classes.Positioner} sideOffset={8}>
          <Menu.Popup className={classes.Popup}>
            <Menu.Item className={classes.Item}>Rename</Menu.Item>
            <Menu.FilterProvider autoHighlight={props.autoHighlight}>
              <Menu.SubmenuRoot>
                <Menu.SubmenuTrigger className={classes.Item}>
                  Move to <span aria-hidden>›</span>
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner className={classes.Positioner} sideOffset={4}>
                    <Menu.Popup className={classes.Popup}>
                      <Menu.FilterInput
                        className={classes.Input}
                        aria-label="Filter destinations"
                        autoFocus={props.focusOnHover}
                      />
                      <Menu.FilterList className={classes.List}>
                        <Menu.Item className={classes.Item}>Documents</Menu.Item>
                        <Menu.Item className={classes.Item}>Downloads</Menu.Item>
                        <Menu.Item className={classes.Item}>Archive</Menu.Item>
                      </Menu.FilterList>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>
            </Menu.FilterProvider>
            <Menu.Item className={classes.Item}>Delete</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function FilterableSubmenu(props: {
  label: string;
  items: string[];
  autoHighlight: boolean;
  focusOnHover: boolean;
}) {
  return (
    <Menu.FilterProvider autoHighlight={props.autoHighlight}>
      <Menu.SubmenuRoot>
        <Menu.SubmenuTrigger className={classes.Item}>
          {props.label} <span aria-hidden>›</span>
        </Menu.SubmenuTrigger>
        <Menu.Portal>
          <Menu.Positioner className={classes.Positioner} sideOffset={4}>
            <Menu.Popup className={classes.Popup}>
              <Menu.FilterInput
                className={classes.Input}
                aria-label={`Filter ${props.label.toLowerCase()}`}
                autoFocus={props.focusOnHover}
              />
              <Menu.FilterList className={classes.List}>
                {props.items.map((item) => (
                  <Menu.Item key={item} className={classes.Item}>
                    {item}
                  </Menu.Item>
                ))}
              </Menu.FilterList>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.SubmenuRoot>
    </Menu.FilterProvider>
  );
}

function NestedFilters(props: { autoHighlight: boolean; focusOnHover: boolean }) {
  return (
    <Menu.FilterProvider autoHighlight={props.autoHighlight}>
      <Menu.Root>
        <Menu.Trigger className={classes.Trigger}>Open actions</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={classes.Positioner} sideOffset={8}>
            <Menu.Popup className={classes.Popup}>
              <Menu.FilterInput className={classes.Input} aria-label="Filter actions" />
              <Menu.FilterList className={classes.List}>
                <Menu.Item className={classes.Item}>Rename</Menu.Item>
                <Menu.Item className={classes.Item}>Duplicate</Menu.Item>
                <FilterableSubmenu
                  label="Move to"
                  items={['Documents', 'Downloads', 'Archive']}
                  {...props}
                />
                <FilterableSubmenu
                  label="Share"
                  items={['Email', 'Messages', 'Copy link']}
                  {...props}
                />
                <Menu.Item className={classes.Item}>Delete</Menu.Item>
              </Menu.FilterList>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </Menu.FilterProvider>
  );
}
