# syntax=docker/dockerfile:1
#
# Image Docker du frontend — destinée au développement local (docker-compose)
# et à une éventuelle bascule future hors Vercel. Le déploiement en production
# continue de passer par le build natif Vercel, qui n'utilise pas ce fichier.

# ── Stage 1: dependencies ────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Variables NEXT_PUBLIC_* : injectées côté client, doivent donc être présentes
# AU BUILD (Next.js les remplace en dur dans le bundle JS).
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY=$NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY
ENV DOCKER_BUILD=1
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── Stage 3: runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY --from=build /app/public ./public
COPY --from=build /app/messages ./messages
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

RUN chown -R node:node /app
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider "http://localhost:${PORT:-3000}/" || exit 1

CMD ["node", "server.js"]
