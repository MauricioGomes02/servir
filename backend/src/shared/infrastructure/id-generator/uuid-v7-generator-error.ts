export const UuidV7GeneratorErrorCodes = {
  SourceFailed: 'id_generator.uuid_v7.source_failed',
  IdFactoryFailed: 'id_generator.uuid_v7.id_factory_failed',
  GeneratedIdRejected: 'id_generator.uuid_v7.generated_id_rejected',
} as const;

export type UuidV7GeneratorErrorCode =
  (typeof UuidV7GeneratorErrorCodes)[keyof typeof UuidV7GeneratorErrorCodes];

export class UuidV7GeneratorError extends Error {
  constructor(
    readonly code: UuidV7GeneratorErrorCode,
    cause: unknown,
  ) {
    super('UUID v7 generator failed to produce a valid typed ID', {
      cause,
    });

    this.name = 'UuidV7GeneratorError';
  }
}
