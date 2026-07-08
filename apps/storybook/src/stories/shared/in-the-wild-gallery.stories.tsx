import type { Meta, StoryObj } from '@storybook/react-vite';
import { WildCards, WildCard } from './InTheWild';
/* eslint-disable import/no-relative-packages */
import img_9ui_dev_page from '../../../../../research/d-real-world-usage/_captures/9ui-dev-hl.png';
import img_9ui_dev_hi from '../../../../../research/d-real-world-usage/_captures/9ui-dev-hl-highlight.png';
import img_graphql_org_page from '../../../../../research/d-real-world-usage/_captures/graphql-org-hl.png';
import img_graphql_org_hi from '../../../../../research/d-real-world-usage/_captures/graphql-org-hl-highlight.png';
import img_kumo_ui_com_page from '../../../../../research/d-real-world-usage/_captures/kumo-ui-com-hl.png';
import img_kumo_ui_com_hi from '../../../../../research/d-real-world-usage/_captures/kumo-ui-com-hl-highlight.png';
import img_mastra_ai_page from '../../../../../research/d-real-world-usage/_captures/mastra-ai-hl.png';
import img_mastra_ai_hi from '../../../../../research/d-real-world-usage/_captures/mastra-ai-hl-highlight.png';
import img_nextjs_org_page from '../../../../../research/d-real-world-usage/_captures/nextjs-org-hl.png';
import img_nextjs_org_hi from '../../../../../research/d-real-world-usage/_captures/nextjs-org-hl-highlight.png';
import img_posthog_com_page from '../../../../../research/d-real-world-usage/_captures/posthog-com-hl.png';
import img_posthog_com_hi from '../../../../../research/d-real-world-usage/_captures/posthog-com-hl-highlight.png';
import img_reui_io_page from '../../../../../research/d-real-world-usage/_captures/reui-io-hl.png';
import img_reui_io_hi from '../../../../../research/d-real-world-usage/_captures/reui-io-hl-highlight.png';
import img_wordpress_org_gutenberg_page from '../../../../../research/d-real-world-usage/_captures/wordpress-org-gutenberg-hl.png';
import img_wordpress_org_gutenberg_hi from '../../../../../research/d-real-world-usage/_captures/wordpress-org-gutenberg-hl-highlight.png';
import img_zweien_github_io_docx_template_system_page from '../../../../../research/d-real-world-usage/_captures/zweien-github-io-docx-template-system-hl.png';
import img_zweien_github_io_docx_template_system_hi from '../../../../../research/d-real-world-usage/_captures/zweien-github-io-docx-template-system-hl-highlight.png';
/* eslint-enable import/no-relative-packages */

/**
 * Gallery of every real component highlight captured by
 * research/d-real-world-usage/_captures/capture-highlight.mjs (see the
 * `Research/D — Real-world usage/Screenshot capture` page). Each card opens the shared
 * viewer on the Component view; toggle to Full page to compare, and copy the locator.
 * Internal harness — tagged `research` so it stays out of the sidebar by default.
 */
const meta = {
  title: 'Utilities/InTheWild highlights (internal)',
  tags: ['research'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every captured component highlight. */
export const Gallery: Story = {
  render: () => (
    <WildCards>
      <WildCard
        repo="9ui.dev"
        title="9ui"
        href="https://www.9ui.dev"
        live="https://www.9ui.dev"
        pageUrl="https://www.9ui.dev"
        route="/"
        selector={'[role="tablist"]'}
        image={img_9ui_dev_page}
        highlightImage={img_9ui_dev_hi}
      >
        Tabs spotted on 9ui.dev.
      </WildCard>
      <WildCard
        repo="graphql.org"
        title="graphql.org"
        href="https://graphql.org"
        live="https://graphql.org"
        pageUrl="https://graphql.org"
        route="/"
        selector={'[role="combobox"]'}
        image={img_graphql_org_page}
        highlightImage={img_graphql_org_hi}
      >
        Combobox spotted on graphql.org.
      </WildCard>
      <WildCard
        repo="kumo-ui.com"
        title="Cloudflare Kumo"
        href="https://kumo-ui.com"
        live="https://kumo-ui.com"
        pageUrl="https://kumo-ui.com"
        route="/"
        selector={'[role="combobox"]'}
        image={img_kumo_ui_com_page}
        highlightImage={img_kumo_ui_com_hi}
      >
        Combobox spotted on kumo-ui.com.
      </WildCard>
      <WildCard
        repo="mastra.ai"
        title="Mastra"
        href="https://mastra.ai"
        live="https://mastra.ai"
        pageUrl="https://mastra.ai"
        route="/"
        selector={'[role="tablist"]'}
        image={img_mastra_ai_page}
        highlightImage={img_mastra_ai_hi}
      >
        Tabs spotted on mastra.ai.
      </WildCard>
      <WildCard
        repo="nextjs.org"
        title="Next.js"
        href="https://nextjs.org"
        live="https://nextjs.org"
        pageUrl="https://nextjs.org"
        route="/"
        selector={'[role="radiogroup"]'}
        image={img_nextjs_org_page}
        highlightImage={img_nextjs_org_hi}
      >
        Radio Group spotted on nextjs.org.
      </WildCard>
      <WildCard
        repo="posthog.com"
        title="PostHog"
        href="https://posthog.com"
        live="https://posthog.com"
        pageUrl="https://posthog.com"
        route="/"
        selector={'[role="menubar"]'}
        image={img_posthog_com_page}
        highlightImage={img_posthog_com_hi}
      >
        Menubar spotted on posthog.com.
      </WildCard>
      <WildCard
        repo="reui.io"
        title="ReUI"
        href="https://reui.io"
        live="https://reui.io"
        pageUrl="https://reui.io"
        route="/"
        selector={'[role="combobox"]'}
        image={img_reui_io_page}
        highlightImage={img_reui_io_hi}
      >
        Combobox spotted on reui.io.
      </WildCard>
      <WildCard
        repo="wordpress.org"
        title="WordPress Gutenberg"
        href="https://wordpress.org/gutenberg/"
        live="https://wordpress.org/gutenberg/"
        pageUrl="https://wordpress.org/gutenberg/"
        route="/gutenberg/"
        selector={'[role="tablist"]'}
        image={img_wordpress_org_gutenberg_page}
        highlightImage={img_wordpress_org_gutenberg_hi}
      >
        Tabs spotted on wordpress.org.
      </WildCard>
      <WildCard
        repo="zweien.github.io"
        title="docx-template-system"
        href="https://zweien.github.io/docx-template-system/"
        live="https://zweien.github.io/docx-template-system/"
        pageUrl="https://zweien.github.io/docx-template-system/"
        route="/docx-template-system/"
        selector={'[role="combobox"]'}
        image={img_zweien_github_io_docx_template_system_page}
        highlightImage={img_zweien_github_io_docx_template_system_hi}
      >
        Combobox spotted on zweien.github.io.
      </WildCard>
    </WildCards>
  ),
};
