# Courtly 🏟️⚡

> **Premium Android-First Sports Venue Booking & Community Player Matchmaker**

Courtly is a modern sports-tech platform connecting players, teams, and sports venues. The platform empowers users to discover nearby sports arenas, check live availability, book football turfs, badminton courts, cricket nets, tennis courts, basketball courts, and join community open games through the **Courtly Matchmaker**.

---

## 🏗️ Architecture Overview

Courtly is engineered as a clean, high-performance monorepo powered by **pnpm workspaces** and **Turborepo**:

```
courtly/
|-- apps/
|   |-- mobile/              # Native Android App (React Native 0.88, Expo SDK 58, Expo Router)
|   |-- api/                 # NestJS 12 REST API Backend (TypeScript, Helmet, Redis, Prisma 7, Neon PostgreSQL)
|-- packages/
|   |-- shared/              # Domain models, TypeScript interfaces, and shared sample datasets
|-- docker-compose.yml       # Container orchestration (NestJS API + Redis)
|-- pnpm-workspace.yaml      # Monorepo workspace configuration
|-- turbo.json               # Turbo build, typecheck, lint, and test pipeline
|-- .env.example             # Documented environment variables template
|-- README.md                # System documentation and developer guide
```

---

## 🔐 Phase 2: Complete Authentication & User Management

Phase 2 introduces a complete, production-grade authentication and player profile management system communicating with real Neon PostgreSQL database and Redis caching infrastructure.

### 1. Database Setup: Neon PostgreSQL & Prisma ORM 7

Courtly uses **Neon PostgreSQL** serverless database with **Prisma ORM 7** and driver adapters:

