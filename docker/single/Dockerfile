FROM node:22-bookworm-slim AS build
WORKDIR /work
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/storefront/package.json apps/storefront/package.json
RUN npm install --no-audit --no-fund
COPY apps/api apps/api
COPY apps/storefront apps/storefront
RUN npm run build -w @nexora/api && npm run build -w @nexora/storefront

FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends nginx gosu ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /work
ENV NODE_ENV=production DB_PATH=/data/nexora.db JWT_SECRET_FILE=/data/jwt-secret SUPPLIER_DB=/supplier-data/products.json DEMO_ACCOUNTS=YES PORT=3000
COPY --from=build /work/node_modules ./node_modules
COPY --from=build /work/apps/api/dist ./apps/api/dist
COPY --from=build /work/apps/api/package.json ./apps/api/package.json
COPY --from=build /work/apps/storefront/dist /usr/share/nginx/html
COPY database ./database
COPY services ./services
COPY docker/single/nginx.conf /etc/nginx/sites-available/default
COPY docker/single/start.sh /usr/local/bin/nexora-start
RUN chmod +x /usr/local/bin/nexora-start && mkdir -p /data /supplier-data && chown -R node:node /data /supplier-data
EXPOSE 8090 8091 8092
STOPSIGNAL SIGTERM
CMD ["/usr/local/bin/nexora-start"]
