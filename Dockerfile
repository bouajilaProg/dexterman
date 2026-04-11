FROM node:20-alpine AS base

WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

FROM deps AS dev
EXPOSE 3000
CMD ["pnpm", "run", "dev"]

FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
COPY data ./data
COPY public ./public
RUN pnpm run build

FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

FROM base AS runner
ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/data ./data

EXPOSE 3000
CMD ["node", "dist/index.js"]
