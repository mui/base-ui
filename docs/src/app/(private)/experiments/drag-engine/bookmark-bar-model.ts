export const ROOT_ID = 'root';

export type ParentId = typeof ROOT_ID | string;

export interface BookmarkNodeBase {
  id: string;
  name: string;
  parentId: ParentId;
}

export interface Bookmark extends BookmarkNodeBase {
  type: 'bookmark';
  url: string;
}

export interface BookmarkFolder extends BookmarkNodeBase {
  type: 'folder';
}

export type BookmarkNode = Bookmark | BookmarkFolder;

export interface BookmarkTree {
  nodes: Record<string, BookmarkNode>;
  children: Record<ParentId, string[]>;
}

export type BookmarkSeed =
  | { id: string; name: string; url: string }
  | { id: string; name: string; children: BookmarkSeed[] };

export type MoveValidity = boolean | 'reject';

export interface InsertionLocation {
  parentId: ParentId;
  index: number;
}

export interface InsertBookmarkSeedResult {
  tree: BookmarkTree;
  rootId: string;
}

const bookmark = (id: string, name: string, url: string): BookmarkSeed => ({ id, name, url });
const wikipedia = (id: string, name: string, article: string): BookmarkSeed =>
  bookmark(id, name, `https://en.wikipedia.org/wiki/${article}`);
const folder = (id: string, name: string, children: BookmarkSeed[]): BookmarkSeed => ({
  id,
  name,
  children,
});

