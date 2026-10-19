FROM node:22-bookworm-slim
WORKDIR /srv
COPY services/resource-monitor/server.mjs ./
USER node
CMD ["node","server.mjs"]
