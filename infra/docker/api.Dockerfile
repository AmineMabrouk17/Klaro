# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

FROM base AS deps
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages ./packages
COPY apps/backend/package.json apps/backend/
RUN pnpm install --frozen-lockfile --filter @klaro/backend...

FROM deps AS build
WORKDIR /repo
COPY apps/backend ./apps/backend
RUN pnpm --filter @klaro/backend build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/apps/backend/dist ./dist
COPY --from=build /repo/node_modules ./node_modules
COPY apps/backend/package.json ./package.json
EXPOSE 4000
USER node
CMD ["node", "dist/index.js"]
