import { Worker } from 'bullmq';
import { getRedis } from '../redis';
import { logger } from '../logger';
import { QUEUES } from '../queues';

/**
 * Placeholder worker. Phase 1 only. In later phases each queue gets its own
 * dedicated worker with strongly typed job data.
 */
export function startPlaceholderWorker() {
  const worker = new Worker(
    QUEUES.TRANSCRIBE,
    async (job) => {
      logger.info({ jobId: job.id, queue: QUEUES.TRANSCRIBE }, 'placeholder job received');
      return { ok: true, note: 'Phase 1 placeholder — real handler comes in Phase 2' };
    },
    { connection: getRedis() },
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'job failed');
  });

  return worker;
}
