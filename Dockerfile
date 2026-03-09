FROM node:20-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV HUSKY=0

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

FROM deps AS build

ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"

COPY nest-cli.json tsconfig.json tsconfig.build.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

RUN pnpm exec prisma generate
RUN pnpm run build

FROM base AS runtime

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

COPY package.json pnpm-lock.yaml prisma.config.ts ./
COPY prisma ./prisma
COPY docker/entrypoint.sh ./docker/entrypoint.sh
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

RUN chmod +x ./docker/entrypoint.sh

EXPOSE 3000

CMD ["./docker/entrypoint.sh"]
