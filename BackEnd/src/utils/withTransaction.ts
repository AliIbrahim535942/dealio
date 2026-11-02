import { PoolClient } from 'pg';
import pool from '../config/database';

export async function withTransaction<T>(
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  let brokenConnection: Error | undefined;

  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
      brokenConnection = rollbackError as Error;
    }
    throw error;
  } finally {
    client.release(brokenConnection); // a broken client is destroyed, not returned to the pool
  }
}