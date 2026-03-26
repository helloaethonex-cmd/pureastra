# BACKLOG

## How To Use

- Every item must have: `ID`, `Priority`, `Owner`, `Status`, `Due Date`, `Definition of Done`.
- Status values: `todo`, `in_progress`, `blocked`, `done`.
- Priority values: `P0`, `P1`, `P2`, `P3`.
- Update this file in every PR that starts/completes a backlog item.

## Priority Guide

- `P0`: Production risk or release blocker.
- `P1`: High-value, should be done soon.
- `P2`: Important improvement, not urgent.
- `P3`: Nice-to-have.

## Backlog Items

### [BL-0001] Auth Integration Test Suite

- Priority: P0
- Status: todo
- Owner: Aethonex
- Created: 2026-03-24
- Due Date: 2026-03-31
- Area: backend/auth
- Type: tech-debt
- Context: Auth flows were validated manually under time pressure.
- Risk if skipped: Silent regressions in session and recovery flows can reach production.
- Scope:
  - Add integration tests for sign-in, get-session, sign-out
  - Add integration tests for list-sessions, revoke-session, revoke-other-sessions
  - Add integration test proving password reset revokes old sessions
- Out of Scope:
  - Frontend E2E tests
  - OAuth provider tests
- Definition of Done:
  - Tests run with one command
  - Tests pass on clean test DB
  - Tests run in CI pipeline
- Validation:
  - `pnpm --filter backend test:integration` passes locally and in CI
- Dependencies:
  - Test database env setup
