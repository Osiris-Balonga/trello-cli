import type { ProviderType, TaskProvider } from './provider.js';

export interface ProviderConfig {
  type: ProviderType;
}

export type ProviderFactory = () => TaskProvider;

class ProviderRegistryClass {
  private factories = new Map<ProviderType, ProviderFactory>();

  register(type: ProviderType, factory: ProviderFactory): void {
    this.factories.set(type, factory);
  }

  create(type: ProviderType): TaskProvider {
    const factory = this.factories.get(type);
    if (!factory) {
      const available = this.list().join(', ');
      throw new Error(
        `Unknown provider: ${type}. Available providers: ${available}`
      );
    }
    return factory();
  }

  has(type: ProviderType): boolean {
    return this.factories.has(type);
  }

  list(): ProviderType[] {
    return Array.from(this.factories.keys());
  }
}

export const ProviderRegistry = new ProviderRegistryClass();
