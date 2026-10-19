FROM node:22-bookworm-slim
WORKDIR /srv
RUN mkdir -p /data && chown node:node /data
COPY services/supplier/server.mjs ./
USER node
CMD ["node","server.mjs"]
