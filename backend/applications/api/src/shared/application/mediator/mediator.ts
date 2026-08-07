import type { ExecutionContext } from '../context';

declare const messageContract: unique symbol;

export interface MessageToken<TInput, TOutput> {
  readonly name: string;
  readonly traceName: string;
  readonly [messageContract]?: (input: TInput) => TOutput;
}

export type MessageHandler<TInput, TOutput> = (
  input: TInput,
  context: ExecutionContext,
) => Promise<TOutput>;

export interface MessageHandlerObject<TInput, TOutput> {
  handle(input: TInput, context: ExecutionContext): Promise<TOutput>;
}

export type MessageExecution = <TOutput>(
  traceName: string,
  execute: () => Promise<TOutput>,
) => Promise<TOutput>;

export function defineMessage<TInput, TOutput>(
  name: string,
  traceName: string,
): MessageToken<TInput, TOutput> {
  return Object.freeze({ name, traceName });
}

export class DuplicateMessageHandlerError extends Error {
  readonly code = 'mediator.handler.duplicate';
  constructor(messageName: string) {
    super(`A handler is already registered for ${messageName}`);
    this.name = 'DuplicateMessageHandlerError';
  }
}

export class UnregisteredMessageHandlerError extends Error {
  readonly code = 'mediator.handler.unregistered';
  constructor(messageName: string) {
    super(`No handler is registered for ${messageName}`);
    this.name = 'UnregisteredMessageHandlerError';
  }
}

export class Mediator {
  private readonly handlers = new Map<string, MessageHandler<unknown, unknown>>();

  constructor(
    private readonly execute: MessageExecution = async (_traceName, operation) => operation(),
  ) {}

  register<TInput, TOutput>(
    token: MessageToken<TInput, TOutput>,
    handler: MessageHandler<TInput, TOutput>,
  ): void {
    if (this.handlers.has(token.name)) throw new DuplicateMessageHandlerError(token.name);
    this.handlers.set(token.name, handler as MessageHandler<unknown, unknown>);
  }

  registerHandler<TInput, TOutput>(
    token: MessageToken<TInput, TOutput>,
    handler: MessageHandlerObject<TInput, TOutput>,
  ): void {
    this.register(token, handler.handle.bind(handler));
  }

  async send<TInput, TOutput>(
    token: MessageToken<TInput, TOutput>,
    input: TInput,
    context: ExecutionContext,
  ): Promise<TOutput> {
    const handler = this.handlers.get(token.name);
    if (handler === undefined) throw new UnregisteredMessageHandlerError(token.name);
    return this.execute(token.traceName, async () => (await handler(input, context)) as TOutput);
  }
}
