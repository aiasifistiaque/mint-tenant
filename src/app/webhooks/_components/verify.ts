/**
 * How a receiver checks a webhook came from the project (backend
 * functions/webhooks.function.ts signs `<x-mint-timestamp>.<raw body>` with
 * HMAC-SHA256). Shown on the Webhooks page and in user-docs/public-api#verify-signatures.
 */
export const VERIFY_NODE = `import crypto from 'crypto';

// In your handler, with the body exactly as it arrived (not re-serialised):
function fromMint(rawBody, headers, secret) {
  const timestamp = headers['x-mint-timestamp'];
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(\`\${timestamp}.\${rawBody}\`)
    .digest('hex');
  const given = String(headers['x-mint-signature'] || '');
  const fresh = Math.abs(Date.now() / 1000 - Number(timestamp)) < 300; // 5 minutes
  return fresh && given.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}`;

/** What each delivery's body holds. */
export const PAYLOAD_EXAMPLE = `{
  "delivery": "6f1c…",          // the same on every retry — skip ones you've seen
  "event": "create",            // create | update | delete | test
  "route": "orders",
  "project": { "id": "…", "slug": "acme-shop", "name": "Shop" },
  "source": "api",              // api | panel | test
  "at": "2026-10-04T09:30:00.000Z",
  "record": { "_id": "…", "createdAt": "…", "updatedAt": "…", "total": 42 }
}`;