const INITIAL_BOOKMARKS: BookmarkSeed[] = [
  wikipedia('wikipedia', 'Wikipedia', 'Main_Page'),
  wikipedia('artificialIntelligence', 'Artificial intelligence', 'Artificial_intelligence'),
  folder('science', 'Science', [
    wikipedia('scientificMethod', 'Scientific method', 'Scientific_method'),
    wikipedia('chemistry', 'Chemistry', 'Chemistry'),
    wikipedia('astronomy', 'Astronomy', 'Astronomy'),
    wikipedia('geology', 'Geology', 'Geology'),
    wikipedia('ecology', 'Ecology', 'Ecology'),
    wikipedia('medicine', 'Medicine', 'Medicine'),
    wikipedia('neuroscience', 'Neuroscience', 'Neuroscience'),
    wikipedia('genetics', 'Genetics', 'Genetics'),
    folder('physics', 'Physics', [
      wikipedia('classicalMechanics', 'Classical mechanics', 'Classical_mechanics'),
      wikipedia('quantumMechanics', 'Quantum mechanics', 'Quantum_mechanics'),
      wikipedia('relativity', 'Relativity', 'Theory_of_relativity'),
      wikipedia('thermodynamics', 'Thermodynamics', 'Thermodynamics'),
      wikipedia('electromagnetism', 'Electromagnetism', 'Electromagnetism'),
      wikipedia('particlePhysics', 'Particle physics', 'Particle_physics'),
      wikipedia('nuclearPhysics', 'Nuclear physics', 'Nuclear_physics'),
      wikipedia('optics', 'Optics', 'Optics'),
      wikipedia('acoustics', 'Acoustics', 'Acoustics'),
      wikipedia('astrophysics', 'Astrophysics', 'Astrophysics'),
    ]),
    folder('biology', 'Biology', [
      wikipedia('evolution', 'Evolution', 'Evolution'),
      wikipedia('cellBiology', 'Cell biology', 'Cell_biology'),
      wikipedia('botany', 'Botany', 'Botany'),
      wikipedia('zoology', 'Zoology', 'Zoology'),
      wikipedia('microbiology', 'Microbiology', 'Microbiology'),
      wikipedia('marineBiology', 'Marine biology', 'Marine_biology'),
      wikipedia('humanBody', 'Human body', 'Human_body'),
      wikipedia('dna', 'DNA', 'DNA'),
      wikipedia('biodiversity', 'Biodiversity', 'Biodiversity'),
      wikipedia('ecosystem', 'Ecosystem', 'Ecosystem'),
    ]),
    folder('earthAndSpace', 'Earth and space', [
      wikipedia('earth', 'Earth', 'Earth'),
      wikipedia('solarSystem', 'Solar System', 'Solar_System'),
      wikipedia('milkyWay', 'Milky Way', 'Milky_Way'),
      wikipedia('galaxy', 'Galaxy', 'Galaxy'),
      wikipedia('star', 'Star', 'Star'),
      wikipedia('blackHole', 'Black hole', 'Black_hole'),
      wikipedia('cosmology', 'Cosmology', 'Cosmology'),
      wikipedia('spaceExploration', 'Space exploration', 'Space_exploration'),
    ]),
  ]),
  folder('technology', 'Technology', [
    wikipedia('technologyOverview', 'Technology', 'Technology'),
    wikipedia('innovation', 'Innovation', 'Innovation'),
    wikipedia('robotics', 'Robotics', 'Robotics'),
    wikipedia('nanotechnology', 'Nanotechnology', 'Nanotechnology'),
    wikipedia('biotechnology', 'Biotechnology', 'Biotechnology'),
    folder('computing', 'Computing', [
      wikipedia('computerScience', 'Computer science', 'Computer_science'),
      wikipedia('internet', 'Internet', 'Internet'),
      wikipedia('worldWideWeb', 'World Wide Web', 'World_Wide_Web'),
      wikipedia('software', 'Software', 'Software'),
      wikipedia('programming', 'Computer programming', 'Computer_programming'),
      wikipedia('operatingSystem', 'Operating system', 'Operating_system'),
      wikipedia('database', 'Database', 'Database'),
      wikipedia('cryptography', 'Cryptography', 'Cryptography'),
      wikipedia('machineLearning', 'Machine learning', 'Machine_learning'),
      wikipedia('virtualReality', 'Virtual reality', 'Virtual_reality'),
    ]),
    folder('engineering', 'Engineering', [
      wikipedia('civilEngineering', 'Civil engineering', 'Civil_engineering'),
      wikipedia('mechanicalEngineering', 'Mechanical engineering', 'Mechanical_engineering'),
      wikipedia('electricalEngineering', 'Electrical engineering', 'Electrical_engineering'),
      wikipedia('chemicalEngineering', 'Chemical engineering', 'Chemical_engineering'),
      wikipedia('aerospaceEngineering', 'Aerospace engineering', 'Aerospace_engineering'),
      wikipedia('architecture', 'Architecture', 'Architecture'),
      wikipedia('renewableEnergy', 'Renewable energy', 'Renewable_energy'),
      wikipedia('manufacturing', 'Manufacturing', 'Manufacturing'),
    ]),
    folder('transport', 'Transport', [
      wikipedia('automobile', 'Car', 'Car'),
      wikipedia('railTransport', 'Rail transport', 'Rail_transport'),
      wikipedia('aviation', 'Aviation', 'Aviation'),
      wikipedia('ship', 'Ship', 'Ship'),
      wikipedia('bicycle', 'Bicycle', 'Bicycle'),
      wikipedia('publicTransport', 'Public transport', 'Public_transport'),
      wikipedia('electricVehicle', 'Electric vehicle', 'Electric_vehicle'),
    ]),
  ]),
  folder('history', 'History', [
    wikipedia('worldHistory', 'History of the world', 'History_of_the_world'),
    wikipedia('prehistory', 'Prehistory', 'Prehistory'),
    folder('ancientWorld', 'Ancient world', [
      wikipedia('mesopotamia', 'Mesopotamia', 'Mesopotamia'),
      wikipedia('ancientEgypt', 'Ancient Egypt', 'Ancient_Egypt'),
      folder('classicalMediterranean', 'Classical Mediterranean', [
        wikipedia('ancientGreece', 'Ancient Greece', 'Ancient_Greece'),
        wikipedia('romanRepublic', 'Roman Republic', 'Roman_Republic'),
        wikipedia('romanEmpire', 'Roman Empire', 'Roman_Empire'),
        wikipedia('byzantineEmpire', 'Byzantine Empire', 'Byzantine_Empire'),
      ]),
      folder('ancientAsia', 'Ancient Asia', [
        wikipedia('indusValley', 'Indus Valley Civilisation', 'Indus_Valley_Civilisation'),
        wikipedia('historyOfChina', 'History of China', 'History_of_China'),
        wikipedia('historyOfJapan', 'History of Japan', 'History_of_Japan'),
      ]),
    ]),
    folder('modernHistory', 'Modern history', [
      wikipedia('renaissance', 'Renaissance', 'Renaissance'),
      wikipedia('ageOfDiscovery', 'Age of Discovery', 'Age_of_Discovery'),
      wikipedia('industrialRevolution', 'Industrial Revolution', 'Industrial_Revolution'),
      wikipedia('worldWarOne', 'World War I', 'World_War_I'),
      wikipedia('worldWarTwo', 'World War II', 'World_War_II'),
      wikipedia('coldWar', 'Cold War', 'Cold_War'),
      wikipedia('spaceRace', 'Space Race', 'Space_Race'),
      wikipedia('historyOfInternet', 'History of the Internet', 'History_of_the_Internet'),
    ]),
  ]),
  folder('arts', 'Arts and culture', [
    wikipedia('art', 'Art', 'Art'),
    wikipedia('literature', 'Literature', 'Literature'),
    wikipedia('music', 'Music', 'Music'),
    wikipedia('film', 'Film', 'Film'),
    wikipedia('photography', 'Photography', 'Photography'),
    wikipedia('theatre', 'Theatre', 'Theatre'),
    wikipedia('dance', 'Dance', 'Dance'),
    wikipedia('fashion', 'Fashion', 'Fashion'),
    wikipedia('cuisine', 'Cuisine', 'Cuisine'),
    wikipedia('mythology', 'Mythology', 'Mythology'),
    wikipedia('philosophy', 'Philosophy', 'Philosophy'),
    wikipedia('religion', 'Religion', 'Religion'),
    wikipedia('museum', 'Museum', 'Museum'),
    wikipedia('comicBook', 'Comic book', 'Comic_book'),
    wikipedia('videoGame', 'Video game', 'Video_game'),
  ]),
  folder('places', 'Places', [
    folder('africa', 'Africa', [
      wikipedia('africaOverview', 'Africa', 'Africa'),
      wikipedia('sahara', 'Sahara', 'Sahara'),
      wikipedia('nile', 'Nile', 'Nile'),
    ]),
    folder('asia', 'Asia', [
      wikipedia('asiaOverview', 'Asia', 'Asia'),
      wikipedia('himalayas', 'Himalayas', 'Himalayas'),
      wikipedia('silkRoad', 'Silk Road', 'Silk_Road'),
    ]),
    folder('europe', 'Europe', [
      wikipedia('europeOverview', 'Europe', 'Europe'),
      wikipedia('alps', 'Alps', 'Alps'),
      wikipedia('mediterranean', 'Mediterranean Sea', 'Mediterranean_Sea'),
    ]),
    folder('americas', 'Americas', [
      wikipedia('northAmerica', 'North America', 'North_America'),
      wikipedia('southAmerica', 'South America', 'South_America'),
      wikipedia('amazonRiver', 'Amazon River', 'Amazon_River'),
    ]),
    wikipedia('oceania', 'Oceania', 'Oceania'),
    wikipedia('antarctica', 'Antarctica', 'Antarctica'),
  ]),
  wikipedia('space', 'Space', 'Outer_space'),
  wikipedia('ocean', 'Ocean', 'Ocean'),
  wikipedia('climateChange', 'Climate change', 'Climate_change'),
  wikipedia('human', 'Human', 'Human'),
  wikipedia('universe', 'Universe', 'Universe'),
  wikipedia('dinosaur', 'Dinosaur', 'Dinosaur'),
  wikipedia('mathematics', 'Mathematics', 'Mathematics'),
  wikipedia('language', 'Language', 'Language'),
  wikipedia('democracy', 'Democracy', 'Democracy'),
  wikipedia('economics', 'Economics', 'Economics'),
  wikipedia('psychology', 'Psychology', 'Psychology'),
  wikipedia('education', 'Education', 'Education'),
  wikipedia('sport', 'Sport', 'Sport'),
  wikipedia('travel', 'Travel', 'Travel'),
  wikipedia('city', 'City', 'City'),
  wikipedia('mountain', 'Mountain', 'Mountain'),
  wikipedia('river', 'River', 'River'),
  wikipedia('forest', 'Forest', 'Forest'),
  wikipedia('desert', 'Desert', 'Desert'),
  wikipedia('island', 'Island', 'Island'),
  wikipedia('weather', 'Weather', 'Weather'),
  wikipedia('agriculture', 'Agriculture', 'Agriculture'),
  wikipedia('food', 'Food', 'Food'),
  wikipedia('writing', 'Writing', 'Writing'),
  wikipedia('number', 'Number', 'Number'),
  wikipedia('time', 'Time', 'Time'),
];

