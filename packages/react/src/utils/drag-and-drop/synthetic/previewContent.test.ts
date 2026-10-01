import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { createPreviewContentMirror } from './previewContent';
import type { PreviewContentMirror } from './previewContent';

const mirrors: PreviewContentMirror[] = [];

function createMirror(parent?: Element) {
  const roots: Array<HTMLElement | null> = [];
  const onRootChange = vi.fn();
  const mirror = createPreviewContentMirror(document, parent, {
    onRoot: (root) => roots.push(root),
    onRootChange,
  });
  mirrors.push(mirror);
  return { mirror, roots, onRootChange, content: mirror.container };
}

afterEach(() => {
  while (mirrors.length > 0) {
    mirrors.pop()!.stop();
  }
});

describe('createPreviewContentMirror', () => {
  it('copies a single root element as the preview root, and wraps anything else', () => {
    const { mirror, roots, content } = createMirror();

    content.innerHTML = '<section class="Chip">Chip</section>';
    mirror.flush();
    expect(roots.at(-1)!.outerHTML).toBe('<section class="Chip">Chip</section>');

    content.innerHTML = 'Text <b>and</b> nodes';
    mirror.flush();
    expect(roots.at(-1)!.localName).toBe('div');
    expect(roots.at(-1)!.innerHTML).toBe('Text <b>and</b> nodes');

    content.replaceChildren();
    mirror.flush();
    expect(roots.at(-1)).toBeNull();
  });

  it('applies attribute, text and child changes to the same copy', () => {
    const { mirror, roots, onRootChange, content } = createMirror();
    content.innerHTML = '<div class="Chip"><span>1 item</span><i>a</i><i>c</i></div>';
    mirror.flush();
    const root = roots[0]!;

    const staged = content.firstElementChild as HTMLElement;
    staged.querySelector('span')!.firstChild!.nodeValue = '2 items';
    staged.style.visibility = 'hidden';
    const added = document.createElement('i');
    added.textContent = 'b';
    staged.insertBefore(added, staged.lastElementChild);
    staged.querySelector('i')!.remove();
    mirror.flush();

    // Patched in place. The engine keeps the root open in the top layer, so it must
    // not be replaced for a change inside it.
    expect(roots).toHaveLength(1);
    expect(root.querySelector('span')!.textContent).toBe('2 items');
    expect(root.style.visibility).toBe('hidden');
    expect(Array.from(root.querySelectorAll('i'), (node) => node.textContent)).toEqual(['b', 'c']);
    expect(onRootChange).toHaveBeenCalled();
  });

  it('keeps the ids the page does not use', () => {
    const { mirror, roots, content } = createMirror(document.body);
    content.innerHTML = '<div id="badge"><label for="badge">Badge</label></div>';
    mirror.flush();

    expect(roots[0]).toHaveAttribute('id', 'badge');
    expect(roots[0]!.querySelector('label')).toHaveAttribute('for', 'badge');
  });

  it('sanitizes nodes and attributes the content adds later', () => {
    // The page already uses this id, so the copy's must change.
    const taken = document.createElement('input');
    taken.id = 'field';
    document.body.appendChild(taken);
    onTestFinished(() => taken.remove());
    const { mirror, roots, content } = createMirror(document.body);
    content.innerHTML = '<div><label for="field">Name</label></div>';
    mirror.flush();
    const root = roots[0]!;

    const staged = content.firstElementChild!;
    staged.insertAdjacentHTML(
      'beforeend',
      '<input id="field" name="name"><script>window.previewScriptRan = true</script>',
    );
    staged.querySelector('label')!.setAttribute('data-state', 'ready');
    mirror.flush();

    const input = root.querySelector('input')!;
    expect(input.id).toMatch(/^field-drag-preview-\d+$/);
    expect(input).not.toHaveAttribute('name');
    expect(input).toHaveAttribute('form', '');
    // A reference to an id added later is remapped too.
    expect(root.querySelector('label')).toHaveAttribute('for', input.id);
    expect(root.querySelector('script')).toBeNull();
  });

  it('never lets a copied radio join a page radio group, even briefly', () => {
    // The page's own radio group.
    const page = document.createElement('div');
    page.innerHTML = '<input type="radio" name="size" value="m" checked>';
    document.body.appendChild(page);
    const { mirror, roots, content } = createMirror();
    content.innerHTML = '<div><input type="radio" value="l" checked></div>';
    mirror.flush();
    // The engine inserts the copy into the page.
    page.appendChild(roots[0]!);

    content.querySelector('input')!.setAttribute('name', 'size');
    mirror.flush();

    expect((page.firstElementChild as HTMLInputElement).checked).toBe(true);
    expect(roots[0]!.querySelector('input')).not.toHaveAttribute('name');
    page.remove();
  });

  it('copies field state that React sets through DOM properties', () => {
    const { mirror, roots, content } = createMirror();
    content.innerHTML =
      '<div><select><option value="a">A</option><option value="b">B</option></select>' +
      '<input type="checkbox"><input value="start"></div>';
    mirror.flush();

    // No mutation record reports these.
    content.querySelector('select')!.value = 'b';
    content.querySelector<HTMLInputElement>('[type="checkbox"]')!.indeterminate = true;
    content.querySelector<HTMLInputElement>('[type="checkbox"]')!.checked = true;
    content.querySelector<HTMLInputElement>('input:not([type])')!.value = 'typed';
    mirror.syncLiveState();

    const root = roots[0]!;
    expect(root.querySelector('select')!.value).toBe('b');
    expect(root.querySelector<HTMLInputElement>('[type="checkbox"]')!.checked).toBe(true);
    expect(root.querySelector<HTMLInputElement>('[type="checkbox"]')!.indeterminate).toBe(true);
    expect(root.querySelector<HTMLInputElement>('input:not([type])')!.value).toBe('typed');
  });

  it('wraps an SVG root, which cannot enter the top layer, in a div', () => {
    const { mirror, roots, content } = createMirror();
    content.innerHTML = '<svg><circle r="4"></circle></svg>';
    mirror.flush();

    expect(roots[0]!.localName).toBe('div');
    expect(roots[0]!.firstElementChild!.namespaceURI).toBe('http://www.w3.org/2000/svg');
  });

  it('keeps the root style references to rewritten ids after the root changes', () => {
    // The engine rebuilds the root's inline style from the content's own when the
    // root changes, as the callback below does.
    // The page already uses this id, so the copy's filter gets a new one.
    const taken = document.createElement('div');
    taken.id = 'fx';
    document.body.appendChild(taken);
    onTestFinished(() => taken.remove());
    let root: HTMLElement | null = null;
    const mirror = createPreviewContentMirror(document, document.body, {
      onRoot: (next) => {
        root = next;
      },
      onRootChange: (ownStyle) => {
        root!.style.cssText = ownStyle;
      },
    });
    mirrors.push(mirror);
    mirror.container.innerHTML =
      '<div style="filter: url(#fx)"><svg><filter id="fx"></filter></svg></div>';
    mirror.flush();

    mirror.container.firstElementChild!.setAttribute('class', 'Active');
    mirror.flush();

    const filterId = root!.querySelector('filter')!.id;
    expect(filterId).toMatch(/^fx-drag-preview-\d+$/);
    expect(root!.style.filter).toContain(`#${filterId}`);
  });

  it('keeps its last copy after stopping', () => {
    const { mirror, roots, content } = createMirror();
    content.innerHTML = '<div>Preview</div>';
    mirror.flush();

    content.firstElementChild!.textContent = 'Last';
    mirror.stop();
    // The content unmounting with the drag must not empty the copy.
    content.replaceChildren();
    mirror.flush();

    expect(roots).toHaveLength(1);
    expect(roots[0]!.textContent).toBe('Last');
  });

  it('renders into an element with the tag and namespace of the parent', () => {
    const tbody = document.createElement('tbody');
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    expect(createMirror(tbody).content.localName).toBe('tbody');
    expect(createMirror(g).content.namespaceURI).toBe('http://www.w3.org/2000/svg');
  });
});
