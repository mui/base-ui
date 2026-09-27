'use client';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';

// Local-only repro for https://github.com/mui/base-ui/issues/5528
// Open http://localhost:3005/playground/combobox-axe

const fruits = ['Apple', 'Banana', 'Cherry', 'Grape', 'Mango'];

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

interface Offender {
  label: string;
  hiddenBy: string;
}

declare global {
  interface Window {
    axe?: { run: (ctx: Document, opts: object) => Promise<{ violations: AxeViolation[] }> };
  }
}
interface AxeViolation {
  id: string;
  impact: string;
  help: string;
  nodes: { target: string[] }[];
}

function describe(el: Element) {
  const text = (el.textContent || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').trim().slice(0, 30);
  return `<${el.tagName.toLowerCase()}> "${text}"`;
}

// Every element that is focusable *and* inside an aria-hidden="true" subtree.
function findOffenders(): Offender[] {
  return Array.from(document.querySelectorAll(FOCUSABLE))
    .map((el) => {
      const hiddenAncestor = el.closest('[aria-hidden="true"]');
      // tabIndex < 0 means the element is already out of the Tab order — that's fine.
      if (!hiddenAncestor || (el as HTMLElement).tabIndex < 0) {
        return null;
      }
      return { label: describe(el), hiddenBy: describe(hiddenAncestor).split(' ')[0] };
    })
    .filter((x): x is Offender => x != null);
}

function loadAxe(): Promise<void> {
  if (window.axe) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/axe-core@4/axe.min.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load axe-core from the CDN'));
    document.head.append(s);
  });
}

