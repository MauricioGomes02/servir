# syntax=docker/dockerfile:1

ARG NODE_IMAGE=node:24.18.0-alpine3.23

FROM ${NODE_IMAGE} AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY applications/web/package.json applications/web/package.json
COPY applications/bff/package.json applications/bff/package.json
RUN npm ci

FROM dependencies AS build
COPY . .
RUN npm run build --workspace @servir/web \
    && npm run build --workspace @servir/bff

FROM ${NODE_IMAGE} AS production-dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY applications/web/package.json applications/web/package.json
COPY applications/bff/package.json applications/bff/package.json
RUN npm ci --omit=dev --ignore-scripts --workspace @servir/bff

FROM ${NODE_IMAGE} AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=production-dependencies --chown=node:node /app/package.json ./package.json
COPY --from=production-dependencies --chown=node:node /app/applications ./applications
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/applications/bff/dist ./applications/bff/dist
COPY --from=build --chown=node:node /app/applications/web/dist ./applications/web/dist
USER node
EXPOSE 3001
CMD ["node", "applications/bff/dist/index.js"]
