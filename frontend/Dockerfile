# Stage 1: Build the frontend
FROM node:25-alpine AS build-stage

RUN npm install -g pnpm@10.30.3

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY frontend/package.json ./frontend/

# Install dependencies using cache
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY ./frontend ./frontend

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter frontend build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine

COPY --from=build-stage /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
