export class IdSequenceExhaustedError extends Error {
  readonly code = 'id_generator.sequence.exhausted';

  constructor() {
    super('The deterministic ID sequence has been exhausted');
    this.name = 'IdSequenceExhaustedError';
  }
}
