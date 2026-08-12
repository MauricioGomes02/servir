import { createApplication } from './create-application.js';
import { readBffConfig } from './config.js';

export async function startService(): Promise<void> {
  const config = readBffConfig(process.env);
  const app = await createApplication(config);
  await app.listen({ host: config.host, port: config.port });

  let stopping: Promise<void> | undefined;
  const stop = (): Promise<void> => (stopping ??= app.close());
  const stopOnSignal = (): void => {
    void stop().catch((error: unknown) => {
      app.log.error({ err: error }, 'frontend bff shutdown failed');
      process.exitCode = 1;
    });
  };
  process.once('SIGINT', stopOnSignal);
  process.once('SIGTERM', stopOnSignal);
}
