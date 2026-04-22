const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  TEST_DATABASE_URL: z.string().url().optional(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5173'),
  LOG_LEVEL: z.string().default('info'),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
  GLOBAL_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  GLOBAL_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(500),
  SEED_PASSWORD: z.string().min(8).default('Password123!'),
}).refine((data) => data.JWT_ACCESS_SECRET !== data.JWT_REFRESH_SECRET, {
  message: 'JWT access and refresh secrets must be different',
  path: ['JWT_REFRESH_SECRET'],
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const message = parsed.error.errors.map((error) => `${error.path.join('.')}: ${error.message}`).join('; ');
  throw new Error(`Invalid environment configuration: ${message}`);
}

const env = parsed.data;

module.exports = {
  ...env,
  CORS_ORIGINS: env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean),
};
