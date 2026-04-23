import { logger } from './logger';
import { startPlaceholderWorker } from './workers/placeholder';

async function main() {
  logger.info('worker booting');

  const workers = [startPlaceholderWorker()];

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'shutting down');
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  logger.info({ workerCount: workers.length }, 'worker ready');
}

main().catch((err: unknown) => {
  logger.fatal({ err }, 'worker failed to start');
  process.exit(1);
});
