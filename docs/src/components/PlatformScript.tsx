// Sets `data-platform="mac"` on <html> before first paint, so platform-specific UI
// (like the search shortcut) renders correctly without waiting for hydration.
// Mirrors `platform.os.mac` from `@base-ui/utils/platform`: iPadOS reports `MacIntel`
// with touch points and is excluded.
const script =
  "(function(n,p){p=(n.platform||'').toLowerCase();" +
  "if(p.indexOf('mac')===0&&!(p==='macintel'&&n.maxTouchPoints>1))" +
  "document.documentElement.setAttribute('data-platform','mac')})(navigator)";

/**
 * Render in <head>. The <html> element needs `suppressHydrationWarning`.
 */
export function PlatformScript() {
  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
