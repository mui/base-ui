import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { copyPreviewContent, createPreviewContentContainer } from './previewContent';
import type { PreviewContent } from './previewContent';
import { updatePreviewContent } from './updatePreviewContent';

function createContent(parent?: Element) {
  const content: PreviewContent = {
    container: createPreviewContentContainer(document, parent),
    parent,
    copy: null,
  };
  const roots: Array<HTMLElement | null> = [];
  const onRootChange = vi.fn();
  return {
    content,
    container: content.container,
    roots,
    onRootChange,
    copy() {
      content.copy = copyPreviewContent(content);
      roots.push(content.copy.root);
      return content.copy.root;
    },
    update() {
      updatePreviewContent(content, { onRoot: (root) => roots.push(root), onRootChange });
    },
  };
}

describe('copyPreviewContent', () => {
  it('copies a single root element as the preview root, and wraps anything else', () => {
    const { container, copy } = createContent();

    container.innerHTML = '<section class="Chip">Chip</section>';
    expect(copy()!.outerHTML).toBe('<section class="Chip">Chip</section>');

    container.innerHTML = 'Text <b>and</b> nodes';
    const wrapper = copy()!;
    expect(wrapper.localName).toBe('div');
    expect(wrapper.innerHTML).toBe('Text <b>and</b> nodes');

    container.replaceChildren();
    expect(copy()).toBeNull();
  });

  it('wraps an SVG root, which cannot enter the top layer, in a div', () => {
    const { container, copy } = createContent();
    container.innerHTML = '<svg><circle r="4"></circle></svg>';

    const root = copy()!;
    expect(root.localName).toBe('div');
    expect(root.firstElementChild!.namespaceURI).toBe('http://www.w3.org/2000/svg');
  });

  it('keeps the ids the page does not use', () => {
    const { container, copy } = createContent(document.body);
    container.innerHTML = '<div id="badge"><label for="badge">Badge</label></div>';

    const root = copy()!;
    expect(root).toHaveAttribute('id', 'badge');
    expect(root.querySelector('label')).toHaveAttribute('for', 'badge');
  });

  it('rewrites ids held by another preview that is still settling', () => {
    const previous = document.createElement('div');
    previous.setAttribute('data-base-ui-drag-preview', 'content');
    previous.innerHTML = '<span id="badge">Previous</span>';
    document.body.appendChild(previous);
    onTestFinished(() => previous.remove());
    const { container, copy } = createContent(document.body);
    container.innerHTML = '<div id="badge"><label for="badge">Current</label></div>';

    const root = copy()!;

    expect(root.id).not.toBe('badge');
    expect(root.querySelector('label')).toHaveAttribute('for', root.id);
  });

  it('copies field state that React sets through DOM properties', () => {
    const { container, copy } = createContent();
    container.innerHTML =
      '<div><select><option value="a">A</option><option value="b">B</option></select>' +
      '<input type="checkbox"><input value="start"></div>';
    container.querySelector('select')!.value = 'b';
    container.querySelector<HTMLInputElement>('[type="checkbox"]')!.indeterminate = true;
    container.querySelector<HTMLInputElement>('input:not([type])')!.value = 'typed';

    const root = copy()!;
    expect(root.querySelector('select')!.value).toBe('b');
    expect(root.querySelector<HTMLInputElement>('[type="checkbox"]')!.indeterminate).toBe(true);
    expect(root.querySelector<HTMLInputElement>('input:not([type])')!.value).toBe('typed');
  });

  it('leaves out scripts', () => {
    const { container, copy } = createContent();
    container.innerHTML = '<div>Chip<script>window.previewScriptRan = true</script></div>';

    expect(copy()!.querySelector('script')).toBeNull();
  });
});

describe('createPreviewContentContainer', () => {
  it('renders into an element with the tag and namespace of the parent', () => {
    const tbody = document.createElement('tbody');
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    expect(createPreviewContentContainer(document, tbody).localName).toBe('tbody');
    expect(createPreviewContentContainer(document, g).namespaceURI).toBe(
      'http://www.w3.org/2000/svg',
    );
  });
});

