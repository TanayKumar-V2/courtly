# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@12.15.0 --activate

# Copy monorepo configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install all dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source files
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build shared package then api
RUN pnpm --filter @courtly/shared build && pnpm --filter @courtly/api build

# Stage 2: Production Runner
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV API_PORT=4000
ENV API_HOST=0.0.0.0

RUN corepack enable && corepack prepare pnpm@12.15.0 --activate

# Copy monorepo configuration for prod install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile || pnpm install --prod

# Copy built artifacts from builder stage
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/src ./packages/shared/src
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Security: run as non-root node user
USER node

EXPOSE 4000

CMD ["node", "apps/api/dist/main"]
