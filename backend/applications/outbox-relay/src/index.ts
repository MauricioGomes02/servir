import { startOpenTelemetry } from '@/infrastructure';
import {
  createLogRecord,
  LogLevels,
} from '@servir/application-foundation';
import { JsonStdoutLogger } from '@servir/node-observability';

function reportStartupFailure(error: unknown): void {
  const code = typeof error === 'object'
    && error !== null
    && 'code' in error
    && typeof error.code === 'string'
    ? error.code
    : 'outbox.relay.start_failed';
  new JsonStdoutLogger().log(createLogRecord({
    occurredAt: new Date().toISOString(),
    level: LogLevels.Error,
    eventName: 'outbox.relay.start.failed',
    attributes: { 'error.code': code },
  }));
}

async function main(): Promise<void> {
  let telemetry: ReturnType<typeof startOpenTelemetry>;

  try {
    telemetry = startOpenTelemetry();
  } catch (error) {
    reportStartupFailure(error);
    process.exitCode = 1;
    return;
  }

  try {
    const { startRelayService } = await import('./service.js');
    await startRelayService(telemetry);
  } catch {
    process.exitCode = 1;
  }
}

void main().catch(() => {
  process.exitCode = 1;
});
