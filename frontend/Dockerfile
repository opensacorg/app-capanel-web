# Stage 1: Dependencies (Cached heavily)
FROM node:25-alpine AS deps
RUN npm install -g pnpm@10.30.3
WORKDIR /app

# Only copy files needed for install to protect the cache
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY frontend/package.json ./frontend/

# Use the pnpm store cache mount for faster re-installs
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:25-alpine AS builder
RUN npm install -g pnpm@10.30.3
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY frontend ./frontend

ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}
# Use production mode only for the static build step so the `builder` target
# can still run `vite dev` correctly in local docker-compose override.
RUN NODE_ENV=production pnpm --filter frontend build

# Stage 3: Runner (The tiny final image)
FROM nginx:stable-alpine-slim 

# Use alpine-slim to shave off another ~20MB
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Security: Run as non-root user (Best practice for Cloud Run)
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d
USER nginx

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
