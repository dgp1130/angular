export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: any;
  execute: (input: any) => any;
}

export interface ToolGroup {
  name: string;
  description: string;
  tools: ToolDefinition[];
}

export interface DevtoolsToolDiscoveryEvent extends CustomEvent<null> {
  respondWith(response: ToolGroup | PromiseLike<ToolGroup>): void;
}

declare global {
  interface WindowEventMap {
    'devtoolstooldiscovery': DevtoolsToolDiscoveryEvent;
  }
}
