#!/bin/sh
set -e

bunx prisma migrate deploy
bun run db:seed
exec bun run start