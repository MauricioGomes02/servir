export const WebRuntimeErrorCodes = {
  I18nProviderUnavailable: 'web.i18n.provider.unavailable',
  SessionProviderUnavailable: 'web.authentication.session_provider.unavailable',
} as const;

export type WebRuntimeErrorCode = (typeof WebRuntimeErrorCodes)[keyof typeof WebRuntimeErrorCodes];

export class WebRuntimeError extends Error {
  constructor(
    readonly code: WebRuntimeErrorCode,
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = 'WebRuntimeError';
  }
}
