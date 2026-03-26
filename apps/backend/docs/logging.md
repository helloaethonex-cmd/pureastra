# Backend Logging Guide

## Purpose
This backend uses structured logging with `pino` and `pino-http` for production-safe, searchable logs.

## At A Glance
- Use `req.log` in request/response code (controllers, request middleware).
- Use `logger` from `src/lib/logger.ts` in non-request code (workers, server boot, mailer, seed scripts).
- Never use `console.log` / `console.error`.
- Always log errors with `{ err }` as structured metadata.
- Keep secrets out of logs (redaction is configured in logger).

## Where Logging Lives
- Base logger: `src/lib/logger.ts`
- HTTP request logger middleware: `src/middlewares/request-logger.ts`
- Global error logging: `src/middlewares/error-handler.ts`

## Standard Patterns

### Request Path (Controller / Middleware)
```ts
req.log.info({ orderId }, "Create order request received");

req.log.error({ err, orderId }, "Create order failed");
```

### Background / Worker / Library
```ts
import { logger } from "../lib/logger";

logger.info({ queue: "email", jobId }, "Email job completed");
logger.error({ err, jobId }, "Email job failed");
```

### Server Lifecycle
```ts
logger.info({ port, env }, "HTTP server started");
logger.error({ err }, "Unhandled promise rejection");
```

## Log Level Rules
- `debug`: local troubleshooting details.
- `info`: expected successful flow milestones.
- `warn`: recoverable issues and 4xx-like business problems.
- `error`: failed operations, exceptions, 5xx behavior.

## Error Logging Rules
- Always include `err` object, not only `err.message`.
- Add minimal useful context (`orderId`, `userId`, `jobId`, `queue`, `requestId`).
- Do not log raw tokens, passwords, or webhook secrets.

## Request ID Rules
- `x-request-id` is accepted if provided by caller.
- If missing, server generates one.
- Response includes `x-request-id`.
- Include request ID in all API error responses.

## Redaction Rules
Redaction is configured in `src/lib/logger.ts` and must include auth/payment sensitive fields.
When adding new sensitive request fields, update redaction paths before shipping.

## Do / Don’t
- Do: `req.log.error({ err, userId }, "Payment confirmation failed")`
- Do: `logger.info({ policy }, "Redis maxmemory-policy validated for BullMQ")`
- Don’t: `console.error(err)`
- Don’t: `logger.error("Payment failed: " + err.message)`

## Quick PR Checklist
- No `console.*` usage.
- Request handlers use `req.log`.
- Workers/libs use base `logger`.
- Errors logged with `{ err }`.
- No secret leakage in log metadata.

## References
- Pino API and best practices: https://github.com/pinojs/pino/blob/main/docs/api.md
- Pino redaction: https://github.com/pinojs/pino/blob/main/docs/redaction.md
- Pino HTTP patterns: https://github.com/pinojs/pino-http/blob/master/README.md
