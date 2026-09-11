import { expect, describe, it } from 'vitest';
import { getLaidOutRowElements } from './getLaidOutRowElements';

function createRow(rowIndex: number, options: { hidden?: boolean; absolute?: boolean } = {}) {
  const row = document.createElement('div');
  row.dataset.rowIndex = String(rowIndex);
  if (options.hidden) {
    row.hidden = true;
  }
  if (options.absolute) {
    row.style.position = 'absolute';
  }
  return row;
}

describe('getLaidOutRowElements', () => {
  it('returns the rows of a flat render zone in order', () => {
    const renderZone = document.createElement('div');
    renderZone.append(createRow(3), createRow(4, { absolute: true }), createRow(5));

    expect(getLaidOutRowElements(renderZone).map((row) => row.dataset.rowIndex)).toEqual([
      '3',
      '5',
    ]);
  });

  it('returns the rows inside group wrappers, skipping hidden headers', () => {
    const renderZone = document.createElement('div');
    const firstGroup = document.createElement('div');
    firstGroup.append(createRow(0, { hidden: true }), createRow(4), createRow(5));
    const secondGroup = document.createElement('div');
    secondGroup.append(createRow(6), createRow(7), createRow(20, { absolute: true }));
    renderZone.append(firstGroup, secondGroup);

    expect(getLaidOutRowElements(renderZone).map((row) => row.dataset.rowIndex)).toEqual([
      '4',
      '5',
      '6',
      '7',
    ]);
  });

  it('does not descend into a row', () => {
    const renderZone = document.createElement('div');
    const row = createRow(1);
    const nested = document.createElement('div');
    nested.append(createRow(99));
    row.append(nested);
    renderZone.append(row);

    expect(getLaidOutRowElements(renderZone).map((element) => element.dataset.rowIndex)).toEqual([
      '1',
    ]);
  });

  it('does not descend below a wrapper', () => {
    const renderZone = document.createElement('div');
    const wrapper = document.createElement('div');
    const content = document.createElement('div');
    content.append(createRow(99));
    wrapper.append(content, createRow(2));
    renderZone.append(wrapper);

    expect(getLaidOutRowElements(renderZone).map((element) => element.dataset.rowIndex)).toEqual([
      '2',
    ]);
  });
});
