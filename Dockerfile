FROM node:22-bookworm-slim AS build

WORKDIR /app

# better-sqlite3 için Linux derleme araçları gerekir; son imaja taşınmazlar.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . ./
RUN npm run db:migrate && npm run db:seed && npm run build

FROM node:22-bookworm-slim AS production

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/data ./data

EXPOSE 3000

CMD ["npm", "run", "start"]
