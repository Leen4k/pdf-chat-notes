import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

export const getCachedChats = async (cacheKey: string) => {
  try {
    console.log("🔍 Checking cache for:", cacheKey);
    const cached = await redis.get(cacheKey);

    if (cached) {
      console.log("✅ Cache hit!");
      return cached;
    }

    console.log("❌ Cache miss");
    return null;
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
};

export const setCachedChats = async (cacheKey: string, data: any) => {
  try {
    console.log("💾 Caching data for:", cacheKey);
    await redis.set(cacheKey, data, {
      ex: 60 * 5, // Cache for 5 minutes
    });
    console.log("✅ Successfully cached data");
  } catch (error) {
    console.error("Redis set error:", error);
  }
};

export default redis;
