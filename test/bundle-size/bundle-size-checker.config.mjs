/**
 * @file Configuration file for bundle-size-checker
 *
 * This file determines which packages and components will have their bundle sizes measured.
 */
import path from 'path';
import fs from 'fs/promises';
import { defineConfig } from '@mui/internal-bundle-size-checker';

const rootDir = path.resolve(import.meta.dirname, '../..');

async function getBaseUiExports() {
  // Read the package.json to get exports
  const packageJsonPath = path.join(rootDir, 'packages/react/package.json');
  const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonContent);

  // Get all export paths from @base-ui/react package.json
  const exports = packageJson.exports;
  const entrypoints = Object.keys(exports).map((exportKey) => {
    // Convert from "./accordion" to "@base-ui/react/accordion"
    const entrypoint = exportKey === '.' ? '@base-ui/react' : `@base-ui/react${exportKey.slice(1)}`;
    return entrypoint;
  });

  return entrypoints;
}

async function getUtilsExports() {
  // Read top-level files to get utils exports
  const utilsDir = path.join(rootDir, 'packages/utils/src');
  const files = await fs.readdir(utilsDir);

  // Get file stats concurrently
  const fileStats = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(utilsDir, file);
      const stat = await fs.stat(filePath);
      return { file, stat };
    }),
  );

  const entrypoints = fileStats
    .filter(({ file, stat }) => {
      // For files, only include .ts and .tsx files
      if (stat.isFile() && !(file.endsWith('.ts') || file.endsWith('.tsx'))) {
        return false;
      }
      // Exclude test files
      if (file.includes('.test.') || file.includes('.spec.')) {
        return false;
      }
      return true;
    })
    .map(({ file }) => `@base-ui/utils/${file.replace(/\.(js|ts|tsx)$/, '')}`);

  return entrypoints;
}

const dragAndDropLeafEntrypoints = [
  {
    id: 'drag-and-drop/leaf/Draggable.Root',
    code: `import { Draggable } from '@base-ui/react/draggable'; console.log(Draggable.Root);`,
    track: true,
  },
  {
    id: 'drag-and-drop/leaf/Draggable.Displacement',
    code: `import { Draggable } from '@base-ui/react/draggable'; console.log(Draggable.Displacement);`,
    track: true,
  },
  {
    id: 'drag-and-drop/leaf/Draggable.Root+Displacement',
    code: `import { Draggable } from '@base-ui/react/draggable'; console.log(Draggable.Root, Draggable.Displacement);`,
    track: true,
  },
  {
    id: 'drag-and-drop/leaf/Draggable.Handle',
    code: `import { Draggable } from '@base-ui/react/draggable'; console.log(Draggable.Handle);`,
    track: true,
  },
  {
    id: 'drag-and-drop/leaf/Draggable.Preview',
    code: `import { Draggable } from '@base-ui/react/draggable'; console.log(Draggable.Preview);`,
    track: true,
  },
  {
    id: 'drag-and-drop/leaf/Draggable.Root+Preview',
    code: `import { Draggable } from '@base-ui/react/draggable'; console.log(Draggable.Root, Draggable.Preview);`,
    track: true,
  },
  {
    id: 'drag-and-drop/leaf/Draggable.ClonedPreview',
    code: `import { Draggable } from '@base-ui/react/draggable'; console.log(Draggable.ClonedPreview);`,
    track: true,
  },
  {
    id: 'drag-and-drop/leaf/Draggable.Root+ClonedPreview',
    code: `import { Draggable } from '@base-ui/react/draggable'; console.log(Draggable.Root, Draggable.ClonedPreview);`,
    track: true,
  },
  {
    id: 'drag-and-drop/leaf/Draggable.PreviewProvider',
    code: `import { Draggable } from '@base-ui/react/draggable'; console.log(Draggable.PreviewProvider);`,
    track: true,
  },
  {
    id: 'drag-and-drop/leaf/DropTarget.Root',
    code: `import { DropTarget } from '@base-ui/react/drop-target'; console.log(DropTarget.Root);`,
    track: true,
  },
  {
    id: 'drag-and-drop/leaf/DragAutoScroll.Root',
    code: `import { DragAutoScroll } from '@base-ui/react/drag-auto-scroll'; console.log(DragAutoScroll.Root);`,
    track: true,
  },
  {
    id: 'drag-and-drop/leaf/DragAutoScroll.Provider',
    code: `import { DragAutoScroll } from '@base-ui/react/drag-auto-scroll'; console.log(DragAutoScroll.Provider);`,
    track: true,
  },
  {
    id: 'drag-and-drop/leaf/DragAutoScroll.Provider+Root',
    code: `import { DragAutoScroll } from '@base-ui/react/drag-auto-scroll'; console.log(DragAutoScroll.Provider, DragAutoScroll.Root);`,
    track: true,
  },
  {
    id: 'drag-and-drop/leaf/Draggable.Root+DragAutoScroll.Root',
    code: `import { Draggable } from '@base-ui/react/draggable'; import { DragAutoScroll } from '@base-ui/react/drag-auto-scroll'; console.log(Draggable.Root, DragAutoScroll.Root);`,
    track: true,
  },
  {
    id: 'drag-and-drop/leaf/Draggable.Root+DragAutoScroll.Provider',
    code: `import { Draggable } from '@base-ui/react/draggable'; import { DragAutoScroll } from '@base-ui/react/drag-auto-scroll'; console.log(Draggable.Root, DragAutoScroll.Provider);`,
    track: true,
  },
  {
    id: 'drag-and-drop/leaf/useDragMonitor',
    code: `import { useDragMonitor } from '@base-ui/react/use-drag-monitor'; console.log(useDragMonitor);`,
    track: true,
  },
  {
    id: 'drag-and-drop/leaf/useDragDropManager',
    code: `import { useDragDropManager } from '@base-ui/react/use-drag-drop-manager'; console.log(useDragDropManager);`,
    track: true,
  },
];

/**
 * Generates the entrypoints configuration by scanning the exports field in package.json.
 */
export default defineConfig(async () => {
  return {
    entrypoints: [
      ...(await getBaseUiExports()),
      ...(await getUtilsExports()),
      ...dragAndDropLeafEntrypoints,
    ],
    upload: !!process.env.CI,
    comment: true,
  };
});
