import type * as React from 'react';
import { platform } from '@base-ui/utils/platform';

// `Mod` is Ctrl, or Cmd on macOS. `item` commands need a target item. The Tree handles the
// `tree` keys itself, so they're only listed in the shortcut help.
export const COMMANDS = {
  cut: { label: 'Cut', keys: ['Mod+X'], item: true },
  copy: { label: 'Copy', keys: ['Mod+C'], item: true },
  paste: { label: 'Paste', keys: ['Mod+V'] },
  duplicate: { label: 'Duplicate', keys: ['Mod+D'], item: true },
  delete: { label: 'Delete', keys: ['Delete', 'Mod+Backspace'], item: true },
  undo: { label: 'Undo', keys: ['Mod+Z'] },
  redo: { label: 'Redo', keys: ['Mod+Shift+Z', 'Mod+Y'] },
  selectAll: { label: 'Select All', keys: ['Mod+A'], tree: true },
  collapseAll: { label: 'Collapse Folders', keys: ['Mod+ArrowLeft'] },
  cancelCut: { label: 'Cancel Cut', keys: ['Escape'] },
  menu: { label: 'Show Actions', keys: ['Shift+F10', 'ContextMenu'], item: true },
  help: { label: 'Keyboard Shortcuts', keys: ['?'] },
} satisfies Record<string, { label: string; keys: string[]; item?: true; tree?: true }>;

export type Command = keyof typeof COMMANDS;

const KEY_NAMES: Record<string, string> = platform.os.mac
  ? { Mod: '⌘', Alt: '⌥', Shift: '⇧', Backspace: '⌫', Delete: '⌦', Escape: 'Esc' }
  : { Mod: 'Ctrl', Escape: 'Esc', ContextMenu: 'Menu' };

export function formatKeys(keys: string) {
  return keys
    .replace('ArrowLeft', '←')
    .split('+')
    .map((key) => KEY_NAMES[key] ?? key)
    .join(platform.os.mac ? '' : '+');
}

export function getAriaKeyshortcuts(command: Command) {
  return COMMANDS[command].keys
    .map((keys) => keys.replace(/^Mod(.+)/, 'Control$1 Meta$1'))
    .join(' ');
}

export function getShortcutCommand(event: React.KeyboardEvent) {
  // Option with a letter types a symbol on macOS, so read the physical key.
  const key = event.altKey && event.code.startsWith('Key') ? event.code.slice(3) : event.key;
  const isSymbol = key.length === 1 && key.toLowerCase() === key.toUpperCase();
  const pressed = [
    (event.ctrlKey || event.metaKey) && 'Mod',
    event.altKey && 'Alt',
    // Shift is part of typing a symbol such as `?`.
    event.shiftKey && !isSymbol && 'Shift',
    key.length === 1 ? key.toUpperCase() : key,
  ]
    .filter(Boolean)
    .join('+');
  return (Object.keys(COMMANDS) as Command[]).find((command) => {
    const shortcut = COMMANDS[command];
    return !('tree' in shortcut) && shortcut.keys.includes(pressed);
  });
}
