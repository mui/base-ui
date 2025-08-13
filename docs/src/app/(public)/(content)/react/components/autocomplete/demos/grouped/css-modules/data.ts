export interface Tag {
  id: string;
  label: string;
  group: 'Type' | 'Component';
}

export interface TagGroup {
  value: string;
  items: Tag[];
}

const tagsData: Tag[] = [
  { id: 't1', label: 'feature', group: 'Type' },
  { id: 't2', label: 'fix', group: 'Type' },
  { id: 't3', label: 'bug', group: 'Type' },
  { id: 't4', label: 'docs', group: 'Type' },
  { id: 't5', label: 'internal', group: 'Type' },
  { id: 't6', label: 'mobile', group: 'Type' },
  { id: 't10', label: 'component: select', group: 'Component' },
  { id: 't11', label: 'component: combobox', group: 'Component' },
  { id: 't12', label: 'component: autocomplete', group: 'Component' },
  { id: 't13', label: 'component: filterable menu', group: 'Component' },
  { id: 't14', label: 'component: menu', group: 'Component' },
  { id: 't15', label: 'component: tabs', group: 'Component' },
  { id: 't16', label: 'component: slider', group: 'Component' },
  { id: 't17', label: 'component: switch', group: 'Component' },
  { id: 't18', label: 'component: dialog', group: 'Component' },
  { id: 't19', label: 'component: tooltip', group: 'Component' },
  { id: 't20', label: 'component: navigation menu', group: 'Component' },
  { id: 't21', label: 'component: radio', group: 'Component' },
  { id: 't22', label: 'component: checkbox', group: 'Component' },
  { id: 't23', label: 'component: progress', group: 'Component' },
  { id: 't24', label: 'component: avatar', group: 'Component' },
  { id: 't25', label: 'component: toolbar', group: 'Component' },
];

function groupTags(tags: Tag[]): TagGroup[] {
  const groups: { [key: string]: Tag[] } = {};
  tags.forEach((t) => {
    (groups[t.group] ??= []).push(t);
  });
  const order = ['Type', 'Component'];
  return order.map((value) => ({ value, items: groups[value] ?? [] }));
}

export const groupedTags = groupTags(tagsData);
