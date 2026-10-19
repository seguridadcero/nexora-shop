FROM node:22-bookworm-slim
WORKDIR /srv
COPY services/supplier/server.mjs .
USER node
CMD ["node","server.mjs"]
