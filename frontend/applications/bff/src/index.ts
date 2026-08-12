import { startService } from './service.js';

try {
  await startService();
} catch (error) {
  console.error('frontend bff startup failed', error);
  process.exitCode = 1;
}
