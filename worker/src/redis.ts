import { Redis } from 'ioredis';
import { env } from './env.js';

let _connection: Redis | null = null;

export function getRedis(): Redis {
  if (_connection !== null) {
    return _connection;
  }
  _connection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ.
    enableReadyCheck: true,
  });
  return _connection;
}
