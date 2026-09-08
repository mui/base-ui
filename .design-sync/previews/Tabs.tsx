import { Tabs } from '@base-ui/react';
import './Tabs.css';

export const Basic = () => (
  <Tabs.Root className="Root" defaultValue="overview">
    <Tabs.List className="List">
      <Tabs.Tab className="Tab" value="overview">
        Overview
      </Tabs.Tab>
      <Tabs.Tab className="Tab" value="projects">
        Projects
      </Tabs.Tab>
      <Tabs.Tab className="Tab" value="account">
        Account
      </Tabs.Tab>
      <Tabs.Indicator className="Indicator" />
    </Tabs.List>
    <div className="PanelViewport">
      <Tabs.Panel className="Panel" value="overview">
        <p className="Paragraph">Workspace stats and activity.</p>
      </Tabs.Panel>
      <Tabs.Panel className="Panel" value="projects">
        <p className="Paragraph">Milestones and deadlines.</p>
      </Tabs.Panel>
      <Tabs.Panel className="Panel" value="account">
        <p className="Paragraph">Profile and preferences.</p>
      </Tabs.Panel>
    </div>
  </Tabs.Root>
);

export const ActiveProjects = () => (
  <Tabs.Root className="Root" defaultValue="projects">
    <Tabs.List className="List">
      <Tabs.Tab className="Tab" value="overview">
        Overview
      </Tabs.Tab>
      <Tabs.Tab className="Tab" value="projects">
        Projects
      </Tabs.Tab>
      <Tabs.Tab className="Tab" value="account">
        Account
      </Tabs.Tab>
      <Tabs.Indicator className="Indicator" />
    </Tabs.List>
    <div className="PanelViewport">
      <Tabs.Panel className="Panel" value="overview">
        <p className="Paragraph">Workspace stats and activity.</p>
      </Tabs.Panel>
      <Tabs.Panel className="Panel" value="projects">
        <p className="Paragraph">Milestones and deadlines.</p>
      </Tabs.Panel>
      <Tabs.Panel className="Panel" value="account">
        <p className="Paragraph">Profile and preferences.</p>
      </Tabs.Panel>
    </div>
  </Tabs.Root>
);
