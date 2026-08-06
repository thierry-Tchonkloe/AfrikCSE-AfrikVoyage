#!/bin/sh
set -e

echo "→ Applying database migrations (prisma migrate deploy)..."
npx prisma migrate deploy --early-access

echo "→ Starting server..."
exec node dist/server.js
