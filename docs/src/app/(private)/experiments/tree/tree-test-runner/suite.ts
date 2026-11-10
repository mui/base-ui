export type TestStatus = 'idle' | 'queued' | 'running' | 'passed' | 'failed' | 'skipped';

export interface TestResult {
  status: TestStatus;
  /** How long the test ran, in ms, once it passed or failed. */
  duration: number | null;
  error: string | null;
}

export interface TestItem {
  id: string;
  label: string;
  kind: 'folder' | 'file' | 'describe' | 'test';
  /** `path:line`, or the path for folders and files. */
  location: string;
  /** Marked with `test.skip()`: reported as skipped without running. */
  skip?: boolean;
  result: TestResult;
  children?: TestItem[];
}

/** What a test does when it runs, drawn once so every run of a suite behaves the same. */
export interface TestProfile {
  /** Multiplies the average duration, between 0.2 and 1.8. */
  durationFactor: number;
  /** The test fails when this is below the failure rate. */
  failureDraw: number;
  error: string;
}

export interface Suite {
  items: TestItem[];
  /** The initial model of every node. Only the results change afterwards. */
  nodes: Map<string, TestItem>;
  parentIds: Map<string, string | null>;
  /** The file each test belongs to, to run a file's tests on one worker. */
  fileIds: Map<string, string>;
  profiles: Map<string, TestProfile>;
  /** In tree order. */
  testIds: string[];
  groupIds: string[];
}

export const RESULTS: Record<TestStatus, TestResult> = {
  idle: { status: 'idle', duration: null, error: null },
  queued: { status: 'queued', duration: null, error: null },
  running: { status: 'running', duration: null, error: null },
  passed: { status: 'passed', duration: null, error: null },
  failed: { status: 'failed', duration: null, error: null },
  skipped: { status: 'skipped', duration: null, error: null },
};

const FOLDERS =
  'auth checkout catalog account search admin billing settings onboarding reports'.split(' ');
const FEATURES = (
  'login signup password-reset cart payment shipping product-page filters profile orders users ' +
  'roles invoices exports webhooks dashboard preferences two-factor sessions coupons'
).split(' ');
const DESCRIBES = (
  'Desktop, Mobile, As a guest, As an admin, Empty state, Keyboard navigation, Error handling, ' +
  'Validation, Permissions, Pagination'
).split(', ');
const ACTIONS =
  'renders submits validates displays rejects persists updates opens closes restores'.split(' ');
const SUBJECTS = (
  'the form, an error message, the empty state, the dialog, the selected row, the page title, ' +
  'the user menu, the pagination, the confirmation toast, the summary, the draft, the search results'
).split(', ');
const ERRORS = [
  "Error: expect(locator).toBeVisible() failed\n\nLocator: getByRole('button', { name: 'Save' })\nExpected: visible\nTimeout: 5000ms\nError: element(s) not found",
  'Error: expect(received).toBe(expected)\n\nExpected: 3\nReceived: 2',
  'TimeoutError: page.waitForURL: Timeout 10000ms exceeded.\nwaiting for navigation to "**/dashboard" until "load"',
  'Error: expect(page).toHaveTitle(expected) failed\n\nExpected: "Checkout"\nReceived: "Cart"',
  "Error: locator.click: Target page, context or browser has been closed\n\nCall log:\n  - waiting for getByText('Continue')",
];
const SKIP_RATE = 0.03;

/**
 * Generates a suite of `testCount` tests, grouped into folders, spec files and
 * `describe` blocks. The same count always generates the same suite.
 */
