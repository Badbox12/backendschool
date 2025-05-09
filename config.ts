// config.ts
import { z } from 'zod';

const envSchema = z.object({
  FRONTEND_URL: z.string().url(),
  PASS_NODEMAIL: z.string().min(16),
  JWT_SECRET: z.string().min(32)
});

export const env = envSchema.parse(process.env);