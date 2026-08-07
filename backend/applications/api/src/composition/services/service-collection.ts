import { asFunction, asValue } from 'awilix';
import type { ApplicationContainer, ApplicationCradle } from '../container';

export class ServiceCollection {
  constructor(private readonly container: ApplicationContainer) {}

  addSingleton<TKey extends keyof ApplicationCradle>(
    name: TKey,
    factory: (cradle: ApplicationCradle) => ApplicationCradle[TKey],
  ): void {
    this.container.register(name, asFunction(factory).singleton());
  }

  addTransient<TKey extends keyof ApplicationCradle>(
    name: TKey,
    factory: (cradle: ApplicationCradle) => ApplicationCradle[TKey],
  ): void {
    this.container.register(name, asFunction(factory).transient());
  }

  addScoped<TKey extends keyof ApplicationCradle>(
    name: TKey,
    factory: (cradle: ApplicationCradle) => ApplicationCradle[TKey],
  ): void {
    this.container.register(name, asFunction(factory).scoped());
  }

  addValue<TKey extends keyof ApplicationCradle>(name: TKey, value: ApplicationCradle[TKey]): void {
    this.container.register(name, asValue(value));
  }
}
