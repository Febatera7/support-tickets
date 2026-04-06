FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ─────────────────────────────────────────
FROM node:22-alpine AS base

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

USER appuser

# ─────────────────────────────────────────
FROM base AS api

EXPOSE 4000
CMD ["node", "dist/api.js"]

# ─────────────────────────────────────────
FROM base AS worker

CMD ["node", "dist/worker.js"]
