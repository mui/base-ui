import { describe, it, expect } from 'vitest';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import baseUIPlugin from './index';

async function generateCSS(config: any, css = '@tailwind utilities;') {
  const result = await postcss(tailwindcss(config)).process(css, {
    from: undefined,
  });
  return result.css;
}

describe('@base-ui/tailwindcss', () => {
  it('should generate ui-open variant', async () => {
    const config = {
      content: [{ raw: '<div class="ui-open:bg-blue-500"></div>' }],
      plugins: [baseUIPlugin()],
    };

    const css = await generateCSS(config);

    expect(css).toContain('[data-open]');
    expect(css).toContain('bg-blue-500');
  });

  it('should generate ui-not-open variant', async () => {
    const config = {
      content: [{ raw: '<div class="ui-not-open:bg-red-500"></div>' }],
      plugins: [baseUIPlugin()],
    };

    const css = await generateCSS(config);

    expect(css).toContain(':not([data-open])');
    expect(css).toContain('bg-red-500');
  });

  it('should generate ui-checked variant', async () => {
    const config = {
      content: [{ raw: '<button class="ui-checked:bg-green-500"></button>' }],
      plugins: [baseUIPlugin()],
    };

    const css = await generateCSS(config);

    expect(css).toContain('[data-checked]');
    expect(css).toContain('bg-green-500');
  });

  it('should generate ui-disabled variant', async () => {
    const config = {
      content: [{ raw: '<button class="ui-disabled:opacity-50"></button>' }],
      plugins: [baseUIPlugin()],
    };

    const css = await generateCSS(config);

    expect(css).toContain('[data-disabled]');
    expect(css).toContain('opacity-50');
  });

  it('should generate ui-selected variant', async () => {
    const config = {
      content: [{ raw: '<div class="ui-selected:text-bold"></div>' }],
      plugins: [baseUIPlugin()],
    };

    const css = await generateCSS(config);

    expect(css).toContain('[data-selected]');
  });

  it('should generate ui-highlighted variant', async () => {
    const config = {
      content: [{ raw: '<div class="ui-highlighted:bg-gray-100"></div>' }],
      plugins: [baseUIPlugin()],
    };

    const css = await generateCSS(config);

    expect(css).toContain('[data-highlighted]');
    expect(css).toContain('bg-gray-100');
  });

  it('should support custom prefix', async () => {
    const config = {
      content: [{ raw: '<div class="base-open:bg-blue-500"></div>' }],
      plugins: [baseUIPlugin({ prefix: 'base' })],
    };

    const css = await generateCSS(config);

    expect(css).toContain('[data-open]');
    expect(css).toContain('bg-blue-500');
  });

  it('should generate ui-starting-style variant', async () => {
    const config = {
      content: [{ raw: '<div class="ui-starting-style:opacity-0"></div>' }],
      plugins: [baseUIPlugin()],
    };

    const css = await generateCSS(config);

    expect(css).toContain('[data-starting-style]');
    expect(css).toContain('opacity-0');
  });

  it('should generate ui-ending-style variant', async () => {
    const config = {
      content: [{ raw: '<div class="ui-ending-style:opacity-0"></div>' }],
      plugins: [baseUIPlugin()],
    };

    const css = await generateCSS(config);

    expect(css).toContain('[data-ending-style]');
    expect(css).toContain('opacity-0');
  });

  it('should generate multiple variants', async () => {
    const config = {
      content: [
        {
          raw: '<div class="ui-open:bg-blue-500 ui-not-open:bg-red-500 ui-disabled:opacity-50"></div>',
        },
      ],
      plugins: [baseUIPlugin()],
    };

    const css = await generateCSS(config);

    expect(css).toContain('[data-open]');
    expect(css).toContain(':not([data-open])');
    expect(css).toContain('[data-disabled]');
    expect(css).toContain('bg-blue-500');
    expect(css).toContain('bg-red-500');
    expect(css).toContain('opacity-50');
  });

  it('should handle descendant selectors', async () => {
    const config = {
      content: [{ raw: '<div data-open><span class="ui-open:text-white"></span></div>' }],
      plugins: [baseUIPlugin()],
    };

    const css = await generateCSS(config);

    // Should contain descendant selector pattern
    expect(css).toContain('[data-open]');
    expect(css).toContain('text-white');
  });

  it('should generate ui-invalid and ui-valid variants', async () => {
    const config = {
      content: [
        {
          raw: '<input class="ui-invalid:border-red-500 ui-valid:border-green-500" />',
        },
      ],
      plugins: [baseUIPlugin()],
    };

    const css = await generateCSS(config);

    expect(css).toContain('[data-invalid]');
    expect(css).toContain('[data-valid]');
    expect(css).toContain('border-red-500');
    expect(css).toContain('border-green-500');
  });

  it('should generate ui-touched and ui-dirty variants', async () => {
    const config = {
      content: [
        {
          raw: '<input class="ui-touched:ring-2 ui-dirty:border-blue-500" />',
        },
      ],
      plugins: [baseUIPlugin()],
    };

    const css = await generateCSS(config);

    expect(css).toContain('[data-touched]');
    expect(css).toContain('[data-dirty]');
  });

  it('should generate ui-pressed variant', async () => {
    const config = {
      content: [{ raw: '<button class="ui-pressed:scale-95"></button>' }],
      plugins: [baseUIPlugin()],
    };

    const css = await generateCSS(config);

    expect(css).toContain('[data-pressed]');
    expect(css).toContain('scale-95');
  });

  it('should generate ui-dragging variant', async () => {
    const config = {
      content: [{ raw: '<div class="ui-dragging:cursor-grabbing"></div>' }],
      plugins: [baseUIPlugin()],
    };

    const css = await generateCSS(config);

    expect(css).toContain('[data-dragging]');
    expect(css).toContain('cursor-grabbing');
  });

  it('should generate ui-panel-open variant', async () => {
    const config = {
      content: [{ raw: '<button class="ui-panel-open:rotate-180"></button>' }],
      plugins: [baseUIPlugin()],
    };

    const css = await generateCSS(config);

    expect(css).toContain('[data-panel-open]');
    expect(css).toContain('rotate-180');
  });
});
