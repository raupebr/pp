# PP: versão do Node usada para gerar e servir o PP
ARG NODE_VERSION=22-alpine
FROM node:$NODE_VERSION AS base

# Setup pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable
RUN apk add --no-cache git

# Meta
LABEL Description="PP" Version="1.0.0"

RUN mkdir -p /var/www/pp
WORKDIR /var/www/pp

# Setup app
FROM base AS app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml /var/www/pp
RUN pnpm i --frozen-lockfile

COPY . /var/www/pp
RUN pnpm build

# Setup server
FROM base AS server

RUN pnpm i express@4

# Finalize
FROM base

COPY http_server.js /var/www/pp
COPY --from=server /var/www/pp/node_modules /var/www/pp/node_modules
COPY --from=app /var/www/pp/build /var/www/pp/build

EXPOSE 8080
CMD ["node", "http_server.js"]
