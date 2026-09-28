import { ToolDefinition } from '@fileconverter/shared-types';
export declare const ALL_TOOLS: ToolDefinition[];
export declare const TOOL_SLUG_ALIASES: Record<string, string>;
export declare function getToolById(id: string): ToolDefinition | undefined;
export declare function getToolBySlug(slug: string): ToolDefinition | undefined;
export declare function getAllIndexableSlugs(): string[];
