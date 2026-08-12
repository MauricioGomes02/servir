import { createApplication } from './create-application.js';
import { readBffConfig } from './config.js';

const config = readBffConfig(process.env);
const app = await createApplication(config);
await app.listen({ host: config.host, port: config.port });