export default function ComboboxAxeRepro() {
  const [open, setOpen] = React.useState(false);
  const [offenders, setOffenders] = React.useState<Offender[]>([]);
  const [axeState, setAxeState] = React.useState<
    { status: 'idle' | 'running' | 'error'; message?: string } | { status: 'done'; violations: AxeViolation[] }
  >({ status: 'idle' });

  // Watch the DOM for aria-hidden changes and recompute offenders.
  React.useEffect(() => {
    const update = () => setOffenders(findOffenders());
    update();
    const mo = new MutationObserver(update);
    mo.observe(document.body, { attributes: true, attributeFilter: ['aria-hidden', 'tabindex', 'inert'], subtree: true });
    return () => mo.disconnect();
  }, []);

  // Run axe automatically shortly after the popup opens (while it is still open).
  React.useEffect(() => {
    if (!open) {
      return undefined;
    }
    let cancelled = false;
    setAxeState({ status: 'running' });
    const t = setTimeout(async () => {
      try {
        await loadAxe();
        const res = await window.axe!.run(document, { runOnly: ['wcag2a', 'wcag21aa'] });
        if (!cancelled) {
          setAxeState({ status: 'done', violations: res.violations });
        }
      } catch (e) {
        if (!cancelled) {
          setAxeState({ status: 'error', message: String(e) });
        }
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open]);

  const bug = open && offenders.length > 0;

  return (
    <div style={s.page}>
      <style>{css}</style>

      <nav style={s.nav} data-repro-nav>
        <strong style={{ marginRight: 12 }}>Fake site nav →</strong>
        <a href="#home" style={s.navItem}>Home</a>
        <button type="button" style={s.navItem}>Menu</button>
        <input placeholder="Search site" style={s.navItem} />
      </nav>

      <main style={s.main}>
        <section style={s.card}>
          <h1 style={{ margin: '0 0 8px', fontSize: 20 }}>Issue #5528 repro: combobox aria-hides focusable content</h1>
          <ol style={{ margin: 0, paddingLeft: 24, lineHeight: 1.7, listStyle: 'decimal' }}>
            <li>Click the <b>Fruit</b> input below. The list opens.</li>
            <li>
              The nav bar at the top gets <code>aria-hidden="true"</code> (red dashed outline). Screen
              readers now ignore it…
            </li>
            <li>…but its link, button and input are still focusable (yellow ⚠ badges). The panel on the right lists them.</li>
            <li>axe runs automatically while the popup is open and should report <code>aria-hidden-focus</code>.</li>
          </ol>
          <p style={{ margin: '8px 0 0', color: '#555', fontSize: 14 }}>
            Tip: DevTools → Elements, find <code>&lt;nav data-repro-nav&gt;</code> and watch its attributes while you
            open/close the list. After the fix, its focusable children should get <code>tabindex="-1"</code> while it
            is hidden, and lose it again on close.
          </p>
        </section>

        <div style={s.columns}>
          <section style={s.card}>
            <Combobox.Root items={fruits} onOpenChange={setOpen}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
                Fruit
                <Combobox.Input placeholder="Click me, e.g. Apple" style={s.input} />
              </label>
              <Combobox.Portal>
                <Combobox.Positioner sideOffset={4} style={{ zIndex: 10 }}>
                  <Combobox.Popup style={s.popup}>
                    <Combobox.Empty>
                      <div style={{ padding: 8 }}>No fruits found.</div>
                    </Combobox.Empty>
                    <Combobox.List>
                      {(item: string) => (
                        <Combobox.Item key={item} value={item} className="repro-item">
                          {item}
                        </Combobox.Item>
                      )}
                    </Combobox.List>
                  </Combobox.Popup>
                </Combobox.Positioner>
              </Combobox.Portal>
            </Combobox.Root>
          </section>

          <section style={{ ...s.card, ...s.status, borderColor: bug ? '#d32f2f' : open ? '#2e7d32' : '#ccc' }}>
            <div style={{ fontSize: 14, color: '#555' }}>Popup: <b>{open ? 'OPEN' : 'closed'}</b></div>
            <div style={{ fontSize: 22, fontWeight: 700, margin: '6px 0', color: bug ? '#d32f2f' : open ? '#2e7d32' : '#333' }}>
              {!open && 'Open the combobox to test'}
              {bug && `BUG: ${offenders.length} focusable element(s) hidden from screen readers`}
              {open && !bug && 'No focusable elements are aria-hidden ✅'}
            </div>
            {offenders.length > 0 && (
              <ul style={{ margin: '4px 0 10px', paddingLeft: 20, listStyle: 'disc', fontFamily: 'monospace', fontSize: 13 }}>
                {offenders.map((o, i) => (
                  <li key={i}>
                    {o.label} (still tabbable, inside aria-hidden {o.hiddenBy})
                  </li>
                ))}
              </ul>
            )}
            <div style={{ borderTop: '1px solid #ddd', paddingTop: 8, fontSize: 14 }}>
              <b>axe-core (wcag2a + wcag21aa):</b>{' '}
              {axeState.status === 'idle' && 'runs when the popup opens'}
              {axeState.status === 'running' && 'running…'}
              {axeState.status === 'error' && <span style={{ color: '#d32f2f' }}>{axeState.message}</span>}
              {axeState.status === 'done' &&
                (axeState.violations.length === 0 ? (
                  <span style={{ color: '#2e7d32' }}>no violations ✅</span>
                ) : (
                  <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                    {axeState.violations.map((v) => (
                      <li key={v.id} style={{ color: v.id === 'aria-hidden-focus' ? '#d32f2f' : undefined }}>
                        <code>{v.id}</code> ({v.impact}): {v.help}. Nodes:{' '}
                        <code>{v.nodes.map((n) => n.target.join(' ')).join(', ')}</code>
                      </li>
                    ))}
                  </ul>
                ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

const css = `
  [data-repro-nav][aria-hidden="true"] { outline: 3px dashed #d32f2f; outline-offset: -3px; background: #ffebee !important; }
  [data-repro-nav][aria-hidden="true"]::after { content: 'aria-hidden="true"'; margin-left: auto; color: #d32f2f; font: 600 12px monospace; }
  [aria-hidden="true"] a[href]:not([tabindex="-1"])::after,
  [aria-hidden="true"] button:not([tabindex="-1"])::after { content: ' ⚠'; }
  [aria-hidden="true"] :is(a[href], button, input):not([tabindex="-1"]) { box-shadow: 0 0 0 2px #f9a825; }
  .repro-item { padding: 6px 10px; border-radius: 4px; cursor: default; }
  .repro-item[data-highlighted] { background: #1976d2; color: white; }
  :focus-visible { outline: 3px solid #1976d2 !important; outline-offset: 2px; }
`;

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f5f5f5', color: '#222', fontFamily: 'system-ui, sans-serif' },
  nav: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'white', borderBottom: '1px solid #ddd' },
  navItem: { padding: '6px 12px', border: '1px solid #999', borderRadius: 6, background: 'white', color: '#222', font: 'inherit' },
  main: { padding: 24, display: 'grid', gap: 16, maxWidth: 1000 },
  columns: { display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16, alignItems: 'start' },
  card: { background: 'white', border: '1px solid #ddd', borderRadius: 8, padding: 16 },
  status: { borderWidth: 3 },
  input: { display: 'block', marginTop: 6, width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: 16, border: '2px solid #1976d2', borderRadius: 6, background: 'white', color: '#222' },
  popup: { background: 'white', color: '#222', border: '1px solid #999', borderRadius: 6, padding: 4, minWidth: 200, boxShadow: '0 4px 16px rgba(0,0,0,.2)' },
};