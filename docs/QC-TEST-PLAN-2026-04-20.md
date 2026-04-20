# QC Test Plan - xproject-homestay

Date: 2026-04-20  
Role: Software QC

## 1) Scope

- Frontend: React 19 + Vite (`frontend/`)
- Backend: Hono + Drizzle + PostgreSQL (`backend/`)
- Focus flows:
  - Public booking
  - Admin operations (bookings/customers/promos/revenue)
  - Auth + RBAC
  - Build/lint/test pipeline stability

## 2) Baseline Execution Result

Executed on 2026-04-20:

| Check | Command | Result |
|---|---|---|
| Backend unit tests | `cd backend && npm run test:run` | PASS (3 files, 53 tests) |
| Frontend unit tests | `cd frontend && npm run test:run` | PASS (1 file, 21 tests) |
| Backend build | `cd backend && npm run build` | PASS |
| Frontend build | `cd frontend && npm run build` | PASS |
| Frontend lint | `cd frontend && npm run lint` | FAIL (49 errors, 3 warnings) |

Current blocking quality gate:
- ESLint has 49 errors across hooks rules, purity rules, and unused vars.

UI smoke via Playwright (`frontend` dev server):

| Route | Result | Evidence |
|---|---|---|
| `/` | PASS (rendered) | `docs/qc-reports/qc-smoke-home-20260420.png` |
| `/admin/login` | PASS (rendered login form) | `docs/qc-reports/qc-smoke-admin-login-20260420.png` |
| `/dat-phong` | PASS with warning toast (`Không tải được lịch đặt phòng`) when backend is unavailable | `docs/qc-reports/qc-smoke-booking-20260420.png` |

## 3) Risk-Based Test Scenarios

### A. Authentication and Authorization

| ID | Priority | Scenario | Steps | Expected |
|---|---|---|---|---|
| AUTH-01 | P0 | Admin login success | Call `POST /api/v1/auth/login` with admin creds | `200`, returns `accessToken`, `refreshToken`, user role=`admin` |
| AUTH-02 | P0 | Wrong password | Login with wrong password | `401`/`400`, no token issued |
| AUTH-03 | P0 | Refresh token | Call `POST /auth/refresh` with valid refresh token | `200`, new access token |
| AUTH-04 | P0 | Unauthorized access | Call protected endpoint without token | `401` |
| AUTH-05 | P0 | RBAC restriction | Staff accesses admin-only route (`/revenue`, `/users`) | `403` |

### B. Booking Core Flow

| ID | Priority | Scenario | Steps | Expected |
|---|---|---|---|---|
| BOOK-01 | P0 | Create guest booking | `POST /bookings` with valid room/time/guest phone | `201`, booking created |
| BOOK-02 | P0 | Overlap same room/time | Create booking A then booking B overlapping same slot | booking B rejected (`409`) |
| BOOK-03 | P0 | Status transition valid | `pending -> confirmed -> checked-in -> checked-out` | `200`, transitions accepted |
| BOOK-04 | P0 | Status transition invalid | Try `checked-out -> pending` | `400`, blocked by transition matrix |
| BOOK-05 | P0 | Cancel booking | `DELETE /bookings/:id` as admin | Status becomes `cancelled` (soft delete) |
| BOOK-06 | P1 | Internal booking permissions | Staff creates booking with `category=internal` | `403` |
| BOOK-07 | P0 | Booking with voucher | Create booking with valid voucher | total price computed server-side, voucher usage increments |
| BOOK-08 | P1 | Cancel booking with voucher | Cancel booking created in BOOK-07 | voucher `usedCount` refunded by 1 |
| BOOK-09 | P0 | Overlap overnight (cross-midnight) | Booking 22:00-09:00 then booking 01:00-03:00 around same period | must reject overlap |

### C. Promo and Pricing

| ID | Priority | Scenario | Steps | Expected |
|---|---|---|---|---|
| PROMO-01 | P0 | Validate promo by room type | `POST /promos/validate` with valid code and room type | `{ valid: true }` |
| PROMO-02 | P0 | Expired promo | Validate expired code | `{ valid: false, error }` |
| PROMO-03 | P1 | Apply promo | `POST /promos/apply` with price | returns `discountAmount`, `finalTotal` |
| PROMO-04 | P1 | Promo usage limit | Use promo beyond max usage | rejected with validation error |
| PROMO-05 | P0 | Server-side price trust | Send manipulated `totalPrice` in booking payload | server ignores client total and recalculates |

### D. Customer and Documents

| ID | Priority | Scenario | Steps | Expected |
|---|---|---|---|---|
| CUS-01 | P1 | Auto-create customer by phone | Create guest booking with new phone | customer record auto-created |
| CUS-02 | P1 | Reuse existing customer | Create booking with known phone | existing customer linked |
| CUS-03 | P1 | Upload ID images | Upload valid CCCD/CMND image | stored and retrievable |
| CUS-04 | P2 | Invalid image upload | Upload unsupported format/oversize | clear error, no crash |

### E. Revenue and Dashboard

| ID | Priority | Scenario | Steps | Expected |
|---|---|---|---|---|
| REV-01 | P1 | Revenue summary | `GET /revenue/summary` with date range | totals and deltas returned |
| REV-02 | P1 | Daily revenue chart | `GET /revenue/daily` | ordered daily points |
| REV-03 | P1 | Top customers | `GET /revenue/top-customers` | sorted by spending |
| REV-04 | P1 | Occupancy endpoint | `GET /revenue/occupancy` | per-room occupancy percentages |

### F. Telegram Integration

| ID | Priority | Scenario | Steps | Expected |
|---|---|---|---|---|
| TELE-01 | P2 | Save Telegram config | Update bot token/chat id | config persisted |
| TELE-02 | P2 | Send test message | `POST /telegram/test` | success response + log entry |

### G. Frontend Smoke

| ID | Priority | Scenario | Steps | Expected |
|---|---|---|---|---|
| FE-01 | P0 | Public home route | Open `/` | page renders without runtime error |
| FE-02 | P0 | Booking page load | Open `/dat-phong` | booking UI loads |
| FE-03 | P0 | Admin login route | Open `/admin/login` | login form visible |
| FE-04 | P0 | Build integrity | `npm run build` | no TS compile errors |
| FE-05 | P1 | Lint gate | `npm run lint` | no blocking lint errors |

## 4) Current QC Conclusion

- Automated tests currently pass but only cover utility-level logic.
- Frontend quality gate is still red due to lint failures.
- Priority actions before release:
  1. Resolve high-impact lint issues (hooks misuse and purity violations).
  2. Add integration tests for booking overlap and promo usage/refund.
  3. Promote lint to PR gate after cleanup.

## 5) Suggested Coverage Targets

- Unit: >= 80% for pure utils + pricing/validation logic
- Integration: >= 60% for booking/promo/auth services
- E2E smoke: 5 critical journeys (public booking, admin login, booking status, promo apply, revenue dashboard)
