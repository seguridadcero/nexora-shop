FROM node:22-bookworm-slim AS builder
WORKDIR /work
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/storefront/package.json apps/storefront/package.json
RUN npm install --no-audit --no-fund
COPY apps/api apps/api
RUN npm run build -w @nexora/api
FROM node:22-bookworm-slim
WORKDIR /work
ENV NODE_ENV=production
COPY --from=builder /work/node_modules ./node_modules
COPY --from=builder /work/apps/api/dist ./apps/api/dist
COPY --from=builder /work/apps/api/package.json ./apps/api/package.json
COPY database ./database
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 3000
CMD ["node", "apps/api/dist/server.js"]
