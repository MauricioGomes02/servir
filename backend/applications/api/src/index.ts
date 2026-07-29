import { startOpenTelemetry } from '@/shared/infrastructure/telemetry';

async function bootstrap(): Promise<void> {
  try {
    const telemetry = startOpenTelemetry();
    const { startService } = await import('./service.js');
    await startService(telemetry);
  } catch (error) {
    const { reportBootstrapFailure } = await import('./service.js');
    reportBootstrapFailure(error);
  }
}

void bootstrap();
