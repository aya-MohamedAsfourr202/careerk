#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required." >&2
  exit 1
fi

attempt=1
max_attempts="${DB_MIGRATE_MAX_ATTEMPTS:-10}"
retry_delay="${DB_MIGRATE_RETRY_DELAY:-5}"

until pnpm exec prisma migrate deploy; do
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "Prisma migrations failed after ${attempt} attempts." >&2
    exit 1
  fi

  echo "Prisma migrate deploy failed. Retrying in ${retry_delay}s (${attempt}/${max_attempts})..."
  attempt=$((attempt + 1))
  sleep "$retry_delay"
done

exec node dist/main
