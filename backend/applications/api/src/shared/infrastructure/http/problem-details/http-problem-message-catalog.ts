import type { MessageCatalog } from '@/shared/presentation';

export const HttpProblemMessageCodes = {
  AuthenticationRequiredTitle: 'http.problem.authentication_required.title',
  InternalErrorTitle: 'http.problem.internal_error.title',
  InvalidRequestTitle: 'http.problem.invalid_request.title',
  ResourceConflictTitle: 'http.problem.resource_conflict.title',
  ResourceNotFoundTitle: 'http.problem.resource_not_found.title',
  ValidationErrorTitle: 'http.problem.validation_error.title',
} as const;

export const httpProblemMessageCatalog: MessageCatalog = Object.freeze({
  'pt-BR': Object.freeze({
    [HttpProblemMessageCodes.AuthenticationRequiredTitle]: 'Entre na sua conta para continuar.',
    [HttpProblemMessageCodes.ResourceConflictTitle]:
      'A requisição conflita com o estado atual do recurso.',
    [HttpProblemMessageCodes.ResourceNotFoundTitle]: 'O recurso solicitado não foi encontrado.',
    [HttpProblemMessageCodes.InternalErrorTitle]: 'Não foi possível processar a solicitação.',
    [HttpProblemMessageCodes.InvalidRequestTitle]: 'A requisição é inválida.',
    [HttpProblemMessageCodes.ValidationErrorTitle]: 'A requisição contém dados inválidos.',
  }),
  'en-US': Object.freeze({
    [HttpProblemMessageCodes.AuthenticationRequiredTitle]: 'Sign in to continue.',
    [HttpProblemMessageCodes.ResourceConflictTitle]:
      'The request conflicts with the current resource state.',
    [HttpProblemMessageCodes.ResourceNotFoundTitle]: 'The requested resource was not found.',
    [HttpProblemMessageCodes.InternalErrorTitle]: 'The request could not be processed.',
    [HttpProblemMessageCodes.InvalidRequestTitle]: 'The request is invalid.',
    [HttpProblemMessageCodes.ValidationErrorTitle]: 'The request contains invalid data.',
  }),
});
