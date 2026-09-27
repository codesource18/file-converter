import { ToolDefinition } from '@fileconverter/shared-types';
export declare const ALL_TOOLS: ToolDefinition[];
export declare function getToolById(id: string): ToolDefinition | undefined;
export declare function getToolBySlug(slug: string): ToolDefinition | undefined;
