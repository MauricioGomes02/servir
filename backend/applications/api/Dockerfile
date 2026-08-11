# syntax=docker/dockerfile:1

ARG NODE_IMAGE=node:24.13.0-alpine3.23

FROM ${NODE_IMAGE} AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY applications/api/package.json applications/api/package.json
COPY applications/outbox-relay/package.json applications/outbox-relay/package.json
COPY packages/application-foundation/package.json packages/application-foundation/package.json
COPY packages/integration-messaging/package.json packages/integration-messaging/package.json
COPY packages/node-observability/package.json packages/node-observability/package.json
RUN npm ci

FROM dependencies AS build
COPY . .
RUN npm run build \
    --workspace @servir/application-foundation \
    --workspace @servir/integration-messaging \
    --workspace @servir/node-observability \
    --workspace @servir/api

FROM ${NODE_IMAGE} AS production-dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY applications/api/package.json applications/api/package.json
COPY applications/outbox-relay/package.json applications/outbox-relay/package.json
COPY packages/application-foundation/package.json packages/application-foundation/package.json
COPY packages/integration-messaging/package.json packages/integration-messaging/package.json
COPY packages/node-observability/package.json packages/node-observability/package.json
RUN npm ci --omit=dev --ignore-scripts --workspace @servir/api

FROM ${NODE_IMAGE} AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=production-dependencies --chown=node:node /app/package.json ./package.json
COPY --from=production-dependencies --chown=node:node /app/applications ./applications
COPY --from=production-dependencies --chown=node:node /app/packages ./packages
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/applications/api/dist ./applications/api/dist
COPY --from=build --chown=node:node /app/packages/application-foundation/dist ./packages/application-foundation/dist
COPY --from=build --chown=node:node /app/packages/integration-messaging/dist ./packages/integration-messaging/dist
COPY --from=build --chown=node:node /app/packages/node-observability/dist ./packages/node-observability/dist
USER node
EXPOSE 3000
CMD ["node", "applications/api/dist/index.js"]
