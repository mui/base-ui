export function isContextMenu(
  type: string | undefined,
): type is 'context-menu' | 'nested-context-menu' {
  return type === 'context-menu' || type === 'nested-context-menu';
}