export function createSuite(testCount: number): Suite {
  const random = createRandom(testCount);
  const pick = <T>(values: readonly T[]) => values[Math.floor(random() * values.length)];
  const suite: Suite = {
    items: [],
    nodes: new Map(),
    parentIds: new Map(),
    fileIds: new Map(),
    profiles: new Map(),
    testIds: [],
    groupIds: [],
  };
  const folders = new Map<string, TestItem>();
  let nextId = 0;

  const createId = (kind: TestItem['kind']) => {
    nextId += 1;
    return `${kind}-${nextId}`;
  };
  const add = (parent: TestItem | null, node: TestItem) => {
    suite.nodes.set(node.id, node);
    suite.parentIds.set(node.id, parent?.id ?? null);
    (parent?.children ?? suite.items).push(node);
    (node.kind === 'test' ? suite.testIds : suite.groupIds).push(node.id);
    return node;
  };
  const addGroup = (
    parent: TestItem | null,
    kind: TestItem['kind'],
    label: string,
    location: string,
  ) =>
    add(parent, {
      id: createId(kind),
      label,
      kind,
      location,
      result: RESULTS.idle,
      children: [],
    });
  const remaining = () => testCount - suite.testIds.length;

  for (let fileIndex = 0; remaining() > 0; fileIndex += 1) {
    const folderName = FOLDERS[fileIndex % FOLDERS.length];
    const round = Math.floor(fileIndex / FOLDERS.length);
    const copy = Math.floor(round / FEATURES.length);
    const fileName = `${FEATURES[round % FEATURES.length]}${copy > 0 ? `-${copy + 1}` : ''}.spec.ts`;
    const path = `${folderName}/${fileName}`;

    let folder = folders.get(folderName);
    if (folder == null) {
      folder = addGroup(null, 'folder', folderName, folderName);
      folders.set(folderName, folder);
    }
    const file = addGroup(folder, 'file', fileName, path);
    let line = 1;

    const addTests = (parent: TestItem, count: number) => {
      for (let index = 0; index < count && remaining() > 0; index += 1) {
        line += 3 + Math.floor(random() * 10);
        const test = add(parent, {
          id: createId('test'),
          label: `${pick(ACTIONS)} ${pick(SUBJECTS)}`,
          kind: 'test',
          location: `${path}:${line}`,
          skip: random() < SKIP_RATE || undefined,
          result: RESULTS.idle,
        });
        suite.fileIds.set(test.id, file.id);
        suite.profiles.set(test.id, {
          durationFactor: 0.2 + random() * 1.6,
          failureDraw: random(),
          error: pick(ERRORS),
        });
      }
    };

    addTests(file, Math.floor(random() * 4));
    const describeCount = 1 + Math.floor(random() * 3);
    const firstDescribe = Math.floor(random() * DESCRIBES.length);
    for (let index = 0; index < describeCount && remaining() > 0; index += 1) {
      line += 2;
      const describe = addGroup(
        file,
        'describe',
        DESCRIBES[(firstDescribe + index) % DESCRIBES.length],
        `${path}:${line}`,
      );
      addTests(describe, 2 + Math.floor(random() * 10));
      if (random() < 0.25 && remaining() > 0) {
        line += 2;
        const nested = addGroup(describe, 'describe', pick(DESCRIBES), `${path}:${line}`);
        addTests(nested, 2 + Math.floor(random() * 5));
      }
    }
  }

  return suite;
}

/** From the parent up to the root folder. */
export function getAncestorIds(suite: Suite, nodeId: string): string[] {
  const ancestorIds: string[] = [];
  for (let id = suite.parentIds.get(nodeId); id != null; id = suite.parentIds.get(id)) {
    ancestorIds.push(id);
  }
  return ancestorIds;
}

/** The test IDs of a node's subtree, in tree order. */
export function getTestIds(suite: Suite, nodeId: string): string[] {
  const testIds: string[] = [];
  const visit = (node: TestItem) => {
    if (node.kind === 'test') {
      testIds.push(node.id);
    }
    node.children?.forEach(visit);
  };
  const node = suite.nodes.get(nodeId);
  if (node != null) {
    visit(node);
  }
  return testIds;
}

/** A seeded Park–Miller generator, so a suite size always generates the same suite. */
function createRandom(seed: number) {
  let state = (seed % 2147483646) + 1;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}
