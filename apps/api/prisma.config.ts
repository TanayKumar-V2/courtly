import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from repository root .env and local apps/api/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  schema: path.resolve(__dirname, 'prisma/schema.prisma'),
  datasource: {
    // DIRECT_URL is used for direct migration and schema operations against Neon
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || '',
  },
});
