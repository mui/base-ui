import * as React from 'react';
import { describe } from 'vitest';
import { createRenderer, describeConformance } from '#test-utils';
import { Tree } from '.';

/**
 * Conformance for every rendering `Tree.*` part: `render`-prop merging, the
 * `className` callback, ref forwarding and prop spreading. One file rather than
 * one per part, because almost every part needs the same `Tree.Root` +
 * `Tree.List` + `Tree.Item` scaffolding around it.
 *
 * `Tree.Root` and `Tree.FilterProvider` are absent on purpose:
 * they render no element of their own.
 */
// A single root row, so a part rendered through the list callback appears
// exactly once — conformance looks the element up by a shared test id.
const ITEMS = [{ id: 'a', label: 'A', children: [{ id: 'a1', label: 'A1' }] }];

/** The list callback that renders `node` for the one root row and nothing else. */
function onlyRootRow(node: React.ReactNode) {
  return (item: { id: string }) => (item.id === 'a' ? node : null);
}

describe('Tree conformance', () => {
  const { render } = createRenderer();

  /** Render `node` as the only child of an item row. */
  function renderInItem(node: React.ReactNode, rootProps?: object) {
    return render(
      <Tree.Root items={ITEMS} {...rootProps}>
        <Tree.List>
          {onlyRootRow(
            <Tree.Item itemId="a">
              <Tree.ItemContent>{node}</Tree.ItemContent>
            </Tree.Item>,
          )}
        </Tree.List>
      </Tree.Root>,
    );
  }

  describe('<Tree.List />', () => {
    describeConformance(<Tree.List>{() => null}</Tree.List>, () => ({
      refInstanceof: window.HTMLDivElement,
      render(node) {
        return render(<Tree.Root items={ITEMS}>{node}</Tree.Root>);
      },
    }));
  });

  describe('<Tree.Label />', () => {
    describeConformance(<Tree.Label />, () => ({
      refInstanceof: window.HTMLDivElement,
      render(node) {
        return render(
          <Tree.Root items={[]}>
            {node}
            <Tree.List>{() => null}</Tree.List>
          </Tree.Root>,
        );
      },
    }));
  });

  describe('<Tree.Empty />', () => {
    describeConformance(<Tree.Empty />, () => ({
      refInstanceof: window.HTMLDivElement,
      render(node) {
        // Rendered only when the tree has no items.
        return render(
          <Tree.Root items={[]}>
            <Tree.List>{() => null}</Tree.List>
            {node}
          </Tree.Root>,
        );
      },
    }));
  });

  describe('<Tree.Status />', () => {
    describeConformance(<Tree.Status />, () => ({
      refInstanceof: window.HTMLDivElement,
      render(node) {
        return render(<Tree.Root items={ITEMS}>{node}</Tree.Root>);
      },
    }));
  });

  describe('<Tree.Input />', () => {
    describeConformance(<Tree.Input />, () => ({
      refInstanceof: window.HTMLInputElement,
      render(node) {
        return render(
          <Tree.FilterProvider>
            <Tree.Root items={ITEMS}>{node}</Tree.Root>
          </Tree.FilterProvider>,
        );
      },
    }));
  });

  describe('<Tree.Clear />', () => {
    describeConformance(<Tree.Clear />, () => ({
      refInstanceof: window.HTMLButtonElement,
      button: true,
      render(node) {
        // Rendered only while the query is not empty.
        return render(
          <Tree.FilterProvider defaultValue="a">
            <Tree.Root items={ITEMS}>{node}</Tree.Root>
          </Tree.FilterProvider>,
        );
      },
    }));
  });

  describe('<Tree.Item />', () => {
    describeConformance(
      <Tree.Item itemId="a">
        <Tree.ItemContent />
      </Tree.Item>,
      () => ({
        refInstanceof: window.HTMLDivElement,
        render(node) {
          return render(
            <Tree.Root items={ITEMS}>
              <Tree.List>{onlyRootRow(node)}</Tree.List>
            </Tree.Root>,
          );
        },
      }),
    );
  });

  describe('<Tree.ItemExpansionTrigger />', () => {
    describeConformance(<Tree.ItemExpansionTrigger />, () => ({
      refInstanceof: window.HTMLButtonElement,
      testRenderPropWith: 'button',
      button: true,
      render(node) {
        return renderInItem(node);
      },
    }));
  });

  describe('<Tree.ItemButton />', () => {
    describeConformance(<Tree.ItemButton />, () => ({
      refInstanceof: window.HTMLButtonElement,
      testRenderPropWith: 'button',
      render(node) {
        return renderInItem(node);
      },
    }));
  });

  describe('<Tree.ItemInput />', () => {
    describeConformance(<Tree.ItemInput />, () => ({
      refInstanceof: window.HTMLInputElement,
      testRenderPropWith: 'input',
      render(node) {
        return renderInItem(node);
      },
    }));
  });

  describe('<Tree.ItemLink />', () => {
    describeConformance(<Tree.ItemLink />, () => ({
      refInstanceof: window.HTMLAnchorElement,
      testRenderPropWith: 'a',
      render(node) {
        return renderInItem(node);
      },
    }));
  });

  describe('<Tree.ItemControl />', () => {
    describeConformance(<Tree.ItemControl />, () => ({
      refInstanceof: window.HTMLDivElement,
      render(node) {
        return renderInItem(node);
      },
    }));
  });

  describe('<Tree.ItemGroupIndicator />', () => {
    describeConformance(<Tree.ItemGroupIndicator />, () => ({
      refInstanceof: window.HTMLSpanElement,
      testRenderPropWith: 'span',
      render(node) {
        return renderInItem(node);
      },
    }));
  });

  describe('<Tree.ItemIndentGuide />', () => {
    describeConformance(<Tree.ItemIndentGuide />, () => ({
      refInstanceof: window.HTMLSpanElement,
      testRenderPropWith: 'span',
      // One guide per ancestor level, so a root row renders none: put it on the
      // nested child instead.
      render(node) {
        return render(
          <Tree.Root items={ITEMS} defaultExpandedItems={['a']}>
            <Tree.List>
              {(item: { id: string }) =>
                item.id === 'a1' ? (
                  <Tree.Item itemId="a1">
                    <Tree.ItemContent>{node}</Tree.ItemContent>
                  </Tree.Item>
                ) : null
              }
            </Tree.List>
          </Tree.Root>,
        );
      },
    }));
  });

  describe('<Tree.ItemContent />', () => {
    describeConformance(<Tree.ItemContent />, () => ({
      refInstanceof: window.HTMLDivElement,
      testRenderPropWith: 'div',
      render(node) {
        return render(
          <Tree.Root items={ITEMS}>
            <Tree.List>
              {() => (
                <Tree.Item itemId="a">
                  <Tree.ItemContent>{node}</Tree.ItemContent>
                </Tree.Item>
              )}
            </Tree.List>
          </Tree.Root>,
        );
      },
    }));
  });

  describe('<Tree.ItemCheckbox />', () => {
    describeConformance(<Tree.ItemCheckbox />, () => ({
      refInstanceof: window.HTMLSpanElement,
      testRenderPropWith: 'span',
      render(node) {
        return renderInItem(node, { selectionMode: 'multiple' });
      },
    }));
  });

  describe('<Tree.ItemCheckboxIndicator />', () => {
    describeConformance(<Tree.ItemCheckboxIndicator keepMounted />, () => ({
      refInstanceof: window.HTMLSpanElement,
      testRenderPropWith: 'span',
      render(node) {
        return renderInItem(<Tree.ItemCheckbox>{node}</Tree.ItemCheckbox>, {
          selectionMode: 'multiple',
        });
      },
    }));
  });
});
