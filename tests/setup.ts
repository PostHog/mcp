import { config } from 'dotenv';
import { resolve } from 'node:path';

// Load .env.test file
config({ path: resolve(process.cwd(), '.env.test') });