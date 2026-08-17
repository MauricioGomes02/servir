import { createApplication } from './create-application.js';
import { readBffConfig } from './config.js';
import { AuthenticationCookieCodec } from './authentication/authentication-cookie-codec.js';
import { GoogleOidcProvider } from './authentication/google-oidc-provider.js';

export async function startService(): Promise<void> {
  const config = readBffConfig(process.env);
  const googleAuthentication =
    config.authentication === undefined && config.googleOidc === undefined
      ? undefined
      : config.authentication !== undefined && config.googleOidc !== undefined
        ? {
            cookieCodec: new AuthenticationCookieCodec({
              encryptionKey: config.authentication.cookieEncryptionKey,
              issuer: config.authentication.issuer,
              loginTransactionTtlSeconds: config.authentication.loginTransactionTtlSeconds,
            }),
            oidcProvider: await GoogleOidcProvider.create(config.googleOidc),
          }
        : (() => {
            throw new Error('Google login requires authentication signing and Google OIDC configuration');
          })();
  const app = await createApplication(config, {
    ...(googleAuthentication === undefined ? {} : { googleAuthentication }),
  });
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
