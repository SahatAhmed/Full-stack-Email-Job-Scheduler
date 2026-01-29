import { createClient } from 'redis';
import { config } from '../config';

const redisClient = createClient({
  url: config.redisUrl,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

export async function initRedis() {
  await redisClient.connect();
  return redisClient;
}

export function getRedisClient() {
  return redisClient;
}
