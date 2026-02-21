# Intent Map

This file maps high-level business intents to the physical codebase structure. It is updated dynamically as intents are worked on.

## [DONE] auth-fix-001: Fix session token validation race condition

> **Goal:** Eliminate race condition causing 401 errors on rapid requests.

- **Key Modules:**
    - `src/services/auth/*`: Core authentication logic.
- **Impacted Files:**
    - `src/services/auth/AuthService.ts`: Removed client-side retry, updated token validation flow.
    - `src/services/auth/SessionValidator.ts`: Implemented strict 500ms timeout.
- **Dependencies:** None.

## [DONE] user-types-refactor-002: Standardize User and Subscriber types

> **Goal:** Improve type safety across billing and user management.

- **Key Modules:**
    - `src/shared/types/*`: Central type definitions.
- **Impacted Files:**
    - `src/shared/types/User.ts`: Added `subscriptionStatus`.
    - `src/shared/types/Subscriber.ts`: New strict interface.
- **Dependencies:** `auth-fix-001` (to ensure auth service uses new types).

## [IN_PROGRESS] stripe-webhook-003: Implement Stripe Webhook Handler

> **Goal:** Enable real-time subscription status updates via Stripe webhooks.

- **Key Modules:**
    - `src/api/webhooks/*`: Endpoint handlers.
    - `src/services/billing/*`: Business logic.
- **Impacted Files:**
    - `src/api/webhooks/stripe.ts`: Main entry point for webhook events.
    - `src/services/billing/StripeService.ts`: (Planned) DB update logic.
- **Risk:** High (Financial data). verified signature secret.

## [TODO] ui-subscription-004: Add Subscription Management UI

> **Goal:** User-facing controls for managing plans.

- **Key Modules:**
    - `src/webview/components/billing/*`: React components.
- **Planned Files:**
    - `PlanCard.tsx`
    - `CancelSubscriptionModal.tsx`
- **Dependencies:** `stripe-webhook-003` (Backend must be ready).
