FROM node:22-bookworm-slim
WORKDIR /srv
COPY services/internal-target/server.mjs ./
USER node
CMD ["node","server.mjs"]
