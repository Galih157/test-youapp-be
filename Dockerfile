# ── 1. Dependency installation layer ──────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── 2. Build layer ─────────────────────────────────────────────────
FROM deps AS build
COPY nest-cli.json ./
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# ── 3. Execution layer ─────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY --from=build /app/dist ./dist
RUN npm ci --omit=dev && npm cache clean --force \
  && addgroup -S appgroup && adduser -S appuser -G appgroup \
  && mkdir -p /app/uploads && chown -R appuser:appgroup /app
USER appuser
EXPOSE 3000
CMD ["node", "dist/main"]
