import type { MessageCatalog } from '@/shared/presentation';

export const HttpProblemMessageCodes = {
  InternalErrorTitle: 'http.problem.internal_error.title',
  InvalidRequestTitle: 'http.problem.invalid_request.title',
  ValidationErrorTitle: 'http.problem.validation_error.title',
} as const;

export const httpProblemMessageCatalog: MessageCatalog = Object.freeze({
  'pt-BR': Object.freeze({
    [HttpProblemMessageCodes.InternalErrorTitle]: 'Não foi possível processar a solicitação.',
    [HttpProblemMessageCodes.InvalidRequestTitle]: 'A requisição é inválida.',
    [HttpProblemMessageCodes.ValidationErrorTitle]: 'A requisição contém dados inválidos.',
  }),
  'en-US': Object.freeze({
    [HttpProblemMessageCodes.InternalErrorTitle]: 'The request could not be processed.',
    [HttpProblemMessageCodes.InvalidRequestTitle]: 'The request is invalid.',
    [HttpProblemMessageCodes.ValidationErrorTitle]: 'The request contains invalid data.',
  }),
});
