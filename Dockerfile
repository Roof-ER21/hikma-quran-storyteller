# Build image that serves the prebuilt SPA with the custom Node server (no Caddy)
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Build static assets
COPY . .
RUN npm run build

# Minimal runtime image
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Only copy what we need to serve the app
COPY --from=build /app/dist ./dist
COPY server.cjs package*.json ./

EXPOSE 8080
CMD ["node", "server.cjs"]
