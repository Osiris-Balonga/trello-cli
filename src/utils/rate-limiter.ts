import pLimit from 'p-limit';

const REQUESTS_PER_SECOND = 10;

export const apiLimiter = pLimit(REQUESTS_PER_SECOND);

export async function withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  return apiLimiter(fn);
}
