export async function connectRedis(): Promise<void> {
  const url = process.env["REDIS_URL"];
  if (!url) {
    console.log("REDIS_URL not set — running without Redis (in-memory cache only)");
    return;
  }
  // To enable Redis, install ioredis: npm install ioredis
  // Then replace this stub with: const client = new Redis(url); await client.ping();
  console.log("Redis connection stub — configure ioredis to enable Redis caching");
}
