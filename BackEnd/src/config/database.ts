import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
function buildConnectionString(raw?: string): string | undefined {
  if (!raw) return raw;

  try {
    const parsed = new URL(raw);
    const sslMode = parsed.searchParams.get('sslmode');

    // Avoid pg-connection-string warning for sslmode=require semantics.
    if (sslMode === 'require' && !parsed.searchParams.has('uselibpqcompat')) {
      parsed.searchParams.set('uselibpqcompat', 'true');
    }

    return parsed.toString();
  } catch {
    return raw;
  }
}

const isRemoteEnv =
  process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';
  // console.log("string",process.env.DATABASE_URL)
const pool = new Pool({
  connectionString: buildConnectionString(process.env.DATABASE_URL),
  ssl: isRemoteEnv ? { rejectUnauthorized: false } : false,
  // Keep pool small/stable for remote DBs and avoid bursty reconnect storms.
  max: isRemoteEnv ? 10 : 20,
  idleTimeoutMillis: isRemoteEnv ? 15000 : 30000,
  // 2s is too aggressive for remote Neon under intermittent network conditions.
  connectionTimeoutMillis: isRemoteEnv ? 10000 : 2000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Add connection error handling
pool.on('error', (err) => {
  console.error('Unexpected database error:', err,);
});

export default pool;
