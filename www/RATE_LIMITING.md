# Rate Limiting Setup

This application uses rate limiting to prevent abuse of the API endpoints. The rate limiting is implemented using `@upstash/ratelimit` with Redis as the backend.

## Current Configuration

- **Limit**: 5 requests per 1 minute per IP address
- **Window**: Sliding window (1 minute)
- **Fallback**: In-memory rate limiter for development

## Environment Variables

For production, you need to set up Upstash Redis and add these environment variables to your `.env` file:

```env
UPSTASH_REDIS_REST_URL="your-upstash-redis-url-here"
UPSTASH_REDIS_REST_TOKEN="your-upstash-redis-token-here"
```

## Getting Upstash Redis

1. Go to [upstash.com](https://upstash.com)
2. Create a free account
3. Create a new Redis database
4. Copy the REST URL and REST Token
5. Add them to your environment variables

## Development

For local development, the rate limiter will automatically fall back to an in-memory store if Redis is not available. This means:

- Rate limiting will work locally without setting up Redis
- The limits are per-server instance (not shared across multiple dev servers)
- Data is lost when the server restarts

## Production

In production, make sure to:

1. Set up Upstash Redis environment variables
2. The rate limiting will be shared across all server instances
3. Rate limit data persists across server restarts

## API Response Headers

When rate limiting is active, the API returns these headers:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: When the rate limit resets (ISO timestamp)
- `Retry-After`: Seconds to wait before retrying

## Error Response

When rate limit is exceeded, the API returns:

```json
{
  "error": "Rate limit exceeded. Please try again later.",
  "retryAfter": "2024-01-01T12:00:00.000Z"
}
```

With HTTP status code `429 Too Many Requests`.
