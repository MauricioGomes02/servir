export const BffProblemCodes = {
  ResourceNotFound: 'bff.resource.not_found',
  UpstreamUnavailable: 'bff.upstream.unavailable',
} as const;

export type BffProblemCode = (typeof BffProblemCodes)[keyof typeof BffProblemCodes];
