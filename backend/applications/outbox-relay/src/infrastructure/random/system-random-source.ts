import type { RandomSource } from '@/application';

export class SystemRandomSource implements RandomSource {
  constructor(private readonly source: () => number = Math.random) {}

  next(): number {
    return this.source();
  }
}
