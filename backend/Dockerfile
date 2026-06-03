# ============================================
# monitoring-be — NestJS
# Build context: backend/ subfolder dari repo
# ============================================

FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# ─── Runner ───────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache wget

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/dotenv ./node_modules/dotenv
COPY --from=builder /app/node_modules/ts-node ./node_modules/ts-node
COPY --from=builder /app/node_modules/typescript ./node_modules/typescript
COPY --from=builder /app/tsconfig.json ./tsconfig.json

RUN mkdir -p uploads

EXPOSE 3001

CMD ["sh", "-c", "echo DATABASE_URL=$DATABASE_URL > .env && npx prisma migrate deploy && node dist/src/main"]