export function createBookmarkTree(seeds: BookmarkSeed[]): BookmarkTree {
  const tree: BookmarkTree = { nodes: {}, children: {} };

  function visit(items: BookmarkSeed[], parentId: ParentId) {
    tree.children[parentId] = items.map((item) => item.id);
    for (const item of items) {
      if ('url' in item) {
        tree.nodes[item.id] = {
          id: item.id,
          type: 'bookmark',
          name: item.name,
          url: item.url,
          parentId,
        };
      } else {
        tree.nodes[item.id] = {
          id: item.id,
          type: 'folder',
          name: item.name,
          parentId,
        };
        visit(item.children, item.id);
      }
    }
  }

  visit(seeds, ROOT_ID);
  return tree;
}

export const INITIAL_TREE = createBookmarkTree(INITIAL_BOOKMARKS);

export function getChildren(tree: BookmarkTree, parentId: ParentId): BookmarkNode[] {
  return (tree.children[parentId] ?? []).map((id) => tree.nodes[id]).filter(Boolean);
}

export function getInsertionLocationForNode(
  tree: BookmarkTree,
  id: string,
): InsertionLocation | null {
  const node = tree.nodes[id];
  if (!node) {
    return null;
  }
  if (node.type === 'folder') {
    return { parentId: node.id, index: tree.children[node.id]?.length ?? 0 };
  }

  const siblings = tree.children[node.parentId] ?? [];
  return { parentId: node.parentId, index: siblings.indexOf(node.id) + 1 };
}

