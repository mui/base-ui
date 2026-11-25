import * as React from 'react';
import { describe } from 'vitest';
import { createRenderer, describeConformance } from '#test-utils';
import { TreeGrid } from '.';

/**
 * Conformance for the parts only `TreeGrid` renders. The parts it shares with
 * `Tree` run in `TreeConformance.test.tsx`, and `TreeGrid.Root` renders no element.
 */
// A single root row, so a part rendered through the list callback appears exactly once.
const ITEMS = [{ id: 'a', label: 'A', children: [{ id: 'a1', label: 'A1' }] }];

describe('TreeGrid conformance', () => {
  const { render } = createRenderer();

  /** Render `node` as the only child of the cell of the root row. */
  function renderInCell(node: React.ReactNode, rootProps?: object) {
    return render(
      <TreeGrid.Root items={ITEMS} {...rootProps}>
        <TreeGrid.Table>
          {(item: { id: string }) =>
            item.id === 'a' ? (
              <TreeGrid.Row itemId="a">
                <TreeGrid.Cell>{node}</TreeGrid.Cell>
              </TreeGrid.Row>
            ) : null
          }
        </TreeGrid.Table>
      </TreeGrid.Root>,
    );
  }

  describe('<TreeGrid.Table />', () => {
    describeConformance(<TreeGrid.Table>{() => null}</TreeGrid.Table>, () => ({
      refInstanceof: window.HTMLDivElement,
      render(node) {
        return render(<TreeGrid.Root items={ITEMS}>{node}</TreeGrid.Root>);
      },
    }));
  });

  describe('<TreeGrid.HeaderRow />', () => {
    describeConformance(<TreeGrid.HeaderRow />, () => ({
      refInstanceof: window.HTMLDivElement,
      testRenderPropWith: 'div',
      render(node) {
        return render(
          <TreeGrid.Root items={ITEMS}>
            <TreeGrid.Table>{node}</TreeGrid.Table>
          </TreeGrid.Root>,
        );
      },
    }));
  });

  describe('<TreeGrid.HeaderCell />', () => {
    describeConformance(<TreeGrid.HeaderCell />, () => ({
      refInstanceof: window.HTMLDivElement,
      testRenderPropWith: 'div',
      render(node) {
        return render(
          <TreeGrid.Root items={ITEMS}>
            <TreeGrid.Table>
              <TreeGrid.HeaderRow>{node}</TreeGrid.HeaderRow>
            </TreeGrid.Table>
          </TreeGrid.Root>,
        );
      },
    }));
  });

  describe('<TreeGrid.Cell />', () => {
    describeConformance(<TreeGrid.Cell />, () => ({
      refInstanceof: window.HTMLDivElement,
      testRenderPropWith: 'div',
      render(node) {
        return render(
          <TreeGrid.Root items={ITEMS}>
            <TreeGrid.Table>
              {(item: { id: string }) =>
                item.id === 'a' ? <TreeGrid.Row itemId="a">{node}</TreeGrid.Row> : null
              }
            </TreeGrid.Table>
          </TreeGrid.Root>,
        );
      },
    }));
  });

  describe('<TreeGrid.CellButton />', () => {
    describeConformance(<TreeGrid.CellButton />, () => ({
      refInstanceof: window.HTMLButtonElement,
      testRenderPropWith: 'button',
      render: (node) => renderInCell(node),
    }));
  });

  describe('<TreeGrid.CellInput />', () => {
    describeConformance(<TreeGrid.CellInput />, () => ({
      refInstanceof: window.HTMLInputElement,
      testRenderPropWith: 'input',
      render: (node) => renderInCell(node),
    }));
  });

  describe('<TreeGrid.CellLink />', () => {
    describeConformance(<TreeGrid.CellLink />, () => ({
      refInstanceof: window.HTMLAnchorElement,
      testRenderPropWith: 'a',
      render: (node) => renderInCell(node),
    }));
  });

  describe('<TreeGrid.CellControl />', () => {
    describeConformance(<TreeGrid.CellControl />, () => ({
      refInstanceof: window.HTMLDivElement,
      render: (node) => renderInCell(node),
    }));
  });

  describe('<TreeGrid.RowCheckbox />', () => {
    describeConformance(<TreeGrid.RowCheckbox />, () => ({
      refInstanceof: window.HTMLSpanElement,
      testRenderPropWith: 'span',
      render: (node) => renderInCell(node, { selectionMode: 'multiple' }),
    }));
  });

  describe('<TreeGrid.RowCheckboxIndicator />', () => {
    describeConformance(<TreeGrid.RowCheckboxIndicator keepMounted />, () => ({
      refInstanceof: window.HTMLSpanElement,
      testRenderPropWith: 'span',
      render: (node) =>
        renderInCell(<TreeGrid.RowCheckbox>{node}</TreeGrid.RowCheckbox>, {
          selectionMode: 'multiple',
        }),
    }));
  });
});
