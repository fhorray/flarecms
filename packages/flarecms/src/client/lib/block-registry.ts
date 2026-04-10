import React from 'react';

/**
 * Registry for custom plugin blocks.
 * 
 * Plugins can register React components here to be rendered by the 
 * host application when the backend returns a 'custom' block.
 */
type CustomBlockComponent = React.ComponentType<any>;

const registry = new Map<string, CustomBlockComponent>();

/**
 * Registers a new React component as a custom block type.
 * 
 * @param name - Unique identifier for the custom block
 * @param component - React component to render
 */
export function registerPluginBlock(name: string, component: CustomBlockComponent) {
  if (registry.has(name)) {
    console.warn(`[FlareCMS] Block type "${name}" is already registered. Overwriting.`);
  }
  registry.set(name, component);
}

/**
 * Retrieves a registered custom block component.
 */
export function getPluginBlock(name: string): CustomBlockComponent | undefined {
  return registry.get(name);
}

/**
 * Checks if a custom block type is registered.
 */
export function hasPluginBlock(name: string): boolean {
  return registry.has(name);
}
