import { SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
// Load appropriate .env file based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
const envFile =
  nodeEnv === 'production'
    ? '.env.production'
    : nodeEnv === 'staging'
      ? '.env.staging'
      : '.env';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// if an env was empty lets fail directly
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// helper function to check the env pattern if not match fail directly
function requireEnvMatchingPattern(
  key: string,
  pattern: RegExp,
  hint: string,
): string {
  const value = requireEnv(key);
  if (!pattern.test(value)) {
    throw new Error(`${key} is invalid: ${hint}`);
  }
  return value;
}

// helper to check if env is longer than minLength
function requireEnvWithMinLength(key: string, minLength: number): string {
  const value = requireEnv(key);
  if (value.length < minLength) {
    throw new Error(`${key} must be at least ${minLength} characters long`);
  }
  return value;
}

// Optional env with default value
function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export const config = {
  // App
  app: {
    port: parseInt(optionalEnv('PORT', '3000')),
    nodeEnv: requireEnv('NODE_ENV'),
    frontendUrl: requireEnv('FRONTEND_URL'),
  },

  // Database
  database: {
    url: requireEnv('DATABASE_URL'),
  },

  // JWT
  jwt: {
    secret: requireEnvWithMinLength('JWT_SECRET', 32),
    accessTokenExpiresIn: requireEnvMatchingPattern(
      'JWT_ACCESS_TOKEN_EXPIRES_IN',
      /^\d+[smhd]$/,
      'must be in format: 60s, 15m, 1h, 7d',
    ),
    refreshTokenExpiresIn: requireEnvMatchingPattern(
      'JWT_REFRESH_TOKEN_EXPIRES_IN',
      /^\d+[smhd]$/,
      'must be in format: 7d, 30d, 90d',
    ),
    issuer: optionalEnv('JWT_ISSUER', 'dealio-api'),
    audience: optionalEnv('JWT_AUDIENCE', 'dealio-platform'),
  },
  //   // Stripe
  //   stripe: {
  //     secretKey: requireEnv('STRIPE_SECRET_KEY'),
  //     // publishableKey: requireEnv('STRIPE_PUBLISHABLE_KEY'),
  //     webhookSecret: requireEnv('STRIPE_WEBHOOK_SECRET'),
  //   },

  //   // Cloudinary
  //   cloudinary: {
  //     cloudName: requireEnv('CLOUDINARY_CLOUD_NAME'),
  //     apiKey: requireEnv('CLOUDINARY_API_KEY'),
  //     apiSecret: requireEnv('CLOUDINARY_API_SECRET'),
  //   },

  // google
  google: {
    clientId: requireEnv('GOOGLE_CLIENT_ID'),
    clientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
    callbackUrl: requireEnv('GOOGLE_CALLBACK_URL'),
  },

  //   cookieMaxAgeMs(): number {
  //     const raw = this.jwt.expiresIn;
  //     const value = parseInt(raw);
  //     const unit = raw.slice(-1);
  //     const multipliers: Record<string, number> = {
  //       s: 1000,
  //       m: 60 * 1000,
  //       h: 60 * 60 * 1000,
  //       d: 24 * 60 * 60 * 1000,
  //     };
  //     return value * (multipliers[unit] ?? 0);
  //   },
  refreshTokenMaxAgeMs(): number {
    const raw = this.jwt.refreshTokenExpiresIn;
    const value = parseInt(raw, 10);
    const unit = raw.slice(-1);
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return value * (multipliers[unit] ?? 0);
  },
};

// // Validate Stripe mode in production only when Stripe payments are enabled.
// if (config.app.nodeEnv === 'production' && config.donation.stripeEnabled === 'true') {
//   const isLiveMode = config.stripe.secretKey.startsWith('sk_live_');

//   if (!isLiveMode) {
//     console.error(
//       '⚠️  CRITICAL ERROR: Using TEST Stripe keys in PRODUCTION environment!',
//     );
//     console.error('⚠️  This means payments will not be processed!');
//     process.exit(1); // Fail fast - don't allow production to start with test keys
//   } else {
//     console.log(
//       '✅ Stripe LIVE mode verified - ready to process real payments',
//     );
//   }
// }

// Log environment info on startup (but not secrets!)
console.log(`🚀 Starting in ${config.app.nodeEnv} mode`);
console.log(`📡 Frontend URL: ${config.app.frontendUrl}`);
console.log(
  `💾 Database: ${config.database.url.split('@')[1]?.split('/')[0] || 'configured'}`,
);

// console.log(
//   `💳 Stripe: ${config.stripe.secretKey.startsWith('sk_live_') ? 'LIVE' : 'TEST'} mode`,
// );
