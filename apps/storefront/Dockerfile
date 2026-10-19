FROM node:22-bookworm-slim AS builder
WORKDIR /work
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/storefront/package.json apps/storefront/package.json
RUN npm install --no-audit --no-fund
COPY apps/storefront apps/storefront
RUN npm run build -w @nexora/storefront
FROM nginx:1.27-alpine
COPY --from=builder /work/apps/storefront/dist /usr/share/nginx/html
COPY apps/storefront/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
