import * as React from 'react';
import { describe } from 'vitest';
import { createRenderer, describeConformance } from '#test-utils';
import { ActionTree } from '.';

/**
 * Conformance for the parts only `ActionTree` renders. The parts it shares with
 * `Tree` run in `TreeConformance.test.tsx`, and `ActionTree.Root` renders no element.
 */
// A single root row, so a part rendered through the list callback appears exactly once.
const ITEMS = [{ id: 'a', label: 'A', children: [{ id: 'a1', label: 'A1' }] }];

describe('ActionTree conformance', () => {
  const { render } = createRenderer();

  /** Render `node` as the only child of the cell of the root row. */
  function renderInCell(node: React.ReactNode, rootProps?: object) {
    return render(
      <ActionTree.Root items={ITEMS} {...rootProps}>
        <ActionTree.List>
          {(item: { id: string }) =>
            item.id === 'a' ? (
              <ActionTree.Item itemId="a">
                <ActionTree.ItemContent>{node}</ActionTree.ItemContent>
              </ActionTree.Item>
            ) : null
          }
        </ActionTree.List>
      </ActionTree.Root>,
    );
  }

  describe('<ActionTree.ItemContent />', () => {
    describeConformance(<ActionTree.ItemContent />, () => ({
      refInstanceof: window.HTMLDivElement,
      testRenderPropWith: 'div',
      render(node) {
        return render(
          <ActionTree.Root items={ITEMS}>
            <ActionTree.List>
              {(item: { id: string }) =>
                item.id === 'a' ? <ActionTree.Item itemId="a">{node}</ActionTree.Item> : null
              }
            </ActionTree.List>
          </ActionTree.Root>,
        );
      },
    }));
  });

  describe('<ActionTree.ItemButton />', () => {
    describeConformance(<ActionTree.ItemButton />, () => ({
      refInstanceof: window.HTMLButtonElement,
      testRenderPropWith: 'button',
      render: (node) => renderInCell(node),
    }));
  });

  describe('<ActionTree.ItemInput />', () => {
    describeConformance(<ActionTree.ItemInput />, () => ({
      refInstanceof: window.HTMLInputElement,
      testRenderPropWith: 'input',
      render: (node) => renderInCell(node),
    }));
  });

  describe('<ActionTree.ItemLink />', () => {
    describeConformance(<ActionTree.ItemLink />, () => ({
      refInstanceof: window.HTMLAnchorElement,
      testRenderPropWith: 'a',
      render: (node) => renderInCell(node),
    }));
  });

  describe('<ActionTree.ItemControl />', () => {
    describeConformance(<ActionTree.ItemControl />, () => ({
      refInstanceof: window.HTMLDivElement,
      render: (node) => renderInCell(node),
    }));
  });

  describe('<ActionTree.ItemCheckbox />', () => {
    describeConformance(<ActionTree.ItemCheckbox />, () => ({
      refInstanceof: window.HTMLSpanElement,
      testRenderPropWith: 'span',
      render: (node) => renderInCell(node, { selectionMode: 'multiple' }),
    }));
  });

  describe('<ActionTree.ItemCheckboxIndicator />', () => {
    describeConformance(<ActionTree.ItemCheckboxIndicator keepMounted />, () => ({
      refInstanceof: window.HTMLSpanElement,
      testRenderPropWith: 'span',
      render: (node) =>
        renderInCell(<ActionTree.ItemCheckbox>{node}</ActionTree.ItemCheckbox>, {
          selectionMode: 'multiple',
        }),
    }));
  });
});
