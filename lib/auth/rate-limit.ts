import { headers } from "next/headers";

type RateLimitConfig = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5000;

async function readRequesterId() {
  try {
    const h = await headers();
    const forwardedFor = h.get("x-forwarded-for");
    return (
      forwardedFor?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      h.get("cf-connecting-ip") ||
      h.get("user-agent") ||
      "anonymous"
    );
  } catch {
    return "anonymous";
  }
}

function pruneExpiredBuckets(now: number) {
  if (buckets.size < MAX_BUCKETS) return;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
    if (buckets.size < MAX_BUCKETS) return;
  }
}

export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const now = Date.now();
  pruneExpiredBuckets(now);

  const requesterId = await readRequesterId();
  const bucketKey = `${config.key}:${requesterId}`;
  const current = buckets.get(bucketKey);

  if (!current || current.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= config.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