describe('updatePreviewContent', () => {
  it('applies attribute, text and child changes to the same copy', () => {
    const { container, copy, update, roots, onRootChange } = createContent();
    container.innerHTML = '<div class="Chip"><span>1 item</span><i>a</i><i>c</i></div>';
    const root = copy()!;
    const span = root.querySelector('span');

    const content = container.firstElementChild as HTMLElement;
    content.querySelector('span')!.firstChild!.nodeValue = '2 items';
    content.style.visibility = 'hidden';
    const added = document.createElement('i');
    added.textContent = 'b';
    content.insertBefore(added, content.lastElementChild);
    content.querySelector('i')!.remove();
    update();

    // Patched in place. The engine keeps the root open in the top layer, so it must
    // not be replaced for a change inside it, and the nodes inside stay too.
    expect(roots).toHaveLength(1);
    expect(root.querySelector('span')).toBe(span);
    expect(span!.textContent).toBe('2 items');
    expect(Array.from(root.querySelectorAll('i'), (node) => node.textContent)).toEqual(['b', 'c']);
    // The engine writes the root's inline style.
    expect(onRootChange).toHaveBeenCalledWith('visibility: hidden;');
  });

  it('moves the copy of a node that moved in the content', () => {
    const { container, copy, update } = createContent();
    container.innerHTML = '<ul><li>a</li><li>b</li><li>c</li></ul>';
    const root = copy()!;
    const [a, b, c] = Array.from(root.children);

    const list = container.firstElementChild!;
    list.appendChild(list.firstElementChild!);
    update();

    expect(Array.from(root.children)).toEqual([b, c, a]);
  });

  it.each([false, true])('keeps nodes moved across parents, reverse order: %s', (reverse) => {
    const { container, copy, update } = createContent();
    container.innerHTML = '<div><span>Move</span><section>Parent</section></div>';
    const contentRoot = container.firstElementChild!;
    if (reverse) {
      contentRoot.appendChild(contentRoot.firstElementChild!);
    }
    const root = copy()!;
    const movedCopy = root.querySelector('span');

    contentRoot.querySelector('section')!.appendChild(contentRoot.querySelector('span')!);
    update();

    expect(root.children).toHaveLength(1);
    expect(root.querySelector('section > span')).toBe(movedCopy);
  });

  it('distinguishes attribute values containing the cache delimiters', () => {
    const { container, copy, update } = createContent();
    container.innerHTML = '<div></div>';
    const contentRoot = container.firstElementChild!;
    contentRoot.setAttribute('data-a', '1\ndata-b=2');
    const root = copy()!;
    update();

    contentRoot.setAttribute('data-a', '1');
    contentRoot.setAttribute('data-b', '2');
    update();

    expect(root).toHaveAttribute('data-a', '1');
    expect(root).toHaveAttribute('data-b', '2');
  });

  it('shows nothing new until it runs', () => {
    const { container, copy } = createContent();
    container.innerHTML = '<div>Preview</div>';
    const root = copy()!;

    container.firstElementChild!.textContent = 'Changed';

    expect(root.textContent).toBe('Preview');
  });

  it('copies the content from scratch when its root changes', () => {
    const { container, copy, update, roots } = createContent();
    container.innerHTML = '<div>One</div>';
    copy();

    container.innerHTML = '<div>One</div><div>Two</div>';
    update();
    expect(roots).toHaveLength(2);
    expect(roots[1]!.innerHTML).toBe('<div>One</div><div>Two</div>');

    container.replaceChildren();
    update();
    expect(roots[2]).toBeNull();
  });

  it('keeps an id the page only uses on the copy itself', () => {
    const { content, container, copy } = createContent(document.body);
    container.innerHTML = '<div><span id="count">1</span></div>';
    const root = copy()!;
    // The engine inserts the copy into the page, marked as the preview, and marks it
    // again whenever the root's attributes change.
    const markAsPreview = () => root.setAttribute('data-base-ui-drag-preview', 'content');
    markAsPreview();
    document.body.appendChild(root);
    onTestFinished(() => root.remove());

    container.querySelector('span')!.textContent = '2';
    updatePreviewContent(content, { onRoot() {}, onRootChange: markAsPreview });

    expect(root.querySelector('span')).toHaveAttribute('id', 'count');
  });

  it('sanitizes nodes and attributes the content adds later', () => {
    // The page already uses this id, so the copy's must change.
    const taken = document.createElement('input');
    taken.id = 'field';
    document.body.appendChild(taken);
    onTestFinished(() => taken.remove());
    const { container, copy, update } = createContent(document.body);
    container.innerHTML = '<div><label for="field">Name</label></div>';
    const root = copy()!;

    const content = container.firstElementChild!;
    content.insertAdjacentHTML(
      'beforeend',
      '<input id="field" name="name"><script>window.previewScriptRan = true</script>',
    );
    content.querySelector('label')!.setAttribute('data-state', 'ready');
    update();

    const input = root.querySelector('input')!;
    expect(input.id).toMatch(/^field-drag-preview-\d+$/);
    expect(input).not.toHaveAttribute('name');
    expect(input).toHaveAttribute('form', '');
    // A reference to an id added later is remapped too.
    expect(root.querySelector('label')).toHaveAttribute('for', input.id);
    expect(root.querySelector('label')).toHaveAttribute('data-state', 'ready');
    expect(root.querySelector('script')).toBeNull();
  });

  it('never lets a copied radio join a page radio group, even briefly', () => {
    // The page's own radio group.
    const page = document.createElement('div');
    page.innerHTML = '<input type="radio" name="size" value="m" checked>';
    document.body.appendChild(page);
    onTestFinished(() => page.remove());
    const { container, copy, update } = createContent();
    container.innerHTML = '<div><input type="radio" value="l" checked></div>';
    // The engine inserts the copy into the page.
    page.appendChild(copy()!);

    container.querySelector('input')!.setAttribute('name', 'size');
    update();

    expect((page.firstElementChild as HTMLInputElement).checked).toBe(true);
    expect(page.lastElementChild!.querySelector('input')).not.toHaveAttribute('name');
  });

  it('writes inline styles through the CSSOM, not the style attribute', () => {
    // A strict CSP without `'unsafe-inline'` blocks `setAttribute('style', …)`.
    const { container, copy, update } = createContent();
    container.innerHTML = '<div><span>Chip</span></div>';
    const root = copy()!;
    const setAttribute = vi.spyOn(Element.prototype, 'setAttribute');
    const setAttributeNS = vi.spyOn(Element.prototype, 'setAttributeNS');
    onTestFinished(() => {
      setAttribute.mockRestore();
      setAttributeNS.mockRestore();
    });

    container.querySelector('span')!.style.color = 'red';
    update();

    expect(root.querySelector('span')!.style.color).toBe('red');
    const styleWrites = [...setAttribute.mock.calls, ...setAttributeNS.mock.calls].filter((call) =>
      call.includes('style'),
    );
    expect(styleWrites).toEqual([]);
  });

  it('copies field state that changed since the copy', () => {
    const { container, copy, update } = createContent();
    container.innerHTML = '<div><input type="checkbox"><textarea></textarea></div>';
    const root = copy()!;

    container.querySelector('input')!.checked = true;
    container.querySelector('textarea')!.value = 'typed';
    update();

    expect(root.querySelector('input')!.checked).toBe(true);
    expect(root.querySelector('textarea')!.value).toBe('typed');
  });

  it('keeps the root style references to rewritten ids after the root changes', () => {
    // The page already uses this id, so the copy's filter gets a new one.
    const taken = document.createElement('div');
    taken.id = 'fx';
    document.body.appendChild(taken);
    onTestFinished(() => taken.remove());
    const content: PreviewContent = {
      container: createPreviewContentContainer(document, document.body),
      parent: document.body,
      copy: null,
    };
    content.container.innerHTML =
      '<div style="filter: url(#fx)"><svg><filter id="fx"></filter></svg></div>';
    content.copy = copyPreviewContent(content);
    const root = content.copy.root!;

    content.container.firstElementChild!.setAttribute('class', 'Active');
    updatePreviewContent(content, {
      onRoot() {},
      // The engine rebuilds the root's inline style from the content's own.
      onRootChange(ownStyle) {
        root.style.cssText = ownStyle;
      },
    });

    const filterId = root.querySelector('filter')!.id;
    expect(filterId).toMatch(/^fx-drag-preview-\d+$/);
    expect(root.style.filter).toContain(`#${filterId}`);
    expect(root).toHaveClass('Active');
  });
});
