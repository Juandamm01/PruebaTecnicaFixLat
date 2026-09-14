FROM oven/bun:1.3.13 AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/bun.lock ./bun.lock
COPY . .
RUN DATABASE_URL=postgresql://postgres:postgres@postgres:5432/prueba_tecnica_fixlat?schema=public node node_modules/prisma/build/index.js generate
RUN node node_modules/next/dist/bin/next build --webpack

FROM oven/bun:1.3.13 AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["/app/entrypoint.sh"]