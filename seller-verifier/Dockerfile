# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json .npmrc ./
RUN --mount=type=secret,id=npm_token,required=true \
    NODE_AUTH_TOKEN="$(cat /run/secrets/npm_token)" npm install --omit=dev --ignore-scripts && \
    npm cache clean --force

COPY src ./src
USER node
EXPOSE 8787
CMD ["npm", "start"]
