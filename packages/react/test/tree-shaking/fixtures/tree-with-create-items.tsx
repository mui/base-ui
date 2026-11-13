import * as React from 'react';
import { Tree } from '../../../src/tree';

interface Item {
  key: string;
  name: string;
}

const items = Tree.createItems<Item>([], {
  getId: (item) => item.key,
  getLabel: (item) => item.name,
});

export function App() {
  return <Tree.Root items={items}>{null}</Tree.Root>;
}
