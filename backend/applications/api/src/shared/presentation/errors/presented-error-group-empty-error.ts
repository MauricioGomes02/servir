export const PresentedErrorGroupEmptyErrorCode =
  'presentation.error_group.empty_collection' as const;

export class PresentedErrorGroupEmptyError extends Error {
  readonly code = PresentedErrorGroupEmptyErrorCode;

  constructor() {
    super('Presented error group cannot be empty');
    this.name = 'PresentedErrorGroupEmptyError';
  }
}
