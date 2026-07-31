import { startOpenTelemetry } from '@/infrastructure';

function reportStartupFailure(error: unknown): void {
  try {
    const code = typeof error === 'object'
      && error !== null
      && 'code' in error
      && typeof error.code === 'string'
      ? error.code
      : 'outbox.relay.start_failed';
    process.stdout.write(`${JSON.stringify({
      timestamp: new Date().toISOString(),
      severity: 'error',
      name: 'outbox.relay.start.failed',
      attributes: { 'error.code': code },
    })}\n`);
  } catch {
    // Process exit must not depend on the logging destination.
  }
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
