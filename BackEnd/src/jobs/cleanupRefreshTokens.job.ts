import cron from 'node-cron';
import { deleteExpiredRefreshTokens } from '../services/token.service';

export function startCleanupRefreshTokensJob() {
  return cron.schedule('0 3 * * *', async () => {
    try {
      const deleted = await deleteExpiredRefreshTokens();
      console.log(`[cron] refresh_tokens cleanup: ${deleted} rows deleted`);
    } catch (error) {
      console.error('[cron] refresh_tokens cleanup failed:', error);
    }
  });
}