export function getBookmarkSeed(tree: BookmarkTree, id: string): BookmarkSeed | null {
  const node = tree.nodes[id];
  if (!node) {
    return null;
  }
  if (node.type === 'bookmark') {
    return { id: node.id, name: node.name, url: node.url };
  }
  return {
    id: node.id,
    name: node.name,
    children: (tree.children[node.id] ?? [])
      .map((childId) => getBookmarkSeed(tree, childId))
      .filter((child): child is BookmarkSeed => child !== null),
  };
}

export function insertBookmarkSeed(
  tree: BookmarkTree,
  seed: BookmarkSeed,
  parentId: ParentId,
  index: number,
  createId: (type: BookmarkNode['type']) => string,
): InsertBookmarkSeedResult {
  const nodes = { ...tree.nodes };
  const children = { ...tree.children };

  function insert(item: BookmarkSeed, nextParentId: ParentId): string {
    const id = createId('url' in item ? 'bookmark' : 'folder');
    if ('url' in item) {
      nodes[id] = { id, type: 'bookmark', name: item.name, url: item.url, parentId: nextParentId };
    } else {
      nodes[id] = { id, type: 'folder', name: item.name, parentId: nextParentId };
      children[id] = item.children.map((child) => insert(child, id));
    }
    return id;
  }

  const rootId = insert(seed, parentId);
  const siblings = [...(children[parentId] ?? [])];
  siblings.splice(Math.max(0, Math.min(index, siblings.length)), 0, rootId);
  children[parentId] = siblings;
  return { tree: { nodes, children }, rootId };
}

export function isSelfOrDescendant(
  tree: BookmarkTree,
  sourceId: string,
  parentId: ParentId,
): boolean {
  for (let current = parentId; current !== ROOT_ID; ) {
    if (current === sourceId) {
      return true;
    }
    const node = tree.nodes[current];
    if (!node) {
      return false;
    }
    current = node.parentId;
  }
  return false;
}