#### A. Creating a Free Neon PostgreSQL Database
1. Go to [https://neon.tech](https://neon.tech) and create a free account.
2. Click **Create Project**, choose a project name (e.g. `courtly-db`), and select your preferred AWS region.
3. Neon immediately generates two connection strings in the **Dashboard / Connection Details**:
   - **Pooled connection string (`DATABASE_URL`)**: Contains `-pooler` in the host. Used by the NestJS runtime for application queries:
     ```
     postgresql://neondb_owner:<password>@ep-example-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
     ```
   - **Direct connection string (`DIRECT_URL`)**: Direct database host without connection pooling. Required by the Prisma CLI for migrations:
     ```
     postgresql://neondb_owner:<password>@ep-example.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
     ```

#### B. Configuring Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` and `DIRECT_URL` are set with your Neon credentials.

#### C. Running Prisma Migrations & Client Generation
Prisma 7 uses `prisma.config.ts` to manage datasource URLs for migrations.
```bash
# Run migrations against Neon PostgreSQL
pnpm --filter @courtly/api exec prisma migrate dev --name init_auth

# Generate Prisma Client
pnpm --filter @courtly/api exec prisma generate
```

---

### 2. Backend Security & Authentication Architecture

- **Argon2id Password Hashing**: Implements OWASP recommended parameters (`memoryCost: 19456 KiB`, `timeCost: 2`, `parallelism: 1`). Passwords are never stored in plaintext and `passwordHash` is never exposed in API responses.
- **Short-Lived JWT Access Tokens**: 15-minute expiration, validates issuer (`courtly-api`) and audience (`courtly-app`).
- **Opaque Cryptographic Refresh Tokens**: 32-byte cryptographically secure random tokens. Stored in PostgreSQL solely as **SHA-256 hashes**.
- **Family Token Rotation & Reuse Detection**: Every refresh rotates the refresh token. If an already consumed refresh token is presented, the backend revokes the entire token family and terminates the session immediately.
- **Session Management**: Each device login receives an isolated `UserSession`. Users can log out of the current device (`POST /api/auth/logout`) or all devices (`POST /api/auth/logout-all`).
- **Role-Based Access Control (RBAC)**: Backend `@Roles(...)` and `RolesGuard` strictly enforce privileges (`PLAYER`, `VENUE_OWNER`, `ADMIN`). Newly registered users receive `PLAYER`. Elevation to `ADMIN` or `VENUE_OWNER` is impossible via public APIs.
- **Redis Rate Limiting**: Atomic Redis counters protect `/register`, `/login`, `/forgot-password`, `/resend-verification`, and `/reset-password` from abuse, returning HTTP 429 when limits are exceeded.
- **Email Service (Resend)**: Sends HTML emails with deep links (`courtly://verify-email?token=...`, `courtly://reset-password?token=...`). If `RESEND_API_KEY` is not set, a development mail logger logs links directly to the terminal.

---

### 3. API Endpoints Reference

#### Authentication (`/api/auth`)
| Method | Endpoint | Description | Rate Limit | Protection |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new player account | 5 req/min | Public |
| `POST` | `/api/auth/login` | Login with email and password | 10 req/min | Public |
| `POST` | `/api/auth/refresh` | Single-flight token rotation | - | Public |
| `POST` | `/api/auth/logout` | Revoke current device session | - | JWT Bearer |
| `POST` | `/api/auth/logout-all` | Revoke all sessions on all devices | - | JWT Bearer |
| `POST` | `/api/auth/verify-email` | Verify single-use email token | - | Public |
| `POST` | `/api/auth/resend-verification` | Request fresh verification link | 3 req/min | Public |
| `POST` | `/api/auth/forgot-password` | Request password reset email | 3 req/min | Public |
| `POST` | `/api/auth/reset-password` | Set new password with token | 5 req/min | Public |
| `POST` | `/api/auth/change-password` | Change password with current pass | - | JWT Bearer |
| `GET` | `/api/auth/me` | Current authenticated session details | - | JWT Bearer |

#### Users & Player Profile (`/api/users`)
| Method | Endpoint | Description | Protection |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/me` | Get complete player profile, roles, and skills | JWT Bearer |
| `PATCH` | `/api/users/me` | Update full name and phone number | JWT Bearer |
| `PATCH` | `/api/users/me/player-profile` | Update bio, location, sports, and skill levels | JWT Bearer |

---

### 4. Mobile Authentication Flow & Route Protection

- **Expo SecureStore**: Refresh tokens are stored strictly in hardware-backed device storage via `expo-secure-store`.
- **In-Memory JWT Access Tokens**: Access tokens reside exclusively in application memory and are never persisted to disk or AsyncStorage.
- **Single-Flight Refresh Interceptor**: When any authenticated API request encounters HTTP 401, `apiClient` pauses concurrent requests, executes one refresh, updates tokens, and replays the original request seamlessly.
- **Splash Screen Session Restoration**: During app startup, `SplashScreen.preventAutoHideAsync()` holds the splash screen while `authStorage.getRefreshToken()` validates the session. Prevents flickering of login screens for authenticated players.
- **Expo Router Navigation Structure**:
  - `/(auth)/`: Login, Register, Verify Email, Forgot Password, Reset Password.
  - `/(app)/`: Protected stack. Unauthenticated users are redirected to `/(auth)/login`.
  - `/(app)/(tabs)/`: Discover, Games, Bookings, Profile.
  - `/(app)/onboarding/`: 4-step wizard (Personal Details, Sports Selection, Skill Calibration, Summary).
  - `/(app)/profile/edit`: Edit name, location, bio, sports, and skill levels.
  - `/(app)/(tabs)/profile`: Real authenticated user profile, initials avatar, sports chips, skill level badges, change password modal, and confirmed logout.

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js 22.13+ (`node -v`)
- pnpm 12.15.0+ (`pnpm -v`)
- Docker & Docker Compose (for local Redis)

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL`, `DIRECT_URL`, and local IP for `EXPO_PUBLIC_API_URL` are set.

### Step 3: Run Database Migrations
```bash
pnpm --filter @courtly/api exec prisma migrate dev --name init_auth
```

### Step 4: Start the Services
Start Redis and NestJS API:
```bash
# Terminal 1: Start Redis
docker compose up redis -d

# Terminal 2: Start NestJS API
pnpm dev:api
```

Start the Expo Mobile Application:
```bash
# Terminal 3: Start Mobile App
pnpm dev:mobile
```

---

## 🧪 Testing Suite

Run all monorepo test suites:
```bash
# Run unit & component tests
pnpm test

# Run backend E2E integration tests (with live Neon DB)
pnpm --filter @courtly/api test:e2e

# Run TypeScript typechecks
pnpm typecheck

# Run ESLint
pnpm lint

# Run Expo Doctor
pnpm --filter @courtly/mobile doctor

# Test Android Bundle Export
pnpm --filter @courtly/mobile export:check
```

---

## 🏟️ Phase 3: Venue Management System

Phase 3 introduces the complete multi-venue management, owner onboarding, Cloudinary signed photograph upload, admin moderation, and public approved venue discovery system.

### 1. Database Seeding & Protected Admin Bootstrap

Run the idempotent seed script after migrations to populate the 12 predefined amenities (Parking, Changing rooms, Showers, Washrooms, Drinking water, Equipment rental, Floodlights, Seating area, First aid, Cafeteria, Wi-Fi, Air conditioning) and optionally bootstrap an initial `ADMIN` account:

```bash
# Apply migrations
pnpm --filter @courtly/api db:migrate

# Seed amenities (and optional admin account if ADMIN_BOOTSTRAP_EMAIL & ADMIN_BOOTSTRAP_PASSWORD are set)
pnpm --filter @courtly/api db:seed
```

> **Security Note:** There is intentionally **no** public HTTP endpoint to grant `ADMIN` permissions. Initial admins are provisioned strictly via the CLI seed command using preconfigured environment variables (`ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`, `ADMIN_BOOTSTRAP_NAME`).

### 2. Cloudinary Signed Direct Image Upload Flow

1. Mobile selects photos via `expo-image-picker` (JPEG/PNG/WebP, max 8 MB, max 10 photos per venue).
2. Mobile requests an owner/venue-scoped signature from `POST /api/owner/venues/:venueId/images/signature`. (`CLOUDINARY_API_SECRET` is never exposed to mobile.)
3. Mobile uploads directly to Cloudinary using the signed parameters with progress tracking and retry support.
4. Mobile registers the returned `publicId` via `POST /api/owner/venues/:venueId/images`.
5. NestJS verifies the uploaded asset directly against the Cloudinary Admin API (expected folder prefix `courtly/venues/<ownerId>/<venueId>/`, image resource type, allowed format, <= 8 MB, positive dimensions) before saving to PostgreSQL.

### 3. Phase 3 API Endpoints

#### Owner Applications
- `POST /api/owner-applications` — Submit venue owner application (verified `PLAYER`).
- `GET /api/owner-applications/me` — View application status, rejection feedback, and history.

#### Owner Venue, Court, Amenity & Image Management (`VENUE_OWNER`)
- `POST /api/owner/venues` — Create venue in `DRAFT` status.
- `GET /api/owner/venues` — List owned venues + real status summary metrics.
- `GET /api/owner/venues/:venueId` — Retrieve full owned venue with completion checklist.
- `PATCH /api/owner/venues/:venueId` — Update venue (major identity/location changes on `APPROVED` venues require re-review).
- `DELETE /api/owner/venues/:venueId` — Hard-delete unpublished drafts or safely archive published venues.
- `PATCH /api/owner/venues/:venueId/submit` — Submit complete listing for admin review (`PENDING_REVIEW`).
- `PATCH /api/owner/venues/:venueId/withdraw` — Withdraw `PENDING_REVIEW` back to `DRAFT` for editing.
- `POST|GET /api/owner/venues/:venueId/courts` & `GET|PATCH|DELETE /api/owner/venues/:venueId/courts/:courtId`
- `GET /api/amenities` & `PUT /api/owner/venues/:venueId/amenities`
- `POST /api/owner/venues/:venueId/images/signature`, `POST /api/owner/venues/:venueId/images`, `PATCH /api/owner/venues/:venueId/images/reorder`, `PATCH /api/owner/venues/:venueId/images/:imageId/cover`, `DELETE /api/owner/venues/:venueId/images/:imageId`

#### Admin Moderation (`ADMIN` + Audit Logged)
- `GET /api/admin/owner-applications`, `GET /api/admin/owner-applications/:id`, `PATCH /api/admin/owner-applications/:id/approve`, `PATCH /api/admin/owner-applications/:id/reject`
- `GET /api/admin/venues`, `GET /api/admin/venues/:venueId`, `PATCH /api/admin/venues/:venueId/approve`, `PATCH /api/admin/venues/:venueId/reject`, `PATCH /api/admin/venues/:venueId/pause`

#### Public Approved Venue Discovery
- `GET /api/venues` — Paginated approved venues with `city`, `sport`, `minPrice`, `maxPrice`, `amenities`, and `search` filters.
- `GET /api/venues/:venueId` — Public approved venue detail.
- `GET /api/venues/:venueId/courts` — Public active courts for an approved venue.

---

## 🗺️ Phase 4: Venue Discovery & Native Android MapLibre + OpenFreeMap

Phase 4 provides complete PostgreSQL-powered venue discovery with text search, sport/price/indoor/amenity filters, parameterized Haversine nearby search, Redis versioned caching, compact map markers, optional foreground GPS permissions (`expo-location`), native Android vector maps via **MapLibre React Native v11** (`@maplibre/maplibre-react-native`), **OpenFreeMap** hosted vector styles, and **OpenStreetMap** geographic data — with **zero Google Maps APIs, zero API keys, and zero Google Cloud billing**.

### 1. Map Provider & OpenFreeMap Configuration

All map styling and attribution is centralized in [map-config.ts](file:///c:/Tanay/Courtly/apps/mobile/src/services/maps/map-config.ts) and [map-provider.ts](file:///c:/Tanay/Courtly/apps/mobile/src/services/maps/map-provider.ts):
- **Primary style**: `https://tiles.openfreemap.org/styles/dark` (matches Courtly's `#0B1110` / `#151D1A` / `#C6F36B` dark theme).
- **Automatic fallback style**: `https://tiles.openfreemap.org/styles/liberty` if the primary style fails to load.
- **Custom override (optional)**: Set `EXPO_PUBLIC_MAP_STYLE_URL` in `.env` to point to another OpenStreetMap-derived vector style without editing UI components.
- **Attribution**: Persistent visible attribution (`© OpenStreetMap contributors • © OpenMapTiles • OpenFreeMap`) is always displayed on every map view.
- **Native Architecture**: `newArchEnabled: true` and `"@maplibre/maplibre-react-native"` are configured in [app.config.ts](file:///c:/Tanay/Courtly/apps/mobile/app.config.ts).

### 2. Building a Native Android Development Build (Required for MapLibre)

Because `@maplibre/maplibre-react-native` includes native Android rendering code, **Expo Go is not supported**. Build a fresh Android development client after installing or updating MapLibre:

```bash
# Option A: Local native Android build (requires Android SDK / ANDROID_HOME)
cd apps/mobile
npx expo prebuild --platform android --clean
npx expo run:android

# Option B: Cloud Android development build via EAS (no local Android SDK required)
cd apps/mobile
eas build --profile development --platform android
```

### 2. Phase 4 Discovery & Map API Reference

- **`GET /api/venues`**:
  - Query parameters: `q` (max 100 chars), `city`, `state`, `sport`, `amenityIds` (comma-separated, **AND semantics** — venue must match every selected amenity), `minPrice`, `maxPrice`, `indoor` (`true`/`false`), `latitude`, `longitude`, `radiusKm` (max `50` km), `sort` (`NEWEST`, `PRICE_LOW_TO_HIGH`, `PRICE_HIGH_TO_LOW`, `DISTANCE`), `page`, `pageSize` (max `50`).
  - Uses parameterized PostgreSQL Haversine distance (`6371 km` Earth radius) with bounding-box pre-filter, active-court price aggregation, and Redis versioned caching (`60s` TTL with automatic invalidation on venue/court/amenity/image mutations and graceful PostgreSQL fallback if Redis is down).
- **`GET /api/venues/map`**:
  - Compact map markers within `north`, `south`, `east`, `west` bounds (including antimeridian crossing support) plus all discovery filters. Returns max 100 markers + `hasMore`. Excludes unapproved venues and venues without coordinates.
- **`GET /api/venues/:venueId`**:
  - Public `APPROVED` venue detail with ordered photo gallery, active courts, active amenities, coordinates, formatted address, and public contact info only (never exposes private owner/admin fields).
- **`PATCH /api/owner/venues/:venueId/location`** (`VENUE_OWNER`):
  - Owner-only coordinate pin update with strict ownership and range validation.

---

## 📝 Project Boundaries (Phase 4)
The following features belong to subsequent phases and are intentionally excluded from Phase 4:
- Time-slot availability calendars, booking creation/cancellation, reservation locks, and Razorpay payments (Phase 5)
- Reviews, ratings, AI recommendations with Groq API, and open player matchmaking games (Phase 6)
- Real-time in-app chat & push notifications (Phase 7)
