import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

// Create a new ratelimiter that allows 5 requests per 1 minute
export const rateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit",
});

// Helper function to get client IP from NextRequest
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  // Fallback for development
  return "127.0.0.1";
}

// Rate limiting middleware function
export async function checkRateLimitOrThrow(
  request: NextRequest
): Promise<NextResponse | null> {
  const ip = getClientIP(request);
  const { success, limit, reset, remaining } = await rateLimiter.limit(ip);

  if (!success) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Please try again later.",
        retryAfter: new Date(reset).toISOString(),
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": new Date(reset).toISOString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null;
}