export function getMoveValidity(
  tree: BookmarkTree,
  sourceId: string,
  parentId: ParentId,
  index: number,
): MoveValidity {
  const source = tree.nodes[sourceId];
  if (!source || isSelfOrDescendant(tree, sourceId, parentId)) {
    return 'reject';
  }

  const destination = tree.children[parentId] ?? [];
  const destinationIndex = Math.max(0, Math.min(index, destination.length));
  if (source.parentId !== parentId) {
    return true;
  }

  const sourceIndex = destination.indexOf(sourceId);
  const adjustedIndex = sourceIndex < destinationIndex ? destinationIndex - 1 : destinationIndex;
  return adjustedIndex !== sourceIndex;
}

export function moveNode(
  tree: BookmarkTree,
  sourceId: string,
  parentId: ParentId,
  index: number,
): BookmarkTree {
  if (getMoveValidity(tree, sourceId, parentId, index) !== true) {
    return tree;
  }

  const source = tree.nodes[sourceId];
  const sourceChildren = tree.children[source.parentId] ?? [];
  const sourceIndex = sourceChildren.indexOf(sourceId);
  const destinationChildren = tree.children[parentId] ?? [];
  let destinationIndex = Math.max(0, Math.min(index, destinationChildren.length));

  if (source.parentId === parentId && sourceIndex < destinationIndex) {
    destinationIndex -= 1;
  }

  const nextSourceChildren = sourceChildren.filter((id) => id !== sourceId);
  const nextDestinationChildren =
    source.parentId === parentId ? nextSourceChildren : [...destinationChildren];
  nextDestinationChildren.splice(destinationIndex, 0, sourceId);

  return {
    nodes: { ...tree.nodes, [sourceId]: { ...source, parentId } },
    children: {
      ...tree.children,
      [source.parentId]: nextSourceChildren,
      [parentId]: nextDestinationChildren,
    },
  };
}

function collectNodeIds(tree: BookmarkTree, id: string, result: Set<string>) {
  result.add(id);
  for (const childId of tree.children[id] ?? []) {
    collectNodeIds(tree, childId, result);
  }
}

export function removeNode(tree: BookmarkTree, id: string): BookmarkTree {
  const node = tree.nodes[id];
  if (!node) {
    return tree;
  }

  const removedIds = new Set<string>();
  collectNodeIds(tree, id, removedIds);
  const nodes = { ...tree.nodes };
  const children = { ...tree.children };

  for (const removedId of removedIds) {
    delete nodes[removedId];
    delete children[removedId];
  }
  children[node.parentId] = (children[node.parentId] ?? []).filter((childId) => childId !== id);
  return { nodes, children };
}

export function collectUrls(tree: BookmarkTree, id: string, result: string[]) {
  const node = tree.nodes[id];
  if (!node) {
    return;
  }
  if (node.type === 'bookmark') {
    result.push(node.url);
    return;
  }
  for (const childId of tree.children[id] ?? []) {
    collectUrls(tree, childId, result);
  }
}

export function getFolderPath(tree: BookmarkTree, folderId: string): string {
  const names: string[] = [];
  for (let current = folderId; current !== ROOT_ID; ) {
    const node = tree.nodes[current];
    if (!node) {
      break;
    }
    names.unshift(node.name);
    current = node.parentId;
  }
  return names.join(' / ');
}

export function getVisibleCount(
  itemWidths: number[],
  moreWidth: number,
  gap: number,
  availableWidth: number,
): number {
  const totalWidth = itemWidths.reduce((sum, width) => sum + width, 0);
  const totalGaps = Math.max(0, itemWidths.length - 1) * gap;
  if (totalWidth + totalGaps <= availableWidth) {
    return itemWidths.length;
  }

  let usedWidth = moreWidth;
  let count = 0;
  for (const itemWidth of itemWidths) {
    const nextWidth = usedWidth + gap + itemWidth;
    if (nextWidth > availableWidth) {
      break;
    }
    usedWidth = nextWidth;
    count += 1;
  }
  return count;
}
