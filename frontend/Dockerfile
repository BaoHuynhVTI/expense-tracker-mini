FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite reads .env.production at build time; source is frontend/.env.docker on the server.
RUN if [ ! -f .env.docker ]; then \
      echo "ERROR: frontend/.env.docker is required for Docker build." >&2; \
      exit 1; \
    fi \
    && cp .env.docker .env.production \
    && npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
