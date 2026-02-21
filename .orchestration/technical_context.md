# Technical Context & Architectural Decisions

## Overview

This document serves as the shared memory for the current development session. It captures key architectural decisions, context, and cross-cutting concerns that impact multiple intents.

## Recent Decisions

### 1. Subscription Management Architecture (2026-02-21)

**Context:** We are introducing Stripe integration for subscription handling.
**Decision:** Implement a webhook-first approach for subscription updates to ensure data consistency with Stripe.
**Implications:**

- Webhook endpoints must be idempotent.
- User status updates are event-driven, not synchronous with API calls.

### 2. Authentication Refactor (2026-02-21)

**Context:** A race condition was identified in session token validation.
**Decision:** Switch from `checkToken()` to `validateSession()` with a strict timeout.
**Status:** Completed in Intent `auth-fix-001`.

## Cross-Cutting Concerns

### Error Handling

- All webhook handlers must wrap logic in a standardized `try/catch` block that logs to `TraceLogger`.
- Unexpected errors should return `200 OK` to Stripe (to prevent retries on bad logic) but alert the internal error tracking system.

### Type Safety

- All external payloads (Stripe events) must be validated with Zod schemas before processing.
- Types are centralized in `src/shared/types/billing.ts`.
