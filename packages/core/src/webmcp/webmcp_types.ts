/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

export interface WebMcpToolResult {
  content: Array<{
    type: string;
    text: string;
  }>;
}

export interface WebMcpTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
  annotations?: Record<string, string>;
  execute: (args: any) => WebMcpToolResult | Promise<WebMcpToolResult>;
}

export interface WebMcpModelContext {
  registerTool(tool: WebMcpTool): void;
  unregisterTool(name: string): void;
  provideContext(context: {tools: WebMcpTool[]}): void;
  clearContext(): void;
}

export interface WebMcpToolEvent extends Event {
  readonly toolName: string;
}

declare global {
  interface Navigator {
    readonly modelContext?: WebMcpModelContext;
  }

  interface SubmitEvent {
    readonly agentInvoked?: boolean;
    respondWith?(response: Promise<any>): void;
  }

  interface WindowEventMap {
    'toolactivated': WebMcpToolEvent;
    'toolcancel': WebMcpToolEvent;
  }
}
